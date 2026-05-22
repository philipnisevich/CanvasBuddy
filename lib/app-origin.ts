/** Canonical app URL for emails and redirects (production should set NEXT_PUBLIC_SITE_URL). */
export function getRequestOrigin(request: Request): string {
  const fromHeader = request.headers.get("origin")?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }

  return new URL(request.url).origin;
}
