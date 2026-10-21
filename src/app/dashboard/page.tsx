import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { requireAccount } from "@/server/auth/session";
import { getOwnRegistration } from "@/server/registration/queries";

export const metadata: Metadata = {
  title: "Dashboard | PMB SMK Yadika Tanjungsari Sumedang",
};

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/**
 * Protected dashboard. Shows only the signed-in account's own registration
 * (looked up by owner, never by an id from the browser). Payment and admission
 * statuses are separate and arrive in later phases.
 */
export default async function DashboardPage() {
  const account = await requireAccount("/dashboard");
  const registration = await getOwnRegistration(account.id);

  return (
    <PageContainer className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Masuk sebagai {account.email}</p>
      </header>

      {registration ? (
        <section aria-labelledby="reg-heading" className="flex flex-col gap-4">
          <h2 id="reg-heading" className="text-lg font-semibold tracking-tight">
            Status pendaftaran
          </h2>
          <dl className="grid gap-x-6 gap-y-3 border-y border-border py-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="text-sm font-medium">
                {registration.status === "SUBMITTED" ? "Pendaftaran terkirim" : "Draf"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Nomor pendaftaran</dt>
              <dd className="text-sm font-medium tracking-wider">
                {registration.registrationNumber ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Nama calon siswa</dt>
              <dd className="text-sm font-medium">{registration.studentName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Jurusan dipilih</dt>
              <dd className="text-sm font-medium">{registration.chosenMajor ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Dikirim pada</dt>
              <dd className="text-sm font-medium">
                {registration.submittedAt ? `${dateFormat.format(registration.submittedAt)} WIB` : "-"}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Status pembayaran dan keputusan penerimaan akan ditampilkan di sini
            pada tahap berikutnya; keduanya terpisah dari status pendaftaran.
          </p>
        </section>
      ) : (
        <>
          <p>Anda belum mengirim pendaftaran untuk periode ini.</p>
          <div>
            <Link href="/pendaftaran" className={buttonVariants()}>
              Buka formulir pendaftaran
            </Link>
          </div>
        </>
      )}
    </PageContainer>
  );
}
