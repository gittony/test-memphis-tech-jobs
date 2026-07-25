// Run a single Workday employer by key, e.g.:
//   node scripts/run-workday-employer.js medtronic
// Mainly for local development — the daily pipeline uses run-all-workday.js
// so adding an employer to lib/workday-employers.js is the only step needed
// to pick it up automatically.

import { WORKDAY_EMPLOYERS } from "../lib/workday-employers.js";
import { runWorkdayEmployer } from "../lib/run-workday-employer.js";

const key = process.argv[2];
const employer = WORKDAY_EMPLOYERS.find((e) => e.key === key);

if (!employer) {
  console.error(`Usage: node scripts/run-workday-employer.js <key>`);
  console.error(`Known keys: ${WORKDAY_EMPLOYERS.map((e) => e.key).join(", ")}`);
  process.exit(1);
}

const result = await runWorkdayEmployer(employer);
if (!result.ok) process.exitCode = 1;
