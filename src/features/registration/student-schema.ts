import { z } from "zod";

/**
 * Data Siswa (step 2): field list supplied by the owner (ai/BUSINESS_RULES.md).
 *
 * One pure module shared by the browser (usability validation, instant
 * feedback) and the server action (the check that actually counts). It must not
 * import anything server-only. Error messages never echo the submitted values.
 *
 * Option lists and the KPS/KIP rule below are PROPOSED defaults, not approved
 * by the school (see ai/DECISIONS.md ADR-021). They live here so changing them
 * is a one-file edit.
 */

const pad = (n: number) => String(n).padStart(2, "0");
const range = (count: number, map: (i: number) => string) =>
  Array.from({ length: count }, (_, i) => map(i));

/* ------------------------------ option lists ------------------------------ */

export const GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;
export const RELIGION_OPTIONS = [
  "Islam",
  "Kristen Katolik",
  "Kristen Protestan",
  "Hindu",
  "Budha",
  "Konghucu",
  "Lainnya",
] as const;
export const CITIZENSHIP_OPTIONS = ["Indonesia", "Luar Negeri"] as const;
export const YES_NO_OPTIONS = ["Ya", "Tidak"] as const;
export const RESIDENCE_OPTIONS = [
  "Bersama Orang Tua",
  "Wali",
  "Kost",
  "Asrama",
  "Pesantren",
  "Lainnya",
] as const;
export const TRANSPORT_OPTIONS = [
  "Motor",
  "Kendaraan Umum",
  "Jalan Kaki",
  "Lainnya",
] as const;

export const RT_OPTIONS = range(16, (i) => String(i + 1).padStart(3, "0"));
export const RW_OPTIONS = range(20, (i) => String(i + 1).padStart(3, "0"));

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;
export const BIRTH_DAY_OPTIONS = range(31, (i) => pad(i + 1));
export const BIRTH_MONTH_OPTIONS = MONTH_NAMES.map((label, i) => ({
  value: pad(i + 1),
  label,
}));
export const BIRTH_YEAR_MIN = 1990;
export const BIRTH_YEAR_MAX = 2024;
export const BIRTH_YEAR_OPTIONS = range(
  BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1,
  (i) => String(BIRTH_YEAR_MIN + i),
);

/* --------------------------------- fields --------------------------------- */

/** Every draft field, in the order it appears on screen. */
export const STUDENT_FIELDS = [
  "nisn",
  "nik",
  "birthCertificateNumber",
  "familyCardNumber",
  "fullName",
  "gender",
  "birthPlace",
  "birthDay",
  "birthMonth",
  "birthYear",
  "religion",
  "streetAddress",
  "rt",
  "rw",
  "village",
  "subdistrict",
  "regency",
  "province",
  "postalCode",
  "citizenship",
  "isKpsRecipient",
  "kpsNumber",
  "isKipRecipient",
  "kipNumber",
  "kipHolderName",
  "birthOrder",
  "siblingCount",
  "heightCm",
  "weightKg",
  "residenceType",
  "distanceToSchoolKm",
  "transportMode",
  "mobilePhone",
  "landlinePhone",
  "email",
] as const;

export type StudentFieldName = (typeof STUDENT_FIELDS)[number];

/** Form state: every value is a string exactly as typed/selected. */
export type StudentDraft = Record<StudentFieldName, string>;

export const emptyStudentDraft = (): StudentDraft =>
  Object.fromEntries(STUDENT_FIELDS.map((f) => [f, ""])) as StudentDraft;

type BirthPart = "birthDay" | "birthMonth" | "birthYear";

/** Errors are keyed by field; the three birth selects share one `birthDate` error. */
export type StudentErrorKey = Exclude<StudentFieldName, BirthPart> | "birthDate";
export type StudentFieldErrors = Partial<Record<StudentErrorKey | "form", string>>;

/** Screen order of error keys, used to focus the first invalid field. */
export const STUDENT_ERROR_ORDER: readonly StudentErrorKey[] = STUDENT_FIELDS.flatMap(
  (f): StudentErrorKey[] =>
    f === "birthDay" ? ["birthDate"] : f === "birthMonth" || f === "birthYear" ? [] : [f],
);

/* --------------------------- per-field validators -------------------------- */

const REQUIRED = "Wajib diisi.";
const PICK = "Pilih salah satu pilihan.";

export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]*$/u;
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9 ./-]*$/;
export const MOBILE_RE = /^(?:\+62|62|0)8\d{8,12}$/;
const LANDLINE_RE = /^\+?\d{6,15}$/;
const DISTANCE_RE = /^\d{1,4}(?:[.,]\d{1,2})?$/;

