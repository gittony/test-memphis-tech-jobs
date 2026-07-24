// Rule-based pass/fail/uncertain classification for Phase 3. Title matching is
// a whitelist of specific tech-role phrases (not a bare "engineer") so that
// generic manufacturing/clinical/quality/sales titles fail by simply not
// matching anything, rather than needing a long list of exclusions.

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

export function matchesMemphisArea(locationText) {
  const text = (locationText || "").toLowerCase();
  return MEMPHIS_AREA_LOCATIONS.some(([city, state]) => text.includes(city) && text.includes(state));
}

function locationVerdict(locationText) {
  const text = (locationText || "").toLowerCase();
  if (AMBIGUOUS_LOCATION_PATTERNS.some((pattern) => pattern.test(text))) return "uncertain";
  return matchesMemphisArea(text) ? "pass" : "fail";
}

function titleVerdict(title) {
  return TITLE_INCLUDE_PATTERNS.some((pattern) => pattern.test(title)) ? "pass" : "fail";
}

export function classify(job) {
  if (titleVerdict(job.title) === "fail") {
    return { verdict: "fail", reason: "title" };
  }

  const location = locationVerdict(job.location);
  if (location === "fail") return { verdict: "fail", reason: "location" };
  if (location === "uncertain") return { verdict: "uncertain", reason: "ambiguous location" };
  return { verdict: "pass", reason: null };
}

export { MEMPHIS_AREA_LOCATIONS, TITLE_INCLUDE_PATTERNS };
