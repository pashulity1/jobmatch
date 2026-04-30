import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const maxDuration = 300;


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
  "nvidia", "amd", "intel", "qualcomm", "arm",
  "snowflake", "confluent", "dbt-labs", "airbyte",
  "mongodb", "elastic", "cockroachdb", "planetscale", "supabase",
  "netlify", "fly", "render", "railway",
  "auth0", "stytch", "ory", "frontegg",
  "retool", "appsmith", "budibase", "tooljet",
  "framer", "builder",
  "linear", "height", "shortcut", "basecamp",
  "carta", "capchase", "clearco", "pipe",
  "deel", "remote", "oyster",
  "ironclad", "docusign", "pactflow", "clio",
  "toast", "lightspeed", "square", "clover",
  "plaid", "adyen", "checkout",
  "benchling", "labviva", "scispot", "sapio",
  "relativity", "everlaw", "logikcull", "disco",
  "freshdesk", "kustomer",
  "drift", "qualified", "chili-piper", "salesloft",
  "gong", "chorus", "clari", "outreach",
  "productboard", "pendo",
  // New additions
  "mistral", "atlassian", "cockroachlabs", "grammarly",
  "miro", "loom", "superhuman", "mercury", "ramp",
  "culture-amp", "leapsome", "persona", "alloy", "postman",
  "hightouch", "census", "modal", "baseten", "clerk",
  // Batch 3
  "sendgrid", "heap", "fullstory", "hotjar", "splitio", "optimizely",
  "contentsquare", "medallia", "qualtrics", "monday", "smartsheet", "wrike",
  "zoom", "webex", "ringcentral", "vonage", "bandwidth",
  "akamai", "imperva", "qualys", "tenable",
  "crowdstrike", "sentinelone", "cylance", "carbonblack", "lacework", "wiz", "orca",
  "veracode", "checkmarx", "sonarqube",
  "dynatrace", "splunk", "sumo", "logdna", "papertrail",
  "typesense", "meilisearch", "pinecone", "weaviate",
  "domo", "looker", "mode", "sigma", "thoughtspot", "sisense",
  "braze", "klaviyo", "iterable", "customer-io", "sendbird",
  "clearbit", "zoominfo", "lusha",
  "livekit", "daily", "whereby", "agora",
  "labelbox", "weights-biases", "comet", "neptune",
  "prefect", "dagster", "mage", "kedro", "zenml",
  // Batch 4 — Fintech & Banking
  "navan", "expensify", "rho", "airbase", "spendesk", "payhawk",
  "pleo", "soldo", "jeeves", "pomelo", "tribal",
  "synctera", "column", "treasury-prime", "increase", "bond",
  "prime-trust", "alpaca", "drivewealth", "capitolis",
  "broadridge", "finastra", "marqeta", "highnote",
  "apto", "deserve", "tally", "dave", "chime", "current", "varo",
  "greenlight", "step", "copper", "pixpay", "kard",
  // Batch 4 — HR Tech
  "bamboohr", "workday", "paylocity", "paycom", "paychex",
  "isolved", "ceridian", "kronos",
  "comeet", "breezyhr", "pinpoint", "dover", "gem",
  "beamery", "eightfold", "phenom", "seekout", "fetcher",
  "hireez", "jobvite", "icims",
  "betterworks", "15five", "reflektive", "engagedly", "trakstar",
  "bonusly", "motivosity", "fond", "blueboard",
  // Batch 4 — Developer Tools
  "jetbrains", "gitkraken", "tower",
  "rollbar", "bugsnag", "raygun", "honeybadger", "airbrake", "appsignal",
  "june", "koala", "commonroom", "orbit",
  "stoplight", "insomnia", "httpie", "ngrok",
  // Batch 4 — Design & Creative
  "sketch", "invision", "zeplin", "avocode", "abstract",
  "adobe", "lottiefiles", "rive",
  // Batch 5 — more Fintech
  "moss", "fidessa", "murex", "modern-treasury", "taleo", "successfactors",
  "gladly", "recharge", "bold", "carthook", "zipify", "reconvert",
  "privy", "justuno", "shipbob", "shipstation", "easyship", "shippo", "goshippo",
  "returnly", "loop-returns", "narvar", "aftership", "route",
  "bigcommerce", "woocommerce", "magento", "prestashop",
  "okendo", "stamped", "loox", "reviews-io",
  // Batch 5 — Health & Biotech
  "tempus", "veracyte", "guardant", "exact-sciences",
  "23andme", "color", "invitae", "myriad", "ambry",
  "insitro", "insilico", "ontada", "syapse",
  "hinge-health", "sword", "kaia", "brightline",
  "talkspace", "betterhelp", "lyra", "spring",
  "omada", "livongo", "virta", "found",
  // Batch 5 — Climate & Sustainability
  "watershed", "sweep", "persefoni", "greenly", "plan-a",
  "sinai", "sphera", "enablon", "velocity-ehs",
  "arcadia", "stem", "fluence",
  "turntide", "freewire", "ev-connect", "blink",
  "terrasos", "verra", "goldstandard",
  // Batch 6 — Enterprise SaaS
  "salesforce", "servicenow", "workday", "sap", "oracle",
  "box", "dropbox", "docusign", "zoom", "slack",
  "zendesk", "freshworks", "kayako", "helpscout",
  "jira", "confluence", "trello", "asana", "monday",
  "pipedrive", "close", "copper", "freshsales", "nutshell",
  "zendesk", "hootsuite", "sproutsocial", "buffer",
  "marketo", "pardot", "eloqua", "act-on", "sharpspring",
  // Batch 6 — Consumer Tech
  "eventbrite", "meetup", "ticketmaster", "seatgeek",
  "stubhub", "vivid-seats", "tix", "gametime",
  "airbnb-experiences", "viator", "getyourguide",
  "tripadvisor", "yelp", "foursquare",
  "grubhub", "doordash", "uber-eats", "seamless",
  "gopuff", "getir", "gorillas", "flink",
  "turo", "getaround", "zipcar", "enterprise",
  // Batch 6 — Healthcare & Life Sciences
  "epic", "cerner", "allscripts", "athenahealth",
  "modernhealth", "cerebral", "brightline",
  "privia", "aledade", "iora", "cityblock",
  "hinge-health", "sword-health", "kaia-health",
  "transcarent", "accolade", "quantum-health",
  "evolent", "alignment", "devoted",
  "recursion", "relay-therapeutics", "insitro",
  "vividion", "scorpion", "arrakis",
  "biomea", "dice", "nuvalent",
  // Batch 6 — Security & Infrastructure
  "palo-alto-networks", "fortinet", "checkpoint",
  "rapid7", "qualys", "tenable", "nessus",
  "sailpoint", "saviynt", "ping", "onelogin",
  "duo", "cyberark", "thycotic", "beyondtrust",
  "darktrace", "vectra", "exabeam", "securonix",
  "illumio", "zscaler", "netskope", "lookout",
  "axonius", "sevco", "runzero", "spiderfoot",
  // Batch 6 — Data & Analytics
  "dbt-labs", "fivetran", "stitch", "matillion",
  "informatica", "talend", "attunity", "rivery",
  "dremio", "starburst", "ahana", "incorta",
  "atscale", "kyligence", "imply", "apache",
  "monte-carlo", "acceldata", "great-expectations", "anomalo",
  "lightdash", "metabase", "redash", "count",
  "hex", "deepnote", "noteable", "querybook",
  // Batch 6 — Developer Tools
  "github", "gitlab", "bitbucket", "azure-devops",
  "jfrog", "sonatype", "artifactory", "nexus-repo",
  "snyk", "whitesource", "black-duck", "checkmarx",
  "semgrep", "codeql", "coverity", "klocwork",
  "harness", "spinnaker", "argo", "flux",
  "pulumi", "crossplane", "env0", "spacelift",
  "logz", "elastic-apm", "instana", "lightstep",
  "honeycomb", "jaeger", "zipkin", "opentelemetry",
  // Batch 6 — AI/ML
  "openai", "deepmind", "google-deepmind", "meta-ai",
  "stability-ai", "midjourney", "runway", "pika",
  "eleven-labs", "murf", "play-ht", "resemble",
  "jasper", "copy-ai", "writesonic", "rytr",
  "synthesis", "synthesia", "heygen", "d-id",
  "assembled", "cresta", "balto", "invoca",
  "observe", "tethr", "callminer", "nice",
  // Batch 6 — Edtech
  "duolingo", "busuu", "babbel", "pimsleur",
  "coursera", "edx", "udemy", "skillshare",
  "brilliant", "khan-academy", "codecademy", "treehouse",
  "pluralsight", "linkedin-learning", "oreilly", "udacity",
  "springboard", "lambda-school", "thinkful", "flatiron",
  "outschool", "varsity-tutors", "tutor", "wyzant",
  // Batch 6 — Fintech expanded
  "nerdwallet", "creditkarma", "experian", "equifax",
  "transunion", "fico", "vantagescore",
  "lendingclub", "prosper", "avant", "best-egg",
  "sofi", "earnest", "credible", "elfi",
  "blend", "better", "home-point", "loansnap",
  "opendoor", "offerpad", "orchard", "homeward",
  "divvy", "landis", "ownup", "arrive",
  // Batch 7 — Enterprise & Fortune 500
  "accenture", "deloitte", "pwc", "kpmg", "ey-us", "mckinsey", "bain",
  "ibm", "oracle", "sap-us", "cisco", "hp", "dell", "lenovo",
  "boeing", "lockheed-martin", "raytheon", "northrop-grumman", "general-dynamics",
  "ge", "honeywell", "3m", "emerson", "parker-hannifin", "eaton",
  "jpmorgan", "bankofamerica", "wellsfargo", "citi", "usbank",
  "goldmansachs", "morganstanley", "blackrock", "vanguard", "fidelity",
  "pfizer", "johnson-johnson", "merck", "abbvie", "eli-lilly", "bristol-myers-squibb",
  "unitedhealth", "anthem", "cigna", "aetna", "humana",
  "nike", "adidas", "underarmour", "lululemon", "gap", "pvh",
  "walmart", "target", "costco", "kroger", "walgreens", "cvs",
  "comcast", "at-t", "tmobile", "verizon-media", "charter",
  "disney", "nbc-news", "cbs", "paramount", "discovery",
  "squarespace", "wix-com", "godaddy", "namecheap", "domain",
  "hootsuite", "sprout", "bazaarvoice", "percolate", "kapost",
  "invision", "abstract-design", "overflow", "whimsical", "miro-enterprise",
  "quora", "medium-com", "buzzfeed", "vox", "insider-inc",
  "nytimes", "washingtonpost", "guardian", "bloomberg", "reuters",
  "spotify-jobs", "soundcloud", "deezer", "tidal-jobs", "pandora",
  "lyft-open-positions", "bird-rides", "lime-jobs", "tier-mobility",
  "opentable", "yelp-inc", "tripadvisor-jobs", "grubhub-jobs",
  "eventbrite-jobs", "ticketmaster-jobs", "seatgeek-jobs",
  "classpass", "mindbody", "gympass", "wellhub",
  "squareup", "clover-network", "toast-tab", "lightspeed-pos",
  "zenefits", "paylocity-corp", "paycom-inc", "adp-jobs",
  "servicenow-jobs", "splunk-inc", "tableau-software", "qlik",
  "box-inc", "egnyte", "sharefile", "kiteworks",
  "okta-inc", "onelogin", "ping-identity", "sailpoint",
  "zscaler", "netskope", "lookout", "forcepoint",
  "crowdstrike-jobs", "sentinelone-jobs", "cylance-jobs", "carbon-black",
  "paloaltonetworks", "fortinet-jobs", "checkpoint-jobs", "juniper",
  "cloudera", "hortonworks", "mapr", "talend-jobs",
  "informatica-jobs", "mulesoft", "boomi", "jitterbit",
  "apttus", "conga", "docusign-jobs", "echosign",
  "veeva-systems", "medidata-solutions", "parexel-jobs", "iqvia",
  "epic-systems", "cerner-jobs", "allscripts-jobs", "athena",
  "inovalon", "netsmart", "greenway-health", "advancedmd",
  "healtheon", "change-healthcare", "availity", "waystar",
  "proofpoint", "mimecast", "barracuda", "sophos",
  "rapid7-jobs", "qualys-jobs", "tenable-jobs", "bitsight",
  "secureworks", "trustwave", "forepoint", "webroot",
  "dynatrace-jobs", "appdynamics", "instana-jobs", "lightstep-jobs",
  "new-relic-jobs", "datadog-jobs", "sumologic", "logrhythm",
  "elastic-jobs", "solr", "opensearch", "algolia-jobs",
  "couchbase", "redis-labs", "datastax", "cassandra",
  "neo4j", "tigergraph", "amazondynamodb", "firebasedb",
  "talentlyft", "pinpoint-hq", "dover-jobs", "gem-hq",
  "lattice-hq", "leapsome-jobs", "betterworks-jobs", "reflektive",
  "bonusly-jobs", "blueboard-jobs", "motivosity", "awardco",
  "peakon", "glint", "viva-goals", "workpath",
  // Batch 7 — More SaaS & Startups
  "notion-so", "coda-io", "craft-io", "slite",
  "roam-research", "logseq", "obsidian-md", "remnote",
  "readwise", "matter-reader", "instapaper", "pocket",
  "zapier-jobs", "make-com", "n8n-jobs", "activepieces-jobs",
  "integromat", "tray-io", "workato-jobs", "boomi-jobs",
  "miro-jobs", "lucidchart", "draw-io", "excalidraw",
  "figma-jobs", "sketch-jobs", "adobe-figma", "penpot-jobs",
  "webflow-jobs", "framer-jobs", "plasmic-jobs", "builder-io",
  "vercel-jobs", "netlify-jobs", "render-jobs", "fly-io",
  "cloudflare-jobs", "fastly-jobs", "akamai-jobs", "imperva",
  "sumo-logic", "loggly", "papertrail-jobs", "logdna-jobs",
  "honeycomb-io", "lightstep", "opentelemetry-io", "jaegertracing",
  "grafana-labs", "prometheus-io", "victoria-metrics", "thanos",
  "k6-io", "artillery-io", "gatling-corp", "loadrunner",
  "postman-jobs", "insomnia-jobs", "stoplight-jobs", "readme-jobs",
  "swaggerhub", "apiary", "redoc", "spectral",
];

