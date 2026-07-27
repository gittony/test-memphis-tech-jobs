// Run a single Jobvite employer by key, e.g.:
//   node scripts/run-jobvite-employer.js buckman

import { JOBVITE_EMPLOYERS } from "../lib/jobvite-employers.js";
import { runJobviteEmployer } from "../lib/run-jobvite-employer.js";

const key = process.argv[2];
const employer = JOBVITE_EMPLOYERS.find((e) => e.key === key);

if (!employer) {
  console.error(`Usage: node scripts/run-jobvite-employer.js <key>`);
  console.error(`Known keys: ${JOBVITE_EMPLOYERS.map((e) => e.key).join(", ")}`);
  process.exit(1);
}

const result = await runJobviteEmployer(employer);
if (!result.ok) process.exitCode = 1;
