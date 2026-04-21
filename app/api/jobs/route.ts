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
// "florida" → ["florida", "FL", "Florida"]
// "FL"      → ["FL", "Florida"]
// "france"  → ["france"]
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

// Build OR filter fragments for one location term.
// IMPORTANT: values must NEVER contain commas — PostgREST splits .or() on commas.
// Short abbreviations (≤2 chars like "CA") skip the starts-with pattern to
// avoid false positives like "CA%" matching "Canada".
function termPatterns(term: string): string[] {
  const v = term.trim();
  if (v.length <= 2) {
    return [
      `location.ilike.%${v}`,    // "San Francisco, CA"
      `location.ilike.% ${v}`,   // "San Francisco CA"
      `location.ilike.% ${v}%`,  // "San Francisco, CA, US"
    ];
  }
  return [
    `location.ilike.${v}%`,    // "France", "France, Paris", "France (Remote)"
    `location.ilike.%${v}`,    // "Paris, France", "Île-de-France"
    `location.ilike.% ${v}`,   // "Paris France"
    `location.ilike.% ${v}%`,  // "Paris, France, EU"
  ];
}

// Kept for the named-region special cases (europe, latam, usa city list)
function strictLocationPatterns(term: string): string[] {
  return termPatterns(term);
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
      // Keep original casing — ILIKE is case-insensitive
      const locs = location.split(",").map(l => l.trim());
      for (const raw of locs) {
        const loc = raw.toLowerCase();
        if (!loc || loc.length < 2) continue;

        if (loc === "remote") {
          locationPatterns.push(
            "location.ilike.Remote%",   // "Remote", "Remote, France"
            "location.ilike.%Remote",   // "France, Remote"
            "location.ilike.% Remote",  // "Paris Remote"
            "location.ilike.% Remote%", // "Paris, Remote, EU"
          );
          continue;
        }
        if (loc === "usa") {
          for (const term of [
            "United States", "New York", "San Francisco", "Seattle",
            "Los Angeles", "Chicago", "Boston", "Austin", "US",
          ]) {
            locationPatterns.push(...termPatterns(term));
          }
          // Common state abbreviations — suffix-only to avoid "CA%" matching "Canada"
          for (const abbr of ["CA", "NY", "WA", "TX", "MA", "IL", "CO", "GA", "FL"]) {
            locationPatterns.push(...termPatterns(abbr));
          }
          continue;
        }
        if (loc === "europe") {
          for (const term of ["London", "Berlin", "Paris", "Amsterdam", "Dublin", "Europe", "EMEA"]) {
            locationPatterns.push(...strictLocationPatterns(term));
          }
          continue;
        }
        if (loc === "latam") {
          for (const term of ["Brazil", "Mexico", "Colombia", "LATAM"]) {
            locationPatterns.push(...strictLocationPatterns(term));
          }
          continue;
        }
        // Free-text: expand US states to all variants (FL, Florida, etc.) then build patterns
        const variants = expandLocation(raw);
        for (const v of variants) {
          locationPatterns.push(...termPatterns(v));
        }
      }
    }

    if (locationPatterns.length > 0) {
      console.log("Location OR string:", locationPatterns.join(","));
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
