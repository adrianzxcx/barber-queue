"use server";

import { createClient } from "@/lib/supabase/server";

export async function resendConfirmation(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
