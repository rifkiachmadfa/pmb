import { NextResponse, type NextRequest } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { refreshSession } from "@/server/supabase/refresh-session";

const PROTECTED_PREFIXES = ["/pendaftaran", "/dashboard"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Redirect while keeping any refreshed session cookies set on `from`. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

/**
 * Refreshes the auth session on every page request and redirects visitors
 * without a valid session away from private routes. Optimistic only: pages and
 * server actions must still call `requireAccount()`.
 */
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await refreshSession(request);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(url, response);
  }

  if (isAuthenticated && pathname === "/masuk") {
    const target = new URL(
      sanitizeNextPath(request.nextUrl.searchParams.get("next")),
      request.nextUrl.origin,
    );
    return redirectWithCookies(target, response);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, image optimization, favicon, and API routes.
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
