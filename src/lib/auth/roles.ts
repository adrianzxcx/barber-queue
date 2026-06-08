export type AppRole = "customer" | "receptionist";

export function getRoleDashboard(role: AppRole | string | null | undefined) {
  return role === "receptionist" ? "/admin/dashboard" : "/user/dashboard";
}

export function getRoleFromAccessToken(accessToken: string | null | undefined) {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = accessToken.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = atob(normalizedPayload);
    const claims = JSON.parse(decodedPayload) as {
      app_role?: AppRole;
      user_role?: AppRole;
    };

    return claims.app_role ?? claims.user_role ?? null;
  } catch {
    return null;
  }
}
