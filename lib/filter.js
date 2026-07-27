// Rule-based pass/fail/uncertain classification for Phase 3. Title matching is
// a whitelist of specific tech-role phrases (not a bare "engineer") so that
// generic manufacturing/clinical/quality/sales titles fail by simply not
// matching anything, rather than needing a long list of exclusions.
//
// Slice 11: a title that's plausibly tech-adjacent but doesn't match the
// strict whitelist (e.g. "Digital Innovation Engineer" — real title at
// Buckman, requires a CS degree, not caught by any specific phrase above)
// used to fail outright with no review at all. TITLE_MAYBE_PATTERNS is a
// second, broader set of signals — if a title matches one of these but not
// the strict list, it's "uncertain" rather than a hard fail, and gets a real
// AI judgment call instead, same as ambiguous locations already get.
// Deliberately excludes a bare /engineer/ match: that alone would send every
// manufacturing/process/quality engineer title at every industrial employer
// here to AI, which is a much bigger recall/cost tradeoff than this slice
// was scoped for — a title with one of these other signal words already
// covers the motivating cases (Buckman's "Digital Innovation Engineer" via
// "digital", Orgill's "Sr Developer Snowflake Data Platform" via the bare
// "developer" match) without touching that broader class of titles.

// State is checked as either the full name or the "TN" postal abbreviation —
// found scraping Phase 9's new employers that some ATSes format location as
// "Memphis, TN" rather than "Memphis, Tennessee". "tn" is word-boundaried so
// it can't match as a stray substring of some unrelated word.
const MEMPHIS_AREA_LOCATIONS = [
  ["memphis", "tennessee"],
  ["germantown", "tennessee"],
  ["collierville", "tennessee"],
  ["bartlett", "tennessee"],
  ["cordova", "tennessee"],
  ["millington", "tennessee"],
  ["arlington", "tennessee"],
  ["lakeland", "tennessee"],
];

const TN_ABBREVIATION = /\btn\b/i;

// Locations we can't judge from the text alone — these get flagged for
// Phase 4's AI review rather than an automatic fail.
const AMBIGUOUS_LOCATION_PATTERNS = [
  /^\d+\s+locations?$/i,
  /\bremote\b/i,
  /\bhybrid\b/i,
  /multiple locations/i,
];

const TITLE_INCLUDE_PATTERNS = [
  /software/i,
  /full.?stack/i,
  /front.?end/i,
  /back.?end/i,
  /web developer/i,
  /devops/i,
  /site reliability/i,
  /\bsre\b/i,
  /data (scientist|engineer|analyst|architect)/i,
  /data science/i,
  /machine learning/i,
  /artificial intelligence/i,
  /\bai\b.*(engineer|scientist|specialist)/i,
  /business intelligence/i,
  /analytics engineer/i,
  /\bcyber/i,
  /information security/i,
  /security engineer/i,
  /product security/i,
  /cloud (engineer|architect)/i,
  /database (administrator|engineer|developer)/i,
  /\bit (developer|architect|technologist)\b/i,
  /programmer/i,
  /software (test|qa|quality)/i,
  /test automation/i,
  /automation engineer/i,
];

// Broader "maybe tech" signals — not confident enough to auto-pass, but not
// clearly irrelevant either. See the file-level comment above for why a bare
// /engineer/ is deliberately not included here.
const TITLE_MAYBE_PATTERNS = [
  /\bdeveloper\b/i,
  /\bdigital\b/i,
  /\binnovation\b/i,
  /\btechnology\b/i,
  /\btechnical\b/i,
  /\bsystems?\b/i,
  /\barchitect\b/i,
  /\bautomation\b/i,
  /\bdata\b/i,
  /\banalytics\b/i,
  /\bit\b/i,
];

export function matchesMemphisArea(locationText) {
  const text = (locationText || "").toLowerCase();
  return MEMPHIS_AREA_LOCATIONS.some(
    ([city, state]) => text.includes(city) && (text.includes(state) || TN_ABBREVIATION.test(text))
  );
}

function locationVerdict(locationText) {
  const text = (locationText || "").toLowerCase();
  if (AMBIGUOUS_LOCATION_PATTERNS.some((pattern) => pattern.test(text))) return "uncertain";
  return matchesMemphisArea(text) ? "pass" : "fail";
}

function titleVerdict(title) {
  if (TITLE_INCLUDE_PATTERNS.some((pattern) => pattern.test(title))) return "pass";
  if (TITLE_MAYBE_PATTERNS.some((pattern) => pattern.test(title))) return "uncertain";
  return "fail";
}

// Returns titleVerdict/locationVerdict alongside the combined verdict so
// callers (build-listings.js) can tell *why* something is uncertain — a
// title-uncertain job with an already-confirmed location shouldn't run
// through Workday's location-detail lookup, which only makes sense when
// location itself is what's unresolved.
export function classify(job) {
  const title = titleVerdict(job.title);
  if (title === "fail") {
    return { verdict: "fail", reason: "title", titleVerdict: title, locationVerdict: null };
  }

  const location = locationVerdict(job.location);
  if (location === "fail") {
    return { verdict: "fail", reason: "location", titleVerdict: title, locationVerdict: location };
  }

  if (title === "uncertain" || location === "uncertain") {
    const reasons = [];
    if (title === "uncertain") reasons.push("ambiguous title");
    if (location === "uncertain") reasons.push("ambiguous location");
    return { verdict: "uncertain", reason: reasons.join(" + "), titleVerdict: title, locationVerdict: location };
  }

  return { verdict: "pass", reason: null, titleVerdict: title, locationVerdict: location };
}

export { MEMPHIS_AREA_LOCATIONS, TITLE_INCLUDE_PATTERNS, TITLE_MAYBE_PATTERNS };
