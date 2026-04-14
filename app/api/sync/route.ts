import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const GREENHOUSE_COMPANIES = [
  // Original
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
  "billiontoone", "ginkgobioworks", "goatgroup", "scaleai",
  "outschool", "bitmovin", "gocardless", "instawork", "humaninterest",
  "xendit", "givecampus", "partnerstack", "reach", "flip",
  "qventus", "sirum", "akidolabs", "hive", "apollo", "sfox",
  "hackerrank", "usergems", "clear", "alchemy", "lob", "radar",
  "goldbelly", "submittable", "mattermost", "openwork", "harbor",
  "stage", "dispatch", "maven", "superset", "mantis", "clara",
  "icarus", "nucleo", "nexus", "burnt", "attune", "focalsystems",
  "twilio", "okta", "affirm", "betterment", "sofi", "oscar",
  "tripadvisor", "skyscanner", "waymo", "udemy", "sweetgreen", "stockx",
  // New additions
  "nvidia", "amd", "intel", "qualcomm", "arm",
  "snowflake", "confluent", "dbt-labs", "airbyte", "fivetran",
  "mongodb", "elastic", "cockroachdb", "planetscale", "supabase",
  "vercel", "netlify", "fly", "render", "railway",
  "auth0", "stytch", "ory", "frontegg",
  "retool", "appsmith", "budibase", "tooljet",
  "figma", "framer", "webflow", "builder",
  "linear", "height", "shortcut", "basecamp",
  "carta", "capchase", "clearco", "pipe",
  "deel", "remote", "rippling", "oyster",
  "ironclad", "docusign", "pactflow", "clio",
  "toast", "lightspeed", "square", "clover",
  "plaid", "stripe", "adyen", "checkout",
  "benchling", "labviva", "scispot", "sapio",
  "relativity", "everlaw", "logikcull", "disco",
  "zendesk", "freshdesk", "intercom", "kustomer",
  "drift", "qualified", "chili-piper", "salesloft",
  "gong", "chorus", "clari", "outreach",
  "productboard", "pendo", "amplitude", "mixpanel",
];

const ASHBY_COMPANIES = [
  // Original
  "linear", "retool", "ramp", "deel", "monzo", "superhuman", "vanta",
  "metabase", "dagster", "hightouch", "census", "pitch",
  "supabase", "neon", "upstash", "resend", "cal", "raycast",
  "highlight", "axiom", "clerk", "workos",
  "mintlify", "gitbook", "readme", "perplexity", "dust", "langchain",
  "zapier", "benchling", "clipboard", "whatnot",
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
  // New additions
  "anthropic", "mistral", "cohere", "together", "replicate",
  "modal", "baseten", "banana", "beam",
  "descript", "otter", "fireflies", "fathom",
  "notion", "craft", "anytype", "obsidian",
  "figma", "penpot", "plasmic", "framer",
  "loom", "tella", "mmhmm", "jam",
  "incident", "firehydrant", "blameless", "rootly",
  "vanta", "drata", "secureframe", "laika",
  "merge", "apideck", "vessel", "knit",
  "fleet", "fleetdm", "kandji", "mosyle",
  "plane", "huly", "cycle", "arc",
  "rows", "tally", "fillout", "paperform",
  "typeform", "jotform", "surveymonkey", "alchemer",
];

const LEVER_COMPANIES = [
  // Original
  "Academy", "cognite", "ivo", "iru", "pano",
  "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "hex", "descript", "modal", "together",
  "plaid", "chime", "marqeta", "benchling", "ginkgo", "recursion",
  "flexport", "project44", "faire", "whatnot",
  "hightouch", "airbyte", "cortex", "rootly",
  "lumos", "drata", "primer", "sardine", "replit", "codeium", "enablecomp",
  // New additions
  "figma", "notion", "airtable", "webflow", "framer",
  "stripe", "brex", "ramp", "mercury", "found",
  "attentive", "klaviyo", "yotpo", "drip", "omnisend",
  "heap", "fullstory", "logrocket", "hotjar", "mouseflow",
  "pagerduty", "opsgenie", "victorops", "signalfire",
  "harness", "codefresh", "buildkite", "circleci",
  "samsara", "motive", "lytx", "platform-science",
  "nerdio", "liquidware", "appsense", "citrix",
  "zenefits", "namely", "hibob", "personio",
  "culture-amp", "leapsome", "betterworks", "lattice",
  "productboard", "aha", "roadmunk", "craft",
  "sprinklr", "brandwatch", "meltwater", "mention",
  "kandji", "mosyle", "addigy", "jamf",
];

