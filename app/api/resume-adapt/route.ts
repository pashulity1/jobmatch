import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function callClaude(system: string, userContent: string, maxTokens = 2048): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
    signal: AbortSignal.timeout(50000),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function extractJSON(text: string) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { type, resumeText, jobDescription, title, company, currentJSON, userMessage } = body;

  try {
    // ─── STEP 1: extract requirements ───────────────────────────────────────
    if (type === "extract-requirements") {
      const text = await callClaude(
        `Read this job description carefully.
Extract the 5-7 most important things this employer is looking for.
For each, write a short label and what evidence would satisfy it.

Return ONLY valid JSON, no markdown fences:
{
  "requirements": [
    {
      "id": "r1",
      "label": "short label",
      "what_employer_wants": "description of what evidence satisfies this"
    }
  ]
}`,
        `Job description:\n"""\n${jobDescription || "not provided"}\n"""`
      );
      const parsed = extractJSON(text);
      if (!parsed) return NextResponse.json({ error: "Requirements extraction failed", raw: text.slice(0, 200) }, { status: 500 });
      return NextResponse.json({ requirements: parsed.requirements || [] });
    }

    // ─── STEP 2: match requirements → bullets ───────────────────────────────
    if (type === "generate") {
      const { requirements } = body;
      const text = await callClaude(
        `You are writing adapted resume bullets for a job application.

For each employer requirement:
1. Find the closest real experience from the resume that serves as proof
2. Write ONE bullet that ANSWERS the requirement using that experience
3. The bullet should make the hiring manager think "this person has done exactly what we need"
4. Start with an action verb
5. Include a specific result or metric IF it exists in the resume — do not invent
6. Maximum 2 lines
7. Sound like a human, not a keyword list

BAD (keyword stuffing):
"Utilized Cinema 4D, Redshift, Houdini, Unreal Engine, and AI-assisted design tools to animate compelling motion graphics."

GOOD (answers the requirement with real proof):
"Built scalable motion libraries and broadcast packages for Wargaming's YouTube channel — standardized templates adopted across a 35-person production team, cutting episode turnaround time while maintaining visual consistency."

Rules:
- If no resume experience matches a requirement — set matched: false, omit adapted text
- Do NOT adapt bullets from employers older than the last 2
- Tags must come from the JOB DESCRIPTION, not from the resume
- Employer field: write the company name from the resume this bullet is based on

Also write a 2-3 sentence professional summary (first person, confident, human — not a keyword list).

Return ONLY valid JSON, no markdown fences:
{
  "summary": "adapted 2–3 sentence summary",
  "bullets": [
    {
      "id": "b1",
      "requirementId": "r1",
      "requirementLabel": "Build Motion Systems",
      "adapted": "bullet text here",
      "original": "exact original text from resume this is based on",
      "employer": "Wargaming",
      "matched": true,
      "wasAdapted": true,
      "tags": ["motion systems", "scalable"]
    }
  ],
  "skills": {
    "match": ["skills present in resume AND required by job"],
    "add": ["skills in job posting but missing from resume — worth adding"],
    "neutral": ["skills in resume but not relevant to this role"]
  }
}`,
        `Employer requirements:\n${JSON.stringify(requirements, null, 2)}\n\nCandidate resume (last 2 employers only):\n"""\n${resumeText}\n"""\n\nRole: ${title} at ${company}`,
        3000
      );
      const result = extractJSON(text);
      if (!result) return NextResponse.json({ error: "No JSON in response", raw: text.slice(0, 200) }, { status: 500 });
      return NextResponse.json({ result: { ...result, requirements } });
    }

    // ─── REWRITE SINGLE BULLET ───────────────────────────────────────────────
    if (type === "rewrite-bullet") {
      const { bulletOriginal, bulletAdapted, requirementLabel, what_employer_wants } = body;
      const text = await callClaude(
        `Rewrite a single resume bullet to better answer what the employer is looking for.
Use only facts from the original resume text.
Start with an action verb. Max 2 lines. Sound human, not like a keyword list.
Return only the bullet text, nothing else.`,
        `The employer is looking for: "${requirementLabel || "relevant experience"}"
What they specifically want: "${what_employer_wants || ""}"

Original resume text this bullet is based on:
"${bulletOriginal}"

Current adapted version:
"${bulletAdapted}"`
      );
      return NextResponse.json({ bullet: text.trim() });
    }

    // ─── CHAT ────────────────────────────────────────────────────────────────
    if (type === "chat") {
      const text = await callClaude(
        `You are editing an adapted resume. Apply the user's request precisely.

Respond with 1–2 sentences explaining what you changed, then return the full updated JSON inside <resume>...</resume> tags.
Same JSON format as original. Keep quality high: strong action verbs, specific language, no filler.`,
        `Current version:\n${JSON.stringify(currentJSON, null, 2)}\n\nRequest: ${userMessage}`,
        3000
      );

      const resumeMatch = text.match(/<resume>([\s\S]*?)<\/resume>/);
      let updatedJSON = null;
      if (resumeMatch) {
        const jm = resumeMatch[1].match(/\{[\s\S]*\}/);
        if (jm) try { updatedJSON = JSON.parse(jm[0]); } catch {}
      }
      const explanation = text.replace(/<resume>[\s\S]*?<\/resume>/, "").trim();
      return NextResponse.json({ explanation, result: updatedJSON });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI error" }, { status: 500 });
  }
}
