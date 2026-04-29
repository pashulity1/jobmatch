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
  "drata", "secureframe", "laika",
  "merge", "apideck", "vessel", "knit",
  "fleet", "fleetdm", "kandji", "mosyle",
  "plane", "huly", "cycle", "arc",
  "rows", "tally", "fillout", "paperform",
  "typeform", "jotform", "surveymonkey", "alchemer",
  // New additions
  "mercury", "brex", "coda", "replit",
  // Batch 3
  "groq", "anyscale", "weights-biases", "scale", "labelbox", "dbt-labs",
  "segment", "amplitude", "mixpanel", "braze", "klaviyo",
  "algolia", "pinecone", "weaviate", "qdrant", "chroma",
  "livekit", "daily", "whereby", "agora", "stream",
  "tugboat", "ashby", "rippling", "remote", "oyster",
  "height", "shortcut", "jira", "contra", "toptal", "andela",
  // Batch 5 — early-stage AI
  "ai21", "aleph-alpha", "inflection", "adept", "imbue",
  "mosaicml", "fireworks", "lepton", "huggingface",
  "fixie", "llamaindex", "haystack",
  "vellum", "humanloop", "promptlayer", "helicone", "braintrust",
  "arize", "whylabs", "fiddler", "arthur", "truera",
  "glean", "guru", "mem", "rewind", "avoma", "grain",
  // Batch 5 — infra & devops
  "porter", "qovery", "gimlet", "garden",
  "earthly", "dagger", "buildkite", "circleci", "semaphore",
  "depot", "namespace", "tabnine",
  "trunk", "reviewpad", "graphite", "aviator",
  "mergequeue", "shipyard", "speedscale", "tracetest",
  "gremlin", "steadybit",
  // Batch 5 — B2B SaaS
  "front", "missive", "helpscout", "groove",
  "drift", "qualified", "calendly",
  "instantly", "lemlist", "woodpecker", "mailshake",
  "waalaxy", "expandi", "phantombuster",
  "hunter", "snov", "voilanorbert",
  // Batch 6 — More startups & scaleups
  "vercel", "netlify", "fly", "render", "railway",
  "turso", "neon", "planetscale", "fauna", "mongodb",
  "cockroachdb", "yugabyte", "vitess", "tidb",
  "clickhouse", "druid", "pinot", "rockset",
  "materialize", "risingwave", "estuary", "decodable",
  "pulsar", "redpanda", "confluent", "aiven",
  "temporal", "conductor", "camunda", "zeebe",
  "inngest", "trigger", "windmill", "n8n",
  "retool", "tooljet", "budibase", "appsmith",
  "basehub", "payload", "directus", "strapi",
  "sanity", "contentful", "hygraph", "storyblok",
  "cloudinary", "imgix", "fastly", "bunny",
  "mux", "api-video", "livekit", "jitsi",
  "sendgrid", "mailgun", "postmark", "resend",
  "twilio", "bandwidth", "telnyx", "vonage",
  "segment", "rudderstack", "mparticle", "freshpaint",
  "braze", "oneSignal", "pushwoosh", "urbanairship",
  "statsig", "launchdarkly", "split", "optimizely",
  "flagsmith", "unleash", "growthbook", "flipt",
  // Batch 6 — AI Infrastructure
  "together", "anyscale", "ray", "runpod", "vast",
  "coreweave", "lambda-labs", "paperspace", "jarvislabs",
  "fireworks", "lepton", "octoai", "perplexity",
  "cohere", "ai21", "aleph-alpha", "inflection",
  "adept", "imbue", "mosaicml", "deci",
  "neural-magic", "deepsparse", "openvino",
  // Batch 6 — AI Agents & Apps
  "cognition", "devin", "sweep", "cody",
  "cursor", "continue", "codeium", "tabnine",
  "codegen", "refact", "bito", "mintlify",
  "hexagonal", "autogpt", "babyagi", "superagent",
  "langchain", "llamaindex", "haystack", "flowise",
  "gumloop", "activepieces", "n8n", "make",
  // Batch 6 — Analytics & Data
  "mixpanel", "amplitude", "heap", "fullstory",
  "segment", "rudderstack", "mparticle", "lytics",
  "snowplow", "jitsu", "tealium", "adobe-analytics",
  "hotjar", "mouseflow", "clarity", "smartlook",
  "contentsquare", "glassbox", "quantum-metric",
  "userleap", "sprig", "dovetail", "maze",
  "lookback", "usertesting", "trymata", "dscout",
  // Batch 6 — Sales & RevOps
  "salesforce", "hubspot", "pipedrive", "close",
  "outreach", "salesloft", "groove", "apollo",
  "gong", "chorus", "clari", "avoma",
  "wingman", "jiminny", "refract", "modjo",
  "chili-piper", "calendly", "reclaim", "savvycal",
  "apollo-io", "zoominfo", "clearbit", "cognism",
  "lusha", "rocketreach", "hunter", "snov",
  // Batch 6 — Customer Success
  "gainsight", "totango", "churnzero", "planhat",
  "vitally", "catalyst", "custify", "client-success",
  "strikedeck", "natero", "bolstra", "kapta",
  "intercom", "zendesk", "freshdesk", "kustomer",
  "gorgias", "re-amaze", "tidio", "crisp",
  // Batch 6 — HR Tech expanded
  "greenhouse", "lever", "ashby", "teamtailor",
  "workable", "recruitee", "breezyhr", "zoho-recruit",
  "smartrecruiters", "icims", "jobvite", "taleo",
  "successfactors", "oracle-hcm", "adp", "paylocity",
  "paycom", "bamboohr", "gusto", "rippling",
  "namely", "hibob", "personio", "factorial",
  "charlie", "humaans", "sage-hr", "zenefits",
  // Batch 6 — Design & Creative Tools
  "figma", "sketch", "adobe-xd", "invision",
  "zeplin", "avocode", "abstract", "frontify",
  "bynder", "canto", "brandfolder", "widen",
  "canva", "piktochart", "visme", "crello",
  "lottiefiles", "rive", "haiku", "jitter",
  "spline", "nomad", "origami", "principle",
  // Batch 6 — CMS & Web
  "contentful", "sanity", "storyblok", "prismic",
  "strapi", "directus", "payload", "keystone",
  "webflow", "framer", "wix", "squarespace",
  "wordpress", "ghost", "substack", "medium",
  "netlify", "vercel", "render", "railway",
  "cloudflare-pages", "aws-amplify", "firebase", "supabase-platform", "neon-platform", "turso-platform",
  // Batch 8 — more startups to reach 1000
  "sfcompute", "together-ai", "lepton-ai", "octoai",
  "banana-dev", "beam-cloud", "jarvislabs", "runpod-jobs",
  "vast-ai", "coreweave", "lambda-labs", "paperspace",
  "huggingface", "replicate", "fal-ai", "segmind",
  "deepinfra", "fireworks-ai", "perplexity-ai", "you-com",
  "phind", "kagi", "metaphor-systems", "exa-ai",
  "mem-ai", "rewind-ai", "glean-ai", "guru-ai",
  "notion-ai", "coda-ai", "craft-ai-tools", "anytype",
  "roam", "obsidian-jobs", "logseq-jobs", "remnote-jobs",
  "readwise-jobs", "matter-app", "pocket-jobs", "instapaper-jobs",
  "linear-app", "height-app", "shortcut-app", "basecamp-app",
  "twist-app", "campfire-app", "hey-email", "fastmail",
  "proton-mail", "tutanota", "skiff-com", "standardnotes",
  "bitwarden-jobs", "1password-jobs", "lastpass", "dashlane",
  "keypass", "keeper-security", "nordpass", "roboform",
  "nordvpn", "expressvpn", "mullvad", "protonvpn",
  "tailscale", "zerotier", "netbird", "headscale",
  "cloudflare-access", "zscaler-jobs", "netskope-jobs", "iboss",
  "pomerium", "boundary-dev", "teleport-dev", "bastionzero",
  "strongdm", "hashicorp-vault", "akeyless", "infisical",
  "doppler-env", "1password-secrets", "chamber-aws", "berglas",
  "snyk-jobs", "socket-dev", "deps-dev", "renovate-bot",
  "dependabot", "whitesource-jobs", "mend-io", "fossa-jobs",
  "blackduck", "synopsys-jobs", "veracode-jobs", "checkmarx-jobs",
  "semgrep-jobs", "codeql-jobs", "coverity-jobs", "fortify",
  "sonarqube-jobs", "codeclimate", "codacy", "deepsource",
  "codecov", "coveralls", "allure-report", "testmo",
  "allure-testops", "qase-io", "testrail", "practitest",
  "xray-jira", "zephyr-scale", "aqua-ztm", "testim",
  "mabl-jobs", "testcafe", "playwright-jobs", "cypress-jobs",
  "selenium-jobs", "appium-jobs", "detox-jobs", "espresso-jobs",
  "katalon-jobs", "ranorex", "uipath-jobs", "automation-anywhere",
  "blueprism", "workfusion", "nice-jobs", "pegasystems",
  "appian-jobs", "mendix", "outsystems", "salesforce-platform",
  "servicenow-platform", "nintex", "kissflow", "zoho-creator",
  "quickbase", "knack", "caspio", "trackvia",
  "airtable-platform", "smartsheet-platform", "fibery", "nuclino",
  "tettra", "confluence-jobs", "notion-platform", "slab-hq",
  "guru-knowledge", "document360", "helpjuice", "zendesk-guide",
  "intercom-articles", "freshdesk-solutions", "servicenow-kb", "bloomfire",
  // Batch 9 — fill to 1000
  "hashnode", "dev-to", "hackernoon", "morning-brew",
  "tldr-tech", "bytes-dev", "changelog-fm", "corecursive",
  "egghead-io", "frontendmasters", "executeprogram", "scrimba",
  "codingame", "codewars", "exercism-io", "hackerrank-learn",
  "educative-io", "interviewbit", "pramp-io", "interviewing-io",
  "pathrise", "rocketblocks", "exponent-io", "stellarpeers",
  "glassdoor", "ziprecruiter", "careerbuilder", "dice-jobs",
  "angel-list", "wellfound", "otta-jobs", "cord-jobs",
  "talent-io", "honeypot-jobs", "relocate-me", "remoteok",
  "weworkremotely", "flexjobs", "virtualvocations", "pangian",
  "remote-first", "async-first", "toptal-remote", "arc-remote",
  "x-team", "lemon-remote", "braintrust-remote", "contra-remote",
  "worksome", "malt-jobs", "upwork-enterprise", "99designs-jobs",
  "envato-jobs", "creativemarket", "dribbble-jobs", "behance-jobs",
  "coroflot", "krop", "authenticjobs", "smashingmagazine-jobs",
  "designernews", "sidebar-io", "muzli-jobs", "layers-fyi",
  "godly-website", "minimal-gallery", "awwwards-jobs", "cssdesignawards",
  "a-list-apart", "creativebloq", "webdesignerdepot", "speckyboy",
  // Batch 7 — YC & early-stage AI/ML
  "cognition-labs", "poolside", "magic-dev", "factory",
  "coderabbit", "greptile", "graphite-dev", "aviator-dev",
  "trunk-io", "reviewpad-io", "mergify", "shipyard-io",
  "depot-dev", "namespace-so", "earthly-tech", "dagger-io",
  "buildkite-jobs", "circleci-jobs", "semaphore-jobs", "codefresh-jobs",
  "argocd", "fluxcd", "spinnaker-io", "jenkins-x",
  "pulumi-jobs", "crossplane-io", "env0-jobs", "spacelift-io",
  "porter-dev", "qovery-jobs", "gimlet-io", "garden-io",
  "teleport-jobs", "boundary-io", "vault-io", "consul-io",
  "nomad-io", "waypoint-io", "packer-io", "vagrant-io",
  "terraform-io", "atlantis-run", "terragrunt", "terraspace",
  "ansible-jobs", "puppet-jobs", "chef-io", "saltstack",
  "prometheus-jobs", "alertmanager", "pagerduty-jobs", "opsgenie-jobs",
  "victorops", "blameless-io", "firehydrant-jobs", "rootly-jobs",
  "incident-io", "statuspage", "cachet-jobs", "freshstatus",
  // Batch 7 — Developer tools & infra
  "gitpod", "coder-com", "devpod-io", "daytona-io",
  "codespaces", "replit-jobs", "glitch-com", "codesandbox",
  "stackblitz", "bolt-new", "val-town", "runkit",
  "supabase-jobs", "neon-tech", "turso-tech", "planetscale-jobs",
  "fauna-jobs", "convex-dev", "deno-land", "bun-sh",
  "fly-io-jobs", "koyeb", "cyclic-sh", "railway-jobs",
  "render-jobs-app", "heroku", "dokku", "coolify",
  "caprover", "portainer", "rancher-jobs", "k3s-io",
  "talos-linux", "flatcar", "bottlerocket-os", "alpine-linux",
  "nixos-jobs", "guix-jobs", "void-linux", "gentoo",
  // Batch 7 — More AI startups
  "character-ai", "inflection-ai", "xai-corp", "mistral-ai",
  "stability-jobs", "midjourney-jobs", "runway-ml", "pika-labs",
  "luma-ai", "sora-labs", "kling-ai", "hailuo",
  "eleven-labs-jobs", "murf-ai", "play-ht-jobs", "resemble-ai",
  "deepl-jobs", "translate-ai", "lilt-jobs", "unbabel",
  "jasper-ai-jobs", "copy-ai-jobs", "writesonic-jobs", "rytr-jobs",
  "grammarly-jobs", "languagetool", "hemingway", "wordtune",
  "synthesis-jobs", "synthesia-jobs", "heygen-jobs", "d-id-jobs",
  "deepbrain-ai", "hourone", "colossyan", "pictory",
  "descript-jobs", "podcastle", "cleanvoice", "krisp",
  "assemblyai", "rev-jobs", "otter-ai-jobs", "fireflies-ai",
  "fathom-video", "avoma-jobs", "grain-video", "gong-jobs",
  // Batch 7 — Modern SaaS
  "attio-jobs", "clay-run", "apollo-io-jobs", "lusha-jobs",
  "zoominfo-jobs", "clearbit-jobs", "cognism-jobs", "rocketreach",
  "hunter-io-jobs", "snov-io-jobs", "voilanorbert-jobs", "findthatlead",
  "lemlist-jobs", "woodpecker-co", "mailshake-jobs", "reply-io",
  "instantly-ai", "smartlead-ai", "salesloft-jobs", "outreach-io",
  "gong-io", "clari-jobs", "aviso-jobs", "ebsta",
  "wingman-jobs", "jiminny", "refract-io", "modjo-jobs",
  "leexi", "meetRecord", "fireflies-jobs", "chorus-jobs",
  "productboard-jobs", "aha-io-jobs", "roadmunk-jobs", "craft-io-jobs",
  "airfocus-jobs", "productplan-jobs", "dragonboat-io", "mooncamp",
  "perdoo-jobs", "gtmhub-jobs", "profit-co", "workboard",
  "cascade-strategy", "quantive-io", "ally-io", "weekdone",
  // Batch 7 — Horizontal SaaS
  "intercom-jobs", "zendesk-jobs", "freshdesk-jobs", "helpscout-jobs",
  "gorgias-jobs", "re-amaze-jobs", "tidio-jobs", "crisp-jobs",
  "drift-jobs", "qualified-jobs", "chilipiper-jobs", "calendly-jobs",
  "savvycal-jobs", "reclaim-ai", "clockwise-jobs", "motion-hq",
  "notion-jobs", "coda-jobs", "airtable-jobs", "smartsheet-jobs",
  "monday-jobs", "asana-jobs", "clickup-jobs", "linear-jobs",
  "height-app", "shortcut-jobs", "basecamp-jobs", "twist-jobs",
  "slack-jobs", "discord-jobs", "telegram-jobs", "signal-jobs",
  "zoom-jobs", "webex-jobs", "ringcentral-jobs", "vonage-jobs",
  "livekit-jobs", "daily-co", "whereby-jobs", "agora-io-jobs",
  "mux-jobs", "api-video-jobs", "cloudinary-jobs", "imgix-jobs",
  "fastly-img", "bunny-net", "imagekit", "uploadcare",
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
  "stripe", "brex", "ramp", "found",
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
  // New additions
  "netflix", "uber", "lyft", "airbnb", "dropbox",
  "reddit", "duolingo", "discord", "canva",
  // Batch 3
  "spotify", "twitter", "pinterest", "snapchat", "tiktok",
  "robinhood", "coinbase", "kraken", "gemini", "chainalysis",
  "doordash", "instacart", "grubhub", "postmates", "gopuff",
  "wayfair", "chewy", "etsy", "poshmark", "mercari",
  "peloton", "mirror", "whoop", "oura", "garmin",
  "noom", "hims", "cerebral", "headspace", "calm",
  "oscar", "devoted", "clover", "cityblock", "turquoise",
  "opendoor", "offerpad", "compass", "redfin", "homepoint",
  "faire", "ankorstore", "gorgias", "rechargepay",
  "postscript", "smartrr", "skio", "loop",
  "chargebee", "zuora", "maxio", "paddle", "lemon-squeezy",
  "stripe-climate", "pachama", "terrapass", "southpole", "respira",
  // Batch 5 — Media & Entertainment
  "buzzfeed", "vox", "vice", "insider", "axios",
  "substack", "ghost", "medium", "squarespace",
  "patreon", "ko-fi", "gumroad", "podia",
  "teachable", "thinkific", "kajabi", "circle", "mighty-networks",
  "audible", "scribd", "storytel",
  "pluralsight",
  // Batch 5 — Logistics & Supply Chain
  "forto", "freightos", "beacon", "zencargo",
  "fourkites", "descartes", "e2open", "kinaxis",
  "stord", "flowspace", "deliverr", "whiplash",
  "bringg", "onfleet", "routific", "workwave",
  "verizon-connect", "geotab", "fleetcomplete",
  "transfix", "convoy", "coyote",
  // Batch 5 — Real Estate Tech
  "knock", "orchard", "flyhomes",
  "homeward", "ribbon", "landis", "divvy", "zerodown",
  "roofstock", "fundrise", "crowdstreet", "yieldstreet", "cadre",
  "buildium", "appfolio", "yardi", "realpage",
  "thumbtack", "angi", "houzz", "buildzoom",
  "procore", "egnyte", "fieldwire", "buildertrend",
  // Batch 5 — Food & Restaurant Tech
  "touchbistro", "olo", "omnivore",
  "paytronix", "punchh", "thanx", "fivestars",
  "ovation", "popmenu", "birdeye", "reputation",
  "yext", "uberall", "synup", "brightlocal",
  // Batch 5 — Legal & Compliance
  "mycase", "smokeball", "filevine",
  "litify", "neos", "actionstep", "cosmolex", "rocketmatter",
  "nextpoint", "kira", "luminance", "legl", "onit", "brightflag",
  // Batch 6 — More Consumer & Enterprise
  "Figma", "Canva", "Miro", "Notion", "Coda",
  "Airtable", "Smartsheet", "Monday", "Asana", "ClickUp",
  "Linear", "Height", "Shortcut", "Basecamp", "Twist",
  "Loom", "Screencast-O-Matic", "Vimeo", "Wistia",
  "Descript", "Otter", "Fireflies", "Fathom",
  "Calendly", "Cal", "Savvycal", "Reclaim",
  "Zoom", "Webex", "Teams", "Google-Meet",
  "Slack", "Discord", "Twist", "Rocket-Chat",
  "Intercom", "Zendesk", "Freshdesk", "Help-Scout",
  "Gong", "Chorus", "Avoma", "Grain",
  "Apollo", "Outreach", "Salesloft", "Reply",
  "Pipedrive", "Close", "Hubspot", "Salesforce",
  // Batch 6 — Big Tech & Established
  "Apple", "Google", "Microsoft", "Amazon", "Meta",
  "Salesforce", "Oracle", "SAP", "IBM", "Adobe",
  "Workday", "ServiceNow", "Splunk", "Tableau", "Zendesk",
  "Box", "Dropbox", "Slack", "Zoom", "Okta",
  "CrowdStrike", "Palo-Alto-Networks", "Fortinet",
  "HubSpot", "Klaviyo", "Braze", "Amplitude",
  // Batch 6 — Fintech
  "Plaid", "Stripe", "Brex", "Ramp", "Mercury",
  "Chime", "Robinhood", "Coinbase", "Kraken", "Gemini",
  "SoFi", "Betterment", "Wealthfront", "Acorns",
  "NerdWallet", "Credit-Karma", "LendingClub",
  "Marqeta", "Adyen", "Checkout", "Mollie",
  "Yapily", "TrueLayer", "Plaid-UK", "Salt-Edge",
  "Tink", "Nordigen", "Finicity", "Akoya",
  // Batch 6 — Healthcare
  "Moderna", "Genentech", "Regeneron", "BioNTech",
  "Hims-Hers", "Ro", "Nurx", "Wisp",
  "One-Medical", "Carbon-Health", "Oak-Street",
  "Teladoc", "Amwell", "MDLive", "Doctor-On-Demand",
  "Veeva", "Medidata", "Parexel", "ICON",
  "Flatiron", "Tempus", "Syapse", "Nference",
  // Batch 6 — Logistics & Supply Chain
  "Flexport", "Forto", "Freight-Quote", "Echo-Global",
  "Project44", "Fourkites", "Shippeo", "Wakeo",
  "Stord", "Flowspace", "Deliverr", "ShipBob",
  "Packiyo", "Shipmonk", "Whitebox", "Whiplash",
  "Bringg", "Onfleet", "Routific", "OptimoRoute",
  "Circuit", "Tookan", "Detrack", "Locus",
  "Transfix", "Convoy", "Uber-Freight", "Relay",
  // Batch 6 — E-commerce & Retail
  "Shopify", "BigCommerce", "Magento", "WooCommerce",
  "Recharge", "Bold", "Nacelle", "Shogun",
  "Gorgias", "Yotpo", "Okendo", "Stamped",
  "Attentive", "Postscript", "SMSBump", "Klaviyo",
  "Privy", "Justuno", "Privy", "Drip",
  "Returnly", "Loop", "AfterShip", "Narvar",
  "Shipstation", "Shippo", "EasyShip", "Easypost",
  "Skubana", "Linnworks", "Brightpearl", "Veeqo",
  // Batch 6 — Travel & Hospitality
  "Airbnb", "VRBO", "Booking", "Expedia",
  "Hopper", "Kayak", "Skyscanner", "Google-Flights",
  "TripAdvisor", "Viator", "GetYourGuide", "Klook",
  "Sonder", "Zeus", "Landing", "Blueground",
  "Vacasa", "AvantStay", "Evolve", "Turnkey",
  "HotelTonight", "HostelWorld", "Hostelworld",
  // Batch 6 — Media & Entertainment
  "Spotify", "Apple-Music", "Tidal", "SoundCloud",
  "Netflix", "Hulu", "Disney-Plus", "Peacock",
  "HBO-Max", "Paramount-Plus", "Pluto-TV",
  "YouTube", "Twitch", "Kick", "Rumble",
  "TikTok", "Instagram", "Snapchat", "Pinterest",
  "Reddit", "Discord", "Telegram", "Signal",
  "Substack", "Ghost", "Patreon", "Ko-Fi",
  // Batch 6 — Automotive & Mobility
  "Tesla", "Rivian", "Lucid", "Fisker",
  "Waymo", "Cruise", "Aurora", "Motional",
  "Zoox", "May-Mobility", "Nuro", "Einride",
  "Lime", "Bird", "Spin", "Superpedestrian",
  "Turo", "Getaround", "Ridecell", "Kyte",
  "Carvana", "Vroom", "Shift", "CarDoor",
  // Batch 6 — PropTech
  "Opendoor", "Offerpad", "Orchard", "Flyhomes",
  "Homeward", "Ribbon", "Knock", "ZeroDown",
  "Roofstock", "Fundrise", "CrowdStreet", "Cadre",
  "Buildium", "AppFolio", "Yardi", "RealPage",
  "Procore", "PlanGrid", "Fieldwire", "Buildertrend",
  "CoStar", "Loopnet", "Ten-X", "Crexi",
  // Batch 7 — Enterprise & Big Tech
  "Apple", "Google", "Microsoft", "Amazon", "Meta",
  "Netflix", "Uber", "Lyft-Jobs", "Airbnb-Jobs", "Pinterest-Jobs",
  "Twitter", "Snap", "TikTok-Jobs", "Reddit-Jobs", "Quora-Jobs",
  "Salesforce-Jobs", "Oracle-Jobs", "SAP-Jobs", "IBM-Jobs", "Adobe-Jobs",
  "Workday-Jobs", "ServiceNow-Jobs", "Splunk-Jobs", "Tableau-Jobs",
  "Box-Jobs", "Dropbox-Jobs", "DocuSign-Jobs", "Zoom-Jobs", "Okta-Jobs",
  "HubSpot", "Klaviyo-Jobs", "Braze-Jobs", "Amplitude-Jobs",
  "Plaid-Jobs", "Stripe-Jobs", "Brex-Jobs", "Ramp-Jobs", "Mercury-Jobs",
  "Chime-Jobs", "Robinhood-Jobs", "Coinbase-Jobs", "Kraken-Jobs",
  "Moderna", "Genentech", "Regeneron", "BioNTech",
  "Waymo-Jobs", "Cruise-Jobs", "Aurora-Jobs", "Motional",
  "Tesla-Jobs", "Rivian", "Lucid-Motors", "Fisker",
  "SpaceX", "BlueOrigin", "RocketLab", "Relativity",
  "Palantir-Jobs", "Anduril", "Shield-AI", "Joby",
  "Flexport-Jobs", "Project44", "Samsara-Jobs", "Motive-Jobs",
  "DoorDash-Jobs", "Instacart-Jobs", "Gopuff", "Grubhub-Jobs",
  "Wayfair-Jobs", "Chewy-Jobs", "Etsy-Jobs", "Poshmark-Jobs",
  "Shopify-Jobs", "BigCommerce-Jobs", "Magento", "WooCommerce",
  "Faire-Jobs", "Ankorstore", "Gorgias-Jobs", "Rechargepay",
  // Batch 7 — Growth-stage startups
  "Vercel-Open", "Supabase-Open", "PlanetScale-Open", "Neon-Open",
  "Turso-Open", "Convex-Open", "Upstash-Open", "Fly-Open",
  "Railway-Open", "Render-Open", "Deno-Open", "Bun-Open",
  "Cloudflare-Workers", "Fastly-Open", "Akamai-Open",
  "Temporal-Open", "Inngest-Open", "Trigger-Open", "Windmill-Open",
  "n8n-Open", "Make-Open", "Zapier-Open", "Workato-Open",
  "Retool-Open", "Tooljet-Open", "Budibase-Open", "Appsmith-Open",
  "Webflow-Open", "Framer-Open", "Plasmic-Open", "Builder-Open",
  "Sanity-Open", "Contentful-Open", "Storyblok-Open", "Prismic-Open",
  "Strapi-Open", "Directus-Open", "Payload-Open", "Keystone-Open",
  "Ghost-Open", "Medium-Open", "Substack-Open", "Beehiiv",
  "ConvertKit", "Mailchimp-Open", "Klaviyo-Open", "Drip-Open",
  "ActiveCampaign", "Keap", "Ontraport", "Hubspot-Open",
  "Pipedrive-Open", "Close-CRM", "Copper-CRM", "Freshsales",
  "Zoho-CRM", "Vtiger", "Insightly", "Streak",
  "Salesforce-Open", "Dynamics-365", "SugarCRM", "Creatio",
  // Batch 7 — Fintech & Payments
  "Adyen-Open", "Mollie-Open", "Checkout-Open", "Stripe-Open",
  "Braintree", "Square-Open", "PayPal-Open", "Venmo", "Zelle",
  "Marqeta-Open", "Highnote", "Lithic-Open", "Apto-Open",
  "Deserve-Open", "Tally-Open", "Dave-Open", "Chime-Open",
  "Current-Open", "Varo-Open", "Step-Open", "Copper-Open",
  "Greenlight-Open", "Pixpay", "Kard-Open", "Mozper",
  "Navan-Open", "Expensify-Open", "Rho-Open", "Airbase-Open",
  "Spendesk-Open", "Payhawk-Open", "Pleo-Open", "Soldo-Open",
  "Jeeves-Open", "Pomelo-Open", "Tribal-Open", "Extend-Open",
  "Synctera-Open", "Column-Open", "Bond-Open", "Unit-Open",
  "Alpaca-Open", "DriveWealth", "Apex-Clearing", "Tradier",
  "Robinhood-Open", "Webull", "M1-Finance", "Acorns-Open",
  "Betterment-Open", "Wealthfront-Open", "Personal-Capital", "SoFi-Open",
  "LendingClub-Open", "Prosper-Open", "Avant-Open", "LendingTree",
  "Credible-Open", "Earnest-Open", "CommonBond", "Splash",
  "Blend-Open", "Better-Open", "Loansnap", "Roostify",
  "Opendoor-Open", "Offerpad-Open", "Orchard-Open", "Flyhomes",
  // Batch 7 — HR Tech & Recruiting
  "Greenhouse-Jobs", "Lever-Jobs", "Ashby-Jobs", "Teamtailor",
  "Workable-Jobs", "Recruitee-Jobs", "Breezyhr-Jobs", "Zoho-Recruit",
  "SmartRecruiters-Jobs", "iCIMS", "Jobvite-Jobs", "Taleo-Jobs",
  "Greenhouse-ATS", "Lever-ATS", "Jazz-HR", "ApplicantPro",
  "Bullhorn-Jobs", "Crelate", "Vincere-Jobs", "Avionté",
  "Beamery-Jobs", "Eightfold-Jobs", "Phenom-People", "SeekOut",
  "Fetcher-Jobs", "HireEZ", "Entelo", "Hiretual",
  "Gem-Jobs", "Dover-Jobs", "Drafted", "Talent-Inc",
  "Toptal-Jobs", "Andela-Jobs", "Contra-Jobs", "Braintrust-Jobs",
  "Lemon-IO", "Arc-Dev", "Turing-Jobs", "Gigster",
  // Batch 7 — Media, Gaming & Entertainment
  "Spotify-Open", "Soundcloud-Open", "Deezer-Open", "Tidal-Open",
  "Apple-Music", "Amazon-Music", "YouTube-Music", "Pandora-Open",
  "Netflix-Open", "Hulu-Open", "Disney-Plus-Open", "Peacock-Open",
  "HBO-Max-Open", "Paramount-Plus-Open", "Apple-TV", "Amazon-Prime",
  "Twitch-Open", "Kick-Open", "Rumble-Open", "Trovo",
  "YouTube-Open", "Dailymotion", "Vimeo-Open", "Wistia-Open",
  "Unity-Open", "Unreal-Engine", "Godot", "Roblox-Open",
  "EA-Open", "Activision", "Blizzard", "2K-Games",
  "Ubisoft-Open", "Square-Enix", "Konami", "Bandai-Namco",
  "Riot-Games", "Supercell", "King-Games", "Zynga-Open",
  "Niantic-Open", "Scopely", "Jam-City", "Kabam",
  "Epic-Games", "Valve", "CD-Projekt", "Larian-Studios",
  // Batch 8 — more to reach 1000
  "Stripe-Jobs", "Square-Jobs", "PayPal-Jobs", "Adyen-Jobs",
  "Klarna-Jobs", "Affirm-Jobs", "Afterpay", "Sezzle",
  "Zip-Pay", "Splitit", "Paidy", "Laybuy",
  "Tabby", "Tamara", "Postpay", "Scalapay",
  "Ebury", "Wise-Jobs", "Remitly", "WorldRemit",
  "Western-Union", "MoneyGram", "Xoom", "Azimo",
  "Airwallex", "Currencycloud", "OFX", "TransferMate",
  "Flutterwave", "Paystack-Jobs", "Chipper-Cash", "Wave-Money",
  "Mpesa", "MTN-Fintech", "Orange-Money", "Airtel-Money",
  "TymeBank", "Bank-Zero", "Discovery-Bank", "Capitec",
  "Nubank-Jobs", "C6-Bank", "Neon-Bank", "Inter-Bank",
  "PicPay", "Mercado-Pago", "Boa-Compra", "Cielo",
  "Getnet", "Rede-Pay", "PagSeguro", "Pagseguro-Jobs",
  "Rappi-Jobs", "iFood", "Pedidos-Ya", "Cornershop",
  "Glovo-Jobs", "Yandex-Eats", "Delivery-Club", "Samokat",
  "Buyk", "Flink-Jobs", "Gorillas-Jobs", "Getir-Jobs",
  "Zapp-IO", "Jiffy-App", "Dija", "Weezy",
  "Cajoo", "Everli", "Picnic-Jobs", "Kolonial",
  "Oda-Jobs", "Matsmart", "Motatos", "Too-Good-To-Go",
  "Olio-App", "Karma-App", "Phenix", "Leanpath",
  "Apeel-Sciences", "Hazel-Technologies", "AgroStar", "DeHaat",
  "Ninjacart", "Waycool", "Khetika", "BigHaat",
  "Bijak", "Arya-AG", "FarmLink", "Produce-Pay",
  "Mercaris", "Granular-Ag", "Climate-Corporation", "Bushel",
  "Farmers-Edge", "Ag-Leader", "Trimble-Ag", "John-Deere-Tech",
  "Raven-Industries", "Monarch-Tractor", "Sabanto", "Naio",
  "Iron-Ox", "AppHarvest", "Plenty-Ag", "Bowery-Farming",
  "AeroFarms", "Gotham-Greens", "Little-Leaf", "Local-Bounti",
  "Infarm", "Vertical-Harvest", "Revol-Greens", "Fifth-Season",
  "Kalera", "Oishii", "Shenandoah-Growers", "Village-Farms",
  "BrightFarms", "Mucci-Farms", "NatureSweet", "Mastronardi",
  // Batch 9 — fill to 1000
  "Ironclad-Jobs", "Clio-Jobs", "MyCase", "Smokeball",
  "Filevine-Jobs", "Litify", "Neos-Nola", "Actionstep",
  "Cosmolex", "Rocketmatter", "Nextpoint", "Kira-Systems",
  "Luminance-AI", "Legl-Jobs", "Onit-Jobs", "Brightflag",
  "Relativity-Jobs", "Everlaw-Jobs", "Logikcull", "Disco-eDiscovery",
  "Thomson-Reuters-Jobs", "LexisNexis", "Westlaw", "Fastcase",
  "Casetext", "Lex-Machina", "Docket-Alarm", "Bloomberg-Law",
  "ALM-Media", "Above-The-Law", "Law-com", "National-Law",
  "Orion-Legal", "Legal-Tracker", "Mitratech", "Wolters-Kluwer",
  "Epiq-Jobs", "Conduent", "Exlservice", "WNS-Global",
  "EXL-Analytics", "Genpact-Jobs", "Cognizant", "Infosys",
  "Wipro-Jobs", "TCS-Jobs", "HCL-Jobs", "Tech-Mahindra",
  "Mphasis", "Hexaware", "Mastech-Digital", "NIIT-Technologies",
  "Persistent-Systems", "Zensar", "Birlasoft", "Sonata-Software",
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
    const industries = ["marketing", "design", "hr", "finance", "all"];
    const results = await Promise.all(industries.map(async (industry) => {
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&geo=usa&industry=${industry}`, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "JobMatch/1.0" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.jobs || []).map((job: any) => ({
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
    }));
    const flat = results.flat();
    console.log(`Jobicy: fetched ${flat.length} jobs`);
    return flat;
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
  const allJobs: any[] = [];
  const MAX_PAGES = 10;
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&descending=true`,
        { headers: { "User-Agent": "JobMatch/1.0" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!data.results || data.results.length === 0) break;

      for (const job of data.results) {
        if (!job.id || !job.name) continue;
        const record: any = {
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
        };
        allJobs.push(record);
      }
      if (page === 0 && allJobs[0]) {
        console.log("Muse job sample:", JSON.stringify(allJobs[0]));
      }
      if (page >= data.page_count - 1) break;
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`TheMuse: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("TheMuse error:", e.message);
    return allJobs;
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
  { tenant: "qualcomm",   instance: "wd1",  board: "External",                  name: "Qualcomm" },
  { tenant: "amd",        instance: "wd5",  board: "External",                  name: "AMD" },
  { tenant: "broadcom",   instance: "wd5",  board: "External",                  name: "Broadcom" },
  { tenant: "hp",         instance: "wd5",  board: "External",                  name: "HP" },
  { tenant: "dell",       instance: "wd5",  board: "External",                  name: "Dell Technologies" },
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
  { tenant: "micron",     instance: "wd5",  board: "External",                  name: "Micron Technology" },
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

async function fetchGoogle(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(
        `https://careers.google.com/api/v3/search/?query=&num=20&page=${page}&company=Google&company=YouTube&company=GoogleDeepMind`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.jobs || [];
      if (!jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `goog_${job.id || job.job_id}`,
          title: job.title || "",
          company: job.company_name || "Google",
          location: job.locations?.[0]?.display || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "Google Careers",
          posted_date: "",
          apply_url: `https://careers.google.com/jobs/results/${job.id || job.job_id}`,
          description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
        });
      }
      if (jobs.length < 20) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Google Careers: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Google Careers error:", e.message);
    return [];
  }
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
          description: (job.description || job.basic_qualifications || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
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

async function fetchMicrosoft(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let pg = 1; pg <= 10; pg++) {
      const res = await fetch(
        `https://gcsservices.careers.microsoft.com/search/api/v1/search?q=&l=en_us&pg=${pg}&pgSz=20&o=Relevance&flt=true`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.operationResult?.result?.jobs || [];
      if (!jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `ms_${job.jobId}`,
          title: job.title || "",
          company: "Microsoft",
          location: job.primaryLocation || "Remote",
          salary: "",
          job_type: job.employmentType || "Full-time",
          source: "Microsoft Careers",
          posted_date: job.postingDate ? new Date(job.postingDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
          apply_url: `https://careers.microsoft.com/en/us/job/${job.jobId}`,
          description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
        });
      }
      if (jobs.length < 20) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Microsoft Careers: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Microsoft Careers error:", e.message);
    return [];
  }
}

async function fetchMeta(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(
        `https://www.metacareers.com/api/jobs/?offices=&roles=&is_leadership=0&is_university=0&results_per_page=100&page=${page}&sort_by_new=false`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)",
            "Accept": "application/json",
            "Referer": "https://www.metacareers.com/jobs",
          },
          signal: AbortSignal.timeout(15000),
        }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.jobs || data.data || [];
      if (!Array.isArray(jobs) || !jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `meta_${job.id}`,
          title: job.title || "",
          company: "Meta",
          location: job.locations?.join(", ") || job.location || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "Meta Careers",
          posted_date: "",
          apply_url: `https://www.metacareers.com/jobs/${job.id}`,
          description: (job.description || job.roles_responsibilities || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
        });
      }
      if (jobs.length < 100) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Meta Careers: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Meta Careers error:", e.message);
    return [];
  }
}