const SMARTRECRUITERS_COMPANIES = [
  "Filmless", "Warner-Bros-Discovery", "NBCUniversal",
  "Publicis", "WPP", "Dentsu", "BBDO", "Ogilvy", "McCann",
  "Ubisoft", "ElectronicArts", "RiotGames",
  "Zalando", "Klarna", "Revolut", "N26", "SumUp",
  "Delivery-Hero", "Wolt", "Personio",
  // New additions
  "Bosch", "Siemens", "SAP", "Deutsche-Bank",
  "IKEA", "Lidl", "Aldi", "Carrefour",
  "Philips", "Unilever", "Nestle", "Danone",
  "Spotify", "King", "Unity", "Paradox-Interactive",
  "Adyen", "Mollie", "Buckaroo", "MultiSafepay",
  "TomTom", "HERE", "HERE-Technologies",
  "Booking", "Trivago", "GetYourGuide",
  "Auto1", "Heycar", "Mobile-de",
];

const RECRUITEE_COMPANIES = [
  "gitlab", "remote", "hotjar", "typeform", "pitch",
  "contentful", "personio", "pipefy", "getstream",
  "factorial", "kenjo", "taxfix", "n26", "sumup",
  "ecosia", "blinkist", "wooga", "omio", "tier",
  "moonpay", "bitwarden",
  // New additions
  "teamwork", "basecamp", "clickup", "todoist",
  "miro", "whimsical", "lucid", "creately",
  "storyblok", "contentful", "sanity", "prismic",
  "lokalise", "phrase", "crowdin", "transifex",
  "appcues", "userpilot", "intercom", "chameleon",
];

const WORKABLE_COMPANIES = [
  "notion", "typeform", "hotjar", "workable", "intercom",
  "surfe", "learnworlds", "brafton", "filestage", "contractbook",
  "intellihr", "recruitee", "teamtailor", "greenhouse",
  "frameio", "storyblok", "bynder", "wistia", "vidyard",
  "vimeo", "behance", "99designs", "designbro",
  "hibob", "personio", "factorial", "kenjo", "bamboohr",
  "rippling", "gusto", "lattice", "15five", "cultureamp",
  "semrush", "ahrefs", "moz", "sproutsocial", "buffer",
  "hootsuite", "mailchimp", "klaviyo", "hubspot",
  "pleo", "spendesk", "moss", "payhawk", "soldo",
];

const ADZUNA_CATEGORIES = [
  "it-jobs", "engineering-jobs", "healthcare-nursing-jobs",
  "sales-jobs", "accounting-finance-jobs", "teaching-jobs",
  "legal-jobs", "creative-design-jobs", "marketing-jobs", "hr-jobs",
  "logistics-warehouse-jobs", "scientific-qa-jobs", "social-work-jobs",
  "trade-construction-jobs", "hospitality-catering-jobs", "admin-jobs",
  "customer-services-jobs", "retail-jobs", "manufacturing-jobs",
  "energy-oil-gas-jobs", "property-jobs", "consultancy-jobs",
  "graduate-jobs", "part-time-jobs", "security-jobs",
  "automotive-jobs", "media-journalism-jobs",
];

