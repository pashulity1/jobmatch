"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore, ResumeProfile } from "@/lib/matcher";

// Quick-pick options shown in the location dropdown
const LOCATION_QUICK_PICKS = [
  "Remote", "USA", "Canada", "United Kingdom",
  "Germany", "France", "Netherlands", "Australia", "Brazil", "India",
];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"];
const DATE_OPTIONS = ["Last 24h", "3 days", "Week", "Month"];
const PAGE_SIZE = 20;
const FREE_ANALYSES = 100; // высокий лимит для тестирования

type Job = {
  id: string; title: string; company: string; location: string;
  salary: string; jobType: string; source: string; postedDate: string;
  applyUrl: string; description: string; matchScore?: number;
  postedAt?: string | null;
};

type GeminiScore = { total: number; skills: number; level: number; industry: number };

function matchColor(score: number) {
  return score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
}

function matchLabel(score: number) {
  return score >= 80 ? "STRONG MATCH" : score >= 60 ? "GOOD MATCH" : score >= 40 ? "FAIR MATCH" : "WEAK MATCH";
}

// MatchCircle renders the match score indicator.
// When loading=true and no score yet: shows a spinning teal arc (spinner).
// When timedOut=true and still no score: shows "–" fallback.
// When score arrives: spinner fades out, score circle fades in (300ms transition).
// Both SVG layers are stacked in the same 42×42 box — no layout shift.
function MatchCircle({ score, loading, timedOut }: { score?: number; loading?: boolean; timedOut?: boolean }) {
  const r = 17;
  const circ = 2 * Math.PI * r;

  // Show spinner whenever loading — even if a preliminary local score exists.
  // The score layer sits behind it and is ready to reveal the moment loading stops.
  const showSpinner = !!loading && !timedOut;
  // Arc fill for the score circle (0 when no score)
  const filled = score !== undefined ? (score / 100) * circ : 0;
  const color = score !== undefined ? matchColor(score) : "#6b7280";
  // Label inside the score circle: %, "–" on timeout, "…" as initial placeholder
  const label = score !== undefined ? `${score}%` : timedOut ? "–" : "…";
  const labelSize = score !== undefined ? "9.5" : "8";

  return (
    // Fixed-size container so both layers overlap without shifting layout
    <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>

      {/* ── Spinner layer — fades out when score arrives ── */}
      {/* animate-spin rotates the SVG; both circles share center (21,21) so only the arc visibly spins */}
      <svg
        width="42" height="42" viewBox="0 0 42 42"
        className={showSpinner ? "animate-spin" : ""}
        style={{
          position: "absolute", top: 0, left: 0,
          opacity: showSpinner ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      >
        {/* Background track */}
        <circle cx="21" cy="21" r={r} fill="none" stroke="#374151" strokeWidth="3.5" />
        {/* Spinning arc — teal brand color at 0.4 opacity, ~30% of circumference */}
        <circle cx="21" cy="21" r={r} fill="none"
          stroke="rgba(20,184,166,0.4)" strokeWidth="3.5"
          strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
          strokeLinecap="round" />
      </svg>

      {/* ── Score circle layer — fades in when score arrives ── */}
      <svg
        width="42" height="42" viewBox="0 0 42 42"
        style={{
          position: "absolute", top: 0, left: 0,
          opacity: showSpinner ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Background track */}
        <circle cx="21" cy="21" r={r} fill="none" stroke="#374151" strokeWidth="3.5" />
        {/* Filled arc — animates smoothly as score value changes */}
        <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 21 21)"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x="21" y="25" textAnchor="middle" fontSize={labelSize} fontWeight="700" fill={color}>
          {label}
        </text>
      </svg>
    </div>
  );
}

const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];

function parseJobDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // ISO / RFC formats
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;
  // "January 2024" — treat as 1st of that month
  const m = s.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const idx = MONTH_NAMES.indexOf(m[1].toLowerCase());
    if (idx !== -1) return new Date(parseInt(m[2]), idx, 1);
  }
  return null;
}

