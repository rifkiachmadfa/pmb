import "server-only";
import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";

import { ADMISSION_PERIOD, TERMS_VERSION } from "@/config/admission";
import { validateParentsDraft } from "@/features/registration/guardian-schema";
import { validateSchoolDraft } from "@/features/registration/school-schema";
import { validateStudentDraft } from "@/features/registration/student-schema";
import { getDb } from "@/server/db";

export type SubmitSection = "terms" | "student" | "guardian" | "previousSchool";

export type SubmitOutcome =
  | { status: "created"; registrationNumber: string }
  | { status: "already_submitted"; registrationNumber: string }
  /** Names the failing sections only; never field values. */
  | { status: "invalid"; sections: SubmitSection[] };

// Unambiguous characters only (no 0/O, 1/I/L): the number is read aloud and typed.
const NUMBER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const MAX_NUMBER_ATTEMPTS = 5;

/**
 * Human-facing reference, e.g. `PMB-7K3M-XQ4P`. Random (not sequential) so it
 * cannot be enumerated. Format is PROPOSED, not school-approved (ADR-024).
 */
export function generateRegistrationNumber(): string {
  const pick = () =>
    Array.from({ length: 4 }, () => NUMBER_ALPHABET[randomInt(NUMBER_ALPHABET.length)]).join("");
  return `PMB-${pick()}-${pick()}`;
}

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/**
 * Validates the full wizard payload on the server and, only if every section is
 * valid, creates the registration for `ownerId`.
 *
 * - `ownerId` always comes from the verified session, never from the payload.
 * - All rows (registration, student, guardians, previous school, notification
 *   outbox row) are written in ONE transaction: no orphan or partial records.
 * - One registration per account per period is enforced by the unique
 *   (ownerId, admissionPeriod) constraint, so a double click, a second tab, or a
 *   retry resolves to `already_submitted` instead of a duplicate.
 * - The outbox row is only a durable "to do"; sending (Phase 7) can never fail
 *   or roll back the registration.
 */
export async function submitRegistration(
  ownerId: string,
  input: unknown,
): Promise<SubmitOutcome> {
  const raw =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const student = validateStudentDraft(raw.student);
  const guardian = validateParentsDraft(raw.guardian);
  const school = validateSchoolDraft(raw.previousSchool);

  const sections: SubmitSection[] = [];
  if (raw.termsAccepted !== true) sections.push("terms");
  if (!student.ok) sections.push("student");
  if (!guardian.ok) sections.push("guardian");
  if (!school.ok) sections.push("previousSchool");
  if (!student.ok || !guardian.ok || !school.ok || sections.length > 0) {
    return { status: "invalid", sections };
  }

  const db = getDb();
  const existing = await findOwn(ownerId);
  if (existing) return existing;

  const { father, mother, guardian: guardianPerson } = guardian.data;
  const people = [father, mother, ...(guardianPerson ? [guardianPerson] : [])];

  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
    const registrationNumber = generateRegistrationNumber();
    const now = new Date();
    try {
      await db.$transaction(async (tx) => {
        const registration = await tx.registration.create({
          data: {
            ownerId,
            admissionPeriod: ADMISSION_PERIOD,
            registrationNumber,
            status: "SUBMITTED",
            lastCompletedStep: 5,
            termsAcceptedAt: now,
            termsVersion: TERMS_VERSION,
            submittedAt: now,
            chosenMajor: school.data.major,
            studentData: { create: { ...student.data } },
            guardians: {
              create: people.map((p) => ({
                relationship: p.relationship,
                fullName: p.fullName,
                nik: p.nik,
                birthYear: p.birthYear,
                education: p.education,
                occupation: p.occupation,
                incomeRange: p.incomeRange,
                mobilePhone: p.mobilePhone,
              })),
            },
            previousSchool: {
              create: {
                schoolName: school.data.schoolName,
                ownership: school.data.schoolStatus,
                streetAddress: school.data.schoolAddress,
                graduationYear: school.data.graduationYear,
              },
            },
          },
          select: { id: true },
        });

        // Durable outbox row; the unique dedupeKey guarantees one per registration.
        await tx.notificationDelivery.create({
          data: {
            registrationId: registration.id,
            event: "REGISTRATION_CREATED",
            dedupeKey: `registration:${registration.id}:REGISTRATION_CREATED`,
            nextAttemptAt: now,
          },
        });
      });
      return { status: "created", registrationNumber };
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      // Either a concurrent submit by this account won (return it), or the random
      // number collided with someone else's (retry with a new one).
      const winner = await findOwn(ownerId);
      if (winner) return winner;
    }
  }
  throw new Error("registration_number_exhausted");
}

/** The account's own registration for the current period, if any. Owner-filtered. */
async function findOwn(ownerId: string): Promise<SubmitOutcome | null> {
  const found = await getDb().registration.findUnique({
    where: { ownerId_admissionPeriod: { ownerId, admissionPeriod: ADMISSION_PERIOD } },
    select: { status: true, registrationNumber: true },
  });
  if (!found) return null;
  if (found.status !== "SUBMITTED" || !found.registrationNumber) {
    // No code path creates DRAFT rows yet; refuse rather than guess.
    throw new Error("unexpected_registration_state");
  }
  return { status: "already_submitted", registrationNumber: found.registrationNumber };
}
