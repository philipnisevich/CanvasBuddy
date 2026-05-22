import { NextRequest, NextResponse } from "next/server";
import { getEmailLinkOrigin } from "@/lib/app-origin";
import { buildAuthCallbackUrl } from "@/lib/auth/auth-callback-url";
import { getSignupEnvError } from "@/lib/auth/signup-env";
import { sendPasswordRecoveryEmail } from "@/lib/brevo/send-password-recovery";
import { createAdminClient } from "@/lib/supabase/admin";

const GENERIC_OK_MESSAGE =
  "If an account exists for that email, we sent a link to reset your password.";

export async function POST(request: NextRequest) {
  const envError = getSignupEnvError();
  if (envError) {
    return NextResponse.json({ message: envError }, { status: 503 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  const origin = getEmailLinkOrigin(request);
  const nextPath = "/settings?tab=account&recovery=1";

  try {
    const admin = createAdminClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (linkError) {
      return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE });
    }

    const hashedToken = linkData?.properties?.hashed_token;
    const resetUrl =
      typeof hashedToken === "string" && hashedToken.length > 0
        ? buildAuthCallbackUrl(origin, {
            hashedToken,
            type: "recovery",
            next: nextPath,
          })
        : linkData?.properties?.action_link;

    if (!resetUrl) {
      return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE });
    }

    await sendPasswordRecoveryEmail({ to: email, resetUrl });
  } catch {
    return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE });
  }

  return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE });
}
