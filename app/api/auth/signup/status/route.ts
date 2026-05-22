import { NextResponse } from "next/server";
import {
  getSignupEnvError,
  getSignupEnvFailureCode,
} from "@/lib/auth/signup-env";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Non-secret signup readiness check for operators (e.g. after deploying to canvasbuddy.ai). */
export async function GET() {
  const failureCode = getSignupEnvFailureCode();
  const message = getSignupEnvError();
  const { url } = getSupabasePublicEnv();

  return NextResponse.json({
    ready: failureCode === null,
    failureCode,
    message,
    checks: {
      supabaseUrl: !!url,
      supabaseAnonKey: !!getSupabasePublicEnv().key,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      brevoApiKey: !!process.env.BREVO_API_KEY?.trim(),
      brevoSenderEmail: !!process.env.BREVO_SENDER_EMAIL?.trim(),
    },
  });
}
