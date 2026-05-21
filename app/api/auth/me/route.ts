import { NextResponse } from "next/server";
import { getCanvasCredentials } from "@/lib/canvas-credentials";
import { getSupabaseUser } from "@/lib/supabase/auth";

export async function GET() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const creds = await getCanvasCredentials(supabase, user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
    },
    hasCanvasCredentials: !!creds,
    canvasBaseUrl: creds?.canvas_base_url ?? null,
  });
}
