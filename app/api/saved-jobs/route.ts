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

// GET /api/saved-jobs — list saved jobs for current user
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getServiceClient()
    .from("saved_jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data || [] });
}

// POST /api/saved-jobs — save a job
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { job_id, title, company, location, salary, job_type, source, posted_date, apply_url } = body;

  const db = getServiceClient();

  const { data: existing } = await db
    .from("saved_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", job_id)
    .single();

  if (existing) return NextResponse.json({ saved: existing });

  const { data, error } = await db
    .from("saved_jobs")
    .insert({
      user_id: user.id, job_id, title, company, location,
      salary: salary || "", job_type: job_type || "Full-time",
      source: source || "", posted_date: posted_date || "", apply_url: apply_url || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: data });
}

// DELETE /api/saved-jobs?job_id=xxx — unsave a job
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job_id = new URL(req.url).searchParams.get("job_id");
  if (!job_id) return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

  const { error } = await getServiceClient()
    .from("saved_jobs")
    .delete()
    .eq("user_id", user.id)
    .eq("job_id", job_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
