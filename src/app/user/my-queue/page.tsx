import { UserDashboardNav } from "@/components/layout";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getCurrentCustomerTicket, getCustomerTicketHistory } from "@/lib/queries/queue";

import { MyQueueClient } from "./my-queue-client";

export default async function UserMyQueuePage() {
  const [activeTicket, history] = await Promise.all([
    getCurrentCustomerTicket(),
    getCustomerTicketHistory(),
  ]);

  return (
    <div className="min-h-screen bg-background text-supremo-on-surface">
      <RealtimeRefresh channelName="user-queue" tables={["queue_tickets"]} />
      <UserDashboardNav />

      <main className="industrial-pattern mx-auto max-w-[1440px] px-5 py-12 md:px-10 space-y-12">
        <MyQueueClient activeTicket={activeTicket} history={history} />
      </main>
    </div>
  );
}
