"use client";
import { useState, useEffect, useRef, memo, useCallback } from "react";
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
    <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, minHeight: 120, borderTop: "0.5px solid rgba(41,43,45,0.08)" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => { setValue(e.target.value); autoGrow(e.target); }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Ask AI to change something..."
        style={{ width: "100%", fontSize: 13, fontWeight: 300, border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: "10px 12px", outline: "none", background: "#FFFFFF", color: "#292B2D", resize: "none", lineHeight: 1.5, fontFamily: "Inter, system-ui, sans-serif", minHeight: 80, maxHeight: 200, overflowY: "auto", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={submit} disabled={!value.trim() || disabled} style={{ width: 32, height: 32, borderRadius: 9, background: "#292B2D", border: "none", cursor: !value.trim() || disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !value.trim() || disabled ? 0.35 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
});
ChatInput.displayName = "ChatInput";

export function CoverLetterEditor({ job, resumeProfile, token, onBack }: Props) {
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [copied, setCopied] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resumeSelected, setResumeSelected] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [rightWidth, setRightWidth] = useState(300);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const rightWidthRef = useRef(300);
  const containerRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = `jm_cl_${job.job_id}`;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("editor-right-width");
    if (saved) { const w = parseInt(saved); setRightWidth(w); rightWidthRef.current = w; }
  }, []);

  useEffect(() => {
    if (!resumeOpen) return;
    const handler = (e: MouseEvent) => {
      if (resumeRef.current && !resumeRef.current.contains(e.target as Node)) setResumeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [resumeOpen]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editorRef.current && letter && editorRef.current.innerText !== letter) {
      editorRef.current.textContent = letter;
    }
  }, [letter]);

  const selectResume = useCallback(() => {
    setResumeOpen(false);
    if (resumeSelected) return;
    setResumeSelected(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const decoded = decodeURIComponent(saved);
        setLetter(decoded);
        setMessages([{ role: "ai", text: "Loaded saved draft. Edit the text on the left or ask me to change something." }]);
      } catch {
        setLetter(saved);
        setMessages([{ role: "ai", text: "Loaded saved draft." }]);
      }
    }
    // No auto-generate — wait for tone selection
  }, [resumeSelected, STORAGE_KEY]);

  const generate = async (tone: string) => {
    if (!resumeProfile) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "generate", resumeText: formatResume(resumeProfile), jobDescription: job.description || "", company: job.company, title: job.title, tone }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
        localStorage.setItem(STORAGE_KEY, encodeURIComponent(data.letter));
        setMessages([{ role: "ai", text: "Written a cover letter based on your resume and the job description. Edit the text on the left or ask me to change something." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Error generating. Please try again." }]);
    } finally {
      setGenerating(false);
    }
  };

  const selectTone = (tone: string) => {
    setSelectedTone(tone);
    if (resumeSelected && !letter) {
      generate(tone);
    }
  };

  const sendChat = useCallback(async (msg: string) => {
    if (!msg || generating) return;
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setGenerating(true);
    const currentLetter = editorRef.current?.innerText || letter;
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", currentLetter, userMessage: msg }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
        localStorage.setItem(STORAGE_KEY, encodeURIComponent(data.letter));
      }
      if (data.explanation) setMessages(prev => [...prev, { role: "ai", text: data.explanation }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Error updating." }]);
    } finally {
      setGenerating(false);
    }
  }, [generating, letter, token]);

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
    saveTimer.current = setTimeout(() => localStorage.setItem(STORAGE_KEY, encodeURIComponent(text)), 2000);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidthRef.current;

    const onMouseMove = (ev: MouseEvent) => {
      const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth;
      const delta = startX - ev.clientX;
      const next = Math.min(containerWidth * 0.5, Math.max(220, startWidth + delta));
      rightWidthRef.current = next;
      const rightEl = document.getElementById("editor-right-col");
      if (rightEl) rightEl.style.width = next + "px";
    };

    const onMouseUp = () => {
      setRightWidth(rightWidthRef.current);
      localStorage.setItem("editor-right-width", String(Math.round(rightWidthRef.current)));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const TONES = ["Professional", "Confident", "Friendly", "Concise"];
  const CHIPS = ["Shorter", "More formal", "Add metrics", "In English"];
  const resumeName = resumeProfile?.title || resumeProfile?.name || "Main";

  const AIChatPanel = () => (
    <div id="editor-right-col" style={{ width: isMobile ? "100%" : rightWidth, flexShrink: 0, display: "flex", flexDirection: "column", background: "#EFF0F6", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) =>
          m.role === "ai" ? (
            <div key={i} style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, fontWeight: 300, color: "#292B2D", lineHeight: 1.55, border: "0.5px solid rgba(41,43,45,0.08)" }}>{m.text}</div>
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
          {job.title} · Cover Letter
        </p>
        {isMobile && (
          <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>AI ✨</button>
        )}
        <button onClick={handleCopy} style={{ background: "#DFF37D", border: "none", borderRadius: 8, padding: "7px 14px", color: "#292B2D", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: isMobile ? 0 : "auto", flexShrink: 0, fontFamily: "inherit" }}>
          {copied ? "✓ Copied" : "Copy all"}
        </button>
      </div>

      {/* Body */}
      <div ref={containerRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 300, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ padding: "10px 16px", borderBottom: "0.5px solid rgba(41,43,45,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            {/* Resume dropdown */}
            <div ref={resumeRef} style={{ position: "relative" }}>
              <button
                onClick={() => setResumeOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 8, border: resumeSelected ? "none" : "0.5px solid rgba(41,43,45,0.2)", background: resumeSelected ? "#292B2D" : "white", color: resumeSelected ? "white" : "#292B2D", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                {resumeSelected ? `${resumeName} ↓` : "Select resume ↓"}
              </button>
              {resumeOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "white", border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: 4, zIndex: 200, minWidth: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  {resumeProfile && (
                    <div onMouseDown={e => { e.preventDefault(); selectResume(); }} style={{ fontSize: 12, fontWeight: resumeSelected ? 500 : 400, color: resumeSelected ? "#4558C8" : "#292B2D", padding: "8px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: resumeSelected ? "rgba(69,88,200,0.08)" : "transparent" }}
                      onMouseEnter={e => { if (!resumeSelected) e.currentTarget.style.background = "rgba(41,43,45,0.05)"; }}
                      onMouseLeave={e => { if (!resumeSelected) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(41,43,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#292B2D" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      </div>
                      {resumeName}
                    </div>
                  )}
                  <div onMouseDown={e => { e.preventDefault(); setResumeOpen(false); onBack(); }} style={{ fontSize: 12, fontWeight: 400, color: "#4558C8", padding: "8px 12px", borderRadius: 7, cursor: "pointer", borderTop: "0.5px solid rgba(41,43,45,0.08)", marginTop: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(69,88,200,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    + Add resume
                  </div>
                </div>
              )}
            </div>

            {/* Tone buttons — shown after resume selected */}
            {resumeSelected && TONES.map(t => (
              <button
                key={t}
                onClick={() => selectTone(t)}
                style={{
                  fontSize: 11,
                  fontWeight: selectedTone === t ? 500 : 400,
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: selectedTone === t
                    ? "0.5px solid rgba(41,43,45,0.2)"
                    : "0.5px dashed rgba(238,94,55,0.5)",
                  background: selectedTone === t ? "rgba(41,43,45,0.06)" : "transparent",
                  color: selectedTone === t ? "#292B2D" : "rgba(41,43,45,0.5)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >{t}</button>
            ))}

            {/* Rewrite — only after both selected */}
            {resumeSelected && selectedTone && (
              <button
                onClick={() => generate(selectedTone)}
                disabled={generating}
                style={{ fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 8, border: "0.5px solid rgba(41,43,45,0.15)", background: "transparent", color: "#292B2D", cursor: generating ? "default" : "pointer", fontFamily: "inherit", opacity: generating ? 0.4 : 1, whiteSpace: "nowrap" }}>
                Rewrite ↺
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {generating && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 5 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #4558C8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: 13, color: "rgba(41,43,45,0.5)", margin: 0 }}>Writing cover letter...</p>
              </div>
            )}
            {!resumeProfile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", textAlign: "center", height: "100%" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", lineHeight: 1.4, margin: 0 }}>No resumes yet</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>Upload your resume to get started.<br />We'll use it to write your cover letter.</p>
                <button onClick={onBack} style={{ background: "#292B2D", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", marginTop: 4 }}>
                  Upload Resume →
                </button>
              </div>
            ) : !resumeSelected ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 24px", textAlign: "center", height: "100%" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="14 2 14 8 20 8" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", lineHeight: 1.4, margin: 0 }}>Select a resume and writing tone above —</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>I'll write your cover letter once both are chosen.</p>
              </div>
            ) : resumeSelected && !selectedTone && !letter ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 24px", textAlign: "center", height: "100%" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="14 2 14 8 20 8" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", lineHeight: 1.4, margin: 0 }}>Select a resume and writing tone above —</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>I'll write your cover letter once both are chosen.</p>
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

        {/* Resize handle */}
        {!isMobile && (
          <div
            onMouseDown={handleResizeMouseDown}
            style={{ width: 4, cursor: "col-resize", flexShrink: 0, background: "rgba(69,88,200,0.25)", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4558C8")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(69,88,200,0.25)")}
          />
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
