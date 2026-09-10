"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { formatPrice } from "@/lib/backend/format";
import { requireReceptionist } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface AdminMutationState {
  ok: boolean;
  message: string;
}

const idSchema = z.string().trim().min(1);

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  category: z.enum(["Haircut", "Beard", "Shave", "Treatment", "Combo"]),
  priceCents: z.coerce.number().int().min(0),
  durationMinutes: z.coerce.number().int().min(1).max(480),
});

const barberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  specialty: z.string().trim().max(120).default("General Barber"),
  rank: z.string().trim().max(40).default("Junior"),
});

const settingsSchema = z.object({
  shopIsOpen: z.boolean(),
  skipExpirySeconds: z.coerce.number().int().min(10).max(86400),
  soundEnabled: z.boolean(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resultError(error: unknown): AdminMutationState {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Unable to save changes.",
  };
}

async function logAdminActivity(
  message: string,
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
    entity_type: "admin",
    entity_id: null,
    message,
    metadata,
  });

  if (error) throw new Error(`Activity log was not recorded: ${error.message}`);
}

function revalidateAdminManagement() {
  revalidatePath("/admin/services");
  revalidatePath("/admin/profiles");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/logs");
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/dashboard");
  revalidatePath("/user/services");
  revalidatePath("/user/barbers");
}

export async function createService(input: z.input<typeof serviceSchema>): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const service = serviceSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase.from("services").insert({
      name: service.name.toUpperCase(),
      slug: slugify(service.name),
      description: service.description || "No description provided.",
      category: service.category,
      price_cents: service.priceCents,
      duration_minutes: service.durationMinutes,
      is_active: true,
    });

    if (error) throw new Error(error.message);
    await logAdminActivity(`New service added: ${service.name.toUpperCase()} (${formatPrice(service.priceCents)}).`, "system", {
      name: service.name.toUpperCase(),
      action: "Service Created",
      details: `${service.category} - ${formatPrice(service.priceCents)} - ${service.durationMinutes} mins`,
    });
    revalidateAdminManagement();
    return { ok: true, message: "Service created." };
  } catch (error) {
    return resultError(error);
  }
}

export async function updateService(
  serviceId: string,
  input: z.input<typeof serviceSchema>
): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const id = idSchema.parse(serviceId);
    const service = serviceSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from("services")
      .update({
        name: service.name.toUpperCase(),
        slug: slugify(service.name),
        description: service.description || "No description provided.",
        category: service.category,
        price_cents: service.priceCents,
        duration_minutes: service.durationMinutes,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminActivity(`Service updated: ${service.name.toUpperCase()}.`, "system", {
      name: service.name.toUpperCase(),
      action: "Service Updated",
      details: `${service.category} - ${formatPrice(service.priceCents)} - ${service.durationMinutes} mins`,
    });
    revalidateAdminManagement();
    return { ok: true, message: "Service updated." };
  } catch (error) {
    return resultError(error);
  }
}

export async function toggleServiceActive(serviceId: string, nextActive: boolean): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const id = idSchema.parse(serviceId);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("services")
      .update({ is_active: nextActive })
      .eq("id", id)
      .select("name")
      .single<{ name: string }>();

    if (error) throw new Error(error.message);
    await logAdminActivity(`Service ${data.name} is now ${nextActive ? "ACTIVE" : "INACTIVE"}.`, "system", {
      name: data.name,
      action: nextActive ? "Service Activated" : "Service Disabled",
      details: `Service status changed to ${nextActive ? "active" : "inactive"}.`,
    });
    revalidateAdminManagement();
    return { ok: true, message: `Service ${nextActive ? "activated" : "deactivated"}.` };
  } catch (error) {
    return resultError(error);
  }
}

export async function deleteService(serviceId: string): Promise<AdminMutationState> {
  return toggleServiceActive(serviceId, false);
}

export async function createBarber(input: z.input<typeof barberSchema>): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const barber = barberSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("barbers")
      .insert({
        display_name: barber.name,
        name: barber.name,
        specialty: barber.specialty || "General Barber",
        rank: barber.rank || "Junior",
        is_active: true,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) throw new Error(error.message);

    await supabase.from("barber_shifts").insert({
      barber_id: data.id,
      status: "unavailable",
      started_at: null,
      ended_at: null,
    });

    await logAdminActivity(`New barber profile registered: ${barber.name}.`, "barber", {
      name: barber.name,
      action: "Barber Created",
      details: `${barber.rank || "Junior"} - ${barber.specialty || "General Barber"}`,
    });
    revalidateAdminManagement();
    return { ok: true, message: "Barber created." };
  } catch (error) {
    return resultError(error);
  }
}

export async function updateBarber(
  barberId: string,
  input: z.input<typeof barberSchema>
): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const id = idSchema.parse(barberId);
    const barber = barberSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from("barbers")
      .update({
        display_name: barber.name,
        name: barber.name,
        specialty: barber.specialty || "General Barber",
        rank: barber.rank || "Junior",
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminActivity(`Barber profile updated: ${barber.name}.`, "barber", {
      name: barber.name,
      action: "Barber Updated",
      details: `${barber.rank || "Junior"} - ${barber.specialty || "General Barber"}`,
    });
    revalidateAdminManagement();
    return { ok: true, message: "Barber updated." };
  } catch (error) {
    return resultError(error);
  }
}

