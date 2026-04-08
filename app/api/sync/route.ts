import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const GREENHOUSE_COMPANIES = [
  // AI / ML
  "anthropic", "openai", "cohere", "scale", "adept", "inflection",
  "characterai", "perplexityai", "elevenLabs", "runway", "midjourney",
  "huggingface", "together", "modal", "replicate",
  // Big Tech adjacent
  "notion", "figma", "vercel", "stripe", "airbnb", "pinterest",
  "reddit", "shopify", "dropbox", "hubspot", "intercom", "zendesk",
  "asana", "airtable", "canva", "discord", "duolingo", "robinhood",
  "coinbase", "brex", "rippling", "databricks", "replit",
  // Fintech
  "gusto", "pilot", "moderntreasury", "lithic", "unit", "mercury",
  "ramp", "mainstreet", "capchase", "pipe", "clearco", "capixa",
  "placid", "column", "synapse", "marqeta", "adyen", "checkout",
  "affirm", "klarna", "afterpay", "sezzle", "paidy",
  // Dev tools / infra
  "segment", "amplitude", "mixpanel", "posthog", "launchdarkly",
  "sentry", "snyk", "hashicorp", "cloudflare", "fastly",
  "grafana", "datadog", "newrelic", "pagerduty", "atlassian",
  "gitlab", "circleci", "buildkite", "dbtlabs", "fivetran",
  "airbyte", "hightouch", "census", "rudderstack",
  "elastic", "confluent", "cockroachdb", "planetscale",
  "neon", "supabase", "railway", "render",
  "vercel", "netlify", "cloudflare",
  // Security
  "crowdstrike", "sentinelone", "lacework", "orca",
  "wiz", "snyk", "aquasec", "sysdig",
  // Healthcare
  "verily", "ro", "cerebral", "springhealth", "headspace", "noom",
  "omada", "virta", "livongo", "hims", "tempus", "flatiron",
  "cityblock", "bright", "devoted", "oscar",
  // E-commerce / marketplace
  "faire", "whatnot", "opendoor", "compass", "offerUp",
  "poshmark", "stockx", "goat", "thredUp",
  // SaaS / productivity
  "webflow", "coda", "clickup", "lattice", "culture-amp",
  "leapsome", "betterworks", "15five", "reflektive",
  "workramp", "lessonly", "seismic", "highspot",
  "gong", "chorus", "clari", "outreach", "salesloft",
  "apollo", "zoominfo", "clearbit",
  // Consumer
  "bumble", "peloton", "calm", "headspace", "noom",
  "duolingo", "masterclass", "coursera", "udemy", "kahoot",
  // Crypto / Web3
  "coinbase", "chainalysis", "opensea", "consensys",
  "alchemy", "figment", "anchorage",
  // Climate / sustainability
  "watershed", "arcadia", "pachama", "climateai",
  // Logistics / ops
  "flexport", "samsara", "motive", "project44", "shipbob",
  "loadsmart", "transfix", "convoy",
  // Defense / deep tech
  "palantir", "anduril", "shieldai", "joby", "archer",
  "relativityspace", "astra",
  // Media / content
  "spotify", "soundcloud", "vimeo", "loom",
  "substack", "beehiiv", "ghost",
  // Food / delivery
  "doordashusa", "instacart", "gopuff",
  // Real estate / proptech
  "opendoor", "compass", "orchard", "knock", "flyhomes",
  // HR tech
  "rippling", "gusto", "lattice", "hibob", "personio",
  "workday", "greenhouse", "lever",
  // Other notable
  "lyft", "cruise", "waymo", "zoox",
  "figma", "miro", "notion", "coda",
  "brex", "ramp", "expensify",
];

// Remove duplicates
const GREENHOUSE_COMPANIES_UNIQUE = [...new Set(GREENHOUSE_COMPANIES)];

const ASHBY_COMPANIES = [
  // Dev tools / infra
  "linear", "retool", "raycast", "fig", "warp",
  "supabase", "neon", "upstash", "planetscale", "turso",
  "resend", "cal", "trigger", "inngest", "zuplo",
  "highlight", "baselime", "axiom", "groundcover",
  "mintlify", "gitbook", "readme",
  // Auth / security
  "clerk", "stytch", "workos", "kinde", "descope",
  "vanta", "drata", "secureframe", "scytale",
  // AI / ML
  "perplexity", "dust", "langchain", "weights-biases",
  "comet", "neptune", "labelbox", "scale",
  "12labs", "glean", "moveworks", "writer",
  // Fintech
  "ramp", "deel", "mercury", "pilot", "brex",
  "monzo", "revolut", "wise", "n26",
  "stripe", "adyen", "checkout", "primer",
  // Productivity / collab
  "superhuman", "pitch", "loom", "miro",
  "coda", "notion", "craft", "obsidian",
  // Data
  "metabase", "dagster", "hightouch", "census",
  "airbyte", "fivetran", "dbtlabs",
  // HR / people
  "leapsome", "lattice", "culture-amp", "betterworks",
  // Other
  "moonpay", "opensea", "alchemy",
  "vercel", "netlify", "railway",
  "replit", "codeium", "cursor",
  "farcaster", "lens", "privy",
  "thirdweb", "alchemy", "quicknode",
];

const ASHBY_COMPANIES_UNIQUE = [...new Set(ASHBY_COMPANIES)];

