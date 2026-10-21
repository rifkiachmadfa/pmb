"use server";

import { ensureAccount, getSessionUser } from "@/server/auth/session";
import {
  createInitialPayment,
  getOwnPayment,
  type CreatePaymentOutcome,
  type OwnPaymentSummary,
} from "@/server/payments/create";
import { syncOwnPendingPayments, type SyncOutcome } from "@/server/payments/notification";

/**
 * Payment server actions (Phase 6, logic only; the UI that calls them is a later task).
 * Server Actions are public POST endpoints: each one verifies the session itself and
 * derives the owner from it. None of them accepts an amount, registration id, order id
 * or status from the caller.
 */

export type StartPaymentResult =
  | CreatePaymentOutcome
  | { status: "unauthenticated" }
  | { status: "error" };

function logFailure(scope: string, e: unknown) {
  // Only the error name/code: Prisma/provider messages can embed identifying values.
  const name = e instanceof Error ? e.name : "UnknownError";
  const code =
    typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "-";
  console.error(`${scope} failed: ${name} code=${code}`);
}

/** Creates (or resumes) the Rp350.000 initial payment and returns the Snap token. */
export async function startInitialPayment(): Promise<StartPaymentResult> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };
  try {
    const account = await ensureAccount(user);
    return await createInitialPayment(account.id);
  } catch (e) {
    logFailure("payment.start", e);
    return { status: "error" };
  }
}

export type PaymentStatusResult =
  | { status: "ok"; payment: OwnPaymentSummary | null }
  | { status: "unauthenticated" }
  | { status: "error" };

/** Current stored payment state (no provider call). Never includes the Snap token. */
export async function getPaymentStatus(): Promise<PaymentStatusResult> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };
  try {
    const account = await ensureAccount(user);
    return { status: "ok", payment: await getOwnPayment(account.id) };
  } catch (e) {
    logFailure("payment.status", e);
    return { status: "error" };
  }
}

export type RefreshPaymentResult =
  | { status: "ok"; sync: SyncOutcome; payment: OwnPaymentSummary | null }
  | { status: "unauthenticated" }
  | { status: "error" };

/**
 * For the page the payer returns to after Midtrans: asks Midtrans (server-side) for the
 * real state of the account's unpaid attempts, applies it with the same checks as the
 * webhook, then returns the stored state. The browser return itself proves nothing.
 */
export async function refreshPaymentStatus(): Promise<RefreshPaymentResult> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };
  try {
    const account = await ensureAccount(user);
    const sync = await syncOwnPendingPayments(account.id);
    return { status: "ok", sync, payment: await getOwnPayment(account.id) };
  } catch (e) {
    logFailure("payment.refresh", e);
    return { status: "error" };
  }
}
