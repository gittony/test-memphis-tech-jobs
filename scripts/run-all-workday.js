// Runs every configured Workday employer, one after another. This is the
// step the daily pipeline calls — adding an employer to
// lib/workday-employers.js is enough to have it scraped daily, with no
// change needed here or in the GitHub Actions workflow.

import { WORKDAY_EMPLOYERS } from "../lib/workday-employers.js";
import { runWorkdayEmployer } from "../lib/run-workday-employer.js";

let anyFailed = false;

for (const employer of WORKDAY_EMPLOYERS) {
  const result = await runWorkdayEmployer(employer);
  if (!result.ok) anyFailed = true;
}

if (anyFailed) {
  console.error("\nOne or more Workday employers failed this run — see data/scraper-health.json.");
}
