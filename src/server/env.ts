import "server-only";
import { z } from "zod";

const postgresUrl = z
  .string()
  .min(1)
  .regex(/^postgres(ql)?:\/\//, "must be a postgres:// or postgresql:// URL");

/**
 * Server-side environment schema.
 *
 * Phase 1 only validates what the foundation needs. Provider variables
 * (Supabase Auth, Midtrans, Fonnte) are added in the phase that introduces
 * them, so unused secrets are never required nor referenced.
 */
const serverEnvSchema = z.object({
  /** Pooled connection used by the running application. */
  DATABASE_URL: postgresUrl,
  /** Direct/session connection used only by Prisma Migrate (see prisma.config.ts). */
  DIRECT_URL: postgresUrl,
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Parses and caches the environment on first use (lazy, so `next build` does
 * not need secrets). Error messages list variable NAMES only, never values.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const names = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ].join(", ");
    throw new Error(`Invalid or missing environment variables: ${names}`);
  }

  cached = result.data;
  return cached;
}
