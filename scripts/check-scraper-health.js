// Phase 8: turns data/scraper-health.json into a GitHub Issue when a
// scraper is broken, and closes that issue automatically once things
// recover — so a bad run is visible without anyone checking Actions logs.
//
// Standalone-runnable. Pass --dry-run to print what would happen without
// calling the GitHub API (useful locally, where there's no GITHUB_TOKEN).

import { fileURLToPath } from "node:url";
import { loadScraperHealth } from "../lib/scraper-health.js";

const HEALTH_PATH = fileURLToPath(new URL("../data/scraper-health.json", import.meta.url));
const ISSUE_TITLE = "Scraper health alert";
const DRY_RUN = process.argv.includes("--dry-run");

const health = loadScraperHealth(HEALTH_PATH);
const failures = health.filter((h) => !h.ok);

function buildBody(failures) {
  const lines = failures.map(
    (f) => `- **${f.employer}** (last ran ${f.ranAt}): ${f.error}`
  );
  return `The following scraper(s) failed or returned suspicious results on the most recent run:\n\n${lines.join("\n")}\n\nThis issue will close itself automatically once every scraper reports healthy.`;
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "memphis-tech-jobs-bot",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} failed: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function findOpenAlertIssue() {
  const issues = await githubRequest("/issues?state=open&per_page=100");
  return issues.find((issue) => !issue.pull_request && issue.title === ISSUE_TITLE) ?? null;
}

if (failures.length === 0) {
  console.log("All scrapers healthy.");
  if (DRY_RUN) {
    console.log("[dry-run] Would check for an open alert issue to close, if one exists.");
  } else {
    const existing = await findOpenAlertIssue();
    if (existing) {
      await githubRequest(`/issues/${existing.number}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: "All scrapers are healthy again as of this run. Closing." }),
      });
      await githubRequest(`/issues/${existing.number}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "closed" }),
      });
      console.log(`Closed issue #${existing.number}.`);
    }
  }
} else {
  console.log(`${failures.length} scraper(s) unhealthy: ${failures.map((f) => f.employer).join(", ")}`);
  const body = buildBody(failures);
  if (DRY_RUN) {
    console.log(`[dry-run] Would create-or-update a "${ISSUE_TITLE}" issue with body:\n${body}`);
  } else {
    const existing = await findOpenAlertIssue();
    if (existing) {
      await githubRequest(`/issues/${existing.number}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      console.log(`Commented on existing issue #${existing.number}.`);
    } else {
      const created = await githubRequest("/issues", {
        method: "POST",
        body: JSON.stringify({ title: ISSUE_TITLE, body }),
      });
      console.log(`Opened issue #${created.number}.`);
    }
  }
}
