import * as React from "react";

import { cn } from "@/lib/utils";

type BarberRosterCardProps = {
  name: string;
  status: "available" | "unavailable" | "busy";
  wait?: string;
  image: string;
  imagePosition?: string;
  onClick?: () => void;
};

function BarberRosterCard({
  name,
  status,
  wait,
  image,
  imagePosition = "center",
  onClick,
}: BarberRosterCardProps) {
  const isAvailable = status === "available";
  const isBusy = status === "busy";
  const statusLabel = isAvailable
    ? "Available"
    : isBusy && wait
      ? `Busy (${wait})`
      : isBusy
        ? "Busy"
        : "Unavailable";

  return (
    <article
      onClick={status !== "unavailable" ? onClick : undefined}
      className={cn(
        "rounded-3xl border border-supremo-outline-variant/12 bg-supremo-surface-container-low p-7 shadow-xl transition-transform",
        status !== "unavailable"
          ? "cursor-pointer hover:-translate-y-1 hover:border-primary/25 hover:shadow-2xl"
          : "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="mb-7 flex items-start justify-between">
        <div className="relative size-16 overflow-hidden rounded-lg border border-supremo-outline-variant/30 bg-supremo-surface-container-high">
          <div
            aria-label={`${name} portrait`}
            role="img"
            className="absolute inset-0 bg-cover"
            style={{ backgroundImage: `url(${image})`, backgroundPosition: imagePosition }}
          />
          <span
            className={cn(
              "absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-supremo-surface-container-low",
              isAvailable
                ? "bg-primary"
                : isBusy
                  ? "bg-secondary"
                  : "bg-supremo-surface-container-highest"
            )}
          />
        </div>
      </div>

      <h3 className="text-2xl font-bold leading-7 text-supremo-on-surface">
        {name}
      </h3>

      <div
        className={cn(
          "mt-5 rounded-lg py-3 text-center text-base font-black uppercase tracking-[0.12em]",
          isAvailable
            ? "bg-primary/15 text-primary"
            : isBusy
              ? "bg-secondary/20 text-secondary"
              : "bg-supremo-surface-container-high text-supremo-on-surface-variant"
        )}
      >
        {statusLabel}
      </div>
    </article>
  );
}

export { BarberRosterCard };
