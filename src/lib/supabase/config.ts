import { z } from "zod";

const publicConfigSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

/**
 * Public Supabase settings. Safe to use in proxy and server code.
 *
 * The publishable key is designed to be public; it is NOT a secret and grants
 * only what Supabase Auth/RLS allow. The service-role key is never used here.
 * Error messages list variable NAMES only, never values.
 */
export function getSupabasePublicConfig() {
  const result = publicConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!result.success) {
    throw new Error(
      "Invalid or missing environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return result.data;
}
