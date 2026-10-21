import { z } from "zod";

import {
  MOBILE_RE,
  NAME_RE,
  collapse,
  stripPhone,
} from "./student-schema";

/**
 * Data Orang Tua / Wali (step 3): field list supplied by the owner (Phase 4).
 *
 * Pure module shared by the browser (usability validation) and the server
 * action (the check that counts). It must not import anything server-only.
 * Error messages never echo the submitted values.
 *
 * Option lists, the year range, the "-" convention for the guardian and the
 * duplicate-NIK rule are PROPOSED defaults (ai/DECISIONS.md ADR-022). They live
 * here so changing them is a one-file edit.
 */

/* ------------------------------ option lists ------------------------------ */

/** Verbatim from the owner's form (including the "Tdk Sekolah" spelling). */
export const EDUCATION_OPTIONS = [
  "Tdk Sekolah",
  "SD/MI",
  "SMP/MTs",
  "SMA/SMK/MA",
  "DIPLOMA",
  "S1",
  "S2",
  "S3",
] as const;

/** Order and wording follow the owner's form for each role. */
export const FATHER_OCCUPATION_OPTIONS = [
  "Buruh",
  "Wirausaha",
  "Wiraswasta",
  "Karyawan Swasta",
  "PNS/TNI/POLRI",
  "Pensiunan",
  "Nelayan",
  "Petani",
  "Peternak",
  "Pedagang Besar",
  "Pedagang Kecil",
  "TKI",
  "Tidak Bekerja",
  "Sudah Meninggal",
  "Lainnya",
] as const;

export const MOTHER_OCCUPATION_OPTIONS = [
  "Wirausaha",
  "Buruh",
  "Wiraswasta",
  "Karyawan Swasta",
  "Pensiunan",
  "PNS/TNI/POLRI",
  "Petani",
  "Nelayan",
  "Peternak",
  "Pedagang Besar",
  "Pedagang Kecil",
  "TKI",
  "Tidak Bekerja",
  "Telah Meninggal",
  "Lainnya",
] as const;

/** The owner gave no list for the guardian: father's list without "Sudah Meninggal" (ADR-022). */
export const GUARDIAN_OCCUPATION_OPTIONS = FATHER_OCCUPATION_OPTIONS.filter(
  (o) => o !== "Sudah Meninggal",
);

export const INCOME_OPTIONS = [
  "< 500rb",
  "500-1jt",
  "1jt-3jt",
  "3jt-5jt",
  "5jt-10jt",
  ">10jt",
] as const;

export const PARENT_BIRTH_YEAR_MIN = 1930;
export const PARENT_BIRTH_YEAR_MAX = 2010;

/* --------------------------------- fields --------------------------------- */

export const PARENT_ROLES = ["father", "mother", "guardian"] as const;
export type ParentRole = (typeof PARENT_ROLES)[number];

export const PERSON_KEYS = [
  "nik",
  "fullName",
  "birthYear",
  "education",
  "occupation",
  "income",
  "mobilePhone",
] as const;
export type PersonKey = (typeof PERSON_KEYS)[number];

export type ParentsFieldName = `${ParentRole}${Capitalize<PersonKey>}`;

export const parentsFieldName = (role: ParentRole, key: PersonKey) =>
  `${role}${key[0].toUpperCase()}${key.slice(1)}` as ParentsFieldName;

/** Every draft field, in screen order (father, mother, guardian). */
export const PARENTS_FIELDS: readonly ParentsFieldName[] = PARENT_ROLES.flatMap(
  (role) => PERSON_KEYS.map((key) => parentsFieldName(role, key)),
);

/** Form state: every value is a string exactly as typed/selected. */
export type ParentsDraft = Record<ParentsFieldName, string>;

export const emptyParentsDraft = (): ParentsDraft =>
  Object.fromEntries(PARENTS_FIELDS.map((f) => [f, ""])) as ParentsDraft;

export type ParentsFieldErrors = Partial<Record<ParentsFieldName | "form", string>>;