const USAJOBS_KEYWORDS = [
  "software engineer", "data analyst", "nurse", "accountant",
  "project manager", "designer", "cybersecurity", "logistics",
  "attorney", "administrative", "doctor", "physician", "electrician",
  "mechanical engineer", "civil engineer", "financial analyst",
  "human resources", "marketing", "procurement", "biologist",
  "chemist", "architect", "pilot", "security officer", "teacher",
  "social worker", "economist", "statistician", "program analyst",
  "budget analyst", "ux designer", "ui designer", "graphic designer",
  "motion designer", "product manager", "business analyst",
  "systems analyst", "network engineer", "cloud engineer",
  "devops engineer", "qa engineer", "test engineer",
  "database administrator", "it support", "help desk",
  "information security analyst", "penetration tester",
  "data scientist", "machine learning engineer", "ai engineer",
  "research scientist", "lab technician", "pharmacist",
  "pharmacy technician", "medical assistant", "radiologic technologist",
  "physical therapist", "occupational therapist", "dentist",
  "dental hygienist", "veterinarian", "paralegal", "legal assistant",
  "judge", "law clerk", "compliance officer", "auditor",
  "tax specialist", "controller", "bookkeeper", "loan officer",
  "insurance agent", "claims adjuster", "real estate agent",
  "property manager", "construction manager", "site supervisor",
  "estimator", "surveyor", "urban planner", "interior designer",
  "industrial designer", "quality assurance", "supply chain manager",
  "warehouse manager", "inventory specialist", "transportation coordinator",
  "dispatcher", "truck driver", "forklift operator",
  "maintenance technician", "hvac technician", "plumber", "welder",
  "carpenter", "assembler", "machinist", "production manager",
  "operations manager", "customer service representative",
  "call center agent", "sales representative", "account manager",
  "business development", "content writer", "copywriter", "editor",
  "translator", "interpreter", "photographer", "videographer",
  "animator", "game developer", "3d artist", "technical writer",
  "librarian", "archivist", "museum curator", "firefighter",
  "police officer", "correctional officer", "border patrol agent",
  "customs officer", "emergency dispatcher",
];

const REMOTEJOBS_CATEGORIES = [
  "programming", "design", "marketing", "sales", "writing",
  "data-science", "devops", "product-management",
  "customer-support", "finance", "human-resources", "legal",
];

// Reed keyword groups — free API returns up to 100 results per call
const REED_KEYWORDS = [
  "software engineer", "frontend developer", "backend developer",
  "full stack developer", "devops engineer", "data scientist",
  "data analyst", "machine learning engineer", "product manager",
  "ux designer", "ui designer", "graphic designer",
  "project manager", "business analyst", "marketing manager",
  "sales manager", "account manager", "customer success",
  "hr manager", "recruiter", "finance manager", "accountant",
  "nurse", "doctor", "pharmacist", "physiotherapist",
  "teacher", "lecturer", "content writer", "copywriter",
  "cybersecurity analyst", "network engineer", "cloud architect",
  "ios developer", "android developer", "react developer",
  "python developer", "java developer", "nodejs developer",
];

// Jooble keyword + location combos
const JOOBLE_QUERIES = [
  { keywords: "software engineer", location: "United States" },
  { keywords: "data scientist", location: "United States" },
  { keywords: "product manager", location: "United States" },
  { keywords: "devops engineer", location: "United States" },
  { keywords: "frontend developer", location: "United States" },
  { keywords: "backend developer", location: "United States" },
  { keywords: "ux designer", location: "United States" },
  { keywords: "marketing manager", location: "United States" },
  { keywords: "data analyst", location: "United States" },
  { keywords: "sales manager", location: "United States" },
  { keywords: "software engineer", location: "Remote" },
  { keywords: "developer", location: "Remote" },
  { keywords: "data scientist", location: "Remote" },
  { keywords: "designer", location: "Remote" },
  { keywords: "product manager", location: "Remote" },
  { keywords: "engineer", location: "United Kingdom" },
  { keywords: "developer", location: "Canada" },
  { keywords: "developer", location: "Australia" },
  { keywords: "software engineer", location: "Germany" },
  { keywords: "developer", location: "Netherlands" },
];

// Jobdata search queries
const JOBDATA_QUERIES = [
  "software engineer", "data analyst", "product manager",
  "devops engineer", "frontend developer", "backend developer",
  "data scientist", "machine learning", "ux designer",
  "marketing manager", "sales engineer", "business analyst",
  "cloud engineer", "security analyst", "mobile developer",
];

