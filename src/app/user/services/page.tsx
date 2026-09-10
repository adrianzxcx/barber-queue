import { UserDashboardNav } from "@/components/layout";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getActiveServices } from "@/lib/queries/services";

import { ServicesClient } from "./services-client";

export default async function UserServicesPage() {
  const services = await getActiveServices();

  return (
    <div className="min-h-screen bg-background text-supremo-on-surface">
      <RealtimeRefresh channelName="user-services" tables={["services"]} />
      <UserDashboardNav />

      <main className="industrial-pattern mx-auto max-w-[1440px] px-5 py-12 md:px-10 space-y-12">
        <ServicesClient services={services} />
      </main>
    </div>
  );
}
