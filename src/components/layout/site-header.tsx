import type { ReactNode } from "react";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

/**
 * Shared header. `children` is a slot for navigation/account actions that will
 * be added with the auth screens; nothing is linked here until those routes exist.
 */
export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-border bg-background">
      <PageContainer
        width="wide"
        className="flex min-h-16 items-center justify-between gap-4 py-3"
      >
        <Link
          href="/"
          className="rounded-sm leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="block text-sm font-semibold sm:text-base">
            PMB SMK Yadika Tanjungsari Sumedang
          </span>
          <span className="block text-xs text-muted-foreground">
            Tahun ajaran 2026/2027
          </span>
        </Link>
        {children ? <nav aria-label="Utama" className="flex items-center gap-2">{children}</nav> : null}
      </PageContainer>
    </header>
  );
}
