// Runs every configured Oracle Recruiting Cloud employer, one after another.
// Same shape as run-all-workday.js / run-all-icims.js — adding an employer
// to lib/oracle-recruiting-employers.js is enough to have it scraped daily.

import { ORACLE_RECRUITING_EMPLOYERS } from "../lib/oracle-recruiting-employers.js";
import { runOracleRecruitingEmployer } from "../lib/run-oracle-recruiting-employer.js";

let anyFailed = false;

for (const employer of ORACLE_RECRUITING_EMPLOYERS) {
  const result = await runOracleRecruitingEmployer(employer);
  if (!result.ok) anyFailed = true;
}

if (anyFailed) {
  console.error("\nOne or more Oracle Recruiting Cloud employers failed this run — see data/scraper-health.json.");
}
