import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const session = await getSession();
  session.destroy();

  return NextResponse.json({ ok: true });
}
