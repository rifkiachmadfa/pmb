import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Takes a row lock on one registration for the rest of the transaction.
 *
 * Payment creation, notification processing and status sync all lock the SAME
 * registration row first, so for one applicant they run one at a time. That is what
 * makes "at most one PAID payment per registration", "reuse the pending attempt" and
 * "one PaymentEvent per notification" safe under double clicks, parallel tabs and
 * duplicate callbacks, without a schema change.
 */
export async function lockRegistration(tx: Prisma.TransactionClient, registrationId: string) {
  await tx.$queryRaw`SELECT id FROM registrations WHERE id = ${registrationId}::uuid FOR UPDATE`;
}
