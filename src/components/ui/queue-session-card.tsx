import * as React from "react";
import {
  ClockIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";

type QueueSessionCardProps = {
  ticket: string;
  peopleAhead: number;
  estimatedWait: string;
  progress: number;
};

function QueueSessionCard({
  ticket,
  peopleAhead,
  estimatedWait,
  progress,
}: QueueSessionCardProps) {
  return (
    <section className="relative overflow-visible rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low p-8 shadow-2xl md:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-3 text-lg font-semibold uppercase leading-6 tracking-[0.35em] text-primary">
            <span className="size-2.5 rounded-full bg-primary" />
            Your Next Session
          </p>
          <div className="mt-6 font-heading text-[84px] uppercase leading-none text-white drop-shadow md:text-[120px]">
            {ticket}
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-lg font-medium text-supremo-on-surface">
            <span className="inline-flex items-center gap-2">
              <UsersIcon className="size-6 text-primary" />
              {peopleAhead} people ahead
            </span>
            <span className="inline-flex items-center gap-2">
              <ClockIcon className="size-6 text-primary" />
              Est. wait: {estimatedWait}
            </span>
          </div>
        </div>

        <Button className="h-16 rounded-lg bg-primary px-10 text-base font-black uppercase tracking-[0.08em] text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
          View Ticket
        </Button>
      </div>

      <div className="mt-8 h-2 overflow-hidden rounded-full bg-supremo-surface-container-high">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(240,191,92,0.45)]"
          style={{ width: `${progress}%` }}
        />
      </div>

    </section>
  );
}

export { QueueSessionCard };
