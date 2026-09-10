"use server";

import { revalidatePath } from "next/cache";

import { getDisplayName, requireUser } from "@/lib/auth/session";
import { getHaircutRecommendations } from "@/lib/ai/recommendations";
import { getActiveServices } from "@/lib/queries/services";
import { getShopSettings } from "@/lib/queries/settings";
import { createClient } from "@/lib/supabase/server";
import {
  haircutRecommendationInputSchema,
  type HaircutRecommendationInput,
  type HaircutRecommendationResult,
} from "@/lib/validation/ai";
import { joinQueueSchema, ticketIdSchema, type JoinQueueInput } from "@/lib/validation/queue";

export interface QueueActionState {
  ok: boolean;
  message: string;
}

export interface HaircutRecommendationActionState {
  ok: boolean;
  message: string;
  result?: HaircutRecommendationResult;
}

const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function toActionError(error: unknown): QueueActionState {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
  };
}

export async function joinQueue(input: JoinQueueInput): Promise<QueueActionState> {
  try {
    const user = await requireUser();
    const customerName = getDisplayName(user);
    const parsed = joinQueueSchema.parse(input);
    const settings = await getShopSettings();

    if (!settings.shopIsOpen) {
      return { ok: false, message: "The shop is currently closed for new queue entries." };
    }

    const supabase = await createClient();

    const { count: activeCount, error: activeError } = await supabase
      .from("queue_tickets")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", user.id)
      .in("status", ["waiting", "being_served", "skipped"]);

    if (activeError) throw new Error(activeError.message);
    if ((activeCount ?? 0) > 0) {
      return { ok: false, message: "You already have an active queue ticket." };
    }

    let serviceId = parsed.serviceId;
    let serviceName = "Haircut"; // fallback

    if (!serviceId) {
      const { data: defaultService, error: defaultServiceError } = await supabase
        .from("services")
        .select("id,name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultServiceError) throw new Error(defaultServiceError.message);
      if (!defaultService) {
        return { ok: false, message: "No active grooming services found in the system." };
      }
      serviceId = defaultService.id;
      serviceName = defaultService.name;
    } else {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("id,name,is_active")
        .eq("id", serviceId)
        .maybeSingle<{ id: string; name: string; is_active: boolean }>();

      if (serviceError) throw new Error(serviceError.message);
      if (!service?.is_active) {
        return { ok: false, message: "Please choose an active service before joining the queue." };
      }
      serviceName = service.name;
    }

    let preferredBarberName: string | null = null;
    if (parsed.preferredBarberId) {
      const { data: barber, error: barberError } = await supabase
        .from("barbers")
        .select("id,display_name,is_active")
        .eq("id", parsed.preferredBarberId)
        .maybeSingle<{ id: string; display_name: string; is_active: boolean }>();

      if (barberError) throw new Error(barberError.message);
      if (!barber?.is_active) {
        return { ok: false, message: "That barber is not currently available for queue selection." };
      }
      preferredBarberName = barber.display_name;
    }

    const { data: ticketNumber, error: numberError } = await supabase.rpc("next_ticket_number");
    if (numberError) throw new Error(numberError.message);

    const { data: ticket, error: insertError } = await supabase
      .from("queue_tickets")
      .insert({
        ticket_number: ticketNumber ?? "001",
        customer_id: user.id,
        customer_name_snapshot: customerName,
        service_id: serviceId,
        preferred_barber_id: parsed.preferredBarberId ?? null,
        created_by: user.id,
      })
      .select("id,ticket_number")
      .single<{ id: string; ticket_number: string }>();

    if (insertError) throw new Error(insertError.message);

    const { error: logError } = await supabase.from("activity_logs").insert({
      actor_id: user.id,
      actor_role: user.role,
      type: "customer",
      event_type: "customer",
      entity_type: "queue_ticket",
      entity_id: uuidPattern.test(ticket.id) ? ticket.id : null,
      message: `Ticket #${ticket.ticket_number} joined ${preferredBarberName ? `Dedicated Queue for ${preferredBarberName}` : "General Queue"}.`,
      metadata: {
        name: customerName,
        action: "Joined Queue",
        details: `Ticket #${ticket.ticket_number} - ${serviceName} - ${preferredBarberName ? `Specific queue for ${preferredBarberName}` : "General queue"}`,
        service_id: serviceId,
        service_name: serviceName,
        preferred_barber_id: parsed.preferredBarberId ?? null,
      },
    });

    if (logError) throw new Error(`Activity log was not recorded: ${logError.message}`);

    revalidatePath("/user/dashboard");
    revalidatePath("/user/my-queue");
    revalidatePath("/admin/dashboard");

    return { ok: true, message: `Joined queue successfully. Ticket #${ticket.ticket_number} is active.` };
  } catch (error) {
    return toActionError(error);
  }
}

export async function recommendHaircutStyles(
  input: HaircutRecommendationInput
): Promise<HaircutRecommendationActionState> {
  try {
    const user = await requireUser();
    const customerName = getDisplayName(user);
    const parsed = haircutRecommendationInputSchema.parse(input);
    const services = await getActiveServices();

    if (services.length === 0) {
      return { ok: false, message: "No active services are available for recommendations yet." };
    }

    const result = await getHaircutRecommendations(parsed, services);
    const supabase = await createClient();

    const { error: logError } = await supabase.from("activity_logs").insert({
      actor_id: user.id,
      actor_role: user.role,
      type: "customer",
      event_type: "customer",
      entity_type: "ai_recommendation",
      entity_id: null,
      message: `${customerName} requested haircut style recommendations.`,
      metadata: {
        name: customerName,
        action: "Requested Style Recommendation",
        details: parsed.notes
          ? `Photo-based recommendation. Notes: ${parsed.notes.slice(0, 120)}`
          : "Photo-based recommendation.",
      },
    });

    if (logError) throw new Error(`Activity log was not recorded: ${logError.message}`);

    return {
      ok: true,
      message: "Recommendations generated.",
      result,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not generate recommendations.",
    };
  }
}

export async function cancelMyTicket(ticketId: string): Promise<QueueActionState> {
  try {
    const user = await requireUser();
    const parsedTicketId = ticketIdSchema.parse(ticketId);
    const supabase = await createClient();

    const { data: ticket, error: ticketError } = await supabase
      .from("queue_tickets")
      .select("id,ticket_number,status,customer_name_snapshot")
      .eq("id", parsedTicketId)
      .eq("customer_id", user.id)
      .maybeSingle<{ id: string; ticket_number: string; status: string; customer_name_snapshot: string }>();

    if (ticketError) throw new Error(ticketError.message);
    if (!ticket) {
      return { ok: false, message: "Queue ticket not found." };
    }

    if (!["waiting", "skipped"].includes(ticket.status)) {
      return { ok: false, message: "Only waiting or skipped tickets can be canceled from the customer view." };
    }

    const { error: updateError } = await supabase
      .from("queue_tickets")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .eq("customer_id", user.id);

    if (updateError) throw new Error(updateError.message);

    const { error: logError } = await supabase.from("activity_logs").insert({
      actor_id: user.id,
      actor_role: user.role,
      type: "customer",
      event_type: "customer",
      entity_type: "queue_ticket",
      entity_id: uuidPattern.test(ticket.id) ? ticket.id : null,
      message: `Ticket #${ticket.ticket_number} was canceled by the customer.`,
      metadata: {
        name: ticket.customer_name_snapshot,
        action: "Canceled Ticket",
        details: `Ticket #${ticket.ticket_number} was canceled by the customer.`,
      },
    });

    if (logError) throw new Error(`Activity log was not recorded: ${logError.message}`);

    revalidatePath("/user/dashboard");
    revalidatePath("/user/my-queue");
    revalidatePath("/admin/dashboard");

    return { ok: true, message: "Your queue spot has been canceled." };
  } catch (error) {
    return toActionError(error);
  }
}
