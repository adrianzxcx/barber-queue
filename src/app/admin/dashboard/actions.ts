"use server";

import { revalidatePath } from "next/cache";

import { requireReceptionist } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ticketIdSchema } from "@/lib/validation/queue";

interface AdminActionState {
  ok: boolean;
  message: string;
}

const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function actionError(error: unknown): AdminActionState {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Unable to complete action.",
  };
}

async function logAdminEvent(
  message: string,
  entityId: string | null,
  eventType: "barber" | "customer" | "system" = "system",
  metadata: Record<string, unknown> = {}
) {
  const user = await requireReceptionist();
  const supabase = await createClient();

  const { error } = await supabase.from("activity_logs").insert({
    actor_id: user.id,
    actor_role: user.role,
    type: eventType,
    event_type: eventType,
    entity_type: entityId ? "queue_ticket" : "system",
    entity_id: entityId && uuidPattern.test(entityId) ? entityId : null,
    message,
    metadata,
  });

  if (error) throw new Error(`Activity log was not recorded: ${error.message}`);
}

function revalidateAdminQueue() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/logs");
  revalidatePath("/user/dashboard");
  revalidatePath("/user/my-queue");
  revalidatePath("/user/barbers");
}

async function findBarberByName(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barbers")
    .select("id,display_name,name")
    .or(`display_name.eq.${name},name.eq.${name}`)
    .maybeSingle<{ id: string; display_name: string | null; name: string | null }>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Barber ${name} was not found.`);
  return data;
}

async function getTicket(ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("queue_tickets")
    .select("id,ticket_number,customer_name_snapshot,status,preferred_barber_id")
    .eq("id", ticketId)
    .maybeSingle<{
      id: string;
      ticket_number: string;
      customer_name_snapshot: string;
      status: string;
      preferred_barber_id: string | null;
    }>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Queue ticket not found.");
  return data;
}

export async function skipTicket(ticketId: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const id = ticketIdSchema.parse(ticketId);
    const ticket = await getTicket(id);
    const supabase = await createClient();

    if (ticket.status !== "waiting") {
      return { ok: false, message: "Only waiting tickets can be skipped." };
    }

    const { error } = await supabase
      .from("queue_tickets")
      .update({ status: "skipped", skipped_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminEvent(`Ticket #${ticket.ticket_number} (${ticket.customer_name_snapshot}) was skipped.`, id, "customer", {
      name: ticket.customer_name_snapshot,
      action: "Skipped Ticket",
      details: `Ticket #${ticket.ticket_number} was skipped by reception.`,
    });
    revalidateAdminQueue();
    return { ok: true, message: `Ticket #${ticket.ticket_number} skipped.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function restoreTicket(ticketId: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const id = ticketIdSchema.parse(ticketId);
    const ticket = await getTicket(id);
    const supabase = await createClient();

    if (!["skipped", "expired"].includes(ticket.status)) {
      return { ok: false, message: "Only skipped or expired tickets can be restored." };
    }

    const { error } = await supabase
      .from("queue_tickets")
      .update({
        status: "waiting",
        skipped_at: null,
        expired_at: null,
        joined_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminEvent(`Ticket #${ticket.ticket_number} (${ticket.customer_name_snapshot}) was restored to the queue.`, id, "customer", {
      name: ticket.customer_name_snapshot,
      action: "Restored Ticket",
      details: `Ticket #${ticket.ticket_number} was restored to waiting.`,
    });
    revalidateAdminQueue();
    return { ok: true, message: `Ticket #${ticket.ticket_number} restored.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function expireTicket(ticketId: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const id = ticketIdSchema.parse(ticketId);
    const ticket = await getTicket(id);
    const supabase = await createClient();

    const { error } = await supabase
      .from("queue_tickets")
      .update({ status: "expired", skipped_at: null, expired_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminEvent(`Ticket #${ticket.ticket_number} (${ticket.customer_name_snapshot}) was expired.`, id, "customer", {
      name: ticket.customer_name_snapshot,
      action: "Expired Ticket",
      details: `Ticket #${ticket.ticket_number} expired from the queue.`,
    });
    revalidateAdminQueue();
    return { ok: true, message: `Ticket #${ticket.ticket_number} expired.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function clearExpiredTickets(): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const supabase = await createClient();
    const { error } = await supabase
      .from("queue_tickets")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("status", "expired");

    if (error) throw new Error(error.message);
    await logAdminEvent("All expired tickets were cleared from the dashboard.", null, "customer", {
      name: "Expired Tickets",
      action: "Cleared Expired Tickets",
      details: "All expired tickets were marked canceled.",
    });
    revalidateAdminQueue();
    return { ok: true, message: "Expired tickets cleared." };
  } catch (error) {
    return actionError(error);
  }
}

export async function clearExpiredTicket(ticketId: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const id = ticketIdSchema.parse(ticketId);
    const ticket = await getTicket(id);
    const supabase = await createClient();

    if (ticket.status !== "expired") {
      return { ok: false, message: "Only expired tickets can be cleared." };
    }

    const { error } = await supabase
      .from("queue_tickets")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminEvent(`Expired Ticket #${ticket.ticket_number} (${ticket.customer_name_snapshot}) was cleared.`, id, "customer", {
      name: ticket.customer_name_snapshot,
      action: "Cleared Expired Ticket",
      details: `Expired Ticket #${ticket.ticket_number} was marked canceled.`,
    });
    revalidateAdminQueue();
    return { ok: true, message: `Expired Ticket #${ticket.ticket_number} cleared.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function callTicket(ticketId: string, barberName: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const id = ticketIdSchema.parse(ticketId);
    const [ticket, barber] = await Promise.all([getTicket(id), findBarberByName(barberName)]);
    const supabase = await createClient();

    if (!["waiting", "skipped"].includes(ticket.status)) {
      return { ok: false, message: "Only waiting or skipped tickets can be called." };
    }

    const now = new Date().toISOString();
    const { error: ticketError } = await supabase
      .from("queue_tickets")
      .update({
        status: "being_served",
        assigned_barber_id: barber.id,
        called_at: now,
        skipped_at: null,
      })
      .eq("id", id);

    if (ticketError) throw new Error(ticketError.message);

    await supabase
      .from("barber_shifts")
      .update({
        status: "busy",
        current_ticket_id: id,
      })
      .eq("barber_id", barber.id)
      .is("ended_at", null);

    await logAdminEvent(
      `Barber ${barber.display_name ?? barber.name} called Ticket #${ticket.ticket_number} (${ticket.customer_name_snapshot}) to chair.`,
      id,
      "barber",
      {
        name: barber.display_name ?? barber.name ?? "Barber",
        action: "Called Customer",
        details: `Ticket #${ticket.ticket_number} - ${ticket.customer_name_snapshot}`,
        barber_id: barber.id,
      }
    );

    revalidateAdminQueue();
    return { ok: true, message: `Ticket #${ticket.ticket_number} called.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function callNextForBarber(barberName: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const barber = await findBarberByName(barberName);
    const supabase = await createClient();

    const { data: nextTicket, error: nextTicketError } = await supabase
      .from("queue_tickets")
      .select("id")
      .eq("status", "waiting")
      .or(`preferred_barber_id.is.null,preferred_barber_id.eq.${barber.id}`)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (nextTicketError) throw new Error(nextTicketError.message);

    if (!nextTicket?.id) {
      return { ok: false, message: `No waiting customers for ${barber.display_name ?? barber.name}.` };
    }

    return callTicket(nextTicket.id, barber.display_name ?? barber.name ?? barberName);
  } catch (error) {
    return actionError(error);
  }
}

export async function completeTicket(ticketId: string): Promise<AdminActionState> {
  try {
    await requireReceptionist();
    const id = ticketIdSchema.parse(ticketId);
    const ticket = await getTicket(id);
    const supabase = await createClient();

    if (ticket.status !== "being_served") {
      return { ok: false, message: "Only tickets currently being served can be completed." };
    }

    const now = new Date().toISOString();
    // 1. Update queue ticket
    const { error: ticketError } = await supabase
      .from("queue_tickets")
      .update({
        status: "completed",
        completed_at: now,
      })
      .eq("id", id);

    if (ticketError) throw new Error(ticketError.message);

    // 2. Update barber shift
    const { error: shiftError } = await supabase
      .from("barber_shifts")
      .update({
        status: "available",
        current_ticket_id: null,
      })
      .eq("current_ticket_id", id)
      .is("ended_at", null);

    if (shiftError) throw new Error(shiftError.message);

    await logAdminEvent(
      `Ticket #${ticket.ticket_number} (${ticket.customer_name_snapshot}) service was completed.`,
      id,
      "barber",
      {
        name: ticket.customer_name_snapshot,
        action: "Completed Service",
        details: `Ticket #${ticket.ticket_number} service was completed.`,
      }
    );

    revalidateAdminQueue();
    return { ok: true, message: `Ticket #${ticket.ticket_number} completed.` };
  } catch (error) {
    return actionError(error);
  }
}
