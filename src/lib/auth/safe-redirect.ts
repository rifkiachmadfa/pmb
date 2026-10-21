const FALLBACK = "/dashboard";

/**
 * Accepts only same-origin relative paths ("/pendaftaran", "/dashboard?x=1").
 * Anything else (absolute URLs, "//host", "/\host", control characters) falls
 * back to the dashboard, which prevents open redirects through `?next=`.
 */
export function sanitizeNextPath(
  value: string | null | undefined,
  fallback: string = FALLBACK,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  return value;
}
