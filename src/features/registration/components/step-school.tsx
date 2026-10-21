"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  GRADUATION_YEAR_OPTIONS,
  MAJOR_OPTIONS,
  SCHOOL_FIELDS,
  SCHOOL_STATUS_OPTIONS,
  type SchoolDraft,
  type SchoolFieldErrors,
  type SchoolFieldName,
} from "../school-schema";

type Props = {
  values: SchoolDraft;
  /** All current errors (browser + server); shown after a field is touched or after a Lanjut attempt. */
  errors: SchoolFieldErrors;
  showAllErrors: boolean;
  onChange: (name: SchoolFieldName, value: string) => void;
};

const GRID = "grid gap-x-4 gap-y-5 sm:grid-cols-2";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <legend className="mb-4 text-base font-semibold tracking-tight">{title}</legend>
      <div className={GRID}>{children}</div>
    </fieldset>
  );
}

/**
 * Data Sekolah Asal form (Phase 4). Fully controlled by the wizard draft so
 * values survive back/next. Errors come from the shared Zod schema.
 */
export function StepSchool({ values, errors, showAllErrors, onChange }: Props) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const touch = (name: string) =>
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));

  const visibleError = (name: SchoolFieldName) => {
    const message = errors[name];
    if (!message) return undefined;
    return showAllErrors || touched.has(name) ? message : undefined;
  };

  const errorCount = SCHOOL_FIELDS.filter((f) => errors[f]).length;

  const text = (name: SchoolFieldName, label: string, maxLength: number, wide = false) => (
    <Field
      id={`school-${name}`}
      label={label}
      required
      error={visibleError(name)}
      className={wide ? "sm:col-span-2" : undefined}
    >
      {(control) => (
        <Input
          {...control}
          name={name}
          value={values[name]}
          maxLength={maxLength}
          autoComplete="off"
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => touch(name)}
        />
      )}
    </Field>
  );

  const select = (
    name: SchoolFieldName,
    label: string,
    options: readonly string[],
    placeholder: string,
    wide = false,
  ) => (
    <Field
      id={`school-${name}`}
      label={label}
      required
      error={visibleError(name)}
      className={wide ? "sm:col-span-2" : undefined}
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
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Isi data sekolah asal dan pilih jurusan yang diinginkan. Semua kolom
        wajib diisi.
      </p>

      {showAllErrors && errorCount > 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            Ada {errorCount} isian yang belum benar. Periksa isian yang diberi
            keterangan merah di bawah ini.
          </AlertDescription>
        </Alert>
      ) : null}

      <Section title="Sekolah Asal">
        {text("schoolName", "Asal Sekolah", 150, true)}
        {select("schoolStatus", "Status Sekolah", SCHOOL_STATUS_OPTIONS, "Pilih Status Sekolah")}
        {select("graduationYear", "Tahun Lulus", GRADUATION_YEAR_OPTIONS, "Pilih Tahun Lulus...")}
        {text("schoolAddress", "Alamat Sekolah", 255, true)}
      </Section>

      <Section title="Pilih Jurusan Yang Diinginkan">
        {select("major", "Jurusan", MAJOR_OPTIONS, "Pilih Jurusan", true)}
      </Section>
    </div>
  );
}
