"use client";
import { useState, useEffect, useRef } from "react";
import type { SavedJob } from "./SavedJobCard";

interface Props {
  job: SavedJob;
  resumeProfile: any;
  token: string;
  onBack: () => void;
}

type Bullet = { adapted: string; original: string; tags: string[] };
type Skills = { match: string[]; add: string[]; neutral: string[] };
type AdaptedResume = { summary: string; bullets: Bullet[]; skills: Skills };
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

function BulletItem({ bullet, onChange }: { bullet: Bullet; onChange: (b: Bullet) => void }) {
  const [showOrig, setShowOrig] = useState(false);
  return (
    <div style={{ borderRadius: 9, border: "0.5px solid rgba(41,43,45,0.08)", overflow: "hidden", background: "#fff" }}>
      {/* Main text */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 11px" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4558C8", marginTop: 7, flexShrink: 0 }} />
        <textarea
          value={bullet.adapted}
          onChange={e => onChange({ ...bullet, adapted: e.target.value })}
          rows={2}
          style={{ flex: 1, fontSize: 12, fontWeight: 300, color: "#292B2D", lineHeight: 1.65, border: "none", outline: "none", resize: "none", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" }}
        />
      </div>
      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", background: "rgba(41,43,45,0.02)", borderTop: "0.5px solid rgba(41,43,45,0.06)", flexWrap: "wrap" }}>
        {bullet.tags.map(tag => (
          <span key={tag} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "rgba(223,243,125,0.5)", color: "#4a5a00", fontWeight: 400 }}>
            {tag}
          </span>
        ))}
        <button onClick={() => setShowOrig(!showOrig)} style={{ marginLeft: "auto", fontSize: 10, color: "rgba(41,43,45,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {showOrig ? "скрыть оригинал ↑" : "посмотреть оригинал →"}
        </button>
      </div>
      {/* Original (hidden by default) */}
      {showOrig && (
        <div style={{ padding: "7px 11px 9px", background: "rgba(41,43,45,0.03)", borderTop: "0.5px dashed rgba(41,43,45,0.1)" }}>
          <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(41,43,45,0.4)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
            {bullet.original}
          </p>
        </div>
      )}
    </div>
  );
}

export function ResumeAdapterEditor({ job, resumeProfile, token, onBack }: Props) {
  const [adapted, setAdapted] = useState<AdaptedResume | null>(null);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = `jm_ra_${job.job_id}`;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdaptedResume;
        setAdapted(parsed);
        const resumeName = resumeProfile?.name || "ваше резюме";
        setMessages([{
          role: "ai",
          text: `Загрузил сохранённую адаптацию для «${resumeName}».\n\nСиним — навыки которые уже есть.\nЗелёным — стоит добавить перед отправкой.`,
        }]);
      } catch { generate(); }
    } else if (resumeProfile) {
      generate();
    } else {
      setMessages([{ role: "ai", text: "Загрузите резюме чтобы адаптировать его под вакансию." }]);
    }
  }, []);

  useEffect(() => {
    if (summaryRef.current && adapted?.summary) {
      if (summaryRef.current.innerText !== adapted.summary) {
        summaryRef.current.innerText = adapted.summary;
      }
    }
  }, [adapted?.summary]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveAdapted = (data: AdaptedResume) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 2000);
  };

  const generate = async () => {
    if (!resumeProfile) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "generate",
          resumeText: formatResume(resumeProfile),
          jobDescription: job.description || "",
          title: job.title,
          company: job.company,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAdapted(data.result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.result));
        const resumeName = resumeProfile.name || "резюме";
        setMessages([{
          role: "ai",
          text: `Выбрал резюме «${resumeName}». Адаптировал саммари и буллеты под вакансию ${job.company}.\n\nСиним — навыки которые уже есть.\nЗелёным — стоит добавить перед отправкой.`,
        }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "Ошибка при генерации. Попробуйте ещё раз." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Ошибка при генерации. Попробуйте ещё раз." }]);
    } finally {
      setGenerating(false);
    }
  };

  const sendChat = async (msg: string) => {
    const text = msg.trim();
    if (!text || generating || !adapted) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setGenerating(true);

    // Sync summary from DOM before sending
    const currentAdapted = {
      ...adapted,
      summary: summaryRef.current?.innerText || adapted.summary,
    };

    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", currentJSON: currentAdapted, userMessage: text }),
      });
      const data = await res.json();
      if (data.result) {
        setAdapted(data.result);
        saveAdapted(data.result);
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
    if (!adapted) return;
    const summary = summaryRef.current?.innerText || adapted.summary;
    const bullets = adapted.bullets.map(b => `• ${b.adapted}`).join("\n");
    const addSkills = adapted.skills.add.join(", ");
    const text = [
      "[Саммари]",
      summary,
      "",
      "[Опыт]",
      bullets,
      ...(addSkills ? ["", "[Навыки — добавить в резюме]", addSkills] : []),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    localStorage.setItem(`jm_ra_done_${job.job_id}`, "1");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateBullet = (i: number, bullet: Bullet) => {
    if (!adapted) return;
    const updated = { ...adapted, bullets: adapted.bullets.map((b, idx) => idx === i ? bullet : b) };
    setAdapted(updated);
    saveAdapted(updated);
  };

  const handleSummaryInput = () => {
    if (!adapted || !summaryRef.current) return;
    const text = summaryRef.current.innerText;
    const updated = { ...adapted, summary: text };
    saveAdapted(updated);
  };

  const CHIPS = ["Добавь метрики", "Короче", "ATS-проверка", "На английском"];

  const AIChatPanel = () => (
    <div style={{ width: isMobile ? "100%" : 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "#EFF0F6" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) =>
          m.role === "ai" ? (
            <div key={i} style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, fontWeight: 300, color: "#292B2D", lineHeight: 1.55, border: "0.5px solid rgba(41,43,45,0.08)", whiteSpace: "pre-line" }}>
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
      <div style={{ padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 4, borderTop: "0.5px solid rgba(41,43,45,0.08)", flexShrink: 0 }}>
        {CHIPS.map(c => (
          <button key={c} onClick={() => sendChat(c)} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "#fff", color: "#4558C8", border: "0.5px solid rgba(69,88,200,0.25)", cursor: "pointer", fontWeight: 400, fontFamily: "inherit" }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ padding: "8px 12px 12px", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(input); } }}
          placeholder="Попросите AI изменить..."
          rows={1}
          style={{ flex: 1, fontSize: 12, fontWeight: 300, border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: "8px 11px", outline: "none", background: "#fff", color: "#292B2D", resize: "none", lineHeight: 1.4, fontFamily: "Inter, system-ui, sans-serif", maxHeight: 80 }}
        />
        <button onClick={() => sendChat(input)} disabled={!input.trim() || generating} style={{ width: 32, height: 32, borderRadius: 9, background: "#292B2D", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || generating ? 0.4 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 7L2 2l2 5-2 5 10-5z" fill="white" /></svg>
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
          {job.title} · Резюме
        </p>
        {isMobile && (
          <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            AI ✨
          </button>
        )}
        <button onClick={handleCopy} disabled={!adapted} style={{ background: "#DFF37D", border: "none", borderRadius: 8, padding: "7px 14px", color: "#292B2D", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: isMobile ? 0 : "auto", flexShrink: 0, fontFamily: "inherit", opacity: adapted ? 1 : 0.4 }}>
          {copied ? "✓ Скопировано" : "Скопировать 📋"}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: editor */}
        <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", borderRight: "0.5px solid rgba(41,43,45,0.08)", overflow: "hidden" }}>
          {/* Resume picker */}
          <div style={{ padding: "10px 16px", borderBottom: "0.5px solid rgba(41,43,45,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, overflowX: "auto" }}>
            <span style={{ fontSize: 10, color: "rgba(41,43,45,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", flexShrink: 0 }}>Резюме</span>
            {resumeProfile ? (
              <button style={{ fontSize: 11, padding: "4px 11px", borderRadius: 7, border: "none", background: "#292B2D", color: "#fff", fontWeight: 500, cursor: "default", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                {resumeProfile.title || "Основное"}
              </button>
            ) : null}
            <button onClick={onBack} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 7, border: "0.5px dashed rgba(41,43,45,0.2)", background: "transparent", color: "rgba(41,43,45,0.35)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
              + Добавить
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
            {generating && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 5 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #4558C8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: 13, color: "rgba(41,43,45,0.5)", margin: 0 }}>Адаптирую резюме...</p>
              </div>
            )}

            {!resumeProfile ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 32, flex: 1 }}>
                <span style={{ fontSize: 40 }}>📋</span>
                <p style={{ fontSize: 14, color: "rgba(41,43,45,0.5)", textAlign: "center", margin: 0 }}>Загрузите резюме чтобы адаптировать его</p>
                <button onClick={onBack} style={{ background: "#292B2D", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Загрузить резюме →
                </button>
              </div>
            ) : adapted ? (
              <>
                {/* Summary */}
                <div>
                  <p style={{ fontSize: 10, color: "rgba(41,43,45,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400, marginBottom: 6 }}>Саммари</p>
                  <div style={{ position: "relative" }}>
                    <div
                      ref={summaryRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleSummaryInput}
                      style={{ fontSize: 12, fontWeight: 300, color: "#292B2D", lineHeight: 1.75, padding: "11px 13px", background: "rgba(69,88,200,0.05)", borderRadius: 9, borderLeft: "2px solid #4558C8", outline: "none" }}
                    />
                    <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: "rgba(69,88,200,0.1)", color: "#4558C8", padding: "2px 7px", borderRadius: 10, fontWeight: 400, pointerEvents: "none" }}>
                      AI адаптировано
                    </span>
                  </div>
                </div>

                {/* Bullets */}
                <div>
                  <p style={{ fontSize: 10, color: "rgba(41,43,45,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400, marginBottom: 6 }}>Опыт — адаптированные буллеты</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {adapted.bullets.map((b, i) => (
                      <BulletItem key={i} bullet={b} onChange={bullet => updateBullet(i, bullet)} />
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p style={{ fontSize: 10, color: "rgba(41,43,45,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400, marginBottom: 6 }}>Навыки</p>
                  {/* Legend */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    {[
                      { color: "rgba(69,88,200,0.1)", border: "rgba(69,88,200,0.2)", text: "#4558C8", label: "уже есть" },
                      { color: "rgba(223,243,125,0.45)", border: "rgba(100,130,0,0.2)", text: "#3d4d00", label: "добавить" },
                      { color: "rgba(41,43,45,0.05)", border: "rgba(41,43,45,0.1)", text: "rgba(41,43,45,0.45)", label: "нерелевантные" },
                    ].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(41,43,45,0.4)", fontWeight: 300 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, border: `0.5px solid ${l.border}`, display: "inline-block" }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {adapted.skills.match.map(s => (
                      <span key={s} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, fontWeight: 400, background: "rgba(69,88,200,0.1)", color: "#4558C8", border: "0.5px solid rgba(69,88,200,0.2)" }}>{s}</span>
                    ))}
                    {adapted.skills.add.map(s => (
                      <span key={s} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, fontWeight: 400, background: "rgba(223,243,125,0.45)", color: "#3d4d00", border: "0.5px solid rgba(100,130,0,0.2)" }}>+ {s}</span>
                    ))}
                    {adapted.skills.neutral.map(s => (
                      <span key={s} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, fontWeight: 400, background: "rgba(41,43,45,0.05)", color: "rgba(41,43,45,0.45)", border: "0.5px solid rgba(41,43,45,0.1)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
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
