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
  const suggestMode = searchParams.get("suggest") === "true";
  const fresh = searchParams.get("fresh") === "true";
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdmin();

    // SUGGEST MODE — fast title-only search for autocomplete
    if (suggestMode && keyword) {
      const words = keyword.split(/\s+/).filter(w => w.length > 1);
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
        // Free-text location — pass through directly
        if (!["remote", "usa", "europe", "latam"].includes(loc) && loc.length > 1) {
          locationPatterns.push(`location.ilike.%${loc}%`);
        }
      }
    }

    if (keyword) {
      return fullTextSearch(supabase, keyword, locationPatterns, jobType, limit, offset, fresh ? thirtyDaysAgo : null);
    } else {
      // No keyword — return latest jobs with optional filters
      let query = supabase.from("jobs").select("*", { count: "exact" });
      if (locationPatterns.length > 0) query = query.or(locationPatterns.join(","));
      if (jobType) query = query.ilike("job_type", `%${jobType}%`);
      if (fresh) query = query.gte("posted_at", thirtyDaysAgo);

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

async function fullTextSearch(
  supabase: any,
  keyword: string,
  locationPatterns: string[],
  jobType: string,
  limit: number,
  offset: number,
  freshCutoff: string | null = null
) {
  // LEVEL_WORDS — only pure seniority modifiers, NOT role names.
  // "manager" and "director" are part of the role title, not the level.
  const LEVEL_WORDS = new Set([
    "senior", "junior", "lead", "staff", "principal", "sr", "jr", "mid", "head"
  ]);

  const words = keyword.split(/\s+/).filter(w => w.length > 0);
  const coreWords = words.filter(w => !LEVEL_WORDS.has(w));

  // Only strip level words if we keep at least half the original words.
  // Prevents "Product Manager" → "Product" (losing the role entirely).
  const searchWords =
    coreWords.length >= Math.ceil(words.length / 2) ? coreWords : words;

  // VARIANT B: title must contain ALL search words.
  // FTS ranks results by relevance, title filter eliminates noise.
  // Applied with .or() per word so each word is independently required.
  try {
    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .textSearch("search_vector", searchWords.join(" "), {
        type: "websearch",
        config: "english",
      });

    // Require every search word to appear in the title
    for (const word of searchWords) {
      query = query.ilike("title", `%${word}%`);
    }

    if (locationPatterns.length > 0) query = query.or(locationPatterns.join(","));
    if (jobType) query = query.ilike("job_type", `%${jobType}%`);
    if (freshCutoff) query = query.gte("posted_at", freshCutoff);

    const { data: jobs, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && jobs && jobs.length > 0) {
      return NextResponse.json({
        jobs: jobs.map(normalizeJob),
        meta: { total: count || 0, returned: jobs.length, offset, limit, searchType: "fulltext+title" },
      });
    }

    // FTS+title returned 0 — fallback to title ILIKE only
    return titleSearchFallback(supabase, searchWords, locationPatterns, jobType, limit, offset, freshCutoff);

  } catch {
    return titleSearchFallback(supabase, searchWords, locationPatterns, jobType, limit, offset);
  }
}

// Fallback: title ILIKE only — each search word must appear in title
async function titleSearchFallback(
  supabase: any,
  searchWords: string[],
  locationPatterns: string[],
  jobType: string,
  limit: number,
  offset: number,
  freshCutoff: string | null = null
) {
  let query = supabase.from("jobs").select("*", { count: "exact" });

  if (searchWords.length === 1) {
    const w = searchWords[0];
    if (w.length <= 3) {
      query = query.or(
        `title.ilike.% ${w} %,title.ilike.${w} %,title.ilike.% ${w},title.ilike.${w}`
      );
    } else {
      query = query.ilike("title", `%${w}%`);
    }
  } else {
    for (const word of searchWords) {
      query = query.ilike("title", `%${word}%`);
    }
  }

  if (locationPatterns.length > 0) query = query.or(locationPatterns.join(","));
  if (jobType) query = query.ilike("job_type", `%${jobType}%`);
  if (freshCutoff) query = query.gte("posted_at", freshCutoff);

  const { data: jobs, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    jobs: (jobs || []).map(normalizeJob),
    meta: { total: count || 0, returned: jobs?.length || 0, offset, limit, searchType: "ilike_title_only" },
  });
}

function normalizeJob(job: any) {
  return {
    id: job.id, title: job.title, company: job.company,
    location: job.location, salary: job.salary || "",
    jobType: job.job_type, source: job.source,
    postedDate: job.posted_date, applyUrl: job.apply_url,
    description: job.description,
    postedAt: job.posted_at || null,
  };
}
