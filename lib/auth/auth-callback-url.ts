import type { EmailOtpType } from "@supabase/supabase-js";

export function buildAuthCallbackUrl(
  origin: string,
  params: {
    hashedToken: string;
    type: EmailOtpType;
    next: string;
  }
): string {
  const url = new URL(`${origin}/auth/callback`);
  url.searchParams.set("token_hash", params.hashedToken);
  url.searchParams.set("type", params.type);
  url.searchParams.set("next", params.next);
  return url.toString();
}
