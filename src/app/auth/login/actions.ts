"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getRoleDashboard, getRoleFromAccessToken } from "@/lib/auth/roles";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  remainingAttempts,
} from "@/lib/rate-limit";

/** Extract a best-effort client IP from Next.js request headers. */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export async function login(input: { email: string; password: string }) {
  const email = input.email.trim();
  const password = input.password;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const ip = await getClientIp();

  // ── Rate-limit gate ──────────────────────────────────────────────────────
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    const minutes = Math.ceil(rateCheck.retryAfterSeconds / 60);
    return {
      success: false,
      error: `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      rateLimited: true,
    };
  }
  // ────────────────────────────────────────────────────────────────────────

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Record failure and compute remaining attempts
    const record = recordFailedAttempt(ip);
    const remaining = remainingAttempts(ip);

    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { success: false, error: "email_not_confirmed", email };
    }

    // Build a helpful error message that includes attempt feedback
    const attemptsLeft = remaining;
    let errorMessage = "Invalid email or password.";
    if (attemptsLeft <= 2 && attemptsLeft > 0) {
      errorMessage += ` ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before temporary lockout.`;
    } else if (record.lockedUntil) {
      const minutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      errorMessage = `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
    }

    return { success: false, error: errorMessage };
  }

  // ── Success: clear any accumulated failure count for this IP ─────────────
  clearAttempts(ip);

  const role =
    data.user?.app_metadata?.app_role ??
    getRoleFromAccessToken(data.session?.access_token);
  return { success: true, redirectTo: getRoleDashboard(role) };
}
