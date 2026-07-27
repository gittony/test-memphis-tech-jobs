// Shared "scrape one Jobvite employer" logic — mirrors
// lib/run-icims-employer.js / lib/run-oracle-recruiting-employer.js /
// lib/run-ultipro-employer.js. Never throws; a failure is recorded to
// data/scraper-health.json and returned as { ok: false }.

import { fileURLToPath } from "node:url";
import { fetchJobviteJobs } from "./jobvite.js";
import { loadJobs, saveJobs, mergeJobs } from "./store.js";
import { loadScraperHealth, recordScraperRun, classifyEmptyResult } from "./scraper-health.js";

const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));
const HEALTH_PATH = fileURLToPath(new URL("../data/scraper-health.json", import.meta.url));

export async function runJobviteEmployer(employer) {
  const now = new Date().toISOString();
  const previous = loadScraperHealth(HEALTH_PATH).find((h) => h.employer === employer.key);

  try {
    const { jobs: fresh } = await fetchJobviteJobs(employer);
    const existing = loadJobs(DATA_PATH);
    const { jobs, stats } = mergeJobs(existing, fresh, {
      now,
      scope: (job) => job.company === employer.company,
    });
    saveJobs(DATA_PATH, jobs);

    const verdict = classifyEmptyResult(previous, fresh.length);
    recordScraperRun(HEALTH_PATH, { employer: employer.key, jobCount: fresh.length, ranAt: now, ...verdict });

    console.log(
      `${employer.company}: ${stats.new} new, ${stats.updated} updated, ${stats.unchanged} unchanged. ` +
        `Total stored in data/jobs.json: ${jobs.length}.`
    );
    if (!verdict.ok) console.error(`${employer.company} scraper health warning: ${verdict.error}`);
    return { ok: true };
  } catch (err) {
    recordScraperRun(HEALTH_PATH, { employer: employer.key, jobCount: 0, ranAt: now, ok: false, error: err.message });
    console.error(`${employer.company} scraper failed: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
