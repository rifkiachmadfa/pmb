import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { requireAccount } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Dashboard | PMB SMK Yadika Tanjungsari Sumedang",
};

/**
 * Protected placeholder. Registration/payment/admission statuses are added in
 * later phases; nothing is persisted or shown for them yet.
 */
export default async function DashboardPage() {
  const account = await requireAccount("/dashboard");

  return (
    <PageContainer className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Masuk sebagai {account.email}</p>
      </header>
      <p>Status pendaftaran, pembayaran, dan keputusan penerimaan akan tampil di sini.</p>
      <div>
        <Link href="/pendaftaran" className={buttonVariants()}>
          Buka formulir pendaftaran
        </Link>
      </div>
    </PageContainer>
  );
}
