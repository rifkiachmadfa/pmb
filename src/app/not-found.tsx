import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer width="narrow" className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground">
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
      </p>
      <div>
        <Link href="/" className={buttonVariants()}>
          Kembali ke beranda
        </Link>
      </div>
    </PageContainer>
  );
}
