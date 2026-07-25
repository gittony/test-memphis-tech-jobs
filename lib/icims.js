// Generic iCIMS career-site client. Unlike Workday, iCIMS has no clean JSON
// search API — job listings are server-rendered HTML inside a nested iframe
// (`?in_iframe=1&...`). Confirmed via a headless-browser inspection during
// Phase 9 that the exact query string below is what makes iCIMS render full
// listings server-side without needing JS at all — a plain fetch() of that
// URL returns the same HTML a browser would show inside the iframe.

const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";
const REQUEST_TIMEOUT_MS = 20_000;

function searchUrl(host, page) {
  const params = new URLSearchParams({
    pr: String(page),
    in_iframe: "1",
    searchRelation: "keyword_all",
    mobile: "false",
    width: "1116",
    height: "500",
    bga: "true",
    needsRedirect: "false",
    jan1offset: "-360",
    jun1offset: "-300",
  });
  return `https://${host}/jobs/search?${params}`;
}

async function fetchPage(host, page) {
  const response = await fetch(searchUrl(host, page), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`iCIMS search returned ${response.status} at page ${page} (${host})`);
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
    .trim();
}

function parseJobCards(html, employer) {
  const cards = html.split('<li class="iCIMS_JobCardItem">').slice(1);

  return cards
    .map((card) => {
      const anchorMatch = card.match(/<a href="([^"]+)" class="iCIMS_Anchor" title="(\d+) - ([^"]+)"/);
      if (!anchorMatch) return null;
      const [, url, jobId, title] = anchorMatch;

      // First iCIMS_JobHeaderData value is the site/department name, second
      // (when present) is "Subject". Neither is a geographic location — this
      // site is a single school district entirely within Shelby County, so
      // employer.fixedLocation stands in for a real location field.
      const fieldValues = [...card.matchAll(/iCIMS_JobHeaderData"><span[^>]*>\s*([^<]*)<\/span>/g)].map((m) =>
        decodeEntities(m[1])
      );

      return {
        id: `icims:${employer.key}:${jobId}`,
        title: decodeEntities(title),
        location: employer.fixedLocation,
        url: decodeEntities(url),
        department: fieldValues[0] ?? null,
        postedOn: null,
        company: employer.company,
        sourceAts: "icims",
      };
    })
    .filter(Boolean);
}

export async function fetchIcimsJobs(employer) {
  const jobs = [];
  let page = 0;

  while (true) {
    const html = await fetchPage(employer.host, page);
    const pageJobs = parseJobCards(html, employer);
    if (pageJobs.length === 0) break;

    jobs.push(...pageJobs);
    page += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { jobs };
}
