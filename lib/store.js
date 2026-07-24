import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Fields that describe the posting itself, as opposed to our own bookkeeping
// (firstSeenAt/lastSeenAt). Used to detect whether a posting changed between runs.
const MUTABLE_FIELDS = ["title", "location", "url", "department", "postedOn"];

export function loadJobs(path) {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8"));
}

export function saveJobs(path, jobs) {
  const sorted = [...jobs].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(path, JSON.stringify(sorted, null, 2) + "\n");
}

function hasChanged(existing, fresh) {
  return MUTABLE_FIELDS.some((field) => existing[field] !== fresh[field]);
}

// Merges freshly-fetched postings into the existing stored set. Postings from
// `existing` that aren't present in `fresh` are left untouched — deciding when
// a missing posting should expire is Phase 6's job, not this one.
export function mergeJobs(existing, fresh, { now }) {
  const byId = new Map(existing.map((job) => [job.id, job]));
  const stats = { new: 0, updated: 0, unchanged: 0 };

  for (const freshJob of fresh) {
    const existingJob = byId.get(freshJob.id);

    if (!existingJob) {
      byId.set(freshJob.id, { ...freshJob, firstSeenAt: now, lastSeenAt: now });
      stats.new += 1;
      continue;
    }

    stats[hasChanged(existingJob, freshJob) ? "updated" : "unchanged"] += 1;
    byId.set(freshJob.id, {
      ...existingJob,
      ...freshJob,
      firstSeenAt: existingJob.firstSeenAt,
      lastSeenAt: now,
    });
  }

  return { jobs: [...byId.values()], stats };
}
