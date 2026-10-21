"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import {
  BIRTH_DAY_OPTIONS,
  BIRTH_MONTH_OPTIONS,
  BIRTH_YEAR_OPTIONS,
  CITIZENSHIP_OPTIONS,
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  RESIDENCE_OPTIONS,
  RT_OPTIONS,
  RW_OPTIONS,
  STUDENT_ERROR_ORDER,
  TRANSPORT_OPTIONS,
  YES_NO_OPTIONS,
  type StudentDraft,
  type StudentErrorKey,
  type StudentFieldErrors,
  type StudentFieldName,
} from "../student-schema";

type Props = {
  values: StudentDraft;
  /** All current errors (browser + server); shown only once a field is touched or after a Lanjut attempt. */
  errors: StudentFieldErrors;
  showAllErrors: boolean;
  onChange: (name: StudentFieldName, value: string) => void;
};

type BirthPart = "birthDay" | "birthMonth" | "birthYear";
type TextName = Exclude<StudentFieldName, BirthPart>;
type Option = { value: string; label: string };

const asOptions = (list: readonly string[]): Option[] =>
  list.map((v) => ({ value: v, label: v }));

const GRID = "grid gap-x-4 gap-y-5 sm:grid-cols-2";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <legend className="mb-4 text-base font-semibold tracking-tight">{title}</legend>
      <div className={GRID}>{children}</div>
    </fieldset>
  );
}

/**
 * Data Siswa form (Phase 3). Fully controlled: values live in the wizard draft so
 * they survive back/next. Errors come from the shared Zod schema and are only
 * revealed per field after blur (or for all fields after a Lanjut attempt).
 */
