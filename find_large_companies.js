/**
 * Finds large companies on Greenhouse with HR/non-tech jobs
 * Run: node find_large_companies.js
 */
const https = require('https');
const fs = require('fs');

function checkGreenhouse(company) {
  return new Promise((resolve) => {
    const req = https.get(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
      { timeout: 8000 },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const jobs = json.jobs || [];
            const hrJobs = jobs.filter(j =>
              /hr|human resource|people ops|talent|recruit/i.test(j.title)
            );
            resolve({ company, total: jobs.length, hrJobs: hrJobs.length });
          } catch { resolve({ company, total: 0, hrJobs: 0 }); }
        });
      }
    );
    req.on('error', () => resolve({ company, total: 0, hrJobs: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ company, total: 0, hrJobs: 0 }); });
  });
}

const COMPANIES = [
  // Large Tech
  "microsoft", "amazon", "netflix", "spotify", "uber", "lyft",
  "salesforce", "adobe", "intuit", "paypal", "twilio", "okta",
  "zoom", "hubspot", "zendesk", "workday", "docusign", "atlassian",
  "servicenow", "datadog", "crowdstrike", "pagerduty", "dynatrace",
  "monday", "asana", "notion", "airtable", "webflow", "clickup",
  // Finance
  "robinhood", "chime", "marqeta", "affirm", "klarna", "plaid",
  "betterment", "wealthfront", "sofi", "nerdwallet",
  // Healthcare
  "oscar", "devoted", "tempus", "flatiron", "omada", "hims",
  "teladoc", "livongo", "noom", "cerebral",
  // Media & Content
  "buzzfeed", "vox", "patreon", "substack", "beehiiv",
  "soundcloud", "bandcamp", "genius",
  // E-commerce
  "shopify", "etsy", "poshmark", "stockx", "goat", "reverb",
  "mercari", "depop", "thredup",
  // Food & Delivery
  "doordash", "instacart", "gopuff", "grubhub", "caviar",
  "sweetgreen", "chipotle", "dominos",
  // Travel & Hospitality
  "airbnb", "vrbo", "booking", "expedia", "tripadvisor",
  "hopper", "kayak", "skyscanner",
  // Real Estate
  "zillow", "redfin", "compass", "opendoor", "offerpad",
  // Automotive
  "tesla", "rivian", "lucid", "waymo", "cruise", "aurora",
  // Security & Privacy
  "1password", "nordvpn", "protonmail", "bitwarden",
  // HR Tech
  "rippling", "gusto", "lattice", "bamboohr", "greenhouse",
  "lever", "workday", "adp", "paychex", "paylocity",
  // Education
  "coursera", "udemy", "masterclass", "duolingo", "chegg",
  "kahoot", "quizlet", "brainly",
  // Other notable
  "peloton", "bumble", "match", "hinge", "okcupid",
  "pinterest", "reddit", "discord", "twitch",
];

async function main() {
  console.log(`Testing ${COMPANIES.length} companies...\n`);
  
  const found = [];
  const BATCH = 15;
  
  for (let i = 0; i < COMPANIES.length; i += BATCH) {
    const batch = COMPANIES.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(checkGreenhouse));
    
    results.forEach(r => {
      if (r.total > 0) {
        found.push(r);
        const flag = r.hrJobs > 0 ? '🎯' : '✅';
        console.log(`${flag} ${r.company}: ${r.total} jobs (${r.hrJobs} HR)`);
      }
    });
    
    await new Promise(res => setTimeout(res, 500));
    console.log(`Progress: ${Math.min(i + BATCH, COMPANIES.length)}/${COMPANIES.length}`);
  }
  
  console.log('\n\n=== RESULTS ===');
  console.log('All found:', found.map(f => `"${f.company}"`).join(', '));
  console.log('\nWith HR jobs:', found.filter(f => f.hrJobs > 0).map(f => `"${f.company}"`).join(', '));
  
  fs.writeFileSync('large_companies.json', JSON.stringify(found, null, 2));
  console.log('\nSaved to large_companies.json');
}

main().catch(console.error);
