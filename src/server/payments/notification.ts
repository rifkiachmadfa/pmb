import "server-only";
import { z } from "zod";

import { ADMISSION_PERIOD } from "@/config/admission";
import type { PaymentStatus, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/server/db";
import { lockRegistration } from "./lock";
import { getTransactionStatus, MidtransRequestError } from "./midtrans";
import { getMidtransConfig } from "./midtrans-env";
import {
  canTransition,
  computeEventKey,
  computeSignature,
  mapProviderStatus,
  parseGrossAmount,
  signatureMatches,
} from "./status";

/**
 * A Midtrans transaction report, whether it came from the notification webhook or
 * from our own server-to-server status call. Only strings, as sent by Midtrans.
 */
export type ProviderReport = {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  transactionStatus: string;
  transactionId?: string;
  fraudStatus?: string;
  paymentType?: string;
  transactionTime?: string;
  currency?: string;
};

export type RecordOutcome =
  /** The payment moved to a new state. */
  | { result: "applied"; status: PaymentStatus }
  /** Verified and stored, but nothing to change (same state, out of order, refund, ...). */
  | { result: "recorded"; status: PaymentStatus }
  /** The same report was already processed. No side effects were repeated. */
  | { result: "duplicate"; status: PaymentStatus }
  /** Matched a known payment but failed a check (e.g. amount). Stored, never applied. */
  | { result: "rejected"; reason: RejectionReason }
  | { result: "unknown_order" };

export type RejectionReason = "amount_mismatch" | "currency_mismatch";

const SAFE_STRING = z.string().min(1).max(200);

const webhookSchema = z.object({
  order_id: SAFE_STRING,
  status_code: SAFE_STRING,
  gross_amount: SAFE_STRING,
  signature_key: SAFE_STRING,
  transaction_status: SAFE_STRING,
  transaction_id: SAFE_STRING.optional(),
  fraud_status: SAFE_STRING.optional(),
  payment_type: SAFE_STRING.optional(),
  transaction_time: SAFE_STRING.optional(),
  currency: SAFE_STRING.optional(),
});

export type NotificationOutcome =
  | RecordOutcome
  | { result: "invalid_payload" }
  | { result: "invalid_signature" };

/**
 * Handles one Midtrans HTTP notification (called by the webhook route).
 *
 * Order of checks, cheapest and most security-relevant first:
 *  1. Shape of the body (untrusted JSON).
 *  2. Signature: SHA-512(order_id + status_code + gross_amount + serverKey), compared in
 *     constant time. Fails => nothing is read from or written to the database.
 *  3. Identity: the order id must belong to a Payment we created.
 *  4. Amount: the reported amount must equal the amount STORED on that Payment.
 *  5. State: the mapped status must be an allowed transition from the current one.
 *
 * Throws only for infrastructure failures (database down, bad Midtrans config); the
 * route turns those into a 5xx so Midtrans retries.
 */
export async function processMidtransNotification(body: unknown): Promise<NotificationOutcome> {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) return { result: "invalid_payload" };
  const n = parsed.data;

  const expected = computeSignature(
    n.order_id,
    n.status_code,
    n.gross_amount,
    getMidtransConfig().serverKey,
  );
  if (!signatureMatches(expected, n.signature_key)) return { result: "invalid_signature" };

  return recordProviderReport(
    {
      orderId: n.order_id,
      statusCode: n.status_code,
      grossAmount: n.gross_amount,
      transactionStatus: n.transaction_status,
      transactionId: n.transaction_id,
      fraudStatus: n.fraud_status,
      paymentType: n.payment_type,
      transactionTime: n.transaction_time,
      currency: n.currency,
    },
    "webhook",
  );
}

/**
 * Applies an already-authenticated provider report to the matching Payment, once.
 * Callers must have authenticated the report (signature for the webhook; the
 * server-key-authenticated HTTPS call for status sync).
 */
