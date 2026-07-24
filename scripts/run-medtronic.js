import { fileURLToPath } from "node:url";
import { fetchMedtronicJobs } from "./fetch-medtronic.js";
import { loadJobs, saveJobs, mergeJobs } from "../lib/store.js";
import { loadScraperHealth, recordScraperRun, classifyEmptyResult } from "../lib/scraper-health.js";

const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));
const HEALTH_PATH = fileURLToPath(new URL("../data/scraper-health.json", import.meta.url));
const EMPLOYER = "medtronic";

const now = new Date().toISOString();
const previous = loadScraperHealth(HEALTH_PATH).find((h) => h.employer === EMPLOYER);

try {
  const { jobs: fresh } = await fetchMedtronicJobs();
  const existing = loadJobs(DATA_PATH);
  const { jobs, stats } = mergeJobs(existing, fresh, { now });
  saveJobs(DATA_PATH, jobs);

  const verdict = classifyEmptyResult(previous, fresh.length);
  recordScraperRun(HEALTH_PATH, { employer: EMPLOYER, jobCount: fresh.length, ranAt: now, ...verdict });

  console.log(
    `Medtronic: ${stats.new} new, ${stats.updated} updated, ${stats.unchanged} unchanged. ` +
      `Total stored in data/jobs.json: ${jobs.length}.`
  );
  if (!verdict.ok) console.error(`Medtronic scraper health warning: ${verdict.error}`);
} catch (err) {
  recordScraperRun(HEALTH_PATH, { employer: EMPLOYER, jobCount: 0, ranAt: now, ok: false, error: err.message });
  console.error(`Medtronic scraper failed: ${err.message}`);
  process.exitCode = 1;
}
