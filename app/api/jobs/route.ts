import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// US state full-name → [abbreviation, ...aliases]
const US_STATES: Record<string, string[]> = {
  "alabama": ["AL", "Alabama"], "alaska": ["AK", "Alaska"],
  "arizona": ["AZ", "Arizona"], "arkansas": ["AR", "Arkansas"],
  "california": ["CA", "California", "Calif"],
  "colorado": ["CO", "Colorado"], "connecticut": ["CT", "Connecticut"],
  "delaware": ["DE", "Delaware"], "florida": ["FL", "Florida"],
  "georgia": ["GA", "Georgia"], "hawaii": ["HI", "Hawaii"],
  "idaho": ["ID", "Idaho"], "illinois": ["IL", "Illinois"],
  "indiana": ["IN", "Indiana"], "iowa": ["IA", "Iowa"],
  "kansas": ["KS", "Kansas"], "kentucky": ["KY", "Kentucky"],
  "louisiana": ["LA", "Louisiana"], "maine": ["ME", "Maine"],
  "maryland": ["MD", "Maryland"], "massachusetts": ["MA", "Massachusetts"],
  "michigan": ["MI", "Michigan"], "minnesota": ["MN", "Minnesota"],
  "mississippi": ["MS", "Mississippi"], "missouri": ["MO", "Missouri"],
  "montana": ["MT", "Montana"], "nebraska": ["NE", "Nebraska"],
  "nevada": ["NV", "Nevada"], "new hampshire": ["NH", "New Hampshire"],
  "new jersey": ["NJ", "New Jersey"], "new mexico": ["NM", "New Mexico"],
  "new york": ["NY", "New York"], "north carolina": ["NC", "North Carolina"],
  "north dakota": ["ND", "North Dakota"], "ohio": ["OH", "Ohio"],
  "oklahoma": ["OK", "Oklahoma"], "oregon": ["OR", "Oregon"],
  "pennsylvania": ["PA", "Pennsylvania"], "rhode island": ["RI", "Rhode Island"],
  "south carolina": ["SC", "South Carolina"], "south dakota": ["SD", "South Dakota"],
  "tennessee": ["TN", "Tennessee"], "texas": ["TX", "Texas"],
  "utah": ["UT", "Utah"], "vermont": ["VT", "Vermont"],
  "virginia": ["VA", "Virginia"], "washington": ["WA", "Washington"],
  "west virginia": ["WV", "West Virginia"], "wisconsin": ["WI", "Wisconsin"],
  "wyoming": ["WY", "Wyoming"],
  "district of columbia": ["DC", "D.C.", "Washington DC", "Washington, D.C."],
};

