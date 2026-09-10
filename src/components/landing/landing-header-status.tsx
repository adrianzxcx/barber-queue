import { Calendar } from "@phosphor-icons/react/dist/ssr";

interface LandingHeaderStatusProps {
  isOpen: boolean;
  date: string;
}

export function LandingHeaderStatus({
  isOpen,
  date,
}: LandingHeaderStatusProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.15em] animate-[fadeIn_0.5s_ease-out]">
      {isOpen ? (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-bold shadow-sm">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Store Open
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/20 border border-red-900/40 text-red-400 font-bold shadow-sm">
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          Store Closed
        </span>
      )}

      <span className="hidden sm:block h-3.5 w-px bg-supremo-outline-variant/30" />

      <span className="text-[#ebe1d6]/80 flex items-center gap-2 font-medium">
        <Calendar className="text-primary size-4" />
        {date}
      </span>

    </div>
  );
}
