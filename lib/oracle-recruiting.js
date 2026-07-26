// Generic Oracle Recruiting Cloud (Oracle Fusion "Candidate Experience")
// client — first employer on this ATS is Hilton (Phase 9). Unlike Workday's
// one-search-endpoint-per-tenant, an Oracle Fusion instance is one shared
// pod (e.g. efet.fa.us2.oraclecloud.com) hosting many companies' postings
// behind a `siteNumber`, and a single employer can have thousands of global
// postings — nowhere near Workday/iCIMS employer sizes. So instead of
// fetching everything and filtering client-side like every other ATS here,
// this client asks Oracle's own location facet to pre-filter server-side to
// one geography (found via `selectedLocationsFacet=<GeographyId>` in the
// finder string, discovered by inspecting the site's own facet-click
// requests) — each employer config supplies that facet's Memphis GeographyId
// since it's assigned per Oracle Fusion tenant, not a stable global ID.

const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";
const REQUEST_TIMEOUT_MS = 20_000;
const PAGE_SIZE = 25;

function searchUrl({ host, site, memphisLocationFacetId }, offset) {
  const finder =
    `findReqs;siteNumber=${site},facetsList=LOCATIONS,` +
    `limit=${PAGE_SIZE},offset=${offset},selectedLocationsFacet=${memphisLocationFacetId}`;
  const params = new URLSearchParams({
    onlyData: "true",
    expand: "requisitionList.secondaryLocations",
    finder,
  });
  return `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?${params}`;
}

async function fetchPage(employer, offset) {
  const response = await fetch(searchUrl(employer, offset), {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Oracle Recruiting Cloud API returned ${response.status} at offset ${offset} (${employer.key})`);
  }

  return response.json();
}

export function jobUrl({ host, site }, id) {
  return `https://${host}/hcmUI/CandidateExperience/en/sites/${site}/job/${id}`;
}

function normalize(requisition, employer) {
  // Oracle's search results already carry the full location list (primary +
  // secondary) up front — no separate per-job detail fetch needed to resolve
  // "N Locations" ambiguity the way Workday's search results require.
  const locations = [requisition.PrimaryLocation, ...(requisition.secondaryLocations ?? []).map((l) => l.Name)].filter(
    Boolean
  );

  return {
    id: `oracle:${employer.key}:${requisition.Id}`,
    title: requisition.Title,
    location: locations.join("; "),
    url: jobUrl(employer, requisition.Id),
    department: requisition.Organization ?? null,
    // Oracle's search response already includes this short plain-text
    // summary at no extra request cost — unlike Workday/iCIMS, there's no
    // realistic way to get a full description (the real job page is a
    // client-rendered SPA with no server-rendered body), so this is as much
    // description as a Hilton job page will ever have.
    description: requisition.ShortDescriptionStr ?? null,
    postedOn: requisition.PostedDate ?? null,
    company: employer.company,
    sourceAts: "oracle-recruiting",
  };
}

export async function fetchOracleRecruitingJobs(employer) {
  const jobs = [];
  let offset = 0;
  let reportedTotal = null;

  while (true) {
    const page = await fetchPage(employer, offset);
    const item = page.items[0];
    if (reportedTotal === null) reportedTotal = item.TotalJobsCount;

    const requisitions = item.requisitionList ?? [];
    jobs.push(...requisitions.map((requisition) => normalize(requisition, employer)));

    if (requisitions.length < PAGE_SIZE || jobs.length >= reportedTotal) break;

    offset += PAGE_SIZE;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { jobs, reportedTotal };
}
