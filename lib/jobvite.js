// Generic Jobvite ("CareersConnected") client. The root careers page
// (`jobs.jobvite.com/{key}`) is client-rendered — no job links in the raw
// HTML — but the department-filtered listing page
// (`jobs.jobvite.com/{key}/jobs/team`) is server-rendered HTML with every
// job grouped under a `<h3 class="h2">` department heading, confirmed live
// against Buckman: passing no `?d=` filter at all returns every department's
// full list on one page, no pagination needed for a company this size.
//
// The list page has no posted date — only a job's own detail page does, via
// a `<script type="application/ld+json">` schema.org JobPosting block that
// also carries the full HTML description. Same lazy-fetch shape as iCIMS:
// postedOn is null at scrape time, description is fetched separately (see
// fetchJobviteJobDescription) only for postings that already pass classify().

const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";
const REQUEST_TIMEOUT_MS = 20_000;

function listUrl(key) {
  return `https://jobs.jobvite.com/${key}/jobs/team`;
}

async function fetchListPage(key) {
  const response = await fetch(listUrl(key), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Jobvite listing returned ${response.status} (${key})`);
  }

  return response.text();
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&ndash;|&#8211;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

const ROW_PATTERN =
  /<tr>\s*<td class="jv-job-list-name">\s*<a href="([^"]+)">([^<]+)<\/a>\s*<\/td>([\s\S]*?)<\/tr>/g;
const LOCATION_CELL_PATTERN = /jv-job-list-location">([\s\S]*?)<\/td>/g;

function parseJobRows(html, department, employer) {
  const jobs = [];
  for (const match of html.matchAll(ROW_PATTERN)) {
    const [, path, title, rest] = match;
    const locationParts = [...rest.matchAll(LOCATION_CELL_PATTERN)]
      .map((m) => decodeEntities(m[1]))
      .filter(Boolean);

    const idMatch = path.match(/\/job\/([^/?]+)/);
    if (!idMatch) continue;

    jobs.push({
      id: `jobvite:${employer.key}:${idMatch[1]}`,
      title: decodeEntities(title),
      location: locationParts.join(", "),
      url: `https://jobs.jobvite.com${path}`,
      department,
      postedOn: null,
      company: employer.company,
      sourceAts: "jobvite",
    });
  }
  return jobs;
}

export async function fetchJobviteJobs(employer) {
  const html = await fetchListPage(employer.key);
  const chunks = html.split(/(?=<h3 class="h2">)/);

  const jobs = [];
  for (const chunk of chunks) {
    const deptMatch = chunk.match(/<h3 class="h2">([^<]+)<\/h3>/);
    if (!deptMatch) continue;
    jobs.push(...parseJobRows(chunk, decodeEntities(deptMatch[1]), employer));
  }

  return { jobs };
}

// Fetches the full HTML description for one posting, for the job-detail
// page — pulled from the same schema.org JobPosting JSON-LD block that also
// has the real posted date, confirmed live against a real Buckman posting.
export async function fetchJobviteJobDescription(jobUrl) {
  const response = await fetch(jobUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Jobvite job detail returned ${response.status} (${jobUrl})`);
  }

  const html = await response.text();
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    return data.description ?? null;
  } catch {
    return null;
  }
}
