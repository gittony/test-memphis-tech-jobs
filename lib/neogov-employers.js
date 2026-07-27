// Config table for employers scraped via lib/neogov.js.
//
// City of Memphis is the whole city government — every posting is
// inherently within Memphis city limits, so `fixedLocation` stands in for a
// real per-job location field, same reasoning as icims-employers.js's MSCS
// entry (NEOGOV's search results carry salary/division text per job, but no
// geographic location).
export const NEOGOV_EMPLOYERS = [
  {
    key: "cityofmemphis",
    company: "City of Memphis",
    agencyFolder: "memphistn",
    fixedLocation: "Memphis, Tennessee",
  },
];
