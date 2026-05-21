import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AuthMethod = "oauth" | "pat";

export interface SessionData {
  authMethod?: AuthMethod;
  canvasBaseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  oauthState?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "canvasbuddy_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14, // 14 days
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isOAuthConfigured(): boolean {
  return !!(
    process.env.CANVAS_BASE_URL?.trim() &&
    process.env.CANVAS_CLIENT_ID?.trim() &&
    process.env.CANVAS_CLIENT_SECRET?.trim() &&
    process.env.CANVAS_REDIRECT_URI?.trim()
  );
}

export function getEnvCanvasBaseUrl(): string | null {
  const url = process.env.CANVAS_BASE_URL?.trim();
  return url ? normalizeCanvasBaseUrl(url) : null;
}

/** Normalize and validate a Canvas instance URL. */
export function normalizeCanvasBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid Canvas URL");
  }

  if (parsed.protocol !== "https:") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Canvas URL must use HTTPS");
    }
    if (parsed.protocol !== "http:") {
      throw new Error("Canvas URL must use HTTPS");
    }
  }

  return `${parsed.protocol}//${parsed.host}`;
}

export function getCanvasBaseUrlFromSession(session: SessionData): string | null {
  if (session.canvasBaseUrl) {
    return session.canvasBaseUrl;
  }
  return getEnvCanvasBaseUrl();
}

/** @deprecated Use getCanvasBaseUrlFromSession or getEnvCanvasBaseUrl */
export function getCanvasBaseUrl(): string {
  const url = getEnvCanvasBaseUrl();
  if (!url) {
    throw new Error("Missing required environment variable: CANVAS_BASE_URL");
  }
  return url;
}
