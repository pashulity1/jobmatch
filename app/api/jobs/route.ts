import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "of", "to", "for", "in", "on", "at", "by", "with"]);

const SYNONYMS: Record<string, string[]> = {
  "motion": ["motion", "animation", "animated", "mograph"],
  "graphic": ["graphic", "graphics", "visual"],
  "designer": ["designer", "design", "creative"],
  "developer": ["developer", "engineer", "dev"],
  "software": ["software", "full stack", "fullstack", "full-stack"],
  "hr": ["hr", "human resources", "people", "talent", "hrbp"],
  "manager": ["manager", "lead", "director", "head"],
  "data": ["data", "analytics", "analyst"],
  "product": ["product", "pm", "growth"],
  "marketing": ["marketing", "growth", "demand gen", "content"],
  "sales": ["sales", "account executive", "ae", "bdr", "sdr"],
  "devops": ["devops", "platform", "site reliability", "sre", "infrastructure"],
  "video": ["video", "film", "cinema", "editor", "editing"],
};

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

    // Location filter
    if (location) {
      const locs = location.split(",").map(l => l.trim().toLowerCase());
      const patterns: string[] = [];
      for (const loc of locs) {
        if (loc === "remote") patterns.push("location.ilike.%Remote%");
        if (loc === "usa") {
          patterns.push(
            "location.ilike.%United States%", "location.ilike.%New York%",
            "location.ilike.%San Francisco%", "location.ilike.%Seattle%",
            "location.ilike.%Los Angeles%", "location.ilike.%Chicago%",
            "location.ilike.%Boston%", "location.ilike.%Austin%",
            "location.ilike.% CA%", "location.ilike.% NY%",
            "location.ilike.% WA%", "location.ilike.% TX%"
          );
        }
        if (loc === "europe") {
          patterns.push(
            "location.ilike.%London%", "location.ilike.%Berlin%",
            "location.ilike.%Paris%", "location.ilike.%Amsterdam%",
            "location.ilike.%Dublin%", "location.ilike.%Europe%", "location.ilike.%EMEA%"
          );
        }
        if (loc === "latam") {
          patterns.push(
            "location.ilike.%Brazil%", "location.ilike.%Mexico%",
            "location.ilike.%Colombia%", "location.ilike.%LATAM%"
          );
        }
      }
      if (patterns.length > 0) query = query.or(patterns.join(","));
    }

    if (jobType) query = query.ilike("job_type", `%${jobType}%`);

    if (keyword) {
      // Extract search words and expand with synonyms
      const searchWords = keyword.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
      const expandedWords = new Set<string>();

      for (const word of searchWords) {
        expandedWords.add(word);
        for (const [key, synonyms] of Object.entries(SYNONYMS)) {
          if (word.includes(key) || key.includes(word)) {
            synonyms.forEach(s => expandedWords.add(s));
          }
        }
      }

      // Broad SQL filter — at least one word must appear in title
      const wordArray = Array.from(expandedWords).filter(w => w.length > 2);
      if (wordArray.length > 0) {
        const orParts = wordArray.map(w => `title.ilike.%${w}%`);
        query = query.or(orParts.join(","));
      }
    }

    // Get up to 500 results for in-memory ranking
    const fetchLimit = keyword ? 500 : limit;
    const { data: rawJobs, error } = await query
      .order("created_at", { ascending: false })
      .range(0, fetchLimit - 1);

    if (error) {
      console.error("Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let jobs = rawJobs || [];

    // In-memory scoring and ranking
    if (keyword) {
      const searchWords = keyword.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
      const firstWord = searchWords[0] || "";

      jobs = jobs
        .map((job: any) => {
          const title = (job.title || "").toLowerCase();
          const desc = (job.description || "").toLowerCase();
          let score = 0;

          // Exact phrase match — highest score
          if (title.includes(keyword)) score += 50;

          // First word match — very important
          if (firstWord && title.includes(firstWord)) score += 20;

          // Each search word in title
          for (const word of searchWords) {
            if (title.includes(word)) score += 10;
            // Partial word match (e.g. "design" matches "designer")
            else if (title.split(/\s+/).some(t => t.includes(word) || word.includes(t))) score += 5;
            // Match in description
            else if (desc.includes(word)) score += 1;
          }

          // Ratio bonus
          const matchedWords = searchWords.filter(w => title.includes(w)).length;
          score += (matchedWords / searchWords.length) * 15;

          return { ...job, _score: score };
        })
        .filter((job: any) => job._score > 0)
        .sort((a: any, b: any) => b._score - a._score);
    }

    // Paginate after ranking
    const total = jobs.length;
    const paginated = jobs.slice(offset, offset + limit);

    const normalized = paginated.map((job: any) => ({
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

  } catch (e: any) {
    console.error("Jobs route error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
