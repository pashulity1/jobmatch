"use client";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import type { SavedJob } from "./SavedJobCard";

interface Props {
  job: SavedJob;
  resumeProfile: any;
  token: string;
  onBack: () => void;
}

type Requirement = { id: string; label: string; what_employer_wants: string };
type Bullet = {
  id: string; requirementId: string; requirementLabel: string;
  adapted: string; original: string; employer: string;
  matched: boolean; wasAdapted: boolean; tags: string[];
};
type Skills = { match: string[]; add: string[]; neutral: string[] };
type MatchAssessment = { skills_match: string[]; experience_match: string[]; gaps: string[]; recruiter_questions: string[]; match_percent: number; recommendation: "apply" | "skip" };
type AdaptedResume = { requirements: Requirement[]; summary: string; bullets: Bullet[]; skills: Skills; gaps?: string[]; match_assessment?: MatchAssessment };
type Msg = { role: "ai" | "user"; text: string };
type LoadingStep = "" | "analyzing" | "matching";

function normalizeBullets(bullets: any[]): Bullet[] {
  return bullets.map((b, i) => ({
    id: b.id || `b${i}`,
    requirementId: b.requirementId || "",
    requirementLabel: b.requirementLabel || "",
    adapted: b.adapted || "",
    original: b.original || "",
    employer: b.employer || "",
    matched: b.matched !== false,
    wasAdapted: b.wasAdapted ?? (b.adapted !== b.original && !!b.original),
    tags: b.tags || [],
  }));
}

function formatResume(p: any): string {
  if (!p) return "";
  const lines: string[] = [
    `${p.name || ""} — ${p.title || ""} (${p.level || ""}, ${p.years_experience || 0} years experience)`,
    `Summary: ${p.summary || ""}`,
    `Skills: ${(p.skills || []).join(", ")}`,
  ];
  const exp: any[] = p.work_experience || [];
  if (exp.length > 0) {
    lines.push("\nWORK EXPERIENCE:");
    exp.forEach((job: any) => {
      lines.push(`\n${job.company} | ${job.title} | ${job.dates || ""}`);
      (job.bullets || []).forEach((b: string) => lines.push(`• ${b}`));
    });
  } else {
    lines.push(`Keywords: ${(p.keywords || []).slice(0, 30).join(", ")}`);
  }
  return lines.join("\n");
}

