import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const GREENHOUSE_COMPANIES = [
  "anthropic", "notion", "figma", "vercel", "stripe",
  "airbnb", "pinterest", "reddit", "shopify", "dropbox",
  "hubspot", "intercom", "zendesk", "asana", "airtable", "canva",
  "discord", "duolingo", "robinhood", "coinbase", "brex", "rippling",
  "databricks", "openai", "replit"
];

const ASHBY_COMPANIES = [
  "linear", "retool", "ramp", "deel", "mercury",
  "loom", "monzo", "superhuman", "vanta", "metabase",
  "dagster", "hightouch", "census", "pitch", "dbt"
];

async function fetchGreenhouse(company: string, keyword: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];

    return data.jobs
      .filter((job: any) => {
        const title = (job.title || "").toLowerCase();
        const dept = (job.departments?.[0]?.name || "").toLowerCase();
        return title.includes(keyword) || dept.includes(keyword);
      })
      .map((job: any) => ({
        id: `gh_${job.id}`,
        title: job.title || "",
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: job.location?.name || "Remote",
        salary: "",
        jobType: "Full-time",
        postedDate: job.updated_at
          ? new Date(job.updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        applyUrl: job.absolute_url || `https://boards.greenhouse.io/${company}`,
        description: "Click Apply to view full job description.",
      }));
  } catch {
    return [];
  }
}

async function fetchAshby(company: string, keyword: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];

    return data.jobs
      .filter((job: any) => {
        const title = (job.title || "").toLowerCase();
        const dept = (job.department || "").toLowerCase();
        return title.includes(keyword) || dept.includes(keyword);
      })
      .map((job: any) => ({
        id: `ash_${job.id}`,
        title: job.title || "",
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: job.location || job.address?.postalAddress?.addressCountry || "Remote",
        salary: "",
        jobType: job.employmentType === "FullTime" ? "Full-time" : job.employmentType || "Full-time",
        postedDate: job.publishedAt
          ? new Date(job.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        applyUrl: job.applyUrl || job.jobUrl || `https://jobs.ashbyhq.com/${company}`,
        description: (job.descriptionPlain || "").substring(0, 220) + "...",
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "designer").toLowerCase();

  const [greenhouseResults, ashbyResults] = await Promise.all([
    Promise.all(GREENHOUSE_COMPANIES.map((c) => fetchGreenhouse(c, keyword))),
    Promise.all(ASHBY_COMPANIES.map((c) => fetchAshby(c, keyword))),
  ]);

  const allJobs = [
    ...ashbyResults.flat(),
    ...greenhouseResults.flat(),
  ];

  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((job) => {
    const key = `${job.title}_${job.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ jobs: uniqueJobs.slice(0, 20) });
}
