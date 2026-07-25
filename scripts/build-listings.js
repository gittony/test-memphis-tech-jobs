// Ties Phases 3+4 together into the one thing Phase 5 actually needs: the
// final list of postings that should appear on the site. Rules resolve what
// they can (title/location match, then the Workday location-detail lookup);
// only what's left after that goes to Claude Haiku. Writes data/listings.json.

import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classify } from "../lib/filter.js";
import { resolveUncertainLocations } from "./resolve-locations.js";
import { classifyUncertainJob } from "../lib/ai-classify.js";
import { estimatePostedDate } from "../lib/posted-date.js";

const ENV_PATH = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(ENV_PATH)) process.loadEnvFile(ENV_PATH);

const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));
const LISTINGS_PATH = fileURLToPath(new URL("../data/listings.json", import.meta.url));
const AI_LOG_PATH = fileURLToPath(new URL("../data/ai-log.jsonl", import.meta.url));

const allJobs = JSON.parse(readFileSync(DATA_PATH, "utf8"));

// Expired postings (Phase 6: missing for 2+ consecutive runs) stay in
// data/jobs.json for the record but never make it onto the site.
const jobs = allJobs.filter((job) => job.status !== "expired");
console.log(`${allJobs.length - jobs.length} expired posting(s) excluded from consideration.`);

const listings = [];
const uncertain = [];

for (const job of jobs) {
  const { verdict } = classify(job);
  if (verdict === "pass") listings.push({ ...job, matchedVia: "rules" });
  if (verdict === "uncertain") uncertain.push(job);
}

console.log(`Rule-based filter: ${listings.length} pass outright, ${uncertain.length} uncertain.`);

const resolved = await resolveUncertainLocations(uncertain, { log: console.log });
for (const job of resolved.pass) {
  listings.push({ ...job, matchedVia: "rules+location-lookup" });
}
console.log(
  `Location lookup resolved ${resolved.pass.length + resolved.fail.length} of ${uncertain.length}; ` +
    `${resolved.stillUncertain.length} left for AI.`
);

let aiCostUsd = 0;
for (const job of resolved.stillUncertain) {
  const { result, usage, costUsd } = await classifyUncertainJob(job);
  aiCostUsd += costUsd;

  appendFileSync(
    AI_LOG_PATH,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      result,
      usage,
      costUsd,
    }) + "\n"
  );
  console.log(
    `- [${job.id}] ${job.title} -> ${result.locationVerdict} (confidence ${result.confidence}) — ${result.reason}`
  );

  if (result.locationVerdict === "pass") {
    listings.push({
      ...job,
      matchedVia: "ai",
      roleTags: result.roleTags,
      seniority: result.seniority,
      aiConfidence: result.confidence,
      aiReason: result.reason,
    });
  }
}

if (resolved.stillUncertain.length > 0) {
  console.log(`AI reviewed ${resolved.stillUncertain.length} posting(s), cost $${aiCostUsd.toFixed(4)}.`);
}

// Workday only gives us relative text ("Posted 11 Days Ago"); turn that into
// an actual calendar date for the site using the moment we scraped it.
for (const listing of listings) {
  const estimate = estimatePostedDate(listing.postedOn, listing.lastSeenAt);
  if (estimate) {
    listing.postedOnDate = estimate.date;
    listing.postedOnApprox = estimate.approx;
  }
}

listings.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(LISTINGS_PATH, JSON.stringify(listings, null, 2) + "\n");

console.log(`\n${listings.length} posting(s) written to data/listings.json.`);
