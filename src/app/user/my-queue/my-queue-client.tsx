"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle, Clock, Eye, Trash, Users } from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";

import { cancelMyTicket } from "@/app/user/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ActiveTicketSummaryDTO, TicketHistoryItemDTO } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface MyQueueClientProps {
  activeTicket: ActiveTicketSummaryDTO | null;
  history: TicketHistoryItemDTO[];
}

export function MyQueueClient({ activeTicket, history }: MyQueueClientProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLeaveQueue = () => {
    if (!activeTicket) return;
    if (!confirm("Are you sure you want to cancel your spot in the queue?")) return;

    startTransition(async () => {
      const result = await cancelMyTicket(activeTicket.ticketId);
      if (result.ok) {
        toast.error("Left Queue", { description: result.message });
      } else {
        toast.error("Could not leave queue", { description: result.message });
      }
    });
  };

  return (
    <>
      <Toaster position="bottom-right" theme="dark" closeButton richColors />

      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary block">
          Lineup Tracking
        </span>
        <h1 className="font-heading text-5xl uppercase leading-none md:text-6xl text-supremo-on-surface">
          My Queue
        </h1>
        <p className="text-sm text-supremo-on-surface-variant max-w-xl font-light">
          Review your active ticket, estimated wait time, and visit history from your account.
        </p>
      </div>

      <div className="flex border-b border-supremo-outline-variant/15 gap-8">
        <button
          onClick={() => setActiveTab("current")}
          className={cn(
            "pb-4 font-heading text-lg uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2 select-none",
            activeTab === "current" ? "text-primary font-black" : "text-supremo-on-surface-variant hover:text-supremo-on-surface"
          )}
        >
          <span>Active Spot</span>
          {activeTicket && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          {activeTab === "current" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_8px_rgba(240,191,92,0.6)]" />}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "pb-4 font-heading text-lg uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2 select-none",
            activeTab === "history" ? "text-primary font-black" : "text-supremo-on-surface-variant hover:text-supremo-on-surface"
          )}
        >
          <span>Visit History</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-supremo-surface-container-high text-supremo-on-surface-variant font-mono">
            {history.length}
          </span>
          {activeTab === "history" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_8px_rgba(240,191,92,0.6)]" />}
        </button>
      </div>

      <div className="space-y-8">
        {activeTab === "current" ? (
          activeTicket ? (
            <div className="space-y-4">
              {activeTicket.status === "being_served" && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-4 text-center font-bold text-xs tracking-wider rounded-xl uppercase animate-pulse">
                  ⚡ You are currently in the chair! Enjoy your premium grooming session.
                </div>
              )}

              <div className="overflow-hidden border border-supremo-outline-variant/15 bg-supremo-surface-container-low rounded-2xl shadow-xl">
                <div className="p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4">
                    <span className={cn("font-heading text-3xl leading-none uppercase tracking-wider", activeTicket.status === "being_served" ? "text-emerald-400" : "text-primary")}>
                      {activeTicket.ticket}
                    </span>
                    <div className="h-6 w-px bg-supremo-outline-variant/20 hidden md:block" />
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full animate-pulse", activeTicket.status === "being_served" ? "bg-emerald-500" : "bg-primary")} />
                      <span className={cn("font-bold uppercase tracking-wider", activeTicket.status === "being_served" ? "text-emerald-400" : "text-supremo-on-surface")}>
                        {activeTicket.status === "being_served" ? "Currently Being Served" : "Waiting in Line"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 md:gap-10 text-supremo-on-surface-variant">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-supremo-on-surface-variant/60 block font-medium">Barber</span>
                      <span className={cn("font-semibold", activeTicket.status === "being_served" ? "text-emerald-400 font-bold" : "text-supremo-on-surface")}>{activeTicket.barber}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-supremo-on-surface-variant/60 block font-medium">Position</span>
                      <span className="font-semibold text-supremo-on-surface">
                        #{activeTicket.status === "being_served" ? 1 : activeTicket.peopleAhead + 1}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-supremo-on-surface-variant/60 block font-medium">Customers Ahead</span>
                      <span className="font-semibold text-supremo-on-surface">
                        {activeTicket.status === "being_served" ? 0 : activeTicket.peopleAhead}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-supremo-on-surface-variant/60 block font-medium">Est. Wait</span>
                      <span className={cn("font-bold", activeTicket.status === "being_served" ? "text-emerald-400" : "text-secondary")}>
                        {activeTicket.status === "being_served" ? "Active" : activeTicket.estimatedWait}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 md:pt-0 border-t border-supremo-outline-variant/10 md:border-0">
                    <button
                      onClick={() => setIsDetailsOpen(true)}
                      className="h-10 w-10 flex items-center justify-center border border-supremo-outline-variant/35 hover:border-primary/50 hover:bg-primary/5 text-supremo-on-surface hover:text-primary rounded-xl cursor-pointer transition-all"
                      title="View Ticket Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={handleLeaveQueue}
                      disabled={isPending || activeTicket.status === "being_served"}
                      className="h-10 px-4 flex items-center justify-center gap-2 border border-red-950 bg-red-900/10 text-red-400 hover:bg-[#891c22]/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                      title="Leave Queue"
                    >
                      <Trash size={14} />
                      <span>{isPending ? "Leaving" : "Leave"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <section className="relative overflow-hidden rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low p-8 shadow-2xl md:p-10 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="font-heading text-4xl uppercase leading-none text-supremo-on-surface">
                  No active tickets found
                </h2>
                <p className="text-sm text-supremo-on-surface-variant leading-relaxed font-light">
                  You do not have any active tickets in line. Head back to the dashboard to secure your spot.
                </p>
              </div>
              <Link
                href="/user/dashboard"
                className="inline-flex items-center gap-2 h-14 rounded-xl bg-primary px-8 text-sm font-black uppercase tracking-[0.15em] text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer select-none"
              >
                Go to Dashboard
              </Link>
            </section>
          )
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.ticketId}
                className="overflow-hidden border border-supremo-outline-variant/10 bg-supremo-surface-container-low/30 hover:bg-supremo-surface-container-low rounded-2xl text-xs text-supremo-on-surface-variant transition-all duration-300"
              >
                <div className="p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-heading text-2xl text-supremo-outline-variant/70 leading-none uppercase tracking-wider">
                      {item.ticket}
                    </span>
                    <div className="h-6 w-px bg-supremo-outline-variant/15 hidden md:block" />
                    <span className="font-semibold text-supremo-on-surface-variant/80 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 md:gap-10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-supremo-on-surface-variant/50 block font-medium">Barber</span>
                      <span className="font-semibold text-supremo-on-surface/80">{item.barber}</span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider inline-block text-center w-24",
                      item.status === "completed"
                        ? "bg-emerald-950/20 border border-emerald-500/30 text-emerald-400"
                        : "bg-red-950/20 border border-red-500/30 text-red-400"
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <section className="relative overflow-hidden rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low p-8 shadow-2xl md:p-10 text-center space-y-6">
            <h2 className="font-heading text-4xl uppercase leading-none text-supremo-on-surface">
              No visit history yet
            </h2>
            <p className="text-sm text-supremo-on-surface-variant leading-relaxed font-light">
              Completed, canceled, and expired tickets will appear here.
            </p>
          </section>
        )}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md border border-supremo-outline-variant/30 bg-supremo-surface-container text-supremo-on-surface p-6 rounded-2xl">
          <DialogHeader className="mb-4 border-b border-supremo-outline-variant/15 pb-4">
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-primary">
              Ticket Details
            </DialogTitle>
            <DialogDescription className="text-xs text-supremo-on-surface-variant">
              Current check-in summary and queue progress
            </DialogDescription>
          </DialogHeader>

          {activeTicket && (
            <div className="space-y-6">
              <div className="text-center py-6 bg-[#1f1b14] border border-supremo-outline-variant/10 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-supremo-on-surface-variant/80 block">
                  YOUR ACTIVE CODE
                </span>
                <span className="font-heading text-6xl text-white block mt-2 tracking-wider">
                  {activeTicket.ticket}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-supremo-outline-variant/10 pb-2.5">
                  <span className="font-medium text-supremo-on-surface-variant">Preferred Barber</span>
                  <span className="font-bold text-supremo-on-surface">{activeTicket.barber}</span>
                </div>
                <div className="flex items-center justify-between border-b border-supremo-outline-variant/10 pb-2.5">
                  <span className="font-medium text-supremo-on-surface-variant">Grooming Service</span>
                  <span className="font-bold text-supremo-on-surface">{activeTicket.service}</span>
                </div>
                <div className="flex items-center justify-between border-b border-supremo-outline-variant/10 pb-2.5">
                  <span className="font-medium text-supremo-on-surface-variant">Current Position</span>
                  <span className="font-bold text-primary">
                    #{activeTicket.status === "being_served" ? 1 : activeTicket.peopleAhead + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-supremo-outline-variant/10 pb-2.5">
                  <span className="font-medium text-supremo-on-surface-variant">Customers Ahead</span>
                  <span className="font-bold text-primary">
                    {activeTicket.status === "being_served" ? 0 : activeTicket.peopleAhead}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-supremo-outline-variant/10 pb-2.5">
                  <span className="font-medium text-supremo-on-surface-variant">Estimated Wait</span>
                  <span className="font-bold text-secondary">{activeTicket.estimatedWait}</span>
                </div>
              </div>

              <div className="relative flex justify-between items-center gap-4">
                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-supremo-outline-variant/15 -z-0 -translate-y-1/2" />
                {[
                  ["Check-In", CheckCircle, "text-emerald-400 border-emerald-500"],
                  ["In Line", Clock, "text-primary border-primary"],
                  ["Chair", Users, activeTicket.status === "being_served" ? "text-primary border-primary" : "text-supremo-on-surface-variant/40 border-supremo-outline-variant/35"],
                  ["Done", CheckCircle, "text-supremo-on-surface-variant/40 border-supremo-outline-variant/35"],
                ].map(([label, Icon, classes]) => (
                  <div key={label as string} className="relative z-10 flex flex-col items-center text-center">
                    <div className={cn("size-8 rounded-full bg-[#231f18] border-2 flex items-center justify-center", classes as string)}>
                      <Icon size={14} weight="fill" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-supremo-on-surface mt-1.5">
                      {label as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
