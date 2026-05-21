import { getEnvCanvasBaseUrl, requireEnv } from "@/lib/session";
import type { CanvasTokenResponse } from "./types";

export function getOAuthScopes(): string | undefined {
  const scopes = process.env.CANVAS_SCOPES?.trim();
  return scopes || undefined;
}

export function buildAuthorizeUrl(state: string): string {
  const baseUrl = getEnvCanvasBaseUrl();
  if (!baseUrl) {
    throw new Error("OAuth is not configured: CANVAS_BASE_URL is missing");
  }
  const clientId = requireEnv("CANVAS_CLIENT_ID");
  const redirectUri = requireEnv("CANVAS_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  const scopes = getOAuthScopes();
  if (scopes) {
    params.set("scope", scopes);
  }

  return `${baseUrl}/login/oauth2/auth?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string
): Promise<CanvasTokenResponse> {
  const baseUrl = getEnvCanvasBaseUrl();
  if (!baseUrl) {
    throw new Error("OAuth is not configured");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: requireEnv("CANVAS_CLIENT_ID"),
    client_secret: requireEnv("CANVAS_CLIENT_SECRET"),
    redirect_uri: requireEnv("CANVAS_REDIRECT_URI"),
    code,
  });

  const res = await fetch(`${baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<CanvasTokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<CanvasTokenResponse> {
  const baseUrl = getEnvCanvasBaseUrl();
  if (!baseUrl) {
    throw new Error("OAuth is not configured");
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: requireEnv("CANVAS_CLIENT_ID"),
    client_secret: requireEnv("CANVAS_CLIENT_SECRET"),
    refresh_token: refreshToken,
  });

  const res = await fetch(`${baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<CanvasTokenResponse>;
}

export function tokenExpiresAt(expiresIn?: number): number {
  const seconds = expiresIn ?? 3600;
  return Date.now() + seconds * 1000 - 60_000; // refresh 1 min early
}