export const collapse = (v: string) => v.replace(/\s+/g, " ");
export const stripPhone = (v: string) => v.replace(/[\s().-]/g, "");

const required = () =>
  z.string({ error: REQUIRED }).trim().min(1, { error: REQUIRED });

const freeText = (max: number) =>
  required()
    .max(max, { error: `Maksimal ${max} karakter.` })
    .transform(collapse);

const personName = (max: number) =>
  required()
    .max(max, { error: `Maksimal ${max} karakter.` })
    .regex(NAME_RE, { error: "Hanya huruf, spasi, dan tanda baca . , ' -" })
    .transform(collapse);

const digits = (length: number, what: string) =>
  required()
    .regex(/^\d+$/, { error: `${what} hanya boleh berisi angka.` })
    .length(length, { error: `${what} harus ${length} digit.` });

const oneOf = (options: readonly string[]) =>
  z.string({ error: PICK }).refine((v) => options.includes(v), { error: PICK });

const integer = (what: string, min: number, max: number) =>
  required()
    .regex(/^\d{1,4}$/, { error: `${what} harus berupa angka bulat.` })
    .refine((v) => Number(v) >= min && Number(v) <= max, {
      error: `${what} harus antara ${min} dan ${max}.`,
    })
    .transform(Number);

const baseSchema = z.object({
  nisn: digits(10, "NISN"),
  nik: digits(16, "NIK"),
  birthCertificateNumber: required()
    .max(50, { error: "Maksimal 50 karakter." })
    .regex(CODE_RE, {
      error: "Hanya huruf, angka, spasi, titik, garis miring, dan tanda hubung.",
    })
    .transform(collapse),
  familyCardNumber: digits(16, "Nomor KK"),
  fullName: personName(100),
  gender: oneOf(GENDER_OPTIONS),
  birthPlace: freeText(100),
  religion: oneOf(RELIGION_OPTIONS),

  streetAddress: freeText(255),
  rt: oneOf(RT_OPTIONS),
  rw: oneOf(RW_OPTIONS),
  village: freeText(100),
  subdistrict: freeText(100),
  regency: freeText(100),
  province: freeText(100),
  postalCode: digits(5, "Kode pos"),
  citizenship: oneOf(CITIZENSHIP_OPTIONS),

  isKpsRecipient: oneOf(YES_NO_OPTIONS),
  isKipRecipient: oneOf(YES_NO_OPTIONS),

  birthOrder: integer("Anak ke", 1, 30),
  siblingCount: integer("Jumlah saudara", 0, 30),
  heightCm: integer("Tinggi badan", 100, 250),
  weightKg: integer("Berat badan", 20, 200),
  residenceType: oneOf(RESIDENCE_OPTIONS),
  distanceToSchoolKm: required()
    .regex(DISTANCE_RE, {
      error: "Isi dengan angka, boleh desimal (contoh: 2,5).",
    })
    .refine((v) => Number(v.replace(",", ".")) <= 1000, {
      error: "Jarak maksimal 1000 km.",
    })
    .transform((v) => Number(v.replace(",", "."))),
  transportMode: oneOf(TRANSPORT_OPTIONS),

  mobilePhone: required()
    .refine((v) => MOBILE_RE.test(stripPhone(v)), {
      error: "Nomor HP tidak valid (contoh: 081234567890).",
    })
    // Stored in local format: +62 / 62 prefix becomes 0.
    .transform((v) => stripPhone(v).replace(/^(?:\+62|62)/, "0")),
  // "-" means "no landline" (owner's form convention); stored as null.
  landlinePhone: required()
    .refine((v) => v === "-" || LANDLINE_RE.test(stripPhone(v)), {
      error: "Isi nomor telepon (6-15 digit) atau “-” jika tidak punya.",
    })
    .transform((v) => (v === "-" ? null : stripPhone(v))),
  email: required()
    .max(254, { error: "Maksimal 254 karakter." })
    .pipe(z.email({ error: "Format email tidak valid." }))
    .transform((v) => v.toLowerCase()),
});

/* ------------------------- conditional / cross-field ----------------------- */

/**
 * PROPOSED rule (ADR-021): "Penerima = Tidak" means the number/name is "-" and
 * is stored as null. "Penerima = Ya" requires a real value ("-" is rejected).
 */
