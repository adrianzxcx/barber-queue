import { UserDashboardNav } from "@/components/layout";
import { BarberRosterCard } from "@/components/ui/barber-roster-card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { QueueSessionCard } from "@/components/ui/queue-session-card";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDcG-AMdHHjRZN3PvY8UtHasPMNrqj4vA6PweG2ulJPlllKrowBLi4KqtPYU8S6_bHaGgHtEAhCPnbfaESolNKQi3Ynrkv6FXwXZpydpJgNsyxsKrwovcu18segJfQRzrZn5rCoet4wt7-CGDhJwfN6CUkdIJS1zNo8lB-CkJP_6MfRYE4hDk7EkOKSc-pFZPA-_Cg86Xelwk5NDlsT71hnvCjE4MvyaM0MUDMIDLeuLCqhsG6Nao1RjcUt0Duk-PR5t1XXQORlngk";

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

const barbers = [
  {
    name: "Kiko 'The Blade'",
    specialty: "Skin Fade",
    rank: "Master",
    status: "available" as const,
    imagePosition: "44% 42%",
  },
  {
    name: "Marco Polo",
    specialty: "Pompadour",
    rank: "Senior",
    status: "busy" as const,
    wait: "15m",
    imagePosition: "55% 40%",
  },
  {
    name: "Uncle Jun",
    specialty: "Traditional Shave",
    rank: "Artisan",
    status: "available" as const,
    imagePosition: "38% 45%",
  },
  {
    name: "Dexter T.",
    specialty: "Modern Crop",
    rank: "Junior",
    status: "unavailable" as const,
    imagePosition: "62% 42%",
  },
];

export default function UserDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-supremo-on-surface">
      <UserDashboardNav />

      <main className="industrial-pattern mx-auto max-w-[1440px] space-y-20 px-5 py-8 md:px-10">
        <DashboardHero image={heroImage} />

        <QueueSessionCard
          ticket="#007"
          peopleAhead={2}
          estimatedWait="15 mins"
          progress={78}
        />

        <section className="pb-20">
          <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-[46px] uppercase leading-none text-supremo-on-surface md:text-[54px]">
              Barber Roster
            </h2>
            <div className="flex items-center gap-5 text-base font-semibold text-supremo-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-primary" />
                Available
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-secondary" />
                Busy
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-supremo-surface-container-highest" />
                Unavailable
              </span>
            </div>
          </div>

          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
            {barbers.map((barber) => (
              <BarberRosterCard
                key={barber.name}
                image={portraitImage}
                {...barber}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
