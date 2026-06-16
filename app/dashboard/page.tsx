"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore } from "@/lib/matcher";
import { SavedJobCard } from "@/app/components/jobs/SavedJobCard";
import { CoverLetterEditor } from "@/app/components/jobs/CoverLetterEditor";
import { ResumeAdapterEditor } from "@/app/components/jobs/ResumeAdapterEditor";

type User = { id: string; email: string };
type Profile = {
  id: string; name?: string; email?: string;
  resume_profile?: any; resume_analyses_count?: number;
  interested_positions?: string[]; work_format?: string[];
};
type SavedJob = {
  id: string; job_id: string; title: string; company: string;
  location: string; salary: string; job_type: string;
  source: string; posted_date: string; apply_url: string; created_at: string; description?: string;
  logo_color?: string;     // hex color for manually-added jobs
  custom_job_url?: string; // original URL for manually-added jobs
};
type AlertPrefs = {
  positions?: string[]; locations?: string[]; levels?: string[]; formats?: string[];
  instant_enabled?: boolean; instant_frequency?: number;
  digest_enabled?: boolean; digest_frequency?: "daily" | "weekly";
};

const TABS = ["Overview", "Saved Jobs", "Settings", "Job Alerts"] as const;
type Tab = typeof TABS[number];

const LEVEL_OPTIONS = ["Entry", "Mid", "Senior", "Lead", "Manager", "Director"];
const FORMAT_OPTIONS = ["Remote", "Hybrid", "Onsite"];

const POPULAR_POSITIONS = [
  "Motion Designer", "Senior Motion Designer", "Motion Graphic Designer",
  "Video Editor", "Creative Director", "Art Director", "Graphic Designer",
  "Brand Designer", "UI Designer", "UX Designer", "Product Designer",
  "Visual Designer", "Illustrator", "Animator", "3D Artist",
  "Software Engineer", "Senior Software Engineer", "Full Stack Developer",
  "Frontend Engineer", "Backend Engineer", "iOS Engineer", "Android Engineer",
  "Machine Learning Engineer", "Data Engineer", "DevOps Engineer",
  "Platform Engineer", "Site Reliability Engineer", "Security Engineer",
  "Product Manager", "Senior Product Manager", "Technical Program Manager",
  "Project Manager", "Engineering Manager", "Director of Engineering",
  "Data Scientist", "Data Analyst", "Business Analyst", "Analytics Engineer",
  "Marketing Manager", "Growth Manager", "Content Marketing Manager",
  "Social Media Manager", "Performance Marketing", "SEO Manager",
  "Brand Manager", "Copywriter", "Content Designer",
  "Account Executive", "Sales Engineer", "Customer Success Manager",
  "Business Development", "Sales Manager",
  "HR Business Partner", "HR Manager", "Recruiter", "Talent Acquisition",
  "Financial Analyst", "Accountant", "Operations Manager", "Chief of Staff",
];

