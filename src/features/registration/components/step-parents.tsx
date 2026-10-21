"use client";

import { useState, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  EDUCATION_OPTIONS,
  INCOME_OPTIONS,
  PARENTS_FIELDS,
  PARENT_BIRTH_YEAR_MAX,
  PARENT_BIRTH_YEAR_MIN,
  PARENT_ROLES,
  PARENT_ROLE_LABEL,
  PERSON_KEYS,
  occupationOptions,
  parentsFieldName,
  type ParentRole,
  type ParentsDraft,
  type ParentsFieldErrors,
  type ParentsFieldName,
  type PersonKey,
} from "../guardian-schema";

type Props = {
  values: ParentsDraft;
  /** All current errors (browser + server); shown after a field is touched or after a Lanjut attempt. */
  errors: ParentsFieldErrors;
  showAllErrors: boolean;
  onChange: (name: ParentsFieldName, value: string) => void;
};

const GRID = "grid gap-x-4 gap-y-5 sm:grid-cols-2";
const KK_HINT = "Sesuai dengan Kartu Keluarga (KK).";

const LABEL: Record<PersonKey, string> = {
  nik: "NIK",
  fullName: "Nama Lengkap",
  birthYear: "Tahun Lahir",
  education: "Pendidikan",
  occupation: "Pekerjaan",
  income: "Penghasilan",
  mobilePhone: "No. Handphone",
};

const NO_GUARDIAN_HINT = "Jika tidak ada isi dengan -";

function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <legend className="text-base font-semibold tracking-tight">{title}</legend>
        {aside}
      </div>
      <div className={GRID}>{children}</div>
    </fieldset>
  );
}

function hintFor(role: ParentRole, key: PersonKey): string | undefined {
  if (role === "guardian") return NO_GUARDIAN_HINT;
  switch (key) {
    case "nik":
    case "fullName":
    case "birthYear":
      return key === "birthYear"
        ? `${KK_HINT} Contoh: 1975.`
        : key === "nik"
          ? `${KK_HINT} 16 digit.`
          : KK_HINT;
    case "mobilePhone":
      return "Contoh: 081234567890. Jika tidak ada isi dengan -";
    default:
      return undefined;
  }
}

/**
 * Data Orang Tua / Wali form (Phase 4). Fully controlled by the wizard draft so
 * values survive back/next. Errors come from the shared Zod schema.
 */
export function StepParents({ values, errors, showAllErrors, onChange }: Props) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const touch = (name: string) =>
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));

  const visibleError = (name: ParentsFieldName) => {
    const message = errors[name];
    if (!message) return undefined;
    return showAllErrors || touched.has(name) ? message : undefined;
  };

  const errorCount = PARENTS_FIELDS.filter((f) => errors[f]).length;

  const person = (role: ParentRole, key: PersonKey) => {
    const name = parentsFieldName(role, key);
    const common = {
      id: `parents-${name}`,
      label: LABEL[key],
      required: true,
      hint: hintFor(role, key),
      error: visibleError(name),
      className: key === "fullName" ? "sm:col-span-2" : undefined,
    };

    if (key === "education" || key === "occupation" || key === "income") {
      const options =
        key === "education"
          ? EDUCATION_OPTIONS
          : key === "income"
            ? INCOME_OPTIONS
            : occupationOptions(role);
      return (
        <Field key={name} {...common}>
          {(control) => (
            <Select
              {...control}
              name={name}
              value={values[name]}
              onChange={(e) => onChange(name, e.target.value)}
              onBlur={() => touch(name)}
            >
              <option value="">
                {`Pilih ${LABEL[key]} ${PARENT_ROLE_LABEL[role]}`}
              </option>
              {role === "guardian" ? <option value="-">- (tidak ada)</option> : null}
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          )}
        </Field>
      );
    }

    const isGuardian = role === "guardian";
    const numeric = key === "nik" || key === "birthYear";
    return (
      <Field key={name} {...common}>
        {(control) => (
          <Input
            {...control}
            name={name}
            value={values[name]}
            maxLength={key === "nik" ? 16 : key === "birthYear" ? 4 : key === "mobilePhone" ? 18 : 100}
            inputMode={numeric ? "numeric" : key === "mobilePhone" ? "tel" : undefined}
            type={key === "mobilePhone" ? "tel" : undefined}
            autoComplete="off"
            onChange={(e) => {
              let v = e.target.value;
              // Digits only, except the guardian may type "-" for "none".
              if (numeric) v = v.replace(isGuardian ? /[^\d-]/g : /\D/g, "");
              onChange(name, v);
            }}
            onBlur={() => touch(name)}
          />
        )}
      </Field>
    );
  };

  const markNoGuardian = () => {
    for (const key of PERSON_KEYS) onChange(parentsFieldName("guardian", key), "-");
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Isi data sesuai Kartu Keluarga. Semua kolom wajib diisi. Tahun lahir
        berkisar {PARENT_BIRTH_YEAR_MIN}–{PARENT_BIRTH_YEAR_MAX}. Isian yang
        tidak ada diisi “-” (nomor HP ayah/ibu dan seluruh data wali).
      </p>

      {showAllErrors && errorCount > 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            Ada {errorCount} isian yang belum benar. Periksa isian yang diberi
            keterangan merah di bawah ini.
          </AlertDescription>
        </Alert>
      ) : null}

      {PARENT_ROLES.map((role) => (
        <Section
          key={role}
          title={`Data ${PARENT_ROLE_LABEL[role]}`}
          aside={
            role === "guardian" ? (
              <Button type="button" variant="outline" size="sm" onClick={markNoGuardian}>
                Tidak ada wali (isi semua “-”)
              </Button>
            ) : null
          }
        >
          {PERSON_KEYS.map((key) => person(role, key))}
        </Section>
      ))}
    </div>
  );
}
