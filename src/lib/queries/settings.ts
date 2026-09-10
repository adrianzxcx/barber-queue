import "server-only";

import type { ShopSettingsDTO } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

interface ShopSettingsRow {
  shop_is_open: boolean;
  skip_expiry_seconds: number;
  sound_enabled: boolean;
}

export async function getShopSettings(): Promise<ShopSettingsDTO> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_settings")
    .select("shop_is_open,skip_expiry_seconds,sound_enabled")
    .eq("id", true)
    .maybeSingle<ShopSettingsRow>();

  if (error) {
    throw new Error(`Failed to load shop settings: ${error.message}`);
  }

  return {
    shopIsOpen: data?.shop_is_open ?? true,
    skipExpirySeconds: data?.skip_expiry_seconds ?? 1800,
    soundEnabled: data?.sound_enabled ?? true,
  };
}
