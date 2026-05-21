import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/canvas/oauth";
import { generateOAuthState } from "@/lib/auth";
import { getSession, isOAuthConfigured } from "@/lib/session";

export async function GET() {
  if (!isOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "oauth_not_configured",
        message: "Sign in with Canvas is not available on this server.",
      },
      { status: 503 }
    );
  }

  const session = await getSession();
  const state = generateOAuthState();
  session.oauthState = state;
  await session.save();

  const authorizeUrl = buildAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
