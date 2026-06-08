/**
 * BentoCard — components/ui/bento-card.tsx
 *
 * Versatile card component for bento grid layouts.
 * Two variants:
 *  - "image": Full-bleed background image with gradient overlay and text
 *  - "content": Surface-colored card with icon, badge, and text content
 *
 * Used in the Featured/Bento Grid section of the landing page.
 */
import { cn } from "@/lib/utils";

/* ---- Image variant ---- */

interface BentoImageCardProps {
  /** Background image URL */
  imageSrc: string;
  /** Alt text for the image */
  imageAlt: string;
  /** Headline text displayed over the image */
  title: string;
  /** Description text displayed below the headline */
  description: string;
  /** Additional className */
  className?: string;
}

export function BentoImageCard({
  imageSrc,
  imageAlt,
  title,
  description,
  className,
}: BentoImageCardProps) {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden group", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        src={imageSrc}
        alt={imageAlt}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#17130c] via-transparent to-transparent" />
      <div className="absolute bottom-8 left-8">
        <h3
          className="text-[40px] leading-[48px] tracking-[0.02em] text-[#ebe1d6] uppercase mb-2"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-[#d2c5b1] max-w-md text-base">{description}</p>
      </div>
    </div>
  );
}

/* ---- Content variant ---- */

interface BentoContentCardProps {
  /** Material Symbols icon name */
  icon?: string;
  /** Whether the icon should be filled */
  iconFilled?: boolean;
  /** Optional badge text (e.g. "Exclusive") */
  badgeText?: string;
  /** Headline text */
  title: string;
  /** Description text */
  description: string;
  /** Background image URL (optional, shown as faint overlay) */
  backgroundImage?: string;
  /** Surface color variant */
  surface?: "high" | "default";
  /** Icon color class */
  iconColor?: string;
  /** Additional className */
  className?: string;
}

export function BentoContentCard({
  icon,
  iconFilled = false,
  badgeText,
  title,
  description,
  backgroundImage,
  surface = "default",
  iconColor = "text-[#f0bf5c]",
  className,
}: BentoContentCardProps) {
  const bgColor =
    surface === "high" ? "bg-[#2e2922]" : "bg-[#231f18]";

  return (
    <div
      className={cn(
        "rounded-2xl p-8 flex flex-col justify-between border border-[#4e4637]/30 relative overflow-hidden group",
        bgColor,
        className
      )}
    >
      {/* Optional background image overlay */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700"
            src={backgroundImage}
          />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t to-transparent",
              surface === "high"
                ? "from-[#2e2922]"
                : "from-[#231f18]"
            )}
          />
        </div>
      )}

      {/* Top row: icon + badge */}
      {(icon || badgeText) && (
        <div className="relative z-10 flex justify-between items-start">
          {icon && (
            <span
              className={cn("material-symbols-outlined text-3xl", iconColor)}
              style={
                iconFilled
                  ? { fontVariationSettings: '"FILL" 1' }
                  : undefined
              }
            >
              {icon}
            </span>
          )}
          {badgeText && (
            <div className="px-3 py-1 bg-[#f0bf5c]/10 border border-[#f0bf5c]/20 rounded-full">
              <span className="text-[#f0bf5c] text-[10px] font-medium uppercase tracking-[0.05em]">
                {badgeText}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Icon watermark for non-image cards */}
      {icon && !backgroundImage && (
        <div className="absolute top-8 right-8 text-[#ffb3b0]/20 group-hover:text-[#ffb3b0]/40 transition-colors">
          <span
            className="material-symbols-outlined text-6xl"
            style={
              iconFilled
                ? { fontVariationSettings: '"FILL" 1' }
                : undefined
            }
          >
            {icon}
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="relative z-10">
        <h4
          className="text-[28px] leading-8 text-[#ebe1d6] uppercase mb-1"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          {title}
        </h4>
        <p className="text-[#d2c5b1] text-sm leading-6">{description}</p>
      </div>
    </div>
  );
}
