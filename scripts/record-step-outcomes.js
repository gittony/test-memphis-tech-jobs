// A step that hangs (like the Workday incident that motivated the
// timeout-minutes caps in daily-pipeline.yml) gets killed by GitHub Actions
// before the scraper script itself ever gets a chance to write anything to
// data/scraper-health.json — so from that file's perspective, a timed-out
// step and an ordinary healthy day can look identical. Run right after the
// four fetch steps, this records each step's own outcome (passed in from the
// workflow, since only the workflow knows if a step was killed) as its own
// scraper-health entry, so a timeout feeds the same "Scraper health alert"
// GitHub Issue that per-employer failures already do, instead of going
// unseen until someone happens to check the Actions tab.

import { fileURLToPath } from "node:url";
import { recordScraperRun } from "../lib/scraper-health.js";

const HEALTH_PATH = fileURLToPath(new URL("../data/scraper-health.json", import.meta.url));

const STEPS = [
  { key: "workday-step", label: "Workday (entire step)", outcome: process.env.FETCH_WORKDAY_OUTCOME },
  { key: "icims-step", label: "iCIMS (entire step)", outcome: process.env.FETCH_ICIMS_OUTCOME },
  { key: "oracle-recruiting-step", label: "Oracle Recruiting Cloud (entire step)", outcome: process.env.FETCH_ORACLE_OUTCOME },
  { key: "ultipro-step", label: "UltiPro (entire step)", outcome: process.env.FETCH_ULTIPRO_OUTCOME },
  { key: "neogov-step", label: "NEOGOV (entire step)", outcome: process.env.FETCH_NEOGOV_OUTCOME },
];

const now = new Date().toISOString();

for (const step of STEPS) {
  const ok = step.outcome === "success";
  recordScraperRun(HEALTH_PATH, {
    employer: step.key,
    jobCount: 0,
    ranAt: now,
    ok,
    ...(ok
      ? {}
      : { error: `Step "${step.label}" did not complete successfully (outcome: ${step.outcome ?? "unknown"}) — likely timed out or crashed before finishing.` }),
  });
  console.log(`${step.label}: outcome=${step.outcome ?? "unknown"} -> recorded as ${ok ? "healthy" : "unhealthy"}.`);
}
