// Run a single NEOGOV employer by key, e.g.:
//   node scripts/run-neogov-employer.js cityofmemphis

import { NEOGOV_EMPLOYERS } from "../lib/neogov-employers.js";
import { runNeogovEmployer } from "../lib/run-neogov-employer.js";

const key = process.argv[2];
const employer = NEOGOV_EMPLOYERS.find((e) => e.key === key);

if (!employer) {
  console.error(`Usage: node scripts/run-neogov-employer.js <key>`);
  console.error(`Known keys: ${NEOGOV_EMPLOYERS.map((e) => e.key).join(", ")}`);
  process.exit(1);
}

const result = await runNeogovEmployer(employer);
if (!result.ok) process.exitCode = 1;
