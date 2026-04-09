/**
 * YC Companies Slug Finder v2
 * Использует Algolia API который использует сам YC сайт
 * Запуск: node find_yc_slugs_v2.js
 */

const https = require('https');
const fs = require('fs');

function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      },
      timeout: 15000
    };
    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: result }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function checkGreenhouse(slug) {
  try {
    const res = await get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    if (res.status !== 200) return 0;
    const data = JSON.parse(res.data);
    return data.jobs ? data.jobs.length : 0;
  } catch { return 0; }
}

async function checkAshby(slug) {
  try {
    const res = await get(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    if (res.status !== 200) return 0;
    const data = JSON.parse(res.data);
    return data.jobs ? data.jobs.length : 0;
  } catch { return 0; }
}

function toSlug(name) {
  return (name || '').toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function fetchAllYCCompanies() {
  console.log('📥 Fetching ALL YC companies via Algolia...');
  
  const companies = [];
  let page = 0;
  const hitsPerPage = 1000;
  
  while (true) {
    const res = await post(
      'https://45bwzj1sgc-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%3B%20JS%20Helper%20(3.16.1)&x-algolia-application-id=45BWZJ1SGC&x-algolia-api-key=NzllNTY5MzJiZGM2OTY2ZTQwMDEzOTNhYWZiZGRjODlhYzVkNjBmOGRjNzJiMWM4ZTU0ZDlhYTZjOTJiMjlhMWFuYWx5dGljc1RhZ3M9eWNkYyZyZXN0cmljdEluZGljZXM9WUNDb21wYW55X3Byb2R1Y3Rpb24lMkNZQ0NvbXBhbnlfQnlfTGF1bmNoX0RhdGVfcHJvZHVjdGlvbiZ0YWdGaWx0ZXJzPSU1QiUyMnljZGNfcHVibGljJTIyJTVE',
      {
        requests: [{
          indexName: 'YCCompany_production',
          params: `hitsPerPage=${hitsPerPage}&page=${page}&attributesToRetrieve=name,slug,website,isHiring`
        }]
      }
    );
    
    if (res.status !== 200) {
      console.log(`Algolia error: ${res.status}`);
      break;
    }
    
    const data = JSON.parse(res.data);
    const hits = data.results?.[0]?.hits || [];
    const nbPages = data.results?.[0]?.nbPages || 0;
    
    companies.push(...hits);
    console.log(`Page ${page + 1}/${nbPages}: got ${hits.length} companies (total: ${companies.length})`);
    
    if (page >= nbPages - 1 || hits.length === 0) break;
    page++;
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  return companies;
}

async function main() {
  const companies = await fetchAllYCCompanies();
  console.log(`\n✅ Total YC companies fetched: ${companies.length}\n`);
  
  if (companies.length === 0) {
    console.log('❌ No companies fetched. Algolia API may have changed.');
    return;
  }

  const greenhouse = [];
  const ashby = [];
  
  const BATCH = 20;
  
  for (let i = 0; i < companies.length; i += BATCH) {
    const batch = companies.slice(i, i + BATCH);
    
    await Promise.all(batch.map(async (company) => {
      // Try both the slug field and derived slug from name
      const slugsToTry = new Set([
        company.slug,
        toSlug(company.name),
        toSlug(company.name?.replace(/\s+/g, '-')),
      ].filter(Boolean));
      
      for (const slug of slugsToTry) {
        if (slug.length < 2) continue;
        
        const [ghCount, ashCount] = await Promise.all([
          checkGreenhouse(slug),
          checkAshby(slug)
        ]);
        
        if (ghCount > 0) {
          greenhouse.push({ slug, jobs: ghCount, name: company.name });
          console.log(`✅ GH: ${slug} (${ghCount} jobs) - ${company.name}`);
          break;
        }
        if (ashCount > 0) {
          ashby.push({ slug, jobs: ashCount, name: company.name });
          console.log(`✅ Ashby: ${slug} (${ashCount} jobs) - ${company.name}`);
          break;
        }
      }
    }));
    
    const done = Math.min(i + BATCH, companies.length);
    if (done % 100 === 0 || done === companies.length) {
      console.log(`\n--- Progress: ${done}/${companies.length} | GH: ${greenhouse.length} | Ashby: ${ashby.length} ---\n`);
      
      // Save intermediate results
      fs.writeFileSync('yc_slugs_v2.json', JSON.stringify({
        greenhouse: greenhouse.map(c => c.slug),
        ashby: ashby.map(c => c.slug),
        greenhouse_details: greenhouse,
        ashby_details: ashby,
        progress: { done, total: companies.length }
      }, null, 2));
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  const result = {
    greenhouse: greenhouse.map(c => c.slug),
    ashby: ashby.map(c => c.slug),
    greenhouse_details: greenhouse,
    ashby_details: ashby,
    summary: {
      total_checked: companies.length,
      greenhouse_found: greenhouse.length,
      ashby_found: ashby.length,
    }
  };
  
  fs.writeFileSync('yc_slugs_v2.json', JSON.stringify(result, null, 2));
  
  console.log('\n🎉 DONE!');
  console.log(`Greenhouse: ${greenhouse.length} | Ashby: ${ashby.length}`);
  console.log('\nGREENHOUSE:', JSON.stringify(greenhouse.map(c => c.slug)));
  console.log('\nASHBY:', JSON.stringify(ashby.map(c => c.slug)));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
