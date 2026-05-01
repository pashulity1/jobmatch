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
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
    signal: AbortSignal.timeout(30000),
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

  const { type, resumeText, jobDescription, company, title, tone, currentLetter, userMessage } = body;

  try {
    if (type === "generate") {
      const toneNote = tone ? `Тон письма: ${tone}. ` : "";
      const text = await callClaude(
        `Ты помогаешь писать сопроводительные письма для поиска работы.
Пиши от первого лица. Без шаблонных фраз вроде «Я рад представить».
Конкретно, с цифрами если есть. До 250 слов. ${toneNote}
Только текст письма, без темы и формальных заголовков.`,
        `Резюме:\n${resumeText}\n\nВакансия:\n${jobDescription || "описание не указано"}\n\nКомпания: ${company}\nДолжность: ${title}\n\nНапиши сопроводительное письмо.`
      );
      return NextResponse.json({ letter: text.trim() });
    }

    if (type === "chat") {
      const text = await callClaude(
        `Ты редактируешь сопроводительное письмо для поиска работы.
Ответь кратко — 1-2 предложения что изменил и почему.
Затем верни полный обновлённый текст письма внутри тегов <letter>...</letter>`,
        `Текущее письмо:\n${currentLetter}\n\nЗапрос: ${userMessage}`
      );
      const match = text.match(/<letter>([\s\S]*?)<\/letter>/);
      const updatedLetter = match ? match[1].trim() : null;
      const explanation = text.replace(/<letter>[\s\S]*?<\/letter>/, "").trim();
      return NextResponse.json({ explanation, letter: updatedLetter });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI error" }, { status: 500 });
  }
}
