/**
 * StatusBadge — components/ui/status-badge.tsx
 *
 * Small pill-shaped badge used for live status indicators.
 * Supports variants: "open" (green pulse), "closed" (red), "info" (gold).
 *
 * Used in the Live Shop Status section header.
 */
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  /** The display text (e.g. "Store Open") */
  label: string;
  /** Badge variant controlling color and animation */
  variant?: "open" | "closed" | "info";
  /** Additional className */
  className?: string;
}

const VARIANT_STYLES = {
  open: {
    wrapper: "bg-green-500/10 border-green-500/20",
    dot: "bg-green-500 animate-pulse",
    text: "text-green-500",
  },
  closed: {
    wrapper: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-500",
    text: "text-red-500",
  },
  info: {
    wrapper: "bg-[#f0bf5c]/10 border-[#f0bf5c]/20",
    dot: "bg-[#f0bf5c] animate-pulse",
    text: "text-[#f0bf5c]",
  },
} as const;

export function StatusBadge({
  label,
  variant = "open",
  className,
}: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "px-4 py-2 border rounded-lg flex items-center gap-2",
        styles.wrapper,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", styles.dot)} />
      <span
        className={cn(
          "text-[14px] leading-5 font-medium uppercase tracking-[0.05em]",
          styles.text
        )}
      >
        {label}
      </span>
    </div>
  );
}
