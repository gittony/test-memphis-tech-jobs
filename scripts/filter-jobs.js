// Applies the Phase 3 rule-based filter to everything in data/jobs.json and
// prints a pass/fail/uncertain summary. Pass a bucket name as an argument to
// print its contents for manual review, e.g.:
//   node scripts/filter-jobs.js uncertain

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classify } from "../lib/filter.js";

const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));
const jobs = JSON.parse(readFileSync(DATA_PATH, "utf8"));

const buckets = { pass: [], fail: [], uncertain: [] };
for (const job of jobs) {
  const { verdict, reason } = classify(job);
  buckets[verdict].push({ ...job, verdictReason: reason });
}

console.log(
  `${buckets.pass.length} pass / ${buckets.fail.length} fail / ${buckets.uncertain.length} uncertain ` +
    `(of ${jobs.length} total)`
);

const requestedBucket = process.argv[2];
if (requestedBucket) {
  if (!buckets[requestedBucket]) {
    console.error(`Unknown bucket "${requestedBucket}". Use one of: pass, fail, uncertain.`);
    process.exit(1);
  }
  console.log(`\n--- ${requestedBucket} (${buckets[requestedBucket].length}) ---`);
  for (const job of buckets[requestedBucket]) {
    console.log(`- [${job.verdictReason ?? "-"}] ${job.title} | ${job.location}`);
  }
}
