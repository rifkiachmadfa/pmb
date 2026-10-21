import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Account } from "@/generated/prisma/client";

import { getDb } from "@/server/db";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type SessionUser = { id: string; email: string };

/**
 * Verified identity of the current request, or null.
 * Uses getClaims() (JWT signature verified), never getSession().
 * Deduplicated per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !claims.email) return null;
  return { id: claims.sub, email: claims.email.toLowerCase() };
});

/**
 * Creates the application Account on first login, otherwise returns it.
 * Every signed-in person is recorded here whether or not they ever pay.
 * Role is never taken from the client or the provider: new rows are STUDENT.
 */
export async function ensureAccount(user: SessionUser): Promise<Account> {
  const db = getDb();
  // Read first: private pages call this on every request, so avoid a write
  // (and an updated_at bump) unless the row is new or the email changed.
  const existing = await db.account.findUnique({ where: { authProviderId: user.id } });
  if (existing && existing.email === user.email) return existing;

  return db.account.upsert({
    where: { authProviderId: user.id },
    create: { authProviderId: user.id, email: user.email },
    // Keep the mirrored email in sync; never touch `role`.
    update: { email: user.email },
  });
}

/** For private pages/actions: redirects to /masuk when not signed in. */
export const requireAccount = cache(async (nextPath: string): Promise<Account> => {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  }
  return ensureAccount(user);
});
