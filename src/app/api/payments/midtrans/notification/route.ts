import { NextResponse } from "next/server";

import { MidtransConfigError } from "@/server/payments/midtrans-env";
import { processMidtransNotification } from "@/server/payments/notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Midtrans notifications are small; refuse anything absurd before parsing. */
const MAX_BODY_BYTES = 20_000;

/**
 * Midtrans HTTP notification endpoint (server-to-server, no user session).
 *
 * Response codes matter because Midtrans retries on non-2xx:
 *  - 200: processed, duplicate, or a verified report that changed nothing / was
 *         rejected on content (retrying cannot help).
 *  - 400: malformed body. 401: bad signature. 404: unknown order id.
 *  - 500: our infrastructure failed (database, misconfiguration) -> Midtrans retries.
 *
 * The body is never logged. Responses carry no detail beyond `{ ok }`.
 */
export async function POST(request: Request) {
  const text = await request.text().catch(() => null);
  if (text === null || text.length === 0 || Buffer.byteLength(text) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: text !== null && text.length > 0 ? 413 : 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const outcome = await processMidtransNotification(body);
    switch (outcome.result) {
      case "invalid_payload":
        return NextResponse.json({ ok: false }, { status: 400 });
      case "invalid_signature":
        console.warn("payment.notification rejected: invalid signature");
        return NextResponse.json({ ok: false }, { status: 401 });
      case "unknown_order":
        return NextResponse.json({ ok: false }, { status: 404 });
      case "rejected":
        console.warn(`payment.notification rejected: ${outcome.reason}`);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ ok: true });
    }
  } catch (e) {
    const name = e instanceof Error ? e.name : "UnknownError";
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "-";
    console.error(`payment.notification failed: ${name} code=${code}${e instanceof MidtransConfigError ? " (config)" : ""}`);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
