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
import { fetchJobDescription, DESCRIPTION_REQUIRES_FETCH } from "../lib/fetch-description.js";
import { sanitizeAndExcerpt } from "../lib/sanitize-description.js";
import { renderJobPage } from "../lib/render-job-page.js";
import { slugifyJobId } from "../lib/slug.js";

const LISTINGS_PATH = fileURLToPath(new URL("../data/listings.json", import.meta.url));
const SITE_JOB_DIR = fileURLToPath(new URL("../site/job", import.meta.url));

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

const currentSlugs = new Set(listings.map((listing) => slugifyJobId(listing.id)));
const removed = removeStalePages(currentSlugs);

let written = 0;
for (const listing of listings) {
  const raw = await fetchJobDescription(listing, {
    log: (msg) => console.error(`${msg}, rendering fallback`),
  });
  const { excerptHtml, isTruncated } = raw
    ? sanitizeAndExcerpt(raw.text, { isPlainText: raw.isPlainText })
    : { excerptHtml: null, isTruncated: false };

  const dir = `${SITE_JOB_DIR}/${slugifyJobId(listing.id)}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, renderJobPage(listing, { excerptHtml, isTruncated }));
  written += 1;

  // Same politeness delay used by every other per-job fetch in this project.
  if (DESCRIPTION_REQUIRES_FETCH.has(listing.sourceAts)) {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

console.log(`${written} job detail page(s) written, ${removed} stale page(s) removed.`);
