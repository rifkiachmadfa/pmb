import { z } from "zod";

import { collapse } from "./student-schema";

/**
 * Data Sekolah Asal (step 4): field list supplied by the owner (Phase 4, P4-2).
 *
 * Pure module shared by the browser (usability validation) and the server
 * action (the check that counts). Must not import anything server-only. Error
 * messages never echo the submitted values. Assumptions: ai/DECISIONS.md ADR-023.
 */

/* ------------------------------ option lists ------------------------------ */

/** Verbatim from the owner's form. */
export const SCHOOL_STATUS_OPTIONS = ["NEGERI", "SWASTA"] as const;

/** Verbatim from the owner's form, newest first: 2026 down to 2010. */
export const GRADUATION_YEAR_MAX = 2026;
export const GRADUATION_YEAR_MIN = 2010;
export const GRADUATION_YEAR_OPTIONS = Array.from(
  { length: GRADUATION_YEAR_MAX - GRADUATION_YEAR_MIN + 1 },
  (_, i) => String(GRADUATION_YEAR_MAX - i),
);

/** Split of the form's single run-on list into three majors (ADR-023). */
export const MAJOR_OPTIONS = [
  "Teknik Kendaraan Ringan Otomotif",
  "Teknik Komputer dan Jaringan",
  "Otomatisasi Tata Kelola Perkantoran",
] as const;

/* --------------------------------- fields --------------------------------- */

export const SCHOOL_FIELDS = [
  "schoolName",
  "schoolStatus",
  "schoolAddress",
  "graduationYear",
  "major",
] as const;

export type SchoolFieldName = (typeof SCHOOL_FIELDS)[number];

/** Form state: every value is a string exactly as typed/selected. */
export type SchoolDraft = Record<SchoolFieldName, string>;

export const emptySchoolDraft = (): SchoolDraft =>
  Object.fromEntries(SCHOOL_FIELDS.map((f) => [f, ""])) as SchoolDraft;

export type SchoolFieldErrors = Partial<Record<SchoolFieldName | "form", string>>;

/* ------------------------------- validators -------------------------------- */

const REQUIRED = "Wajib diisi.";
const PICK = "Pilih salah satu pilihan.";

// Letters/digits first; school names contain digits and punctuation ("SMPN 1 Sumedang").
const SCHOOL_NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N}\p{M} .,'’()/&-]*$/u;

const required = () =>
  z.string({ error: REQUIRED }).trim().min(1, { error: REQUIRED });

const oneOf = (options: readonly string[]) =>
  z.string({ error: PICK }).refine((v) => options.includes(v), { error: PICK });

const schema = z.object({
  schoolName: required()
    .max(150, { error: "Maksimal 150 karakter." })
    .regex(SCHOOL_NAME_RE, {
      error: "Hanya huruf, angka, spasi, dan tanda baca . , ' ( ) / & -",
    })
    .transform(collapse),
  schoolStatus: oneOf(SCHOOL_STATUS_OPTIONS),
  schoolAddress: required()
    .max(255, { error: "Maksimal 255 karakter." })
    .transform(collapse),
  graduationYear: oneOf(GRADUATION_YEAR_OPTIONS).transform(Number),
  major: oneOf(MAJOR_OPTIONS),
});

/* ------------------------------ public result ------------------------------ */

/** Normalized previous-school data (+ chosen major), see ADR-023 for DB mapping. */
export type SchoolInput = {
  schoolName: string;
  /** Maps to `PreviousSchool.ownership`. */
  schoolStatus: (typeof SCHOOL_STATUS_OPTIONS)[number];
  /** Maps to `PreviousSchool.streetAddress`. */
  schoolAddress: string;
  graduationYear: number;
  /** No Prisma column yet (OPEN for Phase 5). */
  major: (typeof MAJOR_OPTIONS)[number];
};

export type SchoolValidation =
  | { ok: true; data: SchoolInput }
  | { ok: false; errors: SchoolFieldErrors };

/**
 * Validates the previous-school draft (browser or server). Reports every error
 * at once. Accepts `unknown` because the server action receives untrusted input.
 */
export function validateSchoolDraft(input: unknown): SchoolValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { form: "Data tidak valid." } };
  }
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data as SchoolInput };

  const fieldErrors = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const errors: SchoolFieldErrors = {};
  for (const f of SCHOOL_FIELDS) {
    const message = fieldErrors[f]?.[0];
    if (message) errors[f] = message;
  }
  if (Object.keys(errors).length === 0) errors.form = "Data tidak valid.";
  return { ok: false, errors };
}
