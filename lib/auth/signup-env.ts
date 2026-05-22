import { getBrevoEnvError } from "@/lib/brevo/env";
import { envSetupLocationHint } from "@/lib/env-deploy-hint";
import { getAsciiEnvVarError } from "@/lib/env-ascii";
import {
  getSupabaseEnvError,
  getSupabasePublicEnv,
  isPlaceholderSupabaseEnv,
} from "@/lib/supabase/env";

export type SignupEnvFailureCode =
  | "supabase_public"
  | "service_role"
  | "brevo"
  | null;

export function getSignupEnvFailureCode(): SignupEnvFailureCode {
  const { url, key } = getSupabasePublicEnv();
  if (!url || !key || isPlaceholderSupabaseEnv(url, key)) {
    return "supabase_public";
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    return "service_role";
  }
  if (
    getAsciiEnvVarError("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey) ||
    !serviceRoleKey.startsWith("eyJ")
  ) {
    return "service_role";
  }

  if (getBrevoEnvError()) {
    return "brevo";
  }

  return null;
}

export function getSignupEnvError(): string | null {
  const code = getSignupEnvFailureCode();
  const where = envSetupLocationHint();

  if (code === "supabase_public") {
    return getSupabaseEnvError();
  }
  if (code === "service_role") {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!serviceRoleKey) {
      return `Supabase service role key is missing. Add SUPABASE_SERVICE_ROLE_KEY to ${where}. Copy the service_role secret from Supabase Dashboard → Project Settings → API.`;
    }
    const asciiError = getAsciiEnvVarError(
      "SUPABASE_SERVICE_ROLE_KEY",
      serviceRoleKey
    );
    if (asciiError) {
      return asciiError;
    }
    return "SUPABASE_SERVICE_ROLE_KEY must be the service_role JWT from Supabase (starts with eyJ), not placeholder text.";
  }
  if (code === "brevo") {
    return getBrevoEnvError();
  }

  return null;
}
