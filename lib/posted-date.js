// Workday's search API doesn't expose a real posting date — only relative
// text like "Posted Today", "Posted 11 Days Ago", or "Posted 30+ Days Ago".
// Converts that into an actual calendar date using the moment we scraped
// the posting (job.lastSeenAt) as the reference point, since the relative
// text was accurate as of that scrape. "30+ Days Ago" is a capped bucket —
// the true age could be 31 days or 300, so that case is flagged `approx`
// rather than presented as an exact date.
//
// Oracle Recruiting Cloud, by contrast, exposes a real "YYYY-MM-DD" posting
// date directly — no estimation needed, just pass it through as exact.
//
// NEOGOV's phrasing is different again ("Posted 2 weeks ago", "Posted more
// than 30 days ago" instead of Workday's "Posted 30+ Days Ago") — same
// estimation approach, just more patterns to recognize the same idea.

const DAYS_AGO_PATTERN = /^posted (\d+)(\+?) days? ago$/i;
const WEEKS_AGO_PATTERN = /^posted (\d+) weeks? ago$/i;
const MORE_THAN_30_DAYS_PATTERN = /^posted more than 30 days ago$/i;
const TODAY_PATTERN = /^posted today$/i;
const YESTERDAY_PATTERN = /^posted yesterday$/i;
const EXACT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function estimatePostedDate(postedOnText, referenceIso) {
  if (!postedOnText || !referenceIso) return null;
  const text = postedOnText.trim();

  if (EXACT_DATE_PATTERN.test(text)) return { date: text, approx: false };

  const reference = new Date(referenceIso);

  const daysAgo = TODAY_PATTERN.test(text)
    ? 0
    : YESTERDAY_PATTERN.test(text)
      ? 1
      : MORE_THAN_30_DAYS_PATTERN.test(text)
        ? 30
        : DAYS_AGO_PATTERN.test(text)
          ? Number(text.match(DAYS_AGO_PATTERN)[1])
          : WEEKS_AGO_PATTERN.test(text)
            ? Number(text.match(WEEKS_AGO_PATTERN)[1]) * 7
            : null;

  if (daysAgo === null) return null;

  const approx = /\+/.test(text) || MORE_THAN_30_DAYS_PATTERN.test(text);
  const date = new Date(reference);
  date.setUTCDate(date.getUTCDate() - daysAgo);

  return { date: date.toISOString().slice(0, 10), approx };
}
