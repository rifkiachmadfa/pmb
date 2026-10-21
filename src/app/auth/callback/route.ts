import { NextResponse, type NextRequest } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { ensureAccount } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

function fail(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/masuk?error=${code}`, request.nextUrl.origin));
}

/**
 * OAuth return point. Exchanges the one-time code for a session (cookies), then
 * records the Account. A redirect alone proves nothing; the session only exists
 * if the code exchange succeeds.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  if (searchParams.get("error")) return fail(request, "oauth_denied");

  const code = searchParams.get("code");
  if (!code) return fail(request, "oauth_missing_code");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(request, "oauth_exchange");

  // Verified with the Auth server (not read from the cookie).
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data.user;
  if (userError || !user?.email) {
    await supabase.auth.signOut();
    return fail(request, "no_email");
  }

  try {
    await ensureAccount({ id: user.id, email: user.email.toLowerCase() });
  } catch {
    // Do not log the error object: it may contain the email. Sign out so the
    // person is not left with a session but no Account.
    await supabase.auth.signOut();
    return fail(request, "account");
  }

  const next = sanitizeNextPath(searchParams.get("next"));
  return NextResponse.redirect(new URL(next, origin));
}
