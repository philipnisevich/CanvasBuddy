import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/canvas/oauth";
import { saveOAuthTokensToSession } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=missing_code", request.url)
    );
  }

  const session = await getSession();

  if (!state || state !== session.oauthState) {
    return NextResponse.redirect(
      new URL("/?error=invalid_state", request.url)
    );
  }

  delete session.oauthState;

  try {
    const tokens = await exchangeCodeForToken(code);
    await saveOAuthTokensToSession(tokens);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "token_exchange_failed";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
