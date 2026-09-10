"use client";

import { useState, useTransition } from "react";
import { toast, Toaster } from "sonner";

import { updateShopSettings } from "@/app/admin/actions";
import type { ShopSettingsDTO } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export function SettingsClient({ settings }: { settings: ShopSettingsDTO }) {
  const [isPending, startTransition] = useTransition();
  const [shopIsOpen, setShopIsOpen] = useState(settings.shopIsOpen);
  const [skipExpirySeconds, setSkipExpirySeconds] = useState(settings.skipExpirySeconds);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);

  const save = (next = { shopIsOpen, skipExpirySeconds, soundEnabled }) => {
    startTransition(async () => {
      const result = await updateShopSettings(next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  return (
    <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg max-w-xl space-y-6">
      <Toaster position="bottom-right" theme="dark" closeButton richColors />
      <div>
        <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">System Settings</h3>
        <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Persisted shop settings for queue operations</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#4e4637]/20">
          <div>
            <h4 className="text-xs font-bold text-[#ebe1d6] uppercase tracking-wider">Shop Operating Status</h4>
            <p className="text-[10px] text-[#9b8f7d] mt-1">Controls whether customers can join the queue.</p>
          </div>
          <button
            disabled={isPending}
            onClick={() => {
              const next = { shopIsOpen: !shopIsOpen, skipExpirySeconds, soundEnabled };
              setShopIsOpen(next.shopIsOpen);
              save(next);
            }}
            className={cn(
              "border text-[10px] font-bold uppercase tracking-wider px-4 py-2 transition-all cursor-pointer select-none disabled:opacity-60",
              shopIsOpen ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-red-900 text-red-400 bg-red-950/20"
            )}
          >
            {shopIsOpen ? "Store Open" : "Store Closed"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase font-bold tracking-wider text-[#ebe1d6] block">
            Skipped Ticket Expiration Limit
          </label>
          <div className="flex items-center gap-3">
            <select
              value={skipExpirySeconds}
              onChange={(event) => setSkipExpirySeconds(Number(event.target.value))}
              className="bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2.5 outline-none w-44 rounded-none"
            >
              <option value={10}>10 Seconds</option>
              <option value={30}>30 Seconds</option>
              <option value={60}>1 Minute</option>
              <option value={300}>5 Minutes</option>
              <option value={900}>15 Minutes</option>
              <option value={1800}>30 Minutes</option>
            </select>
            <button onClick={() => save()} disabled={isPending} className="bg-[#f0bf5c] text-[#412d00] font-heading text-xs tracking-wider px-4 py-2 disabled:opacity-60">
              SAVE TIMER
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-4">
          <div>
            <h4 className="text-xs font-bold text-[#ebe1d6]">Acoustic Chime Announcements</h4>
            <p className="text-[10px] text-[#9b8f7d]">Stored setting for call announcements.</p>
          </div>
          <button
            disabled={isPending}
            onClick={() => {
              const next = { shopIsOpen, skipExpirySeconds, soundEnabled: !soundEnabled };
              setSoundEnabled(next.soundEnabled);
              save(next);
            }}
            className={cn(
              "border text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 cursor-pointer select-none disabled:opacity-60",
              soundEnabled ? "border-[#f0bf5c] text-[#f0bf5c]" : "border-[#4e4637] text-[#9b8f7d]"
            )}
          >
            {soundEnabled ? "Enabled" : "Muted"}
          </button>
        </div>
      </div>
    </div>
  );
}
