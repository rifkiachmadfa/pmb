import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { signInWithGoogle } from "@/features/auth/actions";
import { GoogleButton } from "@/features/auth/components/google-button";

export const metadata: Metadata = {
  title: "Masuk | PMB SMK Yadika Tanjungsari Sumedang",
};

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Masuk dibatalkan. Silakan coba lagi.",
  oauth_start: "Tidak dapat memulai proses masuk dengan Google. Silakan coba lagi.",
  oauth_missing_code: "Proses masuk tidak lengkap. Silakan coba lagi.",
  oauth_exchange: "Proses masuk gagal atau sudah kedaluwarsa. Silakan coba lagi.",
  no_email: "Akun Google Anda tidak memberikan alamat email. Gunakan akun Google lain.",
  account: "Akun tidak dapat disiapkan saat ini. Silakan coba lagi beberapa saat lagi.",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next, "/pendaftaran");
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <PageContainer width="narrow" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
        <p className="text-muted-foreground">
          Masuk dengan akun Google untuk mengisi dan memantau pendaftaran PMB
          2026/2027. Akun akan dibuat otomatis pada masuk pertama.
        </p>
      </header>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form action={signInWithGoogle} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <GoogleButton />
        <p className="text-sm text-muted-foreground">
          Kami hanya menerima nama dan alamat email dari Google. Tidak ada
          kata sandi yang disimpan di portal ini.
        </p>
      </form>
    </PageContainer>
  );
}
