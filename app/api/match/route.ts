import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error("Token verification failed:", error?.message);
      return null;
    }
    return user.id;
  } catch (e) {
    console.error("Token verification error:", e);
    return null;
  }
}

async function scoreWithClaude(resumeJson: any, job: { id: string; title: string; description: string }): Promise<{
  score_total: number; score_skills: number; score_level: number; score_industry: number;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log(`[Claude] Scoring job: ${job.id} - "${job.title}" | API key: ${!!apiKey}`);
  if (!apiKey) return null;

  const prompt = `You are a strict job matching expert. Compare candidate profile vs job posting.

CANDIDATE PROFILE:
${JSON.stringify(resumeJson, null, 2)}

JOB POSTING:
Title: ${job.title}
Description: ${job.description?.substring(0, 3000) || ""}

Return ONLY JSON: {"score_total":0-100,"score_skills":0-100,"score_level":0-100,"score_industry":0-100}

--- STEP 1: IDENTIFY PROFESSION TYPE ---

A) TECHNICAL — Software Engineer, Data Scientist, DevOps, QA, Designer
   Skills = tools/frameworks (Python, React, Figma, AWS…)

B) PROJECT/PRODUCT MANAGEMENT
   Skills = methodologies (Agile, Scrum, Kanban, SAFe) + tools (Jira, Asana) + certs (PMP, CSM)
   Level = years of PM experience + project complexity

C) EDUCATION/TEACHING
   Skills = teaching methods + certs (Teaching License, TESOL, TEFL, IB) + subjects/grade levels + tools (Canvas, Blackboard)
   Level = years teaching + leadership (Dept Head, Mentor Teacher)

D) HEALTHCARE/THERAPY
   Skills = licenses (LMFT, LPC, LCSW, PsyD) + modalities (CBT, DBT, EMDR) + populations + EHR systems
   Level = clinical years + supervision completed + independent license status

E) SALES/MARKETING
   Skills = methodologies (SPIN, MEDDIC, inbound) + tools (Salesforce, HubSpot) + metrics (ARR, ROAS, CAC)
   Level = quota size + deal size + team leadership

F) HR/OPERATIONS
   Skills = HRIS (Workday, ADP) + compliance (EEO, FLSA) + process improvement (Six Sigma, OKRs)
   Level = team size managed + process complexity

--- STEP 2: SCORE EACH DIMENSION ---

SKILLS (0-100):
- For any role: completely different domain = 10-25
- High match (80-95): candidate has ALL core required skills/certs/tools
- Medium (50-75): has 50-70% of required skills
- Low (10-40): significant gaps
- CRITICAL: If job REQUIRES a license (teaching, therapy, law, medicine) and candidate lacks it → skills MAX 30

LEVEL (0-100):
- Extract job level from title keywords (senior/lead/principal/director) and required years
- Extract candidate level from current title + years of experience
- Same level, years match → 85-95
- Overqualified by 1 level → 60-75
- Underqualified by 1 level → 55-70
- Gap ≥2 levels → 15-40
- Years gap <2y → no penalty; 2-4y → -15; 4+y → -30
- Job says "Lead" (no "senior"): Senior candidate = 65-75
- Job needs 6-8 yrs, candidate has 4-5 yrs (Senior title) = 55-70

INDUSTRY (0-100):
- Same industry → 85-95
- Related industry → 60-75
- Unrelated → 20-40
- Unclear → 50

--- STEP 3: TOTAL ---
score_total = (score_skills × 0.45) + (score_level × 0.30) + (score_industry × 0.25)
CRITICAL: If license required and missing → total MAX 35
Use FULL 0-100 range. Return ONLY valid JSON, no explanations.`;

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
      console.error(`[Claude] API error ${res.status}:`, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    console.log(`[Claude] Raw response for ${job.id}:`, text.substring(0, 200));
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object in response");
    const scores = JSON.parse(text.slice(start, end + 1));

    const result = {
      score_total:    Math.min(100, Math.max(0, Math.round(scores.score_total    || 0))),
      score_skills:   Math.min(100, Math.max(0, Math.round(scores.score_skills   || 0))),
      score_level:    Math.min(100, Math.max(0, Math.round(scores.score_level    || 0))),
      score_industry: Math.min(100, Math.max(0, Math.round(scores.score_industry || 0))),
    };
    console.log(`[Claude] Result for "${job.title}": total=${result.score_total}, skills=${result.score_skills}, level=${result.score_level}`);
    return result;
  } catch (e: any) {
    console.error(`[Claude] Error for ${job.id}:`, e.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log("=== MATCH API CALLED ===");
  console.log("ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY);
  console.log("SUPABASE_URL present:", !!process.env.SUPABASE_URL);
  console.log("SUPABASE_SERVICE_KEY present:", !!process.env.SUPABASE_SERVICE_KEY);

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  console.log("Token present:", !!token);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getUserIdFromToken(token);
  console.log("User ID:", userId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { jobIds, force = false } = body;
  console.log(`Processing ${jobIds?.length || 0} jobs, force=${force}`);
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json({ error: "jobIds required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("resume_profile, resume_json")
    .eq("id", userId)
    .single();

  console.log("Profile:", {
    found: !!profileRow,
    hasResumeProfile: !!profileRow?.resume_profile,
    hasResumeJson: !!profileRow?.resume_json,
    error: profileError?.message,
  });

  const resumeData = profileRow?.resume_profile || profileRow?.resume_json;
  if (!resumeData) {
    console.error("No resume found for user", userId);
    return NextResponse.json({ error: "No resume uploaded" }, { status: 400 });
  }

  const { data: cached } = force ? { data: [] } : await supabase
    .from("match_scores")
    .select("job_id, score_total, score_skills, score_level, score_industry")
    .eq("user_id", userId)
    .in("job_id", jobIds);

  console.log(`Cached scores: ${cached?.length || 0}`);
  const cachedMap = new Map((cached || []).map((r: any) => [r.job_id, r]));
  const uncachedIds = jobIds.filter(id => !cachedMap.has(id));
  console.log(`Uncached jobs: ${uncachedIds.length}`);

  const scores: Record<string, any> = {};
  for (const [jobId, row] of cachedMap) {
    scores[jobId] = { total: row.score_total, skills: row.score_skills, level: row.score_level, industry: row.score_industry };
  }

  if (uncachedIds.length === 0) return NextResponse.json({ scores });

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, description")
    .in("id", uncachedIds);

  if (!jobs || jobs.length === 0) {
    console.log("No jobs found in DB");
    return NextResponse.json({ scores });
  }

  console.log(`Calling Claude for ${jobs.length} jobs...`);
  const CONCURRENCY = 3;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(job => scoreWithClaude(resumeData, job)));

    const toInsert: any[] = [];
    for (let j = 0; j < batch.length; j++) {
      const job = batch[j];
      const result = results[j];
      if (!result) { console.log(`Claude returned null for "${job.title}"`); continue; }
      scores[job.id] = { total: result.score_total, skills: result.score_skills, level: result.score_level, industry: result.score_industry };
      toInsert.push({ user_id: userId, job_id: job.id, ...result });
    }

    if (toInsert.length > 0) {
      const { error: upsertError } = await supabase
        .from("match_scores")
        .upsert(toInsert, { onConflict: "user_id,job_id" });
      if (upsertError) console.error("Upsert error:", upsertError);
      else console.log(`Saved ${toInsert.length} scores to DB`);
    }
  }

  console.log(`Returning ${Object.keys(scores).length} scores`);
  return NextResponse.json({ scores });
}
