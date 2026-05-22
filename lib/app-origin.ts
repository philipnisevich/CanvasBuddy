/** Canonical app URL for emails and redirects (production should set NEXT_PUBLIC_SITE_URL). */
function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

function siteUrlFromEnv(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    return normalizeOrigin(site);
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return null;
}

/**
 * Origin for links in transactional email (confirm, password reset).
 * Prefers NEXT_PUBLIC_SITE_URL so local dev can still send canvasbuddy.ai links.
 */
export function getEmailLinkOrigin(request: Request): string {
  const fromEnv = siteUrlFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const fromHeader = request.headers.get("origin")?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  return new URL(request.url).origin;
}

/** Origin for same-request redirects (uses browser origin when present). */
export function getRequestOrigin(request: Request): string {
  const fromHeader = request.headers.get("origin")?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  const fromEnv = siteUrlFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  return new URL(request.url).origin;
}
