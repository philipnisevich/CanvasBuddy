import { getBrevoEnvError } from "@/lib/brevo/env";
import { getSupabaseEnvError, getSupabaseServiceRoleEnvError } from "@/lib/supabase/env";

export function getSignupEnvError(): string | null {
  return (
    getSupabaseEnvError() ??
    getSupabaseServiceRoleEnvError() ??
    getBrevoEnvError() ??
    null
  );
}