// Map between Tab display names and URL slugs
const TAB_SLUGS: Record<Tab, string> = {
  "Overview":   "overview",
  "Saved Jobs": "saved-jobs",
  "Settings":   "settings",
  "Job Alerts": "alerts",
};
const SLUG_TO_TAB: Record<string, Tab> = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([k, v]) => [v, k as Tab])
);

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [alertPrefs, setAlertPrefs] = useState<AlertPrefs>({});
  // Initialize active tab from ?tab= URL param so links and browser back/forward work
  const [activeTab, setActiveTab] = useState<Tab>(
    () => SLUG_TO_TAB[searchParams.get("tab") ?? ""] ?? "Overview"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Settings form state
  const [settingsName, setSettingsName] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsPositions, setSettingsPositions] = useState<string[]>([]);
  const [settingsFormats, setSettingsFormats] = useState<string[]>([]);
  const [newPosition, setNewPosition] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // Alert form state
  const [alertPositions, setAlertPositions] = useState<string[]>([]);
  const [alertLevels, setAlertLevels] = useState<string[]>([]);
  const [alertFormats, setAlertFormats] = useState<string[]>([]);
  const [instantEnabled, setInstantEnabled] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestFreq, setDigestFreq] = useState<"daily" | "weekly">("daily");
  const [newAlertPosition, setNewAlertPosition] = useState("");
  const [alertSuggestions, setAlertSuggestions] = useState<string[]>([]);
  const [showAlertSuggestions, setShowAlertSuggestions] = useState(false);

  // Saved jobs expand state
  const [expandedSavedJobId, setExpandedSavedJobId] = useState<string | null>(null);

  // Editor overlays
  const [editorMode, setEditorMode] = useState<null | "cover-letter" | "resume-adapt">(null);
  const [editorJob, setEditorJob] = useState<SavedJob | null>(null);

  // Add Job from URL modal
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [addJobInput, setAddJobInput] = useState("");        // URL or raw text
  const [addJobPastedText, setAddJobPastedText] = useState(""); // LinkedIn manual paste
  const [addJobColor, setAddJobColor] = useState("#4558C8");
  const [addJobLoading, setAddJobLoading] = useState(false);
  const [addJobError, setAddJobError] = useState<string | null>(null);
  const [showColorPalette, setShowColorPalette] = useState(false);

  // Sync active tab when the ?tab= param changes (e.g. browser back/forward)
  useEffect(() => {
    const tab = SLUG_TO_TAB[searchParams.get("tab") ?? ""] ?? "Overview";
    setActiveTab(tab);
  }, [searchParams]);

  // Navigate to a tab by updating the URL; the effect above keeps activeTab in sync
  const navigateToTab = (tab: Tab) => {
    router.push(`/dashboard?tab=${TAB_SLUGS[tab]}`);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/"); return; }
      setToken(session.access_token);
      setUser(session.user as User);
      loadAll(session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) { router.push("/"); return; }
      setToken(session.access_token);
      setUser(session.user as User);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAll = async (t: string) => {
    setLoading(true);
    await Promise.all([loadProfile(t), loadSavedJobs(t), loadAlerts(t)]);
    setLoading(false);
  };

  const loadProfile = async (t: string) => {
    try {
      const res = await fetch("/api/profile", { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setSettingsName(data.profile.name || "");
        setSettingsEmail(data.profile.email || "");
        setSettingsPositions(data.profile.interested_positions || []);
        setSettingsFormats(data.profile.work_format || []);
      }
    } catch {}
  };

  const loadSavedJobs = async (t: string) => {
    try {
      const res = await fetch("/api/saved-jobs", { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setSavedJobs(data.jobs || []);
    } catch {}
  };

  const loadAlerts = async (t: string) => {
    try {
      const res = await fetch("/api/job-alerts", { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.alerts) {
        const a = data.alerts;
        setAlertPrefs(a);
        setAlertPositions(a.positions || []);
        setAlertLevels(a.levels || []);
        setAlertFormats(a.formats || []);
        setInstantEnabled(a.instant_enabled || false);
        setDigestEnabled(a.digest_enabled || false);
        setDigestFreq(a.digest_frequency || "daily");
      }
    } catch {}
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  const handleUnsaveJob = async (jobId: string) => {
    if (!token) return;
    await fetch(`/api/saved-jobs?job_id=${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSavedJobs(prev => prev.filter(j => j.job_id !== jobId));
  };

  // True when the user's input looks like a LinkedIn URL — triggers the manual-paste flow
  const isLinkedInUrl = /linkedin\.com/i.test(addJobInput);

  // Submit the Add Job modal: fetch+parse via Gemini, save to DB, prepend to list
  const handleAddExternalJob = async () => {
    if (!token) return;
    setAddJobLoading(true);
    setAddJobError(null);
    try {
      const body: Record<string, string> = { logo_color: addJobColor };
      const looksLikeUrl = addJobInput.startsWith("http");
      if (looksLikeUrl) {
        body.url = addJobInput;
        // For LinkedIn, the API skips fetching; it needs the user-pasted text
        if (isLinkedInUrl) body.text = addJobPastedText;
      } else {
        // Treat the input as raw job description text
        body.text = addJobInput;
      }
      const res = await fetch("/api/jobs/add-external", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add job");
      // Prepend the new job so it appears at the top of the Saved Jobs list
      setSavedJobs(prev => [data.job, ...prev]);
      setShowAddJobModal(false);
      setAddJobInput("");
      setAddJobPastedText("");
      setAddJobColor("#6366f1");
    } catch (e: any) {
      setAddJobError(e.message);
    } finally {
      setAddJobLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    const t = token || localStorage.getItem("jm_token");
    if (!t) return;
    setSaving(true); setSaveMsg("");
    try {
      console.log("TOKEN VALUE:", token, localStorage.getItem("jm_token"));
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          name: settingsName,
          interested_positions: settingsPositions,
          work_format: settingsFormats,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(`Error: ${data.error || res.status}`); return; }
      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e: any) { setSaveMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  const handleSaveAlerts = async () => {
    const t = token || localStorage.getItem("jm_token");
    if (!t) return;
    setSaving(true); setSaveMsg("");
    try {
      await fetch("/api/job-alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          positions: alertPositions,
          levels: alertLevels,
          formats: alertFormats,
          instant_enabled: instantEnabled,
          digest_enabled: digestEnabled,
          digest_frequency: digestFreq,
        }),
      });
      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch { setSaveMsg("Error saving"); }
    finally { setSaving(false); }
  };

  const toggleItem = (item: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

  const addPosition = (pos: string, list: string[], set: (v: string[]) => void, setInput: (v: string) => void) => {
    const trimmed = pos.trim();
    if (trimmed && !list.includes(trimmed)) set([...list, trimmed]);
    setInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  const resumeData = profile?.resume_profile;

  return (
    <>
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-xl font-bold">My Account</h1>
          </div>
          <button onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1.5 rounded-xl">
            Sign out
          </button>
        </div>

        {/* User badge */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-5 flex items-center gap-3 border border-gray-800">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {(profile?.name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{profile?.name || "—"}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          {resumeData && (
            <span className="ml-auto text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-1 rounded-lg">
              ✓ Resume uploaded
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-5 border border-gray-800">
          {TABS.map(tab => (
            <button key={tab} onClick={() => navigateToTab(tab)}
              className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "Overview" && (
          <div className="space-y-4">
            {/* Resume card */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Resume</h2>
              {resumeData ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{resumeData.name}</p>
                    <span className="text-xs text-gray-500">{profile?.resume_analyses_count || 0} analyses</span>
                  </div>
                  <p className="text-sm text-gray-400">{resumeData.title} · {resumeData.level}</p>
                  {resumeData.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {resumeData.skills.slice(0, 8).map((s: string) => (
                        <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                      {resumeData.skills.length > 8 && (
                        <span className="text-xs text-gray-500">+{resumeData.skills.length - 8} more</span>
                      )}
                    </div>
                  )}
                  {resumeData.experience && (
                    <p className="text-xs text-gray-500 mt-1">{resumeData.experience}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No resume uploaded yet</p>
                  <button onClick={() => router.push("/")}
                    className="text-sm text-blue-400 hover:text-blue-300">
                    Upload on main page →
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigateToTab("Saved Jobs")}
                className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center hover:border-blue-700 transition-colors">
                <p className="text-2xl font-bold text-blue-400">{savedJobs.length}</p>
                <p className="text-xs text-gray-400 mt-1">Saved Jobs</p>
              </button>
              <button onClick={() => navigateToTab("Job Alerts")}
                className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center hover:border-green-700 transition-colors">
                <p className="text-2xl font-bold text-green-400">
                  {instantEnabled || digestEnabled ? "On" : "Off"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Job Alerts</p>
              </button>
            </div>

            {/* Quick saved jobs preview */}
            {savedJobs.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300">Recent Saved</h2>
                  <button onClick={() => navigateToTab("Saved Jobs")}
                    className="text-xs text-blue-400 hover:text-blue-300">See all →</button>
                </div>
                <div className="space-y-2">
                  {savedJobs.slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-blue-400">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-white">Apply →</a>
                        <button onClick={() => handleUnsaveJob(job.job_id)}
                          className="text-red-400 hover:text-red-300 text-2xl leading-none">♥</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SAVED JOBS ── */}
        {activeTab === "Saved Jobs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "0 -1rem", padding: "0 1rem 1rem", background: "#EFF0F6" }}>

            {/* Button to open the Add Job from URL modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 0 0" }}>
              <button
                onClick={() => { setAddJobError(null); setShowAddJobModal(true); }}
                style={{
                  background: "#4558C8", color: "#fff", border: "none", borderRadius: 10,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                + Add Job from URL
              </button>
            </div>

            {savedJobs.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "2rem", textAlign: "center", border: "0.5px solid rgba(41,43,45,0.08)" }}>
                <p style={{ color: "rgba(41,43,45,0.4)", fontSize: 14, marginBottom: 12 }}>Сохранённых вакансий нет</p>
                <button onClick={() => router.push("/")}
                  style={{ color: "#4558C8", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
                  Найти вакансии →
                </button>
              </div>
            ) : (
              savedJobs.map(job => {
                const rd = profile?.resume_profile;
                const matchScore = rd
                  ? calculateMatchScore(rd, {
                      id: job.job_id, title: job.title, company: job.company,
                      location: job.location, salary: job.salary || "",
                      jobType: job.job_type, source: job.source,
                      postedDate: job.posted_date, applyUrl: job.apply_url,
                      description: job.description || "",
                    })
                  : undefined;
                return (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    isExpanded={expandedSavedJobId === job.job_id}
                    matchScore={matchScore}
                    onToggle={() => setExpandedSavedJobId(
                      expandedSavedJobId === job.job_id ? null : job.job_id
                    )}
                    onUnsave={() => handleUnsaveJob(job.job_id)}
                    onOpenCoverLetter={() => { setEditorJob(job); setEditorMode("cover-letter"); }}
                    onOpenResumeAdaptation={() => { setEditorJob(job); setEditorMode("resume-adapt"); }}
                  />
                );
              })
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "Settings" && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
              <h2 className="text-sm font-semibold text-gray-300">Personal Info</h2>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name</label>
                <input value={settingsName} onChange={e => setSettingsName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input value={user?.email || ""} disabled
                  className="w-full bg-gray-800/50 text-gray-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Interested Positions</label>
                <div className="flex gap-2 mb-2">
                  <input value={newPosition} onChange={e => setNewPosition(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addPosition(newPosition, settingsPositions, setSettingsPositions, setNewPosition)}
                    placeholder="e.g. Product Manager"
                    className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
                  <button onClick={() => addPosition(newPosition, settingsPositions, setSettingsPositions, setNewPosition)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 rounded-xl">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settingsPositions.map(pos => (
                    <span key={pos} className="flex items-center gap-1.5 text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                      {pos}
                      <button onClick={() => setSettingsPositions(settingsPositions.filter(p => p !== pos))}
                        className="text-gray-500 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Work Format</label>
                <div className="flex gap-2">
                  {FORMAT_OPTIONS.map(f => (
                    <button key={f} onClick={() => toggleItem(f, settingsFormats, setSettingsFormats)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        settingsFormats.includes(f) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300">Password</h2>
                <button onClick={() => setChangingPassword(!changingPassword)}
                  className="text-xs text-blue-400 hover:text-blue-300">
                  {changingPassword ? "Cancel" : "Change"}
                </button>
              </div>
              {changingPassword && (
                <div className="space-y-2">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
                  <button
                    onClick={async () => {
                      if (!token || newPassword.length < 6) { setPasswordMsg("Min 6 characters"); return; }
                      const { createClient } = await import("@supabase/supabase-js");
                      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
                      const { error } = await sb.auth.updateUser({ password: newPassword });
                      if (error) { setPasswordMsg(error.message); }
                      else { setPasswordMsg("Password updated ✓"); setNewPassword(""); setChangingPassword(false); }
                      setTimeout(() => setPasswordMsg(""), 3000);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-xl">
                    Update Password
                  </button>
                  {passwordMsg && <p className={`text-xs ${passwordMsg.includes("✓") ? "text-green-400" : "text-red-400"}`}>{passwordMsg}</p>}
                </div>
              )}
            </div>

            {/* Bookmarklet */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h2 className="text-sm font-semibold text-gray-300 mb-1">Save Jobs from Any Site</h2>
              <p className="text-xs text-gray-500 mb-4">
                Drag the button below to your bookmarks bar. Click it on any job posting to save it instantly.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={`javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title);window.open('${typeof window !== 'undefined' ? window.location.origin : ''}/import?url='+u+'&title='+t,'_blank');})();`}
                  onClick={e => e.preventDefault()}
                  draggable
                  style={{
                    display: "inline-block", background: "#4558C8", color: "#fff",
                    padding: "8px 16px", borderRadius: 10, fontSize: 13,
                    fontWeight: 600, textDecoration: "none", cursor: "grab",
                    userSelect: "none", border: "none",
                  }}
                >
                  📌 Save to JobMatch
                </a>
                <span className="text-xs text-gray-500">← drag this to your bookmarks bar</span>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Works on LinkedIn, Greenhouse, Lever, Indeed, Workday and any other job site.
              </p>
            </div>

            <button onClick={handleSaveSettings} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl">
              {saving ? "Saving..." : saveMsg || "Save Settings"}
            </button>
          </div>
        )}

        {/* ── JOB ALERTS ── */}
        {activeTab === "Job Alerts" && (
          <div className="space-y-4">
            {/* Positions */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Alert Positions</h2>
              <div className="flex gap-2 mb-2 relative">
                <div className="flex-1 relative">
                  <input
                    value={newAlertPosition}
                    onChange={e => {
                      const v = e.target.value;
                      setNewAlertPosition(v);
                      if (v.length > 1) {
                        const matches = POPULAR_POSITIONS.filter(p =>
                          p.toLowerCase().includes(v.toLowerCase())
                        ).slice(0, 6);
                        setAlertSuggestions(matches);
                        setShowAlertSuggestions(matches.length > 0);
                      } else {
                        setShowAlertSuggestions(false);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        setShowAlertSuggestions(false);
                        addPosition(newAlertPosition, alertPositions, setAlertPositions, setNewAlertPosition);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowAlertSuggestions(false), 150)}
                    placeholder="e.g. Motion Designer"
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
                  />
                  {showAlertSuggestions && (
                    <div className="absolute z-20 mt-1 w-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                      {alertSuggestions.map(s => (
                        <button key={s} onMouseDown={() => {
                          setNewAlertPosition(s);
                          setShowAlertSuggestions(false);
                        }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => {
                  setShowAlertSuggestions(false);
                  addPosition(newAlertPosition, alertPositions, setAlertPositions, setNewAlertPosition);
                }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 rounded-xl">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertPositions.map(pos => (
                  <span key={pos} className="flex items-center gap-1.5 text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    {pos}
                    <button onClick={() => setAlertPositions(alertPositions.filter(p => p !== pos))}
                      className="text-gray-500 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-xs text-gray-400 mb-1.5 block">Level</label>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map(l => (
                    <button key={l} onClick={() => toggleItem(l, alertLevels, setAlertLevels)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        alertLevels.includes(l) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-gray-400 mb-1.5 block">Format</label>
                <div className="flex gap-2">
                  {FORMAT_OPTIONS.map(f => (
                    <button key={f} onClick={() => toggleItem(f, alertFormats, setAlertFormats)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        alertFormats.includes(f) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant alerts */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold">Instant Job Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get fresh alerts within an hour of posting</p>
                </div>
                <button onClick={() => setInstantEnabled(!instantEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${instantEnabled ? "bg-blue-600" : "bg-gray-700"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${instantEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
              {instantEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-400">
                    <span className="text-blue-400 font-medium">Free Plan:</span> up to 1 alert/day ·{" "}
                    <span className="text-purple-400 font-medium">Turbo Plan:</span> unlimited
                  </p>
                </div>
              )}
            </div>

            {/* Digest alerts */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold">Digest Job Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Curated list delivered daily or weekly</p>
                </div>
                <button onClick={() => setDigestEnabled(!digestEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${digestEnabled ? "bg-blue-600" : "bg-gray-700"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${digestEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
              {digestEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <label className="text-xs text-gray-400 mb-2 block">Frequency</label>
                  <div className="flex gap-2">
                    {(["daily", "weekly"] as const).map(f => (
                      <button key={f} onClick={() => setDigestFreq(f)}
                        className={`px-4 py-2 rounded-xl text-xs capitalize transition-colors ${
                          digestFreq === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleSaveAlerts} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl">
              {saving ? "Saving..." : saveMsg || "Save Alert Preferences"}
            </button>
          </div>
        )}
      </div>
    </main>

    {editorMode === "cover-letter" && editorJob && token && (
      <CoverLetterEditor
        job={editorJob}
        resumeProfile={profile?.resume_profile ?? null}
        token={token}
        onBack={() => { setEditorMode(null); setEditorJob(null); }}
      />
    )}
    {editorMode === "resume-adapt" && editorJob && token && (
      <ResumeAdapterEditor
        job={editorJob}
        resumeProfile={profile?.resume_profile ?? null}
        token={token}
        onBack={() => { setEditorMode(null); setEditorJob(null); }}
      />
    )}

    {/* ── ADD JOB FROM URL MODAL ── */}
    {showAddJobModal && (
      <div
        onClick={e => { if (e.target === e.currentTarget) { setShowAddJobModal(false); setShowColorPalette(false); } }}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 16,
        }}
      >
        <div style={{
          background: "#fff", borderRadius: 16, padding: 24,
          width: "100%", maxWidth: 400,
        }}>
          {/* Title + subtitle */}
          <p style={{ fontSize: 18, fontWeight: 500, color: "#292B2D", margin: "0 0 4px" }}>Add Job</p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(41,43,45,0.5)", margin: "0 0 16px" }}>
            Paste a job URL or job description text
          </p>

          {/* Main textarea */}
          <textarea
            value={addJobInput}
            onChange={e => setAddJobInput(e.target.value)}
            placeholder="https://jobs.example.com/... or paste the full job description"
            rows={3}
            style={{
              width: "100%", fontSize: 13, fontWeight: 300,
              border: "0.5px solid rgba(41,43,45,0.2)", borderRadius: 10,
              padding: "10px 13px", outline: "none", resize: "none",
              fontFamily: "Inter, system-ui, sans-serif", color: "#292B2D",
              marginBottom: 16, boxSizing: "border-box",
            }}
          />

          {/* LinkedIn-specific paste area */}
          {isLinkedInUrl && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "#f59e0b", margin: "0 0 6px" }}>
                LinkedIn blocks automatic reading. Paste the job text here:
              </p>
              <textarea
                value={addJobPastedText}
                onChange={e => setAddJobPastedText(e.target.value)}
                placeholder="Open the LinkedIn job post → select all text → paste here"
                rows={4}
                style={{
                  width: "100%", fontSize: 13, fontWeight: 300, color: "#292B2D",
                  border: "0.5px solid rgba(245,158,11,0.4)", borderRadius: 10,
                  padding: "10px 13px", outline: "none", resize: "none",
                  fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Color row: label + gradient swatch + palette dots (single line) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(41,43,45,0.6)", whiteSpace: "nowrap", flexShrink: 0 }}>
              Logo color
            </span>
            <div
              onClick={() => setShowColorPalette(p => !p)}
              style={{
                width: 26, height: 26, borderRadius: 7, cursor: "pointer", flexShrink: 0,
                background: "conic-gradient(#EE5E37, #DFF37D, #4558C8, #D9B8F3, #22c55e, #EE5E37)",
                border: "1.5px solid rgba(41,43,45,0.15)",
              }}
            />
            {showColorPalette && (
              <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "nowrap" }}>
                {[
                  { c: "#4558C8" },
                  { c: "#EE5E37" },
                  { c: "#E05E8A" },
                  { c: "#DFF37D", border: "0.5px solid rgba(41,43,45,0.15)" },
                  { c: "#D9B8F3", border: "0.5px solid rgba(41,43,45,0.15)" },
                  { c: "#292B2D" },
                  { c: "#f59e0b" },
                  { c: "#22c55e" },
                ].map(({ c, border }) => (
                  <div
                    key={c}
                    onClick={() => setAddJobColor(c)}
                    style={{
                      width: 22, height: 22, borderRadius: 6, cursor: "pointer", flexShrink: 0,
                      background: c, border: addJobColor === c ? "2px solid #292B2D" : (border || "2px solid transparent"),
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {addJobError && (
            <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 12px" }}>{addJobError}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleAddExternalJob}
            disabled={addJobLoading || (!addJobInput.trim())}
            style={{
              width: "100%", background: addJobLoading ? "rgba(41,43,45,0.3)" : "#4558C8",
              color: "#fff", border: "none", borderRadius: 10,
              padding: 13, fontSize: 14, fontWeight: 500,
              cursor: addJobLoading ? "not-allowed" : "pointer",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {addJobLoading ? "Parsing & saving…" : "Add Job"}
          </button>
        </div>
      </div>
    )}
    </>
  );
}
