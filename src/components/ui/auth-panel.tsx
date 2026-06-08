import * as React from "react";

import { cn } from "@/lib/utils";

function AuthPanel({
  className,
  children,
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-xl border border-primary/10 bg-supremo-surface-container/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 md:p-10 lg:p-11",
        "hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(240,191,92,0.18)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export { AuthPanel };
