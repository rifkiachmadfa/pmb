import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { requireAccount } from "@/server/auth/session";
import { getOwnRegistration } from "@/server/registration/queries";
import { RegistrationWizard } from "@/features/registration/components/registration-wizard";

export const metadata: Metadata = {
  title: "Pendaftaran | PMB SMK Yadika Tanjungsari Sumedang",
};

/**
 * Registration wizard. Requires a signed-in account (Google via Supabase Auth).
 * An account that already submitted is sent to the dashboard: one registration
 * per account per period, and the submitted record is shown there.
 * The draft itself is kept in memory only; it is stored once, on submit.
 */
export default async function PendaftaranPage() {
  const account = await requireAccount("/pendaftaran");
  if (await getOwnRegistration(account.id)) redirect("/dashboard");
  return (
    <PageContainer className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Formulir Pendaftaran
        </h1>
        <p className="text-muted-foreground">
          Lengkapi lima langkah berikut untuk mendaftar PMB 2026/2027.
        </p>
      </header>
      <RegistrationWizard />
    </PageContainer>
  );
}
