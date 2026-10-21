import { createHash, timingSafeEqual } from "node:crypto";

import type { PaymentStatus } from "@/generated/prisma/client";

/**
 * Pure payment-status rules (no I/O, no secrets of its own). Everything here is
 * deterministic so it can be tested without Midtrans or a database.
 *
 * Mapping follows the documented Midtrans transaction statuses. Anything we do not
 * recognise maps to `null` ("no state change") instead of guessing.
 */

/** What a provider status means for OUR payment state, or null for "do not change". */
export function mapProviderStatus(
  transactionStatus: string,
  fraudStatus?: string | null,
): PaymentStatus | null {
  switch (transactionStatus) {
    case "settlement":
      return "PAID";
    case "capture":
      // Card payments: only an explicit `accept` is money we can rely on.
      if (fraudStatus === "accept") return "PAID";
      if (fraudStatus === "deny") return "FAILED";
      return "PENDING"; // `challenge` or missing: under review, not paid
    case "authorize":
    case "pending":
      return "PENDING";
    case "deny":
    case "failure":
      return "FAILED";
    case "cancel":
      return "CANCELED";
    case "expire":
      return "EXPIRED";
    // refund / partial_refund / chargeback: refund policy is OPEN, so these never
    // change the state automatically. The event is still recorded for staff.
    default:
      return null;
  }
}

/**
 * Allowed state transitions (PROPOSED, ADR-026).
 *  - PENDING may move to any state.
 *  - PAID is final: a late "pending"/"expire" can never downgrade it.
 *  - FAILED may still become PAID (Snap lets the payer retry within the same order
 *    after e.g. a denied card); CANCELED and EXPIRED are final.
 *  - Same-state "transitions" are not transitions.
 */
const ALLOWED: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ["PAID", "FAILED", "EXPIRED", "CANCELED"],
  FAILED: ["PAID"],
  PAID: [],
  EXPIRED: [],
  CANCELED: [],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return ALLOWED[from].includes(to);
}

/**
 * Midtrans reports `gross_amount` as a string such as "350000.00". Returns whole
 * rupiah, or null for anything that is not an exact non-negative whole number.
 */
export function parseGrossAmount(value: string): number | null {
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  if (match[2] !== undefined && /[1-9]/.test(match[2])) return null; // fractional rupiah
  return Number(match[1]);
}

/**
 * Midtrans signature: SHA-512 hex of `order_id + status_code + gross_amount + serverKey`,
 * built from the strings exactly as received (not from parsed numbers).
 */
export function computeSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

/** Constant-time comparison; false for any malformed or wrong-length signature. */
export function signatureMatches(expectedHex: string, receivedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "utf8");
  const received = Buffer.from(receivedHex, "utf8");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * Idempotency key. Midtrans sends no event id, so the key is a fingerprint of the
 * fields that define "the same notification". The webhook and a server-side status
 * check for the same state produce the same key and therefore collapse into one event.
 */
export function computeEventKey(parts: {
  orderId: string;
  transactionStatus: string;
  statusCode: string;
  grossAmount: string;
  fraudStatus?: string | null;
  transactionTime?: string | null;
}): string {
  const canonical = [
    parts.orderId,
    parts.transactionStatus,
    parts.statusCode,
    parts.grossAmount,
    parts.fraudStatus ?? "",
    parts.transactionTime ?? "",
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}
