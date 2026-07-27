// Generates site/job/{slug}/index.html for every posting in
// data/listings.json — a real static page per job, since this is a static
// GitHub Pages site with no server to add routes to. Only fetches
// descriptions for postings that already passed classify() (today: ~18 of
// ~4,900+ raw postings), not at scrape time — Workday/iCIMS detail fetches
// are rate-limited and there's no reason to pay that cost for jobs that will
// never be shown.
//
// Never lets one flaky/blocked detail fetch take down the whole run — same
// lesson as scripts/resolve-locations.js and the Workday-403 incident in
// PLAN.md: log, fall through to a fallback message on that one job's page,
// keep going.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fetchWorkdayJobDetail, jobBaseUrl } from "../lib/workday.js";
import { fetchIcimsJobDescription } from "../lib/icims.js";
import { fetchJobviteJobDescription } from "../lib/jobvite.js";
import { WORKDAY_EMPLOYERS } from "../lib/workday-employers.js";
import { sanitizeAndExcerpt } from "../lib/sanitize-description.js";
import { renderJobPage } from "../lib/render-job-page.js";
import { slugifyJobId } from "../lib/slug.js";

const LISTINGS_PATH = fileURLToPath(new URL("../data/listings.json", import.meta.url));
const SITE_JOB_DIR = fileURLToPath(new URL("../site/job", import.meta.url));

const WORKDAY_BY_COMPANY = new Map(WORKDAY_EMPLOYERS.map((e) => [e.company, e]));

if (!existsSync(LISTINGS_PATH)) {
  console.error("data/listings.json not found — run `node scripts/build-listings.js` first.");
  process.exit(1);
}

const listings = JSON.parse(readFileSync(LISTINGS_PATH, "utf8"));

function removeStalePages(currentSlugs) {
  if (!existsSync(SITE_JOB_DIR)) return 0;
  let removed = 0;
  for (const entry of readdirSync(SITE_JOB_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && !currentSlugs.has(entry.name)) {
      rmSync(`${SITE_JOB_DIR}/${entry.name}`, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}

// Returns { text, isPlainText } | null. Oracle and UltiPro's descriptions
// are already on the record (captured free at scrape time, plain text for
// both); Workday/iCIMS need a per-job detail fetch, wrapped so a failure
// degrades that one page, not the run.
async function fetchDescription(listing) {
  if (listing.sourceAts === "oracle-recruiting" || listing.sourceAts === "ultipro") {
    return listing.description ? { text: listing.description, isPlainText: true } : null;
  }

  if (listing.sourceAts === "workday") {
    const employer = WORKDAY_BY_COMPANY.get(listing.company);
    if (!employer) return null;
    try {
      const externalPath = listing.url.slice(jobBaseUrl(employer).length);
      const detail = await fetchWorkdayJobDetail({ ...employer, externalPath });
      return detail.jobDescription ? { text: detail.jobDescription, isPlainText: false } : null;
    } catch (err) {
      console.error(`- ${listing.id}: Workday description fetch failed (${err.message}), rendering fallback`);
      return null;
    }
  }

  if (listing.sourceAts === "icims") {
    try {
      const text = await fetchIcimsJobDescription(listing.url);
      return text ? { text, isPlainText: false } : null;
    } catch (err) {
      console.error(`- ${listing.id}: iCIMS description fetch failed (${err.message}), rendering fallback`);
      return null;
    }
  }

  if (listing.sourceAts === "jobvite") {
    try {
      const text = await fetchJobviteJobDescription(listing.url);
      return text ? { text, isPlainText: false } : null;
    } catch (err) {
      console.error(`- ${listing.id}: Jobvite description fetch failed (${err.message}), rendering fallback`);
      return null;
    }
  }

  return null;
}

const currentSlugs = new Set(listings.map((listing) => slugifyJobId(listing.id)));
const removed = removeStalePages(currentSlugs);

let written = 0;
for (const listing of listings) {
  const raw = await fetchDescription(listing);
  const { excerptHtml, isTruncated } = raw
    ? sanitizeAndExcerpt(raw.text, { isPlainText: raw.isPlainText })
    : { excerptHtml: null, isTruncated: false };

  const dir = `${SITE_JOB_DIR}/${slugifyJobId(listing.id)}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, renderJobPage(listing, { excerptHtml, isTruncated }));
  written += 1;

  // Same politeness delay used by every other per-job fetch in this project.
  if (listing.sourceAts === "workday" || listing.sourceAts === "icims" || listing.sourceAts === "jobvite") {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

console.log(`${written} job detail page(s) written, ${removed} stale page(s) removed.`);
