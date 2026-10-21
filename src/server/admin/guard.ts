import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Account } from "@/generated/prisma/client";

import { can, type Permission } from "@/domain/staff-policy";
import { ensureAccount, getSessionUser } from "@/server/auth/session";

/**
 * Authorization for the admin area. The role is read from OUR database on every call
 * (`ensureAccount`), never from the browser or the auth-provider token, so demoting a
 * staff account takes effect on the next request.
 *
 * `getStaffAccount`  — for server actions / route handlers: returns null instead of redirecting.
 * `requireStaff`     — for pages: sends visitors without a session to /masuk and answers 404
 *                      to signed-in non-staff so the admin area is not advertised.
 *
 * Neither is a substitute for the check inside the data functions; those re-check too.
 */
export async function getStaffAccount(permission: Permission): Promise<Account | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const account = await ensureAccount(user);
  return can(account.role, permission) ? account : null;
}

export async function requireStaff(nextPath: string, permission: Permission): Promise<Account> {
  const user = await getSessionUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  const account = await ensureAccount(user);
  if (!can(account.role, permission)) notFound();
  return account;
}
