// Run a single UltiPro employer by key, e.g.:
//   node scripts/run-ultipro-employer.js firsthorizon

import { ULTIPRO_EMPLOYERS } from "../lib/ultipro-employers.js";
import { runUltiproEmployer } from "../lib/run-ultipro-employer.js";

const key = process.argv[2];
const employer = ULTIPRO_EMPLOYERS.find((e) => e.key === key);

if (!employer) {
  console.error(`Usage: node scripts/run-ultipro-employer.js <key>`);
  console.error(`Known keys: ${ULTIPRO_EMPLOYERS.map((e) => e.key).join(", ")}`);
  process.exit(1);
}

const result = await runUltiproEmployer(employer);
if (!result.ok) process.exitCode = 1;
