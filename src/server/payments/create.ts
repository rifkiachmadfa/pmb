import "server-only";

import { ADMISSION_PERIOD } from "@/config/admission";
import {
  INITIAL_PAYMENT_AMOUNT_IDR,
  INITIAL_PAYMENT_EXPIRY_HOURS,
  PAYMENT_CREATION_STALE_SECONDS,
} from "@/config/payment";
import type { PaymentStatus } from "@/generated/prisma/client";
import { getDb } from "@/server/db";
import { lockRegistration } from "./lock";
import { createSnapTransaction, generateMidtransOrderId, MidtransRequestError } from "./midtrans";
import { getMidtransConfig, MidtransConfigError } from "./midtrans-env";

export type CreatePaymentOutcome =
  | {
      status: "ready";
      orderId: string;
      snapToken: string;
      amountIdr: number;
      expiresAt: Date;
      /** true when an existing unpaid attempt was returned instead of a new one. */
      reused: boolean;
    }
  | { status: "already_paid" }
  /** No SUBMITTED registration for this account yet. */
  | { status: "not_submitted" }
  /** Another request for this applicant is creating the transaction right now. */
  | { status: "in_progress" }
  | { status: "provider_unavailable" }
  | { status: "not_configured" };

/** Reuse only if the token still has this much life left, so the popup does not open on a dying token. */
const REUSE_MARGIN_MS = 60_000;

/**
 * Starts (or resumes) the initial payment for `ownerId`'s own registration.
 *
 *  - `ownerId` comes from the verified session. Nothing from the browser selects the
 *    registration, the amount, or the order id.
 *  - The amount is INITIAL_PAYMENT_AMOUNT_IDR and is stored on the Payment row; later
 *    notification checks compare against that stored value.
 *  - Never creates a second attempt while a usable unpaid one exists, and never after
 *    a PAID one exists. Concurrent calls are serialised by a registration row lock.
 *  - The Midtrans call happens OUTSIDE the database transaction (no lock held during
 *    network I/O). The attempt row is written first, then the token is attached; a
 *    failed provider call marks the attempt CANCELED (nobody holds a token for it).
 *  - Returning a token is NOT proof of payment; only a verified notification or a
 *    server-side status check can mark a payment PAID.
 */
export async function createInitialPayment(ownerId: string): Promise<CreatePaymentOutcome> {
  try {
    getMidtransConfig();
  } catch (e) {
    if (e instanceof MidtransConfigError) return { status: "not_configured" };
    throw e;
  }

  const db = getDb();
  const registration = await db.registration.findUnique({
    where: { ownerId_admissionPeriod: { ownerId, admissionPeriod: ADMISSION_PERIOD } },
    select: { id: true, status: true },
  });
  if (!registration || registration.status !== "SUBMITTED") return { status: "not_submitted" };

  type Step =
    | { kind: "done"; outcome: CreatePaymentOutcome }
    | { kind: "create"; paymentId: string; orderId: string; expiresAt: Date };

  const step = await db.$transaction(async (tx): Promise<Step> => {
    await lockRegistration(tx, registration.id);

    const paid = await tx.payment.findFirst({
      where: { registrationId: registration.id, status: "PAID" },
      select: { id: true },
    });
    if (paid) return { kind: "done", outcome: { status: "already_paid" } };

    const now = new Date();
    const pending = await tx.payment.findMany({
      where: { registrationId: registration.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderId: true,
        snapToken: true,
        amountIdr: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    for (const p of pending) {
      if (p.snapToken && p.expiresAt && p.expiresAt.getTime() - now.getTime() > REUSE_MARGIN_MS) {
        return {
          kind: "done",
          outcome: {
            status: "ready",
            orderId: p.orderId,
            snapToken: p.snapToken,
            amountIdr: p.amountIdr,
            expiresAt: p.expiresAt,
            reused: true,
          },
        };
      }
    }

    for (const p of pending) {
      if (p.snapToken) continue; // expired/near-expiry: leave it to the provider's notification
      const ageSeconds = (now.getTime() - p.createdAt.getTime()) / 1000;
      if (ageSeconds < PAYMENT_CREATION_STALE_SECONDS) {
        return { kind: "done", outcome: { status: "in_progress" } };
      }
      // Never got a token and is older than the provider timeout: abandoned.
      await tx.payment.updateMany({
        where: { id: p.id, status: "PENDING", snapToken: null },
        data: { status: "CANCELED" },
      });
    }

    const orderId = generateMidtransOrderId();
    const expiresAt = new Date(now.getTime() + INITIAL_PAYMENT_EXPIRY_HOURS * 3_600_000);
    const created = await tx.payment.create({
      data: {
        registrationId: registration.id,
        provider: "MIDTRANS",
        purpose: "ADMISSION_FEE_INITIAL",
        amountIdr: INITIAL_PAYMENT_AMOUNT_IDR,
        orderId,
        status: "PENDING",
        expiresAt,
      },
      select: { id: true },
    });
    return { kind: "create", paymentId: created.id, orderId, expiresAt };
  });

  if (step.kind === "done") return step.outcome;

  try {
    const snap = await createSnapTransaction(step.orderId);
    await db.payment.updateMany({
      where: { id: step.paymentId, status: "PENDING", snapToken: null },
      data: { snapToken: snap.token },
    });
    return {
      status: "ready",
      orderId: step.orderId,
      snapToken: snap.token,
      amountIdr: INITIAL_PAYMENT_AMOUNT_IDR,
      expiresAt: step.expiresAt,
      reused: false,
    };
  } catch (e) {
    await db.payment
      .updateMany({
        where: { id: step.paymentId, status: "PENDING", snapToken: null },
        data: { status: "CANCELED" },
      })
      .catch(() => undefined);
    if (e instanceof MidtransRequestError) {
      console.error(`payment.create provider failure: ${e.reason}${e.status ? ` ${e.status}` : ""}`);
      return { status: "provider_unavailable" };
    }
    throw e;
  }
}

export type OwnPaymentSummary = {
  /** NOT_STARTED = no attempt yet. Independent of registration and admission status. */
  status: PaymentStatus | "NOT_STARTED";
  amountIdr: number;
  orderId: string | null;
  paidAt: Date | null;
  expiresAt: Date | null;
};

/**
 * Payment state of the signed-in account's own registration (owner-filtered in the
 * query). Shows the PAID attempt if there is one, otherwise the latest attempt.
 * Never returns the Snap token.
 */
export async function getOwnPayment(ownerId: string): Promise<OwnPaymentSummary | null> {
  const db = getDb();
  const registration = await db.registration.findUnique({
    where: { ownerId_admissionPeriod: { ownerId, admissionPeriod: ADMISSION_PERIOD } },
    select: { id: true },
  });
  if (!registration) return null;

  const select = { status: true, amountIdr: true, orderId: true, paidAt: true, expiresAt: true } as const;
  const payment =
    (await db.payment.findFirst({ where: { registrationId: registration.id, status: "PAID" }, select })) ??
    (await db.payment.findFirst({
      where: { registrationId: registration.id },
      orderBy: { createdAt: "desc" },
      select,
    }));

  if (!payment) {
    return {
      status: "NOT_STARTED",
      amountIdr: INITIAL_PAYMENT_AMOUNT_IDR,
      orderId: null,
      paidAt: null,
      expiresAt: null,
    };
  }
  return payment;
}
