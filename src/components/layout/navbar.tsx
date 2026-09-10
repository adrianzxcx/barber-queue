/**
 * Navbar — components/layout/navbar.tsx
 *
 * Fixed top navigation bar with:
 *  - Brand logo text (BarberQueue)
 *  - Desktop nav links (Home, Services)
 *  - "Join Queue" primary CTA button
 *  - Glassmorphic backdrop blur on scroll
 *
 * Reused across all pages via layout composition.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Navigation link items — single source of truth for both desktop & mobile */
export const NAV_LINKS: { label: string; href: string; active?: boolean }[] = [
  { label: "Home", href: "/", active: true },
  { label: "Services", href: "#services" },
  { label: "AI Style", href: "#ai-style" },
];

export function Navbar() {
  return (
    <header
      id="navbar"
      className="fixed top-0 left-0 w-full z-50 bg-[#17130c]/80 backdrop-blur-md border-b border-[#4e4637]/30 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-5 md:px-10 py-4">
        {/* Brand */}
        <Link
          href="/"
          className="font-[var(--font-bebas)] text-[28px] leading-8 tracking-wider text-[#f0bf5c] uppercase"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          BarberQueue
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[14px] leading-5 font-medium uppercase tracking-[0.05em] transition-colors ${
                link.active
                  ? "text-[#f0bf5c] font-bold"
                  : "text-[#d2c5b1] hover:text-[#f0bf5c]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="hidden bg-[#f0bf5c] text-black font-bold text-[14px] uppercase tracking-[0.05em] px-4 py-1.5 rounded-lg hover:bg-[#f0bf5c]/90 transition-all gold-glow border-none sm:inline-flex"
          >
            <Link href="/auth/login">Join Queue</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="inline-flex size-10 items-center justify-center border border-[#4e4637]/60 bg-[#17130c]/80 text-[#f0bf5c] md:hidden"
                aria-label="Open navigation menu"
              >
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-r border-[#4e4637]/40 bg-[#17130c] p-0 text-[#ebe1d6]">
              <SheetHeader className="border-b border-[#4e4637]/30 p-5">
                <SheetTitle className="font-heading text-3xl uppercase tracking-wider text-[#f0bf5c]">
                  BarberQueue
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-5">
                {NAV_LINKS.map((link) => (
                  <SheetClose key={link.label} asChild>
                    <Link
                      href={link.href}
                      className="border border-transparent px-3 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#d2c5b1] hover:border-[#f0bf5c]/30 hover:bg-[#1e1a12] hover:text-[#f0bf5c]"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/auth/login"
                    className="mt-4 bg-[#f0bf5c] px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-[#412d00]"
                  >
                    Join Queue
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
