import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

import { ADMISSION_PERIOD } from "@/config/admission";
import { ADMISSION_STATUSES, type AdmissionStatus } from "@/domain/admission-decision";
import {
  derivePaymentStatus,
  RECONCILIATION_REASON_SUFFIX,
  type DerivedPaymentStatus,
} from "@/domain/payment-summary";
import { can, type Permission } from "@/domain/staff-policy";
import { getDb } from "@/server/db";
import { getStaffAccount } from "./guard";

/**
 * Read side of the admin area (Phase 8, PROPOSED).
 *
 * Every function exists in two forms:
 *   - `name(...)`    resolves the actor from the verified session (use from pages/actions);
 *   - `nameAs(id,...)` takes an account id and re-reads that account's role from the
 *     database (exported so the logic can be tested without a browser session).
 *
 * Data minimisation: lists and the review summary expose registration number, student
 * NAME, chosen major and the three independent statuses only. NIK, NISN, family-card
 * number, parent data, addresses and phone numbers are deliberately NOT returned; what
 * staff may see of them (and masking) is an OPEN decision. Snap tokens are never selected.
 */

export type Forbidden = { status: "forbidden" };

async function actorCan(actorAccountId: string, permission: Permission): Promise<boolean> {
  const actor = await getDb().account.findUnique({
    where: { id: actorAccountId },
    select: { role: true },
  });
  return !!actor && can(actor.role, permission);
}

async function withStaff<T>(
  permission: Permission,
  run: (actorId: string) => Promise<T | Forbidden>,
): Promise<T | Forbidden> {
  const actor = await getStaffAccount(permission);
  if (!actor) return { status: "forbidden" };
  return run(actor.id);
}

// ───────────────────────────── Overview (dashboard counters) ─────────────────────────────

export type AdmissionOverview = {
  status: "ok";
  admissionPeriod: string;
  submitted: number;
  byAdmissionStatus: Record<AdmissionStatus, number>;
  /** Submitted registrations with a verified (PAID) payment. */
  paid: number;
  /** Paid but still PENDING admission: the natural worklist for staff. */
  paidAwaitingDecision: number;
  /** Verified provider events that were NOT applied and need a human (ADR-026). Null when the staff role lacks `reconciliation:view`. */
  openReconciliationEvents: number | null;
};

export async function getAdmissionOverviewAs(
  actorAccountId: string,
): Promise<AdmissionOverview | Forbidden> {
  if (!(await actorCan(actorAccountId, "registration:list"))) return { status: "forbidden" };
  const db = getDb();
  const base = { admissionPeriod: ADMISSION_PERIOD, status: "SUBMITTED" } as const;
  const paidWhere = { payments: { some: { status: "PAID" } } } as const;

  const canSeeReconciliation = await actorCan(actorAccountId, "reconciliation:view");
  const [grouped, paid, paidAwaitingDecision, openReconciliationEvents] = await Promise.all([
    db.registration.groupBy({ by: ["admissionStatus"], where: base, _count: { _all: true } }),
    db.registration.count({ where: { ...base, ...paidWhere } }),
    db.registration.count({ where: { ...base, ...paidWhere, admissionStatus: "PENDING" } }),
    canSeeReconciliation ? db.paymentEvent.count({ where: reconciliationWhere }) : Promise.resolve(null),
  ]);

  const byAdmissionStatus: Record<AdmissionStatus, number> = { PENDING: 0, ACCEPTED: 0, REJECTED: 0 };
  for (const row of grouped) byAdmissionStatus[row.admissionStatus] = row._count._all;

  return {
    status: "ok",
    admissionPeriod: ADMISSION_PERIOD,
    submitted: byAdmissionStatus.PENDING + byAdmissionStatus.ACCEPTED + byAdmissionStatus.REJECTED,
    byAdmissionStatus,
    paid,
    paidAwaitingDecision,
    openReconciliationEvents,
  };
}
export const getAdmissionOverview = () => withStaff("registration:list", getAdmissionOverviewAs);

// ───────────────────────────── Worklist ─────────────────────────────

export const PAGE_SIZE = 20;

