"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ImportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url") || "";
  const title = searchParams.get("title") || "";
  const isLinkedIn = /linkedin\.com/i.test(url);

  const [status, setStatus] = useState<"checking" | "saving" | "needText" | "done" | "error">("checking");
  const [error, setError] = useState("");
  const [linkedInText, setLinkedInText] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setStatus("error");
      setError("No URL provided. Open a job posting page and click the bookmarklet.");
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const next = `/import?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        router.push(`/auth?next=${encodeURIComponent(next)}`);
        return;
      }
      setToken(session.access_token);
      if (isLinkedIn) {
        setStatus("needText");
      } else {
        saveJob(session.access_token, "");
      }
    });
  }, []);

  const saveJob = async (tok: string, text: string) => {
    setStatus("saving");
    try {
      const body: Record<string, string> = { url };
      if (text) body.text = text;
      const res = await fetch("/api/jobs/add-external", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save job");
      setStatus("done");
      setTimeout(() => router.push("/dashboard?tab=saved-jobs"), 1800);
    } catch (e: any) {
      setStatus("error");
      setError(e.message);
    }
  };

  const hostname = url ? (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } })() : "";

  return (
    <div style={{
      minHeight: "100vh", background: "#09090b",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#111113", border: "1px solid #27272a",
        borderRadius: 20, padding: 32, width: "100%", maxWidth: 420, textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>
          {status === "done" ? "✓" : status === "error" ? "✕" : "⟳"}
        </div>

        {status === "checking" && (
          <>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Connecting...</p>
            <p style={{ color: "#71717a", fontSize: 13 }}>Checking your session</p>
          </>
        )}

        {status === "saving" && (
          <>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Saving job...</p>
            <p style={{ color: "#71717a", fontSize: 13 }}>Reading and parsing {hostname}</p>
          </>
        )}

        {status === "done" && (
          <>
            <p style={{ color: "#4ade80", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Job saved!</p>
            <p style={{ color: "#71717a", fontSize: 13 }}>Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <p style={{ color: "#f87171", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Could not save</p>
            <p style={{ color: "#71717a", fontSize: 13, marginBottom: 20 }}>{error}</p>
            <button
              onClick={() => router.push("/dashboard?tab=saved-jobs")}
              style={{
                background: "#4558C8", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 20px", fontSize: 13,
                fontWeight: 500, cursor: "pointer",
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === "needText" && (
          <>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>LinkedIn job</p>
            <p style={{ color: "#f59e0b", fontSize: 13, marginBottom: 16 }}>
              LinkedIn blocks automatic reading. Open the job post, select all text (Ctrl+A), and paste it below.
            </p>
            <textarea
              value={linkedInText}
              onChange={e => setLinkedInText(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              style={{
                width: "100%", background: "#1c1c1e", color: "#fff",
                border: "1px solid #3f3f46", borderRadius: 10,
                padding: "10px 12px", fontSize: 13, outline: "none",
                resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
                marginBottom: 12,
              }}
            />
            <button
              onClick={() => token && saveJob(token, linkedInText)}
              disabled={!linkedInText.trim()}
              style={{
                width: "100%", background: linkedInText.trim() ? "#4558C8" : "#27272a",
                color: linkedInText.trim() ? "#fff" : "#52525b",
                border: "none", borderRadius: 10, padding: "12px",
                fontSize: 14, fontWeight: 500,
                cursor: linkedInText.trim() ? "pointer" : "not-allowed",
              }}
            >
              Save Job
            </button>
          </>
        )}

        {url && status !== "error" && (
          <p style={{ color: "#3f3f46", fontSize: 11, marginTop: 20, wordBreak: "break-all" }}>
            {hostname}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense>
      <ImportContent />
    </Suspense>
  );
}
