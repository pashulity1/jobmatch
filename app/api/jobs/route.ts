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
    let query = supabase.from("jobs").select("*", { count: "exact" });

    // Keyword filter — each word must appear in title
    if (keyword) {
      const words = keyword.split(/\s+/).filter(Boolean);
      for (const word of words) {
        query = query.ilike("title", `%${word}%`);
      }
    }

    // Location filter — simple approach, one condition at a time
    if (location) {
      const locs = location.split(",").map((l) => l.trim().toLowerCase());
      
      // Build location keywords to match against
      const locationKeywords: string[] = [];
      for (const loc of locs) {
        if (loc === "remote") locationKeywords.push("remote");
        if (loc === "usa") {
          locationKeywords.push("United States", "USA", "New York", "San Francisco", 
            "Seattle", "Los Angeles", "Chicago", "Boston", "Austin", "Denver",
            "Atlanta", "Miami", "Washington", ", CA", ", NY", ", WA", ", TX", ", FL");
        }
        if (loc === "europe") {
          locationKeywords.push("London", "Berlin", "Paris", "Amsterdam", "Europe",
            "UK", "Dublin", "Lisbon", "Barcelona", "Warsaw", "EMEA", "Zurich");
        }
        if (loc === "latam") {
          locationKeywords.push("Brazil", "Argentina", "Mexico", "Colombia", 
            "LATAM", "Buenos Aires", "São Paulo", "Bogotá");
        }
      }

      if (locationKeywords.length > 0) {
        // Use OR with ilike for each keyword
        const orCondition = locationKeywords
          .map((kw) => `location.ilike.%${kw}%`)
          .join(",");
        query = query.or(orCondition);
      }
    }

    // Job type filter
    if (jobType) {
      query = query.ilike("job_type", `%${jobType}%`);
    }

    // Sort and paginate
    const { data: jobs, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase query error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    const normalized = (jobs || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || "",
      jobType: job.job_type,
      source: job.source,
      postedDate: job.posted_date,
      applyUrl: job.apply_url,
      description: job.description,
    }));

    return NextResponse.json({
      jobs: normalized,
      meta: {
        total: count || 0,
        returned: normalized.length,
        offset,
        limit,
      },
    });

  } catch (e: any) {
    console.error("Jobs route error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
