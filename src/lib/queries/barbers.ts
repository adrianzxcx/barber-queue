import "server-only";

import type { BarberDTO, BarberShiftStatus } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

interface BarberRow {
  id: string;
  display_name: string;
  specialty: string;
  rank: string;
  image_url: string | null;
  image_position: string;
  rating: number;
}

interface ShiftRow {
  barber_id: string;
  status: BarberShiftStatus;
  current_ticket_id: string | null;
}

interface QueueCountRow {
  id: string;
  preferred_barber_id: string | null;
  assigned_barber_id: string | null;
  status: string;
  services: { duration_minutes: number } | { duration_minutes: number }[] | null;
}

interface CompletedTicketRow {
  assigned_barber_id: string | null;
}

export async function getBarberRoster() {
  const supabase = await createClient();
  const [barbersResult, shiftsResult, activeTicketsResult, completedResult, settingsResult] = await Promise.all([
    supabase
      .from("barbers")
      .select("id,display_name,specialty,rank,image_url,image_position,rating")
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
      .select("id, preferred_barber_id, assigned_barber_id, status, services:service_id(duration_minutes)")
      .in("status", ["waiting", "being_served"])
      .returns<QueueCountRow[]>(),
    supabase
      .from("queue_tickets")
      .select("assigned_barber_id")
      .eq("status", "completed")
      .gte("completed_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .returns<CompletedTicketRow[]>(),
    supabase
      .from("shop_settings")
      .select("shop_is_open")
      .eq("id", true)
      .maybeSingle<{ shop_is_open: boolean }>(),
  ]);

  if (barbersResult.error) throw new Error(`Failed to load barbers: ${barbersResult.error.message}`);
  if (shiftsResult.error) throw new Error(`Failed to load shifts: ${shiftsResult.error.message}`);
  if (activeTicketsResult.error) throw new Error(`Failed to load queue counts: ${activeTicketsResult.error.message}`);
  if (completedResult.error) throw new Error(`Failed to load barber sessions: ${completedResult.error.message}`);
  if (settingsResult.error) throw new Error(`Failed to load shop settings: ${settingsResult.error.message}`);

  const shopIsOpen = settingsResult.data?.shop_is_open ?? true;
  const shiftsByBarber = new Map(shiftsResult.data.map((shift) => [shift.barber_id, shift]));
  
  const waitingByBarber = new Map<string, number>();
  const servingByBarber = new Map<string, number>();
  const waitingMinutesByBarber = new Map<string, number>();
  const servingMinutesByBarber = new Map<string, number>();

  const getServiceMinutes = (ticket: QueueCountRow) => {
    const service = Array.isArray(ticket.services) ? ticket.services[0] : ticket.services;
    return Math.max(5, service?.duration_minutes ?? 30);
  };

  if (activeTicketsResult.data) {
    for (const ticket of activeTicketsResult.data) {
      if (ticket.status === "waiting" && ticket.preferred_barber_id) {
        waitingByBarber.set(ticket.preferred_barber_id, (waitingByBarber.get(ticket.preferred_barber_id) ?? 0) + 1);
        waitingMinutesByBarber.set(
          ticket.preferred_barber_id,
          (waitingMinutesByBarber.get(ticket.preferred_barber_id) ?? 0) + getServiceMinutes(ticket)
        );
      } else if (ticket.status === "being_served" && ticket.assigned_barber_id) {
        servingByBarber.set(ticket.assigned_barber_id, (servingByBarber.get(ticket.assigned_barber_id) ?? 0) + 1);
        servingMinutesByBarber.set(
          ticket.assigned_barber_id,
          (servingMinutesByBarber.get(ticket.assigned_barber_id) ?? 0) + getServiceMinutes(ticket)
        );
      }
    }
  }

  const completedByBarber = completedResult.data.reduce<Map<string, number>>((acc, row) => {
    if (!row.assigned_barber_id) return acc;
    acc.set(row.assigned_barber_id, (acc.get(row.assigned_barber_id) ?? 0) + 1);
    return acc;
  }, new Map());

  return barbersResult.data.map<BarberDTO>((barber) => {
    const shift = shiftsByBarber.get(barber.id);
    const hasCurrentServedTicket = Boolean(
      shift?.current_ticket_id &&
        activeTicketsResult.data.some(
          (ticket) => ticket.id === shift.current_ticket_id && ticket.status === "being_served"
        )
    );
    const status = !shopIsOpen || shift?.status === "unavailable"
      ? "unavailable"
      : hasCurrentServedTicket
        ? "busy"
        : shift?.status
          ? "available"
          : "unavailable";
    const waitingCount = waitingByBarber.get(barber.id) ?? 0;
    const servingCount = servingByBarber.get(barber.id) ?? 0;
    const customersInLine = waitingCount + servingCount;
    const estimatedWaitMinutes =
      status === "unavailable"
        ? 0
        : (waitingMinutesByBarber.get(barber.id) ?? 0) + (servingMinutesByBarber.get(barber.id) ?? 0);

    return {
      id: barber.id,
      name: barber.display_name,
      specialty: barber.specialty,
      rank: barber.rank,
      imageUrl: barber.image_url,
      imagePosition: barber.image_position,
      rating: Number(barber.rating),
      status,
      currentTicketId: shift?.current_ticket_id ?? null,
      customersInLine,
      estimatedWaitMinutes,
      sessionsToday: completedByBarber.get(barber.id) ?? 0,
    };
  });
}
