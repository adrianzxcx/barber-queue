export type ServiceCategory = "Haircut" | "Beard" | "Shave" | "Treatment" | "Combo";

export type BarberShiftStatus = "available" | "busy" | "unavailable";

export type QueueTicketStatus =
  | "waiting"
  | "being_served"
  | "skipped"
  | "expired"
  | "completed"
  | "canceled";

export interface ServiceDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ServiceCategory;
  priceCents: number;
  price: string;
  durationMinutes: number;
  duration: string;
  isActive: boolean;
  features: string[];
}

export interface BarberDTO {
  id: string;
  name: string;
  specialty: string;
  rank: string;
  imageUrl: string | null;
  imagePosition: string;
  rating: number;
  status: BarberShiftStatus;
  currentTicketId: string | null;
  customersInLine: number;
  estimatedWaitMinutes: number;
  sessionsToday: number;
}

export interface QueueTicketDTO {
  id: string;
  ticketNumber: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  preferredBarberId: string | null;
  preferredBarberName: string | null;
  assignedBarberId: string | null;
  assignedBarberName: string | null;
  status: QueueTicketStatus;
  joinedAt: string;
  skippedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  peopleAhead: number;
  estimatedWaitMinutes: number;
}

export interface ShopSettingsDTO {
  shopIsOpen: boolean;
  skipExpirySeconds: number;
  soundEnabled: boolean;
}

export interface ActiveTicketSummaryDTO {
  ticket: string;
  ticketId: string;
  peopleAhead: number;
  estimatedWait: string;
  progress: number;
  service: string;
  barber: string;
  status: QueueTicketStatus;
}

export interface TicketHistoryItemDTO {
  ticket: string;
  ticketId: string;
  date: string;
  barber: string;
  service: string;
  status: "completed" | "canceled" | "expired";
}

export interface ActivityLogDTO {
  id: string;
  name: string;
  timestamp: string;
  date: string;
  type: "barber" | "customer" | "system";
  event: string;
  action: string;
  details: string;
  message: string;
}
