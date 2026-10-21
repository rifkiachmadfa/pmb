/**
 * Who may do what in the admin area (Phase 8, PROPOSED — ai/ADMIN_FLOW.md).
 *
 * The role model is NOT approved by the school. The schema has one staff role
 * (`ADMISSION_STAFF`), so the first version gives it every permission. The table is the
 * single place to change when finer roles (viewer / decider) are approved; call sites
 * ask for a PERMISSION, never for a role name.
 *
 * Unknown roles get nothing (deny by default).
 */

export type AccountRoleName = "STUDENT" | "ADMISSION_STAFF";

export const PERMISSIONS = [
  "registration:list",
  "registration:review",
  "admission:decide",
  "reconciliation:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AccountRoleName, ReadonlyArray<Permission>> = {
  STUDENT: [],
  ADMISSION_STAFF: [...PERMISSIONS],
};

export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role || !Object.hasOwn(ROLE_PERMISSIONS, role)) return false;
  return ROLE_PERMISSIONS[role as AccountRoleName].includes(permission);
}
