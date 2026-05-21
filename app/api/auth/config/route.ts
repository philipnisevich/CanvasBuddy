import { NextResponse } from "next/server";
import { isOAuthConfigured } from "@/lib/session";

export async function GET() {
  return NextResponse.json({
    oauthEnabled: isOAuthConfigured(),
  });
}
