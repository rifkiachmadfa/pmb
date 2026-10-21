/**
 * Derives ONE payment status for a registration from its payment attempts.
 * Same rule the applicant dashboard uses (`getOwnPayment`): a PAID attempt wins,
 * otherwise the most recent attempt, otherwise NOT_STARTED. Pure function.
 */

export type PaymentState = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELED";
export type DerivedPaymentStatus = PaymentState | "NOT_STARTED";

export function derivePaymentStatus(
  attempts: ReadonlyArray<{ status: PaymentState; createdAt: Date }>,
): DerivedPaymentStatus {
  if (attempts.some((a) => a.status === "PAID")) return "PAID";
  if (attempts.length === 0) return "NOT_STARTED";
  let latest = attempts[0];
  for (const a of attempts) {
    if (a.createdAt.getTime() > latest.createdAt.getTime()) latest = a;
  }
  return latest.status;
}

/** Payment events with this suffix in `rejectionReason` were verified but NOT applied (see ADR-026). */
export const RECONCILIATION_REASON_SUFFIX = "_needs_reconciliation";
