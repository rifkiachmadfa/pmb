import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMB SMK Yadika Tanjungsari Sumedang 2026/2027",
  description:
    "Portal penerimaan murid baru (PMB) SMK Yadika Tanjungsari Sumedang tahun ajaran 2026/2027.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
