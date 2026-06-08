"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendPasswordReset(email: string) {
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    console.error("Password reset error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
