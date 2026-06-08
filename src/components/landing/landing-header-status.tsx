"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Users } from "@phosphor-icons/react";

export function LandingHeaderStatus() {
  const [mounted, setMounted] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const date = new Date();
    const formatted = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setDateStr(formatted);

    // Read the shop operating status from localStorage
    const savedStatus = localStorage.getItem("shopIsOpen");
    if (savedStatus !== null) {
      setIsOpen(savedStatus === "true");
    }
  }, []);

  if (!mounted) {
    return <div className="h-8 mb-6" />;
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.15em] animate-[fadeIn_0.5s_ease-out]">
      {/* Shop Status Badge */}
      {isOpen ? (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-bold shadow-sm">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Store Open
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/20 border border-red-900/40 text-red-400 font-bold shadow-sm">
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          Store Closed
        </span>
      )}

      {/* Vertical separator */}
      <span className="hidden sm:block h-3.5 w-px bg-supremo-outline-variant/30" />

      {/* Date Today */}
      <span className="text-[#ebe1d6]/80 flex items-center gap-2 font-medium">
        <Calendar className="text-primary size-4" />
        {dateStr}
      </span>

      {/* Vertical separator */}
      <span className="hidden sm:block h-3.5 w-px bg-supremo-outline-variant/30" />

      {/* Combined Queue Count & Estimated Wait Time Badge */}
      <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border-2 border-primary text-primary font-bold shadow-[0_0_15px_rgba(240,191,92,0.25)] animate-pulse">
        <Users className="size-4" />
        3 in Queue • ~20m Wait
      </span>
    </div>
  );
}
