import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Fields that describe the posting itself, as opposed to our own bookkeeping
// (firstSeenAt/lastSeenAt/status/missingRuns). Used to detect whether a
// posting changed between runs.
const MUTABLE_FIELDS = ["title", "location", "url", "department", "postedOn", "description"];

// A posting missing from a scrape doesn't expire immediately — one failed
// or flaky run shouldn't wipe out an employer's whole listing set. It only
// flips to "expired" after being absent this many consecutive runs.
const EXPIRE_AFTER_MISSED_RUNS = 2;

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

// Merges freshly-fetched postings into the existing stored set. Postings
// present in `fresh` are (re)activated; postings missing from `fresh` accrue
// a missed-run count and expire once that count reaches the grace period.
//
// `scope` identifies which existing jobs this run is even responsible for.
// data/jobs.json holds every employer's postings in one file, but each run
// only fetches one employer at a time — without `scope`, every other
// employer's jobs would look "missing" on a run that never touched them,
// and would wrongly expire after two unrelated employers' runs. Defaults to
// "everything," which is only correct when there's a single employer total.
export function mergeJobs(existing, fresh, { now, scope = () => true }) {
  const byId = new Map(existing.map((job) => [job.id, job]));
  const freshIds = new Set(fresh.map((job) => job.id));
  const stats = { new: 0, updated: 0, unchanged: 0, expired: 0, reactivated: 0 };

  for (const freshJob of fresh) {
    const existingJob = byId.get(freshJob.id);

    if (!existingJob) {
      byId.set(freshJob.id, {
        ...freshJob,
        firstSeenAt: now,
        lastSeenAt: now,
        status: "active",
        missingRuns: 0,
      });
      stats.new += 1;
      continue;
    }

    if (existingJob.status === "expired") stats.reactivated += 1;
    stats[hasChanged(existingJob, freshJob) ? "updated" : "unchanged"] += 1;

    byId.set(freshJob.id, {
      ...existingJob,
      ...freshJob,
      firstSeenAt: existingJob.firstSeenAt,
      lastSeenAt: now,
      status: "active",
      missingRuns: 0,
    });
  }

  for (const [id, job] of byId) {
    if (freshIds.has(id) || job.status === "expired") continue;
    if (!scope(job)) continue; // belongs to a different employer's scraper, not this run

    const missingRuns = (job.missingRuns ?? 0) + 1;
    const status = missingRuns >= EXPIRE_AFTER_MISSED_RUNS ? "expired" : job.status ?? "active";
    if (status === "expired") stats.expired += 1;
    byId.set(id, { ...job, missingRuns, status });
  }

  return { jobs: [...byId.values()], stats };
}
