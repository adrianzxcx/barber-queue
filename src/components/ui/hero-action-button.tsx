/**
 * HeroActionButton — components/ui/hero-action-button.tsx
 *
 * Large CTA button used in the Hero section.
 * Two variants:
 *  - "primary": Solid gold background, black text
 *  - "ghost": Glass panel with gold border, gold text
 *
 * Each button has:
 *  - Material Symbols icon
 *  - Headline text (Bebas Neue)
 *  - Subtitle text
 *  - Hover overlay animation
 *  - Active press scale effect
 */
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroActionButtonProps {
  /** Visual variant */
  variant: "primary" | "ghost";
  /** Material Symbols icon name */
  icon: string;
  /** Whether the icon should be filled (FILL 1) */
  iconFilled?: boolean;
  /** Main headline text */
  title: string;
  /** Smaller subtitle text */
  subtitle: string;
  /** Link target */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export function HeroActionButton({
  variant,
  icon,
  iconFilled = false,
  title,
  subtitle,
  href,
  onClick,
  className,
}: HeroActionButtonProps) {
  const isPrimary = variant === "primary";
  const content = (
    <>
      {/* Hover overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
          isPrimary ? "bg-white/10" : "bg-[#f0bf5c]/5"
        )}
      />

      {/* Icon + Title row */}
      <div className="relative z-10 flex items-center gap-3">
        <span
          className={cn(
            "material-symbols-outlined text-3xl font-bold",
            isPrimary ? "text-black" : "text-[#f0bf5c]"
          )}
          style={
            iconFilled
              ? { fontVariationSettings: '"FILL" 1' }
              : undefined
          }
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-[28px] leading-8 uppercase",
            isPrimary ? "text-black" : "text-[#f0bf5c]"
          )}
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          {title}
        </span>
      </div>

      {/* Subtitle */}
      <span
        className={cn(
          "relative z-10 text-[14px] leading-5 font-medium uppercase tracking-wider",
          isPrimary ? "text-black/70" : "text-[#d2c5b1]"
        )}
      >
        {subtitle}
      </span>
    </>
  );

  const classNames = cn(
    "group relative overflow-hidden px-8 py-6 rounded-xl flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all",
    isPrimary
      ? "bg-[#f0bf5c] gold-glow"
      : "glass-panel border-2 border-[#f0bf5c]/20 hover:border-[#f0bf5c]/50",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={classNames}
    >
      {content}
    </button>
  );
}