function getJobAgeBadge(postedAt: string | null | undefined) {
  const d = parseJobDate(postedAt);
  if (!d) return null;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0 || isNaN(days)) return null;
  if (days <= 3)  return { label: "🟢 New", color: "green" };
  if (days <= 14) return { label: `${days}d ago`, color: "blue" };
  if (days <= 30) return { label: `${days}d ago`, color: "gray" };
  if (days <= 60) return { label: `⚠️ ${days}d ago`, color: "amber" };
  return { label: `⚠️ ${days}d — may be closed`, color: "red" };
}

const BADGE_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue:  "bg-blue-100 text-blue-700",
  gray:  "bg-gray-100 text-gray-600",
  amber: "bg-amber-100 text-amber-700",
  red:   "bg-red-100 text-red-700",
};

type User = {
  id: string;
  email: string;
};

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractSalary(description: string, existing: string): string {
  if (existing && !/^[£$]0k/i.test(existing.trim())) return existing;
  const m = (description || "").match(/\$[\d,]+[Kk]?\s*[-–]\s*\$[\d,]+[Kk]?/);
  return m ? m[0] : "";
}

// Decode HTML entities so Greenhouse/Lever escaped HTML renders correctly
function decodeHtml(html: string): string {
  return (html || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function extractLevel(description: string, title: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("staff") || text.includes("principal")) return "Staff";
  if (text.includes("senior") || text.includes("sr.")) return "Senior";
  if (text.includes("lead")) return "Lead";
  if (text.includes("manager") || text.includes("director")) return "Manager";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) return "Junior";
  if (text.includes("mid-level") || text.includes("mid level")) return "Mid";
  return "";
}

function extractYearsExp(description: string): string {
  const m = (description || "").match(/(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)/i);
  return m ? `${m[1]}+ yrs` : "";
}

function extractWorkMode(description: string, location: string): string {
  const text = `${description} ${location}`.toLowerCase();
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("remote")) return "Remote";
  if (text.includes("onsite") || text.includes("on-site") || text.includes("in office")) return "Onsite";
  return "";
}

function cleanLocation(location: string | null | undefined): string {
  if (!location) return "";
  const s = location.trim();
  if (/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(s)) return "United Kingdom";
  return s;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    date = new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  }
  return "";
}

const RECENT_LOCATIONS_KEY = "jm_recent_locations";

function saveRecentLocations(locs: string[]) {
  if (!locs.length) return;
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) || "[]") as string[];
    const merged = [...new Set([...locs, ...prev])].slice(0, 8);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(merged));
  } catch {}
}

