import { NextRequest, NextResponse } from "next/server";

function clean(text: string): string {
  return text
    .replace(/<[^>]*>/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "designer").toLowerCase();

  const companies = [
    "anthropic", "notion", "figma", "linear", "vercel", "stripe",
    "airbnb", "pinterest", "reddit", "shopify", "dropbox",
    "hubspot", "intercom", "zendesk", "asana", "airtable", "canva",
    "discord", "duolingo", "robinhood", "coinbase", "brex", "rippling"
  ];

  const allJobs: any[] = [];

  await Promise.all(
    companies.map(async (company) => {
      try {
        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.jobs) return;

        const filtered = data.jobs.filter((job: any) => {
          const title = (job.title || "").toLowerCase();
          const dept = (job.departments?.[0]?.name || "").toLowerCase();
          return title.includes(keyword) || dept.includes(keyword);
        });

        filtered.forEach((job: any) => {
          const raw = job.content || job.description || "";
          const description = clean(raw).substring(0, 220) + "...";

          allJobs.push({
            id: String(job.id),
            title: job.title || "",
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: job.location?.name || "Remote",
            salary: "",
            jobType: "Full-time",
            postedDate: job.updated_at
              ? new Date(job.updated_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "",
            applyUrl: job.absolute_url || `https://boards.greenhouse.io/${company}`,
            description,
          });
        });
      } catch {
        // skip
      }
    })
  );

  return NextResponse.json({ jobs: allJobs.slice(0, 20) });
}
