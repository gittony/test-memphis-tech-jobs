// A per-run "receipt": every configured employer's job count for this run,
// written to GitHub's own Job Summary so it's visible right on the Actions
// run page — no digging into data/scraper-health.json required. Built after
// getting City of Memphis's ATS wrong (a scraper that looked "healthy"
// because it consistently found 0 jobs, since Phase 8's health check only
// flags a *drop* from a previously-healthy count, never a persistent zero).
// This shows every count plainly so that kind of miss is visible to a human
// glancing at the run, not just to whichever investigation happened to catch
// it this time.

import { readFileSync, existsSync } from "node:fs";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HEALTH_PATH = fileURLToPath(new URL("../data/scraper-health.json", import.meta.url));
const BEFORE_PATH = process.env.SCRAPER_HEALTH_BEFORE_PATH;

const after = existsSync(HEALTH_PATH) ? JSON.parse(readFileSync(HEALTH_PATH, "utf8")) : [];
const before = BEFORE_PATH && existsSync(BEFORE_PATH) ? JSON.parse(readFileSync(BEFORE_PATH, "utf8")) : [];
const beforeByEmployer = new Map(before.map((e) => [e.employer, e]));

// "*-step" entries are Slice 7's step-level outcome records, not real
// employers — already surfaced via the "Scraper health alert" issue.
const employerRows = after
  .filter((e) => !e.employer.endsWith("-step"))
  .sort((a, b) => a.employer.localeCompare(b.employer))
  .map((e) => {
    const prev = beforeByEmployer.get(e.employer);
    const delta = prev ? e.jobCount - prev.jobCount : null;
    const deltaText = delta === null ? "—" : delta === 0 ? "no change" : delta > 0 ? `+${delta}` : `${delta}`;
    const flags = [];
    if (!e.ok) flags.push("**unhealthy**");
    if (e.jobCount === 0) flags.push("zero jobs found");
    return `| ${e.employer} | ${e.jobCount} | ${deltaText} | ${flags.join(", ") || "—"} |`;
  });

const lines = [
  "## Scraper run receipt",
  "",
  "| Employer | Jobs found | vs. last run | Flag |",
  "|---|---|---|---|",
  ...employerRows,
  "",
];

const summary = lines.join("\n") + "\n";

console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
