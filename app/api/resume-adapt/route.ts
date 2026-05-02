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
        `You are a professional resume writer adapting a candidate's experience for a specific job posting.

Rules for bullets:
- Start with a strong action verb (Led, Built, Delivered, Designed, Reduced, Grew, etc.)
- Be specific and concrete — include tools, technologies, scale, or measurable outcomes when the original supports it
- Mirror language from the job description naturally, don't force keywords
- Keep each bullet to 1–2 lines — punchy, not a paragraph
- Do NOT invent facts, metrics, or skills absent from the resume — reframe what exists

Rules for the summary:
- 2–3 sentences, written in first person (Senior X with Y years...)
- Lead with the candidate's strongest relevant angle for THIS specific role
- Sound human and confident, not generic or bloated with buzzwords

Return ONLY valid JSON with no markdown fences, exactly:
{
  "summary": "adapted 2–3 sentence summary",
  "bullets": [
    {
      "adapted": "rewritten bullet tailored to this job",
      "original": "original bullet from the profile",
      "tags": ["relevant-skill-tag"]
    }
  ],
  "skills": {
    "match": ["skills present in resume AND required by job"],
    "add": ["skills in job posting but missing from resume — worth highlighting or adding"],
    "neutral": ["skills in resume but not relevant to this role"]
  }
}`,
        `Резюме:\n${resumeText}\n\nВакансия:\n${jobDescription || "описание не указано"}\n\nДолжность: ${title} в ${company}`
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
        `You rewrite a single resume bullet to better match a job description.
Rules:
- Only use information present in the original bullet — do NOT invent facts or metrics
- Start with a strong action verb
- Mirror language from the job description naturally
- 1–2 lines max
- Return ONLY the rewritten bullet text, nothing else`,
        `Original bullet: "${bulletOriginal}"\nCurrent adapted: "${bulletAdapted}"\nJob description context: "${(jd || "").slice(0, 800)}"`
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
