import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Used only by `src/proxy.ts`. Refreshes the Supabase session cookies and
 * reports whether the request carries a VALID signed session (getClaims()
 * verifies the JWT; getSession() must never be trusted on the server).
 *
 * This is an optimistic check for redirects. Authorization of data is still
 * enforced in the data-access layer (`src/server/auth/session.ts`).
 */
export async function refreshSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  return { response, isAuthenticated: Boolean(data?.claims?.sub) };
}
