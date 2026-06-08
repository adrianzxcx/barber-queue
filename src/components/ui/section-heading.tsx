/**
 * SectionHeading — components/ui/section-heading.tsx
 *
 * Reusable section header with:
 *  - Gold left border accent
 *  - Bebas Neue headline
 *  - Optional subtitle text
 *  - Optional right-side slot (e.g. status badge)
 *
 * Used in Live Shop Status, Featured sections, etc.
 */
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Main heading text (rendered in Bebas Neue) */
  title: string;
  /** Optional subtitle below the heading */
  subtitle?: string;
  /** Optional content rendered on the right side (e.g. status badge) */
  badge?: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  badge,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between mb-12 border-l-4 border-[#f0bf5c] pl-6",
        className
      )}
    >
      <div>
        <h2
          className="text-[40px] leading-[48px] tracking-[0.02em] text-[#ebe1d6] uppercase"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-base leading-6 text-[#d2c5b1]">{subtitle}</p>
        )}
      </div>
      {badge && <div className="mt-4 md:mt-0">{badge}</div>}
    </div>
  );
}
