import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 минут — Railway позволяет

// ─── Company lists ────────────────────────────────────────────────────────────

const GREENHOUSE_COMPANIES = [
  "anthropic", "openai", "notion", "figma", "vercel", "stripe",
  "airbnb", "pinterest", "reddit", "shopify", "dropbox",
  "hubspot", "intercom", "zendesk", "asana", "airtable", "canva",
  "discord", "duolingo", "robinhood", "coinbase", "brex", "rippling",
  "databricks", "replit", "scale", "cohere",
  "gusto", "pilot", "moderntreasury", "lithic", "unit",
  "segment", "amplitude", "mixpanel", "posthog", "launchdarkly",
  "sentry", "snyk", "hashicorp", "cloudflare", "fastly",
  "grafana", "datadog", "newrelic", "pagerduty",
  "verily", "ro", "cerebral", "springhealth", "headspace", "noom",
  "faire", "whatnot", "opendoor", "compass",
  "webflow", "coda", "clickup", "lattice",
  "bumble", "peloton", "calm", "chainalysis", "opensea",
  "flexport", "samsara", "palantir", "anduril",
  "masterclass", "coursera", "doordashusa", "lyft",
];

const ASHBY_COMPANIES = [
  "linear", "retool", "ramp", "deel", "monzo", "superhuman", "vanta",
  "metabase", "dagster", "hightouch", "census", "pitch",
  "supabase", "neon", "upstash", "resend", "cal", "raycast",
  "highlight", "axiom", "clerk", "workos",
  "mintlify", "gitbook", "readme",
  "perplexity", "dust", "langchain",
];

const LEVER_COMPANIES = [
  "Academy", "cognite", "ivo", "iru", "pano",
  "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "hex", "descript", "modal", "together",
  "plaid", "chime", "marqeta",
  "benchling", "ginkgo", "recursion",
  "flexport", "project44", "faire", "whatnot",
  "hightouch", "airbyte", "cortex", "rootly",
  "lumos", "drata", "primer", "sardine",
  "replit", "codeium", "enablecomp",
];

const SMARTRECRUITERS_COMPANIES = [
  "Filmless", "IKEA", "Lidl", "Bosch", "Siemens",
  "Delivery-Hero", "Zalando", "Klarna", "Revolut",
  "N26", "SumUp", "Wolt",
  "Ubisoft", "EA", "Riot-Games", "Epic-Games",
  "Warner-Bros-Discovery", "NBCUniversal",
  "Publicis", "WPP", "Dentsu", "BBDO", "Ogilvy", "McCann",
];

// ─── Fetchers ─────────────────────────────────────────────────────────────────

function formatSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchGreenhouse(company: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];
    return data.jobs.map((job: any) => ({
      id: `gh_${job.id}`,
      title: job.title || "",
      company: formatSlug(company),
      location: job.location?.name || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Greenhouse",
      posted_date: job.updated_at
        ? new Date(job.updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "",
      apply_url: job.absolute_url || `https://boards.greenhouse.io/${company}`,
      description: "Click Apply to view full job description.",
    }));
  } catch { return []; }
}

async function fetchAshby(company: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];
    return data.jobs.map((job: any) => ({
      id: `ash_${job.id}`,
      title: job.title || "",
      company: formatSlug(company),
      location: job.location || "Remote",
      salary: "",
      job_type: job.employmentType === "FullTime" ? "Full-time" : job.employmentType || "Full-time",
      source: "Ashby",
      posted_date: job.publishedAt
        ? new Date(job.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "",
      apply_url: job.applyUrl || job.jobUrl || `https://jobs.ashbyhq.com/${company}`,
      description: (job.descriptionPlain || "").substring(0, 500),
    }));
  } catch { return []; }
}

async function fetchLever(company: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json&limit=100`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((job: any) => ({
      id: `lv_${job.id}`,
      title: job.text || "",
      company: formatSlug(company),
      location: job.categories?.location || "Remote",
      salary: "",
      job_type: job.categories?.commitment || "Full-time",
      source: "Lever",
      posted_date: job.createdAt
        ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "",
      apply_url: job.hostedUrl || `https://jobs.lever.co/${company}`,
      description: (job.descriptionPlain || "").substring(0, 500),
    }));
  } catch { return []; }
}

async function fetchSmartRecruiters(company: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.content || [];
    return jobs.map((job: any) => {
      const loc = job.location || {};
      const locationStr = [loc.city, loc.region, loc.country].filter(Boolean).join(", ") || "Remote";
      return {
        id: `sr_${job.uuid || job.id}`,
        title: job.name || "",
        company: job.company?.name || formatSlug(company),
        location: locationStr,
        salary: "",
        job_type: job.typeOfEmployment?.label || "Full-time",
        source: "SmartRecruiters",
        posted_date: job.releasedDate
          ? new Date(job.releasedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        apply_url: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
        description: "Click Apply to view full job description.",
      };
    });
  } catch { return []; }
}

// ─── Sync handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Защита — только с секретным ключом
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.SYNC_SECRET && process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Starting job sync...");
  const stats = { greenhouse: 0, ashby: 0, lever: 0, smartrecruiters: 0, errors: 0 };

  // Собираем все вакансии
  const [ghResults, ashbyResults, leverResults, srResults] = await Promise.all([
    Promise.all(GREENHOUSE_COMPANIES.map(fetchGreenhouse)),
    Promise.all(ASHBY_COMPANIES.map(fetchAshby)),
    Promise.all(LEVER_COMPANIES.map(fetchLever)),
    Promise.all(SMARTRECRUITERS_COMPANIES.map(fetchSmartRecruiters)),
  ]);

  const allJobs = [
    ...ghResults.flat(),
    ...ashbyResults.flat(),
    ...leverResults.flat(),
    ...srResults.flat(),
  ];

  stats.greenhouse = ghResults.flat().length;
  stats.ashby = ashbyResults.flat().length;
  stats.lever = leverResults.flat().length;
  stats.smartrecruiters = srResults.flat().length;

  console.log(`Fetched ${allJobs.length} jobs total`);

  // Сохраняем в Supabase батчами по 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < allJobs.length; i += BATCH_SIZE) {
    const batch = allJobs.slice(i, i + BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("jobs")
      .upsert(batch, { onConflict: "id" });
    if (error) {
      console.error("Batch error:", error);
      stats.errors++;
    }
  }

  // Удаляем старые вакансии (старше 60 дней)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  await supabaseAdmin
    .from("jobs")
    .delete()
    .lt("updated_at", sixtyDaysAgo.toISOString());

  return NextResponse.json({
    success: true,
    total: allJobs.length,
    stats,
  });
}
