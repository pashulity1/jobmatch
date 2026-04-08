import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "").toLowerCase().trim();
  const location = searchParams.get("location") || "";
  const jobType = searchParams.get("jobType") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = getSupabaseAdmin();
  let query = supabase.from("jobs").select("*", { count: "exact" });

  // Поиск по keyword — каждое слово должно быть в title
  if (keyword) {
    const words = keyword.split(/\s+/).filter(Boolean);
    for (const word of words) {
      query = query.ilike("title", `%${word}%`);
    }
  }

  // Фильтр по location
  if (location) {
    const locs = location.split(",").map((l) => l.trim().toLowerCase());
    const orParts: string[] = [];
    for (const loc of locs) {
      if (loc === "remote") orParts.push("location.ilike.%remote%");
      else if (loc === "usa") {
        orParts.push(
          "location.ilike.%United States%",
          "location.ilike.%USA%",
          "location.ilike.%New York%",
          "location.ilike.%San Francisco%",
          "location.ilike.%Seattle%",
          "location.ilike.%, CA%",
          "location.ilike.%, NY%",
          "location.ilike.%, WA%",
          "location.ilike.%, TX%"
        );
      } else if (loc === "europe") {
        orParts.push(
          "location.ilike.%London%",
          "location.ilike.%Berlin%",
          "location.ilike.%Paris%",
          "location.ilike.%Amsterdam%",
          "location.ilike.%Europe%",
          "location.ilike.%UK%",
          "location.ilike.%EMEA%"
        );
      } else if (loc === "latam") {
        orParts.push(
          "location.ilike.%Brazil%",
          "location.ilike.%Argentina%",
          "location.ilike.%Mexico%",
          "location.ilike.%Colombia%",
          "location.ilike.%LATAM%"
        );
      } else {
        orParts.push(`location.ilike.%${loc}%`);
      }
    }
    if (orParts.length > 0) query = query.or(orParts.join(","));
  }

  // Фильтр по job type
  if (jobType) {
    query = query.ilike("job_type", `%${jobType}%`);
  }

  // Сортировка и пагинация
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({
      jobs: [],
      meta: { total: 0, returned: 0, message: "No jobs found. Run /api/sync first." },
    });
  }

  const normalized = jobs.map((job: any) => ({
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
    meta: { total: count || 0, returned: normalized.length, offset, limit },
  });
}
