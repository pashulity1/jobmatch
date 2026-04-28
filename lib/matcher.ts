export type ResumeProfile = {
  name: string;
  title: string;
  level: string;
  years_experience: number;
  skills: string[];
  industries: string[];
  keywords: string[];
  summary: string;
};

export type Job = {
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

export function calculateMatchScore(profile: ResumeProfile, job: Job): number {
  if (!profile || !profile.keywords?.length) return 0;

  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const jobTitle = job.title.toLowerCase();
  const profileTitle = (profile.title || "").toLowerCase();
  const profileKeywords = profile.keywords.map((k) => k.toLowerCase());
  const profileSkills = profile.skills.map((s) => s.toLowerCase());

  // 1. Title match (40% weight)
  const LEVEL_WORDS = ["senior", "junior", "lead", "staff", "principal", "associate",
    "sr", "jr", "mid", "entry", "head", "chief", "vp", "director", "manager"];

  // Strip punctuation/special chars before splitting so "Motion Designer | 2D / 3D" parses cleanly
  const coreWords = (title: string) =>
    title.replace(/[|/\\&,()[\]]+/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !LEVEL_WORDS.includes(w));

  const profileCoreWords = coreWords(profileTitle);
  const jobCoreWords = coreWords(jobTitle);

  let titleScore = 0;
  if (profileCoreWords.length > 0 && jobCoreWords.length > 0) {
    const jobInProfile = jobCoreWords.filter(w =>
      profileCoreWords.some(pw => pw.includes(w) || w.includes(pw))
    ).length;
    const profileInJob = profileCoreWords.filter(w =>
      jobCoreWords.some(jw => jw.includes(w) || w.includes(jw))
    ).length;
    // Use the better direction: how much of the JOB is covered by the profile
    // (avoids penalizing a broad profile title when job title is narrower)
    const jobCoverage = jobInProfile / jobCoreWords.length;
    const profileCoverage = profileInJob / profileCoreWords.length;
    titleScore = Math.max(jobCoverage, profileCoverage);
  }

  // Boost if titles are very similar (e.g. profile "motion designer | ..." covers job "motion designer")
  const profileFirstPart = profileTitle.split(/[|,]/)[0].trim();
  if (
    jobTitle.includes(profileFirstPart) ||
    profileFirstPart.includes(jobTitle) ||
    jobTitle.includes(profileTitle) ||
    profileTitle.includes(jobTitle)
  ) {
    titleScore = Math.max(titleScore, 0.9);
  }

  // 2. Skills match (35% weight)
  let skillScore = 0;
  if (profileSkills.length > 0) {
    const matchedSkills = profileSkills.filter(skill => jobText.includes(skill));
    skillScore = Math.min(matchedSkills.length / Math.min(profileSkills.length, 10), 1);
  }

  // 3. Keywords match (25% weight)
  let keywordScore = 0;
  if (profileKeywords.length > 0) {
    const matchedKeywords = profileKeywords.filter(kw => jobText.includes(kw));
    keywordScore = Math.min(matchedKeywords.length / Math.min(profileKeywords.length, 20), 1);
  }

  // Level match bonus (+5%)
  let levelBonus = 0;
  const level = (profile.level || "").toLowerCase();
  if (
    (level.includes("senior") && jobTitle.includes("senior")) ||
    (level.includes("junior") && jobTitle.includes("junior")) ||
    (level.includes("lead") && (jobTitle.includes("lead") || jobTitle.includes("staff"))) ||
    (level.includes("manager") && jobTitle.includes("manager"))
  ) {
    levelBonus = 0.05;
  }

  const score = titleScore * 0.4 + skillScore * 0.35 + keywordScore * 0.25 + levelBonus;
  return Math.round(Math.min(score * 100, 99));
}

export function getMatchColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function getMatchLabel(score: number): string {
  if (score >= 70) return "Great match";
  if (score >= 40) return "Good match";
  return "Low match";
}