function formatSlug(slug: string): string {
  return decodeURIComponent(slug).split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function fetchJooble(query: { keywords: string; location: string }): Promise<any[]> {
  try {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) return [];

    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: query.keywords,
        location: query.location,
        page: 1,
        ResultOnPage: 20,
      }),
    });

    if (!res.ok) {
      console.error(`Jooble error: ${res.status} ${res.statusText}`);
      return [];
    }

    const text = await res.text();

    let data: any;
    try { data = JSON.parse(text); } catch {
      console.error("Jooble JSON parse error:", text.substring(0, 200));
      return [];
    }

    const jobs = data.jobs || data.results || data || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => ({
      id: `jbl_${job.id || Buffer.from(job.link || Math.random().toString()).toString("base64").slice(0, 16)}`,
      title: job.title || "",
      company: job.company || "Unknown",
      location: job.location || query.location,
      salary: job.salary || "",
      job_type: job.type || "Full-time",
      source: "Jooble",
      posted_date: job.updated ? new Date(job.updated).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.link || "",
      description: (job.snippet || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
    }));
  } catch (e: any) {
    console.error("Jooble fetch error:", e.message);
    return [];
  }
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

async function fetchWorkable(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://apply.workable.com/api/v3/accounts/${company}/jobs`,
      { signal: AbortSignal.timeout(8000), headers: { "Content-Type": "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((job: any) => ({
      id: `wk_${job.shortcode || job.id}`, title: job.title || "",
      company: job.company?.name || formatSlug(company),
      location: job.location?.location_str || job.location?.city || "Remote",
      salary: "", job_type: job.employment_type || "Full-time", source: "Workable",
      posted_date: job.published_on ? new Date(job.published_on).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.url || `https://apply.workable.com/${company}/j/${job.shortcode}`,
      description: (job.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
    }));
  } catch { return []; }
}

async function fetchAdzuna(category: string, country: string = "us"): Promise<any[]> {
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;
    if (!appId || !apiKey) return [];
    const pages = [1, 2, 3, 4, 5];
    const results = await Promise.all(pages.map(async (page) => {
      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${apiKey}&results_per_page=50&category=${category}&content-type=application/json`,
        { signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((job: any) => ({
        id: `az_${job.id}`, title: job.title || "",
        company: job.company?.display_name || "Unknown",
        location: job.location?.display_name || "Remote",
        salary: job.salary_min ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round((job.salary_max || job.salary_min) / 1000)}k` : "",
        job_type: "Full-time", source: "Adzuna",
        posted_date: job.created ? new Date(job.created).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.redirect_url || "",
        description: (job.description || "").substring(0, 3000),
      }));
    }));
    return results.flat();
  } catch { return []; }
}