async function fetchTesla(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let offset = 0; offset < 500; offset += 50) {
      const res = await fetch(
        `https://www.tesla.com/cua-api/tesla-jobs/search?query=&country=US&limit=50&offset=${offset}`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.results || data.jobs || [];
      if (!Array.isArray(jobs) || !jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `tesla_${job.id || job.jobReqId}`,
          title: job.title || job.jobTitle || "",
          company: "Tesla",
          location: job.location || job.jobLocation || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "Tesla Careers",
          posted_date: job.postDate ? new Date(job.postDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
          apply_url: job.applyUrl || `https://www.tesla.com/careers/search/job/${job.id || job.jobReqId}`,
          description: (job.description || job.jobDescription || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
        });
      }
      if (jobs.length < 50) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Tesla Careers: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Tesla Careers error:", e.message);
    return [];
  }
}

async function fetchApple(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(
        `https://jobs.apple.com/api/role/search?page=${page}&locale=en-US&filters[location][]=USA`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.searchResults || data.results || [];
      if (!Array.isArray(jobs) || !jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `apple_${job.positionId || job.id}`,
          title: job.postingTitle || job.title || "",
          company: "Apple",
          location: job.locations?.[0]?.name || job.homeOffice || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "Apple Careers",
          posted_date: job.postDateInGMT ? new Date(job.postDateInGMT).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
          apply_url: `https://jobs.apple.com/en-us/details/${job.positionId || job.id}`,
          description: (job.jobSummary || "").substring(0, 3000),
        });
      }
      if (jobs.length < 20) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Apple Careers: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Apple Careers error:", e.message);
    return [];
  }
}

