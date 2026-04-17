"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; email: string };
type Profile = {
  id: string; name?: string; email?: string;
  resume_profile?: any; resume_analyses_count?: number;
  interested_positions?: string[]; work_format?: string[];
};
type SavedJob = {
  id: string; job_id: string; title: string; company: string;
  location: string; salary: string; job_type: string;
  source: string; posted_date: string; apply_url: string; created_at: string;
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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [alertPrefs, setAlertPrefs] = useState<AlertPrefs>({});
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
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

  useEffect(() => {
    const savedToken = localStorage.getItem("jm_token");
    const savedUser = localStorage.getItem("jm_user");
    if (!savedToken || !savedUser) { router.push("/"); return; }
    try {
      const u = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(u);
      loadAll(savedToken);
    } catch { router.push("/"); }
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

  const handleSignOut = () => {
    localStorage.removeItem("jm_token");
    localStorage.removeItem("jm_user");
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

  const handleSaveSettings = async () => {
    const t = token || localStorage.getItem("jm_token");
    if (!t) return;
    setSaving(true); setSaveMsg("");
    try {
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
            <button key={tab} onClick={() => setActiveTab(tab)}
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
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center">
                <p className="text-2xl font-bold text-blue-400">{savedJobs.length}</p>
                <p className="text-xs text-gray-400 mt-1">Saved Jobs</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {instantEnabled || digestEnabled ? "On" : "Off"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Job Alerts</p>
              </div>
            </div>

            {/* Quick saved jobs preview */}
            {savedJobs.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300">Recent Saved</h2>
                  <button onClick={() => setActiveTab("Saved Jobs")}
                    className="text-xs text-blue-400 hover:text-blue-300">See all →</button>
                </div>
                <div className="space-y-2">
                  {savedJobs.slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-blue-400">{job.company}</p>
                      </div>
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-white">Apply →</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SAVED JOBS ── */}
        {activeTab === "Saved Jobs" && (
          <div className="space-y-3">
            {savedJobs.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
                <p className="text-gray-500 text-sm mb-3">No saved jobs yet</p>
                <button onClick={() => router.push("/")}
                  className="text-blue-400 text-sm hover:text-blue-300">Browse jobs →</button>
              </div>
            ) : (
              savedJobs.map(job => (
                <div key={job.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                      <p className="text-blue-400 text-xs mt-0.5">{job.company}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.job_type && <span>· {job.job_type}</span>}
                        {job.salary && <span className="text-green-400">· {job.salary}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleUnsaveJob(job.job_id)}
                      className="text-red-400 hover:text-red-300 text-2xl leading-none shrink-0 mt-0.5">
                      ♥
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                    <span className="text-xs text-gray-500">{job.source} · {job.posted_date}</span>
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-xl">
                      Apply →
                    </a>
                  </div>
                </div>
              ))
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
              <div className="flex gap-2 mb-2">
                <input value={newAlertPosition} onChange={e => setNewAlertPosition(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPosition(newAlertPosition, alertPositions, setAlertPositions, setNewAlertPosition)}
                  placeholder="e.g. Motion Designer"
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm" />
                <button onClick={() => addPosition(newAlertPosition, alertPositions, setAlertPositions, setNewAlertPosition)}
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
  );
}
