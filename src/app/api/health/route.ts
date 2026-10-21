// Liveness probe only. Intentionally does not touch the database or expose
// configuration, so it is safe to leave unauthenticated.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
