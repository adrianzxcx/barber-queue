import "server-only";

import type { Barber } from "@/components/admin/manage-roster-dialog";
import { formatDuration, formatPrice } from "@/lib/backend/format";
import type { ActivityLogDTO, ServiceCategory } from "@/lib/db/types";
import { requireReceptionist } from "@/lib/auth/session";
import { getShopSettings } from "@/lib/queries/settings";
import { createClient } from "@/lib/supabase/server";

export interface AdminServiceDTO {
  id: string;
  name: string;
  price: string;
  priceCents: number;
  duration: string;
  durationMinutes: number;
  description: string;
  category: ServiceCategory;
  isActive: boolean;
}

export interface AdminBarberDTO extends Barber {
  id: string;
}

interface ServiceRow {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
}

interface BarberRow {
  id: string;
  display_name: string | null;
  name?: string | null;
  specialty: string;
  rank: string;
  image_position: string;
  is_active: boolean;
}

interface ShiftRow {
  barber_id: string;
  status: Barber["status"];
  current_ticket_id: string | null;
}

interface TicketRow {
  id: string;
  ticket_number: string;
  status: "being_served";
}

interface LogRow {
  id: string;
  created_at: string;
  event_type: ActivityLogDTO["type"];
  entity_type: string;
  message: string;
  metadata: Record<string, unknown>;
}

function displayBarberName(row: BarberRow) {
  return row.display_name ?? row.name ?? "Barber";
}

function formatLogEvent(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractLogName(log: LogRow) {
  const metadataName = log.metadata.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName;

  const ticketMatch = log.message.match(/\(([^)]+)\)/);
  if (ticketMatch?.[1]) return ticketMatch[1];

  const barberMatch = log.message.match(/^Barber\s+(.+?)\s+(?:called|shift|logged|is|was)/i);
  if (barberMatch?.[1]) return barberMatch[1];

  const serviceMatch = log.message.match(/Service\s+(?:updated:\s+)?(.+?)(?:\s+is|\.)/i);
  if (serviceMatch?.[1]) return serviceMatch[1];

  return log.event_type === "system" ? "System" : "Unknown";
}

function stringMetadata(log: LogRow, key: string) {
  const value = log.metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export async function getAdminServices() {
  await requireReceptionist();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id,name,description,category,price_cents,duration_minutes,is_active")
    .order("name", { ascending: true })
    .returns<ServiceRow[]>();

  if (error) throw new Error(`Failed to load admin services: ${error.message}`);

  return data.map<AdminServiceDTO>((service) => ({
    id: service.id,
    name: service.name,
    price: formatPrice(service.price_cents),
    priceCents: service.price_cents,
    duration: formatDuration(service.duration_minutes),
    durationMinutes: service.duration_minutes,
    description: service.description,
    category: service.category,
    isActive: service.is_active,
  }));
}

export async function getAdminBarbers() {
  await requireReceptionist();
  const supabase = await createClient();
  const [barbersResult, shiftsResult, ticketsResult, completedResult] = await Promise.all([
    supabase
      .from("barbers")
      .select("id,display_name,name,specialty,rank,image_position,is_active")
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
      .select("id,ticket_number,status")
      .eq("status", "being_served")
      .returns<TicketRow[]>(),
    supabase
      .from("queue_tickets")
      .select("assigned_barber_id")
      .eq("status", "completed")
      .gte("completed_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .returns<{ assigned_barber_id: string | null }[]>(),
  ]);

  if (barbersResult.error) throw new Error(`Failed to load barbers: ${barbersResult.error.message}`);
  if (shiftsResult.error) throw new Error(`Failed to load barber shifts: ${shiftsResult.error.message}`);
  if (ticketsResult.error) throw new Error(`Failed to load tickets: ${ticketsResult.error.message}`);
  if (completedResult.error) throw new Error(`Failed to load completed tickets: ${completedResult.error.message}`);

  const shiftsByBarber = new Map(shiftsResult.data.map((shift) => [shift.barber_id, shift]));
  const ticketsById = new Map(ticketsResult.data.map((ticket) => [ticket.id, ticket]));
  const completedByBarber = completedResult.data.reduce<Map<string, number>>((acc, row) => {
    if (!row.assigned_barber_id) return acc;
    acc.set(row.assigned_barber_id, (acc.get(row.assigned_barber_id) ?? 0) + 1);
    return acc;
  }, new Map());

  return barbersResult.data.map<AdminBarberDTO>((barber) => {
    const shift = shiftsByBarber.get(barber.id);
    const currentTicket = shift?.current_ticket_id ? ticketsById.get(shift.current_ticket_id) : null;
    const status =
      shift?.status === "unavailable"
        ? "unavailable"
        : currentTicket
          ? "busy"
          : shift?.status
            ? "available"
            : "unavailable";

    return {
      id: barber.id,
      name: displayBarberName(barber),
      specialty: barber.specialty,
      rank: barber.rank,
      status,
      sessions: completedByBarber.get(barber.id) ?? 0,
      currentServing: currentTicket?.ticket_number ?? null,
      imagePosition: barber.image_position,
    };
  });
}

export async function getAdminSettings() {
  await requireReceptionist();
  return getShopSettings();
}

export async function getAdminLogs() {
  await requireReceptionist();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,created_at,event_type,entity_type,message,metadata")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<LogRow[]>();

  if (error) throw new Error(`Failed to load logs: ${error.message}`);

  return data.map<ActivityLogDTO>((log) => {
    const createdAt = new Date(log.created_at);

    return {
      id: log.id,
      name: extractLogName(log),
      timestamp: createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      date: createdAt.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      type: log.event_type,
      event: formatLogEvent(log.entity_type),
      action: stringMetadata(log, "action") ?? formatLogEvent(log.entity_type),
      details: stringMetadata(log, "details") ?? log.message,
      message: log.message,
    };
  });
}
