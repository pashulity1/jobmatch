import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

function getUserId(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (!payload.sub) return null;
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload.sub as string;
  } catch { return null; }
}

async function scoreWithClaude(resumeJson: any, job: { id: string; title: string; description: string }): Promise<{
  score_total: number; score_skills: number; score_level: number; score_industry: number;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a job matching expert. Compare a candidate's profile with a job posting and return match scores.

CANDIDATE PROFILE:
${JSON.stringify(resumeJson, null, 2)}

JOB POSTING:
Title: ${job.title}
Description: ${job.description?.substring(0, 3000) || "No description"}

Return ONLY a JSON object, no markdown, no explanation:
{
  "score_total": <0-100, overall match>,
  "score_skills": <0-100, technical skills match>,
  "score_level": <0-100, seniority/experience level match>,
  "score_industry": <0-100, industry/domain match>
}

Scoring guide:
- 80-100: Excellent match
- 60-79: Good match
- 40-59: Partial match
- 0-39: Weak match

Be precise. Consider ALL aspects: tools, software, methodologies, domain experience, years of experience, seniority level.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      console.error("Claude match error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const scores = JSON.parse(clean);

    return {
      score_total:    Math.min(100, Math.max(0, Math.round(scores.score_total    || 0))),
      score_skills:   Math.min(100, Math.max(0, Math.round(scores.score_skills   || 0))),
      score_level:    Math.min(100, Math.max(0, Math.round(scores.score_level    || 0))),
      score_industry: Math.min(100, Math.max(0, Math.round(scores.score_industry || 0))),
    };
  } catch (e: any) {
    console.error("Claude scoring error:", e.message);
    return null;
  }
}

// POST /api/match — compute AI match scores for a list of job IDs
// Body: { jobIds: string[] }
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobIds } = await req.json();
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json({ error: "jobIds required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Read resume — try resume_profile first (main field), fallback to resume_json
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("resume_profile, resume_json")
    .eq("id", userId)
    .single();

  const resumeData = profileRow?.resume_profile || profileRow?.resume_json;
  if (!resumeData) {
    return NextResponse.json({ error: "No resume uploaded" }, { status: 400 });
  }

  // Check cached scores
  const { data: cached } = await supabase
    .from("match_scores")
    .select("job_id, score_total, score_skills, score_level, score_industry")
    .eq("user_id", userId)
    .in("job_id", jobIds);

  const cachedMap = new Map((cached || []).map(r => [r.job_id, r]));
  const uncachedIds = jobIds.filter(id => !cachedMap.has(id));

  const scores: Record<string, any> = {};

  for (const [jobId, row] of cachedMap) {
    scores[jobId] = { total: row.score_total, skills: row.score_skills, level: row.score_level, industry: row.score_industry };
  }

  if (uncachedIds.length === 0) return NextResponse.json({ scores });

  // Fetch job descriptions for uncached jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, description")
    .in("id", uncachedIds);

  if (!jobs || jobs.length === 0) return NextResponse.json({ scores });

  // Score concurrently in batches of 5
  const CONCURRENCY = 5;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(job => scoreWithClaude(resumeData, job)));

    const toInsert: any[] = [];
    for (let j = 0; j < batch.length; j++) {
      const job = batch[j];
      const result = results[j];
      if (!result) continue;
      scores[job.id] = { total: result.score_total, skills: result.score_skills, level: result.score_level, industry: result.score_industry };
      toInsert.push({ user_id: userId, job_id: job.id, ...result });
    }

    if (toInsert.length > 0) {
      await supabase.from("match_scores").upsert(toInsert, { onConflict: "user_id,job_id" });
    }
  }

  return NextResponse.json({ scores });
}
