/** The five registration steps, in order. Ids are stable; labels are UI text. */
export const REGISTRATION_STEPS = [
  { id: "ketentuan", label: "Ketentuan" },
  { id: "data-siswa", label: "Data Siswa" },
  { id: "data-orang-tua", label: "Data Orang Tua / Wali" },
  { id: "data-sekolah-asal", label: "Data Sekolah Asal" },
  { id: "konfirmasi", label: "Konfirmasi" },
] as const;

export type RegistrationStepId = (typeof REGISTRATION_STEPS)[number]["id"];

export const LAST_STEP_INDEX = REGISTRATION_STEPS.length - 1;

/** Index of "Data Siswa"; leaving it forward requires a valid student draft. */
export const STUDENT_STEP_INDEX = REGISTRATION_STEPS.findIndex(
  (s) => s.id === "data-siswa",
);

/** Index of "Data Orang Tua / Wali"; leaving it forward requires a valid draft. */
export const PARENTS_STEP_INDEX = REGISTRATION_STEPS.findIndex(
  (s) => s.id === "data-orang-tua",
);

/** Index of "Data Sekolah Asal"; leaving it forward requires a valid draft. */
export const SCHOOL_STEP_INDEX = REGISTRATION_STEPS.findIndex(
  (s) => s.id === "data-sekolah-asal",
);

/**
 * Official terms supplied by the owner (ai/BUSINESS_RULES.md), verbatim.
 * Term 3 mentions receiving a password; the wording still needs school/owner
 * approval to match secure account creation (ADR-013). Do not edit without it.
 */
export const OFFICIAL_TERMS = [
  "Setiap calon siswa wajib mengisi form pendaftaran dengan lengkap.",
  "Data-data yang diisikan pada form PPDB Online harus sesuai dengan data asli dan benar adanya.",
  "Calon siswa yang sudah mendaftarkan secara online akan mendapatkan password serta dilampirkan dalam persyaratan yang diminta oleh Panitia PPDB MSMK YADIKA TANJUNGSARI SUMEDANG.",
  "Calon siswa yang sudah mendaftarkan diri melalui PPDB Online SMK YADIKA TANJUNGSARI SUMEDANG wajib menyerahkan dokumen persyaratan yang sudah ditentukan oleh Panitia PPDB SMK YADIKA TANJUNGSARI SUMEDANG.",
  "Data yang sudah diberikan kepada Panitia PPDB SMK YADIKA TANJUNGSARI SUMEDANG hanya digunakan untuk keperluan penerimaan siswa baru, tidak dipublikasikan, dan dijaga kerahasiaannya oleh Panitia PPDB.",
] as const;
