import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Per-request Supabase client for Server Components, Server Actions and Route
 * Handlers. Session lives in HTTP cookies managed by @supabase/ssr.
 *
 * Server Components cannot write cookies; the write is ignored there and the
 * session refresh is done by `src/proxy.ts` instead.
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: safe to ignore (proxy refreshes).
        }
      },
    },
  });
}
