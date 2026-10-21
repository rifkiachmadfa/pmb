import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full gap-3 rounded-md border p-4 text-sm",
  {
    variants: {
      variant: {
        default: "border-brand-blue bg-info text-info-foreground",
        warning: "border-brand-yellow bg-warning text-warning-foreground",
        destructive: "border-destructive bg-destructive-soft text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const icons = {
  default: Info,
  warning: TriangleAlert,
  destructive: CircleAlert,
} as const;

/**
 * Inline feedback message. Each variant has an icon so meaning is not carried
 * by color alone. `destructive` announces assertively (role="alert"); the
 * others use role="status".
 */
export function Alert({
  className,
  variant = "default",
  role,
  children,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const key = variant ?? "default";
  const Icon = icons[key];
  return (
    <div
      data-slot="alert"
      role={role ?? (key === "destructive" ? "alert" : "status")}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold leading-snug", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("leading-relaxed", className)}
      {...props}
    />
  );
}
