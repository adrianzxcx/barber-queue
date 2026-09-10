import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getRoleFromAccessToken, type AppRole } from "@/lib/auth/roles";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const role = (user.app_metadata.app_role ??
    getRoleFromAccessToken(session?.access_token) ??
    "customer") as AppRole;

  return {
    id: user.id,
    email: user.email ?? null,
    role,
    firstName: typeof user.user_metadata.first_name === "string" ? user.user_metadata.first_name : null,
    lastName: typeof user.user_metadata.last_name === "string" ? user.user_metadata.last_name : null,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError();
  }
  return user;
}

export async function requireReceptionist() {
  const user = await requireUser();
  if (user.role !== "receptionist") {
    throw new ForbiddenError("Receptionist access required");
  }
  return user;
}

export function getDisplayName(user: Awaited<ReturnType<typeof requireUser>>) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "Customer";
}