export const PARENT_ROLE_LABEL: Record<ParentRole, string> = {
  father: "Ayah",
  mother: "Ibu",
  guardian: "Wali",
};

export const occupationOptions = (role: ParentRole): readonly string[] =>
  role === "father"
    ? FATHER_OCCUPATION_OPTIONS
    : role === "mother"
      ? MOTHER_OCCUPATION_OPTIONS
      : GUARDIAN_OCCUPATION_OPTIONS;

/** "-" means "none". Guardian: any field. Father/mother: only the phone number. */
export const allowsDash = (role: ParentRole, key: PersonKey) =>
  role === "guardian" || key === "mobilePhone";

/* ------------------------------- validators -------------------------------- */

const PICK = "Pilih salah satu pilihan.";
const GUARDIAN_GROUP_ERROR =
  "Lengkapi data wali, atau isi semua isian wali dengan “-” jika tidak ada wali.";

const oneOf = (options: readonly string[]) =>
  z.string({ error: PICK }).refine((v) => options.includes(v), { error: PICK });

function fieldSchema(role: ParentRole, key: PersonKey) {
  switch (key) {
    case "nik":
      return z
        .string()
        .regex(/^\d+$/, { error: "NIK hanya boleh berisi angka." })
        .length(16, { error: "NIK harus 16 digit." });
    case "fullName":
      return z
        .string()
        .max(100, { error: "Maksimal 100 karakter." })
        .regex(NAME_RE, { error: "Hanya huruf, spasi, dan tanda baca . , ' -" })
        .transform(collapse);
    case "birthYear":
      return z
        .string()
        .regex(/^\d{4}$/, { error: "Tahun lahir harus 4 digit angka." })
        .refine(
          (v) => Number(v) >= PARENT_BIRTH_YEAR_MIN && Number(v) <= PARENT_BIRTH_YEAR_MAX,
          {
            error: `Tahun lahir harus antara ${PARENT_BIRTH_YEAR_MIN} dan ${PARENT_BIRTH_YEAR_MAX}.`,
          },
        )
        .transform(Number);
    case "education":
      return oneOf(EDUCATION_OPTIONS);
    case "occupation":
      return oneOf(occupationOptions(role));
    case "income":
      return oneOf(INCOME_OPTIONS);
    case "mobilePhone":
      return (
        z
          .string()
          .refine((v) => MOBILE_RE.test(stripPhone(v)), {
            error: "Nomor HP tidak valid (contoh: 081234567890), atau isi “-” jika tidak ada.",
          })
          // Stored in local format: +62 / 62 prefix becomes 0.
          .transform((v) => stripPhone(v).replace(/^(?:\+62|62)/, "0"))
      );
  }
}

const blankMessage = (role: ParentRole, key: PersonKey) =>
  allowsDash(role, key)
    ? "Wajib diisi. Isi “-” jika tidak ada."
    : "Wajib diisi.";

type Cell =
  | { kind: "blank"; error: string }
  | { kind: "dash" }
  | { kind: "invalid"; error: string }
  | { kind: "value"; value: string | number };

