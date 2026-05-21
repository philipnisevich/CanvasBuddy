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

  if (!url || !key) {
    return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";
  }

  if (isPlaceholderSupabaseEnv(url, key)) {
    return "Supabase is still using placeholder values from .env.example. Paste your Project URL and anon (publishable) key from the Supabase dashboard into .env.local, then restart the dev server (stop npm run dev and run it again).";
  }

  return null;
}