async function fetchUSAJobs(keyword: string): Promise<any[]> {
  try {
    const apiKey = process.env.USAJOBS_API_KEY;
    const email = process.env.USAJOBS_EMAIL;
    if (!apiKey || !email) return [];
    const res = await fetch(
      `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(keyword)}&ResultsPerPage=50`,
      {
        signal: AbortSignal.timeout(15000),
        headers: { "Authorization-Key": apiKey, "User-Agent": email, "Host": "data.usajobs.gov" },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.SearchResult?.SearchResultItems || [];
    return items.map((item: any) => {
      const job = item.MatchedObjectDescriptor;
      return {
        id: `usa_${job.PositionID}`, title: job.PositionTitle || "",
        company: job.OrganizationName || "U.S. Government",
        location: job.PositionLocationDisplay || "USA",
        salary: job.PositionRemuneration?.[0]
          ? `$${Math.round(job.PositionRemuneration[0].MinimumRange / 1000)}k - $${Math.round(job.PositionRemuneration[0].MaximumRange / 1000)}k`
          : "",
        job_type: job.PositionSchedule?.[0]?.Name || "Full-time", source: "USAJobs",
        posted_date: job.PublicationStartDate ? new Date(job.PublicationStartDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.ApplyURI?.[0] || "",
        description: (job.UserArea?.Details?.JobSummary || "").substring(0, 3000),
      };
    });
  } catch { return []; }
}

async function fetchJobicy(): Promise<any[]> {
  try {
    const categories = ["engineering", "design", "marketing", "sales", "finance", "healthcare", "legal", "hr", "education", "other"];
    const results = await Promise.all(categories.map(async (cat) => {
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&industry=${cat}`, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "JobMatch/1.0" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.jobs || []).map((job: any) => ({
        id: `jcy_${job.id}`,
        title: job.jobTitle || "",
        company: job.companyName || "Unknown",
        location: job.jobGeo || "Remote",
        salary: job.annualSalaryMin
          ? `$${Math.round(job.annualSalaryMin / 1000)}k - $${Math.round((job.annualSalaryMax || job.annualSalaryMin) / 1000)}k`
          : "",
        job_type: job.jobType || "Full-time",
        source: "Jobicy",
        posted_date: job.pubDate ? new Date(job.pubDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.url || "",
        description: (job.jobDescription || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
      }));
    }));
    return results.flat();
  } catch { return []; }
}

async function fetchRemoteJobs(category: string): Promise<any[]> {
  try {
    const apiKey = process.env.REMOTEJOBS_API_KEY;
    if (!apiKey) return [];
    const res = await fetch(
      `https://remotejobs.org/api/v1/jobs?category=${category}&limit=50`,
      {
        signal: AbortSignal.timeout(15000),
        headers: { "Authorization": `Bearer ${apiKey}` },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((job: any) => job.id && job.title)
      .map((job: any) => ({
        id: `rjo_${job.id}`,
        title: job.title || "",
        company: job.company?.name || "Unknown",
        location: job.location || "Remote",
        salary: job.salary_text || (job.salary_min ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round((job.salary_max || job.salary_min) / 1000)}k` : ""),
        job_type: job.type || "Full-time",
        source: "RemoteJobs",
        posted_date: job.posted_at ? new Date(job.posted_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.apply_url || job.url || "",
        description: (job.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
      }));
  } catch { return []; }
}

async function fetchRemotive(): Promise<any[]> {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];
    return data.jobs.map((job: any) => ({
      id: `rem_${job.id}`, title: job.title || "",
      company: job.company_name || "", location: job.candidate_required_location || "Remote",
      salary: job.salary || "", job_type: job.job_type === "full_time" ? "Full-time" : "Contract",
      source: "Remotive",
      posted_date: job.publication_date ? new Date(job.publication_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.url || "",
      description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch { return []; }
}

async function fetchArbeitnow(): Promise<any[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];
    return data.data.map((job: any) => ({
      id: `arbeit_${job.slug}`, title: job.title || "",
      company: job.company_name || "", location: job.location || "Remote",
      salary: "", job_type: job.job_types?.[0] || "Full-time",
      source: "Arbeitnow",
      posted_date: job.created_at ? new Date(job.created_at * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.url || "",
      description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch { return []; }
}

async function fetchHimalayas(): Promise<any[]> {
  try {
    const res = await fetch("https://himalayas.app/jobs/api?limit=100", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];
    return data.jobs
      .filter((job: any) => job.id && job.title)
      .map((job: any) => ({
        id: `him_${job.id}`,
        title: job.title || "",
        company: job.companyName || job.company?.name || "",
        location: job.location || job.locationRestrictions?.[0] || "Remote",
        salary: job.salaryRange || "",
        job_type: job.jobType || job.employmentType || "Full-time",
        source: "Himalayas",
        posted_date: job.publishedAt ? new Date(job.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.applicationLink || job.applyUrl || job.url || "",
        description: (job.description || job.excerpt || "").replace(/<[^>]+>/g, " ").trim().substring(0, 3000),
      }));
  } catch { return []; }
}

// ─── NEW: Reed API ────────────────────────────────────────────────────────────
// Register at: https://www.reed.co.uk/developers
// Add to Railway: REED_API_KEY=your_key_here
async function fetchReed(keyword: string): Promise<any[]> {
  try {
    const apiKey = process.env.REED_API_KEY;
    if (!apiKey) return [];

    // Reed uses HTTP Basic Auth — API key as username, empty password
    const credentials = Buffer.from(`${apiKey}:`).toString("base64");

    const res = await fetch(
      `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(keyword)}&resultsToTake=100&minimumSalary=0`,
      {
        signal: AbortSignal.timeout(15000),
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Accept": "application/json",
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results || []).map((job: any) => ({
      id: `reed_${job.jobId}`,
      title: job.jobTitle || "",
      company: job.employerName || "Unknown",
      location: job.locationName || "UK",
      salary: job.minimumSalary
        ? `£${Math.round(job.minimumSalary / 1000)}k${job.maximumSalary ? ` - £${Math.round(job.maximumSalary / 1000)}k` : "+"}`
        : "",
      job_type: job.contractType === "Permanent" ? "Full-time" : job.contractType || "Full-time",
      source: "Reed",
      posted_date: job.date ? new Date(job.date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`,
      description: (job.jobDescription || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
    }));
  } catch { return []; }
}


// ─── NEW: Jobdata API ─────────────────────────────────────────────────────────
// Register at: https://jobdataapi.com
// Add to Railway: JOBDATA_API_KEY=your_key_here
async function fetchJobdata(query: string): Promise<any[]> {
  try {
    const apiKey = process.env.JOBDATA_API_KEY;
    if (!apiKey) return [];

    const res = await fetch(
      `https://api.jobdataapi.com/api/jobs/?title=${encodeURIComponent(query)}&max_age=30&count=50`,
      {
        signal: AbortSignal.timeout(15000),
        headers: {
          "Authorization": `Api-Key ${apiKey}`,
          "Accept": "application/json",
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const jobs = data.results || data.jobs || data || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => ({
      id: `jd_${job.id || job.job_id || Math.random().toString(36).slice(2)}`,
      title: job.title || job.job_title || "",
      company: job.company?.name || job.company_name || job.employer || "Unknown",
      location: job.location || job.city || job.country || "Remote",
      salary: job.salary || job.salary_range || "",
      job_type: job.job_type || job.employment_type || "Full-time",
      source: "Jobdata",
      posted_date: job.date_posted || job.published_at
        ? new Date(job.date_posted || job.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "",
      apply_url: job.url || job.apply_url || job.link || "",
      description: (job.description || job.snippet || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
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
  if (source === "workable" || source === "all") {
    const results = await Promise.all(WORKABLE_COMPANIES.map(fetchWorkable));
    jobs.push(...results.flat());
  }
  if (source === "adzuna" || source === "all") {
    const results = await Promise.all(ADZUNA_CATEGORIES.map(c => fetchAdzuna(c)));
    jobs.push(...results.flat());
  }
  if (source === "usajobs" || source === "all") {
    const results = await Promise.all(USAJOBS_KEYWORDS.map(fetchUSAJobs));
    jobs.push(...results.flat());
  }
  if (source === "jobicy" || source === "all") {
    const result = await fetchJobicy();
    jobs.push(...result);
  }
  if (source === "remotejobs" || source === "all") {
    const results = await Promise.all(REMOTEJOBS_CATEGORIES.map(fetchRemoteJobs));
    jobs.push(...results.flat());
  }
  if (source === "remotive" || source === "all") {
    const result = await fetchRemotive();
    jobs.push(...result);
  }
  if (source === "arbeitnow" || source === "all") {
    const result = await fetchArbeitnow();
    jobs.push(...result);
  }
  if (source === "himalayas" || source === "all") {
    const result = await fetchHimalayas();
    jobs.push(...result);
  }

  // ─── New sources ─────────────────────────────────────────────────────────────
  if (source === "reed" || source === "all") {
    const results = await Promise.all(REED_KEYWORDS.map(fetchReed));
    jobs.push(...results.flat());
  }
  if (source === "jooble" || source === "all") {
    const results = await Promise.all(JOOBLE_QUERIES.map(fetchJooble));
    jobs.push(...results.flat());
  }
  if (source === "jobdata" || source === "all") {
    const results = await Promise.all(JOBDATA_QUERIES.map(fetchJobdata));
    jobs.push(...results.flat());
  }

  const { saved, errors } = await saveToDb(jobs);
  return NextResponse.json({ success: true, source, fetched: jobs.length, saved, errors });
}
