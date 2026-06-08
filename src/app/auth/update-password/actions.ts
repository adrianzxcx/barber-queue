"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Optionally sign out the user after updating the password
  // so they have to log in again with the new credentials.
  await supabase.auth.signOut();

  return { success: true };
}
