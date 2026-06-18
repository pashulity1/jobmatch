import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const maxDuration = 300;


const GREENHOUSE_COMPANIES = [
  "buzzfeed", "medium", "coinbase", "airbnb", "lyft", "robinhood",
  "pinterest", "anthropic", "roblox", "labelbox", "vercel", "figma",
  "snorkelai", "planetscale", "remote", "lattice", "netlify", "brex",
  "stripe", "gusto", "mercury", "motive", "fivetran", "mixpanel",
  "databricks", "amplitude", "project44", "samsara", "flexport", "duolingo",
  "cerebral", "opendoor", "coursera", "roofstock", "masterclass", "oscar",
  "shield", "oklo", "stockx", "instacart", "kodiak", "outschool", "spin",
  "bird", "nuro", "waymo", "faire", "descript", "descope", "momentus",
  "relativity", "astranis", "axiom", "warp", "storyblok", "pagerduty",
  "newrelic", "make", "contentful", "datadog", "attentive", "pubnub",
  "algolia", "klaviyo", "postscript", "sendbird", "bandwidth", "twilio",
  "vonage", "recharge", "launchdarkly", "yugabyte", "okta", "elastic",
  "mongodb", "discord", "dropbox", "nubank", "linkedin", "cloudflare",
  "adyen", "fastly", "netskope", "zscaler", "greenhouse", "gemini",
  "alpaca", "chime", "zwift", "udemy", "peloton", "found", "oura",
  "thoropass", "veracyte", "calm", "kalshi", "bitgo", "opentable",
  "nextdoor", "zuora", "checkr", "clear", "cleo", "indigo", "reltio",
  "toast", "affirm", "ww", "qualtrics", "touchbistro", "postman",
  "catawiki", "phonepe", "monzo", "revel", "wolt", "typeform", "n26",
  "dataiku", "webflow", "squarespace", "doctolib", "talkspace", "groupon",
  "kayak", "justworks", "classpass", "gympass", "mindbody", "sezzle",
  "alma", "oportun", "headway", "archer", "comet", "otter", "splice",
  "ghost", "zoominfo", "apollo", "crisp", "customerio", "intercom",
  "knock", "recall", "dscout", "pendo", "airtable", "aha", "smartsheet",
  "reddit", "affinity", "asana", "melio", "amwell", "betterhelp",
  "sweetgreen", "alt", "jetbrains", "gitlab", "veracode", "vim", "circleci",
  "lookout", "jfrog", "beyondtrust", "nexus", "sisense", "collibra",
  "superset", "stackblitz", "clutch", "ark", "hackerrank", "realm",
  "gocardless", "singlestore", "zencoder", "twitch", "mattermost", "clever",
  "smartasset", "submittable", "radar", "goldbelly", "lob", "abacus",
  "weave", "usergems", "cheddar", "hive", "qventus", "sirum", "tempo",
  "seed", "flip", "reach", "givecampus", "fetch", "xendit", "instawork",
  "bitmovin", "truebill", "paystack", "apolloio", "billiontoone", "pursuit",
  "legalist", "pulse", "firsthand", "tetra", "aon3d", "nanonets", "upkeep",
  "aclu", "roofr", "tesseract", "assemblyai", "squad", "pelago", "groww",
  "observeai", "swayable", "veriff", "snackpass", "papa", "prodigal",
  "grin", "enveritas", "nabis", "caribou", "cocoon", "pronto", "glide",
  "odeko", "prolific", "embrace", "hightouch", "recidiviz", "laika",
  "pulley", "ophelia", "pantheon", "haven", "cortex", "able", "send",
  "syncro", "powerx", "momence", "mesh", "carbonchain", "albedo", "noble",
  "seer", "camp", "ziina", "gigs", "galaxy", "regent", "prospa",
  "marqvision", "journey", "dots", "coast", "baubap", "luminate", "beam",
  "agency", "attain", "spade", "raven", "shelf", "axle", "reflex", "alloy",
  "extend", "edge", "diligent", "flex", "newton", "momentic", "paradigm",
  "parallel", "hazel", "plume", "sensei", "starcloud", "quetzal",
  "symphony", "sunset", "osmosis", "strike", "retrofit", "candid", "attune",
  "zero", "burnt", "iris", "nucleo", "icarus", "resonate", "maven",
];