export async function recordProviderReport(
  report: ProviderReport,
  source: "webhook" | "status_sync",
): Promise<RecordOutcome> {
  const db = getDb();

  // Unlocked read only to find which registration to lock; re-read under the lock.
  const lookup = await db.payment.findUnique({
    where: { orderId: report.orderId },
    select: { id: true, registrationId: true },
  });
  if (!lookup) return { result: "unknown_order" };

  const eventKey = computeEventKey({
    orderId: report.orderId,
    transactionStatus: report.transactionStatus,
    statusCode: report.statusCode,
    grossAmount: report.grossAmount,
    fraudStatus: report.fraudStatus,
    transactionTime: report.transactionTime,
  });

  return db.$transaction(async (tx): Promise<RecordOutcome> => {
    await lockRegistration(tx, lookup.registrationId);

    const payment = await tx.payment.findUnique({
      where: { id: lookup.id },
      select: {
        id: true,
        registrationId: true,
        amountIdr: true,
        status: true,
        providerTransactionId: true,
      },
    });
    if (!payment) return { result: "unknown_order" };

    const already = await tx.paymentEvent.findUnique({
      where: { eventKey },
      select: { id: true },
    });
    if (already) return { result: "duplicate", status: payment.status };

    const now = new Date();
    // Allow-listed, non-personal fields only. No va numbers, card data or raw payload.
    const safeMetadata: Prisma.InputJsonObject = {
      source,
      ...(report.paymentType ? { paymentType: report.paymentType } : {}),
      ...(report.transactionTime ? { transactionTime: report.transactionTime } : {}),
    };
    const baseEvent = {
      paymentId: payment.id,
      eventKey,
      providerStatus: report.transactionStatus,
      providerStatusCode: report.statusCode,
      fraudStatus: report.fraudStatus ?? null,
      safeMetadata,
      processedAt: now,
    };

    // 4. Amount (and currency) against the STORED expectation.
    const reportedAmount = parseGrossAmount(report.grossAmount);
    if (reportedAmount === null || reportedAmount !== payment.amountIdr) {
      await tx.paymentEvent.create({
        data: {
          ...baseEvent,
          reportedAmountIdr: reportedAmount,
          verified: false,
          rejectionReason: "amount_mismatch",
          resultingStatus: null,
        },
      });
      return { result: "rejected", reason: "amount_mismatch" };
    }
    if (report.currency !== undefined && report.currency !== "IDR") {
      await tx.paymentEvent.create({
        data: {
          ...baseEvent,
          reportedAmountIdr: reportedAmount,
          verified: false,
          rejectionReason: "currency_mismatch",
          resultingStatus: null,
        },
      });
      return { result: "rejected", reason: "currency_mismatch" };
    }

    // 5. State transition.
    const mapped = mapProviderStatus(report.transactionStatus, report.fraudStatus);
    let target: PaymentStatus | null = mapped;
    let note: string | null = null;

    if (mapped === null) {
      note = "unhandled_provider_status";
    } else if (mapped === "PAID") {
      const otherPaid = await tx.payment.findFirst({
        where: {
          registrationId: payment.registrationId,
          status: "PAID",
          NOT: { id: payment.id },
        },
        select: { id: true },
      });
      if (otherPaid) {
        // Money was really received twice. Never mark a second payment PAID and never
        // queue a second notification; staff must reconcile (refund policy is OPEN).
        target = null;
        note = "duplicate_paid_needs_reconciliation";
        console.warn("payment.notification duplicate PAID for one registration; reconcile manually");
      }
    }

    const applies = target !== null && canTransition(payment.status, target);
    if (target !== null && !applies && !note) {
      if (target === "PAID" && payment.status !== "PAID") {
        // A verified success for an attempt we had already closed (expired/canceled).
        // Do not reopen it automatically; staff must reconcile the money.
        note = "paid_after_final_state_needs_reconciliation";
        console.warn("payment.notification PAID after final state; reconcile manually");
      } else {
        note = "ignored_transition";
      }
    }

    if (applies && target !== null) {
      const claimTransactionId =
        report.transactionId &&
        !payment.providerTransactionId &&
        !(await tx.payment.findUnique({
          where: { providerTransactionId: report.transactionId },
          select: { id: true },
        }));

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: target,
          ...(target === "PAID" ? { paidAt: now } : {}),
          ...(report.paymentType ? { paymentMethod: report.paymentType } : {}),
          ...(claimTransactionId ? { providerTransactionId: report.transactionId } : {}),
        },
      });

      if (target === "PAID") {
        // Durable outbox row, written in the same transaction as the verified state.
        // The unique dedupeKey means a repeat can never queue a second message.
        // Sending is Phase 7 and can never undo the payment.
        await tx.notificationDelivery.create({
          data: {
            registrationId: payment.registrationId,
            paymentId: payment.id,
            event: "PAYMENT_VERIFIED",
            dedupeKey: `payment:${payment.id}:PAYMENT_VERIFIED`,
            nextAttemptAt: now,
          },
        });
      }
    } else if (mapped === "PENDING" && payment.status === "PENDING") {
      // Still unpaid, but remember which method/transaction the payer picked.
      if (report.paymentType) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { paymentMethod: report.paymentType },
        });
      }
    }

    await tx.paymentEvent.create({
      data: {
        ...baseEvent,
        reportedAmountIdr: reportedAmount,
        verified: true,
        rejectionReason: note,
        resultingStatus: applies ? target : null,
      },
    });

    if (applies && target !== null) return { result: "applied", status: target };
    return { result: "recorded", status: payment.status };
  });
}

