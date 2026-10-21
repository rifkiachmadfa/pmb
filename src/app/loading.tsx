import { PageContainer } from "@/components/layout/page-container";

/** Route-transition fallback for the whole app shell. */
export default function Loading() {
  return (
    <PageContainer width="narrow" role="status" aria-live="polite" className="py-8">
      <p className="text-muted-foreground">Memuat…</p>
    </PageContainer>
  );
}
