/**
 * YC Companies Slug Finder
 * Запусти: node find_yc_slugs.js
 * Результат сохранится в yc_slugs.json
 */

const https = require('https');
const fs = require('fs');

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
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

async function main() {
  console.log('📥 Fetching YC companies list...');
  
  const ycRes = await get('https://yc-oss.github.io/api/companies/top.json');
  const companies = JSON.parse(ycRes.data);
  console.log(`✅ Got ${companies.length} YC top companies\n`);
  
  const greenhouse = [];
  const ashby = [];
  const notFound = [];
  
  const BATCH = 15;
  
  for (let i = 0; i < companies.length; i += BATCH) {
    const batch = companies.slice(i, i + BATCH);
    
    await Promise.all(batch.map(async (company) => {
      const slug = company.slug || toSlug(company.name || '');
      if (!slug || slug.length < 2) return;
      
      const [ghCount, ashCount] = await Promise.all([
        checkGreenhouse(slug),
        checkAshby(slug)
      ]);
      
      if (ghCount > 0) {
        greenhouse.push({ slug, jobs: ghCount, name: company.name });
        console.log(`✅ Greenhouse: ${slug} (${ghCount} jobs)`);
      } else if (ashCount > 0) {
        ashby.push({ slug, jobs: ashCount, name: company.name });
        console.log(`✅ Ashby: ${slug} (${ashCount} jobs)`);
      } else {
        notFound.push(slug);
      }
    }));
    
    const done = Math.min(i + BATCH, companies.length);
    console.log(`\n--- Progress: ${done}/${companies.length} ---\n`);
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  const result = {
    greenhouse: greenhouse.map(c => c.slug),
    ashby: ashby.map(c => c.slug),
    greenhouse_details: greenhouse,
    ashby_details: ashby,
    not_found: notFound.length,
    summary: {
      total_checked: companies.length,
      greenhouse_found: greenhouse.length,
      ashby_found: ashby.length,
    }
  };
  
  fs.writeFileSync('yc_slugs.json', JSON.stringify(result, null, 2));
  
  console.log('\n🎉 DONE!');
  console.log(`📊 Results:`);
  console.log(`   Greenhouse: ${greenhouse.length} companies with active jobs`);
  console.log(`   Ashby: ${ashby.length} companies with active jobs`);
  console.log(`   Saved to: yc_slugs.json`);
  
  console.log('\n📋 Greenhouse slugs (copy to sync route):');
  console.log(JSON.stringify(greenhouse.map(c => c.slug)));
  
  console.log('\n📋 Ashby slugs (copy to sync route):');
  console.log(JSON.stringify(ashby.map(c => c.slug)));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
