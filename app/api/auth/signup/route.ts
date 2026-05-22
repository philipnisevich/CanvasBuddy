import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/app-origin";
import { buildAuthCallbackUrl } from "@/lib/auth/auth-callback-url";
import {
  getSignupEnvError,
  getSignupEnvFailureCode,
} from "@/lib/auth/signup-env";
import { sendSignupConfirmationEmail } from "@/lib/brevo/send-signup-confirmation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const envError = getSignupEnvError();
  const failureCode = getSignupEnvFailureCode();
  if (envError) {
    return NextResponse.json(
      { error: failureCode ?? "env_not_configured", message: envError },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password?.trim();
  const confirmPassword = body.confirmPassword?.trim();

  if (!email || !password || !confirmPassword) {
    return NextResponse.json(
      { message: "Email, password, and password confirmation are required." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { message: "Passwords do not match. Please re-enter them." },
      { status: 400 }
    );
  }

  const origin = getRequestOrigin(request);
  const redirectTo = `${origin}/auth/callback?next=/settings`;

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  if (linkError) {
    if (linkError.status === 429 || linkError.message.includes("rate limit")) {
      return NextResponse.json(
        {
          message:
            "Too many sign-up attempts. Wait a while and try again, or sign in if you already created an account.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ message: linkError.message }, { status: 400 });
  }

  const hashedToken = linkData?.properties?.hashed_token;
  const actionLink = linkData?.properties?.action_link;
  const userId = linkData?.user?.id;
  const nextPath = "/settings";

  // Prefer app callback with token_hash (SSR verifyOtp). action_link goes through
  // Supabase verify then often returns a PKCE code without a client verifier.
  const confirmationUrl =
    typeof hashedToken === "string" && hashedToken.length > 0
      ? buildAuthCallbackUrl(origin, {
          hashedToken,
          type: "signup",
          next: nextPath,
        })
      : actionLink;

  if (!confirmationUrl) {
    return NextResponse.json(
      { message: "Could not create a confirmation link. Please try again." },
      { status: 500 }
    );
  }

  try {
    await sendSignupConfirmationEmail({ to: email, confirmationUrl });
  } catch (err) {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    const message =
      err instanceof Error
        ? err.message
        : "Could not send the confirmation email. Check Brevo configuration and try again.";
    return NextResponse.json({ message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    needsEmailConfirmation: true,
  });
}
