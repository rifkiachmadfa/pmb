/**
 * Admission configuration used when a registration is created.
 *
 * ADMISSION_PERIOD labels every registration; with the unique
 * (ownerId, admissionPeriod) constraint it also means one registration per
 * account per period (PROPOSED, ADR-018).
 *
 * TERMS_VERSION identifies the wording of the five terms the applicant accepted
 * (see OFFICIAL_TERMS in features/registration/steps.ts). Bump it whenever the
 * wording changes, e.g. when ADR-013 is resolved.
 */
export const ADMISSION_PERIOD = "2026/2027";
export const TERMS_VERSION = "2026-10-22-draft";