const ASHBY_COMPANIES = [
  "cohere", "substack", "character", "mistral", "openai", "anyscale",
  "modal", "linear", "notion", "supabase", "railway", "neon", "render",
  "ramp", "plaid", "deel", "vanta", "drata", "orca", "poshmark", "whatnot",
  "clerk", "resend", "stytch", "workos", "benchling", "insitro", "gamma",
  "helion", "axiom", "inngest", "posthog", "zapier", "readme", "gitbook",
  "mintlify", "windmill", "sanity", "warp", "n8n", "cursor", "stream",
  "recharge", "docker", "statsig", "confluent", "redis", "replit",
  "airbyte", "sentry", "incident", "ashby", "strava", "found", "polymarket",
  "oyster", "abound", "kalshi", "whoop", "illumio", "nutanix", "dave",
  "persona", "affirm", "mollie", "pleo", "deliveroo", "roam", "mural",
  "paradox", "hopper", "alan", "capsule", "kayak", "tonal", "leapsome",
  "runway", "pika", "perplexity", "elevenlabs", "fathom", "ghost",
  "granola", "contra", "lemlist", "relay", "crisp", "plain", "amplify",
  "plane", "clickup", "rewind", "recall", "mem", "fullstory", "paddle",
  "dovetail", "sprig", "causal", "xero", "handshake", "httpie", "anomalo",
  "atlan", "weaviate", "pinecone", "langchain", "circuithub", "deepgram",
  "llamaindex", "rescale", "tilt", "clerky", "sift", "tremendous", "close",
  "healthsherpa", "padlet", "radar", "influxdata", "cambly", "snapdocs",
  "weave", "backpack", "permutive", "alchemy", "tenjin", "bankjoy", "tempo",
  "cinder", "meadow", "new-story", "shasqi", "assembly", "verge-genomics",
  "reach", "mux", "castle", "gecko-robotics", "boom", "silver", "vetcove",
  "pursuit", "miso", "classdojo", "speak", "rezi", "pearl", "scribe",
  "armory", "pulse", "clipboard", "firsthand", "mednet", "breaker",
  "upcodes", "prelim", "newfront", "headstart", "spellbrush", "promise",
  "squad", "skip", "opensea", "ben", "snackpass", "revenuecat", "titan",
  "duffel", "corvus-robotics", "mutiny", "skydropx", "overview", "parker",
  "golinks", "middesk", "hatch", "switchboard", "doppler", "caribou",
  "fuse", "glide", "atlas", "verto", "dex", "playground", "prompt",
  "sable", "trm-labs", "compound", "tandem", "rutter", "hightouch",
  "freshpaint", "flux", "curri", "deepnote", "vorticity", "motion",
  "paragon", "accord", "phonic", "odin", "ladder", "ditto", "handoff",
  "glimpse", "fig", "benepass", "savvy", "ello", "vori", "multiverse",
  "photoroom", "junction", "upflow", "tajir", "thndr", "stable", "belvo",
  "zip", "atob", "roboflow", "lightdash", "luminai", "novel", "omni",
  "blissway", "stacker", "yotta", "atomic", "notabene", "hotplate",
  "flint", "kingdom", "farel", "formal", "arketa", "ready", "taktile",
  "finch", "fieldguide", "atrato", "authzed", "abacum", "humaans",
  "signoz", "spruceid", "finary", "encord", "axle-health", "firstbaseio",
  "faction", "camber", "vapi", "popl", "anima", "enode", "hudu", "liveflow",
  "homebase", "quicknode", "topline-pro", "simplify", "phoenix", "fable",
  "flutterflow", "infracost", "ziina", "svix", "regent", "blink",
  "shepherd", "h3x-technologies", "slope", "pipekit", "odys-aviation",
  "replo", "level", "confido", "parallel-bio", "double", "lago", "tavus",
  "hypercore", "kodex", "bree", "onebrief", "lemfi", "formance",
  "oneschema", "aleph", "adaptyv", "meticulous", "mach9", "float", "pylon",
  "malga", "birdie", "aviator", "exa", "charge-robotics", "toku", "nash",
  "stepful", "turion-space", "sieve", "agave", "invert", "aspora", "happl",
  "beam", "bifrost", "lancedb", "sphere", "permitflow", "skylink", "posh",
  "complete", "voize", "fleek", "govdash", "eventual", "two-dots",
  "mercator", "julius", "tailor", "craze", "novig", "boostly", "juicebox",
  "stellar", "blee", "unify", "pivot", "thera", "bitstack", "quindar",
  "ekho", "kombo", "aiprise", "metriport", "aurelian", "firecrawl",
  "oneleet", "cambio", "knowtex", "infisical", "avoca", "finvest",
  "rollstack", "concourse", "nango", "numeral", "latent", "salient",
  "tennr", "pirros", "cosine", "coperniq", "vooma", "goveagle", "extend",
  "relace", "langfuse", "bluedot", "inkeep", "echo", "honeydew", "vitalize",
  "loula", "invopop", "keep", "conduit", "finni-health", "vellum", "vector",
  "escape", "artie", "automat", "hockeystack", "litellm", "twenty",
  "hyperbound", "casca", "airgoods", "subsets", "campfire", "fleetworks",
  "terminal", "outset", "fortuna-health", "continue", "glade", "safetykit",
  "sola", "sweep", "pure", "langdock", "foundation", "healthtech-1", "onyx",
  "gumloop", "greptile", "reducto", "garage", "tuesday-lab", "momentic",
  "greenboard", "arini", "furtherai", "paradigm", "artisan", "pointone",
  "parallel", "clarion", "centralize", "astro-mechanica", "offdeal", "hazel",
  "focal", "raindrop", "circleback", "retell-ai", "aqua-voice", "datacurve",
  "polar", "forge", "blacksmith", "ultra", "doublezero", "mem0",
  "spherecast", "codes-health", "phonely", "claimsorted", "kastle",
  "substrate", "modus", "conveo", "vibe", "anara", "saturn", "zeit-ai",
  "david-ai", "simple-ai", "usul", "pharos", "telli", "conductor", "ctgt",
  "archil", "sphinx", "sunset", "capy", "innate", "ryvn", "apolink",
  "flowtel", "bild-ai", "mosaic", "salespatriot", "hud", "solidroad",
  "infinite", "afterquery", "cedar", "butter", "mercura", "chestnut",
  "blaxel", "ambral", "minerva", "auctor", "claim-health", "sim", "lucis",
  "zero", "sygaldry-technologies", "lapel", "prox", "airweave",
  "truthsystems", "mangodesk", "agentmail", "lark", "interface", "doe",
  "flai", "bootloop", "fulcrum", "april", "solva", "finto", "fernstone",
  "idler", "opennote", "reacher", "kernel", "fleetline", "nox-metals",
  "hyperspell", "uplane", "sf-tensor", "primer", "diligencesquared", "moss",
  "lance", "corvera", "pax-historia", "stilta", "traverse", "polymath",
  "maven",
];


