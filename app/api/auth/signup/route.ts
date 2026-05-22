import { NextRequest, NextResponse } from "next/server";
import { getEmailLinkOrigin } from "@/lib/app-origin";
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

  const origin = getEmailLinkOrigin(request);
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

  // #region agent log
  let confirmationHost = "unknown";
  try {
    confirmationHost = new URL(confirmationUrl).host;
  } catch {
    /* ignore */
  }
  fetch("http://127.0.0.1:7941/ingest/d44087b2-2238-465d-9653-4421e2f78fdc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "4f005d",
    },
    body: JSON.stringify({
      sessionId: "4f005d",
      hypothesisId: "H1,H2",
      location: "app/api/auth/signup/route.ts:POST",
      message: "signup confirmation link built",
      data: {
        emailLinkOrigin: origin,
        confirmationHost,
        usedHashedToken: typeof hashedToken === "string" && hashedToken.length > 0,
        hasSiteUrlEnv: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
