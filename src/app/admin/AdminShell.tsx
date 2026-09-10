"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowsClockwise,
  Gear,
  List,
  Scissors,
  SignOut,
  Tag,
  Users,
} from "@phosphor-icons/react";

import { signOut } from "@/app/auth/signout/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ShopSettingsDTO } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  user: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  settings: ShopSettingsDTO;
}

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

const navItems = [
  { id: "dashboard", label: "DASHBOARD HUB", icon: Users },
  { id: "logs", label: "CUSTOMER & BARBER LOGS", icon: ArrowsClockwise },
  { id: "profiles", label: "BARBER STAFF PROFILES", icon: Scissors },
  { id: "services", label: "MANAGE SERVICES", icon: Tag },
  { id: "settings", label: "SYSTEM SETTINGS", icon: Gear },
];

export function AdminShell({ children, user, settings }: AdminShellProps) {
  const pathname = usePathname();
  const firstName = user?.firstName || "Admin";
  const lastName = user?.lastName || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "A";

  return (
    <div className="flex min-h-screen bg-[#17130c] text-[#ebe1d6] font-sans">
      <aside className="hidden lg:flex flex-col w-[260px] border-r border-[#4e4637]/30 bg-[#13100a] shrink-0 p-5 justify-between">
        <div className="space-y-8">
          <div className="py-2 border-b border-[#4e4637]/20">
            <h1 className="font-heading text-[32px] uppercase leading-none tracking-[0.06em] text-[#f0bf5c]">
              BARBERQUEUE
            </h1>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#1e1a12] border border-[#4e4637]/20">
            <div className="size-10 rounded-none bg-[#f0bf5c] flex items-center justify-center text-[#412d00] font-heading font-bold text-lg">
              SL
            </div>
            <div>
              <h2 className="font-bold text-xs leading-none">Supremo Lounge</h2>
              <span className="text-[10px] uppercase font-semibold text-[#f0bf5c] tracking-widest mt-1 block">
                PREMIUM ADMIN
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const targetPath = `/admin/${tab.id}`;
              const isActive = pathname === targetPath;
              return (
                <Link
                  key={tab.id}
                  href={targetPath}
                  className={cn(
                    "flex items-center gap-4 px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 border-r-2 border-transparent text-[#9b8f7d] hover:text-[#ebe1d6] hover:bg-[#1e1a12]/50 text-left rounded-none",
                    isActive && "text-[#f0bf5c] bg-[#1e1a12] border-r-2 border-[#f0bf5c] font-bold"
                  )}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} className={isActive ? "text-[#f0bf5c]" : ""} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#4e4637]/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-none border border-[#f0bf5c]/30 overflow-hidden relative bg-[#2e2922]">
              <img src={portraitImage} alt="Admin" className="object-cover w-full h-full" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#ebe1d6]">Admin</div>
              <button
                onClick={() => signOut()}
                className="text-[10px] text-[#9b8f7d] hover:text-[#f0bf5c] uppercase font-semibold tracking-wider flex items-center gap-1 mt-0.5"
              >
                <SignOut size={10} />
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="flex h-20 items-center justify-between border-b border-[#4e4637]/30 px-6 bg-[#1a160f]/90 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="inline-flex size-10 items-center justify-center border border-[#4e4637]/60 bg-[#17130c] text-[#f0bf5c] lg:hidden"
                  aria-label="Open admin navigation"
                >
                  <List size={22} weight="bold" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] border-r border-[#4e4637]/40 bg-[#13100a] p-0 text-[#ebe1d6]">
                <SheetHeader className="border-b border-[#4e4637]/30 p-5">
                  <SheetTitle className="font-heading text-3xl uppercase tracking-wider text-[#f0bf5c]">
                    BarberQueue
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-5 p-5">
                  <div className="flex items-center gap-3 bg-[#1e1a12] border border-[#4e4637]/20 p-3">
                    <div className="size-10 bg-[#f0bf5c] flex items-center justify-center text-[#412d00] font-heading font-bold text-lg">
                      SL
                    </div>
                    <div>
                      <h2 className="font-bold text-xs leading-none">Supremo Lounge</h2>
                      <span className="text-[10px] uppercase font-semibold text-[#f0bf5c] tracking-widest mt-1 block">
                        PREMIUM ADMIN
                      </span>
                    </div>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {navItems.map((tab) => {
                      const Icon = tab.icon;
                      const targetPath = `/admin/${tab.id}`;
                      const isActive = pathname === targetPath;
                      return (
                        <SheetClose key={tab.id} asChild>
                          <Link
                            href={targetPath}
                            className={cn(
                              "flex items-center gap-4 border border-transparent px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition-all text-[#9b8f7d] hover:text-[#ebe1d6] hover:bg-[#1e1a12]/50",
                              isActive && "text-[#f0bf5c] bg-[#1e1a12] border-[#f0bf5c]/30 font-bold"
                            )}
                          >
                            <Icon size={16} weight={isActive ? "fill" : "regular"} />
                            {tab.label}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-2 border border-red-500/25 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-red-400"
                  >
                    <SignOut size={14} />
                    Sign out
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c] flex items-center gap-3 sm:text-2xl">
              ADMIN CONTROL PANEL
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-none font-sans shrink-0",
                  settings.shopIsOpen
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-red-950/20 border-red-900/45 text-red-400"
                )}
              >
                {settings.shopIsOpen ? "Store Open" : "Store Closed"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-5">

            <div className="flex items-center gap-3 border-l border-[#4e4637]/30 pl-5">
              <span className="text-xs font-semibold text-[#d2c5b1] hidden sm:block">Admin</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                    <Avatar className="size-10 border border-primary/50 bg-[#231f18] shadow-lg shadow-primary/10 transition-colors hover:border-primary">
                      <AvatarFallback className="bg-[#231f18] text-primary font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1f1b14] border-[#4e4637] text-[#ebe1d6] p-1 rounded-none shadow-xl">
                  <div className="px-3 py-2.5 border-b border-[#4e4637]/40 mb-1">
                    <p className="text-[12px] font-bold text-[#ebe1d6] leading-tight">
                      {firstName} {lastName}
                    </p>
                    <p className="text-[10px] text-[#9b8f7d] truncate mt-1">
                      {user?.email || "admin@barberqueue.com"}
                    </p>
                  </div>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-400/10 rounded-none text-xs font-bold uppercase tracking-wider p-2"
                    onClick={() => signOut()}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
