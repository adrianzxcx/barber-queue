import "server-only";

import { formatDuration, formatPrice } from "@/lib/backend/format";
import type { ServiceDTO } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

interface ServiceRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ServiceDTO["category"];
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
  features: string[] | null;
}

function toServiceDTO(row: ServiceRow): ServiceDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    priceCents: row.price_cents,
    price: formatPrice(row.price_cents),
    durationMinutes: row.duration_minutes,
    duration: formatDuration(row.duration_minutes),
    isActive: row.is_active,
    features: row.features ?? [],
  };
}

export async function getActiveServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id,name,slug,description,category,price_cents,duration_minutes,is_active,features")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<ServiceRow[]>();

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return data.map(toServiceDTO);
}

export async function getServiceById(serviceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id,name,slug,description,category,price_cents,duration_minutes,is_active,features")
    .eq("id", serviceId)
    .maybeSingle<ServiceRow>();

  if (error) {
    throw new Error(`Failed to load service: ${error.message}`);
  }

  return data ? toServiceDTO(data) : null;
}
