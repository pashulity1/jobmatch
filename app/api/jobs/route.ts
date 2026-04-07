import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// ─── Greenhouse companies ────────────────────────────────────────────────────
// Greenhouse requires knowing company slugs. This list covers ~100 companies.
// To add a company: find their Greenhouse board at boards.greenhouse.io/{slug}
const GREENHOUSE_COMPANIES = [
  // AI / ML
  "anthropic", "openai", "scale", "cohere", "huggingface", "adept",
  "inflectionai", "mistral", "characterai", "perplexity", "elevenLabs",
  // Big Tech & adjacent
  "dropbox", "pinterest", "reddit", "airbnb", "shopify", "hubspot",
  "intercom", "zendesk", "asana", "airtable", "canva", "discord",
  "duolingo", "coinbase", "robinhood", "databricks", "replit",
  // Fintech
  "brex", "rippling", "gusto", "pilot", "mercury", "mainstreet",
  "moderntreasury", "lithic", "column", "synapse", "unit",
  // Dev tools / infra
  "vercel", "figma", "notion", "loom", "miro", "zapier",
  "segment", "amplitude", "mixpanel", "posthog", "launchdarkly",
  "sentry", "snyk", "hashicorp", "cloudflare", "fastly",
  "grafana", "datadog", "newrelic", "pagerduty", "atlassian",
  // Healthcare
  "verily", "tempus", "ro", "hims", "cerebral", "springhealth",
  "headspace", "noom", "livongo", "omada", "virta",
  // E-commerce / marketplace
  "faire", "whatnot", "stockx", "goat", "vestiairecollective",
  "poshmark", "offerUp", "opendoor", "compass",
  // Growth / SaaS
  "webflow", "framer", "linear", "coda", "clickup", "monday",
  "lattice", "culture-amp", "leapsome", "personio", "hibob",
  "greenhouse", "lever", "ashby", "workday", "rippling",
  // Consumer / social
  "bumble", "hinge", "headspace", "peloton", "strava", "calm",
  // Crypto / Web3
  "alchemy", "chainalysis", "opensea", "consensys",
  // Climate / sustainability
  "climateai", "pachama", "watershed", "arcadia",
  // Logistics / ops
  "flexport", "shipbob", "samsara", "motive", "project44",
];

// ─── Ashby companies ──────────────────────────────────────────────────────────
const ASHBY_COMPANIES = [
  "linear", "retool", "ramp", "deel", "monzo", "superhuman", "vanta",
  "metabase", "dagster", "hightouch", "census", "pitch", "dbt",
  "brainbase", "loops", "farcaster", "privy", "thirdweb",
  "supabase", "planetscale", "neon", "turso", "upstash",
  "resend", "cal", "trigger", "inngest", "zuplo",
  "raycast", "arc", "warp", "fig", "rome",
  "highlight", "baselime", "axiom", "groundcover",
  "clerk", "stytch", "workos", "kinde", "descope",
  "mintlify", "gitbook", "readme",
  "perplexity", "dust", "langchain", "weights-biases",
];

// ─── Lever companies ──────────────────────────────────────────────────────────
// Lever has a GLOBAL search endpoint — no slug needed!
// We use a few big companies to get volume, plus keyword filtering.
const LEVER_COMPANIES = [
  "netflix", "twitter", "uber", "lyft", "doordash", "instacart",
  "affirm", "klarna", "chime", "nubank", "revolut", "wise",
  "plaid", "marqeta", "adyen", "checkout",
  "gitlab", "github", "jetbrains", "circleci", "buildkite",
  "elastic", "confluent", "dbt-labs", "fivetran", "airbyte",
  "benchling", "ginkgo", "recursion", "insitro",
  "anduril", "shield", "palantir", "c3ai",
  "duolingo", "masterclass", "kahoot", "coursera",
  "airtable", "smartsheet", "miro", "figma",
  "wework", "industrious", "knotel",
  "sweetgreen", "gopuff", "getir",
];

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
        company: formatCompanyName(company),
        location: job.location?.name || "Remote",
        salary: "",
        jobType: "Full-time",
        source: "Greenhouse",
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
        company: formatCompanyName(company),
        location: job.location || job.address?.postalAddress?.addressCountry || "Remote",
        salary: "",
        jobType: job.employmentType === "FullTime" ? "Full-time" : job.employmentType || "Full-time",
        source: "Ashby",
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

// Lever has a global search — one request covers ALL companies on Lever
async function fetchLeverGlobal(keyword: string): Promise<any[]> {
  // Lever doesn't have a single global endpoint, but we can search per company fast
  // Each Lever call is: https://api.lever.co/v0/postings/{company}?mode=json&text={keyword}
  const results = await Promise.allSettled(
    LEVER_COMPANIES.map(async (company) => {
      try {
        const url = `https://api.lever.co/v0/postings/${company}?mode=json&text=${encodeURIComponent(keyword)}&limit=10`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data.map((job: any) => ({
          id: `lv_${job.id}`,
          title: job.text || "",
          company: job.categories?.team
            ? job.categories.team
            : formatCompanyName(company),
          location: job.categories?.location || job.country || "Remote",
          salary: "",
          jobType: job.categories?.commitment || "Full-time",
          source: "Lever",
          postedDate: job.createdAt
            ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : "",
          applyUrl: job.hostedUrl || `https://jobs.lever.co/${company}`,
          description: job.descriptionPlain
            ? job.descriptionPlain.substring(0, 220) + "..."
            : "Click Apply to view full job description.",
        }));
      } catch {
        return [];
      }
    })
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCompanyName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "designer").toLowerCase();
  const limit = parseInt(searchParams.get("limit") || "50");

  const [greenhouseResults, ashbyResults, leverResults] = await Promise.all([
    Promise.all(GREENHOUSE_COMPANIES.map((c) => fetchGreenhouse(c, keyword))),
    Promise.all(ASHBY_COMPANIES.map((c) => fetchAshby(c, keyword))),
    fetchLeverGlobal(keyword),
  ]);

  const allJobs = [
    ...leverResults,
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

  // Sort: most recent first (if postedDate available)
  uniqueJobs.sort((a, b) => {
    if (!a.postedDate && !b.postedDate) return 0;
    if (!a.postedDate) return 1;
    if (!b.postedDate) return -1;
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });

  return NextResponse.json({
    jobs: uniqueJobs.slice(0, limit),
    meta: {
      total: uniqueJobs.length,
      returned: Math.min(uniqueJobs.length, limit),
      sources: {
        greenhouse: greenhouseResults.flat().length,
        ashby: ashbyResults.flat().length,
        lever: leverResults.length,
      },
    },
  });
}
