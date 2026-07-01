import "server-only";
import { getCanvasCredentials } from "@/lib/canvas-credentials";
import { getSupabaseUser } from "@/lib/supabase/auth";
import type { InitialGate } from "@/hooks/useAppGate";

/**
 * Resolve the auth gate on the server so the correct view — the marketing
 * landing page for logged-out visitors, the app for signed-in users — is in
 * the very first HTML paint. This is what lets a logged-out visitor land
 * straight on the landing page with no client-side "loading" flash; the client
 * gate still re-checks in the background. Any failure degrades to the public
 * landing view (the client will correct a signed-in user on its next check).
 */
export async function getInitialGate(): Promise<InitialGate> {
  try {
    const { supabase, user } = await getSupabaseUser();

    if (!user) {
      return { state: "unauthenticated", userEmail: null, userName: null };
    }

    const email = user.email ?? null;
    const creds = await getCanvasCredentials(supabase, user.id);

    return {
      state: creds ? "ready" : "needs_canvas",
      userEmail: email,
      // /api/auth/me returns no display name, so the client resolves userName
      // to the email — mirror that here to keep the header stable on refresh.
      userName: email,
    };
  } catch {
    return { state: "unauthenticated", userEmail: null, userName: null };
  }
}
