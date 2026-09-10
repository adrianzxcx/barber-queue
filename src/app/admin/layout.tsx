import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getCurrentUser } from "@/lib/auth/session";
import { getShopSettings } from "@/lib/queries/settings";

import { AdminShell } from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getShopSettings()]);

  return (
    <AdminShell
      user={
        user
          ? {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null
      }
      settings={settings}
    >
      <RealtimeRefresh
        channelName="admin-backend"
        tables={[
          "activity_logs",
          "barber_shifts",
          "profiles",
          "queue_tickets",
          "services",
          "shop_settings",
        ]}
      />
      {children}
    </AdminShell>
  );
}
