"use client";
import { useState, useEffect, useRef, memo, useCallback } from "react";
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
    `${p.name || ""} — ${p.title || ""} (${p.level || ""}, ${p.years_experience || 0} years experience)`,
    `Summary: ${p.summary || ""}`,
    `Skills: ${(p.skills || []).join(", ")}`,
    `Industries: ${(p.industries || []).join(", ")}`,
    `Keywords: ${(p.keywords || []).slice(0, 20).join(", ")}`,
  ].join("\n");
}

const ChatInput = memo(({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, borderTop: "0.5px solid rgba(41,43,45,0.08)" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => { setValue(e.target.value); autoGrow(e.target); }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Ask AI to change something..."
        style={{ flex: 1, fontSize: 13, fontWeight: 300, border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: "10px 12px", outline: "none", background: "#FFFFFF", color: "#292B2D", resize: "none", lineHeight: 1.5, fontFamily: "Inter, system-ui, sans-serif", minHeight: 80, maxHeight: 160, overflowY: "auto" }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={submit} disabled={!value.trim() || disabled} style={{ width: 32, height: 32, borderRadius: 9, background: "#292B2D", border: "none", cursor: !value.trim() || disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !value.trim() || disabled ? 0.35 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 7L2 2l2 5-2 5 10-5z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  );
});
ChatInput.displayName = "ChatInput";

function BulletItem({ bullet, onChange }: { bullet: Bullet; onChange: (b: Bullet) => void }) {
  const [showOrig, setShowOrig] = useState(false);
  return (
    <div style={{ borderRadius: 9, border: "0.5px solid rgba(41,43,45,0.08)", overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 11px" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4558C8", marginTop: 7, flexShrink: 0 }} />
        <textarea
          value={bullet.adapted}
          onChange={e => onChange({ ...bullet, adapted: e.target.value })}
          rows={2}
          style={{ flex: 1, fontSize: 12, fontWeight: 300, color: "#292B2D", lineHeight: 1.65, border: "none", outline: "none", resize: "none", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", background: "rgba(41,43,45,0.02)", borderTop: "0.5px solid rgba(41,43,45,0.06)", flexWrap: "wrap" }}>
        {bullet.tags.map(tag => (
          <span key={tag} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "rgba(223,243,125,0.5)", color: "#4a5a00", fontWeight: 400 }}>{tag}</span>
        ))}
        <button onClick={() => setShowOrig(!showOrig)} style={{ marginLeft: "auto", fontSize: 10, color: "rgba(41,43,45,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {showOrig ? "hide original ↑" : "show original →"}
        </button>
      </div>
      {showOrig && (
        <div style={{ padding: "7px 11px 9px", background: "rgba(41,43,45,0.03)", borderTop: "0.5px dashed rgba(41,43,45,0.1)" }}>
          <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(41,43,45,0.4)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{bullet.original}</p>
        </div>
      )}
    </div>
  );
}

export function ResumeAdapterEditor({ job, resumeProfile, token, onBack }: Props) {
  const [adapted, setAdapted] = useState<AdaptedResume | null>(null);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resumeSelected, setResumeSelected] = useState(false);
  const [rightWidth, setRightWidth] = useState(260);

  const summaryRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = `jm_ra_${job.job_id}`;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("editor-right-width");
    if (saved) setRightWidth(Number(saved));
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (summaryRef.current && adapted?.summary && summaryRef.current.innerText !== adapted.summary) {
      summaryRef.current.innerText = adapted.summary;
    }
  }, [adapted?.summary]);

  const selectResume = useCallback(() => {
    if (resumeSelected) return;
    setResumeSelected(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdaptedResume;
        setAdapted(parsed);
        setMessages([{ role: "ai", text: `Loaded saved adaptation for "${resumeProfile?.name || "your resume"}".\n\nBlue = skills you have.\nGreen = consider adding.` }]);
      } catch { generate(); }
    } else {
      generate();
    }
  }, [resumeSelected]);

  const saveAdapted = (data: AdaptedResume) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), 2000);
  };

  const generate = async () => {
    if (!resumeProfile) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "generate", resumeText: formatResume(resumeProfile), jobDescription: job.description || "", title: job.title, company: job.company }),
      });
      const data = await res.json();
      if (data.result) {
        setAdapted(data.result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.result));
        setMessages([{ role: "ai", text: `Selected resume "${resumeProfile.name || resumeProfile.title || "your resume"}". Adapted summary and bullets for ${job.company}.\n\nBlue = skills you have.\nGreen = consider adding.` }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "Error generating. Please try again." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Error generating. Please try again." }]);
    } finally {
      setGenerating(false);
    }
  };

  const sendChat = useCallback(async (msg: string) => {
    if (!msg || generating || !adapted) return;
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setGenerating(true);
    const currentAdapted = { ...adapted, summary: summaryRef.current?.innerText || adapted.summary };
    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", currentJSON: currentAdapted, userMessage: msg }),
      });
      const data = await res.json();
      if (data.result) { setAdapted(data.result); saveAdapted(data.result); }
      if (data.explanation) setMessages(prev => [...prev, { role: "ai", text: data.explanation }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Error updating." }]);
    } finally {
      setGenerating(false);
    }
  }, [generating, adapted, token]);

  const handleCopy = async () => {
    if (!adapted) return;
    const summary = summaryRef.current?.innerText || adapted.summary;
    const bullets = adapted.bullets.map(b => `• ${b.adapted}`).join("\n");
    const addSkills = adapted.skills.add.join(", ");
    const text = ["[Summary]", summary, "", "[Experience]", bullets, ...(addSkills ? ["", "[Skills — add to resume]", addSkills] : [])].join("\n");
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
    saveAdapted({ ...adapted, summary: summaryRef.current.innerText });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightColRef.current?.offsetWidth ?? 260;
    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(420, Math.max(200, startWidth + (startX - ev.clientX)));
      setRightWidth(newWidth);
    };
    const onMouseUp = () => {
      localStorage.setItem("editor-right-width", String(rightColRef.current?.offsetWidth ?? rightWidth));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const CHIPS = ["Add metrics", "Shorter", "ATS check", "In English"];

  const AIChatPanel = () => (
    <div ref={rightColRef} style={{ width: isMobile ? "100%" : rightWidth, flexShrink: 0, display: "flex", flexDirection: "column", background: "#EFF0F6" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) =>
          m.role === "ai" ? (
            <div key={i} style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, fontWeight: 300, color: "#292B2D", lineHeight: 1.55, border: "0.5px solid rgba(41,43,45,0.08)", whiteSpace: "pre-line" }}>{m.text}</div>
          ) : (
            <div key={i} style={{ background: "#292B2D", borderRadius: "10px 10px 3px 10px", padding: "9px 11px", fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, alignSelf: "flex-end", maxWidth: "92%" }}>{m.text}</div>
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
          <button key={c} onClick={() => sendChat(c)} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "#fff", color: "#4558C8", border: "0.5px solid rgba(69,88,200,0.25)", cursor: "pointer", fontWeight: 400, fontFamily: "inherit" }}>{c}</button>
        ))}
      </div>
      <ChatInput onSend={sendChat} disabled={generating} />
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
          {job.title} · Resume
        </p>
        {isMobile && (
          <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            AI ✨
          </button>
        )}
        <button onClick={handleCopy} disabled={!adapted} style={{ background: "#DFF37D", border: "none", borderRadius: 8, padding: "7px 14px", color: "#292B2D", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: isMobile ? 0 : "auto", flexShrink: 0, fontFamily: "inherit", opacity: adapted ? 1 : 0.4 }}>
          {copied ? "✓ Copied" : "Copy all"}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: editor */}
        <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Resume picker */}
          <div style={{ padding: "10px 16px", borderBottom: "0.5px solid rgba(41,43,45,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, overflowX: "auto" }}>
            <span style={{ fontSize: 10, color: "rgba(41,43,45,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", flexShrink: 0 }}>Resume</span>
            {resumeProfile && (
              <button onClick={selectResume} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 7, border: resumeSelected ? "none" : "0.5px solid rgba(41,43,45,0.15)", background: resumeSelected ? "#292B2D" : "transparent", color: resumeSelected ? "#fff" : "rgba(41,43,45,0.5)", fontWeight: resumeSelected ? 500 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                {resumeProfile.title || resumeProfile.name || "Main"}
              </button>
            )}
            <button onClick={onBack} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 7, border: "0.5px dashed rgba(41,43,45,0.2)", background: "transparent", color: "rgba(41,43,45,0.35)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
              + Add
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
            {generating && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 5 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #4558C8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: 13, color: "rgba(41,43,45,0.5)", margin: 0 }}>Adapting resume...</p>
              </div>
            )}

            {!resumeProfile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", textAlign: "center", flex: 1 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", lineHeight: 1.4, margin: 0 }}>No resumes yet</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>Upload your resume to get started.<br />We'll use it to adapt your experience bullets.</p>
                <button onClick={onBack} style={{ background: "#292B2D", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", marginTop: 4 }}>
                  Upload Resume →
                </button>
              </div>
            ) : !resumeSelected ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", textAlign: "center", flex: 1 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#292B2D" strokeWidth="1.5" />
                  <line x1="7" y1="8" x2="17" y2="8" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="7" y1="12" x2="17" y2="12" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="7" y1="16" x2="13" y2="16" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", lineHeight: 1.4, margin: 0 }}>Select a style and resume above —</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>I'll adapt your bullets to match this job.</p>
              </div>
            ) : adapted ? (
              <>
                {/* Summary */}
                <div>
                  <p style={{ fontSize: 10, color: "rgba(41,43,45,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400, marginBottom: 6 }}>Summary</p>
                  <div style={{ position: "relative" }}>
                    <div
                      ref={summaryRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleSummaryInput}
                      style={{ fontSize: 12, fontWeight: 300, color: "#292B2D", lineHeight: 1.75, padding: "11px 13px", background: "rgba(69,88,200,0.05)", borderRadius: 9, borderLeft: "2px solid #4558C8", outline: "none" }}
                    />
                    <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: "rgba(69,88,200,0.1)", color: "#4558C8", padding: "2px 7px", borderRadius: 10, fontWeight: 400, pointerEvents: "none" }}>
                      AI adapted
                    </span>
                  </div>
                </div>

                {/* Bullets */}
                <div>
                  <p style={{ fontSize: 10, color: "rgba(41,43,45,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400, marginBottom: 6 }}>Experience — adapted bullets</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {adapted.bullets.map((b, i) => (
                      <BulletItem key={i} bullet={b} onChange={bullet => updateBullet(i, bullet)} />
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p style={{ fontSize: 10, color: "rgba(41,43,45,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400, marginBottom: 6 }}>Skills</p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    {[
                      { color: "rgba(69,88,200,0.1)", border: "rgba(69,88,200,0.2)", text: "#4558C8", label: "you have" },
                      { color: "rgba(223,243,125,0.45)", border: "rgba(100,130,0,0.2)", text: "#3d4d00", label: "consider adding" },
                      { color: "rgba(41,43,45,0.05)", border: "rgba(41,43,45,0.1)", text: "rgba(41,43,45,0.45)", label: "not relevant" },
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

        {/* Resize handle */}
        {!isMobile && (
          <div
            onMouseDown={handleResizeMouseDown}
            style={{ width: 4, background: "transparent", cursor: "col-resize", flexShrink: 0, position: "relative" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(69,88,200,0.3)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 2, height: 32, background: "rgba(41,43,45,0.15)", borderRadius: 2 }} />
          </div>
        )}

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
