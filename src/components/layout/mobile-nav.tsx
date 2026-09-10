/**
 * MobileNav — components/layout/mobile-nav.tsx
 *
 * Fixed bottom navigation bar for mobile devices (hidden on md+).
 * Provides quick access to Home, Queue, and Services.
 *
 * Uses Material Symbols icons and the Supremo gold accent color.
 */

const MOBILE_NAV_ITEMS: { icon: string; label: string; href: string; active?: boolean }[] = [
  { icon: "home", label: "Home", href: "/", active: true },
  { icon: "format_list_numbered", label: "Queue", href: "/auth/login" },
  { icon: "auto_awesome", label: "AI Styles", href: "#ai-style" },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#17130c]/90 backdrop-blur-xl border-t border-[#4e4637]/30 flex justify-around items-center px-4 py-3 shadow-2xl rounded-t-xl">
      {MOBILE_NAV_ITEMS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className={`flex flex-col items-center justify-center transition-transform ${
            item.active
              ? "text-[#f0bf5c] bg-[#c89b3c]/20 rounded-full py-1 px-4 scale-90"
              : "text-[#d2c5b1]"
          }`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="text-[10px] font-medium uppercase mt-1">
            {item.label}
          </span>
        </a>
      ))}
    </nav>
  );
}
