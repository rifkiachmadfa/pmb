import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Empty state for steps whose official field list is not implemented yet.
 * Deliberately renders no inputs: fields are added in later phases.
 */
export function StepPlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <Alert>
      <AlertTitle>Formulir {title} belum tersedia</AlertTitle>
      <AlertDescription>
        Isian pada langkah ini akan ditambahkan pada tahap pengembangan
        berikutnya ({phase}). Anda dapat melanjutkan untuk melihat alur
        pendaftaran.
      </AlertDescription>
    </Alert>
  );
}
