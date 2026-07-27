// Runs every configured Jobvite employer, one after another. Same shape as
// run-all-icims.js / run-all-oracle-recruiting.js / run-all-ultipro.js —
// adding an employer to lib/jobvite-employers.js is enough to have it
// scraped daily.

import { JOBVITE_EMPLOYERS } from "../lib/jobvite-employers.js";
import { runJobviteEmployer } from "../lib/run-jobvite-employer.js";

let anyFailed = false;

for (const employer of JOBVITE_EMPLOYERS) {
  const result = await runJobviteEmployer(employer);
  if (!result.ok) anyFailed = true;
}

if (anyFailed) {
  console.error("\nOne or more Jobvite employers failed this run — see data/scraper-health.json.");
}
