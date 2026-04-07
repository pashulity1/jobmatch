import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "designer";

  try {
    const response = await fetch(
      `https://remoteok.com/api?tag=${encodeURIComponent(keyword)}`,
      {
        headers: {
          "User-Agent": "JobMatch App/1.0",
        },
      }
    );

    const data = await response.json();

    // RemoteOK returns array where first item is a legal notice object
    const rawJobs = data.filter((item: any) => item.id && item.company);

    const jobs = rawJobs.slice(0, 10).map((job: any) => ({
      id: String(job.id),
      title: job.position || "Unknown Position",
      company: job.company || "Unknown Company",
      location: job.location || "Remote",
      salary: job.salary || "",
      jobType: "Full-time",
      postedDate: job.date
        ? new Date(job.date).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "",
      applyUrl: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      description: job.description
        ? job.description.replace(/<[^>]*>/g, "").substring(0, 200) + "..."
        : "Remote position available.",
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("RemoteOK error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
