import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "").toLowerCase().trim();
  const location = searchParams.get("location") || "";
  const jobType = searchParams.get("jobType") || "";
  const datePosted = searchParams.get("datePosted") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabaseAdmin.from("jobs").select("*", { count: "exact" });

  // Поиск по keyword в title (каждое слово должно быть в названии)
  if (keyword) {
    const words = keyword.split(/\s+/).filter(Boolean);
    for (const word of words) {
      query = query.ilike("title", `%${word}%`);
    }
  }

  // Фильтр по location
  if (location) {
    const locs = location.split(",").map((l) => l.trim().toLowerCase());
    const locationConditions = locs.map((loc) => {
      if (loc === "remote") return `location.ilike.%remote%`;
      if (loc === "usa") return `location.ilike.%united states%,location.ilike.%USA%,location.ilike.%New York%,location.ilike.%San Francisco%,location.ilike.%Seattle%,location.ilike.%, CA%,location.ilike.%, NY%,location.ilike.%, WA%`;
      if (loc === "europe") return `location.ilike.%London%,location.ilike.%Berlin%,location.ilike.%Paris%,location.ilike.%Amsterdam%,location.ilike.%Europe%,location.ilike.%UK%`;
      if (loc === "latam") return `location.ilike.%Brazil%,location.ilike.%Argentina%,location.ilike.%Mexico%,location.ilike.%Colombia%,location.ilike.%LATAM%`;
      return `location.ilike.%${loc}%`;
    });
    query = query.or(locationConditions.join(","));
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

  // Проверяем есть ли вакансии в БД — если нет, запускаем синхронизацию
  if (!jobs || jobs.length === 0) {
    return NextResponse.json({
      jobs: [],
      meta: {
        total: 0,
        returned: 0,
        message: "Database is empty. Please run /api/sync to populate.",
      },
    });
  }

  // Маппим поля из БД в формат фронтенда
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
}
