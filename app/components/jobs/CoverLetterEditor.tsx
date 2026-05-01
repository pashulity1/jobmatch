"use client";
import { useState, useEffect, useRef } from "react";
import type { SavedJob } from "./SavedJobCard";

interface Props {
  job: SavedJob;
  resumeProfile: any;
  token: string;
  onBack: () => void;
}

type Msg = { role: "ai" | "user"; text: string };

function formatResume(p: any): string {
  if (!p) return "";
  return [
    `${p.name || ""} — ${p.title || ""} (${p.level || ""}, ${p.years_experience || 0} лет опыта)`,
    `Саммари: ${p.summary || ""}`,
    `Навыки: ${(p.skills || []).join(", ")}`,
    `Индустрии: ${(p.industries || []).join(", ")}`,
    `Ключевые слова: ${(p.keywords || []).slice(0, 20).join(", ")}`,
  ].join("\n");
}

export function CoverLetterEditor({ job, resumeProfile, token, onBack }: Props) {
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const STORAGE_KEY = `jm_cl_${job.job_id}`;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setLetter(saved);
      setMessages([{ role: "ai", text: "Загрузил сохранённый черновик. Редактируйте текст слева или попросите меня изменить что-то конкретное." }]);
    } else if (resumeProfile) {
      generate();
    } else {
      setMessages([{ role: "ai", text: "Загрузите резюме чтобы сгенерировать письмо." }]);
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && letter) {
      if (editorRef.current.innerText !== letter) {
        editorRef.current.innerText = letter;
      }
    }
  }, [letter]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generate = async (tone?: string) => {
    if (!resumeProfile) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "generate",
          resumeText: formatResume(resumeProfile),
          jobDescription: job.description || "",
          company: job.company,
          title: job.title,
          tone,
        }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
        localStorage.setItem(STORAGE_KEY, data.letter);
        if (messages.length === 0 || tone) {
          setMessages([{ role: "ai", text: `Написал сопроводительное на основе вашего резюме и описания вакансии. Редактируйте текст слева или попросите меня изменить что-то конкретное.` }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Ошибка при генерации. Попробуйте ещё раз." }]);
    } finally {
      setGenerating(false);
    }
  };

  const sendChat = async (msg: string) => {
    const text = msg.trim();
    if (!text || generating) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setGenerating(true);
    const currentLetter = editorRef.current?.innerText || letter;
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", currentLetter, userMessage: text }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
        localStorage.setItem(STORAGE_KEY, data.letter);
      }
      if (data.explanation) {
        setMessages(prev => [...prev, { role: "ai", text: data.explanation }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Ошибка при обновлении." }]);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = editorRef.current?.innerText || letter;
    await navigator.clipboard.writeText(text);
    localStorage.setItem(`jm_cl_done_${job.job_id}`, "1");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInput = () => {
    const text = editorRef.current?.innerText || "";
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => localStorage.setItem(STORAGE_KEY, text), 2000);
  };

  const TONES = ["Формальный", "Дружелюбный", "Уверенный", "Краткий"];
  const CHIPS = ["Короче", "Формальнее", "Добавь метрики", "На английском"];

  const AIChatPanel = () => (
    <div style={{ width: isMobile ? "100%" : 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "#EFF0F6" }}>
      <div ref={messagesEnd as any} style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) =>
          m.role === "ai" ? (
            <div key={i} style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, fontWeight: 300, color: "#292B2D", lineHeight: 1.55, border: "0.5px solid rgba(41,43,45,0.08)" }}>
              {m.text}
            </div>
          ) : (
            <div key={i} style={{ background: "#292B2D", borderRadius: "10px 10px 3px 10px", padding: "9px 11px", fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, alignSelf: "flex-end", maxWidth: "92%" }}>
              {m.text}
            </div>
          )
        )}
        {generating && (
          <div style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, color: "rgba(41,43,45,0.4)", border: "0.5px solid rgba(41,43,45,0.08)" }}>
            <span style={{ animation: "pulse 1s infinite" }}>●●●</span>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>
      {/* Quick chips */}
      <div style={{ padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 4, borderTop: "0.5px solid rgba(41,43,45,0.08)", flexShrink: 0 }}>
        {CHIPS.map(c => (
          <button key={c} onClick={() => sendChat(c)} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "#fff", color: "#4558C8", border: "0.5px solid rgba(69,88,200,0.25)", cursor: "pointer", fontWeight: 400, fontFamily: "inherit" }}>
            {c}
          </button>
        ))}
      </div>
      {/* Input */}
      <div style={{ padding: "8px 12px 12px", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(input); } }}
          placeholder="Попросите AI изменить..."
          rows={1}
          style={{ flex: 1, fontSize: 12, fontWeight: 300, border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: "8px 11px", outline: "none", background: "#fff", color: "#292B2D", resize: "none", lineHeight: 1.4, fontFamily: "Inter, system-ui, sans-serif", maxHeight: 80 }}
        />
        <button onClick={() => sendChat(input)} disabled={!input.trim() || generating} style={{ width: 32, height: 32, borderRadius: 9, background: "#292B2D", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || generating ? 0.4 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 7L2 2l2 5-2 5 10-5z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

      {/* Topbar */}
      <div style={{ background: "#292B2D", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
          ← {job.company}
        </button>
        <p style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 400, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {job.title} · Cover Letter
        </p>
        {isMobile && (
          <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            AI ✨
          </button>
        )}
        <button onClick={handleCopy} style={{ background: "#DFF37D", border: "none", borderRadius: 8, padding: "7px 14px", color: "#292B2D", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: isMobile ? 0 : "auto", flexShrink: 0, fontFamily: "inherit" }}>
          {copied ? "✓ Скопировано" : "Скопировать 📋"}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: editor */}
        <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", borderRight: "0.5px solid rgba(41,43,45,0.08)", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ padding: "10px 16px", borderBottom: "0.5px solid rgba(41,43,45,0.08)", display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => generate()} disabled={generating || !resumeProfile} style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "0.5px solid rgba(41,43,45,0.15)", background: "transparent", color: "#292B2D", cursor: "pointer", fontFamily: "inherit", opacity: generating || !resumeProfile ? 0.4 : 1 }}>
              Переписать ↺
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setToneOpen(!toneOpen)} style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "0.5px solid rgba(41,43,45,0.15)", background: "transparent", color: "#292B2D", cursor: "pointer", fontFamily: "inherit" }}>
                Тон ↓
              </button>
              {toneOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", borderRadius: 10, border: "0.5px solid rgba(41,43,45,0.12)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden", minWidth: 140 }}>
                  {TONES.map(t => (
                    <button key={t} onClick={() => { setToneOpen(false); generate(t); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 12, color: "#292B2D", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(41,43,45,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor area */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {generating && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 5 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #4558C8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: 13, color: "rgba(41,43,45,0.5)", margin: 0 }}>Пишу письмо...</p>
              </div>
            )}
            {!resumeProfile && !generating ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 32, height: "100%" }}>
                <span style={{ fontSize: 40 }}>📄</span>
                <p style={{ fontSize: 14, color: "rgba(41,43,45,0.5)", textAlign: "center", margin: 0 }}>Загрузите резюме чтобы сгенерировать письмо</p>
                <button onClick={onBack} style={{ background: "#292B2D", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Загрузить резюме →
                </button>
              </div>
            ) : (
              <div
                ref={editorRef}
                contentEditable={!generating}
                suppressContentEditableWarning
                onInput={handleInput}
                style={{ padding: 20, fontSize: 13, fontWeight: 300, color: "#292B2D", lineHeight: 1.8, outline: "none", whiteSpace: "pre-wrap", overflowY: "auto", height: "100%", boxSizing: "border-box" }}
              />
            )}
          </div>
        </div>

        {/* Right: AI chat (desktop) */}
        {!isMobile && <AIChatPanel />}
      </div>

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={() => setDrawerOpen(false)} />
          <div style={{ height: "60vh", display: "flex", flexDirection: "column", borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
            <AIChatPanel />
          </div>
        </div>
      )}
    </div>
  );
}
