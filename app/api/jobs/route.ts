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
];

// Lever slugs — verified working
const LEVER_COMPANIES = [
  "Academy", "cognite", "ivo", "iru", "pano",
  "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "hex",
  "descript",
  "modal", "together",
  "plaid", "chime", "marqeta",
  "benchling", "ginkgo", "recursion",
  "flexport", "project44",
  "faire", "whatnot",
  "privy", "thirdweb", "alchemy",
  "hightouch", "airbyte",
  "cortex", "rootly",
  "lumos", "drata",
  "primer", "sardine",
  "replit", "codeium",
  "enablecomp",
];

// Workday — each company has its own subdomain
// Format: [subdomain, tenant] e.g. ibotta.wd1 → subdomain=ibotta, tenant=wd1
const WORKDAY_COMPANIES: { name: string; subdomain: string; tenant: string }[] = [
  { name: "Ibotta", subdomain: "ibotta", tenant: "wd1" },
  { name: "Nike", subdomain: "nike", tenant: "wd1" },
  { name: "Target", subdomain: "target", tenant: "wd5" },
  { name: "Walmart", subdomain: "walmart", tenant: "wd5" },
  { name: "Salesforce", subdomain: "salesforce", tenant: "wd1" },
  { name: "Workday", subdomain: "workday", tenant: "wd5" },
  { name: "Adobe", subdomain: "adobe", tenant: "wd5" },
  { name: "Autodesk", subdomain: "autodesk", tenant: "wd1" },
  { name: "Spotify", subdomain: "spotify", tenant: "wd1" },
  { name: "Twitter", subdomain: "twitter", tenant: "wd5" },
  { name: "Snap", subdomain: "snap", tenant: "wd1" },
  { name: "Lyft", subdomain: "lyft", tenant: "wd5" },
  { name: "Instacart", subdomain: "instacart", tenant: "wd1" },
  { name: "Squarespace", subdomain: "squarespace", tenant: "wd5" },
  { name: "Box", subdomain: "box", tenant: "wd1" },
  { name: "Splunk", subdomain: "splunk", tenant: "wd5" },
  { name: "Okta", subdomain: "okta", tenant: "wd1" },
  { name: "Twilio", subdomain: "twilio", tenant: "wd1" },
  { name: "Zoom", subdomain: "zoom", tenant: "wd5" },
  { name: "HubSpot", subdomain: "hubspot", tenant: "wd1" },
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
      loc.includes(", tx") || loc.includes(", fl") || loc.includes(", co") ||
      loc.includes("north america") || loc.includes("new york") ||
      loc.includes("san francisco") || loc.includes("seattle") ||
      loc.includes("los angeles") || loc.includes("chicago") || loc.includes("denver")
    );
    if (f === "europe") return (
      loc.includes("europe") || loc.includes("uk") || loc.includes("london") ||
      loc.includes("berlin") || loc.includes("paris") || loc.includes("amsterdam") ||
      loc.includes("zurich") || loc.includes("dublin") || loc.includes("lisbon") ||
      loc.includes("emea") || loc.includes("warsaw") || loc.includes("barcelona")
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
      .filter((job: any) => (job.title || "").toLowerCase().includes(keyword))
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
      .filter((job: any) => (job.title || "").toLowerCase().includes(keyword))
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
    const url = `https://api.lever.co/v0/postings/${company}?mode=json&limit=50`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];
    // Filter by keyword in title only
    return data
      .filter((job: any) => (job.text || "").toLowerCase().includes(keyword))
      .map((job: any) => ({
        id: `lv_${job.id}`,
        title: job.text || "",
        company: formatSlug(company), // use slug, not team name
        location: job.categories?.location || job.categories?.allLocations?.[0] || "Remote",
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

async function fetchWorkday(
  company: { name: string; subdomain: string; tenant: string },
  keyword: string
): Promise<any[]> {
  try {
    const url = `https://${company.subdomain}.${company.tenant}.myworkdayjobs.com/wday/cxs/${company.subdomain}/External_Career_Site/jobs`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: keyword,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobPostings || [];
    return jobs
      .filter((job: any) => (job.title || "").toLowerCase().includes(keyword))
      .map((job: any) => ({
        id: `wd_${job.bulletFields?.[0] || job.title?.replace(/\s+/g, "_")}`,
        title: job.title || "",
        company: company.name,
        location: job.locationsText || job.location || "See listing",
        salary: "",
        jobType: "Full-time",
        source: "Workday",
        postedDate: job.postedOn || "",
        postedDateDisplay: job.postedOn
          ? new Date(job.postedOn).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        applyUrl: job.externalPath
          ? `https://${company.subdomain}.${company.tenant}.myworkdayjobs.com${job.externalPath}`
          : `https://${company.subdomain}.${company.tenant}.myworkdayjobs.com`,
        description: "Click Apply to view full job description.",
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

  const [greenhouseResults, ashbyResults, leverResults, workdayResults] = await Promise.all([
    Promise.all(GREENHOUSE_COMPANIES.map((c) => fetchGreenhouse(c, keyword))),
    Promise.all(ASHBY_COMPANIES.map((c) => fetchAshby(c, keyword))),
    Promise.all(LEVER_COMPANIES.map((c) => fetchLever(c, keyword))),
    Promise.all(WORKDAY_COMPANIES.map((c) => fetchWorkday(c, keyword))),
  ]);

  const allJobs = [
    ...leverResults.flat(),
    ...workdayResults.flat(),
    ...ashbyResults.flat(),
    ...greenhouseResults.flat(),
  ];

  // Deduplicate by title + company
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
        workday: workdayResults.flat().length,
      },
    },
  });
}
