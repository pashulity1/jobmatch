"use client";

import { useState, useRef, useEffect } from "react";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyDomain?: string;
  location: string;
  salary?: string;
  type?: string;
  level?: string;
  workMode?: string;
  yearsExp?: string;
  isRemote?: boolean;
  isNew?: boolean;
  postedAt?: string;
  postedDate?: string;
  source?: string;
  description?: string;
  skills?: string[];
  applyUrl?: string;
}

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onSaveToggle?: (e: React.MouseEvent) => void;
  matchScore?: number;
  matchBreakdown?: { skills: number; level: number; industry: number };
  matchLoading?: boolean;
  matchTimedOut?: boolean;
  ageBadge?: { label: string; color: string };
}

// ── helpers ──────────────────────────────────────────────

function matchColor(score: number) {
  return score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
}

function decodeHtml(html: string): string {
  return (html || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

const AGE_BADGE_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue:  "bg-blue-100 text-blue-700",
  gray:  "bg-gray-100 text-gray-600",
  amber: "bg-amber-100 text-amber-700",
  red:   "bg-red-100 text-red-700",
};

// ── CompanyLogo ───────────────────────────────────────────

function CompanyLogo({ company, domain }: { company: string; domain?: string }) {
  const [src, setSrc] = useState<string>(domain ? `https://logo.clearbit.com/${domain}` : "");
  const [failed, setFailed] = useState(!domain);

  const initials = company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const hue = company.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  if (failed) {
    return (
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
        style={{ background: `hsl(${hue}, 45%, 35%)` }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={company}
      width={40}
      height={40}
      className="w-10 h-10 rounded-[10px] object-contain bg-white flex-shrink-0"
      onError={() => {
        if (domain && src.includes("clearbit")) {
          setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

// ── Badge ─────────────────────────────────────────────────

function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "remote" | "neutral" | "new" | "hybrid";
}) {
  const styles = {
    remote:  "bg-[#DFF37D] text-[#292B2D]",
    neutral: "bg-[rgba(41,43,45,0.07)] text-[rgba(41,43,45,0.55)]",
    new:     "bg-[#EE5E37] text-white",
    hybrid:  "bg-[#FFF0C2] text-[#7A5A00]",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-[20px] text-[12px] font-medium leading-5 ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ── MatchCircle ───────────────────────────────────────────

function MatchCircle({ score, loading, timedOut }: { score?: number; loading?: boolean; timedOut?: boolean }) {
  const r = 17;
  const circ = 2 * Math.PI * r;

  const [displayVal, setDisplayVal] = useState<number>(() =>
    score !== undefined && !loading ? score : 0
  );
  const [phase, setPhase] = useState<"idle" | "sweeping" | "descending" | "done">(() =>
    score !== undefined && !loading ? "done" : "idle"
  );
  const rafRef = useRef<number | null>(null);
  const valRef = useRef<number>(score !== undefined && !loading ? score : 0);

  const cancelAnim = () => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  useEffect(() => {
    if (!loading || timedOut) return;
    cancelAnim();
    valRef.current = 0;
    setDisplayVal(0);
    setPhase("sweeping");
    const start = performance.now();
    const duration = 2000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      const val = Math.round(eased * 100);
      valRef.current = val;
      setDisplayVal(val);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return cancelAnim;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, timedOut]);

  useEffect(() => {
    if (loading || score === undefined) return;
    cancelAnim();
    const from = valRef.current;
    const to = score;
    const duration = from > 5 ? 800 : 0;
    setPhase("descending");
    if (duration === 0) {
      valRef.current = to;
      setDisplayVal(to);
      setPhase("done");
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (to - from) * eased);
      valRef.current = val;
      setDisplayVal(val);
      if (t < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { setPhase("done"); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return cancelAnim;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, score]);

  const fill = (displayVal / 100) * circ;
  const arcColor = phase === "sweeping"
    ? "rgba(20,184,166,0.8)"
    : score !== undefined ? matchColor(score) : "#9ca3af";

  const label = timedOut && score === undefined ? "–"
    : phase === "idle" ? "…"
    : `${displayVal}%`;

  return (
    <svg width="42" height="42" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
      <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(41,43,45,0.1)" strokeWidth="3.5" />
      <circle cx="21" cy="21" r={r} fill="none" stroke={arcColor} strokeWidth="3.5"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 21 21)"
        style={{ transition: "stroke 0.4s ease" }} />
      <text x="21" y="25" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={arcColor}>
        {label}
      </text>
    </svg>
  );
}

// ── JobCard ───────────────────────────────────────────────

export default function JobCard({
  job,
  isSaved = false,
  onSaveToggle,
  matchScore,
  matchBreakdown,
  matchLoading,
  matchTimedOut,
  ageBadge,
}: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const showRemote = job.workMode === "Remote" || job.isRemote;
  const showHybrid = job.workMode === "Hybrid";

  return (
    <div
      className="bg-white rounded-2xl p-4 cursor-pointer transition-all"
      style={{
        boxShadow: expanded
          ? "0 4px 20px rgba(41,43,45,0.10)"
          : "0 1px 4px rgba(41,43,45,0.06)",
      }}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <CompanyLogo company={job.company} domain={job.companyDomain} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-medium text-[#292B2D] leading-tight">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {job.isNew && <Badge variant="new">New</Badge>}
              {(matchLoading || matchTimedOut || matchScore !== undefined) && (
                <MatchCircle score={matchScore} loading={matchLoading} timedOut={matchTimedOut} />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onSaveToggle?.(e); }}
                className={`w-8 h-8 flex items-center justify-center rounded-[9px] transition-colors ${
                  isSaved ? "text-[#EE5E37]" : "text-[rgba(41,43,45,0.35)] hover:text-[#292B2D]"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="text-[12px] text-[rgba(41,43,45,0.55)] mt-0.5">
            {job.company} · {job.location}
          </p>
        </div>
      </div>

      {/* Badges + date row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {showRemote && <Badge variant="remote">Remote</Badge>}
        {showHybrid && <Badge variant="hybrid">Hybrid</Badge>}
        {job.type && <Badge variant="neutral">{job.type}</Badge>}
        {job.level && <Badge variant="neutral">{job.level}</Badge>}
        {job.salary && <Badge variant="neutral">{job.salary}</Badge>}
        {job.yearsExp && <Badge variant="neutral">{job.yearsExp}</Badge>}
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          {ageBadge && (
            <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium ${AGE_BADGE_CLASSES[ageBadge.color]}`}>
              {ageBadge.label}
            </span>
          )}
          {(job.postedDate || job.postedAt) && (
            <span className="text-[12px] text-[rgba(41,43,45,0.4)]">
              {job.postedDate || job.postedAt}
            </span>
          )}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div
          className="mt-4 pt-4 border-t border-[rgba(41,43,45,0.08)]"
          onClick={e => e.stopPropagation()}
        >
          {/* AI breakdown */}
          {matchLoading && !matchBreakdown && (
            <div className="flex items-center gap-2 mb-3 text-[12px] text-[rgba(41,43,45,0.45)]">
              <svg className="animate-spin w-3.5 h-3.5 text-teal-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              AI analyzing…
            </div>
          )}
          {matchBreakdown && (
            <div className="flex gap-4 mb-3 text-[12px] text-[rgba(41,43,45,0.55)]">
              <span>Skills: <span style={{ color: matchColor(matchBreakdown.skills) }} className="font-semibold">{matchBreakdown.skills}%</span></span>
              <span>Level: <span style={{ color: matchColor(matchBreakdown.level) }} className="font-semibold">{matchBreakdown.level}%</span></span>
              <span>Industry: <span style={{ color: matchColor(matchBreakdown.industry) }} className="font-semibold">{matchBreakdown.industry}%</span></span>
            </div>
          )}

          {/* Apply row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] text-[rgba(41,43,45,0.4)]">
              {job.source ? `Source: ${job.source}` : ""}
            </span>
            {job.applyUrl && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="px-5 py-2 rounded-[10px] text-[13px] font-medium text-white bg-[#292B2D] hover:bg-[#3d4044] transition-colors"
              >
                Apply Now →
              </a>
            )}
          </div>

          {/* Description */}
          {job.description ? (
            <div
              className="job-description text-[14px] font-light text-[rgba(41,43,45,0.8)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: decodeHtml(job.description) }}
            />
          ) : (
            <p className="text-[14px] text-[rgba(41,43,45,0.4)] italic">No description available.</p>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.map(skill => (
                <span
                  key={skill}
                  className="px-2.5 py-0.5 rounded-[6px] text-[12px] bg-[rgba(69,88,200,0.08)] text-[#4558C8] font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setExpanded(false)}
            className="mt-4 text-[12px] text-[rgba(41,43,45,0.4)] hover:text-[#292B2D] underline transition-colors"
          >
            ↑ Collapse
          </button>
        </div>
      )}
    </div>
  );
}