async function fetchNetflixCareers(): Promise<any[]> {
  try {
    const allJobs: any[] = [];
    for (let page = 0; page < 10; page++) {
      const res = await fetch(
        `https://jobs.netflix.com/api/search?page=${page}`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.records?.postings || data.postings || [];
      if (!Array.isArray(jobs) || !jobs.length) break;
      for (const job of jobs) {
        allJobs.push({
          id: `netflix_${job.external_id || job.id}`,
          title: job.text || job.title || "",
          company: "Netflix",
          location: job.location || "Remote",
          salary: "",
          job_type: "Full-time",
          source: "Netflix Careers",
          posted_date: job.created_at ? new Date(job.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
          apply_url: job.urls?.apply || `https://jobs.netflix.com/jobs/${job.external_id || job.id}`,
          description: (job.content?.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
        });
      }
      if (jobs.length < 20) break;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Netflix Careers: fetched ${allJobs.length} jobs`);
    return allJobs;
  } catch (e: any) {
    console.error("Netflix Careers error:", e.message);
    return [];
  }
}

async function fetchPalantir(): Promise<any[]> {
  try {
    const res = await fetch(
      "https://www.palantir.com/careers/open-positions/data.json",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) {
      // Fallback: Lever API for palantir
      const lever = await fetch("https://api.lever.co/v0/postings/palantir?mode=json&limit=100", { signal: AbortSignal.timeout(10000) });
      if (!lever.ok) return [];
      const data = await lever.json();
      if (!Array.isArray(data)) return [];
      return data.map((job: any) => ({
        id: `palantir_${job.id}`,
        title: job.text || "",
        company: "Palantir",
        location: job.categories?.location || "Remote",
        salary: "",
        job_type: job.categories?.commitment || "Full-time",
        source: "Palantir Careers",
        posted_date: job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
        apply_url: job.hostedUrl || `https://www.palantir.com/careers/open-positions/${job.id}`,
        description: (job.descriptionPlain || "").substring(0, 3000),
      }));
    }
    const data = await res.json();
    const jobs = data.positions || data.jobs || [];
    return jobs.map((job: any) => ({
      id: `palantir_${job.id}`,
      title: job.title || "",
      company: "Palantir",
      location: job.location || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Palantir Careers",
      posted_date: "",
      apply_url: job.url || "https://www.palantir.com/careers/open-positions/",
      description: (job.description || "").substring(0, 3000),
    }));
  } catch (e: any) {
    console.error("Palantir error:", e.message);
    return [];
  }
}

