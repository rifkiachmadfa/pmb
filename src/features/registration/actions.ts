"use server";

import { getSessionUser } from "@/server/auth/session";
import { validateSchoolDraft, type SchoolFieldErrors } from "./school-schema";
import { validateParentsDraft, type ParentsFieldErrors } from "./guardian-schema";
import { validateStudentDraft, type StudentFieldErrors } from "./student-schema";

export type ValidateStudentResult =
  | { status: "ok" }
  | { status: "invalid"; errors: StudentFieldErrors }
  | { status: "unauthenticated" };

/**
 * Server-side check of the Data Siswa step (Phase 3). Validates only: nothing is
 * stored yet (persistence is Phase 5). Server Actions are public POST endpoints,
 * so the session is verified here even though the page is already protected.
 *
 * The payload is untrusted and personal: it is never logged, and the response
 * carries only field names and fixed messages, never the submitted values.
 */
export async function validateStudentStep(
  input: unknown,
): Promise<ValidateStudentResult> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };

  const result = validateStudentDraft(input);
  return result.ok
    ? { status: "ok" }
    : { status: "invalid", errors: result.errors };
}

export type ValidateParentsResult =
  | { status: "ok" }
  | { status: "invalid"; errors: ParentsFieldErrors }
  | { status: "unauthenticated" };

/**
 * Server-side check of the Data Orang Tua / Wali step (Phase 4). Validates only;
 * nothing is stored (persistence is Phase 5). Same rules as the student step:
 * session verified here, payload never logged, response carries field names and
 * fixed messages only.
 */
export async function validateParentsStep(
  input: unknown,
): Promise<ValidateParentsResult> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };

  const result = validateParentsDraft(input);
  return result.ok
    ? { status: "ok" }
    : { status: "invalid", errors: result.errors };
}

export type ValidateSchoolResult =
  | { status: "ok" }
  | { status: "invalid"; errors: SchoolFieldErrors }
  | { status: "unauthenticated" };

/**
 * Server-side check of the Data Sekolah Asal step (Phase 4). Validates only;
 * nothing is stored (persistence is Phase 5). Session verified here, payload
 * never logged, response carries field names and fixed messages only.
 */
export async function validateSchoolStep(
  input: unknown,
): Promise<ValidateSchoolResult> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };

  const result = validateSchoolDraft(input);
  return result.ok
    ? { status: "ok" }
    : { status: "invalid", errors: result.errors };
}
