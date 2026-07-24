# Memphis Tech Jobs Board — Plan

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

Decisions locked in so far:
- **Repo**: private GitHub repo. Not yet created — happens in Phase 0.
- **Language**: Node.js / JavaScript throughout (pipeline + site), so you're not context-switching languages.
- **Cost target**: under $5/month, excluding domain.
- **AI model**: Claude Haiku 4.5 (`claude-haiku-4-5`) for classification only, used sparingly (Phase 4).
- **Storage**: plain JSON file(s) committed to the repo, unless Phase 2 turns up a reason that's a bad fit.
- **Site**: static HTML/CSS/JS, no server, no runtime database. Search/filter run in the browser.

Nothing beyond Phase 0 starts until you say go, phase by phase.

---

## Phase 0 — Setup and triage

**What gets built:**
- `git init`, initial commit, `.gitignore` (node_modules, `.env`, build output), `.env.example` as a template with no real secrets.
- Create the private GitHub repo and push.
- `package.json` with Node.js set up (no framework yet — we add dependencies as each phase needs them, not up front).
- A `README.md` stub explaining what the project is (short — this PLAN.md carries the detail).
- Take your list of 30 employers and, for each one, identify which Applicant Tracking System (ATS) serves their careers page: Greenhouse, Lever, Ashby, SmartRecruiters, Workday, iCIMS, Taleo, or "hand-rolled" (custom site, no known ATS). Rank easiest → hardest.

**What you need to decide:**
- Nothing new — repo visibility and language are already decided above.

**What I need from you:**
- The list of 30 employers, so I can triage their ATS.

**Why ATS triage matters (a quick primer):** Companies rarely build their own job-listing pages from scratch — they buy or embed a hosted "applicant tracking system." Several of the popular ones (Greenhouse, Lever, Ashby) expose a public, undocumented-but-stable JSON API you can call directly, e.g. `boards-api.greenhouse.io/v1/boards/{company}/jobs`. That's vastly easier and more reliable than parsing HTML, because the ATS vendor won't change its JSON shape as often as a company redesigns its careers page. Workday, iCIMS, and Taleo are enterprise systems — technically possible to query but fussier (session tokens, POST-based search, inconsistent per-tenant setup). "Hand-rolled" sites have no shortcut — we'd scrape HTML and hope the markup doesn't change. Sorting employers by ATS up front means we build the easy, high-leverage scrapers first and know exactly what we're up against for the rest.

**Done when:**
- Repo exists on GitHub (private), cloned locally, `.env` correctly ignored by git.
- A table (in this file or a companion doc) listing all 30 employers, their ATS, and a difficulty rank.
- You can verify: `git log` shows an initial commit, `git remote -v` shows your GitHub repo, and `cat .gitignore` includes `.env`.

---

## Phase 1 — One scraper, end to end

**What gets built:**
- Pick the single easiest employer from the Phase 0 ranking (almost certainly a Greenhouse or Lever company).
- A script that fetches that employer's postings from the ATS API and prints normalized JSON to the console — title, location string, URL, posted/updated date, department if available.
- No filtering, no storage, no AI. Just: fetch → shape it into a consistent object → print it.

**What you need to decide:**
- Nothing — this is a throwaway proof-of-concept script, kept deliberately narrow.

**Teaching note:** We'll talk about *rate limiting* and *politeness* here even for one employer — setting a descriptive `User-Agent` header with a contact email, and structuring the fetch so it's trivial to add a delay later. Small thing to get right once rather than retrofit across 30 scrapers.

**Done when:**
- Running `node scripts/fetch-<employer>.js` prints an array of job objects to your terminal, each with the same fields, for a real employer's live postings.
- You can verify by eyeballing the console output against that employer's actual careers page.

---

## Phase 2 — Normalize and store

