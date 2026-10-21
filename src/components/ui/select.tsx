import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Native <select> styled like Input (best keyboard/mobile behavior). Use a
 * first <option value=""> as the placeholder; it is shown muted. Set
 * `aria-invalid` for the error state; the message text must be rendered too.
 */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-10 w-full min-w-0 appearance-none rounded-md border border-input bg-surface py-2 pl-3 pr-9 text-base text-foreground md:text-sm",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
          "aria-invalid:border-destructive aria-invalid:border-2",
          props.value === "" && "text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
