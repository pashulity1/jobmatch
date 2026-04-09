import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Send to Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
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
  "summary": "2-3 sentence professional summary"
}

For keywords: extract ALL important terms from the resume including job titles, technologies, tools, methodologies, soft skills. Include variations (e.g. "React" and "ReactJS"). Be generous - include 30-50 keywords minimum.`,
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

    // Parse JSON from response
    let profile;
    try {
      // Remove markdown code blocks if present
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      profile = JSON.parse(clean);
    } catch {
      console.error("Failed to parse profile JSON:", text);
      return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });

  } catch (e: any) {
    console.error("Resume analysis error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
