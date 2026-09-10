"use client";

import { useState, useTransition } from "react";
import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";

import { createBarber, deactivateBarber, updateBarber, updateBarberShiftStatus } from "@/app/admin/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AdminBarberDTO } from "@/lib/queries/admin-management";
import { cn } from "@/lib/utils";

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

export function ProfilesClient({ barbers }: { barbers: AdminBarberDTO[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", specialty: "", rank: "Junior" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingBarber, setRemovingBarber] = useState<AdminBarberDTO | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const run = (action: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        setEditingId(null);
        setDraft({ name: "", specialty: "", rank: "Junior" });
        setIsModalOpen(false);
        setRemovingBarber(null);
        setConfirmName("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(() => createBarber(draft));
  };

  const startEdit = (barber: AdminBarberDTO) => {
    setEditingId(barber.id);
    setDraft({ name: barber.name, specialty: barber.specialty, rank: barber.rank });
  };

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" theme="dark" closeButton richColors />

      <div className="flex items-center justify-between gap-4 border-b border-[#4e4637]/30 pb-4">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">Staff Profiles</h3>
          <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Manage barber profiles and shift status from Supabase</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setDraft({ name: "", specialty: "", rank: "Junior" });
          }
        }}>
          <DialogTrigger asChild>
            <button className="bg-[#f0bf5c] text-[#412d00] hover:bg-[#d6a543] font-heading text-xs font-bold tracking-wider px-4 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200">
              <Plus size={14} weight="bold" /> REGISTER NEW BARBER
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1f1b14] border-[#4e4637] text-[#ebe1d6] max-w-md p-6 rounded-none">
            <DialogHeader className="border-b border-[#4e4637]/30 pb-3 mb-4">
              <DialogTitle className="font-heading text-lg uppercase tracking-wider text-[#f0bf5c]">Register New Barber</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#9b8f7d]">Full Name / Alias</label>
                <input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Johnny Blades" className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 text-xs outline-none focus:border-[#f0bf5c]" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#4e4637]/30 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs text-[#9b8f7d] hover:text-[#ebe1d6] font-bold uppercase tracking-wider px-3 py-2">Cancel</button>
                <button type="submit" disabled={isPending} className="bg-[#f0bf5c] text-[#412d00] hover:bg-[#d6a543] font-heading text-xs font-bold tracking-wider px-4 py-2 disabled:opacity-60 cursor-pointer">
                  {isPending ? "REGISTERING..." : "REGISTER BARBER"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {barbers.map((barber) => {
          const isEditing = editingId === barber.id;
          const statusLabel =
            barber.status === "busy" ? "BUSY" : barber.status === "available" ? "VACANT" : "UNAVAILABLE";

          return (
            <div key={barber.id} className="bg-[#17130c] border border-[#4e4637] p-5 flex flex-col justify-between min-h-[280px]">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-14 overflow-hidden border border-[#f0bf5c] bg-[#1e1a12]">
                    <img src={portraitImage} alt={barber.name} className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-heading text-xl text-[#f0bf5c] leading-none uppercase">{barber.name}</h4>
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center border px-2 py-1 text-[9px] font-black uppercase tracking-widest",
                        barber.status === "available" &&
                          "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                        barber.status === "busy" &&
                          "border-orange-500/40 bg-orange-500/10 text-orange-400",
                        barber.status === "unavailable" &&
                          "border-[#4e4637] bg-[#231f18] text-[#9b8f7d]"
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2 text-xs">
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-2 py-1" />
                  </div>
                ) : (
                  <div className="space-y-2 text-xs pt-1.5">
                    <div className="flex justify-between py-1.5"><span className="text-[#9b8f7d] uppercase tracking-wider">Serving</span><span className="font-bold text-[#f0bf5c]">{barber.currentServing ?? "None"}</span></div>
                    <div className="flex justify-between py-1.5 border-t border-[#4e4637]/10"><span className="text-[#9b8f7d] uppercase tracking-wider">Served Today</span><span className="font-bold text-[#ebe1d6]">{barber.sessions} {barber.sessions === 1 ? "customer" : "customers"}</span></div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-4 mt-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="text-xs text-[#9b8f7d] font-bold uppercase tracking-wider">Cancel</button>
                    <button onClick={() => run(() => updateBarber(barber.id, draft))} className="text-xs text-[#f0bf5c] font-bold uppercase tracking-wider flex items-center gap-1"><Check size={14} /> Save</button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={barber.status === "unavailable" ? "unavailable" : "available"}
                        onChange={(e) => {
                          const val = e.target.value as "available" | "unavailable";
                          run(() => updateBarberShiftStatus(barber.id, val));
                        }}
                        className={cn(
                          "bg-[#17130c] border text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 outline-none rounded-none cursor-pointer transition-colors duration-150",
                          barber.status !== "unavailable" && "border-emerald-600/50 text-emerald-400 hover:border-emerald-500",
                          barber.status === "unavailable" && "border-[#4e4637] text-[#9b8f7d] hover:border-[#ebe1d6]/30"
                        )}
                      >
                        <option value="available" className="bg-[#1f1b14] text-emerald-400">Available</option>
                        <option value="unavailable" className="bg-[#1f1b14] text-[#9b8f7d]">Unavailable</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(barber)} className="text-xs text-[#f0bf5c] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"><PencilSimple size={14} /> Edit</button>
                      
                      <button
                        onClick={() => {
                          setRemovingBarber(barber);
                          setConfirmName("");
                        }}
                        className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-red-300"
                      >
                        <Trash size={14} /> Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={removingBarber !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingBarber(null);
            setConfirmName("");
          }
        }}
      >
        <DialogContent className="bg-[#1f1b14] border-[#4e4637] text-[#ebe1d6] max-w-md p-6 rounded-none">
          <DialogHeader className="border-b border-[#4e4637]/30 pb-3 mb-4">
            <DialogTitle className="font-heading text-lg uppercase tracking-wider text-red-400">
              Confirm Barber Removal
            </DialogTitle>
          </DialogHeader>
          {removingBarber && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (confirmName === removingBarber.name) {
                  run(() => deactivateBarber(removingBarber.id));
                }
              }}
              className="space-y-4"
            >
              <p className="text-xs text-[#9b8f7d] leading-relaxed">
                Are you sure you want to deactivate and remove <strong>{removingBarber.name}</strong> from the active staff roster? This action will set their status to offline.
              </p>
              
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#9b8f7d] block">
                  Please type the barber{"'"}s name to confirm: <span className="text-[#f0bf5c] font-mono">{removingBarber.name}</span>
                </label>
                <input
                  required
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Type name here"
                  className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 text-xs outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#4e4637]/30 mt-4">
                <button
                  type="button"
                  onClick={() => setRemovingBarber(null)}
                  className="text-xs text-[#9b8f7d] hover:text-[#ebe1d6] font-bold uppercase tracking-wider px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || confirmName !== removingBarber.name}
                  className="bg-red-600 hover:bg-red-500 text-white font-heading text-xs font-bold tracking-wider px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
                >
                  {isPending ? "DEACTIVATING..." : "CONFIRM REMOVAL"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
