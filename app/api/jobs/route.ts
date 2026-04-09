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

    if (keyword) {
      const words = keyword.split(/\s+/).filter(Boolean);

      if (words.length === 1) {
        const word = words[0];
        if (word.length <= 3) {
          // Short words like HR, AI, UI — match whole word only
          query = query.or(
            `title.ilike.% ${word} %,title.ilike.${word} %,title.ilike.% ${word},title.ilike.${word}`
          );
        } else {
          query = query.ilike("title", `%${word}%`);
        }
      } else {
        // Multi-word: first word is REQUIRED (AND), rest are optional (OR)
        // "Motion Graphic Designer" → must have "Motion", and has "Graphic" OR "Designer"
        // "Software Engineer" → must have "Software" AND "Engineer"
        const [firstWord, ...restWords] = words.filter(w => w.length > 2);

        // First word is mandatory
        query = query.ilike("title", `%${firstWord}%`);

        // If 2 words — both required (AND)
        if (restWords.length === 1) {
          query = query.ilike("title", `%${restWords[0]}%`);
        } else if (restWords.length > 1) {
          // 3+ words — first required, rest as OR
          const orParts = restWords.map(w => `title.ilike.%${w}%`);
          query = query.or(orParts.join(","));
        }
      }
    }

    if (location) {
      const locs = location.split(",").map((l) => l.trim().toLowerCase());
      const patterns: string[] = [];

      for (const loc of locs) {
        if (loc === "remote") patterns.push("location.ilike.%Remote%");
        if (loc === "usa") {
          patterns.push(
            "location.ilike.%United States%",
            "location.ilike.%New York%",
            "location.ilike.%San Francisco%",
            "location.ilike.%Seattle%",
            "location.ilike.%Los Angeles%",
            "location.ilike.%Chicago%",
            "location.ilike.%Boston%",
            "location.ilike.%Austin%",
            "location.ilike.%Denver%",
            "location.ilike.%Atlanta%",
            "location.ilike.%Miami%",
            "location.ilike.% CA%",
            "location.ilike.% NY%",
            "location.ilike.% WA%",
            "location.ilike.% TX%",
            "location.ilike.% FL%"
          );
        }
        if (loc === "europe") {
          patterns.push(
            "location.ilike.%London%",
            "location.ilike.%Berlin%",
            "location.ilike.%Paris%",
            "location.ilike.%Amsterdam%",
            "location.ilike.%Dublin%",
            "location.ilike.%Lisbon%",
            "location.ilike.%Barcelona%",
            "location.ilike.%Warsaw%",
            "location.ilike.%Zurich%",
            "location.ilike.%EMEA%",
            "location.ilike.%Europe%"
          );
        }
        if (loc === "latam") {
          patterns.push(
            "location.ilike.%Brazil%",
            "location.ilike.%Argentina%",
            "location.ilike.%Mexico%",
            "location.ilike.%Colombia%",
            "location.ilike.%LATAM%"
          );
        }
      }

      if (patterns.length > 0) query = query.or(patterns.join(","));
    }

    if (jobType) query = query.ilike("job_type", `%${jobType}%`);

    const { data: jobs, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error.message);
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

  } catch (e: any) {
    console.error("Jobs route error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
