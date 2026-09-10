"use client";

import { useState, useTransition } from "react";
import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";

import { createService, deleteService, toggleServiceActive, updateService } from "@/app/admin/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminServiceDTO } from "@/lib/queries/admin-management";
import type { ServiceCategory } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const categories: ServiceCategory[] = ["Haircut", "Beard", "Shave", "Treatment", "Combo"];
type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | ServiceCategory;
const emptyDraft = {
  name: "",
  price: "",
  duration: "",
  description: "",
  category: "Haircut" as ServiceCategory,
};

function dollarsToCents(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  return Math.round(Number(normalized || "0") * 100);
}

function minutesFromDuration(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 30;
}

export function ServicesClient({ services }: { services: AdminServiceDTO[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [draft, setDraft] = useState(emptyDraft);
  const [createDraft, setCreateDraft] = useState(emptyDraft);

  const filteredServices = services.filter((service) => {
    const normalized = query.trim().toLowerCase();
    const matchesSearch =
      !normalized ||
      service.name.toLowerCase().includes(normalized) ||
      service.category.toLowerCase().includes(normalized) ||
      service.description.toLowerCase().includes(normalized) ||
      service.price.toLowerCase().includes(normalized) ||
      service.duration.toLowerCase().includes(normalized);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && service.isActive) ||
      (statusFilter === "inactive" && !service.isActive);

    const matchesType = typeFilter === "all" || service.category === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const run = (action: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        setEditingId(null);
        setDraft(emptyDraft);
      } else {
        toast.error(result.message);
      }
    });
  };

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createService({
        name: createDraft.name,
        description: createDraft.description,
        category: createDraft.category,
        priceCents: dollarsToCents(createDraft.price),
        durationMinutes: minutesFromDuration(createDraft.duration),
      });

      if (result.ok) {
        toast.success(result.message);
        setCreateDraft(emptyDraft);
        setIsCreateOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  const startEdit = (service: AdminServiceDTO) => {
    setEditingId(service.id);
    setDraft({
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description,
      category: service.category,
    });
  };

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" theme="dark" closeButton richColors />

      <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg space-y-5">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">Service Catalogue</h3>
          <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Create and manage services stored in Supabase</p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px] xl:max-w-4xl xl:flex-1">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services..."
              className="h-10 bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none text-xs"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none text-xs uppercase tracking-wider"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="h-10 bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none text-xs uppercase tracking-wider"
            >
              <option value="all">All Types</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 bg-[#f0bf5c] text-[#412d00] font-heading text-xs tracking-wider px-4 flex items-center justify-center gap-1.5 uppercase"
          >
            <Plus size={14} weight="bold" /> Create Service
          </button>
        </div>

        <div className="text-[10px] uppercase tracking-wider text-[#9b8f7d]">
          Showing <span className="font-bold text-[#f0bf5c]">{filteredServices.length}</span> of {services.length} services
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl border border-[#4e4637]/50 bg-[#231f18] text-[#ebe1d6] p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-[#f0bf5c]">
              Create Service
            </DialogTitle>
            <DialogDescription className="text-[#9b8f7d]">
              Add a new service to the public catalogue.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <input required value={createDraft.name} onChange={(e) => setCreateDraft({ ...createDraft, name: e.target.value })} placeholder="Service name" className="bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none" />
              <select value={createDraft.category} onChange={(e) => setCreateDraft({ ...createDraft, category: e.target.value as ServiceCategory })} className="bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none">
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <input required value={createDraft.price} onChange={(e) => setCreateDraft({ ...createDraft, price: e.target.value })} placeholder="35.00" className="bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none" />
              <input required value={createDraft.duration} onChange={(e) => setCreateDraft({ ...createDraft, duration: e.target.value })} placeholder="30 mins" className="bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none" />
            </div>
            <textarea value={createDraft.description} onChange={(e) => setCreateDraft({ ...createDraft, description: e.target.value })} placeholder="Description" className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-3 py-2 outline-none resize-none text-xs" rows={3} />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="border border-[#4e4637] text-[#ebe1d6] font-heading text-xs tracking-wider px-4 py-2 uppercase"
              >
                Cancel
              </button>
              <button disabled={isPending} className="bg-[#f0bf5c] text-[#412d00] font-heading text-xs tracking-wider px-4 py-2 flex items-center justify-center gap-1.5 disabled:opacity-60 uppercase">
                <Plus size={14} weight="bold" /> Create
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredServices.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 border border-[#4e4637]/30 bg-[#17130c]/60 p-10 text-center text-sm text-[#9b8f7d] italic">
            No services match the current search or status filter.
          </div>
        ) : filteredServices.map((service) => {
          const isEditing = editingId === service.id;
          return (
            <div key={service.id} className={cn("border p-5 flex flex-col justify-between min-h-[300px]", service.isActive ? "bg-[#17130c] border-[#4e4637]" : "bg-[#17130c]/30 border-[#4e4637]/25 opacity-70")}>
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#2e2922] border border-[#4e4637] text-[#ebe1d6]">{service.category}</span>
                    <h4 className="font-heading text-xl text-[#f0bf5c] uppercase leading-none mt-1.5">{service.name}</h4>
                  </div>
                  <button onClick={() => run(() => toggleServiceActive(service.id, !service.isActive))} className={cn("text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border", service.isActive ? "border-emerald-500/50 text-emerald-400" : "border-zinc-700 text-zinc-400")}>
                    {service.isActive ? "ACTIVE" : "INACTIVE"}
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-2 text-xs">
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-2 py-1" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-2 py-1" />
                      <input value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} className="bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-2 py-1" />
                    </div>
                    <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] px-2 py-1 resize-none" rows={2} />
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-xs">
                    <p className="text-[#9b8f7d] text-[11px] leading-relaxed min-h-[50px] italic">{service.description}</p>
                    <div className="flex justify-between border-t border-[#4e4637]/10 pt-2 font-semibold"><span className="text-[#9b8f7d] uppercase tracking-wider">Avg Duration</span><span>{service.duration}</span></div>
                    <div className="flex justify-between border-t border-[#4e4637]/10 pt-2 font-semibold"><span className="text-[#9b8f7d] uppercase tracking-wider">Pricing</span><span className="text-[#f0bf5c]">{service.price}</span></div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-3.5 mt-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="text-[10px] text-[#9b8f7d] font-bold uppercase tracking-wider">Cancel</button>
                    <button onClick={() => run(() => updateService(service.id, { name: draft.name, description: draft.description, category: draft.category, priceCents: dollarsToCents(draft.price), durationMinutes: minutesFromDuration(draft.duration) }))} className="text-[10px] text-[#f0bf5c] font-bold uppercase tracking-wider flex items-center gap-1"><Check size={12} /> Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => run(() => deleteService(service.id))} className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1"><Trash size={12} /> Remove</button>
                    <button onClick={() => startEdit(service)} className="text-[10px] text-[#f0bf5c] font-bold uppercase tracking-wider flex items-center gap-1"><PencilSimple size={12} /> Edit</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
