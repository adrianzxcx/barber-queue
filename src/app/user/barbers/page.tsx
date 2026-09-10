import { Calendar, Clock, Star, Users } from "@phosphor-icons/react/dist/ssr";

import { UserDashboardNav } from "@/components/layout";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { formatWait } from "@/lib/backend/format";
import { getBarberRoster } from "@/lib/queries/barbers";
import { cn } from "@/lib/utils";

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

export default async function UserBarbersPage() {
  const barbers = await getBarberRoster();

  return (
    <div className="min-h-screen bg-background text-supremo-on-surface">
      <RealtimeRefresh
        channelName="user-barbers"
        tables={["barber_shifts", "profiles", "queue_tickets"]}
      />
      <UserDashboardNav />

      <main className="industrial-pattern mx-auto max-w-[1440px] px-5 py-12 md:px-10 space-y-12">
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary block">
            Craftsmen & Stylists
          </span>
          <h1 className="font-heading text-5xl uppercase leading-none md:text-6xl text-supremo-on-surface">
            Barbers
          </h1>
          <p className="text-sm text-supremo-on-surface-variant max-w-xl font-light">
            Meet our team, review live availability, and use the dashboard to join a specific barber queue.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {barbers.map((barber) => {
            const isAvailable = barber.status === "available";
            const isBusy = barber.status === "busy";
            const isOffline = barber.status === "unavailable";

            return (
              <div
                key={barber.id}
                className="group relative rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low hover:border-primary/40 p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_15px_40px_rgba(240,191,92,0.06)] hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-t-3xl" />

                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative size-20 overflow-hidden rounded-2xl border-2 border-supremo-outline-variant/35 bg-supremo-surface-container-high shadow-md">
                      <div
                        aria-label={`${barber.name} portrait`}
                        role="img"
                        className="absolute inset-0 bg-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        style={{
                          backgroundImage: `url(${barber.imageUrl ?? portraitImage})`,
                          backgroundPosition: barber.imagePosition,
                        }}
                      />
                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-supremo-surface-container-low",
                          isAvailable && "bg-primary animate-pulse",
                          isBusy && "bg-secondary",
                          isOffline && "bg-supremo-surface-container-highest"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold leading-none text-supremo-on-surface group-hover:text-primary transition-colors">
                      {barber.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-xs text-supremo-on-surface-variant">
                    <Star size={14} className="text-primary fill-primary" />
                    <span className="font-bold text-supremo-on-surface">{barber.rating.toFixed(1)}</span>
                    <span className="opacity-60">({barber.sessionsToday} served today)</span>
                  </div>

                  <hr className="border-supremo-outline-variant/15 my-5" />

                  <div className="space-y-2.5 text-xs text-supremo-on-surface-variant/90">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium">
                        <Clock size={14} className="text-primary" />
                        Wait Time
                      </span>
                      <span className={cn("font-bold", isAvailable && "text-primary", isBusy && "text-secondary", isOffline && "text-supremo-on-surface-variant/40")}>
                        {isOffline ? "Offline" : formatWait(barber.estimatedWaitMinutes)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium">
                        <Users size={14} className="text-primary" />
                        In Line
                      </span>
                      <span className={cn("font-bold", isOffline ? "text-supremo-on-surface-variant/40" : "text-supremo-on-surface")}>
                        {isOffline ? "-" : `${barber.customersInLine} waiting`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium">
                        <Calendar size={14} className="text-primary" />
                        Shift
                      </span>
                      <span className="font-semibold text-[11px] uppercase">{barber.status}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-supremo-outline-variant/10">
                  <a
                    href="/user/dashboard"
                    className={cn(
                      "w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 select-none",
                      isOffline
                        ? "bg-supremo-surface-container-high text-supremo-on-surface-variant/45 border border-supremo-outline-variant/10 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                    )}
                  >
                    {isOffline ? "Off Duty" : "Join From Dashboard"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
