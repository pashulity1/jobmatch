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

const WRITING_RULES = `
WRITING RULES (follow strictly):
- Never use these words: leveraged, spearheaded, seamlessly, robust, transformative, elevate, navigate challenges, streamline, dynamic, cutting-edge, innovative, passionate
- Never use em-dashes (—) in bullets or summary. Use commas, periods, or colons instead.
- Write like a human, not a corporate document. Short sentences beat long ones.
- Specific details beat general words.
- Start every bullet with an action verb: Designed, Built, Won, Executed, Produced, Edited, Animated, Collaborated, Integrated, Created
- Real numbers only: 50K+ views, 12 editors, 500+ events. Never invent percentages or metrics.
- No bullet should repeat words or context from another bullet. Each one tells a different story.
`;

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { type, resumeText, jobDescription, title, company, currentJSON, userMessage } = body;

  try {
    // ─── STEP 1: analyze job + extract requirements ──────────────────────────
    if (type === "extract-requirements") {
      const text = await callClaude(
        `You are a senior recruiter and resume strategist. Analyze the job description and candidate's resume together.

Do three things:

1. Extract 5-7 core requirements the employer is looking for. For each: a short label and what specific evidence would satisfy it.

2. Assess the match between the resume and this role:
   - Which hard skills match
   - Which experience areas match
   - What gaps or missing skills will a recruiter notice
   - Overall match percent (40-85%, be honest)
   - Recommendation: "apply" or "skip"

3. Extract key phrases from the job description that should appear (rephrased, not copied) in the resume:
   - Specific terminology the employer uses
   - Action-oriented phrases from requirements
   - Surface/channel types they mention

Return ONLY valid JSON, no markdown fences:
{
  "requirements": [
    {
      "id": "r1",
      "label": "short label",
      "what_employer_wants": "what evidence satisfies this"
    }
  ],
  "match_assessment": {
    "skills_match": ["AE matches", "C4D matches"],
    "experience_match": ["social content production matches"],
    "gaps": ["no product UI motion shown", "video shooting not in resume"],
    "recruiter_questions": ["Will they be able to shoot on-location?"],
    "match_percent": 72,
    "recommendation": "apply"
  },
  "key_phrases": ["scale across surfaces", "platform-specific assets", "motion design systems"]
}`,
        `Job description:\n"""\n${jobDescription || "not provided"}\n"""\n\nCandidate resume:\n"""\n${resumeText || "not provided"}\n"""`
      );
      const parsed = extractJSON(text);
      if (!parsed) return NextResponse.json({ error: "Analysis failed", raw: text.slice(0, 200) }, { status: 500 });
      return NextResponse.json({
        requirements: parsed.requirements || [],
        match_assessment: parsed.match_assessment || null,
        key_phrases: parsed.key_phrases || [],
      });
    }

    // ─── STEP 2: generate adapted resume content ─────────────────────────────
    if (type === "generate") {
      const { requirements, key_phrases } = body;
      const text = await callClaude(
        `You are a professional resume writer adapting a candidate's resume for a specific job.
${WRITING_RULES}

BULLET FORMULA (XYZ): achievement + metric (if real) + how it was done.
- The first 2-3 bullets must be the most relevant to THIS specific job.
- Maximum 8 bullets per employer position.
- Pull concrete specifics from the resume: competition wins, named brands, view counts, team sizes.
- If the resume mentions a collaboration with named franchises or brands, use those names.
- Mirror key phrases from the job description (listed below), but rephrase — never copy verbatim.

SUMMARY FORMULA: role + years + specific experience with real numbers + core tools + what makes them different.
- 4-5 sentences max.
- Tailor it to THIS company's mission and language.
- Do not repeat information that's already in the bullets.
- Do not start with "I am" or "My name is".

GAPS: For any requirement that has no match in the resume, mark matched: false. Do not invent experience to fill gaps.

For each requirement:
1. Find the best real experience from the resume that answers it.
2. Write ONE bullet that makes the hiring manager think: "this person has done exactly what we need."
3. Use the XYZ formula.
4. If no experience matches, set matched: false and omit adapted text.

BAD bullet (generic, repetitive, keyword-stuffed):
"Designed and animated 2D/3D motion graphics across digital and social surfaces for global gaming campaigns, using After Effects and Cinema 4D."

GOOD bullet (specific, tells a story, answers the requirement):
"Won an internal rebranding competition to design the full broadcast identity for a Wargaming YouTube channel, building openers, episode templates, and recurring graphic systems from scratch. Became the permanent format running at 50K+ views per episode."

Return ONLY valid JSON, no markdown fences:
{
  "summary": "4-5 sentence summary",
  "bullets": [
    {
      "id": "b1",
      "requirementId": "r1",
      "requirementLabel": "Build Motion Systems",
      "adapted": "bullet text",
      "original": "exact text from resume this is based on",
      "employer": "Wargaming",
      "matched": true,
      "wasAdapted": true,
      "tags": ["motion systems", "scalable"]
    }
  ],
  "skills": {
    "match": ["skills present in resume AND required by job"],
    "add": ["skills in job posting but missing from resume — worth adding if honest"],
    "neutral": ["skills in resume but not relevant to this role"]
  },
  "gaps": ["requirement labels with no resume match"]
}`,
        `Role: ${title} at ${company}

Key phrases from this job description to mirror (rephrase, don't copy):
${(key_phrases || []).map((p: string) => `- ${p}`).join("\n")}

Employer requirements:
${JSON.stringify(requirements, null, 2)}

Candidate resume (use last 2 employers only for bullets):
"""
${resumeText}
"""`,
        3500
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
${WRITING_RULES}
Use only facts from the original resume text. Never invent metrics.
XYZ formula: achievement + metric (if real) + how.
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
${WRITING_RULES}
Respond with 1-2 sentences explaining what you changed, then return the full updated JSON inside <resume>...</resume> tags.
Same JSON format as original. No invented facts or metrics.`,
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
