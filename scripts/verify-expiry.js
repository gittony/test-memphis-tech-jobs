// Phase 6 verification: simulates a posting disappearing from a scrape and
// checks it survives one missed run before expiring on the second, then
// reactivates cleanly if it comes back. Doesn't touch real data/jobs.json —
// this is a synthetic run against in-memory fixtures.

import { mergeJobs } from "../lib/store.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok - ${message}`);
  }
}

const jobA = { id: "test:a", title: "Software Engineer", location: "Memphis, Tennessee", url: "https://example.com/a" };
const jobB = { id: "test:b", title: "Data Analyst", location: "Memphis, Tennessee", url: "https://example.com/b" };

// Run 1: both postings present.
let state = mergeJobs([], [jobA, jobB], { now: "2026-01-01T00:00:00.000Z" });
let b = state.jobs.find((j) => j.id === "test:b");
assert(b.status === "active" && b.missingRuns === 0, "run 1: new posting starts active with 0 missed runs");

// Run 2: jobB disappears from the scrape (jobA still present).
state = mergeJobs(state.jobs, [jobA], { now: "2026-01-02T00:00:00.000Z" });
b = state.jobs.find((j) => j.id === "test:b");
assert(b.status === "active" && b.missingRuns === 1, "run 2: missing once still counts as active (grace period)");

// Run 3: jobB is missing again, second consecutive miss.
state = mergeJobs(state.jobs, [jobA], { now: "2026-01-03T00:00:00.000Z" });
b = state.jobs.find((j) => j.id === "test:b");
assert(b.status === "expired" && b.missingRuns === 2, "run 3: missing twice in a row flips to expired");
assert(state.stats.expired === 1, "run 3: stats.expired reports the transition");

// Run 4: jobB reappears — should reactivate cleanly, not stay expired.
state = mergeJobs(state.jobs, [jobA, jobB], { now: "2026-01-04T00:00:00.000Z" });
b = state.jobs.find((j) => j.id === "test:b");
assert(b.status === "active" && b.missingRuns === 0, "run 4: reappearing resets status and missed-run count");
assert(state.stats.reactivated === 1, "run 4: stats.reactivated reports the transition");

// Phase 9 regression check: once multiple employers each run their own
// scraper against the same shared data/jobs.json, a run for employer A must
// not treat employer B's postings as "missing" just because A's fresh batch
// doesn't mention them. `scope` is what prevents that cross-contamination.
const jobC = { id: "test:c", title: "Data Analyst", location: "Memphis, Tennessee", url: "https://example.com/c", company: "Acme Co" };
const jobD = { id: "test:d", title: "Data Analyst", location: "Memphis, Tennessee", url: "https://example.com/d", company: "Other Co" };

state = mergeJobs([], [jobC, jobD], { now: "2026-02-01T00:00:00.000Z" });

// Acme Co's scraper runs again; Other Co's scraper isn't part of this run at
// all, so jobD must be left untouched, not accrue a missed run.
state = mergeJobs(state.jobs, [jobC], {
  now: "2026-02-02T00:00:00.000Z",
  scope: (job) => job.company === "Acme Co",
});
const d = state.jobs.find((j) => j.id === "test:d");
assert(d.status === "active" && d.missingRuns === 0, "scoped merge: an employer's run doesn't touch another employer's postings");

if (process.exitCode === 1) {
  console.error("\nExpiry logic verification FAILED.");
} else {
  console.log("\nAll expiry logic checks passed.");
}