const ASHBY_COMPANIES = [
  // Verified Ashby companies
  "linear", "retool", "ramp", "deel", "monzo", "superhuman", "vanta",
  "metabase", "dagster", "hightouch", "census", "pitch",
  "supabase", "neon", "upstash", "resend", "cal", "raycast",
  "highlight", "axiom", "clerk", "workos",
  "mintlify", "gitbook", "readme", "perplexity", "dust",
  "clipboard", "whatnot",
  "newfront", "deepgram", "eightsleep",
  "assembly", "influxdata", "padlet", "cambly",
  "anthropic", "mistral", "groq", "cohere", "together", "replicate",
  "modal", "baseten",
  "incident", "firehydrant", "blameless",
  "drata", "secureframe", "laika",
  "merge", "fleetdm", "kandji", "mosyle",
  "cognition-labs", "poolside", "magic",
  "attio", "inngest",
  "scale", "labelbox", "dbt-labs",
  "algolia", "pinecone", "weaviate",

];


const LEVER_COMPANIES = [
  // Verified Lever companies
  "cognite", "mercury", "watershed", "gem", "loom", "miro",
  "verkada", "hex", "descript", "modal", "together",
  "plaid", "chime", "marqeta", "ginkgo", "recursion",
  "flexport", "project44", "faire", "airbyte", "cortex",
  "lumos", "sardine", "replit", "codeium", "enablecomp",
  "harness", "samsara", "culture-amp", "lattice",
  "productboard", "kandji", "mosyle",
  "lyft", "dropbox", "duolingo",
  "anduril", "joby",
  "gong", "outreach", "salesloft",
  "figma", "webflow",
  "navan", "expensify",
  "braze", "amplitude",
  "benchling", "zipline", "recursion",
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
  "storyblok", "sanity", "prismic",
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

async function fetchJobicy(): Promise<any[]> {
  try {
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50`, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "JobMatch/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = (data.jobs || []).map((job: any) => ({
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
    }));
    console.log(`Jobicy: fetched ${jobs.length} jobs`);
    return jobs;
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

  const cleanedJobs = jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary || "",
    job_type: job.job_type || job.jobType || "",
    source: job.source,
    posted_date: job.posted_date || job.postedDate || null,
    apply_url: job.apply_url || job.applyUrl || "",
    description: job.description || "",
  }));

  const validJobs = [
    ...new Map(
      cleanedJobs
        .filter(j => j.id && j.title && j.source && !isAdTitle(j.title))
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

  // Cleanup jobs older than 30 days
  try {
    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error, count } = await supabase.from("jobs").delete({ count: "exact" }).lt("created_at", cutoff);
    if (error) console.error("[sync] cleanup error:", error.message);
    else console.log(`[sync] cleanup — deleted ${count ?? 0} old jobs`);
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

  // Fire-and-forget — respond immediately, sync runs in background
  runSync(source).catch(e => console.error("[sync] fatal:", e));

  return NextResponse.json({ started: true, source, message: "Sync running in background. Check Railway logs for progress." });
}
