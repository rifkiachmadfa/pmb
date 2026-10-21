import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { RegistrationWizard } from "@/features/registration/components/registration-wizard";

export const metadata: Metadata = {
  title: "Pendaftaran | PMB SMK Yadika Tanjungsari Sumedang",
};

/**
 * Wizard skeleton. NOT yet protected: authentication and route protection are
 * a later Phase 2 task (blocked on ADR-012). No data is persisted or sent.
 */
export default function PendaftaranPage() {
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
