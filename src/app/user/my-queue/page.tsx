import { UserDashboardNav } from "@/components/layout";

export default function UserMyQueuePage() {
  return (
    <div className="min-h-screen bg-background text-supremo-on-surface">
      <UserDashboardNav />
      <main className="industrial-pattern mx-auto max-w-[1440px] px-5 py-8 md:px-10">
        <h1 className="font-heading text-4xl uppercase text-primary mb-6">My Queue</h1>
        <p className="text-sm text-supremo-on-surface-variant">Review your active tickets, estimated wait times, and current lineup progress.</p>
      </main>
    </div>
  );
}