const LEVER_COMPANIES = [
  "Academy", "cognite", "ivo", "iru", "pano",
  "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "hex", "descript", "modal", "together",
  "plaid", "chime", "marqeta", "benchling", "ginkgo", "recursion",
  "flexport", "project44", "faire", "whatnot",
  "hightouch", "airbyte", "cortex", "rootly",
  "lumos", "drata", "primer", "sardine", "replit", "codeium", "enablecomp",
  // Additional verified Lever companies
  "figma", "notion", "airtable", "lattice",
  "duolingo", "coursera", "masterclass",
  "stripe", "brex", "ramp",
  "doordash", "instacart", "gopuff",
  "coinbase", "opensea", "alchemy",
  "cloudflare", "datadog", "grafana",
  "hubspot", "intercom", "zendesk",
];

const LEVER_COMPANIES_UNIQUE = [...new Set(LEVER_COMPANIES)];

const SMARTRECRUITERS_COMPANIES = [
  // Verified working slugs
  "Filmless",
  // Media / entertainment
  "WarnerBrosDiscovery", "NBCUniversal", "Paramount",
  "SonyPictures", "AMCNetworks",
  // Advertising / marketing
  "Publicis", "WPP", "Dentsu", "BBDO", "Ogilvy", "McCann",
  "Havas", "IPG", "Grey",
  // Gaming
  "Ubisoft", "ElectronicArts", "RiotGames", "EpicGames",
  "Activision", "2K", "Scopely",
  // Retail / e-commerce
  "Zalando", "ASOS", "Farfetch",
  // Fintech EU
  "Klarna", "Revolut", "N26", "SumUp", "Mollie",
  // Food delivery EU
  "DeliveryHero", "Wolt", "Glovo",
  // Tech EU
  "Delivery-Hero", "Personio", "Celonis", "Contentful",
];

function formatSlug(slug: string): string {
  return decodeURIComponent(slug).split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function fetchGreenhouse(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
      { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];
    return data.jobs.map((job: any) => ({
      id: `gh_${job.id}`, title: job.title || "",
      company: formatSlug(company), location: job.location?.name || "Remote",
      salary: "", job_type: "Full-time", source: "Greenhouse",
      posted_date: job.updated_at ? new Date(job.updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.absolute_url || `https://boards.greenhouse.io/${company}`,
      description: "Click Apply to view full job description.",
    }));
  } catch { return []; }
}

async function fetchAshby(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}`,
      { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];
    return data.jobs.map((job: any) => ({
      id: `ash_${job.id}`, title: job.title || "",
      company: formatSlug(company), location: job.location || "Remote",
      salary: "", job_type: job.employmentType === "FullTime" ? "Full-time" : job.employmentType || "Full-time",
      source: "Ashby",
      posted_date: job.publishedAt ? new Date(job.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.applyUrl || job.jobUrl || `https://jobs.ashbyhq.com/${company}`,
      description: (job.descriptionPlain || "").substring(0, 500),
    }));
  } catch { return []; }
}

async function fetchLever(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json&limit=100`,
      { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((job: any) => ({
      id: `lv_${job.id}`, title: job.text || "",
      company: formatSlug(company), location: job.categories?.location || "Remote",
      salary: "", job_type: job.categories?.commitment || "Full-time", source: "Lever",
      posted_date: job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.hostedUrl || `https://jobs.lever.co/${company}`,
      description: (job.descriptionPlain || "").substring(0, 500),
    }));
  } catch { return []; }
}

async function fetchSmartRecruiters(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100`,
      { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.content || []).map((job: any) => ({
      id: `sr_${job.uuid || job.id}`, title: job.name || "",
      company: job.company?.name || formatSlug(company),
      location: [job.location?.city, job.location?.country].filter(Boolean).join(", ") || "Remote",
      salary: "", job_type: job.typeOfEmployment?.label || "Full-time", source: "SmartRecruiters",
      posted_date: job.releasedDate ? new Date(job.releasedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
      description: "Click Apply to view full job description.",
    }));
  } catch { return []; }
}

async function saveToDb(jobs: any[]): Promise<{ saved: number; errors: number }> {
  const supabase = getSupabaseAdmin();
  let saved = 0, errors = 0;
  const BATCH = 100;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const { error } = await supabase.from("jobs").upsert(jobs.slice(i, i + BATCH), { onConflict: "id" });
    if (error) { console.error(error); errors++; } else saved += jobs.slice(i, i + BATCH).length;
  }
  return { saved, errors };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || "all";

  let jobs: any[] = [];

  if (source === "greenhouse" || source === "all") {
    const results = await Promise.all(GREENHOUSE_COMPANIES_UNIQUE.map(fetchGreenhouse));
    jobs.push(...results.flat());
  }
  if (source === "ashby" || source === "all") {
    const results = await Promise.all(ASHBY_COMPANIES_UNIQUE.map(fetchAshby));
    jobs.push(...results.flat());
  }
  if (source === "lever" || source === "all") {
    const results = await Promise.all(LEVER_COMPANIES_UNIQUE.map(fetchLever));
    jobs.push(...results.flat());
  }
  if (source === "smartrecruiters" || source === "all") {
    const results = await Promise.all(SMARTRECRUITERS_COMPANIES.map(fetchSmartRecruiters));
    jobs.push(...results.flat());
  }

  const { saved, errors } = await saveToDb(jobs);

  return NextResponse.json({
    success: true,
    source,
    fetched: jobs.length,
    saved,
    errors,
  });
}
