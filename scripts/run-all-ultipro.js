// Runs every configured UltiPro employer, one after another. Same shape as
// run-all-workday.js / run-all-icims.js / run-all-oracle-recruiting.js —
// adding an employer to lib/ultipro-employers.js is enough to have it
// scraped daily.

import { ULTIPRO_EMPLOYERS } from "../lib/ultipro-employers.js";
import { runUltiproEmployer } from "../lib/run-ultipro-employer.js";

let anyFailed = false;

for (const employer of ULTIPRO_EMPLOYERS) {
  const result = await runUltiproEmployer(employer);
  if (!result.ok) anyFailed = true;
}

if (anyFailed) {
  console.error("\nOne or more UltiPro employers failed this run — see data/scraper-health.json.");
}
