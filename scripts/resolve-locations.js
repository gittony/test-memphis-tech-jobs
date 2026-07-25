// Resolves "N Locations" ambiguity for the uncertain bucket using Workday's
// per-job detail endpoint, which reveals the real location list. This is
// still rule-based, not AI — it only makes sense for ATSes where the detail
// endpoint gives us facts to check against the allowlist. Whatever's left
// genuinely unresolved after this (e.g. true "Remote" postings with no city
// at all) is what actually goes to Phase 4's AI step.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classify, matchesMemphisArea } from "../lib/filter.js";
import { fetchWorkdayJobDetail, jobBaseUrl } from "../lib/workday.js";
import { WORKDAY_EMPLOYERS } from "../lib/workday-employers.js";

const WORKDAY_BY_COMPANY = new Map(WORKDAY_EMPLOYERS.map((e) => [e.company, e]));

export async function resolveUncertainLocations(uncertainJobs, { log = () => {} } = {}) {
  const results = { pass: [], fail: [], stillUncertain: [] };

  for (const job of uncertainJobs) {
    const employer = job.sourceAts === "workday" ? WORKDAY_BY_COMPANY.get(job.company) : null;
    if (!employer) {
      results.stillUncertain.push(job); // no detail-fetch logic for this source/employer yet
      continue;
    }

    const externalPath = job.url.slice(jobBaseUrl(employer).length);

    // A single flaky/blocked detail request (seen in production: a one-off
    // 403 from Workday) must not take down the whole pipeline — every other
    // uncertain posting, and everything downstream (site build, data commit,
    // deploy, scraper health check), depends on this loop finishing. Treat a
    // failed detail fetch the same as "no location data available": pass it
    // on genuinely unresolved rather than crashing.
    let detail;
    try {
      detail = await fetchWorkdayJobDetail({ ...employer, externalPath });
    } catch (err) {
      log(`- ${job.title} -> detail fetch failed (${err.message}), leaving uncertain`);
      results.stillUncertain.push(job);
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }

    const allLocations = [detail.location, ...(detail.additionalLocations ?? [])].filter(Boolean);
    const anyMemphis = allLocations.some((loc) => matchesMemphisArea(loc));

    log(`- ${job.title} -> [${allLocations.join(" | ")}] (remoteType: ${detail.remoteType})`);

    if (allLocations.length === 0) {
      results.stillUncertain.push({ ...job, remoteType: detail.remoteType });
    } else {
      results[anyMemphis ? "pass" : "fail"].push({ ...job, resolvedLocations: allLocations });
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));
  const jobs = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const uncertain = jobs.filter((job) => classify(job).verdict === "uncertain");

  const results = await resolveUncertainLocations(uncertain, { log: console.log });

  console.log(
    `\nResolved via location detail fetch: ${results.pass.length} pass, ${results.fail.length} fail, ` +
      `${results.stillUncertain.length} still uncertain (genuinely need AI).`
  );
}
