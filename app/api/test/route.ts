import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const results: any = {
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? "✅ set" : "❌ missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅ set" : "❌ missing",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "✅ set" : "❌ missing",
    },
    supabase: "not tested",
  };

  // Тест подключения к Supabase
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY!;
    const supabase = createClient(url, key);
    
    const { data, error, count } = await supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .limit(1);

    if (error) {
      results.supabase = `❌ Error: ${error.message}`;
    } else {
      results.supabase = `✅ Connected. Jobs in DB: ${count}`;
    }
  } catch (e: any) {
    results.supabase = `❌ Exception: ${e.message}`;
  }

  return NextResponse.json(results);
}
