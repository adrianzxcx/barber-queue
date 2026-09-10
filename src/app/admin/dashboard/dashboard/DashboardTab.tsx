"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  Clock,
  Scissors,
  Lightning,
  Bell,
  UserGear,
  Check,
  Storefront,
  Trash,
} from "@phosphor-icons/react";
import { Barber } from "@/components/admin/manage-roster-dialog";

export interface QueueItem {
  id: string;
  ticketId?: string;
  customer: string;
  service: string;
  status: "being_served" | "waiting" | "skipped" | "expired";
  preferredBarber: string | null;
  barberServedBy?: string | null;
  wait: string;
  waitMinutes?: number;
  skippedAt?: number | null;
  joinedAt?: number;
}

interface DashboardTabProps {
  queue: QueueItem[];
  barbers: Barber[];
  servedToday: number;
  settings: {
    shopIsOpen: boolean;
    skipExpiryDuration: number;
    skipExpirySeconds: number;
    soundEnabled: boolean;
  };
  handleToggleShopStatus: () => void;
  handleExpireCustomer: (customerId: string) => void;
  handleDeleteExpiredCustomer: (customerId: string) => void;
  handleClearAllExpired: () => void;
  handleCallNextForBarber: (barberName: string) => void;
  handleCompleteCustomer: (customerId: string) => void;
}

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

