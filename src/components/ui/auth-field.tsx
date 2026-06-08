import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = React.ComponentProps<typeof Input> & {
  icon: React.ReactNode;
  label: string;
  helper?: React.ReactNode;
  action?: React.ReactNode;
};

function AuthField({
  id,
  label,
  icon,
  helper,
  action,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="group space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="px-1 font-sans text-[15px] font-bold uppercase leading-5 tracking-[0.05em] text-supremo-on-surface-variant transition-colors group-focus-within:text-primary"
        >
          {label}
        </Label>
        {helper}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-supremo-outline transition-colors group-focus-within:text-primary [&_svg]:size-5">
          {icon}
        </span>
        <Input
          id={id}
          className={cn(
            "h-14 rounded-lg border-supremo-outline-variant/70 bg-supremo-surface-container-lowest py-3.5 pl-12 pr-4 text-base font-semibold text-supremo-on-surface placeholder:text-supremo-on-surface/90 focus-visible:border-primary focus-visible:ring-primary/60",
            action && "pr-12",
            className
          )}
          {...props}
        />
        {action}
      </div>
    </div>
  );
}

export { AuthField };
