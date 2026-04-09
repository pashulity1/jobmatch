"use client";
import { useState, useRef, useCallback } from "react";
import { calculateMatchScore, getMatchColor, getMatchLabel, ResumeProfile } from "@/lib/matcher";

const LOCATIONS = ["Remote", "USA", "Europe", "LATAM"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"];
const DATE_OPTIONS = ["Last 24h", "3 days", "Week", "Month"];
const PAGE_SIZE = 20;
const FREE_ANALYSES = 3;

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  source: string;
  postedDate: string;
  applyUrl: string;
  description: string;
  matchScore?: number;
};

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractSalary(description: string, existing: string): string {
  if (existing) return existing;
  const m = description?.match(/\$[\d,]+[Kk]?\s*[-–]\s*\$[\d,]+[Kk]?/);
  return m ? m[0] : "";
}

function extractLevel(description: string, title: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("senior") || text.includes("sr.")) return "Senior";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) return "Junior";
  if (text.includes("lead") || text.includes("staff") || text.includes("principal")) return "Lead";
  if (text.includes("manager") || text.includes("director")) return "Manager";
  if (text.includes("mid-level") || text.includes("mid level")) return "Mid";
  return "";
}

function extractYearsExp(description: string): string {
  const m = description?.match(/(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)/i);
  return m ? `${m[1]}+ yrs exp` : "";
}

function extractWorkMode(description: string, location: string): string {
  const text = `${description} ${location}`.toLowerCase();
  if (text.includes("remote")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("onsite") || text.includes("on-site") || text.includes("in-office")) return "Onsite";
  return "";
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

  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [analysisCount, setAnalysisCount] = useState(() => {
    if (typeof window !== "undefined") return parseInt(localStorage.getItem("resumeAnalysisCount") || "0");
    return 0;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (analysisCount >= FREE_ANALYSES) { setResumeError("No free analyses left."); return; }
    setAnalyzingResume(true); setResumeError("");
    try {
      const formData = new FormData(); formData.append("resume", file);
      const res = await fetch("/api/analyze-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) { setResumeError(data.error || "Failed"); return; }
      setProfile(data.profile); setResumeName(file.name);
      const newCount = analysisCount + 1; setAnalysisCount(newCount);
      localStorage.setItem("resumeAnalysisCount", String(newCount));
      if (jobs.length > 0) setJobs(prev => addMatchScores(prev, data.profile));
    } catch { setResumeError("Failed to analyze resume."); }
    finally { setAnalyzingResume(false); }
  };

  const displayedJobs = sortByMatch && profile
    ? [...jobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : jobs;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 pt-6">
          <h1 className="text-3xl font-bold">JobMatch</h1>
          <p className="text-gray-400 mt-1 text-sm">Find your perfect job</p>
        </div>

        {/* Resume Upload */}
        <div className={`rounded-2xl p-4 mb-4 border ${profile ? "bg-green-950 border-green-800" : "bg-gray-900 border-gray-800"}`}>
          {!profile ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold">AI Resume Matching</h2>
                  <p className="text-xs text-gray-400">Upload resume → see match % for every job</p>
                </div>
                <span className="text-xs text-blue-400 bg-blue-950 px-2 py-1 rounded-full">
                  {Math.max(FREE_ANALYSES - analysisCount, 0)} free left
                </span>
              </div>
              {analysisCount >= FREE_ANALYSES ? (
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-xl">Upgrade to Pro — $9/mo</button>
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
                <p className="text-sm font-medium text-green-300">✓ {profile.name || resumeName}</p>
                <p className="text-xs text-gray-400">{profile.title} · {profile.level} · {profile.skills.slice(0, 3).join(", ")}</p>
              </div>
              <button onClick={() => { setProfile(null); setJobs(p => p.map(j => ({ ...j, matchScore: undefined }))); }}
                className="text-xs text-gray-500 hover:text-gray-300">Remove</button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Title / Keywords</label>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Motion Designer, Software Engineer"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Salary: <span className="text-blue-400">{salary === 200 ? "$200k+" : `up to $${salary}k`}</span>
            </label>
            <input type="range" min="0" max="200" value={salary} onChange={e => setSalary(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
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
              const salary = extractSalary(desc, job.salary);
              const level = extractLevel(desc, job.title);
              const yearsExp = extractYearsExp(desc);
              const workMode = extractWorkMode(desc, job.location);
              const locationClean = job.location?.replace(/remote/i, "").replace(/,\s*$/, "").trim();
              const isLowMatch = job.matchScore !== undefined && job.matchScore < 30;

              return (
                <div key={job.id}
                  className={`bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all ${isLowMatch ? "opacity-50" : ""}`}>

                  {/* Top: title + match score */}
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

                  {/* Company */}
                  <p className="text-blue-400 text-sm mt-0.5 font-medium">{job.company}</p>

                  {/* Info row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-gray-400">
                    {locationClean && (
                      <span className="flex items-center gap-1">
                        <span>📍</span> {locationClean}
                      </span>
                    )}
                    {workMode && (
                      <span className="flex items-center gap-1">
                        <span>🏢</span> {workMode}
                      </span>
                    )}
                    {level && (
                      <span className="flex items-center gap-1">
                        <span>📊</span> {level}
                      </span>
                    )}
                    {salary && (
                      <span className="flex items-center gap-1 text-green-400">
                        <span>💰</span> {salary}
                      </span>
                    )}
                    {yearsExp && (
                      <span className="flex items-center gap-1">
                        <span>⏱</span> {yearsExp}
                      </span>
                    )}
                    {job.postedDate && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <span>📅</span> {job.postedDate}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-800 mt-3 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{job.source}</span>
                      {job.matchScore !== undefined && (
                        <span className="text-xs" style={{ color: getMatchColor(job.matchScore) }}>
                          · {getMatchLabel(job.matchScore)}
                        </span>
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
