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
import { Input } from "@/components/ui/input";
import { UserPlus, Scissors, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface Barber {
  name: string;
  specialty: string;
  rank: string;
  status: "available" | "busy" | "unavailable";
  sessions: number;
  currentServing?: string | null;
  imagePosition?: string;
}

interface ManageRosterDialogProps {
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  handleToggleBarberShift?: (barberName: string) => void;
  trigger?: React.ReactNode;
}

export function ManageRosterDialog({
  barbers,
  setBarbers,
  handleToggleBarberShift,
  trigger,
}: ManageRosterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [rank, setRank] = useState("Junior");
  const [error, setError] = useState("");

  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    const exists = barbers.some(
      (b) => b.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      setError("A barber with this name already exists.");
      return;
    }

    const newBarber: Barber = {
      name: name.trim(),
      specialty: specialty.trim(),
      rank,
      status: "available",
      sessions: 0,
      currentServing: null,
      imagePosition: "50% 50%",
    };

    setBarbers((prev) => [...prev, newBarber]);
    setName("");
    setSpecialty("");
    setRank("Junior");
    setError("");
  };

  const handleRemoveBarber = (barberName: string) => {
    setBarbers((prev) => prev.filter((b) => b.name !== barberName));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading tracking-wider text-sm h-11 flex items-center justify-center gap-2 rounded-none">
            <UserPlus size={18} weight="bold" />
            MANAGE ROSTER
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md border border-[#4e4637] bg-[#1f1b14] text-[#ebe1d6] p-6 rounded-none">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c] flex items-center gap-2">
            <Scissors size={20} />
            Manage Barber Roster
          </DialogTitle>
          <DialogDescription className="text-xs text-[#d2c5b1]">
            Add new craftspeople or review the current team active on the shop floor.
          </DialogDescription>
        </DialogHeader>

        {/* List of Barbers */}
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 mb-6 border-b border-[#4e4637] pb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">Current Staff</h4>
          {barbers.length === 0 ? (
            <p className="text-xs text-[#9b8f7d] italic py-2">No barbers registered.</p>
          ) : (
            barbers.map((barber) => (
              <div
                key={barber.name}
                className="flex items-center justify-between p-2.5 bg-[#17130c] border border-[#4e4637] text-xs"
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    {barber.name}
                    <span className="text-[10px] px-1 bg-[#2e2922] text-[#d2c5b1] border border-[#4e4637]">
                      {barber.rank}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9b8f7d]">
                    {barber.specialty}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      barber.status === "available" && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
                      barber.status === "busy" && "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]",
                      barber.status === "unavailable" && "bg-zinc-600"
                    )}
                    title={barber.status}
                  />
                  {handleToggleBarberShift && (
                    <button
                      onClick={() => handleToggleBarberShift(barber.name)}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-none transition-all select-none cursor-pointer",
                        barber.status === "unavailable"
                          ? "border-[#f0bf5c] text-[#f0bf5c] hover:bg-[#f0bf5c]/10"
                          : "border-red-900/50 bg-red-950/10 text-red-400 hover:bg-[#891c22]/20"
                      )}
                    >
                      {barber.status === "unavailable" ? "Log In" : "Log Out"}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveBarber(barber.name)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1 cursor-pointer"
                    title="Remove Barber"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Barber Form */}
        <form onSubmit={handleAddBarber} className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9b8f7d]">Register New Barber</h4>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="barber-name" className="text-[11px] uppercase tracking-wider text-[#9b8f7d] font-medium block">
                Full Name / Alias
              </label>
              <Input
                id="barber-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johnny 'The Clipper'"
                className="bg-[#17130c] border-[#4e4637] text-[#ebe1d6] h-9 focus-visible:ring-[#f0bf5c] focus-visible:border-[#f0bf5c] rounded-none text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="barber-spec" className="text-[11px] uppercase tracking-wider text-[#9b8f7d] font-medium block">
                Specialty Cut
              </label>
              <Input
                id="barber-spec"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Classic Taper & Hot Towel"
                className="bg-[#17130c] border-[#4e4637] text-[#ebe1d6] h-9 focus-visible:ring-[#f0bf5c] focus-visible:border-[#f0bf5c] rounded-none text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="barber-rank" className="text-[11px] uppercase tracking-wider text-[#9b8f7d] font-medium block">
                Rank Level
              </label>
              <select
                id="barber-rank"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full bg-[#17130c] border border-[#4e4637] text-[#ebe1d6] h-9 px-3 focus-visible:ring-[#f0bf5c] focus-visible:border-[#f0bf5c] rounded-none text-xs outline-none"
              >
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Master">Master</option>
                <option value="Artisan">Artisan</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading tracking-wider h-9 rounded-none text-xs mt-2"
          >
            ADD TO ROSTER
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