const ChatInput = memo(({ onSend, disabled, height, onHeightChange }: {
  onSend: (text: string) => void; disabled?: boolean; height: number; onHeightChange: (h: number) => void;
}) => {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const handle = e.currentTarget as HTMLElement;
    handle.style.background = "#4558C8";
    const onMove = (ev: MouseEvent) => onHeightChange(Math.max(120, Math.min(420, startH + (startY - ev.clientY))));
    const onUp = () => { handle.style.background = ""; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div style={{ height, flexShrink: 0, display: "flex", flexDirection: "column", background: "#EFF0F6" }}>
      {/* Drag handle */}
      <div onMouseDown={handleDragStart} style={{ height: 5, cursor: "ns-resize", background: "rgba(69,88,200,0.2)", flexShrink: 0, transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(69,88,200,0.5)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(69,88,200,0.2)")} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, padding: "8px 12px 10px", borderTop: "0.5px solid rgba(41,43,45,0.08)" }}>
        <textarea
          ref={ref}
          value={value}
          placeholder="Ask AI to change something..."
          disabled={disabled}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1, width: "100%", background: "#FFFFFF", color: "#292B2D", border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 300, lineHeight: 1.55, fontFamily: "Inter, system-ui, sans-serif", outline: "none", resize: "none", overflowY: "auto", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "rgba(41,43,45,0.3)", fontFamily: "Inter, sans-serif" }}>Enter to send · Shift+Enter new line</span>
          <button onClick={send} disabled={!value.trim() || disabled} style={{ width: 32, height: 32, borderRadius: 9, background: value.trim() && !disabled ? "#292B2D" : "rgba(41,43,45,0.15)", border: "none", cursor: value.trim() && !disabled ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
});
ChatInput.displayName = "ChatInput";

function BulletItem({ bullet, onChange, onRewrite, onInlineRewrite, rewriting, showOrig, onToggleOrig }: {
  bullet: Bullet; onChange: (b: Bullet) => void; onRewrite: (id: string) => void;
  onInlineRewrite: (id: string, cmd: string) => Promise<void>;
  rewriting: boolean; showOrig: boolean; onToggleOrig: () => void;
}) {
  const [cmd, setCmd] = useState("");
  const [inlineLoading, setInlineLoading] = useState(false);

  const applyCmd = async () => {
    if (!cmd.trim() || inlineLoading) return;
    setInlineLoading(true);
    await onInlineRewrite(bullet.id, cmd.trim());
    setCmd("");
    setInlineLoading(false);
  };

  const busy = rewriting || inlineLoading;

  return (
    <div className="bullet-item" style={{ marginBottom: 4 }}>
      {showOrig && bullet.requirementLabel && (
        <div style={{ padding: "4px 9px 0", fontSize: 9, color: "rgba(69,88,200,0.55)", fontStyle: "italic" }}>▷ Addresses: {bullet.requirementLabel}</div>
      )}
      <div className="bullet-main">
        <div className="bullet-dot" />
        {busy ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
            <div style={{ width: 16, height: 16, border: "2px solid rgba(69,88,200,0.2)", borderTopColor: "#4558C8", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          </div>
        ) : (
          <textarea
            className="bullet-text"
            value={bullet.adapted}
            onChange={e => onChange({ ...bullet, adapted: e.target.value })}
            rows={2}
            style={{ resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "inherit", fontWeight: 300, color: "#292B2D", lineHeight: 1.65, flex: 1, width: "100%" }}
          />
        )}
      </div>
      <div className="bullet-actions">
        {bullet.tags.map(tag => <span key={tag} className="btag">{tag}</span>)}
        <button className="rewrite-btn" onClick={() => onRewrite(bullet.id)} disabled={busy}>↺ Rewrite</button>
        {bullet.wasAdapted && (
          <button className="orig-btn" onClick={onToggleOrig}>{showOrig ? "hide original ↑" : "show original ↓"}</button>
        )}
      </div>
      {/* Inline AI command — visible on focus-within via CSS */}
      <div className="bullet-command">
        <input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") applyCmd(); }}
          placeholder="Tell AI what to change..."
          disabled={busy}
          style={{ flex: 1, fontSize: 11, fontWeight: 300, border: "0.5px solid rgba(69,88,200,0.25)", borderRadius: 6, padding: "4px 8px", outline: "none", fontFamily: "inherit", color: "#292B2D", background: "white" }}
        />
        <button onClick={applyCmd} disabled={!cmd.trim() || busy}
          style={{ fontSize: 10, fontWeight: 500, color: "white", background: cmd.trim() && !busy ? "#4558C8" : "rgba(69,88,200,0.3)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: cmd.trim() && !busy ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          Apply ↺
        </button>
      </div>
      {showOrig && bullet.wasAdapted && (
        <div style={{ padding: "6px 9px 7px", background: "rgba(41,43,45,0.02)", borderTop: "0.5px dashed rgba(41,43,45,0.1)", fontSize: 10, fontWeight: 300, color: "rgba(41,43,45,0.4)", lineHeight: 1.55, fontStyle: "italic" }}>
          {bullet.original}
        </div>
      )}
    </div>
  );
}

function JdPanel({ text, onClose }: { text: string; onClose: () => void }) {
  const lines = (text || "").split("\n");
  return (
    <>
      <div style={{ padding: "10px 14px", borderBottom: "0.5px solid rgba(41,43,45,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#292B2D" }}>Job Description</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(41,43,45,0.4)", fontSize: 16, lineHeight: 1, fontFamily: "inherit", padding: "0 2px" }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, fontSize: 11, fontWeight: 300, color: "rgba(41,43,45,0.65)", lineHeight: 1.7 }}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} style={{ height: 8 }} />;
          const isHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes("•");
          const endsColon = trimmed.endsWith(":");
          return (
            <div key={i} style={{ fontWeight: isHeader || endsColon ? 500 : 300, color: isHeader || endsColon ? "#292B2D" : "rgba(41,43,45,0.65)", marginTop: isHeader ? 12 : 0 }}>
              {trimmed}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ResumeAdapterEditor({ job, resumeProfile, token, onBack }: Props) {
  const [adapted, setAdapted] = useState<AdaptedResume | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("");
  const [rewritingBullet, setRewritingBullet] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [copied, setCopied] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeSelected, setResumeSelected] = useState(false);
  const [chatGenerating, setChatGenerating] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(160);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState("Inter, system-ui, sans-serif");
  const [aiWidth, setAiWidth] = useState(300);
  const [jdWidth, setJdWidth] = useState(260);
  const [jdOpen, setJdOpen] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = `jm_ra_${job.job_id}`;
  const generating = loadingStep !== "";

  useEffect(() => {
    const a = localStorage.getItem("editor-ai-panel-width");
    const j = localStorage.getItem("editor-jd-panel-width");
    if (a) setAiWidth(parseInt(a));
    if (j) setJdWidth(parseInt(j));
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
    if (summaryRef.current && adapted?.summary && summaryRef.current.innerText !== adapted.summary) {
      summaryRef.current.innerText = adapted.summary;
    }
  }, [adapted?.summary]);

  const startDrag = useCallback((e: React.MouseEvent, targetId: string, direction: "left" | "right", min: number, max: number) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    const startX = e.clientX;
    const startW = el.offsetWidth;
    const handle = e.currentTarget as HTMLElement;
    handle.classList.add("dragging");

    const onMove = (ev: MouseEvent) => {
      const delta = direction === "right" ? startX - ev.clientX : ev.clientX - startX;
      const next = Math.min(max, Math.max(min, startW + delta));
      el.style.width = next + "px";
    };
    const onUp = () => {
      handle.classList.remove("dragging");
      const finalW = parseInt(el.style.width) || startW;
      if (targetId === "ai-panel") setAiWidth(finalW);
      if (targetId === "jd-panel") setJdWidth(finalW);
      localStorage.setItem(`editor-${targetId}-width`, String(finalW));
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const saveAdapted = (data: AdaptedResume) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), 2000);
  };

  const selectResume = useCallback(() => {
    setResumeOpen(false);
    if (resumeSelected) return;
    setResumeSelected(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdaptedResume;
        parsed.bullets = normalizeBullets(parsed.bullets || []);
        setAdapted(parsed);
        const n = parsed.requirements?.length || 0;
        setMessages([{ role: "ai", text: `Analyzed the job and found ${n} key requirement${n !== 1 ? "s" : ""}. Adapted bullets from your last 2 employers. Click "show original ↓" to see the source text and which requirement each bullet addresses.` }]);
        return;
      } catch {}
    }
    generate();
  }, [resumeSelected]);

  const generate = async () => {
    if (!resumeProfile) return;
    setLoadingStep("analyzing");
    try {
      const resumeText = formatResume(resumeProfile);
      const res1 = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "extract-requirements", jobDescription: job.description || "", resumeText }),
      });
      const data1 = await res1.json();
      const requirements: Requirement[] = data1.requirements || [];
      const key_phrases: string[] = data1.key_phrases || [];
      const match_assessment: MatchAssessment | undefined = data1.match_assessment;

      setLoadingStep("matching");
      const res2 = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "generate", requirements, key_phrases, resumeText, jobDescription: job.description || "", title: job.title, company: job.company }),
      });
      const data2 = await res2.json();

      if (data2.result) {
        const result: AdaptedResume = { ...data2.result, requirements, bullets: normalizeBullets(data2.result.bullets || []), match_assessment };
        setAdapted(result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
        const n = requirements.length;
        const gaps = data2.result.gaps || [];
        let intro = `Analyzed the job and found ${n} key requirement${n !== 1 ? "s" : ""}. Adapted bullets from your last 2 employers. Click "show original ↓" to see the source text and which requirement each bullet addresses.`;
        if (gaps.length) intro += `\n\nNot covered (no resume match): ${gaps.join(", ")}.`;
        setMessages([{ role: "ai", text: intro }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "Error generating. Please try again." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Error generating. Please try again." }]);
    } finally {
      setLoadingStep("");
    }
  };

  const rewriteSingleBullet = async (bulletId: string) => {
    if (!adapted) return;
    const bullet = adapted.bullets.find(b => b.id === bulletId);
    if (!bullet) return;
    const req = adapted.requirements?.find(r => r.id === bullet.requirementId);
    setRewritingBullet(bulletId);
    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "rewrite-bullet", bulletOriginal: bullet.original, bulletAdapted: bullet.adapted, requirementLabel: bullet.requirementLabel, what_employer_wants: req?.what_employer_wants || "" }),
      });
      const data = await res.json();
      if (data.bullet) {
        const updated = { ...adapted, bullets: adapted.bullets.map(b => b.id === bulletId ? { ...b, adapted: data.bullet, wasAdapted: true } : b) };
        setAdapted(updated);
        saveAdapted(updated);
      }
    } catch {}
    finally { setRewritingBullet(null); }
  };

  const rewriteBulletWithCommand = async (bulletId: string, command: string) => {
    if (!adapted) return;
    const bullet = adapted.bullets.find(b => b.id === bulletId);
    if (!bullet) return;
    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "rewrite-bullet", bulletOriginal: bullet.original, bulletAdapted: bullet.adapted, requirementLabel: bullet.requirementLabel, userCommand: command }),
      });
      const data = await res.json();
      if (data.bullet) {
        const updated = { ...adapted, bullets: adapted.bullets.map(b => b.id === bulletId ? { ...b, adapted: data.bullet, wasAdapted: true } : b) };
        setAdapted(updated);
        saveAdapted(updated);
      }
    } catch {}
  };

  const sendChat = useCallback(async (msg: string) => {
    if (!msg || chatGenerating || !adapted) return;
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatGenerating(true);
    const currentAdapted = { ...adapted, summary: summaryRef.current?.innerText || adapted.summary };
    try {
      const res = await fetch("/api/resume-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", currentJSON: currentAdapted, userMessage: msg }),
      });
      const data = await res.json();
      if (data.result) {
        const result = { ...data.result, bullets: normalizeBullets(data.result.bullets || []) };
        setAdapted(result);
        saveAdapted(result);
      }
      if (data.explanation) setMessages(prev => [...prev, { role: "ai", text: data.explanation }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Error updating." }]);
    } finally { setChatGenerating(false); }
  }, [chatGenerating, adapted, token]);

  const handleCopy = async () => {
    if (!adapted) return;
    const summary = summaryRef.current?.innerText || adapted.summary;
    const bullets = adapted.bullets.filter(b => b.matched !== false).map(b => `• ${b.adapted}`).join("\n");
    const addSkills = adapted.skills?.add?.join(", ") || "";
    const text = ["[Summary]", summary, "", "[Experience]", bullets, ...(addSkills ? ["", "[Skills — consider adding]", addSkills] : [])].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateBullet = (i: number, bullet: Bullet) => {
    if (!adapted) return;
    const updated = { ...adapted, bullets: adapted.bullets.map((b, idx) => idx === i ? bullet : b) };
    setAdapted(updated);
    saveAdapted(updated);
  };

  const toggleOriginal = (id: string) => setShowOriginal(prev => ({ ...prev, [id]: !prev[id] }));

  const printResume = () => {
    if (!adapted) return;
    const summary = summaryRef.current?.innerText || adapted.summary || "";
    const matchedBullets = adapted.bullets.filter(b => b.matched !== false);
    const byEmployer: Record<string, Bullet[]> = {};
    matchedBullets.forEach(b => {
      const key = b.employer || "";
      if (!byEmployer[key]) byEmployer[key] = [];
      byEmployer[key].push(b);
    });

    const employerHtml = Object.entries(byEmployer).map(([emp, bs]) => `
      <div class="employer">
        ${emp ? `<div class="employer-name">${emp}</div>` : ""}
        <ul>${bs.map(b => `<li>${b.adapted.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`).join("")}</ul>
      </div>
    `).join("");

    const skillsMatch = (adapted.skills?.match || []).join(", ");
    const skillsAdd = (adapted.skills?.add || []).join(", ");
    const contact = [resumeProfile?.title, resumeProfile?.location, resumeProfile?.email].filter(Boolean).join("  ·  ");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${resumeProfile?.name || "Resume"}</title>
<style>
  @page { margin: 16mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${fontFamily}; font-size: ${fontSize}pt; color: #111; line-height: 1.55; background: white; }
  .name { font-size: 18pt; font-weight: 600; text-align: center; letter-spacing: -0.01em; margin-bottom: 4px; }
  .contact { font-size: 8.5pt; color: #555; text-align: center; margin-bottom: 22px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #111; border-bottom: 1pt solid #111; padding-bottom: 2px; margin-bottom: 9px; }
  .summary { font-size: ${fontSize}pt; line-height: 1.65; color: #111; }
  .employer { margin-bottom: 12px; }
  .employer-name { font-size: ${fontSize}pt; font-weight: 600; margin-bottom: 5px; }
  ul { padding-left: 14px; }
  li { margin-bottom: 3px; line-height: 1.5; }
  .skills { font-size: ${Math.max(fontSize - 1, 9)}pt; color: #333; line-height: 1.6; }
  .skills-add { color: #555; margin-top: 3px; }
</style>
</head>
<body>
  <div class="name">${(resumeProfile?.name || "").replace(/</g, "&lt;")}</div>
  ${contact ? `<div class="contact">${contact}</div>` : ""}
  ${summary ? `<div class="section"><div class="section-title">Professional Summary</div><div class="summary">${summary.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div></div>` : ""}
  <div class="section"><div class="section-title">Experience</div>${employerHtml}</div>
  ${skillsMatch ? `<div class="section"><div class="section-title">Skills</div><div class="skills">${skillsMatch}</div>${skillsAdd ? `<div class="skills skills-add">Worth adding: ${skillsAdd}</div>` : ""}</div>` : ""}
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.documentElement.innerHTML = html;
      setTimeout(() => win.print(), 400);
    }
  };

  const bulletsByEmployer = adapted
    ? adapted.bullets.filter(b => b.matched !== false).reduce((acc, b) => {
        const key = b.employer || "";
        if (!acc[key]) acc[key] = [];
        acc[key].push(b);
        return acc;
      }, {} as Record<string, Bullet[]>)
    : {};

  const resumeName = resumeProfile?.title || resumeProfile?.name || "Resume";
  const CHIPS = ["Add metrics", "Shorter", "ATS check", "More specific"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .resize-handle { width:5px; background:rgba(69,88,200,0.3); cursor:col-resize; flex-shrink:0; transition:background 0.15s; user-select:none; }
        .resize-handle:hover, .resize-handle.dragging { background:#4558C8; }
        .bullet-item { border-radius:8px; border:1.5px solid transparent; overflow:hidden; transition:border-color 0.15s, background 0.15s; }
        .bullet-item:hover { background:rgba(69,88,200,0.025); border-color:rgba(69,88,200,0.15); }
        .bullet-item:focus-within { background:rgba(69,88,200,0.04); border-color:#4558C8; }
        .bullet-main { display:flex; gap:7px; align-items:flex-start; padding:7px 9px; }
        .bullet-dot { width:3px; height:3px; border-radius:50%; background:#292B2D; margin-top:9px; flex-shrink:0; }
        .bullet-text { cursor:text; }
        .bullet-actions { display:flex; align-items:center; gap:5px; padding:3px 9px 5px; opacity:0; transition:opacity 0.1s; flex-wrap:wrap; }
        .bullet-item:hover .bullet-actions, .bullet-item:focus-within .bullet-actions { opacity:1; }
        .btag { font-size:9px; padding:2px 6px; border-radius:8px; background:rgba(223,243,125,0.5); color:#4a5a00; font-weight:400; }
        .rewrite-btn { margin-left:auto; font-size:10px; font-weight:500; color:#4558C8; background:rgba(69,88,200,0.08); border:0.5px solid rgba(69,88,200,0.2); border-radius:5px; padding:2px 8px; cursor:pointer; display:flex; align-items:center; gap:3px; white-space:nowrap; font-family:inherit; }
        .rewrite-btn:disabled { opacity:0.5; cursor:default; }
        .orig-btn { font-size:10px; color:rgba(41,43,45,0.3); background:none; border:none; cursor:pointer; padding:0; font-family:inherit; white-space:nowrap; }
        .orig-btn:hover { color:#292B2D; }
        .bullet-command { display:none; padding:4px 9px 7px; gap:5px; align-items:center; border-top:0.5px solid rgba(69,88,200,0.1); background:rgba(69,88,200,0.02); }
        .bullet-item:focus-within .bullet-command { display:flex; }
        .r-summary { font-weight:300; line-height:1.75; color:#292B2D; padding:8px 10px; border-radius:6px; outline:none; border:1.5px solid transparent; cursor:text; transition:border-color 0.15s, background 0.15s; }
        .r-summary:hover { background:rgba(69,88,200,0.03); border-color:rgba(69,88,200,0.2); }
        .r-summary:focus { background:rgba(69,88,200,0.04); border-color:#4558C8; }
        @media print { #ai-panel, #jd-panel, .resize-handle, .no-print { display:none!important; } .print-area { overflow:visible!important; } }
      `}</style>

      {/* Topbar */}
      <div className="no-print" style={{ background: "#292B2D", padding: "0 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, height: 48 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>← Saved</button>

        {/* Job selector */}
        <div style={{ position: "relative" }} ref={resumeRef}>
          <button onClick={() => setResumeOpen(v => !v)} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.8)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {job.title} · {job.company} ↓
          </button>
        </div>

        <div style={{ width: 0.5, height: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        {/* Font selector */}
        <label style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
          Font
          <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "rgba(255,255,255,0.7)", fontSize: 10, padding: "2px 5px", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="Inter, system-ui, sans-serif">Inter</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', Times, serif">Times New Roman</option>
          </select>
        </label>

        {/* Size controls */}
        <label style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          Size
          <button onClick={() => setFontSize(s => Math.max(10, s - 1))} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, color: "rgba(255,255,255,0.7)", fontSize: 12, width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>−</button>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", minWidth: 18, textAlign: "center" }}>{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(16, s + 1))} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, color: "rgba(255,255,255,0.7)", fontSize: 12, width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
        </label>

        <div style={{ width: 0.5, height: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        {/* Match badge */}
        {adapted?.match_assessment?.match_percent && (
          <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: adapted.match_assessment.match_percent >= 70 ? "rgba(223,243,125,0.15)" : "rgba(255,255,255,0.08)", color: adapted.match_assessment.match_percent >= 70 ? "#DFF37D" : "rgba(255,255,255,0.5)", border: `0.5px solid ${adapted.match_assessment.match_percent >= 70 ? "rgba(223,243,125,0.3)" : "rgba(255,255,255,0.1)"}`, whiteSpace: "nowrap", flexShrink: 0 }}>
            {adapted.match_assessment.match_percent}% match
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* JD toggle */}
        <button onClick={() => setJdOpen(v => !v)} style={{ background: jdOpen ? "rgba(223,243,125,0.15)" : "rgba(255,255,255,0.07)", border: `0.5px solid ${jdOpen ? "rgba(223,243,125,0.3)" : "rgba(255,255,255,0.15)"}`, borderRadius: 8, padding: "5px 10px", color: jdOpen ? "#DFF37D" : "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          Job Description
        </button>

        {/* Copy all */}
        <button onClick={handleCopy} disabled={!adapted} style={{ background: "#DFF37D", border: "none", borderRadius: 8, padding: "5px 12px", color: "#292B2D", fontSize: 12, fontWeight: 500, cursor: adapted ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap", opacity: adapted ? 1 : 0.4, flexShrink: 0 }}>
          {copied ? "Copied ✓" : "Copy all"}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", height: "calc(100vh - 48px)" }}>

        {/* Resume column */}
        <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sub-toolbar */}
          <div className="no-print" style={{ padding: "8px 14px", borderBottom: "0.5px solid rgba(41,43,45,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: "white" }}>
            <div ref={resumeRef} style={{ position: "relative" }}>
              <button onClick={() => setResumeOpen(v => !v)} style={{ fontSize: 11, fontWeight: 500, padding: "5px 11px", borderRadius: 8, border: resumeSelected ? "none" : "0.5px dashed rgba(238,94,55,0.5)", background: resumeSelected ? "#292B2D" : "white", color: resumeSelected ? "white" : "rgba(41,43,45,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
                {resumeSelected ? `${resumeName} ↓` : "Select resume ↓"}
              </button>
              {resumeOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "white", border: "0.5px solid rgba(41,43,45,0.15)", borderRadius: 10, padding: 4, zIndex: 200, minWidth: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  {resumeProfile && (
                    <div onMouseDown={e => { e.preventDefault(); selectResume(); }} style={{ fontSize: 12, fontWeight: resumeSelected ? 500 : 400, color: resumeSelected ? "#4558C8" : "#292B2D", padding: "8px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: resumeSelected ? "rgba(69,88,200,0.08)" : "transparent" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#292B2D" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      {resumeName}
                    </div>
                  )}
                  <div onMouseDown={e => { e.preventDefault(); setResumeOpen(false); onBack(); }} style={{ fontSize: 12, color: "#4558C8", padding: "8px 12px", borderRadius: 7, cursor: "pointer", borderTop: "0.5px solid rgba(41,43,45,0.08)", marginTop: 4 }}>
                    + Add resume
                  </div>
                </div>
              )}
            </div>
            <div style={{ width: 1, height: 18, background: "rgba(41,43,45,0.1)", flexShrink: 0 }} />
            {adapted && (
              <button onClick={() => { setResumeSelected(false); setTimeout(() => { setResumeSelected(true); generate(); }, 0); }} disabled={generating} style={{ fontSize: 11, fontWeight: 500, color: "#4558C8", background: "rgba(69,88,200,0.08)", border: "0.5px solid rgba(69,88,200,0.2)", borderRadius: 8, padding: "5px 12px", cursor: generating ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: generating ? 0.5 : 1 }}>
                Rewrite all ›
              </button>
            )}
          </div>

          {/* Document area */}
          <div className="print-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "white", position: "relative", fontFamily, fontSize }}>
            {generating && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, zIndex: 5 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #4558C8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
                  <p style={{ fontSize: 13, color: loadingStep === "analyzing" ? "#292B2D" : "rgba(41,43,45,0.35)", margin: 0, transition: "color 0.3s" }}>
                    {loadingStep === "analyzing" ? "→ " : "✓ "}Analyzing job requirements...
                  </p>
                  <p style={{ fontSize: 13, color: loadingStep === "matching" ? "#292B2D" : "rgba(41,43,45,0.25)", margin: 0, transition: "color 0.3s" }}>
                    {loadingStep === "matching" ? "→ " : ""}Matching your experience...
                  </p>
                </div>
              </div>
            )}

            {!resumeProfile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", textAlign: "center", flex: 1, height: "100%" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", margin: 0 }}>No resumes yet</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>Upload your resume to get started.</p>
                <button onClick={onBack} style={{ background: "#292B2D", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>Upload Resume →</button>
              </div>
            ) : !resumeSelected ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 24px", textAlign: "center", height: "100%" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.15 }}><rect x="3" y="3" width="18" height="18" rx="2" stroke="#292B2D" strokeWidth="1.5" /><line x1="7" y1="8" x2="17" y2="8" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" /><line x1="7" y1="12" x2="17" y2="12" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" /><line x1="7" y1="16" x2="13" y2="16" stroke="#292B2D" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#292B2D", margin: 0 }}>Select a resume above to get started.</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", lineHeight: 1.6, margin: 0 }}>I'll adapt your experience to match this job's requirements.</p>
              </div>
            ) : adapted ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Name / contact */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "#292B2D", marginBottom: 2 }}>{resumeProfile?.name || resumeName}</div>
                  <div style={{ fontSize: 10, color: "rgba(41,43,45,0.4)" }}>{[resumeProfile?.title, resumeProfile?.location, resumeProfile?.email].filter(Boolean).join(" · ")}</div>
                </div>

                {/* Summary */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "#292B2D", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1.5px solid #292B2D", paddingBottom: 2, marginBottom: 8 }}>Professional Summary</div>
                  <div ref={summaryRef} contentEditable suppressContentEditableWarning className="r-summary"
                    onInput={() => { if (adapted && summaryRef.current) saveAdapted({ ...adapted, summary: summaryRef.current.innerText }); }}
                    style={{ fontSize: "inherit" }} />
                </div>

                {/* Bullets */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "#292B2D", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1.5px solid #292B2D", paddingBottom: 2, marginBottom: 8 }}>Experience — Adapted Bullets</div>
                  {Object.entries(bulletsByEmployer).map(([employer, bullets]) => (
                    <div key={employer} style={{ marginBottom: 16 }}>
                      {employer && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "#292B2D" }}>{employer}</span>
                        </div>
                      )}
                      {bullets.map(b => {
                        const idx = adapted.bullets.findIndex(x => x.id === b.id);
                        return (
                          <BulletItem
                            key={b.id}
                            bullet={b}
                            onChange={bullet => updateBullet(idx, bullet)}
                            onRewrite={rewriteSingleBullet}
                            onInlineRewrite={rewriteBulletWithCommand}
                            rewriting={rewritingBullet === b.id}
                            showOrig={!!showOriginal[b.id]}
                            onToggleOrig={() => toggleOriginal(b.id)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Skills */}
                {adapted.skills && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: "#292B2D", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1.5px solid #292B2D", paddingBottom: 2, marginBottom: 8 }}>Skills</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                      {[
                        { label: "● you have", bg: "rgba(69,88,200,0.1)", border: "rgba(69,88,200,0.2)" },
                        { label: "+ consider adding", bg: "rgba(223,243,125,0.45)", border: "rgba(100,130,0,0.2)" },
                        { label: "— not relevant", bg: "rgba(41,43,45,0.05)", border: "rgba(41,43,45,0.1)" },
                      ].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(41,43,45,0.4)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: l.bg, border: `0.5px solid ${l.border}`, display: "inline-block" }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(adapted.skills.match || []).map(s => <span key={s} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 7, background: "rgba(69,88,200,0.1)", color: "#4558C8", border: "0.5px solid rgba(69,88,200,0.2)" }}>{s}</span>)}
                      {(adapted.skills.add || []).map(s => <span key={s} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 7, background: "rgba(223,243,125,0.45)", color: "#3d4d00", border: "0.5px solid rgba(100,130,0,0.2)" }}>+ {s}</span>)}
                      {(adapted.skills.neutral || []).map(s => <span key={s} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 7, background: "rgba(41,43,45,0.05)", color: "rgba(41,43,45,0.45)", border: "0.5px solid rgba(41,43,45,0.1)" }}>{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Bottom bar */}
          {adapted && (
            <div className="no-print" style={{ padding: "10px 16px", borderTop: "0.5px solid rgba(41,43,45,0.08)", display: "flex", gap: 8, background: "white", flexShrink: 0, height: 52 }}>
              <button onClick={() => { if (adapted) localStorage.setItem(STORAGE_KEY, JSON.stringify(adapted)); }} style={{ flex: 1, fontSize: 13, padding: 9, borderRadius: 10, border: "0.5px solid rgba(41,43,45,0.2)", background: "transparent", color: "#292B2D", cursor: "pointer", fontFamily: "inherit" }}>Save draft</button>
              <button onClick={printResume} style={{ flex: 1, fontSize: 13, fontWeight: 500, padding: 9, borderRadius: 10, border: "none", background: "#292B2D", color: "white", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>Download PDF</button>
            </div>
          )}
        </div>

        {/* Handle: Resume → AI */}
        <div className="resize-handle no-print" onMouseDown={e => startDrag(e, "ai-panel", "right", 220, window.innerWidth * 0.48)} />

        {/* AI chat panel */}
        <div id="ai-panel" style={{ width: aiWidth, flexShrink: 0, display: "flex", flexDirection: "column", background: "#EFF0F6", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            {messages.map((m, i) =>
              m.role === "ai" ? (
                <div key={i} style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, fontWeight: 300, color: "#292B2D", lineHeight: 1.55, border: "0.5px solid rgba(41,43,45,0.08)", whiteSpace: "pre-line" }}>{m.text}</div>
              ) : (
                <div key={i} style={{ background: "#292B2D", borderRadius: "10px 10px 3px 10px", padding: "9px 11px", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, alignSelf: "flex-end", maxWidth: "90%" }}>{m.text}</div>
              )
            )}
            {chatGenerating && (
              <div style={{ background: "#fff", borderRadius: "10px 10px 10px 3px", padding: "9px 11px", fontSize: 11, color: "rgba(41,43,45,0.4)", border: "0.5px solid rgba(41,43,45,0.08)" }}>
                <span style={{ animation: "pulse 1s infinite" }}>●●●</span>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>
          <div style={{ padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 4, borderTop: "0.5px solid rgba(41,43,45,0.08)", flexShrink: 0 }}>
            {CHIPS.map(c => <button key={c} onClick={() => sendChat(c)} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "white", color: "#4558C8", border: "0.5px solid rgba(69,88,200,0.25)", cursor: "pointer", fontFamily: "inherit" }}>{c}</button>)}
          </div>
          <ChatInput onSend={sendChat} disabled={chatGenerating} height={chatInputHeight} onHeightChange={setChatInputHeight} />
        </div>

        {/* Handle: AI → JD */}
        {jdOpen && <div className="resize-handle no-print" onMouseDown={e => startDrag(e, "jd-panel", "left", 200, window.innerWidth * 0.4)} />}

        {/* JD panel */}
        {jdOpen && (
          <div id="jd-panel" style={{ width: jdWidth, flexShrink: 0, display: "flex", flexDirection: "column", background: "white", borderLeft: "0.5px solid rgba(41,43,45,0.08)", overflow: "hidden" }}>
            <JdPanel text={job.description || ""} onClose={() => setJdOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
