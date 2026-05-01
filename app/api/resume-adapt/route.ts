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
      model: "claude-haiku-4-5-20251001",
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
        `Ты адаптируешь резюме под конкретную вакансию.
На основе профиля кандидата создай 3-4 буллета опыта.
Адаптируй их под требования вакансии — конкретнее, с метриками если уместно.
Не выдумывай факты которых нет в резюме.

Верни ТОЛЬКО валидный JSON без markdown-обёртки, строго в формате:
{
  "summary": "адаптированное саммари 2-3 предложения",
  "bullets": [
    {
      "adapted": "адаптированный буллет для этой вакансии",
      "original": "базовый буллет из профиля",
      "tags": ["тег-навык из вакансии"]
    }
  ],
  "skills": {
    "match": ["навыки которые есть в резюме и нужны вакансии"],
    "add": ["навыки в вакансии но нет в резюме — стоит добавить"],
    "neutral": ["навыки в резюме но не релевантны этой вакансии"]
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

    if (type === "chat") {
      const text = await callClaude(
        `Ты редактируешь адаптированное резюме.
Ответь 1-2 предложения: что изменил и почему.
Затем верни обновлённый JSON в тегах <resume>...</resume>
Формат JSON такой же как при начальной генерации.`,
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
