import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAnonClient(token: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

async function getUser(token: string) {
  const { data: { user } } = await getAnonClient(token).auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await getServiceClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { resume_profile, resume_analyses_count, name, interested_positions, work_format } = body;

  const updates: any = { id: user.id, updated_at: new Date().toISOString() };
  if (resume_profile !== undefined) updates.resume_profile = resume_profile;
  if (resume_analyses_count !== undefined) updates.resume_analyses_count = resume_analyses_count;
  if (name !== undefined) updates.name = name;
  if (interested_positions !== undefined) updates.interested_positions = interested_positions;
  if (work_format !== undefined) updates.work_format = work_format;

  const { data, error } = await getServiceClient()
    .from("profiles")
    .upsert(updates, { onConflict: "id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
