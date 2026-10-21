"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Route error boundary. Shows a generic message only: the error object may
 * hold personal data, so it is never rendered or logged here.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageContainer width="narrow" className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Terjadi kendala</h1>
      <Alert variant="destructive">
        <AlertDescription>
          Halaman tidak dapat ditampilkan saat ini. Silakan coba lagi. Data yang sudah Anda
          kirim tidak terpengaruh.
        </AlertDescription>
      </Alert>
      <div>
        <Button type="button" onClick={reset}>
          Coba lagi
        </Button>
      </div>
    </PageContainer>
  );
}
