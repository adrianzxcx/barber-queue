/**
 * StatusCard — components/ui/status-card.tsx
 *
 * Glassmorphic metric card used in the "Live Shop Status" section.
 * Displays a label, a large display value, and optional bottom content
 * (progress bar, description text, indicator dots, etc.).
 *
 * Features:
 *  - Glass panel background with hover state
 *  - Large watermark icon in the bottom-right corner
 *  - Flexible children slot for custom bottom content
 */
import { cn } from "@/lib/utils";

interface StatusCardProps {
  /** Small uppercase label at the top of the card */
  label: string;
  /** Large display value (e.g. "#042", "~45") */
  value: React.ReactNode;
  /** Material Symbols icon name for the watermark */
  watermarkIcon: string;
  /** Color class for the display value (e.g. "text-[#f0bf5c]") */
  valueColor?: string;
  /** Optional bottom content (progress bar, text, dots, etc.) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function StatusCard({
  label,
  value,
  watermarkIcon,
  valueColor = "text-[#ebe1d6]",
  children,
  className,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        "glass-panel p-8 rounded-xl relative overflow-hidden group hover:bg-[#2e2922] transition-colors",
        className
      )}
    >
      {/* Watermark icon */}
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-[120px]">
          {watermarkIcon}
        </span>
      </div>

      {/* Label */}
      <div className="text-[#d2c5b1] text-[14px] leading-5 font-medium uppercase tracking-[0.2em] mb-4">
        {label}
      </div>

      {/* Value */}
      <div
        className={cn(
          "text-[64px] leading-[72px] tracking-[0.02em]",
          valueColor
        )}
        style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
      >
        {value}
      </div>

      {/* Bottom content slot */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
