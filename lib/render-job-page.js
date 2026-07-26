// Renders the static HTML for one job's detail page (site/job/{slug}/index.html).

function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

const FALLBACK_HTML =
  '<p class="description-unavailable">Full description unavailable — view the original posting for full details.</p>';

// listing: the raw record from data/listings.json — title/company/location/
// postedOnDate are plain scraped text, NOT pre-sanitized like excerptHtml is,
// so they're escaped here at interpolation time (same untrusted-content
// posture site/app.js already documents for the list view).
export function renderJobPage(listing, { excerptHtml, isTruncated }) {
  const safeUrl = /^https?:\/\//i.test(listing.url) ? listing.url : null;
  const title = escapeHtml(listing.title);
  const company = escapeHtml(listing.company);
  const meta = escapeHtml([listing.company, listing.location, listing.postedOnDate].filter(Boolean).join(" · "));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} at ${company} — Memphis Tech Jobs</title>
<link rel="stylesheet" href="../../styles.css">
</head>
<body>
<header class="page-header">
  <p class="back-link"><a href="../../index.html">&larr; Back to all postings</a></p>
  <h1>${title}</h1>
  <p class="subtitle">${meta}</p>
</header>

<main>
  <div class="listing-card job-detail-card">
    ${excerptHtml ?? FALLBACK_HTML}
  </div>
  ${
    safeUrl
      ? `<p><a class="cta-original" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener">View original posting on ${company}'s career site &rarr;</a></p>`
      : ""
  }
  ${isTruncated ? '<p class="excerpt-note">This is an excerpt — see the original posting for the full description.</p>' : ""}
</main>

<footer class="page-footer">
  <p>Posting scraped from an external career site; Memphis Tech Jobs is not affiliated with ${company}.</p>
</footer>
</body>
</html>
`;
}
