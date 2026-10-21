import { PageContainer } from "@/components/layout/page-container";

export default function HomePage() {
  return (
    <PageContainer width="narrow" className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">
        PMB SMK Yadika Tanjungsari Sumedang
      </h1>
      <p className="text-muted-foreground">
        Portal pendaftaran sedang dalam pengembangan. Pendaftaran online belum
        dibuka.
      </p>
    </PageContainer>
  );
}
