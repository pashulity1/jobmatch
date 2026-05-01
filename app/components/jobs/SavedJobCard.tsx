"use client";
import { useState, useEffect, useRef } from "react";

export type SavedJob = {
  id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  job_type: string;
  source: string;
  posted_date: string;
  apply_url: string;
  created_at: string;
  description?: string;
  logo_color?: string;    // hex color chosen by user for manually-added jobs
  custom_job_url?: string; // original URL for manually-added jobs
};

type Status = "saved" | "in_progress" | "applied";

interface SavedJobCardProps {
  job: SavedJob;
  isExpanded: boolean;
  matchScore?: number;
  onToggle: () => void;
  onUnsave: () => void;
  onOpenCoverLetter: (job: SavedJob) => void;
  onOpenResumeAdaptation: (job: SavedJob) => void;
}

function stripHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCompanyDomain(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

function CompanyLogo({ company, logoColor }: { company: string; logoColor?: string }) {
  const domain = getCompanyDomain(company);
  const initials = company.slice(0, 2).toUpperCase();
  const [imgSrc, setImgSrc] = useState(`https://logo.clearbit.com/${domain}`);
  const [failed, setFailed] = useState(0);

  // Manually-added jobs have a user-chosen color — skip network logo entirely
  if (logoColor) {
    return (
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: logoColor,
        color: "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 600, flexShrink: 0,
      }}>
        {initials}
      </div>
    );
  }

  const handleError = () => {
    if (failed === 0) {
      setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
      setFailed(1);
    } else {
      setFailed(2);
    }
  };

  if (failed === 2) {
    return (
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: "#292B2D",
        color: "#EFF0F6", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 500, flexShrink: 0,
      }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={company}
      onError={handleError}
      style={{ width: 42, height: 42, borderRadius: 10, objectFit: "contain", flexShrink: 0 }}
    />
  );
}

const LEVEL_KEYWORDS = ["Senior", "Junior", "Lead", "Principal", "Staff", "Entry", "Mid"];

