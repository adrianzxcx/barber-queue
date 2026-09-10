"use client";

import { useMemo, useState, useTransition } from "react";
import { toast, Toaster } from "sonner";

import { clearActivityLogs } from "@/app/admin/actions";
import type { ActivityLogDTO } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export function LogsClient({ logs }: { logs: ActivityLogDTO[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLogs = useMemo(() => {
    const normalized = query.toLowerCase();
    return logs.filter((log) => {
      return (
        log.name.toLowerCase().includes(normalized) ||
        log.type.toLowerCase().includes(normalized) ||
        log.action.toLowerCase().includes(normalized) ||
        log.details.toLowerCase().includes(normalized) ||
        log.message.toLowerCase().includes(normalized) ||
        log.timestamp.toLowerCase().includes(normalized) ||
        log.date.toLowerCase().includes(normalized)
      );
    });
  }, [logs, query]);

  const clearLogs = () => {
    if (!confirm("Clear activity logs?")) return;
    startTransition(async () => {
      const result = await clearActivityLogs();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  return (
    <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg space-y-6">
      <Toaster position="bottom-right" theme="dark" closeButton richColors />
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#4e4637]/30 pb-4 gap-4">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">Activity Logs</h3>
          <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Persisted customer, barber, and system events</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search logs..."
            className="bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2 outline-none"
          />
          <button
            onClick={clearLogs}
            disabled={isPending}
            className="border border-red-900/50 hover:bg-red-950/10 text-red-400 font-heading tracking-wider py-1.5 px-4 text-xs uppercase cursor-pointer select-none disabled:opacity-60"
          >
            Clear Log History
          </button>
        </div>
      </div>

      <div className="border border-[#4e4637]/20 max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#4e4637]/45 bg-[#17130c] text-[#9b8f7d] font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 min-w-36">Name</th>
              <th className="py-3.5 px-4 w-24 text-center">Type</th>
              <th className="py-3.5 px-4 w-40">Action</th>
              <th className="py-3.5 px-4 min-w-72">Details</th>
              <th className="py-3.5 px-4 w-32">Timestamp</th>
              <th className="py-3.5 px-4 w-32">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4e4637]/15">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#9b8f7d] italic">
                  No activity logs recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1f1b14]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#ebe1d6]">{log.name}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        "inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border",
                        log.type === "barber" && "bg-amber-950/20 border-amber-600/40 text-amber-400",
                        log.type === "customer" && "bg-blue-950/20 border-blue-600/40 text-blue-400",
                        log.type === "system" && "bg-red-950/20 border-red-600/40 text-[#ffb3b0]"
                      )}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#f0bf5c] font-semibold">{log.action}</td>
                  <td className="py-3.5 px-4 text-[#ebe1d6] font-medium">{log.details}</td>
                  <td className="py-3.5 px-4 font-mono text-[#9b8f7d]">{log.timestamp}</td>
                  <td className="py-3.5 px-4 font-mono text-[#9b8f7d]">{log.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
