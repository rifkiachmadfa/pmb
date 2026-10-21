import "server-only";
import { z } from "zod";

/**
 * Midtrans environment, validated lazily and separately from `getServerEnv()`
 * so the rest of the app (login, registration) runs without payment keys.
 *
 *  - MIDTRANS_SERVER_KEY: SECRET. Server-only; never sent to the browser, never logged.
 *  - NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: public key used by snap.js in the browser (later task).
 *  - MIDTRANS_IS_PRODUCTION: "true" for production, otherwise sandbox.
 *
 * No key-prefix check: current sandbox keys look like "Mid-server-..." (older ones
 * "SB-Mid-server-..."), so the prefix cannot tell sandbox from production. The
 * environment is chosen ONLY by MIDTRANS_IS_PRODUCTION (which picks the host);
 * Midtrans rejects a key used against the wrong host with 401, which surfaces as
 * a provider error, never as a payment.
 */
const envSchema = z.object({
  MIDTRANS_SERVER_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.string().trim().min(1),
  MIDTRANS_IS_PRODUCTION: z.enum(["true", "false"]).default("false"),
});

export type MidtransConfig = {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  /** Server-to-server endpoint that issues Snap tokens. */
  snapTransactionsUrl: string;
  /** Script the browser loads to open the payment popup (later task). */
  snapJsUrl: string;
  /** Base of the server-to-server status API: `${statusBaseUrl}/{order_id}/status`. */
  statusBaseUrl: string;
};

const HOSTS = {
  sandbox: {
    transactions: "https://app.sandbox.midtrans.com/snap/v1/transactions",
    js: "https://app.sandbox.midtrans.com/snap/snap.js",
    status: "https://api.sandbox.midtrans.com/v2",
  },
  production: {
    transactions: "https://app.midtrans.com/snap/v1/transactions",
    js: "https://app.midtrans.com/snap/snap.js",
    status: "https://api.midtrans.com/v2",
  },
} as const;

export class MidtransConfigError extends Error {
  constructor(names: string) {
    // Variable NAMES only, never values.
    super(`Invalid or missing Midtrans environment variables: ${names}`);
    this.name = "MidtransConfigError";
  }
}

let cached: MidtransConfig | undefined;

export function getMidtransConfig(): MidtransConfig {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new MidtransConfigError(names);
  }

  const env = result.data;
  const isProduction = env.MIDTRANS_IS_PRODUCTION === "true";
  const hosts = isProduction ? HOSTS.production : HOSTS.sandbox;
  cached = {
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    isProduction,
    snapTransactionsUrl: hosts.transactions,
    snapJsUrl: hosts.js,
    statusBaseUrl: hosts.status,
  };
  return cached;
}

/** Test helper: forget the cached config after changing process.env. */
export function resetMidtransConfigForTests() {
  cached = undefined;
}
