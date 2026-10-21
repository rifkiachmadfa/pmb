import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Native <label>; always associate it with a control via `htmlFor`. */
export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-snug text-foreground",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
