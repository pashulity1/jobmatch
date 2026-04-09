import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const GREENHOUSE_COMPANIES = [
  // Original verified
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
  "faire", "opendoor", "compass", "webflow", "coda", "clickup", "lattice",
  "bumble", "peloton", "calm", "chainalysis", "opensea",
  "flexport", "samsara", "palantir", "anduril",
  "masterclass", "coursera", "doordashusa", "lyft",
  "twitch", "clever", "algolia", "instacart", "weave",
  "checkr", "oklo", "gitlab", "truebill", "bird",
  "paystack", "odeko", "momentus", "groww", "smartasset", "fivetran",
  // New from YC script v2 — all verified!
  "billiontoone", "ginkgobioworks", "goatgroup", "scaleai",
  "outschool", "bitmovin", "gocardless", "instawork", "humaninterest",
  "xendit", "givecampus", "partnerstack", "reach", "flip",
  "qventus", "sirum", "akidolabs", "hive", "apollo", "sfox",
  "hackerrank", "usergems", "clear", "alchemy", "lob", "radar",
  "goldbelly", "submittable", "mattermost", "openwork", "harbor",
  "stage", "dispatch", "maven", "superset", "mantis", "clara",
  "icarus", "nucleo", "nexus", "burnt", "attune", "focalsystems",
];

const ASHBY_COMPANIES = [
  // Original verified
  "linear", "retool", "ramp", "deel", "monzo", "superhuman", "vanta",
  "metabase", "dagster", "hightouch", "census", "pitch",
  "supabase", "neon", "upstash", "resend", "cal", "raycast",
  "highlight", "axiom", "clerk", "workos",
  "mintlify", "gitbook", "readme", "perplexity", "dust", "langchain",
  "zapier", "benchling", "clipboard", "whatnot",
  // New from YC script v2 — all verified!
  "newfront", "mux", "deepgram", "eightsleep", "verge-genomics",
  "assembly", "meadow", "bankjoy", "tempo", "tenjin", "permutive",
  "ycombinator", "snapdocs", "backpack", "cambly", "influxdata",
  "circuithub", "padlet", "healthsherpa", "sazabi", "polymath",
  "traverse", "pax-historia", "cascade", "asimov", "moss",
  "diligencesquared", "primer", "sf-tensor", "hyperspell", "uplane",
  "nox-metals", "fleetline", "fernstone", "reacher", "kernel",
  "opennote", "idler", "april", "finto", "flai", "solva",
  "bootloop", "doe", "interface", "fulcrum", "lark", "agentmail",
  "truthsystems", "mangodesk", "sieve", "airweave", "eloquentai",
  "sygaldry-technologies", "lucis", "sim", "claim-health", "auctor",
];

const LEVER_COMPANIES = [
  "Academy", "cognite", "ivo", "iru", "pano",
  "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "hex", "descript", "modal", "together",
  "plaid", "chime", "marqeta", "benchling", "ginkgo", "recursion",
  "flexport", "project44", "faire", "whatnot",
  "hightouch", "airbyte", "cortex", "rootly",
  "lumos", "drata", "primer", "sardine", "replit", "codeium", "enablecomp",
];

const SMARTRECRUITERS_COMPANIES = [
  "Filmless", "Warner-Bros-Discovery", "NBCUniversal",
  "Publicis", "WPP", "Dentsu", "BBDO", "Ogilvy", "McCann",
  "Ubisoft", "ElectronicArts", "RiotGames",
  "Zalando", "Klarna", "Revolut", "N26", "SumUp",
  "Delivery-Hero", "Wolt", "Personio",
];

const RECRUITEE_COMPANIES = [
  "gitlab", "remote", "hotjar", "typeform", "pitch",
  "contentful", "personio", "pipefy", "getstream",
  "factorial", "kenjo", "taxfix", "n26", "sumup",
  "ecosia", "blinkist", "wooga", "omio", "tier",
  "moonpay", "bitwarden",
];

function formatSlug(slug: string): string {
  return decodeURIComponent(slug).split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function fetchGreenhouse(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
      { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs) return [];
    return data.jobs.map((job: any) => {
      const rawContent = (job.content || "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
      const cleanDesc = rawContent
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&nbsp;/gi, " ")
        .replace(/&[a-z0-9#]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 1000);
      return {
        id: `gh_${job.id}`, title: job.title || "",
        company: formatSlug(company), location: job.location?.name || "Remote",
        salary: "", job_type: "Full-time", source: "Greenhouse",
        posted_date: job.updated_at ? new Date(job.updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.absolute_url || `https://boards.greenhouse.io/${company}`,
        description: cleanDesc || "Click Apply to view full job description.",
      };
    });
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

async function fetchRecruitee(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://${company}.recruitee.com/api/offers/`,
      { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.offers || []).map((job: any) => ({
      id: `rc_${job.id}`, title: job.title || "",
      company: job.company_name || formatSlug(company),
      location: job.city ? `${job.city}${job.country_code ? ", " + job.country_code : ""}` : "Remote",
      salary: "", job_type: "Full-time", source: "Recruitee",
      posted_date: job.created_at ? new Date(job.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.careers_url || `https://${company}.recruitee.com/o/${job.slug}`,
      description: (job.description || "").replace(/<[^>]+>/g, "").substring(0, 500),
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
    const results = await Promise.all(GREENHOUSE_COMPANIES.map(fetchGreenhouse));
    jobs.push(...results.flat());
  }
  if (source === "ashby" || source === "all") {
    const results = await Promise.all(ASHBY_COMPANIES.map(fetchAshby));
    jobs.push(...results.flat());
  }
  if (source === "lever" || source === "all") {
    const results = await Promise.all(LEVER_COMPANIES.map(fetchLever));
    jobs.push(...results.flat());
  }
  if (source === "smartrecruiters" || source === "all") {
    const results = await Promise.all(SMARTRECRUITERS_COMPANIES.map(fetchSmartRecruiters));
    jobs.push(...results.flat());
  }
  if (source === "recruitee" || source === "all") {
    const results = await Promise.all(RECRUITEE_COMPANIES.map(fetchRecruitee));
    jobs.push(...results.flat());
  }

  const { saved, errors } = await saveToDb(jobs);
  return NextResponse.json({ success: true, source, fetched: jobs.length, saved, errors });
}
