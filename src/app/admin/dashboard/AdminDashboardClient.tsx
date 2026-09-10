"use client";

import { useState, useTransition } from "react";
import { toast, Toaster } from "sonner";

import { updateShopSettings } from "@/app/admin/actions";
import {
  callNextForBarber,
  clearExpiredTicket,
  clearExpiredTickets,
  completeTicket,
  expireTicket,
} from "@/app/admin/dashboard/actions";
import type { Barber } from "@/components/admin/manage-roster-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { DashboardTab, type QueueItem } from "./dashboard/DashboardTab";

interface AdminDashboardClientProps {
  queue: QueueItem[];
  barbers: Barber[];
  servedToday: number;
  settings: {
    shopIsOpen: boolean;
    skipExpiryDuration: number;
    skipExpirySeconds: number;
    soundEnabled: boolean;
  };
}

export function AdminDashboardClient({
  queue,
  barbers,
  servedToday,
  settings,
}: AdminDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [shopIsOpen, setShopIsOpen] = useState(settings.shopIsOpen);
  const [callNextBarberName, setCallNextBarberName] = useState<string | null>(null);
  const [removeCustomer, setRemoveCustomer] = useState<QueueItem | null>(null);

  const runAction = (action: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const getTicketId = (ticket: QueueItem | string) => {
    if (typeof ticket === "string") {
      return queue.find((item) => item.id === ticket || item.ticketId === ticket)?.ticketId ?? ticket;
    }

    return ticket.ticketId ?? ticket.id;
  };

  const callNextCustomer = callNextBarberName
    ? [...queue]
        .filter(
          (item) =>
            item.status === "waiting" &&
            (!item.preferredBarber || item.preferredBarber === callNextBarberName)
        )
        .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))[0] ?? null
    : null;

  const confirmCallNext = () => {
    if (!callNextBarberName || !callNextCustomer) return;
    const barberName = callNextBarberName;
    setCallNextBarberName(null);
    runAction(() => callNextForBarber(barberName));
  };

  const openRemoveCustomerModal = (customerId: string) => {
    const customer = queue.find((item) => item.id === customerId || item.ticketId === customerId);
    if (!customer) {
      toast.error("Customer was not found in the active queue.");
      return;
    }

    setRemoveCustomer(customer);
  };

  const confirmRemoveCustomer = () => {
    if (!removeCustomer) return;
    const ticketId = getTicketId(removeCustomer);
    setRemoveCustomer(null);
    runAction(() => expireTicket(ticketId));
  };

  return (
    <>
      <Toaster position="bottom-right" theme="dark" closeButton richColors />
      <DashboardTab
        queue={queue}
        barbers={barbers}
        servedToday={servedToday}
        settings={{ ...settings, shopIsOpen }}
        handleToggleShopStatus={() => {
          const nextIsOpen = !shopIsOpen;
          setShopIsOpen(nextIsOpen);
          runAction(async () => {
            const result = await updateShopSettings({
              shopIsOpen: nextIsOpen,
              skipExpirySeconds: settings.skipExpirySeconds,
              soundEnabled: settings.soundEnabled,
            });
            if (!result.ok) setShopIsOpen(!nextIsOpen);
            return result;
          });
        }}
        handleExpireCustomer={openRemoveCustomerModal}
        handleDeleteExpiredCustomer={(customerId) => runAction(() => clearExpiredTicket(getTicketId(customerId)))}
        handleClearAllExpired={() => runAction(() => clearExpiredTickets())}
        handleCallNextForBarber={(barberName) => setCallNextBarberName(barberName)}
        handleCompleteCustomer={(customerId) => runAction(() => completeTicket(getTicketId(customerId)))}
      />
      <Dialog open={Boolean(callNextBarberName)} onOpenChange={(open) => !open && setCallNextBarberName(null)}>
        <DialogContent className="max-w-md border border-[#4e4637] bg-[#1f1b14] p-6 text-[#ebe1d6]">
          <DialogHeader className="border-b border-[#4e4637]/30 pb-4">
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-[#f0bf5c]">
              Call Next Customer
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">
              Confirm queue assignment before notifying the next customer.
            </DialogDescription>
          </DialogHeader>

          <div className="border border-[#4e4637]/40 bg-[#17130c] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">
              Barber
            </p>
            <p className="mt-1 font-heading text-3xl uppercase tracking-wider text-[#ebe1d6]">
              {callNextBarberName}
            </p>
            <div className="mt-4 border-t border-[#4e4637]/30 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">
                Next Customer
              </p>
              {callNextCustomer ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-[#ebe1d6]">
                      {callNextCustomer.customer}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#9b8f7d]">
                      Ticket #{callNextCustomer.id} · {callNextCustomer.preferredBarber ? "Specific queue" : "General queue"}
                    </p>
                  </div>
                  <span className="border border-[#f0bf5c]/35 bg-[#f0bf5c]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#f0bf5c]">
                    {callNextCustomer.wait}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-[#ffb3b0]">
                  No eligible waiting customer is available for this barber.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCallNextBarberName(null)}
              className="border border-[#4e4637] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#9b8f7d] transition-all hover:border-[#ebe1d6]/50 hover:text-[#ebe1d6]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCallNext}
              disabled={isPending || !callNextCustomer}
              className="bg-[#f0bf5c] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#412d00] transition-all hover:bg-[#c89b3c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Calling..." : "Confirm Call"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(removeCustomer)} onOpenChange={(open) => !open && setRemoveCustomer(null)}>
        <DialogContent className="max-w-md border border-[#4e4637] bg-[#1f1b14] p-6 text-[#ebe1d6]">
          <DialogHeader className="border-b border-[#4e4637]/30 pb-4">
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-red-400">
              Remove Customer
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">
              This will move the customer to missed appointments.
            </DialogDescription>
          </DialogHeader>

          <div className="border border-red-950/40 bg-[#17130c] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">
              Customer
            </p>
            <p className="mt-1 text-xl font-black text-[#ebe1d6]">
              {removeCustomer?.customer}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#4e4637]/30 pt-4 text-[10px] uppercase tracking-wider">
              <div>
                <p className="font-semibold text-[#9b8f7d]">Ticket</p>
                <p className="mt-1 font-black text-[#f0bf5c]">#{removeCustomer?.id}</p>
              </div>
              <div>
                <p className="font-semibold text-[#9b8f7d]">Queue</p>
                <p className="mt-1 font-black text-[#ebe1d6]">
                  {removeCustomer?.preferredBarber ? "Specific" : "General"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#9b8f7d]">Wait</p>
                <p className="mt-1 font-black text-[#f0bf5c]">{removeCustomer?.wait}</p>
              </div>
              <div>
                <p className="font-semibold text-[#9b8f7d]">Barber</p>
                <p className="mt-1 font-black text-[#ebe1d6]">
                  {removeCustomer?.preferredBarber ?? "Any"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRemoveCustomer(null)}
              className="border border-[#4e4637] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#9b8f7d] transition-all hover:border-[#ebe1d6]/50 hover:text-[#ebe1d6]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRemoveCustomer}
              disabled={isPending || !removeCustomer}
              className="border border-red-500/40 bg-red-950/30 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-red-300 transition-all hover:bg-red-950/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Removing..." : "Confirm Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
