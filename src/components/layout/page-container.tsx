import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-4 sm:px-6", {
  variants: {
    /** narrow: forms and auth; default: wizard and dashboard; wide: tables. */
    width: {
      narrow: "max-w-xl",
      default: "max-w-3xl",
      wide: "max-w-5xl",
    },
  },
  defaultVariants: { width: "default" },
});

/** Horizontal alignment wrapper. Use inside pages; it renders a plain <div>. */
export function PageContainer({
  className,
  width,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return <div className={cn(containerVariants({ width }), className)} {...props} />;
}
