// Run a single iCIMS employer by key, e.g.:
//   node scripts/run-icims-employer.js mscs-central

import { ICIMS_EMPLOYERS } from "../lib/icims-employers.js";
import { runIcimsEmployer } from "../lib/run-icims-employer.js";

const key = process.argv[2];
const employer = ICIMS_EMPLOYERS.find((e) => e.key === key);

if (!employer) {
  console.error(`Usage: node scripts/run-icims-employer.js <key>`);
  console.error(`Known keys: ${ICIMS_EMPLOYERS.map((e) => e.key).join(", ")}`);
  process.exit(1);
}

const result = await runIcimsEmployer(employer);
if (!result.ok) process.exitCode = 1;
