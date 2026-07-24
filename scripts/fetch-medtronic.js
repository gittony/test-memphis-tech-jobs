// Fetches Medtronic's live postings from its Workday career site and returns
// them normalized. `node scripts/fetch-medtronic.js` run directly still just
// prints the JSON to console, as it did in Phase 1 — Phase 2's storage step
// imports fetchMedtronicJobs() instead of re-implementing this.

import { fileURLToPath } from "node:url";

const TENANT = "medtronic";
const SITE = "MedtronicCareers";
const HOST = "medtronic.wd1.myworkdayjobs.com";
const API_URL = `https://${HOST}/wday/cxs/${TENANT}/${SITE}/jobs`;
const JOB_BASE_URL = `https://${HOST}/${SITE}`;
const PAGE_SIZE = 20; // Workday's API rejects this endpoint's requests with a 400 above limit=20.
const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";

async function fetchPage(offset) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      appliedFacets: {},
      limit: PAGE_SIZE,
      offset,
      searchText: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Workday API returned ${response.status} at offset ${offset}`);
  }

  return response.json();
}

function normalize(posting) {
  const externalId = posting.bulletFields?.[0] ?? posting.externalPath;
  return {
    id: `workday:medtronic:${externalId}`,
    title: posting.title,
    location: posting.locationsText,
    url: `${JOB_BASE_URL}${posting.externalPath}`,
    department: null, // Workday's search results don't include this; would need a per-job detail fetch
    postedOn: posting.postedOn,
    company: "Medtronic",
    sourceAts: "workday",
  };
}

export async function fetchMedtronicJobs() {
  // Workday's `total` field is only accurate on the first page — every page
  // after that reports total:0 even though jobPostings keeps returning real,
  // distinct results. So we page until a response comes back short of a full
  // page (the real end-of-results signal) instead of trusting `total`.
  const jobs = [];
  let offset = 0;
  let reportedTotal = null;

  while (true) {
    const page = await fetchPage(offset);
    if (reportedTotal === null) reportedTotal = page.total;
    jobs.push(...page.jobPostings.map(normalize));

    if (page.jobPostings.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { jobs, reportedTotal };
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const { jobs, reportedTotal } = await fetchMedtronicJobs();
  console.log(JSON.stringify(jobs, null, 2));
  console.error(`\nFetched ${jobs.length} postings from Medtronic's Workday board (site reported ${reportedTotal} at start).`);
}
