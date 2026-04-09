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
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

// Extract company one-liner from description (first sentence)
function extractCompanyBlurb(description: string): string {
  if (!description || description === "Click Apply to view full job description.") return "";
  const clean = stripHtml(description);
  // Get first meaningful sentence
  const sentences = clean.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
  return sentences[0] ? sentences[0].substring(0, 120) : "";
}

// Extract salary from description
function extractSalary(description: string, existingSalary: string): string {
  if (existingSalary) return existingSalary;
  const match = description?.match(/\$[\d,]+\s*[-–]\s*\$[\d,]+|\$[\d,]+[Kk]?\s*[-–]\s*\$[\d,]+[Kk]?/);
  return match ? match[0] : "";
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

  // Resume state
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [analysisCount, setAnalysisCount] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("resumeAnalysisCount") || "0");
    }
    return 0;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  };

  const addMatchScores = useCallback((jobList: Job[], currentProfile: ResumeProfile | null) => {
    if (!currentProfile) return jobList;
    return jobList.map((job) => ({
      ...job,
      matchScore: calculateMatchScore(currentProfile, job),
    }));
  }, []);

  const buildUrl = (offset: number) => {
    const location = selectedLocations.join(",") || "";
    const jobType = selectedTypes[0] || "";
    const params = new URLSearchParams({
      keyword: keyword || "",
      limit: String(PAGE_SIZE),
      offset: String(offset),
      ...(location && { location }),
      ...(jobType && { jobType }),
      ...(selectedDate && { datePosted: selectedDate }),
    });
    return `/api/jobs?${params.toString()}`;
  };

  const processJobs = (rawJobs: any[], currentProfile: ResumeProfile | null) => {
    const cleaned = rawJobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || "",
      jobType: job.jobType || job.job_type || "Full-time",
      source: job.source,
      postedDate: job.postedDate || job.posted_date || "",
      applyUrl: job.applyUrl || job.apply_url || "",
      description: job.description || "",
    }));
    return addMatchScores(cleaned, currentProfile);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setJobs([]);
    setCurrentOffset(0);
    setTotalFound(0);
    setHasMore(false);
    try {
      const res = await fetch(buildUrl(0));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) {
        setError("Failed to load jobs. Please try again.");
      } else {
        const withScores = processJobs(data.jobs || [], profile);
        setJobs(withScores);
        const total = data.meta?.total || withScores.length;
        setTotalFound(total);
        setHasMore(total > PAGE_SIZE);
        setCurrentOffset(PAGE_SIZE);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(currentOffset));
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.error) {
        const withScores = processJobs(data.jobs || [], profile);
        setJobs((prev) => [...prev, ...withScores]);
        const newOffset = currentOffset + PAGE_SIZE;
        setCurrentOffset(newOffset);
        setHasMore(newOffset < (data.meta?.total || 0));
      }
    } catch {}
    finally { setLoadingMore(false); }
  };

  const handleResumeUpload = async (file: File) => {
    if (analysisCount >= FREE_ANALYSES) {
      setResumeError(`You've used all ${FREE_ANALYSES} free analyses.`);
      return;
    }
    setAnalyzingResume(true);
    setResumeError("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/analyze-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) { setResumeError(data.error || "Failed to analyze resume"); return; }
      const newProfile = data.profile;
      setProfile(newProfile);
      setResumeName(file.name);
      const newCount = analysisCount + 1;
      setAnalysisCount(newCount);
      localStorage.setItem("resumeAnalysisCount", String(newCount));
      if (jobs.length > 0) setJobs((prev) => addMatchScores(prev, newProfile));
    } catch { setResumeError("Failed to analyze resume. Please try again."); }
    finally { setAnalyzingResume(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const remainingFree = Math.max(FREE_ANALYSES - analysisCount, 0);

  // Sort jobs by match score if enabled
  const displayedJobs = sortByMatch && profile
    ? [...jobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : jobs;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 pt-8">
          <h1 className="text-3xl font-bold text-white">JobMatch</h1>
          <p className="text-gray-400 mt-1">Find your perfect job</p>
        </div>

        {/* Resume Upload */}
        <div className={`rounded-2xl p-5 mb-4 border ${profile ? "bg-green-950 border-green-800" : "bg-gray-900 border-gray-800"}`}>
          {!profile ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">AI Resume Matching</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Upload your resume to see match % for every job</p>
                </div>
                <span className="text-xs text-blue-400 bg-blue-950 px-2 py-1 rounded-full">
                  {remainingFree} free {remainingFree === 1 ? "analysis" : "analyses"} left
                </span>
              </div>
              {analysisCount >= FREE_ANALYSES ? (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-400 mb-2">You've used all free analyses</p>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-6 py-2 rounded-xl transition-colors">
                    Upgrade to Pro — $9/mo
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} disabled={analyzingResume}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-4 text-gray-400 hover:text-blue-400 text-sm transition-colors disabled:opacity-50">
                  {analyzingResume ? "⏳ Analyzing your resume..." : "📄 Upload PDF Resume"}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); e.target.value = ""; }} />
              {resumeError && <p className="text-red-400 text-xs mt-2">{resumeError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-sm font-medium text-white">{profile.name || resumeName}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {profile.title} · {profile.level} · {profile.skills.slice(0, 3).join(", ")}
                </p>
              </div>
              <button onClick={() => { setProfile(null); setResumeName(""); setJobs(prev => prev.map(j => ({ ...j, matchScore: undefined }))); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Remove</button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title / Keywords</label>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="e.g. Motion Designer, Software Engineer"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button key={loc} onClick={() => toggle(loc, selectedLocations, setSelectedLocations)}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedLocations.includes(loc) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Salary Range: <span className="text-blue-400">{salary === 200 ? "$200k+" : `up to $${salary}k`}</span>
            </label>
            <input type="range" min="0" max="200" value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>$0</span><span>$200k+</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((type) => (
                <button key={type} onClick={() => toggle(type, selectedTypes, setSelectedTypes)}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedTypes.includes(type) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Posted</label>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map((date) => (
                <button key={date} onClick={() => setSelectedDate(selectedDate === date ? "" : date)}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedDate === date ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {date}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSearch} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors mt-2">
            {loading ? "Searching..." : "Search Jobs"}
          </button>
        </div>

        {error && <div className="mt-4 text-red-400 text-sm text-center">{error}</div>}
        {loading && <div className="mt-6 text-center text-gray-400">Finding jobs for you...</div>}

        {jobs.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-medium">{jobs.length}</span> of{" "}
                <span className="text-white font-medium">{totalFound.toLocaleString()}</span> jobs
              </p>
              <div className="flex items-center gap-3">
                {profile && (
                  <button onClick={() => setSortByMatch(!sortByMatch)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${sortByMatch ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                    {sortByMatch ? "✓ Sorted by match" : "Sort by match"}
                  </button>
                )}
                {profile && <p className="text-xs text-green-400">✓ Match scores on</p>}
              </div>
            </div>

            {displayedJobs.map((job) => {
              const blurb = extractCompanyBlurb(job.description);
              const salary = extractSalary(job.description, job.salary);
              const isLowMatch = job.matchScore !== undefined && job.matchScore < 30;

              return (
                <div key={job.id} className={`bg-gray-900 rounded-2xl p-5 transition-colors ${isLowMatch ? "opacity-60 hover:opacity-80" : "hover:bg-gray-800"}`}>
                  
                  {/* Header row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-white leading-tight">{job.title}</h2>
                        {job.matchScore !== undefined && (
                          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: `${getMatchColor(job.matchScore)}20`,
                              color: getMatchColor(job.matchScore),
                              border: `1px solid ${getMatchColor(job.matchScore)}50`,
                            }}>
                            {job.matchScore}% match
                          </span>
                        )}
                      </div>
                      <p className="text-blue-400 text-sm font-medium mt-1">{job.company}</p>
                    </div>
                  </div>

                  {/* Info pills row */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.location && (
                      <span className="text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                        📍 {job.location}
                      </span>
                    )}
                    {salary && (
                      <span className="text-xs text-green-400 bg-green-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                        💰 {salary}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                      💼 {job.jobType}
                    </span>
                    {job.postedDate && (
                      <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                        📅 {job.postedDate}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 bg-gray-800 px-2.5 py-1 rounded-full">
                      {job.source}
                    </span>
                  </div>

                  {/* Company blurb */}
                  {blurb && (
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed italic">"{blurb}"</p>
                  )}

                  {/* Match label + Apply */}
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      {job.matchScore !== undefined && (
                        <span className="text-xs font-medium" style={{ color: getMatchColor(job.matchScore) }}>
                          {getMatchLabel(job.matchScore)}
                          {isLowMatch && " — skills don't match well"}
                        </span>
                      )}
                    </div>
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl transition-colors">
                      Apply →
                    </a>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium py-4 rounded-xl transition-colors">
                {loadingMore ? "Loading..." : "Load more jobs"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
