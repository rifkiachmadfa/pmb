import "server-only";

import { ADMISSION_PERIOD } from "@/config/admission";
import { getDb } from "@/server/db";

export type OwnRegistrationSummary = {
  registrationNumber: string | null;
  status: "DRAFT" | "SUBMITTED";
  submittedAt: Date | null;
  chosenMajor: string | null;
  studentName: string | null;
};

/**
 * The signed-in account's own registration for the current period.
 * Ownership is part of the query (`ownerId`): an id from the browser is never
 * used to look a registration up. Returns only what the dashboard shows.
 */
export async function getOwnRegistration(
  ownerId: string,
): Promise<OwnRegistrationSummary | null> {
  const r = await getDb().registration.findUnique({
    where: { ownerId_admissionPeriod: { ownerId, admissionPeriod: ADMISSION_PERIOD } },
    select: {
      registrationNumber: true,
      status: true,
      submittedAt: true,
      chosenMajor: true,
      studentData: { select: { fullName: true } },
    },
  });
  if (!r) return null;
  return {
    registrationNumber: r.registrationNumber,
    status: r.status,
    submittedAt: r.submittedAt,
    chosenMajor: r.chosenMajor,
    studentName: r.studentData?.fullName ?? null,
  };
}