// Expand a user-typed location to all recognizable DB variants.
// "florida" → ["florida", "FL", "Florida"]  "FL" → ["FL", "Florida"]
function expandLocation(input: string): string[] {
  const lower = input.toLowerCase().trim();
  if (US_STATES[lower]) return [input, ...US_STATES[lower]];
  for (const [, variants] of Object.entries(US_STATES)) {
    if (variants.some(v => v.toLowerCase() === lower)) {
      return [...new Set([input, ...variants])];
    }
  }
  return [input];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  console.log("=== JOBS API CALLED ===");
  console.log("All params:", Object.fromEntries(searchParams.entries()));
  console.log("Location param:", searchParams.get("location"));
  const keyword = (searchParams.get("keyword") || "").toLowerCase().trim();
  const location = searchParams.get("location") || "";
  const jobType = searchParams.get("jobType") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const suggestMode = searchParams.get("suggest") === "true";
  const fresh = searchParams.get("fresh") === "true";
  const datePosted = searchParams.get("datePosted") || "";
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  function getDateCutoff(): string {
    if (datePosted === "Last 24h") return new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    if (datePosted === "3 days")  return new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    if (datePosted === "Week")    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // Hard 30-day limit — always, no exceptions
    return thirtyDaysAgo;
  }
  const dateCutoff = getDateCutoff();

  // posted_at must exist and be within cutoff — no fallback to created_at
  function applyDateFilter(q: any, cutoff: string) {
    return q.gte("posted_at", cutoff).not("posted_at", "is", null);
  }

  try {
    const supabase = getSupabaseAdmin();

    // SINGLE JOB MODE — fetch by id
    const singleId = searchParams.get("id");
    if (singleId) {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", singleId).single();
      if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ job: normalizeJob(data) });
    }

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

    // Build location OR filter string
    // Simple %term% substring match — reliable in PostgREST, no false positives
    // ("berlin" will NOT match "Arlington" — substring match is exact)
    let locationOrString = "";
    if (location) {
      const inputLocs = location.split(",").map(l => l.trim()).filter(Boolean);
      const allTerms = new Set<string>();

      for (const raw of inputLocs) {
        const lower = raw.toLowerCase();

        if (lower === "remote") {
          allTerms.add("Remote");
          continue;
        }
        if (lower === "usa" || lower === "united states") {
          // Full state names instead of abbreviations — "CA" matches Canada, "WA" matches Warsaw etc.
          for (const t of [
            "United States",
            "California", "New York", "Texas", "Washington",
            "Massachusetts", "Illinois", "Colorado", "Georgia",
            "Florida", "Virginia", "Pennsylvania", "Ohio",
            "North Carolina", "Arizona", "Michigan",
            "Seattle", "San Francisco", "Los Angeles", "Chicago",
            "Austin", "Boston", "Miami", "Denver", "Atlanta",
          ]) allTerms.add(t);
          continue;
        }
        if (lower === "europe") {
          for (const t of ["London", "Berlin", "Paris", "Amsterdam", "Dublin", "Europe", "EMEA"])
            allTerms.add(t);
          continue;
        }
        if (lower === "latam") {
          for (const t of ["Brazil", "Mexico", "Colombia", "LATAM"]) allTerms.add(t);
          continue;
        }

        // Expand US states, then add every variant
        for (const v of expandLocation(raw)) allTerms.add(v);
      }

      const unique = [...allTerms];
      locationOrString = unique.map(t => `location.ilike.%${t}%`).join(",");

    }

    if (keyword) {
      return fullTextSearch(supabase, keyword, locationOrString, jobType, limit, offset, dateCutoff);
    } else {
      // No keyword — return latest jobs with optional filters
      let query = supabase.from("jobs").select("*", { count: "exact" });
      if (locationOrString) query = query.or(locationOrString);
      if (jobType) query = query.ilike("job_type", `%${jobType}%`);
      query = applyDateFilter(query, dateCutoff);

      const { data: jobs, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      console.log("No-keyword query — error:", error?.message ?? "none", "count:", count, "first locations:", (jobs || []).slice(0, 3).map((j: any) => j.location));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const filtered = (jobs || []).filter((j: any) => !isAdTitle(j.title));
      return NextResponse.json({
        jobs: filtered.map(normalizeJob),
        meta: { total: count || 0, returned: filtered.length, offset, limit },
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
  locationOrString: string,
  jobType: string,
  limit: number,
  offset: number,
  freshCutoff: string
) {
  const LEVEL_WORDS = new Set([
    "senior", "junior", "lead", "staff", "principal", "sr", "jr", "mid", "head"
  ]);

  const words = keyword.split(/\s+/).filter(w => w.length > 0);
  const coreWords = words.filter(w => !LEVEL_WORDS.has(w));
  const searchWords =
    coreWords.length >= Math.ceil(words.length / 2) ? coreWords : words;

  // Title-first: high-precision search before falling back to full-text description search.
  // Without this, "Motion Designer" matches jobs that merely mention those words in descriptions.
  const titleResult = await titleSearchFallback(
    supabase, searchWords, locationOrString, jobType, limit, offset, freshCutoff
  );
  const titleBody = await titleResult.json();
  if ((titleBody.meta?.total ?? 0) > 0) {
    return NextResponse.json({ ...titleBody, meta: { ...titleBody.meta, searchType: "title_priority" } });
  }

  // No title matches — cast a wider net via full-text (description-inclusive)
  try {
    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .textSearch("search_vector", searchWords.join(" "), {
        type: "websearch",
        config: "english",
      });

    if (locationOrString) query = query.or(locationOrString);
    if (jobType) query = query.ilike("job_type", `%${jobType}%`);
    query = query.gte("posted_at", freshCutoff).not("posted_at", "is", null);

    const { data: jobs, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && jobs && jobs.length > 0) {
      const filtered = jobs.filter((j: any) => !isAdTitle(j.title));
      return NextResponse.json({
        jobs: filtered.map(normalizeJob),
        meta: { total: count || 0, returned: filtered.length, offset, limit, searchType: "fulltext_description" },
      });
    }

    return NextResponse.json({ jobs: [], meta: { total: 0, returned: 0, offset, limit, searchType: "no_results" } });

  } catch {
    return NextResponse.json({ jobs: [], meta: { total: 0, returned: 0, offset, limit, searchType: "error" } });
  }
}

// Fallback: title ILIKE only
async function titleSearchFallback(
  supabase: any,
  searchWords: string[],
  locationOrString: string,
  jobType: string,
  limit: number,
  offset: number,
  freshCutoff: string
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

  if (locationOrString) query = query.or(locationOrString);
  if (jobType) query = query.ilike("job_type", `%${jobType}%`);
  query = query.gte("posted_at", freshCutoff).not("posted_at", "is", null);

  const { data: jobs, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = (jobs || []).filter((j: any) => !isAdTitle(j.title));
  return NextResponse.json({
    jobs: filtered.map(normalizeJob),
    meta: { total: count || 0, returned: filtered.length, offset, limit, searchType: "ilike_title_only" },
  });
}

function isAdTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    /earn at least \$/.test(t) ||
    /trips, guaranteed/.test(t) ||
    /drive with uber/.test(t) ||
    /drive with lyft/.test(t) ||
    /looking for part-time jobs/.test(t) ||
    /\$[\d,]+ guarantee/.test(t) ||
    /part-time gig:/.test(t) ||
    /sign.?up bonus/.test(t) ||
    /guaranteed bonus/.test(t)
  );
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
