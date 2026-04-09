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
  // Special mode for autocomplete suggestions - only search titles
  const suggestMode = searchParams.get("suggest") === "true";

  try {
    const supabase = getSupabaseAdmin();

    // SUGGEST MODE — fast title-only search for autocomplete
    if (suggestMode && keyword) {
      const words = keyword.split(/\s+/).filter(w => w.length > 1);
      // All words must appear in title (AND)
      let q = supabase.from("jobs").select("title");
      for (const word of words) {
        q = q.ilike("title", `%${word}%`);
      }
      const { data } = await q.limit(20);
      const titles = [...new Set((data || []).map((j: any) => j.title as string))].slice(0, 6);
      return NextResponse.json({ titles });
    }

    // Build location patterns
    const locationPatterns: string[] = [];
    if (location) {
      const locs = location.split(",").map(l => l.trim().toLowerCase());
      for (const loc of locs) {
        if (loc === "remote") locationPatterns.push("location.ilike.%Remote%");
        if (loc === "usa") {
          locationPatterns.push(
            "location.ilike.%United States%", "location.ilike.%New York%",
            "location.ilike.%San Francisco%", "location.ilike.%Seattle%",
            "location.ilike.%Los Angeles%", "location.ilike.%Chicago%",
            "location.ilike.%Boston%", "location.ilike.%Austin%",
            "location.ilike.% CA%", "location.ilike.% NY%",
            "location.ilike.% WA%", "location.ilike.% TX%"
          );
        }
        if (loc === "europe") {
          locationPatterns.push(
            "location.ilike.%London%", "location.ilike.%Berlin%",
            "location.ilike.%Paris%", "location.ilike.%Amsterdam%",
            "location.ilike.%Dublin%", "location.ilike.%Europe%", "location.ilike.%EMEA%"
          );
        }
        if (loc === "latam") {
          locationPatterns.push(
            "location.ilike.%Brazil%", "location.ilike.%Mexico%",
            "location.ilike.%Colombia%", "location.ilike.%LATAM%"
          );
        }
      }
    }

    if (keyword) {
      // Use PostgreSQL FTS but ONLY match against title (weight A)
      // This ensures "HR Generalist" doesn't match "Tech Ops Builder (Generalist)"
      const { data: jobs, error } = await supabase.rpc("search_jobs_title_first", {
        query_text: keyword,
        loc_patterns: locationPatterns.length > 0 ? locationPatterns.join(",") : null,
        job_type_filter: jobType || null,
        lim: limit,
        off: offset,
      });

      if (error) {
        console.error("RPC error, using fallback:", error.message);
        return titleSearch(supabase, keyword, locationPatterns, jobType, limit, offset);
      }

      const total = jobs?.[0]?.total_count || 0;
      const normalized = (jobs || []).map(normalizeJob);

      return NextResponse.json({
        jobs: normalized,
        meta: { total, returned: normalized.length, offset, limit },
      });
    } else {
      // No keyword — return latest jobs with optional filters
      let query = supabase.from("jobs").select("*", { count: "exact" });
      if (locationPatterns.length > 0) query = query.or(locationPatterns.join(","));
      if (jobType) query = query.ilike("job_type", `%${jobType}%`);

      const { data: jobs, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({
        jobs: (jobs || []).map(normalizeJob),
        meta: { total: count || 0, returned: jobs?.length || 0, offset, limit },
      });
    }

  } catch (e: any) {
    console.error("Jobs route error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Fast title-based search fallback
async function titleSearch(supabase: any, keyword: string, locationPatterns: string[], jobType: string, limit: number, offset: number) {
  const words = keyword.split(/\s+/).filter(w => w.length > 1);
  let query = supabase.from("jobs").select("*", { count: "exact" });

  // All words must be in title
  for (const word of words) {
    query = query.ilike("title", `%${word}%`);
  }

  if (locationPatterns.length > 0) query = query.or(locationPatterns.join(","));
  if (jobType) query = query.ilike("job_type", `%${jobType}%`);

  const { data: jobs, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    jobs: (jobs || []).map(normalizeJob),
    meta: { total: count || 0, returned: jobs?.length || 0, offset, limit },
  });
}

function normalizeJob(job: any) {
  return {
    id: job.id, title: job.title, company: job.company,
    location: job.location, salary: job.salary || "",
    jobType: job.job_type, source: job.source,
    postedDate: job.posted_date, applyUrl: job.apply_url,
    description: job.description,
  };
}
