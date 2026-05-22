import { envSetupLocationHint } from "@/lib/env-deploy-hint";
import { getAsciiEnvVarError } from "@/lib/env-ascii";

const PLACEHOLDER_URL_MARKERS = ["your-project.supabase.co"];
const PLACEHOLDER_KEY_MARKERS = ["your-anon-key"];

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

export function isPlaceholderSupabaseEnv(
  url = getSupabasePublicEnv().url,
  key = getSupabasePublicEnv().key
): boolean {
  if (!url || !key) {
    return true;
  }
  const urlLooksPlaceholder = PLACEHOLDER_URL_MARKERS.some((m) => url.includes(m));
  const keyLooksPlaceholder = PLACEHOLDER_KEY_MARKERS.some(
    (m) => key === m || key.includes(m)
  );
  return urlLooksPlaceholder || keyLooksPlaceholder;
}

export function getSupabaseEnvError(): string | null {
  const { url, key } = getSupabasePublicEnv();

  const where = envSetupLocationHint();

  if (!url || !key) {
    return `Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to ${where}.`;
  }

  if (isPlaceholderSupabaseEnv(url, key)) {
    return `Supabase is still using placeholder values. Paste your Project URL and anon (publishable) key from the Supabase dashboard into ${where}.`;
  }

  return null;
}

export function getSupabaseServiceRoleEnvError(): string | null {
  const base = getSupabaseEnvError();
  if (base) {
    return base;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    return `Supabase service role key is missing. Add SUPABASE_SERVICE_ROLE_KEY to ${envSetupLocationHint()}. Copy the service_role secret from Supabase Dashboard → Project Settings → API.`;
  }

  const asciiError = getAsciiEnvVarError("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
  if (asciiError) {
    return asciiError;
  }

  if (!serviceRoleKey.startsWith("eyJ")) {
    return "SUPABASE_SERVICE_ROLE_KEY must be the service_role JWT from Supabase (starts with eyJ), not placeholder text.";
  }

  return null;
}
