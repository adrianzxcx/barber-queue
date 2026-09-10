import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { QueueTicketStatus } from "@/lib/db/types";

const DEFAULT_SERVICE_MINUTES = 30;

interface EstimateTicketInput {
  id: string;
  joined_at: string;
  preferred_barber_id: string | null;
  assigned_barber_id: string | null;
  status: QueueTicketStatus;
  services: { duration_minutes: number } | { duration_minutes: number }[] | null;
}

interface EstimateTicketRow extends EstimateTicketInput {
  service_id: string;
}

interface ShiftRow {
  barber_id: string;
  status: "available" | "busy";
}

export interface QueueEstimate {
  peopleAhead: number;
  estimatedWaitMinutes: number;
}

function serviceMinutes(ticket: Pick<EstimateTicketInput, "services">) {
  const service = Array.isArray(ticket.services) ? ticket.services[0] : ticket.services;
  const minutes = service?.duration_minutes ?? DEFAULT_SERVICE_MINUTES;
  return Math.max(5, minutes);
}

function sumServiceMinutes(tickets: Pick<EstimateTicketInput, "services">[]) {
  return tickets.reduce((total, ticket) => total + serviceMinutes(ticket), 0);
}

async function loadEstimateState(supabase: SupabaseClient) {
  const [shiftsResult, ticketsResult] = await Promise.all([
    supabase
      .from("barber_shifts")
      .select("barber_id,status")
      .is("ended_at", null)
      .in("status", ["available", "busy"])
      .returns<ShiftRow[]>(),
    supabase
      .from("queue_tickets")
      .select(`
        id,
        service_id,
        preferred_barber_id,
        assigned_barber_id,
        status,
        joined_at,
        services:service_id(duration_minutes)
      `)
      .in("status", ["waiting", "being_served"])
      .order("joined_at", { ascending: true })
      .returns<EstimateTicketRow[]>(),
  ]);

  if (shiftsResult.error) {
    throw new Error(`Failed to load barber availability for wait estimate: ${shiftsResult.error.message}`);
  }

  if (ticketsResult.error) {
    throw new Error(`Failed to load queue for wait estimate: ${ticketsResult.error.message}`);
  }

  return {
    activeBarberIds: shiftsResult.data.map((shift) => shift.barber_id),
    activeTickets: ticketsResult.data,
  };
}

function estimateWaitingTicket(
  target: EstimateTicketInput,
  activeBarberIds: string[],
  activeTickets: EstimateTicketRow[]
): QueueEstimate {
  if (activeBarberIds.length === 0) {
    const waitingTickets = activeTickets.filter((ticket) => ticket.status === "waiting");
    const peopleAhead = Math.max(0, waitingTickets.findIndex((ticket) => ticket.id === target.id));

    return {
      peopleAhead,
      estimatedWaitMinutes: sumServiceMinutes(waitingTickets.slice(0, peopleAhead)),
    };
  }

  const workloads = activeBarberIds.map((barberId) => {
    const currentService = activeTickets.filter((ticket) => {
      return ticket.status === "being_served" && ticket.assigned_barber_id === barberId;
    });

    return sumServiceMinutes(currentService);
  });

  const scheduledAheadIds = new Set<string>();
  const waitingTickets = activeTickets.filter((ticket) => ticket.status === "waiting");

  for (const ticket of waitingTickets) {
    const eligibleBarberIndexes = ticket.preferred_barber_id
      ? [activeBarberIds.indexOf(ticket.preferred_barber_id)].filter((index) => index >= 0)
      : activeBarberIds.map((_, index) => index);

    if (eligibleBarberIndexes.length === 0) {
      if (ticket.id === target.id) {
        return {
          peopleAhead: scheduledAheadIds.size,
          estimatedWaitMinutes: sumServiceMinutes([...scheduledAheadIds].map((id) => {
            return waitingTickets.find((waitingTicket) => waitingTicket.id === id)!;
          })),
        };
      }
      scheduledAheadIds.add(ticket.id);
      continue;
    }

    const nextBarberIndex = eligibleBarberIndexes.reduce((bestIndex, index) => {
      return workloads[index] < workloads[bestIndex] ? index : bestIndex;
    }, eligibleBarberIndexes[0]);

    if (ticket.id === target.id) {
      return {
        peopleAhead: scheduledAheadIds.size,
        estimatedWaitMinutes: workloads[nextBarberIndex],
      };
    }

    scheduledAheadIds.add(ticket.id);
    workloads[nextBarberIndex] += serviceMinutes(ticket);
  }

  return {
    peopleAhead: Math.max(0, waitingTickets.findIndex((ticket) => ticket.id === target.id)),
    estimatedWaitMinutes: 0,
  };
}

export async function estimateTicketWait(
  supabase: SupabaseClient,
  ticket: EstimateTicketInput
): Promise<QueueEstimate> {
  if (ticket.status === "being_served") {
    return { peopleAhead: 0, estimatedWaitMinutes: 0 };
  }

  if (ticket.status !== "waiting") {
    return { peopleAhead: 0, estimatedWaitMinutes: 0 };
  }

  const { activeBarberIds, activeTickets } = await loadEstimateState(supabase);

  return estimateWaitingTicket(ticket, activeBarberIds, activeTickets);
}

export async function estimateNewGeneralQueueWait(
  supabase: SupabaseClient,
  serviceDurationMinutes = DEFAULT_SERVICE_MINUTES
): Promise<QueueEstimate> {
  const { activeBarberIds, activeTickets } = await loadEstimateState(supabase);
  const target: EstimateTicketRow = {
    id: "__new_general_queue_customer__",
    service_id: "__default_service__",
    preferred_barber_id: null,
    assigned_barber_id: null,
    status: "waiting",
    joined_at: new Date().toISOString(),
    services: { duration_minutes: serviceDurationMinutes },
  };

  return estimateWaitingTicket(target, activeBarberIds, [...activeTickets, target]);
}
