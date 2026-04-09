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
  const profileKeywords = profile.keywords.map((k) => k.toLowerCase());
  const profileSkills = profile.skills.map((s) => s.toLowerCase());

  // 1. Title match (40% weight)
  let titleScore = 0;
  const profileTitle = profile.title.toLowerCase();
  const jobTitle = job.title.toLowerCase();

  // Exact title match
  if (jobTitle.includes(profileTitle) || profileTitle.includes(jobTitle)) {
    titleScore = 1;
  } else {
    // Partial title match - check individual words
    const titleWords = profileTitle.split(/\s+/).filter((w) => w.length > 2);
    const matchedTitleWords = titleWords.filter((w) => jobTitle.includes(w));
    titleScore = titleWords.length > 0 ? matchedTitleWords.length / titleWords.length : 0;
  }

  // 2. Skills match (35% weight)
  let skillScore = 0;
  if (profileSkills.length > 0) {
    const matchedSkills = profileSkills.filter((skill) => jobText.includes(skill));
    skillScore = matchedSkills.length / Math.min(profileSkills.length, 10);
    skillScore = Math.min(skillScore, 1);
  }

  // 3. Keywords match (25% weight)
  let keywordScore = 0;
  if (profileKeywords.length > 0) {
    const matchedKeywords = profileKeywords.filter((kw) => jobText.includes(kw));
    keywordScore = matchedKeywords.length / Math.min(profileKeywords.length, 20);
    keywordScore = Math.min(keywordScore, 1);
  }

  // Level match bonus
  let levelBonus = 0;
  const level = profile.level?.toLowerCase() || "";
  const jobLower = job.title.toLowerCase();
  if (
    (level.includes("senior") && jobLower.includes("senior")) ||
    (level.includes("junior") && jobLower.includes("junior")) ||
    (level.includes("lead") && jobLower.includes("lead")) ||
    (level.includes("manager") && jobLower.includes("manager")) ||
    (level.includes("director") && jobLower.includes("director"))
  ) {
    levelBonus = 0.05;
  }

  // Calculate final score
  const score = titleScore * 0.4 + skillScore * 0.35 + keywordScore * 0.25 + levelBonus;

  // Convert to percentage (0-100)
  return Math.round(Math.min(score * 100, 99));
}

export function getMatchColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green
  if (score >= 40) return "#f59e0b"; // yellow
  return "#ef4444"; // red
}

export function getMatchLabel(score: number): string {
  if (score >= 70) return "Great match";
  if (score >= 40) return "Good match";
  return "Low match";
}
