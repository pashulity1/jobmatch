import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

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
  "bumble", "peloton", "calm",
  "chainalysis", "opensea",
  "flexport", "samsara",
  "palantir", "anduril",
  "masterclass", "coursera",
  "doordashusa", "lyft",
];

const ASHBY_COMPANIES = [
  "linear", "retool", "ramp", "deel", "monzo", "superhuman", "vanta",
  "metabase", "dagster", "hightouch", "census", "pitch",
  "supabase", "neon", "upstash",
  "resend", "cal",
  "raycast",
  "highlight", "axiom",
  "clerk", "workos",
  "mintlify", "gitbook", "readme",
  "perplexity", "dust", "langchain",
  "onyx%20games%20llc",
];

// Lever slugs — verified working (case-sensitive!)
const LEVER_COMPANIES = [
  "Academy", "Superhuman", "cognite", "ivo", "iru", "pano",
  "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "scale", "lattice", "hex",
  "descript", "weights-biases", "modal",
  "figma", "retool", "rippling", "brex",
  "plaid", "chime", "marqeta",
  "benchling", "ginkgo", "recursion",
  "flexport", "project44",
  "anduril", "shield-ai",
  "duolingo", "kahoot",
  "faire", "whatnot",
  "privy", "thirdweb", "alchemy",
  "hightouch", "census", "airbyte",
  "cortex", "incident-io", "rootly",
  "lumos", "vanta", "drata",
  "primer", "sardine", "unit21",
  "replit", "codeium", "cursor",
  "perplexity", "cohere", "together",
  "enablecomp", "pibenchmark",
];

// ─── Filters ──────────────────────────────────────────────────────────────────

function matchesLocation(jobLocation: string, filter: string): boolean {
  if (!filter) return true;
  const loc = jobLocation.toLowerCase();
  const filters = filter.toLowerCase().split(",").map((f) => f.trim());
  return filters.some((f) => {
    if (f === "remote") return loc.includes("remote");
    if (f === "usa") return (
      loc.includes("usa") || loc.includes("united states") ||
      loc.includes(", ny") || loc.includes(", ca") || loc.includes(", wa") ||
      loc.includes(", tx") || loc.includes(", fl") || loc.includes("north america") ||
      loc.includes("new york") || loc.includes("san francisco") || loc.includes("seattle")
    );
    if (f === "europe") return (
      loc.includes("europe") || loc.includes("uk") || loc.includes("london") ||
      loc.includes("berlin") || loc.includes("paris") || loc.includes("amsterdam") ||
      loc.includes("zurich") || loc.includes("dublin") || loc.includes("lisbon") ||
      loc.includes("emea")
    );
    if (f === "latam") return (
      loc.includes("latam") || loc.includes("latin america") ||
      loc.includes("brazil") || loc.includes("argentina") ||
      loc.includes("mexico") || loc.includes("colombia") ||
      loc.includes("buenos aires") || loc.includes("são paulo")
    );
    return loc.includes(f);
  });
}

function matchesDate(postedDate: string, filter: string): boolean {
  if (!filter || !postedDate) return true;
  const posted = new Date(postedDate);
  if (isNaN(posted.getTime())) return true;
  const diffDays = (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24);
  if (filter === "Last 24h") return diffDays <= 1;
  if (filter === "3 days") return diffDays <= 3;
  if (filter === "Week") return diffDays <= 7;
  if (filter === "Month") return diffDays <= 30;
  return true;
}

function matchesJobType(jobType: string, filter: string): boolean {
  if (!filter) return true;
  return jobType.toLowerCase().includes(filter.toLowerCase());
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

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
        company: formatSlug(company),
        location: job.location?.name || "Remote",
        salary: "",
        jobType: "Full-time",
        source: "Greenhouse",
        postedDate: job.updated_at || "",
        postedDateDisplay: job.updated_at
          ? new Date(job.updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        applyUrl: job.absolute_url || `https://boards.greenhouse.io/${company}`,
        description: "Click Apply to view full job description.",
      }));
  } catch { return []; }
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
        company: formatSlug(company),
        location: job.location || job.address?.postalAddress?.addressCountry || "Remote",
        salary: "",
        jobType: job.employmentType === "FullTime" ? "Full-time" : job.employmentType || "Full-time",
        source: "Ashby",
        postedDate: job.publishedAt || "",
        postedDateDisplay: job.publishedAt
          ? new Date(job.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        applyUrl: job.applyUrl || job.jobUrl || `https://jobs.ashbyhq.com/${company}`,
        description: (job.descriptionPlain || "").substring(0, 220) + "...",
      }));
  } catch { return []; }
}

async function fetchLever(company: string, keyword: string): Promise<any[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${company}?mode=json&text=${encodeURIComponent(keyword)}&limit=25`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((job: any) => ({
      id: `lv_${job.id}`,
      title: job.text || "",
      company: job.categories?.team || formatSlug(company),
      location: job.categories?.location || "Remote",
      salary: "",
      jobType: job.categories?.commitment || "Full-time",
      source: "Lever",
      postedDate: job.createdAt ? new Date(job.createdAt).toISOString() : "",
      postedDateDisplay: job.createdAt
        ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "",
      applyUrl: job.hostedUrl || `https://jobs.lever.co/${company}`,
      description: job.descriptionPlain
        ? job.descriptionPlain.substring(0, 220) + "..."
        : "Click Apply to view full job description.",
    }));
  } catch { return []; }
}

function formatSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "engineer").toLowerCase();
  const location = searchParams.get("location") || "";
  const jobType = searchParams.get("jobType") || "";
  const datePosted = searchParams.get("datePosted") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  const [greenhouseResults, ashbyResults, leverResults] = await Promise.all([
    Promise.all(GREENHOUSE_COMPANIES.map((c) => fetchGreenhouse(c, keyword))),
    Promise.all(ASHBY_COMPANIES.map((c) => fetchAshby(c, keyword))),
    Promise.all(LEVER_COMPANIES.map((c) => fetchLever(c, keyword))),
  ]);

  const allJobs = [
    ...leverResults.flat(),
    ...ashbyResults.flat(),
    ...greenhouseResults.flat(),
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((job) => {
    const key = `${job.title}_${job.company}`.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Apply filters
  const filtered = uniqueJobs.filter((job) =>
    matchesLocation(job.location, location) &&
    matchesJobType(job.jobType, jobType) &&
    matchesDate(job.postedDate, datePosted)
  );

  // Sort: most recent first
  filtered.sort((a, b) => {
    if (!a.postedDate && !b.postedDate) return 0;
    if (!a.postedDate) return 1;
    if (!b.postedDate) return -1;
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });

  const normalized = filtered.map((job) => ({
    ...job,
    postedDate: job.postedDateDisplay || job.postedDate,
  }));

  return NextResponse.json({
    jobs: normalized.slice(0, limit),
    meta: {
      total: filtered.length,
      returned: Math.min(filtered.length, limit),
      sources: {
        greenhouse: greenhouseResults.flat().length,
        ashby: ashbyResults.flat().length,
        lever: leverResults.flat().length,
      },
    },
  });
}
