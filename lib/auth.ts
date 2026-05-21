import { refreshAccessToken, tokenExpiresAt } from "@/lib/canvas/oauth";
import {
  getCanvasCredentials,
  getValidAccessTokenFromCredentials,
  saveCanvasCredentials,
  deleteCanvasCredentials,
} from "@/lib/canvas-credentials";
import { getSupabaseUser } from "@/lib/supabase/auth";
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
  const { supabase, user } = await getSupabaseUser();

  if (user) {
    const creds = await getCanvasCredentials(supabase, user.id);
    if (!creds) {
      return null;
    }
    const accessToken = await getValidAccessTokenFromCredentials(
      supabase,
      creds
    );
    if (!accessToken) {
      return null;
    }
    return { baseUrl: creds.canvas_base_url, accessToken };
  }

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
  const baseUrl = getEnvCanvasBaseUrl();
  const expiresAt = tokenExpiresAt(tokens.expires_in);

  const { supabase, user } = await getSupabaseUser();
  if (user && baseUrl) {
    await saveCanvasCredentials(supabase, user.id, {
      canvasBaseUrl: baseUrl,
      accessToken: tokens.access_token,
      authMethod: "oauth",
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
  }

  const session = await getSession();
  session.authMethod = "oauth";
  session.canvasBaseUrl = baseUrl ?? undefined;
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token;
  session.expiresAt = expiresAt;
  await session.save();
}

export async function savePatToSession(
  canvasBaseUrl: string,
  accessToken: string
): Promise<void> {
  const { supabase, user } = await getSupabaseUser();
  if (user) {
    await saveCanvasCredentials(supabase, user.id, {
      canvasBaseUrl,
      accessToken,
      authMethod: "pat",
    });
  }

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
  const { supabase, user } = await getSupabaseUser();
  if (user) {
    await deleteCanvasCredentials(supabase, user.id);
  }

  const session = await getSession();
  session.destroy();
}
