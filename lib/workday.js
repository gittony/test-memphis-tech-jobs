// Generic Workday CXS API client — extracted from the Phase 1 Medtronic
// scraper once Phase 9 needed the same logic for ~10 more Workday tenants.
// Every Workday career site exposes the same undocumented-but-consistent
// `/wday/cxs/{tenant}/{site}/jobs` search endpoint and per-job detail
// endpoint; only the host/tenant/site strings differ per employer.

const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";
const PAGE_SIZE = 20; // Workday's API rejects requests above limit=20 with a 400.

// fetch() has no default timeout — a tenant that accepts the connection but
// never responds would hang this request (and the whole pipeline behind it)
// indefinitely. Found this the hard way: one tenant stalled for 20+ minutes
// with zero CPU activity during Phase 9 testing.
const REQUEST_TIMEOUT_MS = 20_000;

export function jobBaseUrl({ host, site }) {
  return `https://${host}/${site}`;
}

async function fetchPage({ host, tenant, site }, offset) {
  const apiUrl = `https://${host}/wday/cxs/${tenant}/${site}/jobs`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ appliedFacets: {}, limit: PAGE_SIZE, offset, searchText: "" }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Workday API returned ${response.status} at offset ${offset} (${tenant}/${site})`);
  }

  return response.json();
}

function normalize(posting, employer) {
  const externalId = posting.bulletFields?.[0] ?? posting.externalPath;
  return {
    id: `workday:${employer.tenant}:${externalId}`,
    title: posting.title,
    location: posting.locationsText,
    url: `${jobBaseUrl(employer)}${posting.externalPath}`,
    department: null, // Workday's search results don't include this; would need a per-job detail fetch
    postedOn: posting.postedOn,
    company: employer.company,
    sourceAts: "workday",
  };
}

export async function fetchWorkdayJobs(employer) {
  // Workday's `total` field is only accurate on the first page — every page
  // after that reports total:0 even though jobPostings keeps returning real,
  // distinct results. So we page until a response comes back short of a full
  // page (the real end-of-results signal) instead of trusting `total`.
  const jobs = [];
  let offset = 0;
  let reportedTotal = null;

  while (true) {
    const page = await fetchPage(employer, offset);
    if (reportedTotal === null) reportedTotal = page.total;
    jobs.push(...page.jobPostings.map((posting) => normalize(posting, employer)));

    if (page.jobPostings.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { jobs, reportedTotal };
}

// Fetches the full detail for one posting — includes the real location list
// (`location` + `additionalLocations`), which search results don't carry.
// Used to resolve "N Locations" ambiguity without guessing or calling AI.
export async function fetchWorkdayJobDetail({ host, tenant, site, externalPath }) {
  const response = await fetch(`https://${host}/wday/cxs/${tenant}/${site}${externalPath}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Workday detail API returned ${response.status} for ${externalPath} (${tenant}/${site})`);
  }

  const data = await response.json();
  return data.jobPostingInfo;
}
