import { PageContainer } from "@/components/layout/page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <PageContainer
        width="wide"
        className="py-6 text-xs leading-relaxed text-muted-foreground"
      >
        <p>
          Data yang diberikan kepada Panitia PPDB hanya digunakan untuk
          keperluan penerimaan siswa baru, tidak dipublikasikan, dan dijaga
          kerahasiaannya.
        </p>
      </PageContainer>
    </footer>
  );
}
