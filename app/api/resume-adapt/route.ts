import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function callClaude(system: string, userContent: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { type, resumeText, jobDescription, title, company, currentJSON, userMessage } = body;

  try {
    if (type === "generate") {
      const text = await callClaude(
        `You are writing an adapted resume for a job application. Your goal is to tell a human story — not stuff keywords.

Process:
1. Read the job description carefully. Identify the 3–5 most important requirements, responsibilities, and outcomes the employer cares about.
2. Read the candidate's resume experience (focus on the last 2 employers).
3. For each key job requirement, find the closest matching experience from the resume.
4. Write a bullet that connects that experience to the requirement as a human story:
   - Start with a strong action verb
   - Include a specific result or metric if present in the resume
   - Sound natural — NOT a keyword list
   - Do NOT list tools as the subject (tools are context, not the story)
   - Do NOT invent facts not present in the resume

BAD (keyword stuffing): "Utilized Cinema 4D, Redshift, Houdini, and AI tools to animate motion graphics."
GOOD (human story): "Delivered full-cycle motion graphics for global campaigns — from concept through 3D animation — cutting revision rounds by aligning with creative directors upfront."

Rules:
- Maximum 2 lines per bullet
- Only adapt bullets from the last 2 employers
- If no clear match exists for a job requirement, skip it — do not fabricate
- Tags must come from JOB DESCRIPTION keywords only, not from the resume

Return ONLY valid JSON with no markdown fences, exactly:
{
  "summary": "adapted 2–3 sentence summary, first person, human and confident",
  "bullets": [
    {
      "id": "b1",
      "adapted": "human-written bullet text",
      "original": "exact original text from resume",
      "wasAdapted": true,
      "tags": ["1-2 tags from job description keywords only"]
    }
  ],
  "skills": {
    "match": ["skills present in resume AND required by job"],
    "add": ["skills in job posting but missing from resume — worth adding"],
    "neutral": ["skills in resume but not relevant to this role"]
  }
}`,
        `Job description:\n"""\n${jobDescription || "not provided"}\n"""\n\nCandidate resume (last 2 employers focus):\n"""\n${resumeText}\n"""\n\nRole: ${title} at ${company}`
      );

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ error: "No JSON in response", raw: text.slice(0, 200) }, { status: 500 });
      try {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ result });
      } catch {
        return NextResponse.json({ error: "Failed to parse JSON", raw: text.slice(0, 200) }, { status: 500 });
      }
    }

    if (type === "rewrite-bullet") {
      const { bulletOriginal, bulletAdapted, jobDescription: jd } = body;
      const text = await callClaude(
        `Rewrite a single resume bullet to address the most relevant requirement in the job description.

Process:
1. Read the job description. Identify the single most relevant requirement this bullet should address.
2. Rewrite the bullet to tell a human story connecting the original experience to that requirement.

Rules:
- Start with a strong action verb
- Include a result or metric if present in the original bullet
- Sound natural — not a keyword list
- Do NOT invent facts not in the original
- Maximum 2 lines
- Return ONLY the rewritten bullet text, nothing else`,
        `Job description:\n"""\n${(jd || "").slice(0, 1000)}\n"""\n\nOriginal bullet: "${bulletOriginal}"\nCurrent version: "${bulletAdapted}"`
      );
      return NextResponse.json({ bullet: text.trim() });
    }

    if (type === "chat") {
      const text = await callClaude(
        `You are editing an adapted resume. Apply the user's request precisely.

Respond with 1–2 sentences explaining what you changed and why, then return the full updated JSON inside <resume>...</resume> tags. Same JSON format as the original generation. Keep the quality bar high — strong action verbs, specific language, no filler.`,
        `Текущая версия:\n${JSON.stringify(currentJSON, null, 2)}\n\nЗапрос: ${userMessage}`
      );

      const resumeMatch = text.match(/<resume>([\s\S]*?)<\/resume>/);
      let updatedJSON = null;
      if (resumeMatch) {
        try {
          const jm = resumeMatch[1].match(/\{[\s\S]*\}/);
          if (jm) updatedJSON = JSON.parse(jm[0]);
        } catch {}
      }
      const explanation = text.replace(/<resume>[\s\S]*?<\/resume>/, "").trim();
      return NextResponse.json({ explanation, result: updatedJSON });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI error" }, { status: 500 });
  }
}
