// Runs every configured iCIMS employer, one after another. Same shape as
// run-all-workday.js — adding an employer to lib/icims-employers.js is
// enough to have it scraped daily.

import { ICIMS_EMPLOYERS } from "../lib/icims-employers.js";
import { runIcimsEmployer } from "../lib/run-icims-employer.js";

let anyFailed = false;

for (const employer of ICIMS_EMPLOYERS) {
  const result = await runIcimsEmployer(employer);
  if (!result.ok) anyFailed = true;
}

if (anyFailed) {
  console.error("\nOne or more iCIMS employers failed this run — see data/scraper-health.json.");
}
