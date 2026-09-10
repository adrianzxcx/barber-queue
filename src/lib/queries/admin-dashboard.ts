import "server-only";

import type { QueueItem } from "@/app/admin/dashboard/dashboard/DashboardTab";
import type { Barber } from "@/components/admin/manage-roster-dialog";
import { formatWait } from "@/lib/backend/format";
import { requireReceptionist } from "@/lib/auth/session";
import { estimateTicketWait } from "@/lib/queries/queue-estimates";
import { getShopSettings } from "@/lib/queries/settings";
import { createClient } from "@/lib/supabase/server";

interface TicketRow {
  id: string;
  ticket_number: string;
  customer_name_snapshot: string;
  service_id: string | null;
  preferred_barber_id: string | null;
  assigned_barber_id: string | null;
  status: QueueItem["status"] | "completed" | "canceled";
  joined_at: string;
  skipped_at: string | null;
  services: { duration_minutes: number } | { duration_minutes: number }[] | null;
}

interface ServingTicketRow {
  id: string;
  ticket_number: string;
}

interface ServiceRow {
  id: string;
  name: string;
}

interface BarberRow {
  id: string;
  display_name: string | null;
  name?: string | null;
  specialty: string;
  rank: string;
  image_position: string;
}

interface ShiftRow {
  barber_id: string;
  status: Barber["status"];
  current_ticket_id: string | null;
}

function getBarberName(row: BarberRow | undefined | null) {
  return row?.display_name ?? row?.name ?? null;
}

export async function getAdminDashboardData() {
  await requireReceptionist();

  const supabase = await createClient();
  await supabase.rpc("expire_stale_skipped_tickets");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [ticketsResult, servicesResult, barbersResult, shiftsResult, servedResult, servingTicketsResult, settings] =
    await Promise.all([
      supabase
        .from("queue_tickets")
        .select(
          "id,ticket_number,customer_name_snapshot,service_id,preferred_barber_id,assigned_barber_id,status,joined_at,skipped_at,services:service_id(duration_minutes)"
        )
        .in("status", ["waiting", "being_served", "skipped", "expired"])
        .order("joined_at", { ascending: true })
        .returns<TicketRow[]>(),
      supabase.from("services").select("id,name").returns<ServiceRow[]>(),
      supabase
        .from("barbers")
        .select("id,display_name,name,specialty,rank,image_position")
        .eq("is_active", true)
        .order("display_name", { ascending: true })
        .returns<BarberRow[]>(),
      supabase
        .from("barber_shifts")
        .select("barber_id,status,current_ticket_id")
        .is("ended_at", null)
        .returns<ShiftRow[]>(),
      supabase
        .from("queue_tickets")
        .select("assigned_barber_id")
        .eq("status", "completed")
        .gte("completed_at", startOfDay.toISOString())
        .returns<{ assigned_barber_id: string | null }[]>(),
      supabase
        .from("queue_tickets")
        .select("id,ticket_number")
        .eq("status", "being_served")
        .returns<ServingTicketRow[]>(),
      getShopSettings(),
    ]);

  if (ticketsResult.error) throw new Error(`Failed to load queue: ${ticketsResult.error.message}`);
  if (servicesResult.error) throw new Error(`Failed to load services: ${servicesResult.error.message}`);
  if (barbersResult.error) throw new Error(`Failed to load barbers: ${barbersResult.error.message}`);
  if (shiftsResult.error) throw new Error(`Failed to load shifts: ${shiftsResult.error.message}`);
  if (servedResult.error) throw new Error(`Failed to load served count: ${servedResult.error.message}`);
  if (servingTicketsResult.error) throw new Error(`Failed to load active served tickets: ${servingTicketsResult.error.message}`);

  const servicesById = new Map(servicesResult.data.map((service) => [service.id, service]));
  const barbersById = new Map(barbersResult.data.map((barber) => [barber.id, barber]));
  const servingTicketsById = new Map(servingTicketsResult.data.map((ticket) => [ticket.id, ticket]));
  const shiftsByBarberId = new Map(shiftsResult.data.map((shift) => [shift.barber_id, shift]));

  const completedCountByBarber = new Map<string, number>();
  if (servedResult.data) {
    for (const ticket of servedResult.data) {
      if (ticket.assigned_barber_id) {
        completedCountByBarber.set(
          ticket.assigned_barber_id,
          (completedCountByBarber.get(ticket.assigned_barber_id) ?? 0) + 1
        );
      }
    }
  }

  const queue = await Promise.all(
    ticketsResult.data.map<Promise<QueueItem>>(async (ticket) => {
      const estimate = await estimateTicketWait(supabase, ticket);

      return {
        id: ticket.ticket_number,
        ticketId: ticket.id,
        customer: ticket.customer_name_snapshot,
        service: ticket.service_id ? servicesById.get(ticket.service_id)?.name ?? "Service" : "Service",
        status: ticket.status as QueueItem["status"],
        preferredBarber: getBarberName(ticket.preferred_barber_id ? barbersById.get(ticket.preferred_barber_id) : null),
        barberServedBy: getBarberName(ticket.assigned_barber_id ? barbersById.get(ticket.assigned_barber_id) : null),
        wait: formatWait(estimate.estimatedWaitMinutes),
        waitMinutes: estimate.estimatedWaitMinutes,
        skippedAt: ticket.skipped_at ? new Date(ticket.skipped_at).getTime() : null,
        joinedAt: new Date(ticket.joined_at).getTime(),
      };
    })
  );

  const barbers = barbersResult.data.map<Barber>((barber) => {
    const shift = shiftsByBarberId.get(barber.id);
    const currentTicket = shift?.current_ticket_id ? servingTicketsById.get(shift.current_ticket_id) : null;
    const status = !settings.shopIsOpen || shift?.status === "unavailable"
      ? "unavailable"
      : currentTicket
        ? "busy"
        : shift?.status
          ? "available"
          : "unavailable";

    return {
      name: getBarberName(barber) ?? "Barber",
      specialty: barber.specialty,
      rank: barber.rank,
      status,
      sessions: completedCountByBarber.get(barber.id) ?? 0,
      currentServing: currentTicket?.ticket_number ?? null,
      imagePosition: barber.image_position,
    };
  });

  return {
    queue,
    barbers,
    servedToday: servedResult.data?.length ?? 0,
    settings: {
      shopIsOpen: settings.shopIsOpen,
      skipExpiryDuration: settings.skipExpirySeconds / 60,
      skipExpirySeconds: settings.skipExpirySeconds,
      soundEnabled: settings.soundEnabled,
    },
  };
}
