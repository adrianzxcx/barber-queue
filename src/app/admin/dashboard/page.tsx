import { getAdminDashboardData } from "@/lib/queries/admin-dashboard";

import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <AdminDashboardClient
      queue={dashboard.queue}
      barbers={dashboard.barbers}
      servedToday={dashboard.servedToday}
      settings={dashboard.settings}
    />
  );
}
