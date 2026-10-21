/**
 * Pure rules for changing a registration's admission status (Phase 8, PROPOSED).
 *
 * No framework, database or session imports: everything here is a plain function so it
 * can be unit-tested and reasoned about in isolation. The server layer
 * (`src/server/admin/decide.ts`) supplies the facts (read inside a locked transaction)
 * and applies the result.
 *
 * Every rule below is a PROPOSAL (ai/ADMIN_FLOW.md) until the owner/school approves it.
 * Hard rules that ARE approved (BUSINESS_RULES 10, 11, ADR-011): payment never changes
 * admission status, and only authorized staff may change it.
 */

export const ADMISSION_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export type RegistrationState = "DRAFT" | "SUBMITTED";

export const DECISION_NOTE_MAX_LENGTH = 500;
/** A correction (changing an existing decision) must explain itself. PROPOSED. */
export const CORRECTION_NOTE_MIN_LENGTH = 5;

export type DecisionRejectionReason =
  /** Only a SUBMITTED registration can be decided. */
  | "registration_not_submitted"
  /** Staff cannot decide a registration owned by their own account (conflict of interest). */
  | "self_decision_forbidden"
  /** Target equals the current status: nothing to record. */
  | "same_status"
  | "note_too_long"
  /** Changing a status that is not PENDING needs a written reason. */
  | "note_required"
  /** Only when the policy option requires verified payment before ACCEPTED. */
  | "payment_not_verified";

export type DecisionFacts = {
  registrationStatus: RegistrationState;
  currentStatus: AdmissionStatus;
  targetStatus: AdmissionStatus;
  /** Raw note from staff; normalised by `normalizeNote`. */
  note: string | null | undefined;
  actorAccountId: string;
  registrationOwnerId: string;
  /** True when a PAID payment exists (server-verified). Informational unless the option below is on. */
  paymentVerified: boolean;
};

export type DecisionOptions = {
  /**
   * OPEN business question: must the initial payment be verified before a student can be
   * ACCEPTED? Not decided by the school, so the default is false. Rejecting or leaving
   * PENDING never requires payment.
   */
  requirePaidForAcceptance: boolean;
};

export const DEFAULT_DECISION_OPTIONS: DecisionOptions = { requirePaidForAcceptance: false };

export type DecisionEvaluation =
  | { ok: true; fromStatus: AdmissionStatus; toStatus: AdmissionStatus; note: string | null }
  | { ok: false; reason: DecisionRejectionReason };

/** Trims; empty becomes null. Length is checked separately so over-long input is rejected, not cut. */
export function normalizeNote(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

export function evaluateDecision(
  facts: DecisionFacts,
  options: DecisionOptions = DEFAULT_DECISION_OPTIONS,
): DecisionEvaluation {
  if (facts.registrationStatus !== "SUBMITTED") {
    return { ok: false, reason: "registration_not_submitted" };
  }
  if (facts.actorAccountId === facts.registrationOwnerId) {
    return { ok: false, reason: "self_decision_forbidden" };
  }
  if (facts.targetStatus === facts.currentStatus) {
    return { ok: false, reason: "same_status" };
  }

  const note = normalizeNote(facts.note);
  if (note !== null && note.length > DECISION_NOTE_MAX_LENGTH) {
    return { ok: false, reason: "note_too_long" };
  }

  const isCorrection = facts.currentStatus !== "PENDING";
  if (isCorrection && (note === null || note.length < CORRECTION_NOTE_MIN_LENGTH)) {
    return { ok: false, reason: "note_required" };
  }

  if (
    options.requirePaidForAcceptance &&
    facts.targetStatus === "ACCEPTED" &&
    !facts.paymentVerified
  ) {
    return { ok: false, reason: "payment_not_verified" };
  }

  return { ok: true, fromStatus: facts.currentStatus, toStatus: facts.targetStatus, note };
}

/** Indonesian, user-facing text for each rejection (no personal data, safe to show staff). */
export const DECISION_REJECTION_MESSAGES: Record<DecisionRejectionReason, string> = {
  registration_not_submitted: "Pendaftaran ini belum dikirim, sehingga belum bisa diputuskan.",
  self_decision_forbidden: "Petugas tidak dapat memutuskan pendaftaran milik akunnya sendiri.",
  same_status: "Status penerimaan sudah sama dengan yang dipilih.",
  note_too_long: `Catatan maksimal ${DECISION_NOTE_MAX_LENGTH} karakter.`,
  note_required: `Mengubah keputusan yang sudah ada wajib disertai alasan (minimal ${CORRECTION_NOTE_MIN_LENGTH} karakter).`,
  payment_not_verified: "Pembayaran awal belum terverifikasi.",
};
