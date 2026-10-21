import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { RegistrationDraft } from "../draft";

type Props = {
  draft: RegistrationDraft;
  onEdit: (step: number) => void;
};

const SECTIONS = [
  { step: 1, label: "Data Siswa", key: "student" },
  { step: 2, label: "Data Orang Tua / Wali", key: "guardian" },
  { step: 3, label: "Data Sekolah Asal", key: "previousSchool" },
] as const;

export function StepReview({ draft, onEdit }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground">
        Periksa ringkasan pendaftaran. Gunakan tombol Ubah untuk kembali ke
        langkah yang ingin diperbaiki.
      </p>

      <dl className="divide-y divide-border border-y border-border">
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <dt className="text-sm font-medium">Ketentuan</dt>
            <dd className="text-sm text-muted-foreground">
              {draft.termsAccepted ? "Disetujui" : "Belum disetujui"}
            </dd>
          </div>
          <Button variant="outline" size="sm" onClick={() => onEdit(0)}>
            Ubah<span className="sr-only"> Ketentuan</span>
          </Button>
        </div>

        {SECTIONS.map(({ step, label, key }) => {
          const filled = Object.keys(draft[key]).length;
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <dt className="text-sm font-medium">{label}</dt>
                <dd className="text-sm text-muted-foreground">
                  {filled > 0 ? `${filled} isian terisi` : "Belum ada isian"}
                </dd>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEdit(step)}>
                Ubah<span className="sr-only"> {label}</span>
              </Button>
            </div>
          );
        })}
      </dl>

      <Alert variant="warning">
        <AlertTitle>Pengiriman pendaftaran belum tersedia</AlertTitle>
        <AlertDescription>
          Draft ini hanya tersimpan sementara di halaman ini dan akan hilang
          jika halaman dimuat ulang. Penyimpanan pendaftaran dan akun
          ditambahkan pada tahap berikutnya.
        </AlertDescription>
      </Alert>
    </div>
  );
}