export async function toggleBarberShift(barberId: string, nextActive: boolean): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const id = idSchema.parse(barberId);
    const supabase = await createClient();

    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .select("display_name,name")
      .eq("id", id)
      .maybeSingle<{ display_name: string | null; name: string | null }>();

    if (barberError) throw new Error(barberError.message);
    const displayName = barber?.display_name ?? barber?.name ?? "Barber";

    const { data: shift, error: shiftError } = await supabase
      .from("barber_shifts")
      .select("id")
      .eq("barber_id", id)
      .is("ended_at", null)
      .maybeSingle<{ id: string }>();

    if (shiftError) throw new Error(shiftError.message);

    if (shift) {
      const { error } = await supabase
        .from("barber_shifts")
        .update({
          status: nextActive ? "available" : "unavailable",
          started_at: nextActive ? new Date().toISOString() : null,
          current_ticket_id: null,
        })
        .eq("id", shift.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("barber_shifts").insert({
        barber_id: id,
        status: nextActive ? "available" : "unavailable",
        started_at: nextActive ? new Date().toISOString() : null,
      });
      if (error) throw new Error(error.message);
    }

    await logAdminActivity(`Barber ${displayName} ${nextActive ? "logged in" : "logged out"}.`, "barber", {
      name: displayName,
      action: nextActive ? "Started Shift" : "Ended Shift",
      details: `Barber status changed to ${nextActive ? "available" : "unavailable"}.`,
    });
    revalidateAdminManagement();
    return { ok: true, message: `Barber ${nextActive ? "logged in" : "logged out"}.` };
  } catch (error) {
    return resultError(error);
  }
}

export async function deactivateBarber(barberId: string): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const id = idSchema.parse(barberId);
    const supabase = await createClient();

    const { error } = await supabase.from("barbers").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message);

    await supabase
      .from("barber_shifts")
      .update({ status: "unavailable", current_ticket_id: null })
      .eq("barber_id", id)
      .is("ended_at", null);

    await logAdminActivity("Barber profile deactivated.", "barber", {
      name: "Barber",
      action: "Barber Deactivated",
      details: "Barber was removed from the active roster.",
      barber_id: id,
    });
    revalidateAdminManagement();
    return { ok: true, message: "Barber removed from active roster." };
  } catch (error) {
    return resultError(error);
  }
}

export async function updateShopSettings(input: z.input<typeof settingsSchema>): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const settings = settingsSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from("shop_settings")
      .update({
        shop_is_open: settings.shopIsOpen,
        skip_expiry_seconds: settings.skipExpirySeconds,
        sound_enabled: settings.soundEnabled,
      })
      .eq("id", true);

    if (error) throw new Error(error.message);
    await logAdminActivity(`Shop settings updated. Store is ${settings.shopIsOpen ? "OPEN" : "CLOSED"}.`, "system", {
      name: "Shop Settings",
      action: "Settings Updated",
      details: `Store ${settings.shopIsOpen ? "open" : "closed"} - skip expiry ${settings.skipExpirySeconds}s - sound ${settings.soundEnabled ? "on" : "off"}`,
    });
    revalidateAdminManagement();
    return { ok: true, message: "Settings saved." };
  } catch (error) {
    return resultError(error);
  }
}

export async function clearActivityLogs(): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const supabase = await createClient();

    const { error } = await supabase.from("activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);

    await logAdminActivity("Activity logs cleared by administrator.", "system", {
      name: "Activity Logs",
      action: "Logs Cleared",
      details: "Activity log history was cleared by an administrator.",
    });
    revalidateAdminManagement();
    return { ok: true, message: "Activity logs cleared." };
  } catch (error) {
    return resultError(error);
  }
}

export async function updateBarberShiftStatus(
  barberId: string,
  status: "available" | "unavailable"
): Promise<AdminMutationState> {
  try {
    await requireReceptionist();
    const id = idSchema.parse(barberId);
    const supabase = await createClient();

    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .select("display_name,name")
      .eq("id", id)
      .maybeSingle<{ display_name: string | null; name: string | null }>();

    if (barberError) throw new Error(barberError.message);
    const displayName = barber?.display_name ?? barber?.name ?? "Barber";

    const { data: shift, error: shiftError } = await supabase
      .from("barber_shifts")
      .select("id")
      .eq("barber_id", id)
      .is("ended_at", null)
      .maybeSingle<{ id: string }>();

    if (shiftError) throw new Error(shiftError.message);

    const updatePayload: {
      status: "available" | "unavailable";
      started_at: string | null;
      current_ticket_id: null;
    } = {
      status,
      started_at: status !== "unavailable" ? new Date().toISOString() : null,
      current_ticket_id: null,
    };

    if (shift) {
      const { error } = await supabase
        .from("barber_shifts")
        .update(updatePayload)
        .eq("id", shift.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("barber_shifts").insert({
        barber_id: id,
        ...updatePayload,
      });
      if (error) throw new Error(error.message);
    }

    await logAdminActivity(`Barber ${displayName} shift status updated to ${status.toUpperCase()}.`, "barber", {
      name: displayName,
      action: "Shift Status Changed",
      details: `Status changed to ${status.toUpperCase()}.`,
    });
    revalidateAdminManagement();
    return { ok: true, message: `Barber ${displayName} is now ${status.toUpperCase()}.` };
  } catch (error) {
    return resultError(error);
  }
}
