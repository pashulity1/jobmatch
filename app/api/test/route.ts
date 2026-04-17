import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const results: any = {
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? "✅ set" : "❌ missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅ set" : "❌ missing",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "✅ set" : "❌ missing",
    },
    tables: {},
  };

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Check profiles table
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);
    if (profErr) {
      results.tables.profiles = `❌ ${profErr.message}`;
    } else {
      results.tables.profiles = `✅ exists, sample columns: ${profiles?.[0] ? Object.keys(profiles[0]).join(", ") : "empty table"}`;
    }

    // Check saved_jobs table
    const { data: savedJobs, error: sjErr } = await supabase
      .from("saved_jobs")
      .select("*")
      .limit(1);
    if (sjErr) {
      results.tables.saved_jobs = `❌ ${sjErr.message}`;
    } else {
      results.tables.saved_jobs = `✅ exists, sample columns: ${savedJobs?.[0] ? Object.keys(savedJobs[0]).join(", ") : "empty table"}`;
    }

    // Try inserting a test profile row
    const testId = "00000000-0000-0000-0000-000000000001";
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: testId, name: "test", updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (upsertErr) {
      results.tables.profiles_upsert_test = `❌ ${upsertErr.message}`;
    } else {
      results.tables.profiles_upsert_test = "✅ upsert works";
      await supabase.from("profiles").delete().eq("id", testId);
    }

    // Try inserting a test saved_job
    const { error: sjInsertErr } = await supabase
      .from("saved_jobs")
      .insert({
        user_id: testId, job_id: "test-job-123", title: "Test", company: "Test Co",
        location: "", salary: "", job_type: "Full-time", source: "", posted_date: "", apply_url: "",
      });
    if (sjInsertErr) {
      results.tables.saved_jobs_insert_test = `❌ ${sjInsertErr.message}`;
    } else {
      results.tables.saved_jobs_insert_test = "✅ insert works";
      await supabase.from("saved_jobs").delete().eq("job_id", "test-job-123");
    }

  } catch (e: any) {
    results.exception = e.message;
  }

  return NextResponse.json(results, { headers: { "Content-Type": "application/json" } });
}
