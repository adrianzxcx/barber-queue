import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthCheckboxProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Checkbox>, "id" | "className">;

function AuthCheckbox({ id, children, className, ...props }: AuthCheckboxProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Checkbox
        id={id}
        className="mt-0.5 size-5 rounded border-supremo-outline-variant bg-supremo-surface-container-lowest text-primary focus-visible:ring-primary/40"
        {...props}
      />
      <Label
        htmlFor={id}
        className="block font-sans text-base font-semibold leading-5 text-supremo-on-surface-variant"
      >
        {children}
      </Label>
    </div>
  );
}

export { AuthCheckbox };