function programValue(
  isRecipient: boolean,
  raw: string,
  what: string,
  test: (v: string) => boolean,
  max: number,
): { value: string | null; error?: string } {
  if (!isRecipient) return { value: null };
  if (!raw) return { value: null, error: REQUIRED };
  if (raw === "-") {
    return {
      value: null,
      error: `Isi ${what} yang sebenarnya, atau ubah pilihan penerima menjadi Tidak.`,
    };
  }
  if (raw.length > max) return { value: null, error: `Maksimal ${max} karakter.` };
  if (!test(raw)) return { value: null, error: `${what} tidak valid.` };
  return { value: collapse(raw) };
}

function parseBirthDate(
  day: string,
  month: string,
  year: string,
): { date?: Date; error?: string } {
  if (!day || !month || !year) {
    return { error: "Pilih tanggal, bulan, dan tahun lahir." };
  }
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (
    !BIRTH_DAY_OPTIONS.includes(day) ||
    !BIRTH_MONTH_OPTIONS.some((o) => o.value === month) ||
    !BIRTH_YEAR_OPTIONS.includes(year)
  ) {
    return { error: "Pilihan tanggal lahir tidak valid." };
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return { error: "Tanggal lahir tidak valid: hari tersebut tidak ada pada bulan itu." };
  }
  if (date.getTime() > Date.now()) {
    return { error: "Tanggal lahir tidak boleh di masa depan." };
  }
  return { date };
}

/* ------------------------------ public result ------------------------------ */

/** Normalized student data, shaped like the Prisma `StudentData` columns. */
export type StudentInput = {
  nisn: string;
  nik: string;
  birthCertificateNumber: string;
  familyCardNumber: string;
  fullName: string;
  gender: string;
  birthPlace: string;
  birthDate: Date;
  religion: string;
  streetAddress: string;
  rt: string;
  rw: string;
  village: string;
  subdistrict: string;
  regency: string;
  province: string;
  postalCode: string;
  citizenship: string;
  isKpsRecipient: boolean;
  kpsNumber: string | null;
  isKipRecipient: boolean;
  kipNumber: string | null;
  kipHolderName: string | null;
  birthOrder: number;
  siblingCount: number;
  heightCm: number;
  weightKg: number;
  residenceType: string;
  distanceToSchoolKm: number;
  transportMode: string;
  mobilePhone: string;
  landlinePhone: string | null;
  email: string;
};

export type StudentValidation =
  | { ok: true; data: StudentInput }
  | { ok: false; errors: StudentFieldErrors };

const text = (raw: Record<string, unknown>, key: StudentFieldName): string =>
  typeof raw[key] === "string" ? (raw[key] as string).trim() : "";

/**
 * Validates a student draft (browser or server). Always reports every error at
 * once. Accepts `unknown` because the server action receives untrusted input.
 */
export function validateStudentDraft(input: unknown): StudentValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { form: "Data tidak valid." } };
  }
  const raw = input as Record<string, unknown>;
  const errors: StudentFieldErrors = {};

  const base = baseSchema.safeParse(raw);
  if (!base.success) {
    const fieldErrors = z.flattenError(base.error).fieldErrors as Record<
      string,
      string[] | undefined
    >;
    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (messages?.[0]) errors[key as StudentErrorKey] = messages[0];
    }
  }

  const birth = parseBirthDate(
    text(raw, "birthDay"),
    text(raw, "birthMonth"),
    text(raw, "birthYear"),
  );
  if (birth.error) errors.birthDate = birth.error;

  const isKps = text(raw, "isKpsRecipient") === "Ya";
  const isKip = text(raw, "isKipRecipient") === "Ya";
  const kps = programValue(isKps, text(raw, "kpsNumber"), "No. KPS", (v) => CODE_RE.test(v), 30);
  const kip = programValue(isKip, text(raw, "kipNumber"), "No. KIP", (v) => CODE_RE.test(v), 30);
  const kipName = programValue(
    isKip,
    text(raw, "kipHolderName"),
    "Nama di KIP",
    (v) => NAME_RE.test(v),
    100,
  );
  if (kps.error) errors.kpsNumber = kps.error;
  if (kip.error) errors.kipNumber = kip.error;
  if (kipName.error) errors.kipHolderName = kipName.error;

  if (!base.success || !birth.date || Object.keys(errors).length > 0) {
    if (Object.keys(errors).length === 0) errors.form = "Data tidak valid.";
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      ...base.data,
      birthDate: birth.date,
      isKpsRecipient: isKps,
      kpsNumber: kps.value,
      isKipRecipient: isKip,
      kipNumber: kip.value,
      kipHolderName: kipName.value,
    },
  };
}
