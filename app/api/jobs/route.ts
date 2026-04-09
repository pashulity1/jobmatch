import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "").toLowerCase().trim();
  const location = searchParams.get("location") || "";
  const jobType = searchParams.get("jobType") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const supabase = getSupabaseAdmin();

    // Build location filter string for RPC
    let locationFilter: string | null = null;
    if (location) {
      const locs = location.split(",").map(l => l.trim().toLowerCase());
      const patterns: string[] = [];
      for (const loc of locs) {
        if (loc === "remote") patterns.push("Remote");
        if (loc === "usa") patterns.push("United States", "New York", "San Francisco", "Seattle", "Los Angeles", "Chicago", "Boston", "Austin");
        if (loc === "europe") patterns.push("London", "Berlin", "Paris", "Amsterdam", "Dublin", "Europe", "EMEA");
        if (loc === "latam") patterns.push("Brazil", "Mexico", "Colombia", "LATAM");
      }
      locationFilter = patterns.join("|");
    }

    if (keyword) {
      // Use PostgreSQL full-text search via RPC
      const { data: jobs, error } = await supabase.rpc("search_jobs_fts", {
        query_text: keyword,
        loc_filter: locationFilter,
        job_type_filter: jobType || null,
        lim: limit,
        off: offset,
      });

      if (error) {
        console.error("FTS search error:", error.message);
        // Fallback to basic search if RPC fails
        return fallbackSearch(supabase, keyword, location, jobType, limit, offset);
      }

      const total = jobs?.[0]?.total_count || 0;
      const normalized = (jobs || []).map((job: any) => ({
        id: job.id, title: job.title, company: job.company,
        location: job.location, salary: job.salary || "",
        jobType: job.job_type, source: job.source,
        postedDate: job.posted_date, applyUrl: job.apply_url,
        description: job.description,
      }));

      return NextResponse.json({
        jobs: normalized,
        meta: { total, returned: normalized.length, offset, limit },
      });
    } else {
      // No keyword — just filter by location/type and return latest
      return fallbackSearch(supabase, "", location, jobType, limit, offset);
    }

  } catch (e: any) {
    console.error("Jobs route error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function fallbackSearch(supabase: any, keyword: string, location: string, jobType: string, limit: number, offset: number) {
  let query = supabase.from("jobs").select("*", { count: "exact" });

  if (keyword) {
    const words = keyword.split(/\s+/).filter(w => w.length > 1);
    if (words.length > 0) {
      const orParts = words.map(w => `title.ilike.%${w}%`);
      query = query.or(orParts.join(","));
    }
  }

  if (location) {
    const locs = location.split(",").map(l => l.trim().toLowerCase());
    const patterns: string[] = [];
    for (const loc of locs) {
      if (loc === "remote") patterns.push("location.ilike.%Remote%");
      if (loc === "usa") {
        patterns.push(
          "location.ilike.%United States%", "location.ilike.%New York%",
          "location.ilike.%San Francisco%", "location.ilike.%Seattle%",
          "location.ilike.% CA%", "location.ilike.% NY%", "location.ilike.% TX%"
        );
      }
      if (loc === "europe") {
        patterns.push("location.ilike.%London%", "location.ilike.%Berlin%", "location.ilike.%Europe%");
      }
      if (loc === "latam") {
        patterns.push("location.ilike.%Brazil%", "location.ilike.%Mexico%", "location.ilike.%LATAM%");
      }
    }
    if (patterns.length > 0) query = query.or(patterns.join(","));
  }

  if (jobType) query = query.ilike("job_type", `%${jobType}%`);

  const { data: jobs, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (jobs || []).map((job: any) => ({
    id: job.id, title: job.title, company: job.company,
    location: job.location, salary: job.salary || "",
    jobType: job.job_type, source: job.source,
    postedDate: job.posted_date, applyUrl: job.apply_url,
    description: job.description,
  }));

  return NextResponse.json({
    jobs: normalized,
    meta: { total: count || 0, returned: normalized.length, offset, limit },
  });
}