export type SyncOutcome =
  | { status: "synced"; applied: number }
  | { status: "no_pending_payment" }
  | { status: "not_found_at_provider" }
  | { status: "provider_unavailable" }
  | { status: "no_registration" };

/**
 * Browser-return / "I already paid" path. The browser only ASKS the server to check;
 * the server asks Midtrans directly (authenticated with the server key) and applies
 * the answer through the same verification and idempotent recording as the webhook.
 * Nothing the browser sends (query string, redirect flags) is treated as payment proof.
 *
 * Only the signed-in account's own unpaid attempts are checked, and finished payments
 * are never re-queried, so repeated calls cannot change a final state.
 */
export async function syncOwnPendingPayments(ownerId: string): Promise<SyncOutcome> {
  const db = getDb();
  const registration = await db.registration.findUnique({
    where: { ownerId_admissionPeriod: { ownerId, admissionPeriod: ADMISSION_PERIOD } },
    select: { id: true },
  });
  if (!registration) return { status: "no_registration" };

  const pending = await db.payment.findMany({
    where: { registrationId: registration.id, status: "PENDING", snapToken: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { orderId: true },
  });
  if (pending.length === 0) return { status: "no_pending_payment" };

  const serverKey = getMidtransConfig().serverKey;
  let applied = 0;
  let sawProviderRecord = false;

  for (const { orderId } of pending) {
    let remote;
    try {
      remote = await getTransactionStatus(orderId);
    } catch (e) {
      if (e instanceof MidtransRequestError) {
        console.error(`payment.sync provider failure: ${e.reason}${e.status ? ` ${e.status}` : ""}`);
        return { status: "provider_unavailable" };
      }
      throw e;
    }
    if (!remote) continue;
    sawProviderRecord = true;

    const { transaction_status, order_id, gross_amount } = remote;
    if (!transaction_status || !order_id || !gross_amount) continue;
    // Identity: the answer must be about the order we asked for.
    if (order_id !== orderId) continue;
    // If Midtrans included a signature, it must be valid too.
    if (remote.signature_key) {
      const expected = computeSignature(order_id, remote.status_code, gross_amount, serverKey);
      if (!signatureMatches(expected, remote.signature_key)) continue;
    }

    const outcome = await recordProviderReport(
      {
        orderId: order_id,
        statusCode: remote.status_code,
        grossAmount: gross_amount,
        transactionStatus: transaction_status,
        transactionId: remote.transaction_id,
        fraudStatus: remote.fraud_status,
        paymentType: remote.payment_type,
        transactionTime: remote.transaction_time,
        currency: remote.currency,
      },
      "status_sync",
    );
    if (outcome.result === "applied") applied += 1;
  }

  if (!sawProviderRecord) return { status: "not_found_at_provider" };
  return { status: "synced", applied };
}
