import * as React from "react";
import {
  ClockIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueueSessionCardProps = {
  ticket: string;
  peopleAhead: number;
  estimatedWait: string;
  progress: number;
  status?: string;
  onLeaveQueue?: () => void;
};

function QueueSessionCard({
  ticket,
  peopleAhead,
  estimatedWait,
  progress,
  status,
  onLeaveQueue,
}: QueueSessionCardProps) {
  const isBeingServed = status === "being_served";

  return (
    <section className="relative overflow-visible rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low p-8 shadow-2xl md:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p
            className={cn(
              "flex items-center gap-3 text-lg font-semibold uppercase leading-6 tracking-[0.35em]",
              isBeingServed ? "text-emerald-400 animate-pulse" : "text-primary"
            )}
          >
            <span className={cn("size-2.5 rounded-full", isBeingServed ? "bg-emerald-500" : "bg-primary")} />
            {isBeingServed ? "Currently Being Served" : "Your Next Session"}
          </p>
          <div className="mt-6 font-heading text-[84px] uppercase leading-none text-white drop-shadow md:text-[120px]">
            {ticket}
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-lg font-medium text-supremo-on-surface">
            {isBeingServed ? (
              <>
                <span className="inline-flex items-center gap-2 text-emerald-400">
                  <UsersIcon className="size-6 text-emerald-400" />
                  Position: #1
                </span>
                <span className="inline-flex items-center gap-2 text-emerald-400">
                  <UsersIcon className="size-6 text-emerald-400" />
                  Ahead: 0
                </span>
                <span className="inline-flex items-center gap-2 text-emerald-400 animate-pulse">
                  <ClockIcon className="size-6 text-emerald-400" />
                  Service In Progress
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2">
                  <UsersIcon className="size-6 text-primary" />
                  Position: #{peopleAhead + 1}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UsersIcon className="size-6 text-primary" />
                  Ahead: {peopleAhead}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ClockIcon className="size-6 text-primary" />
                  Est. wait: {estimatedWait}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/user/my-queue" passHref legacyBehavior>
            <Button className="h-16 rounded-lg bg-primary px-10 text-base font-black uppercase tracking-[0.08em] text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 cursor-pointer">
              View Ticket
            </Button>
          </Link>
          {onLeaveQueue && (
            <Button
              onClick={onLeaveQueue}
              disabled={isBeingServed}
              variant="destructive"
              className="h-16 rounded-lg text-base font-black uppercase tracking-[0.08em] px-10 cursor-pointer border border-[#891c22]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Leave Queue
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 h-2 overflow-hidden rounded-full bg-supremo-surface-container-high">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isBeingServed
              ? "bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.6)]"
              : "bg-primary shadow-[0_0_18px_rgba(240,191,92,0.45)]"
          )}
          style={{ width: `${isBeingServed ? 100 : progress}%` }}
        />
      </div>

    </section>
  );
}

export { QueueSessionCard };

