// Turns a job id like "workday:medtronic:R71386" into a URL-safe path
// segment for site/job/{slug}/. As unique as the id itself (the store's own
// dedup key), so no collision risk.
//
// Duplicated verbatim as an inline function in site/app.js — the site has no
// build step or bundler to share a Node module with the browser.
export function slugifyJobId(id) {
  return id
    .replace(/:/g, "-")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
