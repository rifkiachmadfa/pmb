import "server-only";
import { randomInt } from "node:crypto";
import { z } from "zod";

import { INITIAL_PAYMENT_AMOUNT_IDR, INITIAL_PAYMENT_ITEM } from "@/config/payment";
import { getMidtransConfig } from "./midtrans-env";

/**
 * Midtrans order ids: max 50 chars; letters, digits and `_ - . ~` only.
 * Our ids are server-generated and opaque (no personal data, not guessable).
 */
const ORDER_ID_RE = /^[A-Za-z0-9_.~-]{1,50}$/;
const ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateMidtransOrderId(): string {
  const random = Array.from({ length: 20 }, () => ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)]).join("");
  return `PMB-${random}`;
}

export type SnapTransaction = { token: string; redirectUrl: string };

/**
 * Failure while talking to Midtrans. Carries only a stable reason and, when
 * there is one, the HTTP status. The provider's response body is NOT copied
 * into the error: callers can log `name`/`reason`/`status` safely.
 */
export class MidtransRequestError extends Error {
  constructor(
    readonly reason: "invalid_order_id" | "network" | "timeout" | "http_error" | "bad_response",
    readonly status?: number,
  ) {
    super(`Midtrans request failed: ${reason}${status ? ` (${status})` : ""}`);
    this.name = "MidtransRequestError";
  }
}

const responseSchema = z.object({
  token: z.string().min(1),
  redirect_url: z.url(),
});

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Asks Midtrans for a Snap token for the INITIAL payment.
 *
 * - The amount is not a parameter: it is always INITIAL_PAYMENT_AMOUNT_IDR, so no
 *   caller (and no browser input) can change what is charged.
 * - Server-to-server only: the server key goes in the Basic auth header and
 *   never leaves this module.
 * - This function only creates the transaction at Midtrans. It does NOT touch the
 *   database, and a returned token is NOT proof of payment; only a verified
 *   notification can mark a payment as paid (later task).
 */
export async function createSnapTransaction(orderId: string): Promise<SnapTransaction> {
  if (!ORDER_ID_RE.test(orderId)) throw new MidtransRequestError("invalid_order_id");

  const config = getMidtransConfig();
  const body = {
    transaction_details: { order_id: orderId, gross_amount: INITIAL_PAYMENT_AMOUNT_IDR },
    item_details: [
      {
        id: INITIAL_PAYMENT_ITEM.id,
        name: INITIAL_PAYMENT_ITEM.name,
        price: INITIAL_PAYMENT_AMOUNT_IDR,
        quantity: 1,
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch(config.snapTransactionsUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new MidtransRequestError(timedOut ? "timeout" : "network");
  }

  if (!response.ok) throw new MidtransRequestError("http_error", response.status);

  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new MidtransRequestError("bad_response", response.status);

  return { token: parsed.data.token, redirectUrl: parsed.data.redirect_url };
}
