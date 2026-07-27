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
];