const LEVER_COMPANIES = [
  "binance", "secureframe", "mistral", "arcadia", "fundrise", "ro",
  "palantir", "veeva", "gopuff", "spotify", "quartzy", "plivo",
  "caremessage", "hive", "nimblerx", "mashgin", "tesorio", "picktrace",
  "tovala", "copia", "superside", "netomi", "thunkable", "emburse",
  "hush", "meesho", "snappr", "skyways", "vergesense", "pyka",
  "evry-health", "plexus", "super", "captivateiq", "duffel", "mytos",
  "fintual", "culdesac", "zippi", "glide", "shiru", "revel", "fampay",
  "teleo", "porter", "eternal", "handoff", "h1", "nimbus", "postera",
  "synapticure", "doola", "skio", "finch", "verifiable", "smartcuts",
  "gridware", "marcopolo", "tractian", "marqvision", "bloom", "epsilon3",
  "tag", "jupe", "mable", "aleph", "bolster", "toku", "proper",
  "fleetzero", "tendo", "maverickx", "unify", "layup", "alloy", "suger",
  "prosper", "newton", "plume", "distro", "unusual", "revi", "blue",
  "articulate",
];

const BAMBOOHR_COMPANIES: string[] = [];

const SMARTRECRUITERS_COMPANIES = [
  "uber", "freshworks", "newrelic", "bigcommerce", "hootsuite", "docusign",
  "netskope", "workato", "palantir", "servicenow", "lyra", "jitterbit",
  "beyondtrust", "hibob", "smartrecruiters", "continental", "lvmh",
  "rolandberger", "hackerrank", "clerky", "kamcord", "zenefits", "42",
  "bellabeat", "tempo", "wayup", "lumi", "voiq", "onechronos", "innov8",
  "alemhealth", "cocusocial", "zyper", "excepgen", "wren", "skill-lync",
  "vouch", "actiondesk", "lokal", "hiresweet", "pahamify", "electroneek",
  "yassir", "bukuwarung", "statiq", "modernloop", "queenly", "dashlabsai",
  "kodo", "flextock", "unschool", "manara", "navattic", "vendease",
  "bloom", "mable", "homeroom", "agency", "shaped", "finku", "juicebox",
  "slauthio", "kombo", "trigo", "movley", "mosaic",
];

const RECRUITEE_COMPANIES = [
  "personio", "mangopay", "adikteev", "dance", "unu", "accenture",
  "bamboohr", "clever", "grid", "arcus", "assembly", "snapmagic",
  "reach", "soundboks", "poppy", "expo", "nimble", "ixora", "hiresweet",
  "bego", "jeeves", "atomic", "axiomai", "bloom", "bolster", "star",
  "escape", "upfront", "serra", "coba", "basalt", "parallel", "spark",
  "terra", "surge", "ember", "friday", "zero", "fulcrum", "everest",
  "mayflower", "sparkles",
];

