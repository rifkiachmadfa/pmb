import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";

export const metadata: Metadata = {
  title: "PMB SMK Yadika Tanjungsari Sumedang 2026/2027",
  description:
    "Portal penerimaan murid baru (PMB) SMK Yadika Tanjungsari Sumedang tahun ajaran 2026/2027.",
};

/**
 * Shared application shell. Pages render inside <main id="main">, so a page
 * must NOT add its own <main>.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="flex min-h-full flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="flex-1 py-8 sm:py-12">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
