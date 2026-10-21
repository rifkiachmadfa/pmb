import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OFFICIAL_TERMS } from "../steps";

type Props = {
  accepted: boolean;
  showError: boolean;
  onChange: (accepted: boolean) => void;
};

export function StepTerms({ accepted, showError, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground">
        Baca ketentuan berikut dengan saksama. Anda harus menyetujui seluruh
        ketentuan sebelum melanjutkan pendaftaran.
      </p>

      <ol className="list-decimal space-y-3 pl-5 leading-relaxed marker:font-semibold">
        {OFFICIAL_TERMS.map((term) => (
          <li key={term} className="pl-1">
            {term}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-accepted"
            checked={accepted}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={showError || undefined}
            aria-describedby={showError ? "terms-error" : undefined}
            className="mt-0.5"
          />
          <Label htmlFor="terms-accepted" className="cursor-pointer">
            Saya telah membaca dan menyetujui kelima ketentuan di atas.
          </Label>
        </div>
        {showError ? (
          <Alert variant="destructive" id="terms-error">
            <AlertDescription>
              Centang persetujuan untuk melanjutkan ke langkah berikutnya.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
