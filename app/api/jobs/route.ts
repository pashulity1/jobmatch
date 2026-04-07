import { NextRequest, NextResponse } from "next/server";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("keyword") || "designer").toLowerCase();

  const companies = [
    "anthropic", "notion", "figma", "linear", "vercel", "stripe",
    "airbnb", "pinterest", "reddit", "twitch", "shopify", "dropbox",
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
          const rawDescription = job.content || "";
          const cleanDescription = stripHtml(rawDescription).substring(0, 200) + "...";

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
            description: cleanDescription,
          });
        });
      } catch {
        // Skip companies that don't respond
      }
    })
  );

  return NextResponse.json({ jobs: allJobs.slice(0, 20) });
}
