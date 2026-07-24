import { readFileSync, writeFileSync, existsSync } from "node:fs";

export function loadScraperHealth(path) {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8"));
}

export function recordScraperRun(path, entry) {
  const existing = loadScraperHealth(path);
  const byEmployer = new Map(existing.map((e) => [e.employer, e]));
  byEmployer.set(entry.employer, entry);
  const updated = [...byEmployer.values()].sort((a, b) => a.employer.localeCompare(b.employer));
  writeFileSync(path, JSON.stringify(updated, null, 2) + "\n");
  return updated;
}

// A scraper returning 0 results isn't inherently a failure — some employers
// genuinely have no open roles some days. It only counts as suspicious when
// the same employer previously had jobs and has now dropped to zero, which
// is much more likely to mean the scraper broke than that every posting
// vanished overnight.
export function classifyEmptyResult(previous, jobCount) {
  if (jobCount === 0 && previous?.ok && previous.jobCount > 0) {
    return {
      ok: false,
      error: `Returned 0 jobs, but the last successful run saw ${previous.jobCount} — likely a broken scraper, not a legitimately empty employer.`,
    };
  }
  return { ok: true };
}
