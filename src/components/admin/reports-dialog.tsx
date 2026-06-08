"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendUp, ChartBar, Users, Clock, Scissors, Lightning } from "@phosphor-icons/react";

import { Barber } from "./manage-roster-dialog";

interface ReportsDialogProps {
  barbers: Barber[];
  servedToday: number;
  estimatedWait: number;
  totalQueue: number;
  trigger?: React.ReactNode;
}

export function ReportsDialog({
  barbers,
  servedToday,
  estimatedWait,
  totalQueue,
  trigger,
}: ReportsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mock hourly data for the chart
  const hourlyData = [
    { hour: "9 AM", count: 8 },
    { hour: "10 AM", count: 15 },
    { hour: "11 AM", count: 22 },
    { hour: "12 PM", count: 18 },
    { hour: "1 PM", count: 12 },
    { hour: "2 PM", count: 14 },
    { hour: "3 PM", count: 20 },
    { hour: "4 PM", count: 25 },
  ];

  const maxHourlyCount = Math.max(...hourlyData.map((d) => d.count), 1);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="w-full border-[#4e4637] bg-transparent text-[#ebe1d6] hover:bg-[#2e2922] font-heading tracking-wider text-sm h-11 flex items-center justify-center gap-2 rounded-none"
          >
            <ChartBar size={18} />
            VIEW FULL REPORTS
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl border border-[#4e4637] bg-[#1f1b14] text-[#ebe1d6] p-6 rounded-none">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c] flex items-center gap-2">
            <ChartBar size={20} />
            Lounge Analytics & Reports
          </DialogTitle>
          <DialogDescription className="text-xs text-[#d2c5b1]">
            Real-time shop statistics, queue velocity, and master barber session breakdowns.
          </DialogDescription>
        </DialogHeader>

        {/* Top summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-[#17130c] border border-[#4e4637] p-3 text-center">
            <div className="text-[#9b8f7d] text-[10px] uppercase font-semibold tracking-wider flex items-center justify-center gap-1">
              <Users size={12} className="text-[#f0bf5c]" />
              Queue
            </div>
            <div className="text-lg font-bold font-heading text-[#ebe1d6] mt-1">{totalQueue}</div>
          </div>
          <div className="bg-[#17130c] border border-[#4e4637] p-3 text-center">
            <div className="text-[#9b8f7d] text-[10px] uppercase font-semibold tracking-wider flex items-center justify-center gap-1">
              <Clock size={12} className="text-[#f0bf5c]" />
              Avg Wait
            </div>
            <div className="text-lg font-bold font-heading text-[#ebe1d6] mt-1">{estimatedWait}m</div>
          </div>
          <div className="bg-[#17130c] border border-[#4e4637] p-3 text-center">
            <div className="text-[#9b8f7d] text-[10px] uppercase font-semibold tracking-wider flex items-center justify-center gap-1">
              <Lightning size={12} className="text-[#f0bf5c]" />
              Served
            </div>
            <div className="text-lg font-bold font-heading text-[#ebe1d6] mt-1">{servedToday}</div>
          </div>
          <div className="bg-[#17130c] border border-[#4e4637] p-3 text-center">
            <div className="text-[#9b8f7d] text-[10px] uppercase font-semibold tracking-wider flex items-center justify-center gap-1">
              <TrendUp size={12} className="text-[#f0bf5c]" />
              Rate
            </div>
            <div className="text-lg font-bold font-heading text-[#ebe1d6] mt-1">94%</div>
          </div>
        </div>

        {/* Chart 1: Hourly Queue Velocity */}
        <div className="bg-[#17130c] border border-[#4e4637] p-4 mb-6">
          <h4 className="text-[11px] uppercase tracking-wider text-[#f0bf5c] font-semibold mb-4 flex items-center gap-1.5">
            Hourly Queue Volume
          </h4>
          <div className="h-32 flex items-end gap-2 pt-2 border-b border-l border-[#4e4637]/50 pb-1 pl-2">
            {hourlyData.map((d) => {
              const heightPct = (d.count / maxHourlyCount) * 100;
              return (
                <div key={d.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full relative flex items-end justify-center h-24">
                    {/* Tooltip showing on hover */}
                    <div className="absolute -top-6 bg-[#2e2922] text-[#f0bf5c] text-[10px] py-0.5 px-1.5 border border-[#4e4637] opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none">
                      {d.count}
                    </div>
                    {/* SVG/CSS Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-[#c89b3c]/50 to-[#f0bf5c] hover:brightness-110 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-[9px] text-[#9b8f7d] font-mono tracking-tighter mt-1">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Barber Session Distribution */}
        <div className="bg-[#17130c] border border-[#4e4637] p-4">
          <h4 className="text-[11px] uppercase tracking-wider text-[#f0bf5c] font-semibold mb-4 flex items-center gap-1.5">
            <Scissors size={14} /> Barber Performance Today
          </h4>
          <div className="space-y-3">
            {barbers.map((b) => {
              const sessions = b.sessions || 0;
              const maxSessions = Math.max(...barbers.map((x) => x.sessions || 0), 1);
              const widthPct = (sessions / maxSessions) * 100;
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium">{b.name} <span className="text-[#9b8f7d] text-[9px]">({b.rank})</span></span>
                    <span className="font-bold text-[#f0bf5c]">{sessions} sessions</span>
                  </div>
                  <div className="h-2 bg-[#231f18] border border-[#4e4637]/30 w-full relative">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-gradient-to-r from-[#891c22] to-[#f0bf5c]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