function readCell(raw: Record<string, unknown>, role: ParentRole, key: PersonKey): Cell {
  const v = raw[parentsFieldName(role, key)];
  const value = typeof v === "string" ? v.trim() : "";
  if (!value) return { kind: "blank", error: blankMessage(role, key) };
  if (value === "-" && allowsDash(role, key)) return { kind: "dash" };
  const parsed = fieldSchema(role, key).safeParse(value);
  return parsed.success
    ? { kind: "value", value: parsed.data as string | number }
    : { kind: "invalid", error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
}

/* ------------------------------ public result ------------------------------ */

/** One parent/guardian, shaped like the Prisma `ParentGuardian` columns. */
export type ParentPersonInput = {
  relationship: "FATHER" | "MOTHER" | "GUARDIAN";
  nik: string;
  fullName: string;
  birthYear: number;
  education: string;
  occupation: string;
  incomeRange: string;
  /** null when the form says "-". */
  mobilePhone: string | null;
};

export type ParentsInput = {
  father: ParentPersonInput;
  mother: ParentPersonInput;
  /** null when every guardian field is "-" (no guardian). */
  guardian: ParentPersonInput | null;
};

export type ParentsValidation =
  | { ok: true; data: ParentsInput }
  | { ok: false; errors: ParentsFieldErrors };

const RELATIONSHIP = {
  father: "FATHER",
  mother: "MOTHER",
  guardian: "GUARDIAN",
} as const;

const CORE_KEYS = PERSON_KEYS.filter((k) => k !== "mobilePhone");

/**
 * Validates the parents/guardian draft (browser or server). Reports every error
 * at once. Accepts `unknown` because the server action receives untrusted input.
 */
export function validateParentsDraft(input: unknown): ParentsValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { form: "Data tidak valid." } };
  }
  const raw = input as Record<string, unknown>;
  const errors: ParentsFieldErrors = {};
  const people: Partial<Record<ParentRole, ParentPersonInput | null>> = {};

  for (const role of PARENT_ROLES) {
    const cells = Object.fromEntries(
      PERSON_KEYS.map((k) => [k, readCell(raw, role, k)]),
    ) as Record<PersonKey, Cell>;

    for (const key of PERSON_KEYS) {
      const cell = cells[key];
      if (cell.kind === "blank" || cell.kind === "invalid") {
        errors[parentsFieldName(role, key)] = cell.error;
      }
    }

    // Guardian is all-or-nothing: every field "-" means "no guardian".
    let noGuardian = false;
    if (role === "guardian") {
      const hasBlank = PERSON_KEYS.some((k) => cells[k].kind === "blank");
      const coreDashes = CORE_KEYS.filter((k) => cells[k].kind === "dash");
      if (!hasBlank && coreDashes.length === CORE_KEYS.length) {
        if (cells.mobilePhone.kind === "dash") {
          noGuardian = true;
        } else if (cells.mobilePhone.kind === "value") {
          errors.guardianMobilePhone = GUARDIAN_GROUP_ERROR;
        }
      } else if (!hasBlank && coreDashes.length > 0) {
        for (const key of coreDashes) {
          errors[parentsFieldName(role, key)] = GUARDIAN_GROUP_ERROR;
        }
      }
    }

    if (noGuardian) {
      people.guardian = null;
      continue;
    }

    const ok = PERSON_KEYS.every(
      (k) => cells[k].kind === "value" || (k === "mobilePhone" && cells[k].kind === "dash"),
    );
    if (!ok) continue;

    const v = (k: PersonKey) => (cells[k] as { kind: "value"; value: string | number }).value;
    people[role] = {
      relationship: RELATIONSHIP[role],
      nik: v("nik") as string,
      fullName: v("fullName") as string,
      birthYear: v("birthYear") as number,
      education: v("education") as string,
      occupation: v("occupation") as string,
      incomeRange: v("income") as string,
      mobilePhone: cells.mobilePhone.kind === "dash" ? null : (v("mobilePhone") as string),
    };
  }

  // The same NIK cannot identify two different people (ADR-022).
  const seen = new Map<string, ParentRole>();
  for (const role of PARENT_ROLES) {
    const person = people[role];
    if (!person || errors[parentsFieldName(role, "nik")]) continue;
    const earlier = seen.get(person.nik);
    if (earlier) {
      errors[parentsFieldName(role, "nik")] =
        `NIK sama dengan NIK ${PARENT_ROLE_LABEL[earlier].toLowerCase()}. Periksa kembali.`;
    } else {
      seen.set(person.nik, role);
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const { father, mother } = people;
  if (!father || !mother || people.guardian === undefined) {
    return { ok: false, errors: { form: "Data tidak valid." } };
  }
  return { ok: true, data: { father, mother, guardian: people.guardian } };
}
