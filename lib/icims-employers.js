// Config table for employers scraped via lib/icims.js.
//
// Only Memphis-Shelby County Schools' central office board is wired in so
// far (Phase 9 slice 2). Two other Phase 0 targets turned out not to fit:
// Orgill moved off iCIMS entirely onto a custom site (now "hand-rolled"
// tier), and Baptist Memorial's current careers site sits behind a
// Cloudflare bot-challenge that shouldn't be circumvented.
//
// MSCS also runs a separate "instructional" board (teaching positions) at
// instructional-scsk12.icims.com — deliberately left out for now since it's
// overwhelmingly non-technical roles; can be added the same way if wanted.
export const ICIMS_EMPLOYERS = [
  {
    key: "mscs-central",
    company: "Memphis-Shelby County Schools",
    host: "centraloffice-scsk12.icims.com",
    // The whole district sits inside Shelby County — there's no "N
    // Locations" ambiguity to resolve like Workday's multi-site postings,
    // every job here already qualifies geographically.
    fixedLocation: "Memphis, Tennessee",
  },
];
