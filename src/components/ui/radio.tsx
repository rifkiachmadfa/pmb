import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Native radio (arrow-key navigation and grouping by `name` come from the
 * browser). Pair with <Label htmlFor> inside a <fieldset>. Checked state shows a
 * navy dot on light blue with a navy border, so it is not color alone.
 */
export function Radio({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        type="radio"
        data-slot="radio"
        className={cn(
          "peer size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-surface transition-colors",
          "checked:border-foreground checked:bg-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:border-2",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto size-2 rounded-full bg-primary-foreground opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}