export const listFiltersSchema = z.object({
  admission: z.enum(ADMISSION_STATUSES).optional(),
  /** PAID = has a verified payment; NOT_PAID = none. */
  payment: z.enum(["PAID", "NOT_PAID"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type ListFilters = z.input<typeof listFiltersSchema>;

export type RegistrationListItem = {
  id: string;
  registrationNumber: string | null;
  studentName: string | null;
  chosenMajor: string | null;
  submittedAt: Date | null;
  paymentStatus: DerivedPaymentStatus;
  admissionStatus: AdmissionStatus;
};

export type RegistrationList =
  | { status: "ok"; items: RegistrationListItem[]; page: number; pageSize: number; total: number }
  | { status: "invalid_filters" };

export async function listRegistrationsAs(
  actorAccountId: string,
  rawFilters: unknown,
): Promise<RegistrationList | Forbidden> {
  if (!(await actorCan(actorAccountId, "registration:list"))) return { status: "forbidden" };
  const parsed = listFiltersSchema.safeParse(rawFilters ?? {});
  if (!parsed.success) return { status: "invalid_filters" };
  const f = parsed.data;

  const and: Prisma.RegistrationWhereInput[] = [];
  if (f.admission) and.push({ admissionStatus: f.admission });
  if (f.payment === "PAID") and.push({ payments: { some: { status: "PAID" } } });
  if (f.payment === "NOT_PAID") and.push({ payments: { none: { status: "PAID" } } });
  if (f.q) {
    and.push({
      OR: [
        { registrationNumber: { contains: f.q.toUpperCase() } },
        { studentData: { is: { fullName: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  const where: Prisma.RegistrationWhereInput = {
    admissionPeriod: ADMISSION_PERIOD,
    status: "SUBMITTED",
    AND: and,
  };

  const db = getDb();
  const [total, rows] = await Promise.all([
    db.registration.count({ where }),
    db.registration.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        registrationNumber: true,
        chosenMajor: true,
        submittedAt: true,
        admissionStatus: true,
        studentData: { select: { fullName: true } },
        payments: { select: { status: true, createdAt: true } },
      },
    }),
  ]);

  return {
    status: "ok",
    page: f.page,
    pageSize: PAGE_SIZE,
    total,
    items: rows.map((r) => ({
      id: r.id,
      registrationNumber: r.registrationNumber,
      studentName: r.studentData?.fullName ?? null,
      chosenMajor: r.chosenMajor,
      submittedAt: r.submittedAt,
      paymentStatus: derivePaymentStatus(r.payments),
      admissionStatus: r.admissionStatus,
    })),
  };
}
export const listRegistrations = (rawFilters: unknown) =>
  withStaff("registration:list", (id) => listRegistrationsAs(id, rawFilters));

// ───────────────────────────── Review (one registration) ─────────────────────────────

export type RegistrationReview = {
  status: "ok";
  id: string;
  registrationNumber: string | null;
  studentName: string | null;
  chosenMajor: string | null;
  submittedAt: Date | null;
  admissionStatus: AdmissionStatus;
  paymentStatus: DerivedPaymentStatus;
  /** True when the signed-in staff account owns this registration: deciding is blocked. */
  ownedByActor: boolean;
  payments: Array<{
    orderId: string;
    status: string;
    amountIdr: number;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  /** Append-only history, newest first. */
  decisions: Array<{
    fromStatus: AdmissionStatus;
    toStatus: AdmissionStatus;
    note: string | null;
    decidedAt: Date;
    decidedByEmail: string;
  }>;
};

export async function getRegistrationReviewAs(
  actorAccountId: string,
  registrationId: string,
): Promise<RegistrationReview | { status: "not_found" } | Forbidden> {
  if (!(await actorCan(actorAccountId, "registration:review"))) return { status: "forbidden" };
  if (!z.uuid().safeParse(registrationId).success) return { status: "not_found" };

  const r = await getDb().registration.findFirst({
    where: { id: registrationId, status: "SUBMITTED" },
    select: {
      id: true,
      ownerId: true,
      registrationNumber: true,
      chosenMajor: true,
      submittedAt: true,
      admissionStatus: true,
      studentData: { select: { fullName: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        // snapToken is deliberately NOT selected.
        select: { orderId: true, status: true, amountIdr: true, paidAt: true, createdAt: true },
      },
      admissionDecisions: {
        orderBy: { decidedAt: "desc" },
        select: {
          fromStatus: true,
          toStatus: true,
          note: true,
          decidedAt: true,
          decidedBy: { select: { email: true } },
        },
      },
    },
  });
  if (!r) return { status: "not_found" };

  return {
    status: "ok",
    id: r.id,
    registrationNumber: r.registrationNumber,
    studentName: r.studentData?.fullName ?? null,
    chosenMajor: r.chosenMajor,
    submittedAt: r.submittedAt,
    admissionStatus: r.admissionStatus,
    paymentStatus: derivePaymentStatus(r.payments),
    ownedByActor: r.ownerId === actorAccountId,
    payments: r.payments,
    decisions: r.admissionDecisions.map((d) => ({
      fromStatus: d.fromStatus,
      toStatus: d.toStatus,
      note: d.note,
      decidedAt: d.decidedAt,
      decidedByEmail: d.decidedBy.email,
    })),
  };
}
export const getRegistrationReview = (registrationId: string) =>
  withStaff("registration:review", (id) => getRegistrationReviewAs(id, registrationId));

// ───────────────────────────── Reconciliation queue (read-only) ─────────────────────────────

const reconciliationWhere: Prisma.PaymentEventWhereInput = {
  rejectionReason: { endsWith: RECONCILIATION_REASON_SUFFIX },
};

export type ReconciliationItem = {
  eventId: string;
  reason: string;
  receivedAt: Date;
  orderId: string;
  registrationId: string;
  registrationNumber: string | null;
  reportedAmountIdr: number | null;
};

/**
 * Verified payment events the system refused to apply (e.g. a second PAID attempt, or a
 * success for an expired attempt). READ-ONLY on purpose: who resolves them and how
 * (refund? merge?) is an OPEN policy, and there is no "resolved" column yet.
 */
export async function listReconciliationEventsAs(
  actorAccountId: string,
): Promise<{ status: "ok"; items: ReconciliationItem[] } | Forbidden> {
  if (!(await actorCan(actorAccountId, "reconciliation:view"))) return { status: "forbidden" };
  const rows = await getDb().paymentEvent.findMany({
    where: reconciliationWhere,
    orderBy: { receivedAt: "desc" },
    take: 200,
    select: {
      id: true,
      rejectionReason: true,
      receivedAt: true,
      reportedAmountIdr: true,
      payment: {
        select: {
          orderId: true,
          registration: { select: { id: true, registrationNumber: true } },
        },
      },
    },
  });
  return {
    status: "ok",
    items: rows.map((e) => ({
      eventId: e.id,
      reason: e.rejectionReason ?? "",
      receivedAt: e.receivedAt,
      orderId: e.payment.orderId,
      registrationId: e.payment.registration.id,
      registrationNumber: e.payment.registration.registrationNumber,
      reportedAmountIdr: e.reportedAmountIdr,
    })),
  };
}
export const listReconciliationEvents = () =>
  withStaff("reconciliation:view", listReconciliationEventsAs);