const PERSONIO_COMPANIES = [
  "personio", "sandbox", "treatwell", "linear", "pitch", "june", "neon",
  "payhawk", "arcus", "alchemy", "bright", "resolve", "teleport", "joy",
  "feather", "station", "atlas", "legacy", "tandem", "flow", "motion",
  "powerus", "bik", "atmos", "phoenix", "fable", "machine26", "kaya",
  "dot", "dots", "haddock", "gauss", "cotera", "voize", "argo", "pina",
  "julius", "blitz", "drip", "cosine", "fabius", "invitris", "linc",
  "contour", "craftwork", "langdock", "sonia", "open", "omnidock", "keye",
  "pinch", "cactus", "nucleo", "everest", "clicks", "mayflower",
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
  "adyen", "travelperk", "attio", "tinybird",
  "puulse-marketing", "clarity-ai", "cognigy",
  "skroutz", "beat", "taxfix", "sumup-2", "n26",
  "perkbox", "learnupon", "360learning", "doctolib",
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


function formatSlug(slug: string): string {
  return decodeURIComponent(slug).split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function fetchGreenhouse(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
      { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((job: any) => ({
      id: `gh_${job.id}`,
      title: job.title || "",
      company: formatSlug(company),
      location: job.location?.name || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Greenhouse",
      posted_date: job.updated_at ? new Date(job.updated_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.absolute_url || `https://boards.greenhouse.io/${company}`,
      description: (job.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
    }));
  } catch { return []; }
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

async function fetchBambooHR(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://${company}.bamboohr.com/jobs/embed2.php`,
      { signal: AbortSignal.timeout(8000), headers: { "Accept": "text/html" } });
    if (!res.ok) return [];
    const html = await res.text();
    const jobs: any[] = [];
    const rowRegex = /<li[^>]*class="[^"]*BambooHR-ATS-Department-Item[^"]*"[\s\S]*?<\/li>/g;
    let deptBlock: RegExpExecArray | null;
    while ((deptBlock = rowRegex.exec(html)) !== null) {
      const block = deptBlock[0];
      const deptMatch = block.match(/<span[^>]*class="[^"]*BambooHR-ATS-Department-Item-departmentName[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      const dept = deptMatch ? deptMatch[1].replace(/<[^>]+>/g, "").trim() : "";
      const jobRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/g;
      let jobMatch: RegExpExecArray | null;
      while ((jobMatch = jobRegex.exec(block)) !== null) {
        const href = jobMatch[1];
        const title = jobMatch[2].replace(/<[^>]+>/g, "").trim();
        const location = jobMatch[3].replace(/<[^>]+>/g, "").trim();
        const idMatch = href.match(/\/(\d+)\//);
        const jobId = idMatch ? idMatch[1] : href.split("/").filter(Boolean).pop() || "";
        if (!title) continue;
        jobs.push({
          id: `bhr_${company}_${jobId}`,
          title,
          company: formatSlug(company),
          location: location || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "BambooHR",
          posted_date: "",
          apply_url: `https://${company}.bamboohr.com/jobs/${jobId}`,
          description: dept,
        });
      }
    }
    return jobs;
  } catch { return []; }
}

async function fetchPersonio(company: string): Promise<any[]> {
  try {
    const res = await fetch(`https://${company}.jobs.personio.de/xml?language=en`,
      { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const positions = xml.match(/<position>([\s\S]*?)<\/position>/g) || [];
    return positions.map((block: string) => {
      const get = (tag: string) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)); return m ? m[1].replace(/<[^>]+>/g, "").trim() : ""; };
      const id = get("id");
      const city = block.match(/<office>[\s\S]*?<city>([\s\S]*?)<\/city>/)?.[1]?.trim() || "";
      const country = block.match(/<office>[\s\S]*?<country>([\s\S]*?)<\/country>/)?.[1]?.trim() || "";
      return {
        id: `ps_${id}`,
        title: get("name"),
        company: formatSlug(company),
        location: [city, country].filter(Boolean).join(", ") || "Remote",
        salary: "",
        job_type: get("employmentType") || "Full-time",
        source: "Personio",
        posted_date: get("createdAt") ? new Date(get("createdAt")).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: `https://${company}.jobs.personio.de/job/${id}`,
        description: get("recruitingCategory"),
      };
    });
  } catch { return []; }
}

async function fetchWorkable(company: string): Promise<any[]> {
  try {
    // Public widget API — no auth required (v3 requires auth, v1/widget is public)
    const res = await fetch(`https://apply.workable.com/api/v1/widget/accounts/${company}`,
      { signal: AbortSignal.timeout(8000), headers: { "Accept": "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const companyName = data.name || formatSlug(company);
    return (data.jobs || []).map((job: any) => {
      const location = [job.city, job.country].filter(Boolean).join(", ") || (job.telecommuting ? "Remote" : "");
      return {
        id: `wk_${job.shortcode}`, title: job.title || "",
        company: companyName,
        location: location || "Remote",
        salary: "", job_type: job.employment_type || "Full-time", source: "Workable",
        posted_date: job.published_on ? new Date(job.published_on).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.url || `https://apply.workable.com/${company}/j/${job.shortcode}`,
        description: job.department || "",
      };
    });
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

const JOBICY_INDUSTRIES = [
  "dev", "engineering", "design-multimedia", "web-app-design",
  "data-science", "marketing", "seo", "smm", "management",
  "hr", "accounting-finance", "legal", "copywriting",
  "admin-support", "technical-support", "business", "seller",
];

function mapJobicyJob(job: any): any {
  return {
    id: `jobicy_${job.id}`,
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
  };
}

async function fetchJobicy(): Promise<any[]> {
  try {
    const allJobs: any[] = [];

    // Base call — no filter, returns up to 100 general jobs
    const base = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=100`, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "JobMatch/1.0" },
    });
    if (base.ok) {
      const data = await base.json();
      allJobs.push(...(data.jobs || []).map(mapJobicyJob));
    }

    // Per-industry calls with a small delay to avoid rate limiting
    for (const industry of JOBICY_INDUSTRIES) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&industry=${industry}`, {
          signal: AbortSignal.timeout(15000),
          headers: { "User-Agent": "JobMatch/1.0" },
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.jobs) allJobs.push(...data.jobs.map(mapJobicyJob));
      } catch { /* skip failed industry */ }
    }

    console.log(`Jobicy: fetched ${allJobs.length} jobs across ${JOBICY_INDUSTRIES.length + 1} calls`);
    return allJobs;
  } catch (e: any) {
    console.error("Jobicy error:", e.message);
    return [];
  }
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
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];
    const jobs = data.jobs.map((job: any) => ({
      id: `remotive_${job.id}`,
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      salary: job.salary || "",
      job_type: job.job_type === "full_time" ? "Full-time" : job.job_type === "contract" ? "Contract" : "Full-time",
      source: "Remotive",
      posted_date: job.publication_date ? new Date(job.publication_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: job.url || "",
      description: (job.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
    }));
    console.log(`Remotive: fetched ${jobs.length} jobs`);
    return jobs;
  } catch (e: any) {
    console.error("Remotive error:", e.message);
    return [];
  }
}

async function fetchArbeitnow(): Promise<any[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];
    const jobs = data.data.map((job: any) => {
      const baseLocation = job.location || "";
      const location = job.remote && !baseLocation.toLowerCase().includes("remote")
        ? baseLocation ? `${baseLocation}, Remote` : "Remote"
        : baseLocation || "Remote";
      return {
        id: `arbeitnow_${job.slug}`,
        title: job.title || "",
        company: job.company_name || "",
        location,
        salary: "",
        job_type: job.job_types?.[0] || "Full-time",
        source: "Arbeitnow",
        posted_date: job.created_at ? new Date(job.created_at * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.url || "",
        description: (job.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
      };
    });
    console.log(`Arbeitnow: fetched ${jobs.length} jobs`);
    return jobs;
  } catch (e: any) {
    console.error("Arbeitnow error:", e.message);
    return [];
  }
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

    const now = new Date();
    return (data.results || []).map((job: any) => {
      // Try posting date fields in priority order; reject future dates (those are expirationDate)
      let postedDate = "";
      for (const raw of [job.datePosted, job.publishedDate, job.date]) {
        if (!raw) continue;
        const msMatch = String(raw).match(/\/Date\((\d+)/);
        const d = msMatch ? new Date(parseInt(msMatch[1])) : new Date(raw);
        if (!isNaN(d.getTime()) && d <= now) {
          postedDate = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          break;
        }
      }

      // Salary: skip hourly/daily rates (max < 5000) and zero values
      let salary = "";
      const sMin = job.minimumSalary || 0;
      const sMax = job.maximumSalary || 0;
      if (sMax >= 5000 || sMin >= 5000) {
        const rMin = Math.round(sMin / 1000);
        const rMax = Math.round(sMax / 1000);
        salary = rMax > rMin ? `£${rMin}k - £${rMax}k` : `£${rMin || rMax}k`;
      }

      return {
        id: `reed_${job.jobId}`,
        title: job.jobTitle || "",
        company: job.employerName || "Unknown",
        location: job.locationName || "UK",
        salary,
        job_type: job.contractType === "Permanent" ? "Full-time" : job.contractType || "Full-time",
        source: "Reed",
        posted_date: postedDate,
        apply_url: job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`,
        description: (job.jobDescription || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000),
      };
    });
  } catch { return []; }
}



async function fetchMuse(): Promise<any[]> {
  const apiKey = process.env.THE_MUSE_API_KEY;
  const keyParam = apiKey ? `&api_key=${apiKey}` : "";

  const fetchPage = async (page: number): Promise<{ results: any[]; page_count: number }> => {
    const res = await fetch(
      `https://www.themuse.com/api/public/jobs?page=${page}&page_size=100&descending=true${keyParam}`,
      { headers: { "User-Agent": "JobMatch/1.0" }, signal: AbortSignal.timeout(20000) }
    );
    if (!res.ok) return { results: [], page_count: 0 };
    const data = await res.json();
    return { results: data.results || [], page_count: data.page_count || 0 };
  };

  try {
    const ALLOWED_CATEGORIES = new Set([
      "Software Engineering", "Engineering", "Data Science", "DevOps",
      "IT & Networking", "Product", "Design & UX", "Project Management",
      "Marketing & Communications", "Sales & Business Development",
      "Business Operations", "Finance", "Legal", "Human Resources & Recruiting",
      "Customer Success", "Content & Writing",
      "Data and Analytics", "Human Resources and Recruitment", "Product Management",
      "Education",
    ]);
    const IT_KEYWORDS = [
      "engineer", "developer", "software", "data", "devops", "product manager",
      "product owner", "ux", "ui", "designer", "architect", "technical",
      "analyst", "scientist", "machine learning", "ai ", "backend", "frontend",
      "fullstack", "mobile", "ios", "android", "cloud", "security", "qa",
      "motion", "graphic", "brand", "creative", "copywriter", "content",
    ];

    const first = await fetchPage(0);
    const totalPages = Math.min(first.page_count, 20);
    console.log(`TheMuse: total pages=${totalPages}`);
    const rest = totalPages > 1
      ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 1)))
      : [];
    const rawJobs = [first.results, ...rest.map(p => p.results)].flat();
    const allJobs: any[] = [];
    for (const job of rawJobs) {
      if (!job.id || !job.name) continue;
      const category = job.categories?.[0]?.name;
      const titleLower = job.name.toLowerCase();
      const allowed = (category && ALLOWED_CATEGORIES.has(category))
        || IT_KEYWORDS.some(kw => titleLower.includes(kw));
      if (!allowed) continue;
      allJobs.push({
        id: `muse_${String(job.id)}`,
        title: job.name,
        company: job.company?.name || "",
        location: job.locations?.[0]?.name || "Remote",
        salary: "",
        job_type: "Full-time",
        source: "TheMuse",
        posted_date: job.publication_date
          ? new Date(job.publication_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : "",
        apply_url: job.refs?.landing_page || job.refs?.canonical_url || "",
        description: job.categories?.[0]?.name || "",
      });
    }
    if (allJobs[0]) console.log("Muse job sample:", JSON.stringify(allJobs[0]));
    console.log(`TheMuse: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("TheMuse error:", e.message);
    return [];
  }
}

// ─── Workday config ───────────────────────────────────────────────────────────
const WORKDAY_COMPANIES = [
  { tenant: "intel",      instance: "wd1",  board: "External",                  name: "Intel" },
  { tenant: "nvidia",     instance: "wd5",  board: "NVIDIAExternalCareerSite",  name: "Nvidia" },
  { tenant: "adobe",      instance: "wd5",  board: "external_experienced",      name: "Adobe" },
  { tenant: "snowflake",  instance: "wd5",  board: "SnowflakeCareerSite",       name: "Snowflake" },
  { tenant: "twilio",     instance: "wd5",  board: "Twilio",                    name: "Twilio" },
  { tenant: "okta",       instance: "wd5",  board: "OktaCareerSite",            name: "Okta" },
  { tenant: "salesforce", instance: "wd12", board: "External",                  name: "Salesforce" },
  { tenant: "cisco",      instance: "wd5",  board: "Cisco",                     name: "Cisco" },
  { tenant: "ibm",        instance: "wd3",  board: "External",                  name: "IBM" },
  { tenant: "oracle",     instance: "wd1",  board: "opps",                      name: "Oracle" },
  { tenant: "workday",    instance: "wd5",  board: "External",                  name: "Workday" },
  { tenant: "servicenow", instance: "wd5",  board: "External",                  name: "ServiceNow" },
  { tenant: "splunk",     instance: "wd5",  board: "External",                  name: "Splunk" },
  { tenant: "paloaltonetworks", instance: "wd5", board: "External",             name: "Palo Alto Networks" },
  { tenant: "crowdstrike",instance: "wd5",  board: "crowdstrikecareers",        name: "CrowdStrike" },
  { tenant: "fortinet",   instance: "wd5",  board: "External",                  name: "Fortinet" },
  // qualcomm and amd use EightFold (blocked) — removed
  { tenant: "broadcom",   instance: "wd5",  board: "External",                  name: "Broadcom" },
  { tenant: "hp",         instance: "wd5",  board: "External",                  name: "HP" },
  { tenant: "dell",       instance: "wd1",  board: "External",                  name: "Dell Technologies" },
  { tenant: "vmware",     instance: "wd5",  board: "External",                  name: "VMware" },
  { tenant: "sap",        instance: "wd3",  board: "External",                  name: "SAP" },
  { tenant: "accenture",  instance: "wd3",  board: "SemDash",                   name: "Accenture" },
  { tenant: "deloitte",   instance: "wd5",  board: "External",                  name: "Deloitte" },
  { tenant: "pwc",        instance: "wd3",  board: "External",                  name: "PwC" },
  { tenant: "kpmg",       instance: "wd5",  board: "External",                  name: "KPMG" },
  { tenant: "bosch",      instance: "wd3",  board: "External",                  name: "Bosch" },
  { tenant: "siemens",    instance: "wd3",  board: "External",                  name: "Siemens" },
  { tenant: "philips",    instance: "wd3",  board: "External",                  name: "Philips" },
  // Added from direct career page list
  // micron uses EightFold — moved there
  { tenant: "intuit",     instance: "wd5",  board: "intuitcareers",             name: "Intuit" },
  { tenant: "zoom",       instance: "wd5",  board: "External",                  name: "Zoom" },
  { tenant: "texasinstruments", instance: "wd5", board: "TIExternal",           name: "Texas Instruments" },
  { tenant: "paypal",     instance: "wd1",  board: "External",                  name: "PayPal" },
  { tenant: "doordash",   instance: "wd5",  board: "External",                  name: "DoorDash" },
  { tenant: "instacart",  instance: "wd5",  board: "External",                  name: "Instacart" },
  { tenant: "robinhood",  instance: "wd5",  board: "External",                  name: "Robinhood" },
  { tenant: "chimeinc",   instance: "wd5",  board: "External",                  name: "Chime" },
  { tenant: "brex",       instance: "wd5",  board: "External",                  name: "Brex" },
  { tenant: "rippling",   instance: "wd5",  board: "External",                  name: "Rippling" },
  { tenant: "plaid",      instance: "wd5",  board: "External",                  name: "Plaid" },
  { tenant: "figma",      instance: "wd5",  board: "External",                  name: "Figma" },
  { tenant: "canva",      instance: "wd5",  board: "Canva",                     name: "Canva" },
  { tenant: "discordapp", instance: "wd5",  board: "External",                  name: "Discord" },
  { tenant: "reddit",     instance: "wd5",  board: "External",                  name: "Reddit" },
];

async function fetchWorkday(company: { tenant: string; instance: string; board: string; name: string }): Promise<any[]> {
  try {
    const url = `https://${company.tenant}.${company.instance}.myworkdayjobs.com/wday/cxs/${company.tenant}/${company.board}/jobs`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ limit: 20, offset: 0, searchText: "", locations: [] }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobPostings || [];
    return jobs.map((job: any) => ({
      id: `wd_${company.tenant}_${job.externalPath?.split("/").pop() || Math.random().toString(36).slice(2)}`,
      title: job.title || "",
      company: company.name,
      location: job.locationsText || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Workday",
      posted_date: job.postedOn ? new Date(job.postedOn).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      apply_url: `https://${company.tenant}.${company.instance}.myworkdayjobs.com/${company.board}${job.externalPath || ""}`,
      description: job.jobReqId || "",
    }));
  } catch { return []; }
}

async function fetchAmazon(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(
        `https://www.amazon.jobs/en/search.json?normalized_keywords=&country[]=US&page=${page}&result_limit=10`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.jobs || [];
      if (!jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `amz_${job.id_icims || job.id}`,
          title: job.title || "",
          company: job.company_name || "Amazon",
          location: job.location || job.normalized_location || "USA",
          salary: "",
          job_type: job.job_schedule_type || "Full-time",
          source: "Amazon Jobs",
          posted_date: job.posted_date ? new Date(job.posted_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
          apply_url: `https://www.amazon.jobs${job.url_next_step || `/en/jobs/${job.id_icims}`}`,
          description: (job.description || job.basic_qualifications || "").replace(/<[^>]+>/g, " ").substring(0, 500),
        });
      }
      if (jobs.length < 10) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Amazon Jobs: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Amazon Jobs error:", e.message);
    return [];
  }
}

// ─── EightFold config ─────────────────────────────────────────────────────────
const EIGHTFOLD_COMPANIES = [
  { host: "paypal",  domain: "paypal.com",  name: "PayPal" },
  { host: "target",  domain: "target.com",  name: "Target" },
  { host: "walmart", domain: "walmart.com", name: "Walmart" },
  { host: "nike",    domain: "nike.com",    name: "Nike" },
  { host: "micron",  domain: "micron.com",  name: "Micron Technology" },
];

async function fetchEightfold(company: { host: string; domain: string; name: string }): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let offset = 0; offset < 200; offset += 20) {
      const res = await fetch(
        `https://${company.host}.eightfold.ai/api/apply/v2/jobs?domain=${company.domain}&num=20&offset=${offset}`,
        { headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.positions || data.jobs || [];
      if (!Array.isArray(jobs) || !jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `ef_${company.host}_${job.id}`,
          title: job.name || job.title || "",
          company: company.name,
          location: job.location || job.city || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "EightFold",
          posted_date: job.t_update ? new Date(job.t_update * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
          apply_url: `https://${company.host}.eightfold.ai/careers/job/${job.id}`,
          description: (job.description || job.job_description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
        });
      }
      if (jobs.length < 20) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`EightFold ${company.name}: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error(`EightFold ${company.name} error:`, e.message);
    return [];
  }
}


function isAdTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    /earn at least \$/.test(t) ||
    /trips, guaranteed/.test(t) ||
    /drive with uber/.test(t) ||
    /drive with lyft/.test(t) ||
    /looking for part-time jobs/.test(t) ||
    /\$[\d,]+ guarantee/.test(t) ||
    /part-time gig:/.test(t) ||
    /sign.?up bonus/.test(t) ||
    /guaranteed bonus/.test(t)
  );
}

async function saveToDb(jobs: any[]): Promise<{ saved: number; errors: number }> {
  const supabase = getSupabaseAdmin();
  const syncTime = new Date().toISOString();

  const cleanedJobs = jobs.map(job => {
    const rawDate = job.posted_date || job.postedDate || "";
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || "",
      job_type: job.job_type || job.jobType || "",
      source: job.source,
      posted_date: rawDate || null,
      // Use sync time as posted_at so the 30-day freshness filter stays valid.
      // "Month Year" strings (e.g. "May 2026") parse to the 1st of the month and
      // would look stale after ~18 days. Sync time means "last confirmed active".
      posted_at: syncTime,
      apply_url: job.apply_url || job.applyUrl || "",
      description: job.description || "",
    };
  });

  const validJobs = [
    ...new Map(
      cleanedJobs
        .filter(j => !(!j.id || !j.title || !j.source || isAdTitle(j.title)))
        .map(j => [j.id, j])
    ).values(),
  ];

  let saved = 0, errors = 0;
  const BATCH = 50;

  for (let i = 0; i < validJobs.length; i += BATCH) {
    const batch = validJobs.slice(i, i + BATCH);
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("jobs").upsert(batch, { onConflict: "id" });
      if (!error) { saved += batch.length; lastError = null; break; }
      lastError = error;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
    if (lastError) {
      console.error("Upsert error:", lastError.message, lastError.code);
      errors++;
    }
    // Small pause every 10 batches to avoid overwhelming Supabase
    if (i > 0 && (i / BATCH) % 10 === 0) await new Promise(r => setTimeout(r, 300));
  }

  return { saved, errors };
}

async function runSync(source: string) {

  // Stream-save: deduplicate with a Set, flush to DB after each source to avoid OOM
  const seenIds = new Set<string>();
  let totalFetched = 0, totalSaved = 0, totalErrors = 0;

  async function flush(jobs: any[], label = "unknown") {
    const seen = new Set<string>();
    const fresh = jobs.filter(j => {
      if (!j.id || !j.title || seenIds.has(j.id) || seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });
    fresh.forEach(j => seenIds.add(j.id));
    totalFetched += jobs.length;
    console.log(`[sync] ${label}: raw=${jobs.length} unique=${fresh.length}`);
    if (!fresh.length) return;
    const { saved, errors } = await saveToDb(fresh);
    totalSaved += saved;
    totalErrors += errors;
  }

  if (source === "greenhouse" || source === "all") {
    const results = await Promise.all(GREENHOUSE_COMPANIES.map(fetchGreenhouse));
    await flush(results.flat(), "greenhouse");
  }
  if (source === "ashby" || source === "all") {
    const results = await Promise.all(ASHBY_COMPANIES.map(fetchAshby));
    await flush(results.flat(), "ashby");
  }
  if (source === "lever" || source === "all") {
    const results = await Promise.all(LEVER_COMPANIES.map(fetchLever));
    await flush(results.flat(), "lever");
  }
  if (source === "smartrecruiters" || source === "all") {
    const results = await Promise.all(SMARTRECRUITERS_COMPANIES.map(fetchSmartRecruiters));
    await flush(results.flat(), "smartrecruiters");
  }
  if (source === "recruitee" || source === "all") {
    const results = await Promise.all(RECRUITEE_COMPANIES.map(fetchRecruitee));
    await flush(results.flat(), "recruitee");
  }
  if (source === "personio" || source === "all") {
    const results = await Promise.all(PERSONIO_COMPANIES.map(fetchPersonio));
    await flush(results.flat(), "personio");
  }
  if (source === "bamboohr" || source === "all") {
    const results = await Promise.all(BAMBOOHR_COMPANIES.map(fetchBambooHR));
    await flush(results.flat(), "bamboohr");
  }
  if (source === "workable" || source === "all") {
    const results = await Promise.all(WORKABLE_COMPANIES.map(fetchWorkable));
    await flush(results.flat(), "workable");
  }
  if (source === "adzuna" || source === "all") {
    const results = await Promise.all(ADZUNA_CATEGORIES.map(c => fetchAdzuna(c)));
    await flush(results.flat(), "adzuna");
  }
  if (source === "usajobs" || source === "all") {
    const results = await Promise.all(USAJOBS_KEYWORDS.map(fetchUSAJobs));
    await flush(results.flat(), "usajobs");
  }
  if (source === "remotejobs" || source === "all") {
    const results = await Promise.all(REMOTEJOBS_CATEGORIES.map(fetchRemoteJobs));
    await flush(results.flat(), "remotejobs");
  }
  if (source === "remotive" || source === "arbeitnow" || source === "jobicy" || source === "themuse" || source === "all") {
    const [remotive, arbeitnow, jobicy, themuse] = await Promise.allSettled([
      source === "remotive"  || source === "all" ? fetchRemotive()  : Promise.resolve([]),
      source === "arbeitnow" || source === "all" ? fetchArbeitnow() : Promise.resolve([]),
      source === "jobicy"    || source === "all" ? fetchJobicy()    : Promise.resolve([]),
      source === "themuse"   || source === "all" ? fetchMuse()      : Promise.resolve([]),
    ]);
    if (remotive.status === "fulfilled") await flush(remotive.value, "remotive"); else console.error("remotive failed:", remotive.reason);
    if (arbeitnow.status === "fulfilled") await flush(arbeitnow.value, "arbeitnow"); else console.error("arbeitnow failed:", arbeitnow.reason);
    if (jobicy.status === "fulfilled") await flush(jobicy.value, "jobicy"); else console.error("jobicy failed:", jobicy.reason);
    if (themuse.status === "fulfilled") await flush(themuse.value, "themuse"); else console.error("themuse failed:", themuse.reason);
  }
  if (source === "himalayas" || source === "all") {
    await flush(await fetchHimalayas(), "himalayas");
  }
  if (source === "reed" || source === "all") {
    const results = await Promise.all(REED_KEYWORDS.map(fetchReed));
    await flush(results.flat(), "reed");
  }
  if (source === "jooble" || source === "all") {
    const results = await Promise.all(JOOBLE_QUERIES.map(fetchJooble));
    await flush(results.flat(), "jooble");
  }
  if (source === "workday" || source === "all") {
    const results = await Promise.all(WORKDAY_COMPANIES.map(fetchWorkday));
    await flush(results.flat(), "workday");
  }
  if (source === "amazon" || source === "all") { await flush(await fetchAmazon(), "amazon"); }
  if (source === "eightfold"  || source === "all") {
    const results = await Promise.all(EIGHTFOLD_COMPANIES.map(fetchEightfold));
    await flush(results.flat(), "eightfold");
  }

  // Hard 30-day cleanup: delete by posted_at first, then fall back to created_at for undated jobs
  try {
    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: e1, count: c1 } = await supabase.from("jobs").delete({ count: "exact" })
      .lt("posted_at", cutoff).not("posted_at", "is", null);
    if (e1) console.error("[sync] cleanup (posted_at) error:", e1.message);

    const { error: e2, count: c2 } = await supabase.from("jobs").delete({ count: "exact" })
      .is("posted_at", null).lt("created_at", cutoff);
    if (e2) console.error("[sync] cleanup (created_at) error:", e2.message);

    console.log(`[sync] cleanup — deleted ${(c1 ?? 0) + (c2 ?? 0)} old jobs (${c1 ?? 0} by date, ${c2 ?? 0} by insert time)`);
  } catch (e: any) {
    console.error("[sync] cleanup fatal:", e.message);
  }

  console.log(`[sync] done — fetched=${totalFetched} saved=${totalSaved} errors=${totalErrors}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const source = searchParams.get("source") || "all";

  try {
    await runSync(source);
    return NextResponse.json({ done: true, source });
  } catch (e: any) {
    console.error("[sync] fatal:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
