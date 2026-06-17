import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// IMPORTANT: Run this SQL in the Supabase SQL editor before deploying:
//   ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS logo_color text;
//   ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS custom_job_url text;

type ParsedJob = {
  title: string | null;
  company: string | null;
  location: string | null;
  level: string | null;
  salary: string | null;
  requirements: string[] | null;
  nice_to_have: string[] | null;
  description: string | null;
};

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

// Decode JWT sub claim to get user ID, same pattern as other API routes
function getUserId(token: string): string | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString());
    if (!payload.sub) return null;
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}

// Convert HTML to plain text for Gemini — strips scripts, styles, tags
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000); // cap to avoid oversized Gemini prompts
}

// Fetch the page at a URL server-side (bypasses CORS; LinkedIn is excluded upstream)
async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JobBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return htmlToText(await res.text());
}

// Send text to Gemini 2.5 Flash and get structured job JSON back
async function parseJobWithGemini(text: string): Promise<ParsedJob> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const prompt =
    `Extract job details from this text and return ONLY valid JSON:\n` +
    `{ "title": "", "company": "", "location": "", "level": "", "salary": "", ` +
    `"requirements": [], "nice_to_have": [], "description": "" }\n` +
    `If a field is not found, use null. Return only JSON, no other text.\n\n` +
    `Text:\n${text}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  // Strip markdown fences in case the model wraps the JSON anyway
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned) as ParsedJob;
}

export async function POST(req: NextRequest) {
  // Authenticate
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { url?: string; text?: string; logo_color?: string };
  const { url, text, logo_color } = body;

  if (!url && !text) {
    return NextResponse.json({ error: "Provide a URL or job description text" }, { status: 400 });
  }

  // Determine what to send to Gemini:
  //   - non-LinkedIn URL  → fetch the page HTML and convert to text
  //   - LinkedIn URL      → user must paste the text (LinkedIn blocks scrapers)
  //   - no URL / raw text → use text directly
  let contentToParse: string;
  const isLinkedIn = url ? /linkedin\.com/i.test(url) : false;

  if (url && !isLinkedIn) {
    try {
      contentToParse = await fetchPageText(url);
    } catch (e: any) {
      return NextResponse.json({ error: `Could not fetch URL: ${e.message}`, needs_text: true }, { status: 422 });
    }
  } else {
    if (!text?.trim()) {
      return NextResponse.json({ error: "Paste the job description text", needs_text: true }, { status: 400 });
    }
    contentToParse = text;
  }

  // Parse job fields with Gemini
  let parsed: ParsedJob;
  try {
    parsed = await parseJobWithGemini(contentToParse);
  } catch (e: any) {
    return NextResponse.json({ error: `AI parsing failed: ${e.message}` }, { status: 500 });
  }

  // Merge requirements into description so cover-letter / resume-adapt have all context
  const fullDesc = [
    parsed.description || "",
    parsed.requirements?.length ? `Requirements:\n${parsed.requirements.join("\n")}` : "",
    parsed.nice_to_have?.length ? `Nice to have:\n${parsed.nice_to_have.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  // Unique ID prefix "ext_" distinguishes manual entries from scraped job IDs
  const job_id = `ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const db = getServiceClient();
  const { data, error } = await db
    .from("saved_jobs")
    .insert({
      user_id: userId,
      job_id,
      title: parsed.title || "Unknown Title",
      company: parsed.company || "Unknown Company",
      location: parsed.location || "",
      salary: parsed.salary || "",
      job_type: parsed.level || "Full-time",
      source: "manual",
      posted_date: new Date().toISOString().slice(0, 10),
      apply_url: url || "",
      description: fullDesc,
      logo_color: logo_color || "#6366f1",
      custom_job_url: url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
