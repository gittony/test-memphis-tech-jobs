// Run a single Oracle Recruiting Cloud employer by key, e.g.:
//   node scripts/run-oracle-recruiting-employer.js hilton

import { ORACLE_RECRUITING_EMPLOYERS } from "../lib/oracle-recruiting-employers.js";
import { runOracleRecruitingEmployer } from "../lib/run-oracle-recruiting-employer.js";

const key = process.argv[2];
const employer = ORACLE_RECRUITING_EMPLOYERS.find((e) => e.key === key);

if (!employer) {
  console.error(`Usage: node scripts/run-oracle-recruiting-employer.js <key>`);
  console.error(`Known keys: ${ORACLE_RECRUITING_EMPLOYERS.map((e) => e.key).join(", ")}`);
  process.exit(1);
}

const result = await runOracleRecruitingEmployer(employer);
if (!result.ok) process.exitCode = 1;
