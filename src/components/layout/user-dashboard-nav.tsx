"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/signout/actions";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";

import { usePathname } from "next/navigation";

function UserDashboardNav() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      }
    });
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "My Queue", href: "/user/my-queue" },
    { label: "Barbers", href: "/user/barbers" },
    { label: "Services", href: "/user/services" },
  ];

  const firstName = user?.user_metadata?.first_name || "";
  const lastName = user?.user_metadata?.last_name || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 border-b border-supremo-outline-variant/25 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Link
          href="/"
          className="font-heading text-[30px] uppercase leading-none tracking-[0.04em] text-primary"
        >
          BarberQueue
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-lg font-medium text-supremo-on-surface transition-colors hover:text-primary",
                  isActive && "font-bold text-primary border-b-2 border-primary pb-1"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
              <Avatar
                size="lg"
                className="size-12 border border-primary/50 bg-supremo-surface-container-high shadow-lg shadow-primary/10 transition-colors hover:border-primary"
              >
                <AvatarFallback className="bg-supremo-surface-container-high text-primary font-bold text-sm">
                  {user ? initials : (
                    <svg
                      aria-hidden="true"
                      className="size-8"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 12.25c2.35 0 4.25-1.9 4.25-4.25S14.35 3.75 12 3.75 7.75 5.65 7.75 8 9.65 12.25 12 12.25Z"
                        fill="currentColor"
                      />
                      <path
                        d="M4.75 20.25c.75-4.05 3.38-6.35 7.25-6.35s6.5 2.3 7.25 6.35H4.75Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-supremo-surface-container-high border-supremo-outline-variant/30 text-supremo-on-surface p-1">
            {user && (
              <div className="px-3 py-2.5 border-b border-supremo-outline-variant/20 mb-1">
                <p className="text-[14px] font-bold text-supremo-on-surface leading-tight">
                  {firstName} {lastName}
                </p>
                <p className="text-[12px] text-supremo-on-surface-variant/80 truncate mt-1">
                  {user.email}
                </p>
              </div>
            )}

            
            <DropdownMenuItem
              className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-400/10"
              onClick={() => signOut()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { UserDashboardNav };