// LocationDropdown — replaces the old 4-button location filter.
// Renders a button that opens a searchable dropdown with quick picks,
// allows free-text custom entries, and shows selected locations as removable tags.
function LocationDropdown({
  selected,
  onChange,
  recentLocations = [],
}: {
  selected: string[];
  onChange: (locs: string[]) => void;
  recentLocations?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter quick picks based on the current search text
  const filtered = LOCATION_QUICK_PICKS.filter(p =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  // Recent entries to show: max 5, not already selected, only when not typing
  const recentToShow = !search
    ? recentLocations.filter(r => !selected.includes(r)).slice(0, 5)
    : [];

  // Close dropdown when user clicks outside the component
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle a location in the selected list
  function toggleLocation(loc: string) {
    onChange(selected.includes(loc) ? selected.filter(l => l !== loc) : [...selected, loc]);
  }

  // Add a custom free-text location (from Enter key or Add button)
  function addCustom() {
    const val = search.trim();
    if (val && !selected.includes(val)) onChange([...selected, val]);
    setSearch("");
    setOpen(false);
  }

  // Label shown on the trigger button
  const buttonLabel = selected.length === 0
    ? "Location"
    : selected.length === 1
      ? selected[0]
      : `Location: ${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border transition-colors
          ${selected.length > 0
            ? "bg-gray-800 text-white border-blue-500"
            : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"}`}
      >
        <span>{buttonLabel}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-800">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                // Enter adds a custom location if the text doesn't match any quick pick exactly
                if (e.key === "Enter") {
                  const exact = filtered.find(p => p.toLowerCase() === search.toLowerCase());
                  if (exact) { toggleLocation(exact); setSearch(""); setOpen(false); }
                  else if (search.trim()) addCustom();
                }
                if (e.key === "Escape") { setOpen(false); setSearch(""); }
              }}
              placeholder="Search city, state, country..."
              className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>

          {/* Quick picks list */}
          <div className="max-h-52 overflow-y-auto">
            {recentToShow.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-xs text-gray-500 font-medium">Recent</p>
                {recentToShow.map(loc => (
                  <button
                    key={`recent-${loc}`}
                    onMouseDown={() => { toggleLocation(loc); setSearch(""); setOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {loc}
                  </button>
                ))}
              </>
            )}
            {filtered.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-xs text-gray-500 font-medium">Quick picks</p>
                {filtered.map(loc => (
                  <button
                    key={loc}
                    onMouseDown={() => { toggleLocation(loc); setSearch(""); setOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                      ${selected.includes(loc) ? "text-blue-400 bg-blue-950/40" : "text-gray-300 hover:bg-gray-800"}`}
                  >
                    {loc}
                    {/* Checkmark for already-selected items */}
                    {selected.includes(loc) && <span className="text-blue-400">✓</span>}
                  </button>
                ))}
              </>
            )}
            {/* Show "Add custom" option when text doesn't match any quick pick */}
            {search.trim() && !filtered.find(p => p.toLowerCase() === search.toLowerCase()) && (
              <button
                onMouseDown={addCustom}
                className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Add &ldquo;{search.trim()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected location tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(loc => (
            <span key={loc} className="flex items-center gap-1 text-xs bg-blue-900/50 text-blue-300 border border-blue-700 px-2.5 py-1 rounded-full">
              {loc}
              {/* Remove tag button */}
              <button
                onClick={() => onChange(selected.filter(l => l !== loc))}
                className="text-blue-400 hover:text-white leading-none ml-0.5"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Auth Modal Component
function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (err) { setError(err.message); return; }
        setError("Account created! Please sign in.");
        setMode("signin");
        return;
      }
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); return; }
      if (data.session && data.user) {
        onSuccess(data.user as User, data.session.access_token);
      }
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
        </div>

        {error && <p className={`text-xs mt-2 ${error.includes("created") ? "text-green-400" : "text-red-400"}`}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-2.5 rounded-xl mt-4 text-sm">
          {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <button onClick={async () => {
          setLoading(true);
          try {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
          } catch { setError("Google sign-in failed."); }
          finally { setLoading(false); }
        }} disabled={loading}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm py-2.5 rounded-xl flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          {mode === "signin" ? "No account?" : "Have account?"}{" "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            className="text-blue-400 hover:text-blue-300">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [salary, setSalary] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sortByMatch, setSortByMatch] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);
  // Tracks which card is expanded — only one at a time
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const POPULAR_SEARCHES = [
    // Design & Creative
    "Motion Designer", "Senior Motion Designer", "Motion Graphic Designer",
    "Video Editor", "Creative Director", "Art Director", "Graphic Designer",
    "Brand Designer", "UI Designer", "UX Designer", "Product Designer",
    "Visual Designer", "Illustrator", "Animator", "3D Artist",
    // Engineering
    "Software Engineer", "Senior Software Engineer", "Full Stack Developer",
    "Frontend Engineer", "Backend Engineer", "iOS Engineer", "Android Engineer",
    "Machine Learning Engineer", "Data Engineer", "DevOps Engineer",
    "Platform Engineer", "Site Reliability Engineer", "Security Engineer",
    // Product & Management
    "Product Manager", "Senior Product Manager", "Technical Program Manager",
    "Project Manager", "Engineering Manager", "Director of Engineering",
    // Data
    "Data Scientist", "Data Analyst", "Business Analyst",
    "Analytics Engineer", "BI Developer",
    // Marketing & Growth
    "Marketing Manager", "Growth Manager", "Content Marketing Manager",
    "Social Media Manager", "Performance Marketing", "SEO Manager",
    "Brand Manager", "Copywriter", "Content Designer",
    // Sales & Success
    "Account Executive", "Sales Engineer", "Customer Success Manager",
    "Business Development", "Sales Manager",
    // HR & People
    "HR Business Partner", "HR Manager", "HR Generalist",
    "Talent Acquisition", "Recruiter", "People Operations",
    // Finance
    "Financial Analyst", "Accountant", "Controller", "CFO",
    // Operations
    "Operations Manager", "Chief of Staff", "Strategy Manager",
  ];

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (value.length > 1) {
      const matches = POPULAR_SEARCHES.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Resume state
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [analysisCount, setAnalysisCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gemini match scores cache
  const [geminiScores, setGeminiScores] = useState<Record<string, GeminiScore>>({});
  const [matchLoading, setMatchLoading] = useState(false);
  // True after 8s with no score — cards still loading show "–" instead of the spinner
  const [matchTimedOut, setMatchTimedOut] = useState(false);
  // Start an 8s timer whenever AI scoring begins; reset when it finishes
  useEffect(() => {
    if (!matchLoading) { setMatchTimedOut(false); return; }
    const timer = setTimeout(() => setMatchTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [matchLoading]);
  const freshOnlyMounted = useRef(false);

  // Re-search when freshOnly toggle changes
  useEffect(() => {
    if (!freshOnlyMounted.current) { freshOnlyMounted.current = true; return; }
    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshOnly]);

  // Load saved session on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        setUser(session.user as User);
        loadProfile(session.access_token);
      }
      setIsAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        setToken(session.access_token);
        setUser(session.user as User);
      } else {
        setUser(null);
        setToken(null);
      }
    });
    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) || "[]");
      if (Array.isArray(recent)) setRecentLocations(recent);
    } catch {}
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (t: string) => {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.profile?.resume_profile) {
        setProfile(data.profile.resume_profile);
        setAnalysisCount(data.profile.resume_analyses_count || 0);
      }
    } catch {}
    // Load saved job IDs
    try {
      const res = await fetch("/api/saved-jobs", { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setSavedJobIds(new Set((data.jobs || []).map((j: any) => j.job_id)));
    } catch {}
  };

  const handleAuthSuccess = (u: User, t: string) => {
    setUser(u); setToken(t); setShowAuthModal(false);
    loadProfile(t);
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    setUser(null); setToken(null); setProfile(null); setAnalysisCount(0); setSavedJobIds(new Set());
    setJobs(prev => prev.map(j => ({ ...j, matchScore: undefined })));
  };

  const toggle = (v: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(v) ? list.filter(i => i !== v) : [...list, v]);

  const addMatchScores = useCallback((jobList: Job[], p: ResumeProfile | null) => {
    if (!p) return jobList;
    return jobList.map(job => ({ ...job, matchScore: calculateMatchScore(p, job) }));
  }, []);

  const fetchGeminiScores = useCallback(async (jobList: Job[], tokenOverride?: string) => {
    const activeToken = tokenOverride ?? token;
    console.log("[AI match] fetchGeminiScores called", {
      hasToken: !!activeToken,
      hasProfile: !!profile,
      jobCount: jobList.length,
      isAuthReady,
    });
    if (!activeToken || !profile || jobList.length === 0) {
      console.log("[AI match] Skipping — missing token, profile, or jobs");
      return;
    }
    setMatchLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ jobIds: jobList.map(j => j.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[AI match] API error:", res.status, data);
        return;
      }
      console.log("[AI match] Scores received:", Object.keys(data.scores || {}).length);
      if (data.scores) setGeminiScores(prev => ({ ...prev, ...data.scores }));
    } catch (e) {
      console.error("[AI match] fetch failed:", e);
    } finally { setMatchLoading(false); }
  }, [token, profile, isAuthReady]);

  const processJobs = (raw: any[], p: ResumeProfile | null) => {
    const cleaned = raw.map((job: any) => ({
      id: job.id, title: job.title, company: job.company, location: job.location,
      salary: job.salary || "", jobType: job.jobType || job.job_type || "Full-time",
      source: job.source, postedDate: job.postedDate || job.posted_date || "",
      applyUrl: job.applyUrl || job.apply_url || "", description: job.description || "",
      postedAt: job.postedAt || null,
    }));
    return addMatchScores(cleaned, p);
  };

  const buildUrl = (offset: number, locOverride?: string[]) => {
    const locs = locOverride ?? selectedLocations;
    const params = new URLSearchParams({
      keyword: keyword || "", limit: String(PAGE_SIZE), offset: String(offset),
      ...(locs.length && { location: locs.join(",") }),
      ...(selectedTypes[0] && { jobType: selectedTypes[0] }),
      ...(selectedDate && { datePosted: selectedDate }),
      ...(freshOnly && { fresh: "true" }),
    });
    return `/api/jobs?${params}`;
  };

  const handleSearch = async (locOverride?: string[]) => {
    const activeLocs = locOverride ?? selectedLocations;
    if (activeLocs.length) {
      saveRecentLocations(activeLocs);
      setRecentLocations(prev => {
        const merged = [...new Set([...activeLocs, ...prev])].slice(0, 8);
        return merged;
      });
    }
    setLoading(true); setError(""); setJobs([]); setCurrentOffset(0); setTotalFound(0); setHasMore(false);
    try {
      const res = await fetch(buildUrl(0, locOverride));
      const data = await res.json();
      if (data.error) { setError("Failed to load jobs."); return; }
      const withScores = processJobs(data.jobs || [], profile);
      setJobs(withScores);
      const total = data.meta?.total || withScores.length;
      setTotalFound(total); setHasMore(total > PAGE_SIZE); setCurrentOffset(PAGE_SIZE);
      fetchGeminiScores(withScores, token ?? undefined);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(currentOffset));
      const data = await res.json();
      if (!data.error) {
        const withScores = processJobs(data.jobs || [], profile);
        setJobs(prev => [...prev, ...withScores]);
        const newOffset = currentOffset + PAGE_SIZE;
        setCurrentOffset(newOffset); setHasMore(newOffset < (data.meta?.total || 0));
        fetchGeminiScores(withScores, token ?? undefined);
      }
    } catch {} finally { setLoadingMore(false); }
  };

  const handleResumeUpload = async (file: File) => {
    if (!user) { setShowAuthModal(true); return; }
    if (analysisCount >= FREE_ANALYSES) { setResumeError("Limit reached."); return; }

    setAnalyzingResume(true); setResumeError("");
    try {
      const formData = new FormData(); formData.append("resume", file);
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok || data.error) { setResumeError(data.error || "Failed"); return; }

      const newProfile = data.profile;
      const newCount = analysisCount + 1;
      setProfile(newProfile); setAnalysisCount(newCount);

      // Save to Supabase profile
      if (token) {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ resume_profile: newProfile, resume_analyses_count: newCount, name: newProfile.name }),
        });
      }

      if (jobs.length > 0) setJobs(prev => addMatchScores(prev, newProfile));
    } catch { setResumeError("Failed to analyze resume."); }
    finally { setAnalyzingResume(false); }
  };

  const removeProfile = async () => {
    setProfile(null);
    setJobs(p => p.map(j => ({ ...j, matchScore: undefined })));
    if (token) {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resume_profile: null }),
      });
    }
  };

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const freshFiltered = freshOnly
    ? jobs.filter(job => {
        const d = parseJobDate(job.postedAt || job.postedDate);
        return !d || (Date.now() - d.getTime()) <= THIRTY_DAYS_MS;
      })
    : jobs;
  const displayedJobs = sortByMatch && profile
    ? [...freshFiltered].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : freshFiltered;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      {/* Scoped styles for rendered HTML job descriptions */}
      <style>{`
        .job-description { color: #d1d5db; font-size: 14px; line-height: 1.7; overflow-wrap: break-word; }
        .job-description p { margin: 0.6em 0; }
        .job-description ul, .job-description ol { padding-left: 1.5rem; margin: 0.5em 0; }
        .job-description li { margin: 0.25em 0; }
        .job-description h1, .job-description h2, .job-description h3 { color: #f3f4f6; font-weight: 500; margin: 1em 0 0.4em; }
        .job-description h1 { font-size: 1.1em; }
        .job-description h2 { font-size: 1em; }
        .job-description h3 { font-size: 0.95em; }
        .job-description a { color: #60a5fa; text-decoration: underline; }
        .job-description strong, .job-description b { color: #e5e7eb; }
        .job-description img { display: none; }
      `}</style>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 pt-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">JobMatch</h1>
            <p className="text-gray-400 mt-1 text-sm">Find your perfect job</p>
          </div>
          <div className="mt-2">
            {user ? (
              <div className="flex items-center gap-2">
                <a href="/dashboard"
                  className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1 rounded-xl">
                  My Account
                </a>
                <button onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1 rounded-xl">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-700">
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
        )}

        {/* Resume Section */}
        <div className={`rounded-2xl p-4 mb-4 border ${profile ? "bg-green-950 border-green-800" : "bg-gray-900 border-gray-800"}`}>
          {!profile ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold">AI Resume Matching</h2>
                  <p className="text-xs text-gray-400">
                    {user ? "Upload resume → see match % for every job" : "Sign in to save your resume across sessions"}
                  </p>
                </div>
                {user && (
                  <span className="text-xs text-blue-400 bg-blue-950 px-2 py-1 rounded-full">
                    {Math.max(FREE_ANALYSES - analysisCount, 0)} left
                  </span>
                )}
              </div>
              {!user ? (
                <button onClick={() => setShowAuthModal(true)}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-3 text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Sign in to upload resume
                </button>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} disabled={analyzingResume}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-3 text-gray-400 hover:text-blue-400 text-sm transition-colors disabled:opacity-50">
                  {analyzingResume ? "⏳ Analyzing..." : "📄 Upload PDF Resume"}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); e.target.value = ""; }} />
              {resumeError && <p className="text-red-400 text-xs mt-2">{resumeError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">✓ {profile.name}</p>
                <p className="text-xs text-gray-400">{profile.title} · {profile.level} · {profile.skills.slice(0, 3).join(", ")}</p>
              </div>
              <button onClick={removeProfile} className="text-xs text-gray-500 hover:text-gray-300">Remove</button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Title / Keywords</label>
            <div className="relative">
              <input type="text" value={keyword} onChange={e => handleKeywordChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setShowSuggestions(false); handleSearch(); } }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => keyword.length > 1 && setShowSuggestions(suggestions.length > 0)}
                placeholder="e.g. Motion Designer, Software Engineer"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
              {showSuggestions && (
                <div className="absolute z-20 mt-1 w-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                  {suggestions.map(s => (
                    <button key={s} onMouseDown={() => { setKeyword(s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
            <LocationDropdown
              selected={selectedLocations}
              recentLocations={recentLocations}
              onChange={(locs) => { setSelectedLocations(locs); handleSearch(locs); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Salary: <span className="text-blue-400">{salary === 0 ? "Any" : `$${salary}k+`}</span>
            </label>
            <input type="range" min="0" max="200" value={salary} onChange={e => setSalary(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Type</label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map(t => (
                <button key={t} onClick={() => toggle(t, selectedTypes, setSelectedTypes)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${selectedTypes.includes(t) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Date Posted</label>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map(d => (
                <button key={d} onClick={() => setSelectedDate(selectedDate === d ? "" : d)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${selectedDate === d ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Last 30 days only</span>
            <button onClick={() => setFreshOnly(!freshOnly)}
              className={`w-11 h-6 rounded-full transition-colors relative ${freshOnly ? "bg-green-600" : "bg-gray-700"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${freshOnly ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <button onClick={() => handleSearch()} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? "Searching..." : "Search Jobs"}
          </button>
        </div>

        {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
        {loading && <p className="mt-6 text-center text-gray-400 text-sm">Finding jobs...</p>}

        {jobs.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                <span className="text-white font-medium">{jobs.length}</span> of{" "}
                <span className="text-white font-medium">{totalFound.toLocaleString()}</span> jobs
              </p>
              {profile && (
                <button onClick={() => setSortByMatch(!sortByMatch)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${sortByMatch ? "border-green-600 text-green-400 bg-green-950" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  {sortByMatch ? "✓ By match" : "Sort by match"}
                </button>
              )}
            </div>

            {displayedJobs.map(job => {
              const desc = stripHtml(job.description);
              const salaryDisplay = extractSalary(desc, job.salary);
              const level = extractLevel(desc, job.title);
              const yearsExp = extractYearsExp(desc);
              const workMode = extractWorkMode(desc, job.location);
              const locationClean = cleanLocation(job.location);
              const gemini = geminiScores[job.id];
              const displayScore = gemini ? gemini.total : job.matchScore;
              const isLoadingMatch = matchLoading && !gemini && !!profile && !!token;
              const isLowMatch = displayScore !== undefined && displayScore < 30;
              const isExpanded = expandedId === job.id;

              return (
                <div key={job.id}
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  className={`bg-gray-900 rounded-2xl border transition-all cursor-pointer ${isLowMatch ? "opacity-40" : ""} ${isExpanded ? "border-blue-700" : "border-gray-800 hover:border-gray-600"}`}>

                  {/* ── Card header (always visible) ── */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold text-white leading-tight">{job.title}</h2>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Show circle whenever: AI is scoring, timed out, or a score is ready */}
                        {(isLoadingMatch || matchTimedOut || displayScore !== undefined) && (
                          <MatchCircle score={displayScore} loading={isLoadingMatch} timedOut={matchTimedOut} />
                        )}
                        {/* Chevron — rotates when expanded */}
                        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-blue-400 text-sm mt-0.5 font-medium">{job.company}</p>

                    {/* Info row */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 text-xs text-gray-400">
                      {locationClean && <span>📍 {locationClean}</span>}
                      {job.jobType && <span>· {job.jobType}</span>}
                      {workMode && <span className={workMode === "Remote" ? "text-green-400" : workMode === "Hybrid" ? "text-yellow-400" : ""}>· {workMode}</span>}
                      {level && <span>· {level}</span>}
                      {salaryDisplay && <span className="text-green-400">· {salaryDisplay}</span>}
                      {yearsExp && <span>· {yearsExp}</span>}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        {formatDate(job.postedDate) && <span>{formatDate(job.postedDate)}</span>}
                        {(() => {
                          const badge = getJobAgeBadge(job.postedAt || job.postedDate);
                          return badge ? (
                            <span className={`px-1.5 py-0.5 rounded-md font-medium ${BADGE_CLASSES[badge.color]}`}>
                              {badge.label}
                            </span>
                          ) : null;
                        })()}
                        {displayScore !== undefined && (
                          <span style={{ color: matchColor(displayScore) }}>· {matchLabel(displayScore)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Stop propagation so save/apply clicks don't toggle the card */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!user) { setShowAuthModal(true); return; }
                            const isSaved = savedJobIds.has(job.id);
                            if (isSaved) {
                              const res = await fetch(`/api/saved-jobs?job_id=${job.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (res.ok) setSavedJobIds(prev => { const s = new Set(prev); s.delete(job.id); return s; });
                            } else {
                              const res = await fetch("/api/saved-jobs", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({
                                  job_id: job.id, title: job.title, company: job.company,
                                  location: job.location, salary: job.salary, job_type: job.jobType,
                                  source: job.source, posted_date: job.postedDate, apply_url: job.applyUrl,
                                }),
                              });
                              if (res.ok) setSavedJobIds(prev => new Set([...prev, job.id]));
                            }
                          }}
                          className={`text-2xl leading-none transition-colors ${savedJobIds.has(job.id) ? "text-red-400" : "text-gray-600 hover:text-gray-400"}`}
                          title={savedJobIds.has(job.id) ? "Unsave" : "Save"}>
                          ♥
                        </button>
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-xl transition-colors">
                          Apply →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded section ── */}
                  {isExpanded && (
                    <div className="px-4 pb-5 border-t border-gray-800" onClick={e => e.stopPropagation()}>
                      {isLoadingMatch && !gemini ? (
                        <div className="flex items-center gap-2 pt-3 pb-1 text-xs text-gray-500">
                          <svg className="animate-spin w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span className="text-blue-400">AI analyzing…</span>
                        </div>
                      ) : gemini ? (
                        <div className="flex gap-4 pt-3 pb-1 text-xs text-gray-400">
                          <span>Skills: <span style={{ color: matchColor(gemini.skills) }} className="font-semibold">{gemini.skills}%</span></span>
                          <span>Level: <span style={{ color: matchColor(gemini.level) }} className="font-semibold">{gemini.level}%</span></span>
                          <span>Industry: <span style={{ color: matchColor(gemini.industry) }} className="font-semibold">{gemini.industry}%</span></span>
                        </div>
                      ) : null}
                      {/* Prominent Apply button at top of expanded view */}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-gray-500">Full description</span>
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                          Apply Now →
                        </a>
                      </div>
                      {job.description ? (
                        <div
                          className="job-description"
                          dangerouslySetInnerHTML={{ __html: decodeHtml(job.description) }}
                        />
                      ) : (
                        <p className="text-gray-500 text-sm italic">No description available.</p>
                      )}
                      {/* Collapse button at bottom */}
                      <button
                        onClick={() => setExpandedId(null)}
                        className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline transition-colors">
                        ↑ Collapse
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {hasMore && (
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm font-medium py-3 rounded-xl">
                {loadingMore ? "Loading..." : "Load more jobs"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
