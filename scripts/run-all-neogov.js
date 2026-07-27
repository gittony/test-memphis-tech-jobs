// Runs every configured NEOGOV employer, one after another. Same shape as
// run-all-workday.js / run-all-icims.js / run-all-oracle-recruiting.js —
// adding an employer to lib/neogov-employers.js is enough to have it
// scraped daily.

import { NEOGOV_EMPLOYERS } from "../lib/neogov-employers.js";
import { runNeogovEmployer } from "../lib/run-neogov-employer.js";

let anyFailed = false;

for (const employer of NEOGOV_EMPLOYERS) {
  const result = await runNeogovEmployer(employer);
  if (!result.ok) anyFailed = true;
}

if (anyFailed) {
  console.error("\nOne or more NEOGOV employers failed this run — see data/scraper-health.json.");
}