export function SavedJobCard({
  job, isExpanded, matchScore, onToggle, onUnsave, onOpenCoverLetter, onOpenResumeAdaptation
}: SavedJobCardProps) {
  const [status, setStatus] = useState<Status>("saved");
  const [notes, setNotes] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [showApplyPrompt, setShowApplyPrompt] = useState(false);
  const [coverLetterReady, setCoverLetterReady] = useState(false);
  const [resumeAdapted, setResumeAdapted] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = localStorage.getItem(`jm_status_${job.job_id}`) as Status | null;
    if (s) setStatus(s);
    const n = localStorage.getItem(`jm_notes_${job.job_id}`);
    if (n) setNotes(n);
    setCoverLetterReady(!!localStorage.getItem(`jm_cl_${job.job_id}`));
    setResumeAdapted(!!localStorage.getItem(`jm_ra_${job.job_id}`));
  }, [job.job_id]);

  const handleStatus = (s: Status) => {
    setStatus(s);
    localStorage.setItem(`jm_status_${job.job_id}`, s);
  };

  const handleNotes = (v: string) => {
    setNotes(v);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      localStorage.setItem(`jm_notes_${job.job_id}`, v);
    }, 1000);
  };

  const description = job.description ? stripHtml(job.description) : "";
  const savedDate = new Date(job.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const isRemote = /remote/i.test(job.job_type || "") || /remote/i.test(job.location || "");
  const level = LEVEL_KEYWORDS.find(l => job.title.includes(l));

  const STATUS_BTNS: { key: Status; label: string }[] = [
    { key: "saved", label: "Сохранено" },
    { key: "in_progress", label: "В процессе" },
    { key: "applied", label: "Откликнулся" },
  ];

  const activeStyle = (key: Status): React.CSSProperties => {
    if (status !== key) return {};
    if (key === "saved") return { background: "#fff", color: "#292B2D", border: "0.5px solid rgba(41,43,45,0.35)" };
    if (key === "in_progress") return { background: "#4558C8", color: "#fff", border: "none" };
    return { background: "#292B2D", color: "#DFF37D", border: "none" };
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: isExpanded ? "0.5px solid rgba(41,43,45,0.2)" : "0.5px solid rgba(41,43,45,0.08)",
      overflow: "hidden", transition: "border-color 0.15s",
    }}>
      {/* ── COLLAPSED (always visible) ── */}
      <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <CompanyLogo company={job.company} logoColor={job.logo_color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#292B2D", margin: 0, lineHeight: 1.3 }}>
                {job.title}
              </p>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
                flexShrink: 0, marginTop: 3,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}>
                <path d="M4 6l4 4 4-4" stroke="rgba(41,43,45,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.45)", margin: "3px 0 0", lineHeight: 1.4 }}>
              {[job.company, job.location, job.salary].filter(Boolean).join(" · ")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {isRemote && (
                <Tag bg="#DFF37D" color="#292B2D">Remote</Tag>
              )}
              {job.job_type && (
                <Tag bg="rgba(41,43,45,0.06)" color="rgba(41,43,45,0.55)" border="0.5px solid rgba(41,43,45,0.1)">
                  {job.job_type}
                </Tag>
              )}
              {level && (
                <Tag bg="rgba(41,43,45,0.06)" color="rgba(41,43,45,0.55)" border="0.5px solid rgba(41,43,45,0.1)">
                  {level}
                </Tag>
              )}
              {matchScore !== undefined && (
                <Tag bg="rgba(217,184,243,0.4)" color="#5b3f8a" border="0.5px solid rgba(217,184,243,0.5)">
                  Match {matchScore}%
                </Tag>
              )}
              <Tag bg="transparent" color="rgba(41,43,45,0.3)">Сохранено {savedDate}</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPANDED ── */}
      {isExpanded && (
        <div onClick={e => e.stopPropagation()}>

          {/* STATUS */}
          <Section label="Статус">
            <div style={{ display: "flex", gap: 6 }}>
              {STATUS_BTNS.map(({ key, label }) => (
                <button key={key} onClick={() => handleStatus(key)} style={{
                  flex: 1, fontSize: 12, fontWeight: 400, padding: "9px 6px",
                  borderRadius: 10, cursor: "pointer", textAlign: "center",
                  transition: "all 0.15s", border: "0.5px solid rgba(41,43,45,0.15)",
                  background: "#fff", color: "rgba(41,43,45,0.5)",
                  ...activeStyle(key),
                }}>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* DOCUMENTS */}
          <Section label="Документы">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {/* Cover Letter */}
              <DocCard onClick={() => onOpenCoverLetter(job)}
                iconBg="rgba(69,88,200,0.1)"
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="2" width="12" height="14" rx="2" stroke="#4558C8" strokeWidth="1.2" />
                    <line x1="6" y1="6" x2="12" y2="6" stroke="#4558C8" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="6" y1="9" x2="12" y2="9" stroke="#4558C8" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="6" y1="12" x2="10" y2="12" stroke="#4558C8" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                }
                title="Cover Letter"
                badge={coverLetterReady ? "Готово" : "Не начато"}
                badgeReady={coverLetterReady}
                cta={coverLetterReady ? "Открыть →" : "Начать →"}
                ctaColor="#4558C8"
              />

              {/* Resume Adaptation */}
              <DocCard onClick={() => onOpenResumeAdaptation(job)}
                iconBg="rgba(217,184,243,0.35)"
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="6" r="3" stroke="#7c4dba" strokeWidth="1.2" />
                    <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#7c4dba" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                }
                title="Адаптация резюме"
                badge={resumeAdapted ? "Готово" : "Не начато"}
                badgeReady={resumeAdapted}
                cta={resumeAdapted ? "Открыть →" : "Начать →"}
                ctaColor="#7c4dba"
              />

              {/* Vacancy */}
              <DocCard
                iconBg="rgba(223,243,125,0.5)"
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M10 3H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-5" stroke="#4a6300" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 2l3 3-5 5H8V7l5-5z" stroke="#4a6300" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
                title="Вакансия"
                badge="Сохранено"
                badgeReady={true}
                cta="Открыть →"
                ctaColor="#4a6300"
                ctaHref={job.apply_url}
              />
            </div>
          </Section>

          {/* DESCRIPTION */}
          {description && (
            <Section label="Описание вакансии" right={
              job.apply_url
                ? <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: "#4558C8", textDecoration: "none" }}>
                    Оригинал →
                  </a>
                : undefined
            }>
              <p style={{
                fontSize: 11, fontWeight: 300, color: "rgba(41,43,45,0.6)",
                lineHeight: 1.65, margin: "0 0 4px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical" as const,
                ...(descExpanded ? {} : { WebkitLineClamp: 4 } as any),
              }}>
                {description}
              </p>
              {description.length > 250 && (
                <button onClick={() => setDescExpanded(!descExpanded)} style={{
                  fontSize: 11, color: "#4558C8", background: "none",
                  border: "none", cursor: "pointer", padding: 0,
                }}>
                  {descExpanded ? "Свернуть ↑" : "Читать полностью →"}
                </button>
              )}
            </Section>
          )}

          {/* NOTES */}
          <Section label="Заметки">
            <div style={{
              background: "rgba(41,43,45,0.02)", borderRadius: 10,
              padding: "11px 13px", border: "0.5px solid rgba(41,43,45,0.07)",
            }}>
              <textarea
                value={notes}
                onChange={e => handleNotes(e.target.value)}
                placeholder="Контакт рекрутера, детали интервью, впечатления..."
                rows={3}
                style={{
                  width: "100%", fontSize: 12, fontWeight: 300, color: "#292B2D",
                  border: "none", outline: "none", resize: "none", background: "transparent",
                  fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.65,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <p style={{ fontSize: 10, color: "rgba(41,43,45,0.25)", margin: "4px 0 0" }}>только для вас</p>
          </Section>

          {/* APPLY */}
          <div style={{ padding: "0 16px 16px", borderTop: "0.5px solid rgba(41,43,45,0.07)" }}>
            {showApplyPrompt ? (
              <div style={{ paddingTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(41,43,45,0.6)", flex: 1, margin: 0 }}>
                  Обновить статус на «Откликнулся»?
                </p>
                <button onClick={() => { handleStatus("applied"); setShowApplyPrompt(false); }}
                  style={{ fontSize: 12, color: "#4558C8", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  Да
                </button>
                <button onClick={() => setShowApplyPrompt(false)}
                  style={{ fontSize: 12, color: "rgba(41,43,45,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                  Нет
                </button>
              </div>
            ) : (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                onClick={() => { if (status !== "applied") setShowApplyPrompt(true); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 12, background: "#292B2D", color: "#fff",
                  borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", textDecoration: "none",
                }}>
                Откликнуться →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small helpers ── */

function Tag({ children, bg, color, border }: {
  children: React.ReactNode; bg: string; color: string; border?: string;
}) {
  return (
    <span style={{
      fontSize: 10, padding: "3px 9px", borderRadius: 20,
      background: bg, color, border: border || "none",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Section({ label, children, right }: {
  label: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "0 16px", borderTop: "0.5px solid rgba(41,43,45,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 8px" }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(41,43,45,0.4)", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }}>
          {label}
        </p>
        {right}
      </div>
      <div style={{ paddingBottom: 12 }}>{children}</div>
    </div>
  );
}

function DocCard({ onClick, iconBg, icon, title, badge, badgeReady, cta, ctaColor, ctaHref }: {
  onClick?: () => void;
  iconBg: string; icon: React.ReactNode;
  title: string; badge: string; badgeReady: boolean;
  cta: string; ctaColor: string; ctaHref?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 12, padding: "13px 12px",
        border: hovered ? "0.5px solid rgba(41,43,45,0.2)" : "0.5px solid rgba(41,43,45,0.07)",
        display: "flex", flexDirection: "column", gap: 8,
        cursor: onClick ? "pointer" : "default", minHeight: 120,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 400, color: "#292B2D", margin: "0 0 5px" }}>{title}</p>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 20,
          background: badgeReady ? "rgba(223,243,125,0.5)" : "rgba(41,43,45,0.06)",
          color: badgeReady ? "#3d4d00" : "rgba(41,43,45,0.4)",
        }}>
          {badge}
        </span>
      </div>
      {ctaHref ? (
        <a href={ctaHref} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, fontWeight: 500, color: ctaColor, textDecoration: "none" }}>
          {cta}
        </a>
      ) : (
        <p style={{ fontSize: 11, fontWeight: 500, color: ctaColor, margin: 0 }}>{cta}</p>
      )}
    </div>
  );
}
