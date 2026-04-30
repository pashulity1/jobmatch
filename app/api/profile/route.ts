import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

function getUserId(token: string): { id: string | null; debug: any } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { id: null, debug: { error: "not a JWT, parts: " + parts.length } };
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    if (!payload.sub) return { id: null, debug: { error: "no sub", payload } };
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { id: null, debug: { error: "token expired", exp: payload.exp, now: Math.floor(Date.now() / 1000) } };
    }
    return { id: payload.sub as string, debug: null };
  } catch (e: any) {
    return { id: null, debug: { error: e.message } };
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized", debug: "no token" }, { status: 401 });

  const { id: userId, debug } = getUserId(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized", debug }, { status: 401 });

  const { data: profile } = await getServiceClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized", debug: "no token" }, { status: 401 });

  const { id: userId, debug } = getUserId(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized", debug }, { status: 401 });

  const body = await req.json();
  const { resume_profile, resume_analyses_count, name, interested_positions, work_format } = body;

  const updates: any = { id: userId, updated_at: new Date().toISOString() };
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
