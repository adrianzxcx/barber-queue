import { UserDashboardNav } from "@/components/layout";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getBarberRoster } from "@/lib/queries/barbers";
import { getActiveServices } from "@/lib/queries/services";
import { getShopSettings } from "@/lib/queries/settings";
import { getCurrentCustomerTicket, getActiveQueueTickets } from "@/lib/queries/queue";

import { DashboardClient } from "./dashboard-client";

export default async function UserDashboardPage() {
  const [activeTicket, barbers, services, settings, activeTickets] = await Promise.all([
    getCurrentCustomerTicket(),
    getBarberRoster(),
    getActiveServices(),
    getShopSettings(),
    getActiveQueueTickets(),
  ]);

  return (
    <div className="min-h-screen bg-background text-supremo-on-surface">
      <RealtimeRefresh
        channelName="user-dashboard"
        tables={["barber_shifts", "queue_tickets", "services", "shop_settings"]}
      />
      <UserDashboardNav />
      <DashboardClient
        activeTicket={activeTicket}
        barbers={barbers}
        services={services}
        settings={settings}
        activeTickets={activeTickets}
      />
    </div>
  );
}
