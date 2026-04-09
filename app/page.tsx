"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { calculateMatchScore, getMatchColor, getMatchLabel, ResumeProfile } from "@/lib/matcher";

const LOCATIONS = ["Remote", "USA", "Europe", "LATAM"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"];
const DATE_OPTIONS = ["Last 24h", "3 days", "Week", "Month"];
const PAGE_SIZE = 20;
const FREE_ANALYSES = 100; // высокий лимит для тестирования

type Job = {
  id: string; title: string; company: string; location: string;
  salary: string; jobType: string; source: string; postedDate: string;
  applyUrl: string; description: string; matchScore?: number;
};

type User = {
  id: string;
  email: string;
};

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractSalary(description: string, existing: string): string {
  if (existing) return existing;
  const m = (description || "").match(/\$[\d,]+[Kk]?\s*[-–]\s*\$[\d,]+[Kk]?/);
  return m ? m[0] : "";
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

function cleanLocation(location: string): string {
  return (location || "").replace(/remote/i, "").replace(/^\s*[-,]\s*/, "").replace(/\s*[-,]\s*$/, "").trim();
}

// Auth Modal Component
function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, email, password, name }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (mode === "signup") {
        setError(""); 
        setMode("signin");
        setError("Account created! Please sign in.");
        return;
      }
      // Save session
      localStorage.setItem("jm_token", data.session.access_token);
      localStorage.setItem("jm_user", JSON.stringify(data.user));
      onSuccess(data.user, data.session.access_token);
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
  const [salary, setSalary] = useState(200);
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

  const POPULAR_SEARCHES = [
    "Motion Designer", "Senior Motion Designer", "Motion Graphic Designer",
    "Video Editor", "Creative Director", "Art Director",
    "Software Engineer", "Senior Software Engineer", "Full Stack Developer",
    "Frontend Engineer", "Backend Engineer", "iOS Engineer",
    "Product Manager", "Product Designer", "UX Designer", "UI Designer",
    "HR Business Partner", "HR Manager", "Talent Acquisition",
    "Data Scientist", "Data Analyst", "Machine Learning Engineer",
    "DevOps Engineer", "Site Reliability Engineer", "Platform Engineer",
    "Marketing Manager", "Growth Manager", "Content Marketing",
    "Sales Engineer", "Account Executive", "Customer Success",
  ];

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (value.length > 1) {
      const matches = POPULAR_SEARCHES.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Resume state
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [analysisCount, setAnalysisCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("jm_token");
    const savedUser = localStorage.getItem("jm_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Load profile from Supabase
        loadProfile(savedToken);
      } catch {}
    }
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
  };

  const handleAuthSuccess = (u: User, t: string) => {
    setUser(u); setToken(t); setShowAuthModal(false);
    loadProfile(t);
  };

  const handleSignOut = () => {
    localStorage.removeItem("jm_token");
    localStorage.removeItem("jm_user");
    setUser(null); setToken(null); setProfile(null); setAnalysisCount(0);
    setJobs(prev => prev.map(j => ({ ...j, matchScore: undefined })));
  };

  const toggle = (v: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(v) ? list.filter(i => i !== v) : [...list, v]);

  const addMatchScores = useCallback((jobList: Job[], p: ResumeProfile | null) => {
    if (!p) return jobList;
    return jobList.map(job => ({ ...job, matchScore: calculateMatchScore(p, job) }));
  }, []);

  const processJobs = (raw: any[], p: ResumeProfile | null) => {
    const cleaned = raw.map((job: any) => ({
      id: job.id, title: job.title, company: job.company, location: job.location,
      salary: job.salary || "", jobType: job.jobType || job.job_type || "Full-time",
      source: job.source, postedDate: job.postedDate || job.posted_date || "",
      applyUrl: job.applyUrl || job.apply_url || "", description: job.description || "",
    }));
    return addMatchScores(cleaned, p);
  };

  const buildUrl = (offset: number) => {
    const params = new URLSearchParams({
      keyword: keyword || "", limit: String(PAGE_SIZE), offset: String(offset),
      ...(selectedLocations.length && { location: selectedLocations.join(",") }),
      ...(selectedTypes[0] && { jobType: selectedTypes[0] }),
      ...(selectedDate && { datePosted: selectedDate }),
    });
    return `/api/jobs?${params}`;
  };

  const handleSearch = async () => {
    setLoading(true); setError(""); setJobs([]); setCurrentOffset(0); setTotalFound(0); setHasMore(false);
    try {
      const res = await fetch(buildUrl(0));
      const data = await res.json();
      if (data.error) { setError("Failed to load jobs."); return; }
      const withScores = processJobs(data.jobs || [], profile);
      setJobs(withScores);
      const total = data.meta?.total || withScores.length;
      setTotalFound(total); setHasMore(total > PAGE_SIZE); setCurrentOffset(PAGE_SIZE);
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
      }
    } catch {} finally { setLoadingMore(false); }
  };

  const handleResumeUpload = async (file: File) => {
    if (!user) { setShowAuthModal(true); return; }
    if (analysisCount >= FREE_ANALYSES) { setResumeError("Limit reached."); return; }

    setAnalyzingResume(true); setResumeError("");
    try {
      const formData = new FormData(); formData.append("resume", file);
      const res = await fetch("/api/analyze-resume", { method: "POST", body: formData });
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

  const displayedJobs = sortByMatch && profile
    ? [...jobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : jobs;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 pt-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">JobMatch</h1>
            <p className="text-gray-400 mt-1 text-sm">Find your perfect job</p>
          </div>
          <div className="mt-2">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{user.email}</span>
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
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => (
                <button key={loc} onClick={() => toggle(loc, selectedLocations, setSelectedLocations)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${selectedLocations.includes(loc) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Salary: <span className="text-blue-400">{salary === 200 ? "$200k+" : `up to $${salary}k`}</span>
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
          <button onClick={handleSearch} disabled={loading}
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
              const isLowMatch = job.matchScore !== undefined && job.matchScore < 30;

              return (
                <div key={job.id}
                  className={`bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-gray-600 transition-all ${isLowMatch ? "opacity-40" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-white leading-tight">{job.title}</h2>
                    {job.matchScore !== undefined && (
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: `${getMatchColor(job.matchScore)}20`,
                          color: getMatchColor(job.matchScore),
                          border: `1px solid ${getMatchColor(job.matchScore)}40`,
                        }}>
                        {job.matchScore}%
                      </span>
                    )}
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
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{job.source}</span>
                      {job.postedDate && <span>· {job.postedDate}</span>}
                      {job.matchScore !== undefined && (
                        <span style={{ color: getMatchColor(job.matchScore) }}>· {getMatchLabel(job.matchScore)}</span>
                      )}
                    </div>
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-xl transition-colors">
                      Apply →
                    </a>
                  </div>
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