**What gets built:**
- The canonical job record shape (title, company, location, url, department, postedAt, firstSeenAt, lastSeenAt, status, id, sourceAts).
- A stable ID scheme so the same posting is recognized run-to-run even if wording changes slightly (likely a hash of company + ATS's own job ID, not a hash of the full content).
- Read-modify-write logic against a JSON data file: new postings get added, postings seen again get `lastSeenAt` bumped, nothing gets duplicated.

**What you need to decide:**
- **Storage format** — I'll bring 2-3 concrete options (e.g., one JSON file vs. one file per employer vs. SQLite) with a recommendation once we see how Phase 1's data looks in practice.

**Teaching note:** "Stable IDs" is the crux of re-run safety. If we ID a posting by hashing its title+location text, an employer editing a typo in the description would make our pipeline think it's a brand-new job. Keying off the ATS's own internal job ID (which Greenhouse/Lever/etc. already provide and don't change) avoids that.

**Done when:**
- Running the Phase 1 scraper through this new storage step twice in a row produces zero duplicates and correct `lastSeenAt` timestamps.
- You can verify: `cat data/jobs.json` (or equivalent) before and after a second run — same job count, updated timestamp.

---

## Phase 3 — Rule-based filtering

**What gets built:**
- A title-matching rule set for software/data roles (allow-list of keywords/patterns: "Software Engineer," "Data Analyst," "DevOps," etc., with sensible exclusions like "Sales Engineer" if that's noise).
- A Greater Memphis location allow-list (Memphis, Germantown, Collierville, Bartlett, Cordova, Southaven MS, Olive Branch MS, and other suburbs — we'll finalize the list together).
- A verdict per posting: **pass** (clearly a fit), **fail** (clearly not — wrong role or wrong location), or **uncertain** (ambiguous location string like "Remote," "Multiple Locations," or a role title that's borderline).

**What you need to decide:**
- The exact Greater Memphis municipality list and commute radius you consider fair game.
- Any role-title edge cases you want in/out (e.g., do QA roles count? Engineering managers?).

**Done when:**
- Running the filter against your stored job data produces three clearly separated buckets, and spot-checking a handful from each bucket matches your own judgment.
- You can verify: a console summary like `42 pass / 61 fail / 8 uncertain`, plus the ability to print the uncertain bucket for manual review.

---

## Phase 4 — AI enrichment

**What gets built:**
- A call to the Anthropic API (Claude Haiku 4.5) for every posting in the **uncertain** bucket only.
- A structured JSON response per posting: location verdict, confidence score, one-line reason, role tags, seniority.
- A log of every API call (input sent, output received) so you can audit decisions later.
- A per-run cost estimate printed to the console (token counts × Haiku pricing).

**What you need from me to flag now:** you'll need an Anthropic API key by this phase. It goes in `.env` as `ANTHROPIC_API_KEY=...` — never committed, and `.env` is already gitignored from Phase 0.

**Teaching note:** This is the one phase touching a paid API, so we'll keep the blast radius small: only ambiguous postings get sent (should be a handful per employer, not hundreds), and I'll show you the exact prompt so you know what's being asked and paid for.

**Done when:**
- Running the pipeline end to end sends only the uncertain bucket to the API, merges the results back into your job data, and prints a cost estimate under a cent for a normal day's run.
- You can verify: the log file shows one entry per uncertain posting, and the estimated cost matches roughly (uncertain count × ~$0.001).

---

## Phase 5 — Static site

**What gets built:**
- A site generator that reads the job data file and produces plain HTML/CSS/JS.
- Client-side search and filter (by title keyword, company, role tag) — no backend involved.
- Runs locally so you can open it in a browser before we think about deployment at all.

**What you need to decide:**
- Visual style is up to you — I'll propose something simple and readable as a starting point, easy to reskin later.

**Done when:**
- Running the site build command produces static files in an output folder, and opening `index.html` locally in a browser shows real jobs with working search/filter.
- You can verify by literally using it: search for a keyword, apply a filter, confirm the results make sense.

---

## Phase 6 — Expiry logic

**What gets built:**
- A diff step comparing each day's scrape against the last for a given employer.
- Postings missing from the latest scrape get marked `expired` — but only after **two consecutive** missed runs, so one transient scrape failure doesn't wipe out an employer's whole listing set.
- Expired postings drop out of the site's default view (but stay in the data file, in case you want a "recently closed" view later).

**Done when:**
- Simulating a missing posting (temporarily editing test data) shows it survive one missed run, then flip to expired on the second.
- You can verify by inspecting the job record's status field across two manually-triggered runs.

---

## Phase 7 — Scheduling and deploy

**What gets built:**
- GitHub Actions workflow that runs the whole pipeline on a daily cron schedule.
- Secrets (the Anthropic API key) stored in GitHub's encrypted repo secrets, not in code.
- Automatic rebuild and deploy of the static site on every successful run.

**What you need to decide:**
- **Hosting provider** for the static site — I'll bring options (GitHub Pages, Netlify, Cloudflare Pages) with a recommendation once we're here; all are free at this scale.
- **Domain name**, if you want a custom one instead of the host's default subdomain.

**Teaching note:** "Cron" just means "run on a schedule" — a GitHub Actions cron entry like `0 11 * * *` means "11:00 UTC every day." We'll pick a time that lands sensibly for Memphis local time.

**Done when:**
- The site updates on its own once a day without you running anything by hand.
- You can verify: check the Actions tab on GitHub the morning after setup and see a green run, then confirm the live site reflects that run's data.

---

## Phase 8 — Monitoring

**What gets built:**
- A check that flags when a given employer's scraper returns zero results or errors out, distinct from that employer legitimately having zero open roles.
- A notification path when something breaks (likely: a failure summary posted somewhere you'll actually see it — email or similar; we'll decide the channel here).

**What you need to decide:**
- Where you want to be notified (email is simplest and free; other options exist if you already use something like Slack).

**Done when:**
- Deliberately breaking one scraper (e.g., pointing it at a bad URL) triggers a visible alert within one daily run cycle, while the other 29 employers keep working.

---

## Phase 9 — Scale to all 30

**What gets built:**
- Work through the remaining employers in Phase 0's difficulty order, reusing the Greenhouse/Lever/Ashby-style scrapers as templates and building out hand-rolled scrapers last.
- Each employer's scraper fails independently — one broken site never blocks the rest (already true by construction from Phase 1 onward, verified at scale here).

**Done when:**
- All 30 employers are integrated, the site reflects real postings from all of them, and Phase 8's monitoring is watching all 30.

---

## Open questions log

Running list of things surfaced mid-project that don't fit neatly into a single phase above:
- (none yet)
