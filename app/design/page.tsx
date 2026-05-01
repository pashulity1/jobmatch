import JobCard, { Job } from "@/app/components/jobs/JobCard";

type SampleJob = Job & { matchScore?: number };

const SAMPLE_JOBS: SampleJob[] = [
  {
    id: "1",
    title: "Senior Product Designer",
    company: "Linear",
    companyDomain: "linear.app",
    location: "San Francisco, CA",
    salary: "$140–180K",
    type: "Full-time",
    level: "Senior",
    workMode: "Remote",
    isNew: true,
    matchScore: 87,
    postedAt: "3 ч. назад",
    source: "LinkedIn",
    description:
      "We're looking for a Senior Product Designer to shape the future of how software teams work. You'll own end-to-end design of core product areas — from early exploration through to shipped features — and collaborate closely with engineers and PMs to build something people love. We care deeply about craft, simplicity, and shipping fast.",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Interaction Design"],
    applyUrl: "#",
  },
  {
    id: "2",
    title: "Staff Software Engineer",
    company: "Vercel",
    companyDomain: "vercel.com",
    location: "Remote",
    salary: "$200–240K",
    type: "Full-time",
    level: "Staff",
    workMode: "Remote",
    isNew: false,
    matchScore: 72,
    postedAt: "1 д. назад",
    source: "Adzuna",
    description:
      "Join Vercel's infrastructure team to build the systems that power millions of deployments every day. You'll work on distributed systems, edge networks, and developer tooling at scale. We move fast, ship continuously, and operate a platform that developers worldwide depend on.",
    skills: ["TypeScript", "Rust", "Distributed Systems", "Edge Computing", "Node.js"],
    applyUrl: "#",
  },
  {
    id: "3",
    title: "Motion Designer",
    company: "Acme Corp",
    location: "New York, NY",
    salary: "$90–120K",
    type: "Full-time",
    level: "Mid",
    workMode: "Hybrid",
    isNew: false,
    matchScore: 45,
    postedAt: "5 д. назад",
    source: "RemoteOK",
    description:
      "We're seeking a talented Motion Designer to join our creative team. You'll produce animations, motion graphics, and video content for our brand and product launches. Strong After Effects and Cinema 4D skills required.",
    skills: ["After Effects", "Cinema 4D", "Figma", "Premiere Pro"],
    applyUrl: "#",
  },
];

export default function DesignPage() {
  return (
    <main className="min-h-screen bg-[#EFF0F6] p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[48px] font-medium text-[#292B2D] leading-tight">JobMatch</h1>
          <p className="text-[16px] font-light text-[rgba(41,43,45,0.55)] mt-1">Design system · Job card preview</p>
        </div>

        <div className="space-y-3">
          {SAMPLE_JOBS.map(({ matchScore, ...job }) => (
            <JobCard key={job.id} job={job} matchScore={matchScore} />
          ))}
        </div>
      </div>
    </main>
  );
}
