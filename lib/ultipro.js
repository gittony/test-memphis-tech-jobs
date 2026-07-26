// Generic UKG Pro (UltiPro) recruiting client — first employer on this ATS
// is First Horizon (Phase 9). The public job board itself is a Knockout.js
// SPA (job data isn't in the raw HTML), but it loads results from a clean,
// unauthenticated JSON endpoint: POST .../JobBoard/{boardId}/JobBoardView/
// LoadSearchResults — found by reading the page's own AJAX URL list.
// Confirmed live: no enforced page-size cap up to 500 and no location-facet
// filtering needed the way Oracle's Hilton client requires — First Horizon's
// total posting count (~233) is small enough to fetch everything and filter
// client-side, same approach as Workday/iCIMS.

const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";
const REQUEST_TIMEOUT_MS = 20_000;
const PAGE_SIZE = 50;

function searchUrl({ host, companyCode, boardId }) {
  return `https://${host}/${companyCode}/JobBoard/${boardId}/JobBoardView/LoadSearchResults`;
}

async function fetchPage(employer, skip) {
  const response = await fetch(searchUrl(employer), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ opportunitySearch: { Top: PAGE_SIZE, Skip: skip } }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`UltiPro API returned ${response.status} at skip ${skip} (${employer.key})`);
  }

  return response.json();
}

export function jobUrl({ host, companyCode, boardId }, opportunityId) {
  return `https://${host}/${companyCode}/JobBoard/${boardId}/OpportunityDetail?opportunityId=${opportunityId}`;
}

function normalize(opportunity, employer) {
  const locations = (opportunity.Locations ?? [])
    .map((l) => [l.Address?.City, l.Address?.State?.Name].filter(Boolean).join(", "))
    .filter(Boolean);

  return {
    id: `ultipro:${employer.key}:${opportunity.Id}`,
    title: opportunity.Title,
    location: locations.join("; "),
    url: jobUrl(employer, opportunity.Id),
    department: opportunity.JobCategoryName ?? null,
    // Already plain text in the search response — free at scrape time, same
    // shape as Oracle's ShortDescriptionStr.
    description: opportunity.BriefDescription ?? null,
    // PostedDate is a full ISO timestamp ("2026-07-24T21:56:24.826Z"); trim
    // to the YYYY-MM-DD date lib/posted-date.js already knows how to pass
    // through as an exact date.
    postedOn: opportunity.PostedDate ? opportunity.PostedDate.slice(0, 10) : null,
    company: employer.company,
    sourceAts: "ultipro",
  };
}

export async function fetchUltiproJobs(employer) {
  const jobs = [];
  let skip = 0;
  let reportedTotal = null;

  while (true) {
    const page = await fetchPage(employer, skip);
    if (reportedTotal === null) reportedTotal = page.totalCount;

    const opportunities = page.opportunities ?? [];
    jobs.push(...opportunities.map((opportunity) => normalize(opportunity, employer)));

    if (opportunities.length < PAGE_SIZE || jobs.length >= reportedTotal) break;

    skip += PAGE_SIZE;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { jobs, reportedTotal };
}
