"use server";

import { getSessionUser } from "@/server/auth/session";
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