export function DashboardTab({
  queue,
  barbers,
  servedToday,
  settings,
  handleToggleShopStatus,
  handleExpireCustomer,
  handleDeleteExpiredCustomer,
  handleClearAllExpired,
  handleCallNextForBarber,
  handleCompleteCustomer,
}: DashboardTabProps) {
  // Filter queue helpers for 3 columns: General, Specific, Expired
  const generalQueueFiltered = queue.filter(
    (item) => !item.preferredBarber && item.status === "waiting"
  );

  const specificQueueFiltered = queue.filter(
    (item) => item.preferredBarber && item.status === "waiting"
  );

  const expiredQueueFiltered = queue.filter(
    (item) => item.status === "expired"
  );
  
  // Sort queues so waiting customers are always sorted by joinedAt timestamp (FIFO)
  const sortQueueList = (items: QueueItem[]) => {
    return [...items].sort((a, b) => {
      return (a.joinedAt || 0) - (b.joinedAt || 0); // Sort waiting items by joinedAt timestamp (FIFO)
    });
  };

  const sortedGeneralQueue = sortQueueList(generalQueueFiltered);
  const sortedSpecificQueue = sortQueueList(specificQueueFiltered);
  const sortedExpiredQueue = [...expiredQueueFiltered].sort((a, b) => b.id.localeCompare(a.id));

  // Active Barbers count
  const activeBarbers = barbers.filter((b) => b.status !== "unavailable");
  const vacantBarbers = barbers.filter((b) => b.status === "available");

  // Estimated wait time
  const totalWaiting = queue.filter((x) => x.status === "waiting").length;
  const currentEstWait = Math.max(0, ...queue.filter((x) => x.status === "waiting").map((x) => x.waitMinutes ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border border-[#4e4637]/30 bg-[#231f18] p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center border",
              settings.shopIsOpen
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-red-900/50 bg-red-950/20 text-red-400"
            )}
          >
            <Storefront size={22} weight="fill" />
          </div>
          <div>
            <h2 className="font-heading text-2xl uppercase leading-none tracking-wider text-[#ebe1d6]">
              {settings.shopIsOpen ? "Store Open" : "Store Closed"}
            </h2>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#9b8f7d]">
              Controls whether customers can join the queue
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleShopStatus}
          className={cn(
            "h-11 px-5 text-xs font-black uppercase tracking-[0.14em] transition-all",
            settings.shopIsOpen
              ? "border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/35"
              : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
          )}
        >
          {settings.shopIsOpen ? "Close Store" : "Open Store"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Users size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            GENERAL QUEUE
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1">
            {String(generalQueueFiltered.filter(q => q.status === "waiting").length).padStart(2, "0")}
          </div>
          <span className="text-[10px] text-[#f0bf5c] font-semibold flex items-center gap-1">
            Waiting customers
          </span>
        </div>

        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Clock size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            EST. MAX WAIT
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1 flex items-baseline gap-0.5">
            {currentEstWait}
            <span className="text-lg">M</span>
          </div>
          <span className="text-[10px] text-[#9b8f7d] font-semibold">
            Based on {totalWaiting} waiting customers
          </span>
        </div>

        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Scissors size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            ACTIVE BARBERS
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1">
            {String(activeBarbers.length).padStart(2, "0")}
          </div>
          <span className="text-[10px] text-[#f0bf5c] font-semibold">
            {vacantBarbers.length} vacant, {activeBarbers.length - vacantBarbers.length} busy
          </span>
        </div>

        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Lightning size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            SERVED TODAY
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1">
            {String(servedToday).padStart(2, "0")}
          </div>
          <span className="text-[10px] text-[#9b8f7d] font-semibold">
            Target: 80 sessions
          </span>
        </div>
      </div>

      {/* Real-Time Monitor Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Column 1: General Queue */}
        <div className="bg-[#231f18] border border-[#4e4637]/30 p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
            <div>
              <h3 className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c]">
                General Queue
              </h3>
              <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">No Preferred Barber</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedGeneralQueue.length === 0 ? (
              <div className="text-center py-10 text-[#9b8f7d] text-xs italic">
                No general queue tickets.
              </div>
            ) : (
              sortedGeneralQueue.map((item, idx) => {
                const isFirstWaitingGeneral = sortedGeneralQueue[0]?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "border p-3.5 flex flex-col gap-3 transition-all",
                      isFirstWaitingGeneral
                        ? "border-[#f0bf5c] bg-[#f0bf5c]/5 shadow-[0_0_12px_rgba(240,191,92,0.15)] animate-pulse"
                        : "bg-[#17130c] border-[#4e4637]/40 hover:border-[#f0bf5c]/50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-heading text-[#f0bf5c] leading-none">
                          #{item.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-[#ebe1d6]">{item.customer}</div>
                            {isFirstWaitingGeneral && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black bg-[#f0bf5c] text-[#17130c] px-1.5 py-0.5 tracking-wider uppercase">
                                NEXT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-[#9b8f7d] block uppercase tracking-wider">
                          Pos
                        </span>
                        <span className="font-heading text-lg text-[#ebe1d6]">
                          {idx + 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-2.5">
                      <span className="text-[10px] font-semibold text-[#9b8f7d] uppercase tracking-wider">
                        Estimated Wait
                      </span>
                      <span className="text-[10px] font-black tabular-nums text-[#f0bf5c] uppercase tracking-wider">
                        {item.wait}
                      </span>
                    </div>

                    {isFirstWaitingGeneral && (
                      <button
                        type="button"
                        onClick={() => handleExpireCustomer(item.id)}
                        className="flex items-center justify-center gap-1.5 border border-[#891c22]/50 bg-[#891c22]/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffb3b0] transition-all hover:bg-[#891c22]/30 hover:text-white"
                        title="Remove next customer"
                      >
                        <Trash size={12} weight="bold" />
                        Remove
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Specific Queue */}
        <div className="bg-[#231f18] border border-[#4e4637]/30 p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
            <div>
              <h3 className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c]">
                Specific Queue
              </h3>
              <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Has Preferred Barber</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedSpecificQueue.length === 0 ? (
              <div className="text-center py-10 text-[#9b8f7d] text-xs italic">
                No specific queue tickets.
              </div>
            ) : (
              sortedSpecificQueue.map((item, idx) => {
                const isFirstWaitingSpecific = sortedSpecificQueue[0]?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "border p-3.5 flex flex-col gap-3 transition-all",
                      isFirstWaitingSpecific
                        ? "border-[#f0bf5c] bg-[#f0bf5c]/5 shadow-[0_0_12px_rgba(240,191,92,0.15)] animate-pulse"
                        : "bg-[#17130c] border-[#4e4637]/40 hover:border-[#f0bf5c]/50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-heading text-[#f0bf5c] leading-none">
                          #{item.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-[#ebe1d6]">{item.customer}</div>
                            {isFirstWaitingSpecific && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black bg-[#f0bf5c] text-[#17130c] px-1.5 py-0.5 tracking-wider uppercase">
                                NEXT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-[#9b8f7d] block uppercase tracking-wider">
                          Pos
                        </span>
                        <span className="font-heading text-lg text-[#ebe1d6]">
                          {idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Preferred Barber Badge */}
                    <div className="flex items-center justify-between bg-[#1f1b14] border border-[#4e4637]/30 px-2 py-1.5 text-[10px]">
                      <span className="text-[#9b8f7d] uppercase tracking-wider font-semibold">Preferred:</span>
                      <span className="font-bold text-[#ebe1d6]">{item.preferredBarber}</span>
                    </div>

                    <div className="grid gap-2 border-t border-[#4e4637]/20 pt-2.5">
                      <div className="flex items-center justify-between rounded-none border border-[#4e4637]/25 bg-[#1f1b14] px-2.5 py-1.5 text-[10px] uppercase tracking-wider">
                        <span className="font-semibold text-[#9b8f7d]">Wait</span>
                        <span className="font-black tabular-nums text-[#f0bf5c]">{item.wait}</span>
                      </div>
                    </div>

                    {isFirstWaitingSpecific && (
                      <button
                        type="button"
                        onClick={() => handleExpireCustomer(item.id)}
                        className="flex items-center justify-center gap-1.5 border border-[#891c22]/50 bg-[#891c22]/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffb3b0] transition-all hover:bg-[#891c22]/30 hover:text-white"
                        title="Remove next customer"
                      >
                        <Trash size={12} weight="bold" />
                        Remove
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Expired Queue */}
        <div className="bg-[#231f18] border border-[#4e4637]/30 p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
            <div>
              <h3 className="font-heading text-xl uppercase tracking-wider text-red-400">
                Expired
              </h3>
              <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Missed Appointments</p>
            </div>
            {sortedExpiredQueue.length > 0 && (
              <button
                onClick={handleClearAllExpired}
                className="text-[9px] text-[#f0bf5c] hover:underline uppercase font-bold tracking-widest cursor-pointer select-none"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedExpiredQueue.length === 0 ? (
              <div className="text-center py-10 text-[#9b8f7d] text-xs italic">
                No missed appointments.
              </div>
            ) : (
              sortedExpiredQueue.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#17130c] border border-red-950/30 p-3.5 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-heading text-red-400 leading-none">
                        #{item.id}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#ebe1d6]">{item.customer}</div>
                      </div>
                    </div>
                    <span className="text-[8px] bg-red-950/40 border border-red-500/30 text-red-400 px-1.5 py-0.5 uppercase font-bold tracking-wider">
                      Missed
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#4e4637]/25 pt-2.5">
                    <div className="text-[10px] font-semibold text-[#9b8f7d] uppercase tracking-wider truncate max-w-[120px]">
                      Barber: {item.preferredBarber || "Any"}
                    </div>
                    <button
                      onClick={() => handleDeleteExpiredCustomer(item.id)}
                      className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase cursor-pointer select-none"
                      title="Delete permanently"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Barber Shift Management Roster */}
      <div className="bg-[#231f18] border border-[#4e4637]/30 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">
              Barber Shift Center
            </h3>
            <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Live active barbers roster and queue controls</p>
          </div>
          <Link
            href="/admin/profiles"
            className="bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading tracking-wider text-xs h-9 px-4 flex items-center justify-center gap-2 rounded-none cursor-pointer uppercase select-none"
          >
            <UserGear size={14} weight="bold" />
            Manage Roster
          </Link>
        </div>

        {/* List of barbers shifts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {barbers.map((barber) => {
            const isOffline = barber.status === "unavailable";
            const isBusy = barber.status === "busy";
            const isVacant = barber.status === "available";

            return (
              <div
                key={barber.name}
                className={cn(
                  "p-3.5 border flex items-center justify-between transition-all rounded-none",
                  isOffline
                    ? "bg-[#17130c]/30 border-[#4e4637]/25 opacity-55"
                    : "bg-[#17130c] border-[#4e4637]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={cn(
                        "size-10 overflow-hidden border bg-zinc-800",
                        isOffline ? "border-zinc-700 saturate-50" : "border-[#f0bf5c]"
                      )}
                    >
                      <img src={portraitImage} alt={barber.name} className="object-cover w-full h-full" />
                    </div>
                    {/* Status dot */}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-[#17130c] block",
                        isVacant && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
                        isBusy && "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]",
                        isOffline && "bg-zinc-600"
                      )}
                    />
                  </div>

                  <div>
                    <h4 className={cn("text-xs font-bold", isOffline ? "text-[#9b8f7d]" : "text-[#ebe1d6]")}>
                      {barber.name}
                    </h4>
                    <div className="text-[10px] font-semibold mt-0.5">
                      {isOffline ? (
                        <span className="text-[#9b8f7d]">OFFLINE</span>
                      ) : isBusy ? (
                        <span className="text-orange-400">BUSY - SERVING #{barber.currentServing}</span>
                      ) : (
                        <span className="text-[#f0bf5c]">VACANT - ON SHIFT</span>
                      )}
                    </div>
                    {!isOffline && (
                      <span className="text-[9px] text-[#9b8f7d] uppercase font-semibold block tracking-wider mt-1">
                        Served Today: <span className="text-[#f0bf5c] font-bold">{barber.sessions}</span>
                      </span>
                    )}
                  </div>
                </div>

                {!isOffline ? (
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    {isBusy && barber.currentServing ? (
                      <button
                        onClick={() => {
                          const servingTicket = queue.find(
                            (q) => q.id === barber.currentServing || q.ticketId === barber.currentServing
                          );
                          if (servingTicket) {
                            handleCompleteCustomer(servingTicket.id);
                          }
                        }}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-500 border border-transparent text-[10px] font-bold uppercase tracking-wider py-2 transition-all rounded-none text-center flex items-center justify-center gap-1 select-none cursor-pointer"
                      >
                        <Check size={10} weight="bold" /> COMPLETE
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCallNextForBarber(barber.name)}
                        className="w-full bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] border border-transparent text-[10px] font-bold uppercase tracking-wider py-2 transition-all rounded-none text-center flex items-center justify-center gap-1 select-none cursor-pointer"
                      >
                        <Bell size={10} weight="bold" /> CALL NEXT
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-[#9b8f7d] italic font-semibold uppercase tracking-wider px-3">
                    Offline
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
