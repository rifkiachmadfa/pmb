import type { ComponentProps } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Native checkbox (keyboard, form submission and label association come from
 * the browser). Pair with <Label htmlFor>. The checked state shows a navy
 * check on light blue with a navy border, so it is not conveyed by color alone.
 */
export function Checkbox({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        type="checkbox"
        data-slot="checkbox"
        className={cn(
          "peer size-5 shrink-0 cursor-pointer appearance-none rounded-sm border border-input bg-surface transition-colors",
          "checked:border-foreground checked:bg-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:border-2",
          className,
        )}
        {...props}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}
