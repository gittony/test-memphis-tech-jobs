// Config table for employers scraped via lib/oracle-recruiting.js.
//
// `memphisLocationFacetId` is Oracle's internal GeographyId for "Memphis, TN,
// United States" *within this specific tenant's Oracle Fusion instance* —
// it's assigned per-pod, not a stable cross-tenant ID, so every new employer
// on this ATS needs its own value discovered the same way: load the
// employer's careers site, search/filter by the Memphis location facet, and
// read `SelectedLocationsFacet` back from the resulting API response.
export const ORACLE_RECRUITING_EMPLOYERS = [
  {
    key: "hilton",
    company: "Hilton",
    host: "efet.fa.us2.oraclecloud.com",
    site: "CX_1009",
    memphisLocationFacetId: "300000003889994",
  },
  {
    key: "autozone",
    company: "AutoZone",
    host: "egud.fa.us2.oraclecloud.com",
    site: "CX_1",
    memphisLocationFacetId: "300000050066936",
  },
  {
    key: "uofm",
    company: "University of Memphis",
    host: "ibqajb.fa.ocs.oraclecloud.com",
    site: "CX_1",
    memphisLocationFacetId: "300000008812141",
  },
  {
    key: "internationalpaper",
    company: "International Paper",
    host: "iazbqy.fa.ocs.oraclecloud.com",
    site: "CX_1",
    memphisLocationFacetId: "100000036997370",
  },
  {
    key: "shelbycounty",
    company: "Shelby County Government",
    host: "iayzqy.fa.ocs.oraclecloud.com",
    site: "CX_1",
    memphisLocationFacetId: "300000006185143",
  },
  {
    // Phase 0 triaged this as Taleo (`ut.taleo.net`) — that domain no longer
    // even resolves. The whole University of Tennessee system (all
    // campuses, not just the Memphis/UTHSC one) has since moved to Oracle
    // Recruiting Cloud; the Memphis facet ID below is what actually scopes
    // this down to UTHSC's campus specifically.
    key: "uthsc",
    company: "University of Tennessee Health Science Center",
    host: "fa-ewlq-saasfaprod1.fa.ocs.oraclecloud.com",
    site: "CX_1",
    memphisLocationFacetId: "300000010468193",
  },
  {
    // Phase 0 triaged this as NEOGOV (`governmentjobs.com/careers/memphistn`)
    // — that page still technically loads, but it's abandoned: it returns
    // zero postings and the only listing findable via web search on that
    // domain had closed back in 2018. The real, currently-updated job board
    // is linked directly from `memphistn.gov/careers` and lives on Oracle
    // Recruiting Cloud instead — same shape of surprise as UTHSC's.
    key: "cityofmemphis",
    company: "City of Memphis",
    host: "eeim.fa.us2.oraclecloud.com",
    site: "CMEM",
    memphisLocationFacetId: "300000002243835",
  },
];
