"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { createSupabaseServerClient } from "@/server/supabase/server";

async function getOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return new URL(configured).origin;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Starts Google OAuth (PKCE). The code is exchanged in /auth/callback. */
export async function signInWithGoogle(formData: FormData) {
  const next = sanitizeNextPath(formData.get("next")?.toString());
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/masuk?error=oauth_start");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}