export function StepStudent({ values, errors, showAllErrors, onChange }: Props) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const touch = (name: string) =>
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));

  const visibleError = (key: StudentErrorKey): string | undefined => {
    const message = errors[key];
    if (!message) return undefined;
    if (showAllErrors) return message;
    if (key === "birthDate") {
      return ["birthDay", "birthMonth", "birthYear"].every((p) => touched.has(p))
        ? message
        : undefined;
    }
    return touched.has(key) ? message : undefined;
  };

  const errorCount = STUDENT_ERROR_ORDER.filter((k) => errors[k]).length;

  /* The helpers below return elements (not components) so inputs never remount. */

  const text = (
    name: TextName,
    label: string,
    opts: {
      hint?: string;
      digitsOnly?: boolean;
      maxLength?: number;
      inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
      type?: string;
      autoComplete?: string;
      className?: string;
    } = {},
  ) => (
    <Field
      id={`student-${name}`}
      label={label}
      required
      hint={opts.hint}
      error={visibleError(name)}
      className={opts.className}
    >
      {(control) => (
        <Input
          {...control}
          name={name}
          type={opts.type}
          value={values[name]}
          maxLength={opts.maxLength}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          onChange={(e) =>
            onChange(name, opts.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)
          }
          onBlur={() => touch(name)}
        />
      )}
    </Field>
  );

  const select = (
    name: TextName,
    label: string,
    options: readonly Option[],
    placeholder: string,
    opts: { hint?: string; className?: string } = {},
  ) => (
    <Field
      id={`student-${name}`}
      label={label}
      required
      hint={opts.hint}
      error={visibleError(name)}
      className={opts.className}
    >
      {(control) => (
        <Select
          {...control}
          name={name}
          value={values[name]}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => touch(name)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );

  const birthSelect = (
    part: BirthPart,
    label: string,
    placeholder: string,
    options: readonly Option[],
    invalid: boolean,
  ) => (
    <Select
      id={`student-${part}`}
      name={part}
      aria-label={label}
      aria-required="true"
      aria-invalid={invalid || undefined}
      value={values[part]}
      onChange={(e) => onChange(part, e.target.value)}
      onBlur={() => touch(part)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );

  const kpsNone = values.isKpsRecipient === "Tidak";
  const kipNone = values.isKipRecipient === "Tidak";
  const birthError = visibleError("birthDate");
  const genderError = visibleError("gender");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Isi data sesuai dokumen resmi. Kolom bertanda{" "}
        <span aria-hidden="true" className="font-medium text-destructive">
          *
        </span>
        <span className="sr-only">bintang</span> wajib diisi. Jika tidak punya
        (misalnya telepon rumah), isi dengan “-”.
      </p>

      {showAllErrors && errorCount > 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            Ada {errorCount} isian yang belum benar. Periksa isian yang diberi
            keterangan merah di bawah ini.
          </AlertDescription>
        </Alert>
      ) : null}

      <Section title="Identitas Siswa">
        {text("nisn", "NISN", {
          hint: "Sesuai data di nisn.data.kemdikbud.go.id (10 digit).",
          digitsOnly: true,
          maxLength: 10,
          inputMode: "numeric",
          autoComplete: "off",
        })}
        {text("nik", "NIK", {
          hint: "Sesuai Kartu Keluarga (KK), 16 digit.",
          digitsOnly: true,
          maxLength: 16,
          inputMode: "numeric",
          autoComplete: "off",
        })}
        {text("birthCertificateNumber", "No. Akta Lahir", {
          hint: "Sesuai Akta Kelahiran.",
          maxLength: 50,
          autoComplete: "off",
        })}
        {text("familyCardNumber", "No. Kartu Keluarga", {
          hint: "Sesuai Kartu Keluarga (KK), 16 digit.",
          digitsOnly: true,
          maxLength: 16,
          inputMode: "numeric",
          autoComplete: "off",
        })}
        {text("fullName", "Nama Lengkap", {
          hint: "Sesuai ijazah.",
          maxLength: 100,
          className: "sm:col-span-2",
        })}

        <FieldGroup id="student-gender-group" legend="Jenis Kelamin" required error={genderError}>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {GENDER_OPTIONS.map((option, i) => {
              const id = i === 0 ? "student-gender" : `student-gender-${i}`;
              return (
                <div key={option} className="flex items-center gap-2">
                  <Radio
                    id={id}
                    name="gender"
                    value={option}
                    checked={values.gender === option}
                    aria-invalid={genderError ? true : undefined}
                    onChange={() => onChange("gender", option)}
                    onBlur={() => touch("gender")}
                  />
                  <Label htmlFor={id} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        </FieldGroup>
        {text("birthPlace", "Tempat Kelahiran", { maxLength: 100 })}

        <FieldGroup
          id="student-birthDate"
          legend="Tanggal Lahir"
          required
          error={birthError}
          className="sm:col-span-2"
        >
          <div className="grid grid-cols-3 gap-3">
            {birthSelect("birthDay", "Tanggal lahir", "Pilih Tanggal", asOptions(BIRTH_DAY_OPTIONS), !!birthError)}
            {birthSelect("birthMonth", "Bulan lahir", "Pilih Bulan", BIRTH_MONTH_OPTIONS, !!birthError)}
            {birthSelect("birthYear", "Tahun lahir", "Pilih Tahun", asOptions(BIRTH_YEAR_OPTIONS), !!birthError)}
          </div>
        </FieldGroup>

        {select("religion", "Agama", asOptions(RELIGION_OPTIONS), "Pilih agama yang dianut")}
      </Section>

      <Section title="Alamat">
        {text("streetAddress", "Alamat", { maxLength: 255, className: "sm:col-span-2" })}
        {select("rt", "RT", asOptions(RT_OPTIONS), "Pilih RT")}
        {select("rw", "RW", asOptions(RW_OPTIONS), "Pilih RW")}
        {text("village", "Desa/Kelurahan", { maxLength: 100 })}
        {text("subdistrict", "Kecamatan", { maxLength: 100 })}
        {text("regency", "Kabupaten", { maxLength: 100 })}
        {text("province", "Provinsi", { maxLength: 100 })}
        {text("postalCode", "Kode Pos", {
          digitsOnly: true,
          maxLength: 5,
          inputMode: "numeric",
        })}
        {select("citizenship", "Kewarganegaraan", asOptions(CITIZENSHIP_OPTIONS), "Pilih")}
      </Section>

      <Section title="Bantuan Pendidikan (KPS dan KIP)">
        {select("isKpsRecipient", "Penerima KPS", asOptions(YES_NO_OPTIONS), "Pilih")}
        <Field
          id="student-kpsNumber"
          label="No. KPS"
          required
          hint={kpsNone ? "Terisi “-” otomatis karena bukan penerima KPS." : undefined}
          error={visibleError("kpsNumber")}
        >
          {(control) => (
            <Input
              {...control}
              name="kpsNumber"
              value={kpsNone ? "-" : values.kpsNumber}
              disabled={kpsNone}
              maxLength={30}
              autoComplete="off"
              onChange={(e) => onChange("kpsNumber", e.target.value)}
              onBlur={() => touch("kpsNumber")}
            />
          )}
        </Field>

        {select("isKipRecipient", "Penerima KIP", asOptions(YES_NO_OPTIONS), "Pilih")}
        <Field
          id="student-kipNumber"
          label="No. KIP"
          required
          hint={kipNone ? "Terisi “-” otomatis karena bukan penerima KIP." : undefined}
          error={visibleError("kipNumber")}
        >
          {(control) => (
            <Input
              {...control}
              name="kipNumber"
              value={kipNone ? "-" : values.kipNumber}
              disabled={kipNone}
              maxLength={30}
              autoComplete="off"
              onChange={(e) => onChange("kipNumber", e.target.value)}
              onBlur={() => touch("kipNumber")}
            />
          )}
        </Field>
        <Field
          id="student-kipHolderName"
          label="Nama di KIP"
          required
          hint={kipNone ? "Terisi “-” otomatis karena bukan penerima KIP." : undefined}
          error={visibleError("kipHolderName")}
        >
          {(control) => (
            <Input
              {...control}
              name="kipHolderName"
              value={kipNone ? "-" : values.kipHolderName}
              disabled={kipNone}
              maxLength={100}
              onChange={(e) => onChange("kipHolderName", e.target.value)}
              onBlur={() => touch("kipHolderName")}
            />
          )}
        </Field>
      </Section>

      <Section title="Keluarga dan Kondisi Fisik">
        {text("birthOrder", "Anak Ke Berapa", {
          digitsOnly: true,
          maxLength: 2,
          inputMode: "numeric",
        })}
        {text("siblingCount", "Jumlah Saudara", {
          digitsOnly: true,
          maxLength: 2,
          inputMode: "numeric",
        })}
        {text("heightCm", "Tinggi Badan (cm)", {
          digitsOnly: true,
          maxLength: 3,
          inputMode: "numeric",
        })}
        {text("weightKg", "Berat Badan (kg)", {
          digitsOnly: true,
          maxLength: 3,
          inputMode: "numeric",
        })}
      </Section>

      <Section title="Tempat Tinggal dan Transportasi">
        {select("residenceType", "Jenis Tinggal", asOptions(RESIDENCE_OPTIONS), "Pilih jenis tinggal")}
        {text("distanceToSchoolKm", "Jarak Rumah (km)", {
          hint: "Jarak rumah ke sekolah, dalam kilometer. Boleh desimal, contoh 2,5.",
          maxLength: 7,
          inputMode: "decimal",
        })}
        {select("transportMode", "Alat Transportasi", asOptions(TRANSPORT_OPTIONS), "Pilih alat transportasi")}
      </Section>

      <Section title="Kontak">
        {text("mobilePhone", "No. Handphone", {
          hint: "Contoh: 081234567890.",
          maxLength: 18,
          inputMode: "tel",
          type: "tel",
        })}
        {text("landlinePhone", "Telepon", {
          hint: "Jika tidak punya, isi dengan -",
          maxLength: 20,
          inputMode: "tel",
          type: "tel",
        })}
        {text("email", "Email", {
          maxLength: 254,
          inputMode: "email",
          type: "email",
          autoComplete: "email",
          className: "sm:col-span-2",
        })}
      </Section>
    </div>
  );
}
