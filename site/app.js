const listingsEl = document.getElementById("listings");
const searchInput = document.getElementById("search-input");
const companyFilter = document.getElementById("company-filter");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const lastUpdated = document.getElementById("last-updated");

let listings = [];

// Same transform as lib/slug.js — duplicated because this site has no build
// step or bundler to share a Node module with the browser.
function slugifyJobId(id) {
  return id
    .replace(/:/g, "-")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function displayPostedDate(job) {
  if (!job.postedOnDate) return null;
  const formatted = new Date(`${job.postedOnDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return job.postedOnApprox ? `Posted before ${formatted}` : `Posted ${formatted}`;
}

function displayLocation(job) {
  if (!job.resolvedLocations) return job.location;
  const memphisEntry = job.resolvedLocations.find((loc) => /memphis/i.test(loc));
  const others = job.resolvedLocations.length - 1;
  const suffix = others > 0 ? ` (+ ${others} other location${others === 1 ? "" : "s"})` : "";
  return `${memphisEntry ?? job.resolvedLocations[0]}${suffix}`;
}

function tagEl(text) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = text;
  return span;
}

// Postings come from external, scraped career sites, so their text fields are
// untrusted — built via DOM nodes + textContent throughout, never innerHTML,
// so a stray "<" or "&" in a real job title can't break out into markup.
function render(filtered) {
  listingsEl.innerHTML = "";
  resultCount.textContent = `${filtered.length} posting${filtered.length === 1 ? "" : "s"}`;
  emptyState.hidden = filtered.length > 0;

  for (const job of filtered) {
    const li = document.createElement("li");
    li.className = "listing-card";

    const h2 = document.createElement("h2");
    h2.className = "listing-title";
    const link = document.createElement("a");
    link.href = `./job/${slugifyJobId(job.id)}/`;
    link.textContent = job.title;
    h2.appendChild(link);

    const meta = document.createElement("p");
    meta.className = "listing-meta";
    meta.textContent = [job.company, displayLocation(job), displayPostedDate(job)].filter(Boolean).join(" · ");

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "listing-tags";
    for (const tag of job.roleTags ?? []) tagsWrap.appendChild(tagEl(tag));
    if (job.seniority) tagsWrap.appendChild(tagEl(job.seniority));

    li.append(h2, meta, tagsWrap);
    listingsEl.appendChild(li);
  }
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const company = companyFilter.value;

  const filtered = listings.filter((job) => {
    const matchesQuery =
      !query || job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query);
    const matchesCompany = !company || job.company === company;
    return matchesQuery && matchesCompany;
  });

  render(filtered);
}

function populateCompanyFilter() {
  const companies = [...new Set(listings.map((job) => job.company))].sort();
  for (const company of companies) {
    const option = document.createElement("option");
    option.value = company;
    option.textContent = company;
    companyFilter.appendChild(option);
  }
}

async function init() {
  const response = await fetch("./data/listings.json");
  listings = await response.json();

  populateCompanyFilter();
  render(listings);

  lastUpdated.textContent = `${listings.length} postings · data current as of your last pipeline run`;

  searchInput.addEventListener("input", applyFilters);
  companyFilter.addEventListener("change", applyFilters);
}

init();
