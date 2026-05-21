import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshAccessToken, tokenExpiresAt } from "@/lib/canvas/oauth";
import type { AuthMethod } from "@/lib/session";

export interface StoredCanvasCredentials {
  user_id: string;
  canvas_base_url: string;
  canvas_access_token: string;
  auth_method: AuthMethod;
  refresh_token: string | null;
  expires_at: number | null;
}

export async function getCanvasCredentials(
  supabase: SupabaseClient,
  userId: string
): Promise<StoredCanvasCredentials | null> {
  const { data, error } = await supabase
    .from("user_canvas_credentials")
    .select(
      "user_id, canvas_base_url, canvas_access_token, auth_method, refresh_token, expires_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as StoredCanvasCredentials;
}

export async function saveCanvasCredentials(
  supabase: SupabaseClient,
  userId: string,
  creds: {
    canvasBaseUrl: string;
    accessToken: string;
    authMethod: AuthMethod;
    refreshToken?: string;
    expiresAt?: number;
  }
): Promise<void> {
  const { error } = await supabase.from("user_canvas_credentials").upsert(
    {
      user_id: userId,
      canvas_base_url: creds.canvasBaseUrl,
      canvas_access_token: creds.accessToken,
      auth_method: creds.authMethod,
      refresh_token: creds.refreshToken ?? null,
      expires_at: creds.expiresAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCanvasCredentials(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.from("user_canvas_credentials").delete().eq("user_id", userId);
}

export async function getValidAccessTokenFromCredentials(
  supabase: SupabaseClient,
  creds: StoredCanvasCredentials
): Promise<string | null> {
  if (creds.auth_method === "pat") {
    return creds.canvas_access_token;
  }

  const expiresAt = creds.expires_at ?? 0;
  if (Date.now() < expiresAt) {
    return creds.canvas_access_token;
  }

  if (!creds.refresh_token) {
    return null;
  }

  try {
    const tokens = await refreshAccessToken(creds.refresh_token);
    const newExpiresAt = tokenExpiresAt(tokens.expires_in);
    await saveCanvasCredentials(supabase, creds.user_id, {
      canvasBaseUrl: creds.canvas_base_url,
      accessToken: tokens.access_token,
      authMethod: "oauth",
      refreshToken: tokens.refresh_token ?? creds.refresh_token,
      expiresAt: newExpiresAt,
    });
    return tokens.access_token;
  } catch {
    await deleteCanvasCredentials(supabase, creds.user_id);
    return null;
  }
}
