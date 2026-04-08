"use client";
import { useState } from "react";

const LOCATIONS = ["Remote", "USA", "Europe", "LATAM"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"];
const DATE_OPTIONS = ["Last 24h", "3 days", "Week", "Month"];
const PAGE_SIZE = 20;

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
};

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
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

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  };

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
        const cleaned = (data.jobs || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || "",
          jobType: job.jobType || job.job_type || "Full-time",
          source: job.source,
          postedDate: job.postedDate || job.posted_date || "",
          applyUrl: job.applyUrl || job.apply_url || "",
          description: stripHtml(job.description || "").substring(0, 200),
        }));
        setJobs(cleaned);
        const total = data.meta?.total || cleaned.length;
        setTotalFound(total);
        setHasMore(total > PAGE_SIZE);
        setCurrentOffset(PAGE_SIZE);
      }
    } catch (e: any) {
      setError("Something went wrong. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(currentOffset));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.error) {
        const cleaned = (data.jobs || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || "",
          jobType: job.jobType || job.job_type || "Full-time",
          source: job.source,
          postedDate: job.postedDate || job.posted_date || "",
          applyUrl: job.applyUrl || job.apply_url || "",
          description: stripHtml(job.description || "").substring(0, 200),
        }));
        setJobs((prev) => [...prev, ...cleaned]);
        const newOffset = currentOffset + PAGE_SIZE;
        setCurrentOffset(newOffset);
        setHasMore(newOffset < (data.meta?.total || 0));
      }
    } catch {
      // silent fail
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 pt-8">
          <h1 className="text-3xl font-bold text-white">JobMatch</h1>
          <p className="text-gray-400 mt-1">Find your perfect job</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title / Keywords</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Motion Designer, Software Engineer"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
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
            <input type="range" min="0" max="200" value={salary}
              onChange={(e) => setSalary(Number(e.target.value))} className="w-full accent-blue-500" />
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
            <p className="text-gray-400 text-sm">
              Showing <span className="text-white font-medium">{jobs.length}</span> of{" "}
              <span className="text-white font-medium">{totalFound.toLocaleString()}</span> jobs found
            </p>
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-900 rounded-2xl p-5 hover:bg-gray-800 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white leading-tight">{job.title}</h2>
                    <p className="text-blue-400 text-sm mt-1">{job.company}</p>
                    <p className="text-gray-400 text-sm">{job.location}</p>
                  </div>
                  {job.salary && (
                    <span className="text-green-400 text-sm font-medium whitespace-nowrap ml-4">{job.salary}</span>
                  )}
                </div>
                {job.description && (
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed">{job.description}</p>
                )}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{job.postedDate} · {job.jobType}</span>
                    {job.source && (
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">{job.source}</span>
                    )}
                  </div>
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl transition-colors">
                    Apply
                  </a>
                </div>
              </div>
            ))}
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
