// Generic NEOGOV (governmentjobs.com) client. Unlike Workday's clean JSON
// API, this is an ASP.NET MVC app with a server-rendered HTML search-results
// fragment behind an ajax-style GET — found by reading the site's own
// jQuery/knockout search bundle (AgencyPages/search), not documented
// anywhere. Confirmed live: the fragment renders identically with or
// without a session cookie/Referer — no session dance needed here, unlike
// Taleo.
//
// Verified the whole mechanism against Nashville (agency "nashville", 67
// real postings, real "N Job Postings found" count) before trusting City of
// Memphis's own empty result — Memphis genuinely has 0 open postings on
// NEOGOV right now, not a scraper bug: the only Memphis job bulletin URL
// findable via web search turned out to have closed back in 2018 (NEOGOV
// keeps old bulletin pages live indefinitely), which is what search engines
// were actually indexing.

const USER_AGENT = "MemphisTechJobsBoard/0.1 (contact: tonywhite@gmail.com)";
const REQUEST_TIMEOUT_MS = 20_000;
const JOBS_PER_PAGE = 10; // matches the site's own JOBS_PER_PAGE constant

function searchUrl(agencyFolder, page) {
  const params = new URLSearchParams({ agency: agencyFolder, page: String(page) });
  return `https://www.governmentjobs.com/careers/home/index?${params}`;
}

async function fetchPage(agencyFolder, page) {
  const response = await fetch(searchUrl(agencyFolder, page), {
    headers: { "User-Agent": USER_AGENT, "X-Requested-With": "XMLHttpRequest" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`NEOGOV search returned ${response.status} at page ${page} (${agencyFolder})`);
  }

  return response.text();
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&ndash;|&#8211;/g, "-")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseJobCards(html, employer) {
  const cards = html.split('<li class="list-item"').slice(1);

  return cards
    .map((card) => {
      const idMatch = card.match(/data-job-id="(\d+)"/);
      const linkMatch = card.match(/class="item-details-link"[^>]*href="([^"]+)"[^>]*>([^<]+)</);
      const postedMatch = card.match(/list-entry-starts"><span>([^<]*)<\/span>/);
      // Plain text (confirmed against a real posting) — no nested tags to
      // worry about, unlike iCIMS's HTML description blocks.
      const descMatch = card.match(/<div class="list-entry">([\s\S]*?)<\/div>/);

      if (!idMatch || !linkMatch) return null;
      const [, jobId] = idMatch;
      const [, path, title] = linkMatch;

      return {
        id: `neogov:${employer.key}:${jobId}`,
        title: decodeEntities(title),
        location: employer.fixedLocation,
        url: `https://www.governmentjobs.com${path}`,
        department: null,
        postedOn: postedMatch ? decodeEntities(postedMatch[1]) : null,
        description: descMatch ? decodeEntities(descMatch[1]) : null,
        company: employer.company,
        sourceAts: "neogov",
      };
    })
    .filter(Boolean);
}

export async function fetchNeogovJobs(employer) {
  const jobs = [];
  let page = 1;

  while (true) {
    const html = await fetchPage(employer.agencyFolder, page);
    const pageJobs = parseJobCards(html, employer);
    if (pageJobs.length === 0) break;

    jobs.push(...pageJobs);
    if (pageJobs.length < JOBS_PER_PAGE) break;

    page += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { jobs };
}