async function fetchStripe(): Promise<any[]> {
  try {
    const res = await fetch(
      "https://stripe.com/jobs/search.json",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : (data.jobs || data.results || []);
    return jobs.map((job: any) => ({
      id: `stripe_${job.id}`,
      title: job.title || "",
      company: "Stripe",
      location: job.location || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Stripe Careers",
      posted_date: "",
      apply_url: job.absolute_url || `https://stripe.com/jobs/listing/${job.id}`,
      description: (job.content || job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch (e: any) {
    console.error("Stripe error:", e.message);
    return [];
  }
}

async function fetchCoinbase(): Promise<any[]> {
  try {
    const res = await fetch(
      "https://www.coinbase.com/careers/api/v1/positions",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.data || data.positions || data || [];
    if (!Array.isArray(jobs)) return [];
    return jobs.map((job: any) => ({
      id: `coinbase_${job.id}`,
      title: job.title || "",
      company: "Coinbase",
      location: job.location || job.country || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Coinbase Careers",
      posted_date: "",
      apply_url: job.absolute_url || `https://www.coinbase.com/careers/positions/${job.id}`,
      description: (job.content || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch (e: any) {
    console.error("Coinbase error:", e.message);
    return [];
  }
}

async function fetchDatabricks(): Promise<any[]> {
  try {
    const res = await fetch(
      "https://www.databricks.com/company/careers/open-positions/search-results.json?offset=0&limit=100",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) {
      // Fallback to Greenhouse
      return fetchGreenhouse("databricks");
    }
    const data = await res.json();
    const jobs = data.jobs || data.results || data || [];
    if (!Array.isArray(jobs)) return fetchGreenhouse("databricks");
    return jobs.map((job: any) => ({
      id: `db_${job.id}`,
      title: job.title || "",
      company: "Databricks",
      location: job.location || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Databricks Careers",
      posted_date: "",
      apply_url: job.url || `https://www.databricks.com/company/careers/open-positions/${job.id}`,
      description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch { return fetchGreenhouse("databricks"); }
}

async function fetchUber(): Promise<any[]> {
  try {
    const res = await fetch(
      "https://www.uber.com/api/loadSearchJobsResults?params=%7B%22query%22%3A%22%22%2C%22location%22%3A%22%22%2C%22department%22%3A%22%22%2C%22team%22%3A%22%22%2C%22country%22%3A%22USA%22%7D",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)",
          "Accept": "application/json",
          "x-csrf-jwt": "v1",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.data?.results || data.results || [];
    return jobs.map((job: any) => ({
      id: `uber_${job.id}`,
      title: job.title || "",
      company: "Uber",
      location: job.location || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Uber Careers",
      posted_date: "",
      apply_url: job.url || `https://www.uber.com/us/en/careers/list/${job.id}/`,
      description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch (e: any) {
    console.error("Uber error:", e.message);
    return [];
  }
}

async function fetchAtlassian(): Promise<any[]> {
  try {
    const res = await fetch(
      "https://www.atlassian.com/company/careers/detail/api/jobs",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; JobMatch/1.0)", "Accept": "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || data.results || data || [];
    if (!Array.isArray(jobs)) return [];
    return jobs.map((job: any) => ({
      id: `atl_${job.id}`,
      title: job.title || "",
      company: "Atlassian",
      location: job.location || "Remote",
      salary: "",
      job_type: "Full-time",
      source: "Atlassian Careers",
      posted_date: "",
      apply_url: job.url || `https://www.atlassian.com/company/careers/detail/${job.id}`,
      description: (job.description || "").replace(/<[^>]+>/g, " ").substring(0, 3000),
    }));
  } catch (e: any) {
    console.error("Atlassian error:", e.message);
    return [];
  }
}

// ─── EightFold config ─────────────────────────────────────────────────────────
const EIGHTFOLD_COMPANIES = [
  { host: "paypal",  domain: "paypal.com",  name: "PayPal" },
  { host: "target",  domain: "target.com",  name: "Target" },
  { host: "walmart", domain: "walmart.com", name: "Walmart" },
  { host: "nike",    domain: "nike.com",    name: "Nike" },
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

  const validJobs = cleanedJobs.filter(j => j.id && j.title && j.source);

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (source === "remotejobs" || source === "all") {
    const results = await Promise.all(REMOTEJOBS_CATEGORIES.map(fetchRemoteJobs));
    jobs.push(...results.flat());
  }
  if (source === "remotive" || source === "arbeitnow" || source === "jobicy" || source === "themuse" || source === "all") {
    const settled = await Promise.allSettled([
      source === "remotive" || source === "all" ? fetchRemotive() : Promise.resolve([]),
      source === "arbeitnow" || source === "all" ? fetchArbeitnow() : Promise.resolve([]),
      source === "jobicy" || source === "all" ? fetchJobicy() : Promise.resolve([]),
      source === "themuse" || source === "all" ? fetchMuse() : Promise.resolve([]),
    ]);
    for (const r of settled) {
      if (r.status === "fulfilled") jobs.push(...r.value);
      else console.error("Source failed:", r.reason);
    }
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

  // ─── Direct career pages ──────────────────────────────────────────────────
  if (source === "workday" || source === "all") {
    const results = await Promise.all(WORKDAY_COMPANIES.map(fetchWorkday));
    jobs.push(...results.flat());
  }
  if (source === "google" || source === "all") {
    jobs.push(...await fetchGoogle());
  }
  if (source === "amazon" || source === "all") {
    jobs.push(...await fetchAmazon());
  }
  if (source === "microsoft" || source === "all") {
    jobs.push(...await fetchMicrosoft());
  }
  if (source === "meta" || source === "all") {
    jobs.push(...await fetchMeta());
  }
  if (source === "tesla" || source === "all") {
    jobs.push(...await fetchTesla());
  }
  if (source === "apple" || source === "all") {
    jobs.push(...await fetchApple());
  }
  if (source === "netflix" || source === "all") {
    jobs.push(...await fetchNetflixCareers());
  }
  if (source === "palantir" || source === "all") {
    jobs.push(...await fetchPalantir());
  }
  if (source === "stripe" || source === "all") {
    jobs.push(...await fetchStripe());
  }
  if (source === "coinbase" || source === "all") {
    jobs.push(...await fetchCoinbase());
  }
  if (source === "databricks" || source === "all") {
    jobs.push(...await fetchDatabricks());
  }
  if (source === "uber" || source === "all") {
    jobs.push(...await fetchUber());
  }
  if (source === "atlassian" || source === "all") {
    jobs.push(...await fetchAtlassian());
  }
  if (source === "eightfold" || source === "all") {
    const results = await Promise.all(EIGHTFOLD_COMPANIES.map(fetchEightfold));
    jobs.push(...results.flat());
  }

  // Deduplicate by id before saving — prevents duplicates from overlapping company lists
  const uniqueJobs = Array.from(new Map(jobs.map(j => [j.id, j])).values());
  const { saved, errors } = await saveToDb(uniqueJobs);
  return NextResponse.json({ success: true, source, fetched: jobs.length, saved, errors });
}
