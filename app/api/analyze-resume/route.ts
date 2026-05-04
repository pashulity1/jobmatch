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

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const userId = token ? getUserId(token) : null;

    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 },
              },
              {
                type: "text",
                text: `Analyze this resume and extract a structured profile.
Return ONLY a JSON object with no markdown, no explanation, just raw JSON:
{
  "name": "person's name or empty string",
  "title": "current/desired job title",
  "level": "Junior|Mid|Senior|Lead|Manager|Director|VP|C-Level",
  "years_experience": number,
  "skills": ["skill1", "skill2", ...],
  "industries": ["industry1", "industry2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "2-3 sentence professional summary",
  "work_experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "dates": "Month Year – Month Year or Present",
      "bullets": [
        "exact bullet text from resume as written",
        "another bullet"
      ]
    }
  ]
}

For keywords: extract ALL important terms including job titles, technologies, tools, methodologies, soft skills. Include variations (e.g. "React" and "ReactJS"). Be generous - include 30-50 keywords minimum.
For work_experience: extract ALL positions in chronological order (newest first). Copy bullet text EXACTLY as written in the resume — do not paraphrase or summarize. Include every bullet point, achievement, and responsibility listed.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let profile;
    try {
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      profile = JSON.parse(clean);
    } catch {
      // Try extracting valid JSON substring if response was truncated
      try {
        const m = text.match(/\{[\s\S]*/);
        if (m) profile = JSON.parse(m[0]);
      } catch {}
      if (!profile) {
        console.error("Failed to parse profile JSON:", text.slice(0, 300));
        return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
      }
    }

    // Save resume_json to profiles table if user is authenticated
    if (userId) {
      const supabase = getServiceClient();
      await supabase
        .from("profiles")
        .upsert({ id: userId, resume_json: profile, updated_at: new Date().toISOString() }, { onConflict: "id" });
    }

    return NextResponse.json({ success: true, profile });

  } catch (e: any) {
    console.error("Resume analysis error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
