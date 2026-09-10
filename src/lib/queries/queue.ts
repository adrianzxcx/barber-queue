import "server-only";

import {
  clampProgressFromQueuePosition,
  formatWait,
} from "@/lib/backend/format";
import type {
  ActiveTicketSummaryDTO,
  QueueTicketDTO,
  QueueTicketStatus,
  TicketHistoryItemDTO,
} from "@/lib/db/types";
import { requireUser } from "@/lib/auth/session";
import { estimateTicketWait } from "@/lib/queries/queue-estimates";
import { createClient } from "@/lib/supabase/server";

interface TicketRow {
  id: string;
  ticket_number: string;
  customer_name_snapshot: string;
  service_id: string;
  preferred_barber_id: string | null;
  assigned_barber_id: string | null;
  status: QueueTicketStatus;
  joined_at: string;
  skipped_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  services: { name: string; duration_minutes: number } | null;
  preferred_barber: { display_name: string } | null;
  assigned_barber: { display_name: string } | null;
}

async function toTicketDTO(row: TicketRow): Promise<QueueTicketDTO> {
  const supabase = await createClient();
  const { peopleAhead, estimatedWaitMinutes } = await estimateTicketWait(supabase, row);

  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    customerName: row.customer_name_snapshot,
    serviceId: row.service_id,
    serviceName: row.services?.name ?? "Service",
    preferredBarberId: row.preferred_barber_id,
    preferredBarberName: row.preferred_barber?.display_name ?? null,
    assignedBarberId: row.assigned_barber_id,
    assignedBarberName: row.assigned_barber?.display_name ?? null,
    status: row.status,
    joinedAt: row.joined_at,
    skippedAt: row.skipped_at,
    completedAt: row.completed_at,
    canceledAt: row.canceled_at,
    peopleAhead,
    estimatedWaitMinutes,
  };
}

function toActiveTicketSummary(ticket: QueueTicketDTO): ActiveTicketSummaryDTO {
  const barber = ticket.assignedBarberName ?? ticket.preferredBarberName ?? "Any Available";

  return {
    ticket: `#${ticket.ticketNumber}`,
    ticketId: ticket.id,
    peopleAhead: ticket.peopleAhead,
    estimatedWait: formatWait(ticket.estimatedWaitMinutes),
    progress: clampProgressFromQueuePosition(ticket.peopleAhead),
    service: ticket.serviceName,
    barber,
    status: ticket.status,
  };
}

export async function getCurrentCustomerTicket() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("queue_tickets")
    .select(`
      id,
      ticket_number,
      customer_name_snapshot,
      service_id,
      preferred_barber_id,
      assigned_barber_id,
      status,
      joined_at,
      skipped_at,
      completed_at,
      canceled_at,
      services:service_id(name,duration_minutes),
      preferred_barber:preferred_barber_id(display_name),
      assigned_barber:assigned_barber_id(display_name)
    `)
    .eq("customer_id", user.id)
    .in("status", ["waiting", "being_served", "skipped"])
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle<TicketRow>();

  if (error) {
    throw new Error(`Failed to load active ticket: ${error.message}`);
  }

  return data ? toActiveTicketSummary(await toTicketDTO(data)) : null;
}

export async function getCustomerTicketHistory() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("queue_tickets")
    .select(`
      id,
      ticket_number,
      customer_name_snapshot,
      service_id,
      preferred_barber_id,
      assigned_barber_id,
      status,
      joined_at,
      skipped_at,
      completed_at,
      canceled_at,
      services:service_id(name,duration_minutes),
      preferred_barber:preferred_barber_id(display_name),
      assigned_barber:assigned_barber_id(display_name)
    `)
    .eq("customer_id", user.id)
    .in("status", ["completed", "canceled", "expired"])
    .order("joined_at", { ascending: false })
    .limit(30)
    .returns<TicketRow[]>();

  if (error) {
    throw new Error(`Failed to load ticket history: ${error.message}`);
  }

  return data.map<TicketHistoryItemDTO>((ticket) => ({
    ticket: `#${ticket.ticket_number}`,
    ticketId: ticket.id,
    date: new Date(ticket.completed_at ?? ticket.canceled_at ?? ticket.joined_at).toISOString().split("T")[0],
    barber: ticket.assigned_barber?.display_name ?? ticket.preferred_barber?.display_name ?? "Any Available",
    service: ticket.services?.name ?? "Service",
    status: ticket.status as TicketHistoryItemDTO["status"],
  }));
}

export async function getActiveQueueTickets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("queue_tickets")
    .select("id, ticket_number, customer_name_snapshot, preferred_barber_id, assigned_barber_id, status")
    .in("status", ["waiting", "being_served"])
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load active queue tickets: ${error.message}`);
  }

  return data.map((t) => ({
    id: t.id,
    ticketNumber: t.ticket_number,
    customerName: t.customer_name_snapshot,
    preferredBarberId: t.preferred_barber_id,
    assignedBarberId: t.assigned_barber_id,
    status: t.status,
  }));
}
