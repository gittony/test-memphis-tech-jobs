// Ties Phases 3+4 together into the one thing Phase 5 actually needs: the
// final list of postings that should appear on the site. Rules resolve what
// they can (title/location match, then the Workday location-detail lookup);
// only what's left after that goes to Claude Haiku. Writes data/listings.json.
//
// Slice 11: "uncertain" now has two independent causes — an ambiguous
// location (unchanged from before) or an ambiguous title (new). Workday's
// location-detail lookup only makes sense for the location kind, so a job
// that's uncertain purely because of its title (location already a
// confirmed match) skips straight to AI instead. Whichever dimension the
// rules already resolved stays resolved — the AI's opinion on it is never
// asked for, only its opinion on whatever was actually uncertain.
//
// Title-uncertain jobs also get their real description fetched first: a
// company's own department label can be actively misleading for judging
// role relevance (confirmed live — Buckman genuinely files a real "Digital
// Innovation Engineer" software role under "Marketing," not "Digital"), so
// the AI needs actual duties/requirements text to make a good call, not
// just a title and a department string.

import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classify } from "../lib/filter.js";
import { resolveUncertainLocations } from "./resolve-locations.js";
import { classifyUncertainJob } from "../lib/ai-classify.js";
import { estimatePostedDate } from "../lib/posted-date.js";
import { fetchJobDescription, DESCRIPTION_REQUIRES_FETCH } from "../lib/fetch-description.js";
import { toPlainTextExcerpt } from "../lib/sanitize-description.js";

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
const needsLocationLookup = []; // location itself is ambiguous — try Workday's detail fetch first
const titleOnlyUncertain = []; // location already confirmed; only the title needs AI

for (const job of jobs) {
  const c = classify(job);
  if (c.verdict === "pass") {
    listings.push({ ...job, matchedVia: "rules" });
    continue;
  }
  if (c.verdict !== "uncertain") continue; // fail

  const annotated = { ...job, titleVerdict: c.titleVerdict, locationVerdict: c.locationVerdict };
  if (c.locationVerdict === "uncertain") {
    needsLocationLookup.push(annotated);
  } else {
    titleOnlyUncertain.push(annotated);
  }
}

const totalUncertain = needsLocationLookup.length + titleOnlyUncertain.length;
console.log(
  `Rule-based filter: ${listings.length} pass outright, ${totalUncertain} uncertain ` +
    `(${needsLocationLookup.length} location, ${titleOnlyUncertain.length} title only).`
);

const resolved = await resolveUncertainLocations(needsLocationLookup, { log: console.log });
for (const job of resolved.pass) {
  // Location's confirmed now — if the title was also uncertain it still
  // needs AI's opinion on that; otherwise it's a real pass.
  if (job.titleVerdict === "uncertain") {
    titleOnlyUncertain.push({ ...job, locationVerdict: "pass" });
  } else {
    listings.push({ ...job, matchedVia: "rules+location-lookup" });
  }
}
console.log(
  `Location lookup resolved ${resolved.pass.length + resolved.fail.length} of ${needsLocationLookup.length}; ` +
    `${resolved.stillUncertain.length} still need AI for location.`
);

const needsAi = [...resolved.stillUncertain, ...titleOnlyUncertain];

let aiCostUsd = 0;
for (const job of needsAi) {
  let jobForAi = job;
  if (job.titleVerdict === "uncertain") {
    const raw = await fetchJobDescription(job, { log: console.log });
    jobForAi = { ...job, descriptionExcerpt: raw ? toPlainTextExcerpt(raw.text, { isPlainText: raw.isPlainText }) : null };
    if (DESCRIPTION_REQUIRES_FETCH.has(job.sourceAts)) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  const { result, usage, costUsd } = await classifyUncertainJob(jobForAi);
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
    `- [${job.id}] ${job.title} -> role:${result.roleVerdict} location:${result.locationVerdict} ` +
      `(confidence ${result.confidence}) — ${result.reason}`
  );

  // Trust the AI only for whichever dimension the rules didn't already
  // resolve — a title or location the rules confirmed stays confirmed
  // regardless of what the AI independently says about it here.
  const roleOk = job.titleVerdict === "pass" || result.roleVerdict === "pass";
  const locationOk = job.locationVerdict === "pass" || result.locationVerdict === "pass";

  if (roleOk && locationOk) {
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

if (needsAi.length > 0) {
  console.log(`AI reviewed ${needsAi.length} posting(s), cost $${aiCostUsd.toFixed(4)}.`);
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

// titleVerdict/locationVerdict were internal routing metadata for this
// script only — strip them so listings that went through the uncertain path
// don't end up with fields the ones that passed outright never had.
const cleanedListings = listings.map(({ titleVerdict, locationVerdict, ...listing }) => listing);

cleanedListings.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(LISTINGS_PATH, JSON.stringify(cleanedListings, null, 2) + "\n");

console.log(`\n${listings.length} posting(s) written to data/listings.json.`);
