/**
 * Initial payment configuration (Phase 6).
 *
 * The amount is fixed here and is NEVER read from the browser or from a request:
 * the server creates the Midtrans transaction with this value only. The payment
 * is a deposit toward the school admission fee, not an additional fee, and it
 * does not mean the applicant is admitted (ADR-004, ADR-011).
 */
export const INITIAL_PAYMENT_AMOUNT_IDR = 350_000;

/** Shown to the payer inside the Snap payment page. Midtrans limits item names to 50 chars. */
export const INITIAL_PAYMENT_ITEM = {
  id: "ADMISSION_FEE_INITIAL",
  name: "Pembayaran awal biaya masuk PMB",
} as const;
