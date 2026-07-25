// Workday's search API doesn't expose a real posting date — only relative
// text like "Posted Today", "Posted 11 Days Ago", or "Posted 30+ Days Ago".
// Converts that into an actual calendar date using the moment we scraped
// the posting (job.lastSeenAt) as the reference point, since the relative
// text was accurate as of that scrape. "30+ Days Ago" is a capped bucket —
// the true age could be 31 days or 300, so that case is flagged `approx`
// rather than presented as an exact date.

const DAYS_AGO_PATTERN = /^posted (\d+)(\+?) days? ago$/i;
const TODAY_PATTERN = /^posted today$/i;
const YESTERDAY_PATTERN = /^posted yesterday$/i;

export function estimatePostedDate(postedOnText, referenceIso) {
  if (!postedOnText || !referenceIso) return null;
  const text = postedOnText.trim();
  const reference = new Date(referenceIso);

  const daysAgo = TODAY_PATTERN.test(text)
    ? 0
    : YESTERDAY_PATTERN.test(text)
      ? 1
      : DAYS_AGO_PATTERN.test(text)
        ? Number(text.match(DAYS_AGO_PATTERN)[1])
        : null;

  if (daysAgo === null) return null;

  const approx = /\+/.test(text);
  const date = new Date(reference);
  date.setUTCDate(date.getUTCDate() - daysAgo);

  return { date: date.toISOString().slice(0, 10), approx };
}
