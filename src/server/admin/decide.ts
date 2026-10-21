import "server-only";
import { z } from "zod";

import {
  ADMISSION_STATUSES,
  DECISION_NOTE_MAX_LENGTH,
  evaluateDecision,
  type AdmissionStatus,
  type DecisionOptions,
  type DecisionRejectionReason,
  DEFAULT_DECISION_OPTIONS,
} from "@/domain/admission-decision";
import { can } from "@/domain/staff-policy";
import { getDb } from "@/server/db";
import { lockRegistration } from "@/server/payments/lock";
import { getStaffAccount } from "./guard";

const decisionInputSchema = z.object({
  registrationId: z.uuid(),
  targetStatus: z.enum(ADMISSION_STATUSES),
  /**
   * The status the staff member SAW when deciding. If someone else changed it in the
   * meantime the call fails with `conflict` instead of silently overwriting.
   */
  expectedStatus: z.enum(ADMISSION_STATUSES),
  // Longer input is rejected by the domain rule (not cut); this cap only bounds payload size.
  note: z.string().max(DECISION_NOTE_MAX_LENGTH * 4).nullish(),
});

export type DecideOutcome =
  | {
      status: "decided";
      registrationId: string;
      fromStatus: AdmissionStatus;
      toStatus: AdmissionStatus;
      decidedAt: Date;
    }
  | { status: "invalid_input" }
  | { status: "forbidden" }
  | { status: "not_found" }
  /** Someone changed the status after the staff member loaded the page. */
  | { status: "conflict"; currentStatus: AdmissionStatus }
  | { status: "rejected"; reason: DecisionRejectionReason };

/**
 * Entry point for the (future) server action: resolves the actor from the verified
 * session, so a caller cannot forget or fake the authorization step.
 */
export async function decideAdmission(rawInput: unknown): Promise<DecideOutcome> {
  const actor = await getStaffAccount("admission:decide");
  if (!actor) return { status: "forbidden" };
  return decideAdmissionAs(actor.id, rawInput);
}

/**
 * Records an admission decision on behalf of `actorAccountId`.
 *
 * Inside ONE transaction, serialised per registration by a row lock:
 *   1. re-read the actor's role from the database (a demotion between the page load and
 *      this call is honoured);
 *   2. read the registration; compare with `expectedStatus` (optimistic concurrency);
 *   3. apply the pure rules in `evaluateDecision`;
 *   4. update `registrations.admission_status` AND append an `admission_decisions` row.
 * The two writes succeed or fail together. Nothing here reads or changes payments:
 * payment never moves admission status (ADR-011); a verified payment is only a fact
 * handed to the rules.
 *
 * Exported separately from `decideAdmission` so it can be tested without a browser session.
 */
export async function decideAdmissionAs(
  actorAccountId: string,
  rawInput: unknown,
  options: DecisionOptions = DEFAULT_DECISION_OPTIONS,
): Promise<DecideOutcome> {
  const parsed = decisionInputSchema.safeParse(rawInput);
  if (!parsed.success) return { status: "invalid_input" };
  const input = parsed.data;

  return getDb().$transaction(async (tx): Promise<DecideOutcome> => {
    const actor = await tx.account.findUnique({
      where: { id: actorAccountId },
      select: { id: true, role: true },
    });
    if (!actor || !can(actor.role, "admission:decide")) return { status: "forbidden" };

    await lockRegistration(tx, input.registrationId);

    const registration = await tx.registration.findUnique({
      where: { id: input.registrationId },
      select: { ownerId: true, status: true, admissionStatus: true },
    });
    if (!registration) return { status: "not_found" };

    if (registration.admissionStatus !== input.expectedStatus) {
      return { status: "conflict", currentStatus: registration.admissionStatus };
    }

    const paid = await tx.payment.findFirst({
      where: { registrationId: input.registrationId, status: "PAID" },
      select: { id: true },
    });

    const result = evaluateDecision(
      {
        registrationStatus: registration.status,
        currentStatus: registration.admissionStatus,
        targetStatus: input.targetStatus,
        note: input.note,
        actorAccountId: actor.id,
        registrationOwnerId: registration.ownerId,
        paymentVerified: paid !== null,
      },
      options,
    );
    if (!result.ok) return { status: "rejected", reason: result.reason };

    await tx.registration.update({
      where: { id: input.registrationId },
      data: { admissionStatus: result.toStatus },
    });
    const decision = await tx.admissionDecision.create({
      data: {
        registrationId: input.registrationId,
        decidedById: actor.id,
        fromStatus: result.fromStatus,
        toStatus: result.toStatus,
        note: result.note,
      },
      select: { decidedAt: true },
    });

    return {
      status: "decided",
      registrationId: input.registrationId,
      fromStatus: result.fromStatus,
      toStatus: result.toStatus,
      decidedAt: decision.decidedAt,
    };
  });
}
