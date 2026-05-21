import { refreshAccessToken, tokenExpiresAt } from "@/lib/canvas/oauth";
import {
  getSession,
  getCanvasBaseUrlFromSession,
  getEnvCanvasBaseUrl,
} from "@/lib/session";

type AppSession = Awaited<ReturnType<typeof getSession>>;

export interface CanvasContext {
  baseUrl: string;
  accessToken: string;
}

export async function getCanvasContext(): Promise<CanvasContext | null> {
  const session = await getSession();
  const baseUrl = getCanvasBaseUrlFromSession(session);
  if (!baseUrl || !session.accessToken) {
    return null;
  }

  const accessToken = await getValidAccessTokenFromSession(session);
  if (!accessToken) {
    return null;
  }

  return { baseUrl, accessToken };
}

async function getValidAccessTokenFromSession(
  session: AppSession
): Promise<string | null> {
  if (!session.accessToken) {
    return null;
  }

  if (session.authMethod === "pat") {
    return session.accessToken;
  }

  const expiresAt = session.expiresAt ?? 0;
  if (Date.now() < expiresAt) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    return null;
  }

  try {
    const tokens = await refreshAccessToken(session.refreshToken);
    session.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      session.refreshToken = tokens.refresh_token;
    }
    session.expiresAt = tokenExpiresAt(tokens.expires_in);
    await session.save();
    return session.accessToken;
  } catch {
    session.destroy();
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const ctx = await getCanvasContext();
  return ctx?.accessToken ?? null;
}

export async function saveOAuthTokensToSession(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}): Promise<void> {
  const session = await getSession();
  const baseUrl = getEnvCanvasBaseUrl();
  session.authMethod = "oauth";
  session.canvasBaseUrl = baseUrl ?? undefined;
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token;
  session.expiresAt = tokenExpiresAt(tokens.expires_in);
  await session.save();
}

export async function savePatToSession(
  canvasBaseUrl: string,
  accessToken: string
): Promise<void> {
  const session = await getSession();
  session.authMethod = "pat";
  session.canvasBaseUrl = canvasBaseUrl;
  session.accessToken = accessToken;
  delete session.refreshToken;
  delete session.expiresAt;
  delete session.oauthState;
  await session.save();
}

/** @deprecated Use saveOAuthTokensToSession */
export async function saveTokensToSession(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}): Promise<void> {
  return saveOAuthTokensToSession(tokens);
}

export function generateOAuthState(): string {
  return crypto.randomUUID();
}

export async function clearSessionOnUnauthorized(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
