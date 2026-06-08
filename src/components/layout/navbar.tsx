/**
 * Navbar — components/layout/navbar.tsx
 *
 * Fixed top navigation bar with:
 *  - Brand logo text (BarberQueue)
 *  - Desktop nav links (Home, Queue, Barbers, AI Styles)
 *  - "Join Queue" primary CTA button
 *  - Glassmorphic backdrop blur on scroll
 *
 * Reused across all pages via layout composition.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Navigation link items — single source of truth for both desktop & mobile */
export const NAV_LINKS: { label: string; href: string; active?: boolean }[] = [
  { label: "Home", href: "/", active: true },
  { label: "Services", href: "#services" },
  { label: "Queue", href: "#" },
  { label: "Barbers", href: "#" },
  { label: "AI Styles", href: "#" },
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
            className="bg-[#f0bf5c] text-black font-bold text-[14px] uppercase tracking-[0.05em] px-4 py-1.5 rounded-lg hover:bg-[#f0bf5c]/90 transition-all gold-glow border-none"
          >
            <Link href="/auth/login">Join Queue</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
