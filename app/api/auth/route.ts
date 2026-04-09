import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { action, email, password, name } = await req.json();
  const supabase = getSupabase();

  if (action === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // Update name in profile
    if (data.user && name) {
      await supabase.from("profiles").update({ name }).eq("id", data.user.id);
    }
    return NextResponse.json({ success: true, user: data.user });
  }

  if (action === "signin") {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, user: data.user, session: data.session });
  }

  if (action === "signout") {
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
