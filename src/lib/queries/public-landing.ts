import "server-only";

import { formatDuration, formatPrice } from "@/lib/backend/format";
import type { ServiceCategory } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export interface LandingServiceDTO {
  id: string;
  num: string;
  name: string;
  icon: string;
  description: string;
  price: string;
  duration: string;
}

export interface LandingStateDTO {
  shopIsOpen: boolean;
  currentDate: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  services: LandingServiceDTO[];
}

interface ServiceRow {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price_cents: number;
  duration_minutes: number;
}

function iconForCategory(category: ServiceCategory) {
  switch (category) {
    case "Shave":
      return "spa";
    case "Beard":
      return "face";
    case "Treatment":
      return "water_drop";
    case "Combo":
      return "diamond";
    case "Haircut":
    default:
      return "content_cut";
  }
}

export async function getPublicLandingState(): Promise<LandingStateDTO> {
  const supabase = await createClient();
  const [settingsResult, queueResult, servicesResult] = await Promise.all([
    supabase
      .from("shop_settings")
      .select("shop_is_open")
      .eq("id", true)
      .maybeSingle<{ shop_is_open: boolean }>(),
    supabase.rpc("public_queue_summary"),
    supabase
      .from("services")
      .select("id,name,description,category,price_cents,duration_minutes")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(3)
      .returns<ServiceRow[]>(),
  ]);

  if (settingsResult.error) throw new Error(`Failed to load shop status: ${settingsResult.error.message}`);
  if (queueResult.error) throw new Error(`Failed to load queue summary: ${queueResult.error.message}`);
  if (servicesResult.error) throw new Error(`Failed to load landing services: ${servicesResult.error.message}`);

  const queueSummary = (queueResult.data ?? {}) as {
    waiting_count?: number;
    estimated_wait_minutes?: number;
  };

  return {
    shopIsOpen: settingsResult.data?.shop_is_open ?? true,
    currentDate: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    waitingCount: Number(queueSummary.waiting_count ?? 0),
    estimatedWaitMinutes: Number(queueSummary.estimated_wait_minutes ?? 0),
    services: servicesResult.data.map((service, index) => ({
      id: service.id,
      num: String(index + 1).padStart(2, "0"),
      name: service.name,
      icon: iconForCategory(service.category),
      description: `${service.description} ${formatPrice(service.price_cents)} - ${formatDuration(service.duration_minutes)}.`,
      price: formatPrice(service.price_cents),
      duration: formatDuration(service.duration_minutes),
    })),
  };
}
