import { NextResponse, type NextRequest } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { ensureAccount } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** Removes anything that could be personal data or a credential from a log line. */
function redact(text: string): string {
  return text
    .replace(/postgres(ql)?:\/\/\S+/gi, "[db-url]")
    .replace(/\S+@\S+/g, "[redacted]")
    .slice(0, 300);
}

/**
 * Safe diagnostic for the server log: error class, Prisma/driver code, a
 * redacted first message line, and the top stack frames (file locations only).
 * Never the raw error object (may contain the email or query arguments).
 */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "UnknownError";
  const e = error as { code?: unknown; errorCode?: unknown; cause?: unknown };
  const code = e.code ?? e.errorCode;
  const cause = e.cause instanceof Error ? ` cause=${e.cause.name}` : "";
  const message = redact(error.message.split("\n")[0] ?? "");
  const frames = (error.stack ?? "")
    .split("\n")
    .filter((line) => line.trim().startsWith("at "))
    .slice(0, 3)
    .map((line) => redact(line.trim()))
    .join(" | ");
  return `${error.name}${typeof code === "string" ? ` code=${code}` : ""}${cause} message="${message}" frames=${frames}`;
}

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
  } catch (error) {
    // Log only a safe summary (see describeError). Sign out so the person is
    // not left with a session but no Account.
    console.error(`[auth/callback] ensureAccount failed: ${describeError(error)}`);
    await supabase.auth.signOut();
    return fail(request, "account");
  }

  const next = sanitizeNextPath(searchParams.get("next"));
  return NextResponse.redirect(new URL(next, origin));
}
