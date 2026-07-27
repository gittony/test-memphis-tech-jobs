# Memphis Tech Jobs Board — Plan

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

Decisions locked in so far:
- **Repo**: private GitHub repo, `github.com/gittony/test-memphis-tech-jobs`, created and pushed in Phase 0.
- **Language**: Node.js / JavaScript throughout (pipeline + site), so you're not context-switching languages.
- **Cost target**: under $5/month, excluding domain.
- **AI model**: Claude Haiku 4.5 (`claude-haiku-4-5`) for classification only, used sparingly (Phase 4).
- **Storage**: one combined `data/jobs.json` file, committed to the repo — a plain JSON array of all employers' postings.
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

**Why ATS triage matters (a quick primer):** Companies rarely build their own job-listing pages from scratch — they buy or embed a hosted "applicant tracking system." Several of the popular ones (Greenhouse, Lever, Ashby) expose a public, undocumented-but-stable JSON API you can call directly, e.g. `boards-api.greenhouse.io/v1/boards/{company}/jobs`. That's vastly easier and more reliable than parsing HTML, because the ATS vendor won't change its JSON shape as often as a company redesigns its careers page. Workday, iCIMS, and Taleo are enterprise systems — technically possible to query but fussier (session tokens, POST-based search, inconsistent per-tenant setup). "Hand-rolled" sites have no shortcut — we'd scrape HTML and hope the markup doesn't change. Sorting employers by ATS up front means we build the easy, high-leverage scrapers first and know exactly what we're up against for the rest.

**Important finding from the triage below:** none of your 30 employers run on Greenhouse, Lever, Ashby, or SmartRecruiters — the ATS family with the cleanest, best-documented public JSON APIs. The real world here skews toward large enterprises and government/institutional employers, who run Workday, iCIMS, Taleo, Oracle Recruiting Cloud, or NEOGOV instead. This changes the original "start with Greenhouse/Lever" assumption from the brief — see the Phase 1 pick below.

**Done when:**
- Repo exists on GitHub (private), cloned locally, `.env` correctly ignored by git. ✅ Done — `github.com/gittony/test-memphis-tech-jobs`.
- A table (in this file or a companion doc) listing all 30 employers, their ATS, and a difficulty rank. ✅ Done — see table below.
- You can verify: `git log` shows an initial commit, `git remote -v` shows your GitHub repo, and `cat .gitignore` includes `.env`.

**Phase 0 status: `[x]` done.**

### Employer ATS triage (researched 2026-07-24)

| # | Employer | ATS | Confidence | Notes |
|---|----------|-----|------------|-------|
| 1 | FedEx / FedEx Dataworks | Phenom (custom CMS) + Paradox.ai chat; FedEx Freight subsidiary uses Workday | Low | Backend ATS behind the main corporate site isn't exposed. Verify manually before scraping. |
| 2 | St. Jude Children's Research Hospital | Workday | High | `stjude.wd1.myworkdayjobs.com` |
| 3 | ALSAC | Workday | High | Shares Workday tenant with St. Jude |
| 4 | AutoZone | Oracle Recruiting Cloud | High | `hcmUI/CandidateExperience` URL pattern |
| 5 | Sedgwick | Workday | High | `sedgwick.wd1.myworkdayjobs.com` |
| 6 | First Horizon | SuccessFactors (probable) | Low | Could not independently confirm; verify manually |
| 7 | Methodist Le Bonheur Healthcare | Workday | High | TalentBrew front-end over Workday backend |
| 8 | Baptist Memorial Health Care | iCIMS | High | `employees-bmhcc.icims.com` |
| 9 | Smith & Nephew | Workday (probable) | Medium | Referenced via recruiting email domain, no direct board URL confirmed |
| 10 | Medtronic | Workday | High | `medtronic.wd1.myworkdayjobs.com` — clean, direct board URL |
| 11 | Stryker | Workday | High | `stryker.wd1.myworkdayjobs.com` — clean, direct board URL |
| 12 | MicroPort Orthopedics | UKG Pro / UltiPro | High | `recruiting.ultipro.com` |
| 13 | Evernorth / Accredo (Cigna) | Workday | High | `cigna.wd5.myworkdayjobs.com` |
| 14 | University of Memphis | Oracle Recruiting Cloud | High | Confirmed via live redirect to Oracle Fusion |
| 15 | University of Tennessee Health Science Center | Taleo | High | `ut.taleo.net` |
| 16 | Orgill | iCIMS | High | `jobs-orgill.icims.com` |
| 17 | Helena Agri-Enterprises | ADP Recruiting (RTI) | High | JS-heavy candidate portal |
| 18 | Mid-America Apartment Communities (MAA) | Workday | High | `maa.wd1.myworkdayjobs.com` |
| 19 | TruGreen | Paradox (Olivia AI) | High | Conversational chat UI, no plain job list |
| 20 | Rentokil Terminix | Workday | High | `terminix.wd1.myworkdayjobs.com` |
| 21 | IMC Companies | Unclear (corporate roles); Tenstreet for driver hiring | Low | Corporate/IT ATS not confirmed — needs manual check |
| 22 | Buckman | Jobvite | High | `jobs.jobvite.com/buckman` |
| 23 | Raymond James (Memphis) | Workday | High | `raymondjames.wd1.myworkdayjobs.com` |
| 24 | Mueller Industries | Dayforce (Ceridian) | High | JS-rendered SPA candidate portal |
| 25 | International Paper | Oracle Recruiting Cloud | High | Confirmed via live redirect |
| 26 | Memphis Light, Gas and Water (MLGW) | Taleo | High | `mlgw.taleo.net` |
| 27 | City of Memphis | NEOGOV (governmentjobs.com) | High | `governmentjobs.com/careers/memphistn` |
| 28 | Shelby County Government | Oracle Recruiting Cloud | High | Confirmed via county job-openings page |
| 29 | Memphis-Shelby County Schools | iCIMS | High | Multiple department-specific subdomains |
| 30 | Naval Support Activity Mid-South (Millington) | USAJOBS.gov (federal) | High | Genuinely public, documented federal API |

### Difficulty ranking (easiest → hardest)

1. **USAJOBS.gov** — Naval Support Activity Mid-South. Actually has an official, documented public API with an API key. Arguably the single easiest employer on the list, though likely few or no software/data roles at this installation.
2. **Workday** (largest bucket, ~12 employers) — St. Jude, ALSAC, Sedgwick, Methodist Le Bonheur, Medtronic, Stryker, Evernorth/Accredo, MAA, Rentokil Terminix, Raymond James, plus probable Smith & Nephew and FedEx Freight. Undocumented but consistent `/wday/cxs/<tenant>/<site>/jobs` JSON endpoint across all tenants — learn it once on one employer, reuse the pattern for the rest.
3. **iCIMS** — Baptist Memorial, Orgill, Memphis-Shelby County Schools. Semi-consistent job-search structure, scrapable.
4. **Taleo** — UTHSC, MLGW. Older but predictable `careersection` URL scheme.
5. **Oracle Recruiting Cloud** — AutoZone, University of Memphis, International Paper, Shelby County Government. Internal REST API exists but is poorly documented and tenant-specific.
6. **NEOGOV** — City of Memphis. Consistent structure across all its government clients.
7. **Niche single-vendor / JS-heavy portals (harder)** — Helena Agri (ADP RTI), MicroPort (UKG/UltiPro), Buckman (Jobvite), Mueller Industries (Dayforce) — each needs its own investigation, JS-rendered candidate portals with no clean public API.
8. **Conversational / unclear front-ends (hardest)** — TruGreen (Paradox chat UI, no plain job list), First Horizon (unconfirmed), IMC Companies (corporate-role ATS unconfirmed), FedEx main corporate site (Phenom + Paradox chat, backend unconfirmed).

**Caveat:** low-confidence entries (FedEx, First Horizon, Smith & Nephew, IMC Companies) hit fetch errors or lacked a confirming link during automated research — worth a manual look before writing a scraper for them, and before ruling them out as "hard."

---

## Phase 1 — One scraper, end to end

**What gets built:**
- Pick the single easiest employer from the Phase 0 ranking. Since none of your 30 employers run Greenhouse/Lever/Ashby, and Workday is by far the largest well-documented bucket (~12 employers), the recommendation is to start with **Medtronic** or **Stryker** — both gave clean, directly-confirmed Workday board URLs during triage, so we can be confident the pattern will actually work before we invest more time. Whatever we learn scraping Workday here carries over to ~11 other employers with minimal changes.
- A script that fetches that employer's postings from the ATS API and prints normalized JSON to the console — title, location string, URL, posted/updated date, department if available.
- No filtering, no storage, no AI. Just: fetch → shape it into a consistent object → print it.

**What you need to decide:**
- Nothing — this is a throwaway proof-of-concept script, kept deliberately narrow.

**Teaching note:** We'll talk about *rate limiting* and *politeness* here even for one employer — setting a descriptive `User-Agent` header with a contact email, and structuring the fetch so it's trivial to add a delay later. Small thing to get right once rather than retrofit across 30 scrapers.

**Done when:**
- Running `node scripts/fetch-<employer>.js` prints an array of job objects to your terminal, each with the same fields, for a real employer's live postings.

### Phase 1 status: built, awaiting your verification

Picked **Medtronic** (`scripts/fetch-medtronic.js`). It calls Medtronic's Workday endpoint directly (`medtronic.wd1.myworkdayjobs.com/wday/cxs/medtronic/MedtronicCareers/jobs`) and prints normalized JSON — `id`, `title`, `location`, `url`, `postedOn`, `company`, `sourceAts` — for every open posting, unfiltered.

**A real bug we hit and fixed, worth knowing about for every other Workday employer (~11 more):** Workday's API caps `limit` at 20 per request (asking for more returns an HTTP 400), and it only reports the correct total result count on the *first* page — every page after that reports `total: 0` even though it keeps returning real, additional jobs. The fix: page in batches of 20, and keep going until a page comes back with fewer than 20 results (the real end-of-data signal), instead of trusting the `total` field past page 1. This is now handled in `fetch-medtronic.js` and should be copied into every future Workday scraper.

**What we found running it live:** Medtronic currently has 1,124 open postings globally, matching what the site itself reports. Only 5 are Memphis-based, and none of those 5 are software/data roles (they're facilities/quality/inventory positions) — a real, useful example of exactly the problem this project exists to solve (an HQ-adjacent company posting broadly, with almost nothing locally relevant). Title and location filtering are still Phase 3, not built yet — this script intentionally prints everything, unfiltered.

**How to verify yourself:**
1. Run `node scripts/fetch-medtronic.js > /tmp/medtronic.json`
2. It should take about 20-30 seconds (pages through ~57 requests with a polite 300ms delay between each) and print a status line like `Fetched 1124 postings...` to your terminal (stderr) when done.
3. Open `/tmp/medtronic.json` and confirm it's a JSON array where each entry has `id`, `title`, `location`, `url`, `postedOn`, `company`, `sourceAts`.
4. Spot check a couple of `url` values by opening them in a browser — they should load real, live Medtronic job postings.

**Phase 1 status: `[x]` verified working — approved, moved on to Phase 2.**

---

## Phase 2 — Normalize and store

**What gets built:**
- The canonical job record shape (title, company, location, url, department, postedAt, firstSeenAt, lastSeenAt, status, id, sourceAts).
- A stable ID scheme so the same posting is recognized run-to-run even if wording changes slightly (likely a hash of company + ATS's own job ID, not a hash of the full content).
- Read-modify-write logic against a JSON data file: new postings get added, postings seen again get `lastSeenAt` bumped, nothing gets duplicated.

**What you need to decide:**
- ~~Storage format~~ — **decided: one combined file, `data/jobs.json`**, a single JSON array holding every employer's postings. Simplest for the eventual static site generator to read, and easiest for you to eyeball the whole dataset at once.

**Teaching note:** "Stable IDs" is the crux of re-run safety. If we ID a posting by hashing its title+location text, an employer editing a typo in the description would make our pipeline think it's a brand-new job. Keying off the ATS's own internal job ID (which Medtronic's Workday board already provides as a requisition number like `R72844`, and doesn't change) avoids that. Our IDs look like `workday:medtronic:R72844` — ATS + company + the vendor's own ID — so they stay unique once we add more employers.

**Done when:**
- Running the Phase 1 scraper through this new storage step twice in a row produces zero duplicates and correct `lastSeenAt` timestamps.
- You can verify: `cat data/jobs.json` (or equivalent) before and after a second run — same job count, updated timestamp.

### Phase 2 status: built and verified

New files: `lib/store.js` (the reusable `loadJobs`/`saveJobs`/`mergeJobs` logic — this is written once and will be reused by every employer's script, not just Medtronic's) and `scripts/run-medtronic.js` (fetches + merges + writes `data/jobs.json`, printing a one-line summary).

Ran it twice against live Medtronic data:
- **Run 1:** `Medtronic: 1126 new, 0 updated, 0 unchanged. Total stored: 1126.`
- **Run 2, immediately after:** `Medtronic: 0 new, 0 updated, 1126 unchanged. Total stored: 1126.`
- Verified directly: all 1,126 `id`s are unique (no duplicates), and every record's `lastSeenAt` advanced on the second run while `firstSeenAt` stayed put — exactly the re-run safety guarantee this phase exists to prove.

**Known, deliberate gap:** if a posting disappears from Medtronic's feed tomorrow, this code currently just... leaves its old record alone forever. Deciding when a missing posting should flip to `expired` is explicitly Phase 6's job, not this one.

**Heads up on repo size:** `data/jobs.json` is committed to git and currently holds all 1,126 of Medtronic's postings worldwide, unfiltered — about 400KB. That's expected right now (Phase 3, next, is what teaches the pipeline to only keep Greater Memphis software/data roles), so don't be surprised the file is big and full of jobs in Hyderabad and Vietnam today. It'll shrink dramatically once filtering is wired in.

**How to verify yourself:**
1. Run `node scripts/run-medtronic.js` twice in a row.
2. First run should print something like `1126 new, 0 updated, 0 unchanged`.
3. Second run should print `0 new, 0 updated, 1126 unchanged` — same total both times.
4. Open `data/jobs.json` and check a record's `firstSeenAt` vs `lastSeenAt` — after the second run, `lastSeenAt` should be later than `firstSeenAt`.

---

## Phase 3 — Rule-based filtering

**What gets built:**
- A title-matching rule set for software/data roles (allow-list of keywords/patterns: "Software Engineer," "Data Analyst," "DevOps," etc., with sensible exclusions like "Sales Engineer" if that's noise).
- A Greater Memphis location allow-list (Memphis, Germantown, Collierville, Bartlett, Cordova, Southaven MS, Olive Branch MS, and other suburbs — we'll finalize the list together).
- A verdict per posting: **pass** (clearly a fit), **fail** (clearly not — wrong role or wrong location), or **uncertain** (ambiguous location string like "Remote," "Multiple Locations," or a role title that's borderline).

**What you need to decide:**
- ~~Greater Memphis municipality list~~ — **decided: Memphis + immediate TN suburbs** — Memphis, Germantown, Collierville, Bartlett, Cordova, Millington, Arlington, Lakeland. (Not the full official Memphis MSA, which would have added Mississippi/Arkansas commuter towns — you chose the smaller, simpler list.)
- ~~Manager/director titles~~ — **decided: included.** "Enterprise Software Engineering Manager," "AI/Data Science Team Manager," etc. all count.
- ~~General IT roles (business analyst, help desk, ERP)~~ — **decided: excluded.** Only clearly technical roles count — IT Developer/Architect/Technologist, cybersecurity, cloud, data science, etc. IT Business Analyst, IT support/help desk, and SAP/ERP admin roles fail on title even though they're in an "IT" department.

**Done when:**
- Running the filter against your stored job data produces three clearly separated buckets, and spot-checking a handful from each bucket matches your own judgment.
- You can verify: a console summary like `42 pass / 61 fail / 8 uncertain`, plus the ability to print the uncertain bucket for manual review.

### Phase 3 status: built and verified

New files: `lib/filter.js` (the rule set — this is the one file you'll come back to tune as we onboard more employers) and `scripts/filter-jobs.js` (prints the summary; pass a bucket name like `uncertain` as an argument to list its contents).

**Design choice worth knowing:** title matching is a whitelist of specific tech-role phrases ("software," "data scientist," "cybersecurity," "cloud engineer," etc.) rather than one broad word like "engineer." That's deliberate — a bare "engineer" pattern would have swept in Medtronic's Quality Engineers, Manufacturing Engineers, and Supplier Quality Engineers, none of which are software/data roles. Because the whitelist requires a specific tech phrase, generic manufacturing/clinical/sales titles fail automatically just by not matching anything — no separate exclusion list needed for those. One real gap this caught during testing: "Cyber Info Assurance Analyst" didn't match a too-narrow `cybersecurity`-only pattern, so the rule is now `\bcyber\b` (broader) instead.

**Result running against Medtronic's real, current 1,126 postings:**
```
0 pass / 1112 fail / 14 uncertain
```
- **0 pass** is expected, not a bug — Phase 1/2 already showed Medtronic's 5 Memphis-based postings are all facilities/quality/inventory roles, and this confirms none of Medtronic's ~110 tech-titled roles anywhere are actually located in Memphis right now.
- **95** postings failed on location alone (real tech titles — Cybersecurity Specialist, Software Engineer, etc. — just located in Hyderabad, India, Medtronic's main engineering hub).
- **14 uncertain**, all software/security titles whose location field just says "2 Locations," "7 Locations," etc. with no detail. *(Update from Phase 4: it turned out all 14 of these were resolvable by rules too — see below. AI ended up not being needed at all for Medtronic's current data.)*
- One good sanity check: "Senior Program Manager IBP – CST – Lafayette, CO **or Memphis, TN**" correctly fails — the location matches, but "Program Manager" isn't a software/data title, so the title rule (correctly) blocks it regardless of location.
- Two borderline titles I chose to exclude by default, worth a second look once we're onboarding employers with real Memphis tech postings to test against: "Supply Chain Data Solutions Architect" (has "Data" but is a supply-chain role) and "Senior IT Scrum Master" (agile delivery role, not hands-on engineering).

**How to verify yourself:**
1. Run `node scripts/filter-jobs.js` — should print `0 pass / 1112 fail / 14 uncertain (of 1126 total)`.
2. Run `node scripts/filter-jobs.js uncertain` — should list 14 titles, all software/security roles with vague multi-location text.
3. Run `node scripts/filter-jobs.js fail | head -20` and spot check a few — should all be clearly non-tech roles or tech roles located outside Memphis.

---

## Phase 4 — AI enrichment

**What gets built:**
- A call to the Anthropic API (Claude Haiku 4.5) for every posting in the **uncertain** bucket only.
- A structured JSON response per posting: location verdict, confidence score, one-line reason, role tags, seniority.
- A log of every API call (input sent, output received) so you can audit decisions later.
- A per-run cost estimate printed to the console (token counts × Haiku pricing).

**What you need from me to flag now:** you'll need an Anthropic API key by this phase. It goes in `.env` as `ANTHROPIC_API_KEY=...` — never committed, and `.env` is already gitignored from Phase 0. ✅ Done — you added it.

**Teaching note:** This is the one phase touching a paid API, so we'll keep the blast radius small: only ambiguous postings get sent (should be a handful per employer, not hundreds), and I'll show you the exact prompt so you know what's being asked and paid for.

**Done when:**
- Running the pipeline end to end sends only the uncertain bucket to the API, merges the results back into your job data, and prints a cost estimate under a cent for a normal day's run.
- You can verify: the log file shows one entry per uncertain posting, and the estimated cost matches roughly (uncertain count × ~$0.001).

### Phase 4 status: built and verified

New files: `lib/ai-classify.js` (the Claude Haiku 4.5 call — structured JSON output via `output_config.format`, no manual prompt-parsing needed) and `scripts/enrich-uncertain.js` (the full pipeline: rules → location resolver → AI for whatever's left, plus audit logging and cost estimate).

**A genuinely useful discovery from building this phase:** while wiring up the AI step, I found that Workday's per-job detail page reveals the *real* location list for "N Locations" postings — for free, no AI needed (this is what became the location resolver from earlier). Running it against the 14 postings flagged uncertain in Phase 3 resolved **all 14 by rules alone**:
- **2 pass** — real Memphis-eligible postings! "Security Engineering Manager" and "Senior Manager - Cybersecurity OT Manufacturing & Distribution" both list Memphis, TN among their multiple locations. These are Medtronic's first two postings that would actually appear on the site.
- **12 fail** — the other locations in their list (Minnesota, Massachusetts, Texas, etc.) don't include Memphis.
- **0 remained genuinely uncertain** — meaning Claude Haiku wasn't needed at all for Medtronic's data today. That's the ideal outcome for a cost-conscious pipeline: rules resolve everything they can, and AI is reserved for what's actually left.

**Since real data didn't exercise the AI call, I verified it with a synthetic smoke test** (`node scripts/enrich-uncertain.js --smoke-test`) — a made-up "Senior Data Engineer, Remote - United States" posting, clearly labeled as fake in the code and in the log. Claude Haiku correctly returned:
```
fail (confidence 0.99) — "Remote - United States" with no specific tie to Greater Memphis;
a fully remote role without location-specific requirements doesn't count even if the company is HQ'd there.
```
Cost for that one real API call: **$0.001**. Logged in full to `data/ai-log.jsonl` (job title, location, the exact verdict/confidence/reason/tags Claude returned, token usage, and cost) — that file is the audit trail this phase promises, and it's committed to the repo so the history builds up over time.

**How to verify yourself:**
1. Run `node scripts/enrich-uncertain.js` — with today's data it should print `0 genuinely need AI` and `Nothing needs AI review today. $0.00 spent.`
2. Run `node scripts/enrich-uncertain.js --smoke-test` — should make exactly one real API call, print a verdict for the fake "Smoke Test Co" posting, and report a cost around $0.001.
3. Open `data/ai-log.jsonl` and confirm there's one JSON line per AI call ever made, each with a verdict, reason, and cost.

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

### Phase 5 status: built and verified

New pieces:
- `scripts/build-listings.js` — ties Phases 3+4 together for real: runs the rule filter, then the location resolver, then AI for whatever's left, and writes the final result to `data/listings.json`. This is the file everything downstream (the site, and later expiry) reads from — `data/jobs.json` stays the raw, unfiltered record of everything ever seen.
- `site/index.html`, `site/styles.css`, `site/app.js` — the static site itself. Plain HTML/CSS/JS, no framework, no build tool. `app.js` fetches `./data/listings.json` at runtime and renders it client-side; search and the company filter both run entirely in the browser.
- `scripts/build-site.js` — copies `data/listings.json` into `site/data/listings.json` so the page can fetch it.
- `scripts/serve.js` — a ~25-line static file server using only Node's built-in `http` module. Needed because browsers block `fetch()` against `file://` URLs, so opening `index.html` directly wouldn't load the data — no new dependency for this, since Node already ships everything required.

**Security note:** postings come from external, scraped career sites, so I treated their text as untrusted — the page builds every element via DOM APIs (`textContent`) rather than dropping raw strings into HTML, and only allows `http(s)://` links through, so a stray character (or a genuinely malicious feed down the line) can't inject markup or a `javascript:` link.

**Verified with a real screenshot** (via a headless browser), not just by reading the code: the page loads, shows "2 postings," and both current listings render correctly — including "Memphis, Tennessee, United States of America (+ 7 other locations)" for the Security Engineering Manager role, which is the resolved location data from Phase 4 showing through, not the raw "8 Locations" placeholder text.

**How to verify yourself:**
1. Run these three in order: `node scripts/build-listings.js`, `node scripts/build-site.js`, `node scripts/serve.js`.
2. Open `http://localhost:8080` in your browser.
3. You should see "Memphis Tech Jobs," a search box, a company dropdown, and 2 posting cards (today's real Medtronic results).
4. Type "Security" in the search box — should narrow to 1 result. Clear it, then pick "Medtronic" from the company dropdown — should show both (since both are Medtronic). Click a job title — should open the real Medtronic posting in a new tab.
5. Stop the server with Ctrl+C when done.

**Addendum (post-Phase 9): real posted dates instead of relative text.** Workday's search API only ever gives us relative text ("Posted Today," "Posted 11 Days Ago," "Posted 30+ Days Ago") — no actual date field. `lib/posted-date.js` converts that into a real calendar date using the moment each posting was scraped (`lastSeenAt`) as the reference point, since the relative text was accurate as of that scrape. `build-listings.js` computes `postedOnDate`/`postedOnApprox` once for every listing; `site/app.js` displays "Posted July 25, 2026" normally, or "Posted before June 25, 2026" when the source bucket was the capped "30+ Days Ago" (honest about the fact that we only know a lower bound there, not an exact day). Verified with a real screenshot showing both cases rendering correctly.

**Addendum (post-Phase 9): a real page per job, at `/job/{id}/`, instead of linking straight out.** Listing cards used to link directly to the original ATS posting. Investigation found the three ATS sources aren't equally capable of supplying a description for a detail page:
- **Workday** already has a per-job detail endpoint (`fetchWorkdayJobDetail`, previously only used to resolve ambiguous "N Locations" text) that returns a real HTML `jobDescription`.
- **iCIMS** has no detail endpoint, but a job's own URL (already stored as `job.url`) returns server-rendered HTML — though the description isn't one contiguous block, it's split across one `<div class="iCIMS_Expandable_Text">` per section (Summary, Essential Job Functions, Qualifications, etc.); a naive "next sibling class name" boundary search doesn't work, since chrome class names like `iCIMS_InfoMsg` also appear *inside* the real content.
- **Oracle Recruiting Cloud** (Hilton) only exposes a short (~500 char) plain-text `ShortDescriptionStr`, already present in the search response at zero extra cost — the real job page is a client-rendered SPA with no server-rendered body, so nothing more is realistically obtainable.

Given that gap, and to limit copyright/reuse exposure from reproducing scraped content, the detail page shows a short **excerpt** (sanitized, ~600 visible characters, truncated at a block or word boundary) plus a prominent link back to the original posting — not full verbatim reproduction. This also papers over the Oracle gap gracefully: its "excerpt" is just its already-short summary.

New pieces:
- `lib/icims.js` — added `fetchIcimsJobDescription(jobUrl)`, extracting and joining every `iCIMS_Expandable_Text` block (verified against a real MSCS posting).
- `lib/oracle-recruiting.js` — `normalize()` now also captures `ShortDescriptionStr` as `description`, free at scrape time.
- `lib/sanitize-description.js` — new dependency `sanitize-html` (nothing sanitization-capable existed before; raw scraped HTML can't safely go straight into a page). Strips to a conservative tag allowlist with zero attributes (no links/images/scripts/iframes/inline styles survive), drops empty/whitespace-only `<p>` tags (Workday's source HTML is full of these, used for spacing in the original CMS), and truncates at a block boundary so cuts never land mid-tag.
- `lib/render-job-page.js` — the page template; escapes plain-text fields (title/company/location/date) separately from the pre-sanitized excerpt, matching the same untrusted-content posture `site/app.js` already established for the list view.
- `lib/slug.js` — turns a job id like `workday:medtronic:R71386` into a URL-safe `workday-medtronic-R71386` path segment. Duplicated verbatim as a small inline function in `site/app.js`, since the site has no build step to share a Node module with the browser.
- `scripts/build-job-pages.js` — new standalone script (same one-script-per-phase shape as `build-listings.js`/`build-site.js`), run between them in the workflow. Only fetches descriptions for postings that already pass `classify()` (today: 18 of ~4,900+ raw postings) — not at scrape time — and deletes any `site/job/` subdirectory no longer in the current listings before regenerating everything fresh, so expired jobs' pages don't linger forever at live URLs.
- `scripts/serve.js` — fixed to resolve directory requests (e.g. `/job/{slug}/`) to that directory's `index.html`, the same way GitHub Pages does automatically but the local preview server didn't.
- `site/app.js` — listing card titles now link to the internal `/job/{slug}/` page instead of straight to the external posting; the outbound link moved to the detail page's "View original posting" button.

**Failure handling** mirrors the exact pattern from `resolve-locations.js` (and the Phase 9 incident where an unhandled Workday 403 once crashed the whole pipeline): every per-job fetch is wrapped in try/catch, logs, and falls through — never throws out of the loop. A failed fetch renders "Full description unavailable — view the original posting for full details," with the outbound link still present regardless (it's built purely from `listing.url`).

**How to verify yourself:**
1. Run `node scripts/build-listings.js`, then `node scripts/build-job-pages.js`, then `node scripts/build-site.js`, then `node scripts/serve.js`.
2. Open `http://localhost:8080`, click a listing title — should land on `/job/{slug}/`, not the external site.
3. That page should show title/company/location/posted date, a sanitized excerpt (or the fallback message), a working "View original posting" link, and a working "Back to all postings" link.
4. Sanity-check the sanitizer: `node -e 'import("./lib/sanitize-description.js").then(({sanitizeAndExcerpt}) => console.log(sanitizeAndExcerpt("<script>alert(1)</script><img src=x onerror=alert(1)><p>Real text.</p>").excerptHtml))'` — output should be exactly `<p>Real text.</p>`, no script/img survives.

---

## Phase 6 — Expiry logic

**What gets built:**
- A diff step comparing each day's scrape against the last for a given employer.
- Postings missing from the latest scrape get marked `expired` — but only after **two consecutive** missed runs, so one transient scrape failure doesn't wipe out an employer's whole listing set.
- Expired postings drop out of the site's default view (but stay in the data file, in case you want a "recently closed" view later).

**Done when:**
- Simulating a missing posting (temporarily editing test data) shows it survive one missed run, then flip to expired on the second.
- You can verify by inspecting the job record's status field across two manually-triggered runs.

### Phase 6 status: built and verified

`lib/store.js`'s `mergeJobs()` now tracks two new fields on every stored job: `status` (`active` or `expired`) and `missingRuns` (a counter). Every posting present in a fresh scrape resets to `status: "active", missingRuns: 0`. A posting absent from a scrape gets `missingRuns` bumped by one; it only flips to `status: "expired"` once `missingRuns` reaches 2 — one bad scrape can't wipe out an employer's whole listing set, matching the brief's grace-period requirement exactly. If an expired posting ever reappears, it reactivates cleanly (`status` back to `active`, `missingRuns` back to 0).

`scripts/build-listings.js` now excludes `status: "expired"` postings before running the rule/AI pipeline — they stay in `data/jobs.json` forever (the full history), but never reach `data/listings.json` or the site.

**Verified two ways:**
1. **Simulated** (`node scripts/verify-expiry.js`) — exactly what the brief asked for: a synthetic posting is fed through `mergeJobs()` across 4 fabricated runs (present → missing once → missing twice → reappears), and every one of the 6 assertions passes: it survives the first miss as `active`, flips to `expired` exactly on the second consecutive miss, and cleanly reactivates when it comes back.
2. **Real** — ran the actual Medtronic pipeline again (`node scripts/run-medtronic.js`). All 1,131 stored postings now carry `status: "active", missingRuns: 0`, confirming the new fields integrate cleanly with real data, not just the simulation. (5 genuinely new postings appeared since the last run too — Medtronic's feed keeps moving, as expected.)

**How to verify yourself:**
1. Run `node scripts/verify-expiry.js` — should print 6 lines starting with `ok -` and end with `All expiry logic checks passed.`
2. Run `node scripts/run-medtronic.js` again for real, then check a record in `data/jobs.json` — it should have `"status": "active"` and `"missingRuns": 0`.
3. Run `node scripts/build-listings.js` and confirm the "expired posting(s) excluded" line prints `0` right now (nothing's actually expired yet — Medtronic hasn't dropped either of our 2 passing postings).

---

## Phase 7 — Scheduling and deploy

**What gets built:**
- GitHub Actions workflow that runs the whole pipeline on a daily cron schedule.
- Secrets (the Anthropic API key) stored in GitHub's encrypted repo secrets, not in code.
- Automatic rebuild and deploy of the static site on every successful run.

**What you need to decide:**
- ~~Hosting provider~~ — **decided: GitHub Pages.** This meant making the repo public first, since GitHub Pages only supports private repos on paid plans — you already flipped `github.com/gittony/test-memphis-tech-jobs` to public.
- ~~Domain name~~ — **decided: the free subdomain for now** (`gittony.github.io/test-memphis-tech-jobs`). Adding a custom domain later is a small, isolated change.

**Teaching note:** "Cron" just means "run on a schedule" — a GitHub Actions cron entry like `0 11 * * *` means "11:00 UTC every day." We'll pick a time that lands sensibly for Memphis local time.

**Done when:**
- The site updates on its own once a day without you running anything by hand.
- You can verify: check the Actions tab on GitHub the morning after setup and see a green run, then confirm the live site reflects that run's data.

### Phase 7 status: `[x]` done and verified live

New file: `.github/workflows/daily-pipeline.yml`. It runs daily at 11:00 UTC (~5-6am Memphis time, depending on daylight saving) and can also be triggered manually from GitHub's Actions tab any time. Each run: fetches Medtronic's postings, classifies/enriches them (calling Claude Haiku only for whatever rules can't resolve), rebuilds the site, commits the updated data files back to the repo, and deploys `site/` to GitHub Pages.

**Two things only you can do, since they require clicking around in your GitHub account settings:**

1. **Add your Anthropic API key as a repo secret** (so the workflow can use it without it ever being in the code):
   - Go to `github.com/gittony/test-memphis-tech-jobs/settings/secrets/actions`
   - Click **New repository secret**
   - Name: `ANTHROPIC_API_KEY` — Value: the same key from your local `.env` file
   - Save

2. **Turn on GitHub Pages, sourced from GitHub Actions** (this is a one-time setting, not something the workflow file can configure itself):
   - Go to `github.com/gittony/test-memphis-tech-jobs/settings/pages`
   - Under **Build and deployment → Source**, choose **GitHub Actions** (not "Deploy from a branch")
   - Save

Once both are done, go to the **Actions** tab and manually run the "Daily pipeline and deploy" workflow once (click it → **Run workflow**) rather than waiting for tomorrow's cron — that's the fastest way to confirm everything actually works end to end.

**How to verify yourself:**
1. Complete the two steps above.
2. Go to the **Actions** tab, click **Daily pipeline and deploy** → **Run workflow** → **Run workflow** (the button appears since we added `workflow_dispatch`).
3. Watch it run — should take under a minute. All steps should go green.
4. Once it finishes, GitHub Pages will show the live URL under Settings → Pages (something like `https://gittony.github.io/test-memphis-tech-jobs/`). Open it and confirm you see the same 2 postings as your local preview.
5. Check that `data/jobs.json` in the repo got a new commit from `github-actions[bot]` (or no commit at all if nothing changed — either is correct behavior).

**Confirmed live:** [https://gittony.github.io/test-memphis-tech-jobs/](https://gittony.github.io/test-memphis-tech-jobs/) — the scheduled run already produced a real `github-actions[bot]` commit ("Automated data refresh") before this was even checked, confirming the full daily loop (fetch → classify → build → commit → deploy) works unattended. Also bumped `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages` to their latest Node 24-native major versions to clear a Node 20 deprecation warning GitHub surfaced on the first run.

---

## Phase 8 — Monitoring

**What gets built:**
- A check that flags when a given employer's scraper returns zero results or errors out, distinct from that employer legitimately having zero open roles.
- A notification path when something breaks (likely: a failure summary posted somewhere you'll actually see it — email or similar; we'll decide the channel here).

**What you need to decide:**
- ~~Notification channel~~ — **decided: an auto-filed GitHub Issue.** No new secrets or accounts (the default `GITHUB_TOKEN` already has the needed permission once we grant it `issues: write`), and you already get GitHub's own email notifications for new issues on your repo.

**Done when:**
- Deliberately breaking one scraper (e.g., pointing it at a bad URL) triggers a visible alert within one daily run cycle, while the other 29 employers keep working.

### Phase 8 status: built and verified

New files:
- `lib/scraper-health.js` — `recordScraperRun()` upserts a per-employer entry into `data/scraper-health.json` (employer, ok, jobCount, error, ranAt). `classifyEmptyResult()` is the "zero results vs. legitimately zero roles" rule: an empty result only counts as suspicious if that same employer's last successful run had jobs — a scraper going from 1,129 postings to 0 overnight is almost certainly broken, whereas a smaller employer that's simply not hiring right now shouldn't page anyone.
- `scripts/check-scraper-health.js` — reads `data/scraper-health.json` and, if anything is unhealthy, opens a GitHub Issue titled "Scraper health alert" (or comments on it if one's already open, so a multi-day outage doesn't spam new issues). Once every scraper reports healthy again, it comments and auto-closes that issue. Uses the GitHub REST API directly via `fetch` — no new dependency. Supports `--dry-run` to print what it would do without a real `GITHUB_TOKEN`, which is how this was verified locally.

Changed files:
- `scripts/run-medtronic.js` — now wraps the fetch in try/catch. A hard failure (network error, bad JSON, etc.) records `ok: false` with the exception message; success runs it through `classifyEmptyResult()` against the previous health entry before recording.
- `.github/workflows/daily-pipeline.yml` — added `issues: write` to `permissions`; the Medtronic fetch step now has `continue-on-error: true` (so one broken employer's step failing doesn't halt classify/build/deploy for everyone else — this becomes more meaningful once Phase 9 adds more employers); added a "Check scraper health" step after the data commit, passing `GITHUB_TOKEN` and `GITHUB_REPOSITORY`.

**Verified locally two ways** (both via `--dry-run`, since there's no real broken scraper to point at right now):
1. Ran the real pipeline end to end — `data/scraper-health.json` correctly recorded `medtronic: ok: true, jobCount: 1129`.
2. Temporarily swapped in a fabricated unhealthy entry (`ok: false`, "returned 0 jobs, previously had 1129") and confirmed `check-scraper-health.js --dry-run` printed the exact issue title and body it would have filed, then restored the real health file afterward.

**How to verify yourself:**
1. Run `node scripts/run-workday-employer.js medtronic` (Phase 9 renamed/generalized this from `run-medtronic.js` — see below) — check `data/scraper-health.json` shows `"employer": "medtronic", "ok": true`.
2. Run `node scripts/check-scraper-health.js --dry-run` — should print `All scrapers healthy.`
3. To see the alert path without waiting for a real failure: back up `data/scraper-health.json`, overwrite it with an entry that has `"ok": false` and an `"error"` string, run `node scripts/check-scraper-health.js --dry-run` again — it should print the issue title/body it would file — then restore the backup.
4. Once this is pushed and run for real in Actions (no `--dry-run`), you can deliberately verify the live path by breaking an employer's tenant/site config temporarily, triggering the workflow, watching a real Issue appear in the **Issues** tab, then reverting and confirming the next run closes it.

---

## Phase 9 — Scale to all 30

**What gets built:**
- Work through the remaining employers in Phase 0's difficulty order, reusing the Greenhouse/Lever/Ashby-style scrapers as templates and building out hand-rolled scrapers last.
- Each employer's scraper fails independently — one broken site never blocks the rest (already true by construction from Phase 1 onward, verified at scale here).

**Done when:**
- All 30 employers are integrated, the site reflects real postings from all of them, and Phase 8's monitoring is watching all 30.

**This is too big to do as one block.** Being tackled in slices, same one-thing-at-a-time approach as every other phase — first slice below, ATS types remaining after that: iCIMS (Baptist Memorial, Orgill, Memphis-Shelby County Schools), Taleo (UTHSC, MLGW), Oracle Recruiting Cloud (AutoZone, University of Memphis, International Paper, Shelby County Government), NEOGOV (City of Memphis), then the niche single-vendor sites (Helena Agri/ADP RTI, MicroPort/UKG, Buckman/Jobvite, Mueller/Dayforce), and finally the unclear/conversational ones (TruGreen, First Horizon, IMC, FedEx).

### Slice 1: Workday employers — built and verified

Refactored the Medtronic-only Phase 1 code into a reusable Workday client, since ~10 more employers all run on the same undocumented CXS API:
- `lib/workday.js` — `fetchWorkdayJobs(employer)` / `fetchWorkdayJobDetail(...)`, generalized from `fetch-medtronic.js` (host/tenant/site/company are now parameters, not hardcoded strings). Also adds a 20-second timeout to every request (see bug below).
- `lib/workday-employers.js` — the config table. Adding an employer is now just one object in this array — everything downstream (scraping, storage, location resolution, monitoring) picks it up automatically.
- `lib/run-workday-employer.js` — the shared "scrape one employer" logic (fetch → merge → record health), used by both a single-employer CLI (`scripts/run-workday-employer.js <key>`, handy for local testing) and the loop that runs every configured Workday employer (`scripts/run-all-workday.js`, what the daily workflow actually calls).
- `scripts/resolve-locations.js` — generalized the same way: it now looks up the right tenant/site by the job's `company` field instead of special-casing Medtronic, so the free "N Locations" resolver works for every Workday employer, not just one.
- Retired `scripts/fetch-medtronic.js` and `scripts/run-medtronic.js` — fully superseded, no callers left.
- `.github/workflows/daily-pipeline.yml` — the "Fetch Medtronic postings" step became "Fetch Workday employers" (`node scripts/run-all-workday.js`). Adding employer #12+ later needs zero workflow changes, Workday or not — only ATS types genuinely new to the pipeline (iCIMS, Taleo, etc.) will need a new step.

**Two real bugs found while scaling to multiple employers — both fixed:**

1. **Cross-employer expiry bug (would have silently broken every employer once a second one existed).** `mergeJobs()` marks any stored job missing from the current `fresh` batch as one run closer to expiring. That's correct when one scraper run always covers *every* job in the store (true with only Medtronic), but with each employer scraped by its own separate run, every other employer's jobs would look "missing" from a run that was never responsible for them — silently expiring all of them within 2 days. Fixed by adding a `scope` filter to `mergeJobs(existing, fresh, { now, scope })`: only jobs `scope` says belong to the employer currently running can accrue a missed run or expire; every other employer's jobs are left untouched. Added a dedicated regression test to `scripts/verify-expiry.js` proving a scoped merge for "Acme Co" doesn't touch "Other Co"'s postings, and verified it against real data too (ran Medtronic and St. Jude back-to-back — both reported the same unchanged counts, neither touched the other).
2. **No timeout on any Workday `fetch()` call.** A real run stalled for 20+ minutes on Smith & Nephew's request with zero CPU activity. Checking the Mac's actual sleep/wake log afterward showed the laptop repeatedly idle/maintenance-sleeping right through that whole window (an errand-away period) — so this was very likely the local machine suspending mid-request, not a genuinely unresponsive Workday tenant. Either way, no `fetch()` should be able to hang indefinitely: a laptop sleeping mid-run locally, or a slow host in GitHub Actions (which never sleeps but could still stall), both need a hard ceiling. Fixed with `signal: AbortSignal.timeout(20_000)` on both the search and detail requests in `lib/workday.js`.

**A real location-format bug, also found at scale:** `matchesMemphisArea()` only matched the spelled-out state name ("Memphis, **Tennessee**"), so a genuinely Memphis-based Sedgwick posting ("Memphis, **TN**") was being excluded — some employers' ATS instances format state as the two-letter postal code instead of the full name. Fixed by also accepting a word-boundaried `\btn\b` match alongside the full "tennessee" check in `lib/filter.js` (word-boundaried specifically so it can't match "tn" as a stray substring of an unrelated word).

**Confirmed working, 10 of 11 employers:** St. Jude, ALSAC, Sedgwick, Stryker, Evernorth (Cigna), Rentokil Terminix, Raymond James, Methodist Le Bonheur, Smith & Nephew, plus Medtronic. Running all of them roughly quadrupled the stored dataset (1,131 → 4,822 raw postings) and took the final Memphis tech listings from 2 to **13** — real postings now showing from ALSAC, Sedgwick, Smith & Nephew, and St. Jude in addition to Medtronic.

**Known gap: Mid-America Apartment Communities (MAA).** Confirmed tenant/site are correct (`maa`/`MAA` — verified directly against the site's own embedded config), but the `/jobs` search endpoint consistently returns an empty-bodied `HTTP_400` straight from Workday's own application server (not a CDN/WAF block — confirmed via response headers), regardless of request body shape, headers, or an established session cookie. Recorded as `ok: false` in `data/scraper-health.json` with the real error, so Phase 8's monitoring will correctly flag it once this runs live rather than silently pretending MAA has zero jobs. Needs a closer look (possibly a nonstandard Workday API version for this tenant) before it can be added for real — parked rather than spending unbounded time on one employer.

**How to verify yourself:**
1. Run `node scripts/run-all-workday.js` — should print one line per employer; 10 should succeed, MAA should print `Mid-America Apartment Communities scraper failed: Workday API returned 400 at offset 0 (maa/MAA)`.
2. Run `node scripts/verify-expiry.js` — should print 7 `ok -` lines including the new "scoped merge" check, ending in `All expiry logic checks passed.`
3. Run `node scripts/build-listings.js` then `node scripts/build-site.js` then `node scripts/serve.js`, open `http://localhost:8080` — should show 13 postings across St. Jude, Medtronic, Sedgwick, Smith & Nephew, and ALSAC.
4. Check `data/scraper-health.json` — 10 entries with `"ok": true`, one (`maa`) with `"ok": false` and a real error message.

### Slice 2: iCIMS employers — built and verified (1 of 3 originally-planned employers)

Phase 0's triage assumed all three iCIMS employers (Baptist Memorial, Orgill, Memphis-Shelby County Schools) would follow the same clean pattern. Investigating each one live told a different story — surfaced to you directly, and you picked the recommended path (install Playwright to inspect the one that was still workable, park the other two):

- **Orgill** has moved off iCIMS entirely onto a custom ASP.NET site (`orgill.com/careers`) since Phase 0's triage — reclassified as "hand-rolled" tier, parked for a later batch.
- **Baptist Memorial**'s current careers site (`careers.baptistonline.org`) sits behind a Cloudflare bot-challenge page. Not attempting to bypass that — it's an active anti-bot measure, and circumventing it would cross from polite scraping into evasion.
- **Memphis-Shelby County Schools** is still genuinely on iCIMS and workable, but needed real investigation: its job listings render inside a nested iframe, and a plain `curl` of the obvious URL returned an empty shell. Used a temporary headless-browser inspection (Playwright, installed just for this investigation, not added as a project dependency) to capture the exact iframe URL and query-string parameters (`?pr={page}&in_iframe=1&searchRelation=keyword_all&...`) that make iCIMS render full listings as plain server-rendered HTML — once found, no browser is needed at runtime, a normal `fetch()` gets the same HTML.

New files:
- `lib/icims.js` — `fetchIcimsJobs(employer)`, parses `<li class="iCIMS_JobCardItem">` blocks out of the raw HTML (regex-based, not a full HTML parser — no new dependency for one field-shaped template). Pages via `?pr=0,1,2...` until a page comes back with zero job cards, same "keep going until the real end-of-results signal" pattern as Workday's pagination fix.
- `lib/icims-employers.js` — config table, same shape as the Workday one. MSCS's entry sets a `fixedLocation: "Memphis, Tennessee"` instead of resolving one per-job — the whole district sits inside Shelby County, so there's no "N Locations" ambiguity to resolve the way Workday's multi-site postings have.
- `lib/run-icims-employer.js`, `scripts/run-icims-employer.js` (single-employer CLI), `scripts/run-all-icims.js` (the loop the workflow calls) — directly mirror the Workday equivalents.
- `.github/workflows/daily-pipeline.yml` — added a "Fetch iCIMS employers" step, same `continue-on-error: true` pattern.

**Result:** 27 real MSCS postings fetched, all in facilities/trades/HR/administrative roles (electricians, HVAC techs, a chef, psychologists) — matching what the site visually showed. **Zero passed the tech-role title filter**, which is the correct outcome, not a bug: this is a school district's central office, not a software shop. One near-miss worth knowing about: "Analytics Advisor" (a real Power BI/data-visualization role per its description) didn't match, because the title says "Advisor" rather than "Analyst/Engineer/Scientist" — the same conservative-whitelist tradeoff already accepted in Phase 3 (recall traded for precision), not something fixed unilaterally here.

MSCS also runs a separate "instructional" job board (`instructional-scsk12.icims.com`, teaching positions) — left out for now since it's overwhelmingly non-technical; can be added the same way later if wanted.

**How to verify yourself:**
1. Run `node scripts/run-icims-employer.js mscs-central` — should print `Memphis-Shelby County Schools: 27 new, 0 updated, 0 unchanged` on a fresh run, `0 new, 0 updated, 27 unchanged` on a re-run.
2. Run `node scripts/build-listings.js` — MSCS jobs shouldn't add any new postings to `data/listings.json` (still 13, all from the Workday batch) — expected, not a bug.
3. Check `data/jobs.json` for `"sourceAts": "icims"` entries — every one should have `"location": "Memphis, Tennessee"`.

### Production incident: first scheduled run after slices 1+2 crashed the pipeline

The first real overnight cron run (after Workday + iCIMS employers were added) failed at the "Classify and enrich" step with `Error: Workday detail API returned 403 for /job/.../Security-Engineering-Manager_R62361-2 (medtronic/MedtronicCareers)`, thrown from `fetchWorkdayJobDetail` with no error handling around it in `resolveUncertainLocations`. Two real bugs, both fixed:

1. **A single flaky detail-fetch crashed the entire pipeline, not just that one job.** Workflow step order is Fetch → Classify and enrich → Build site → Commit updated data → Check scraper health → deploy. Because the crash happened inside "Classify and enrich," none of the later steps ran that morning — the site never rebuilt, the fresh scrape data never got committed, and Phase 8's own health-check monitoring never even executed. All 12 employers had almost certainly scraped fine; a single Workday API hiccup on one job's detail lookup blocked everything downstream anyway. Likely cause: GitHub Actions runners use shared datacenter IPs, which are more prone to tripping rate-limiting/bot-detection on Workday's side than a home connection — this same job has otherwise resolved cleanly in every local run. Fixed by wrapping the `fetchWorkdayJobDetail` call in `resolve-locations.js` in a try/catch: a failed detail fetch now falls through to `stillUncertain` (same as "no location data available") instead of crashing everything else.
2. **`build-listings.js` — the script the real pipeline actually runs — never wrote to `data/ai-log.jsonl` at all.** Phase 4 promised "a log of every API call... so you can audit decisions later," but that logging only ever existed in the separate `enrich-uncertain.js` script, which the workflow doesn't call. Today's real AI call (triggered by the same flaky job, once its detail fetch failed) went completely unlogged — the only trace was an aggregate console line. Fixed by adding the same per-call `appendFileSync` logging (and a per-job console line) to `build-listings.js` directly.

Also worth knowing: the exact same Medtronic posting (`Security Engineering Manager`, R62361) has now, across a handful of runs today, been resolved three different ways — a clean rules+location-lookup pass, a 403 crash, and an AI review that came back "uncertain" (confidence 0.35, since the detail fetch that run returned incomplete location data). This looks like Workday's detail endpoint being genuinely inconsistent under repeated/rapid querying, not a bug in our code — the system's design (grace periods, "uncertain" just means "skip today, try again tomorrow") already tolerates this without manual intervention.

**How to verify yourself:**
1. Run `node scripts/build-listings.js` — should complete without crashing regardless of whether any individual Workday detail fetch fails.
2. If a posting needs AI review, check `data/ai-log.jsonl` — it should now gain a new line every real run, not just via `enrich-uncertain.js --smoke-test`.
3. Trigger the workflow manually (Actions tab → Run workflow) to confirm the full chain — fetch, classify, build, commit, health check, deploy — completes end to end now.

### Slice 3: Oracle Recruiting Cloud — Hilton (built and verified, first employer on this ATS)

Hilton wasn't on Phase 0's original 30-employer list — added later once you confirmed Hilton has a corporate office in Memphis, the same "located here, not just posted by a company headquartered here" bar the whole project applies. Its careers site (`jobs.hilton.com`) turned out to run on **Oracle Recruiting Cloud**, an ATS type Phase 0 had already flagged as upcoming (for AutoZone, University of Memphis, International Paper, Shelby County Government) but nobody had built a client for yet — so this is also the first Oracle Recruiting Cloud scraper in the codebase, not just a new config row.

**How Oracle Recruiting Cloud differs from Workday/iCIMS, and why the client is shaped differently:**
- It's one shared Oracle Fusion pod per region (Hilton's is `efet.fa.us2.oraclecloud.com`, site number `CX_1009` — found by following the `CX_1` redirect embedded in `jobs.hilton.com`'s page source to the real site number) hosting a single company's postings behind a documented-feeling but unofficial REST endpoint: `/hcmRestApi/resources/latest/recruitingCEJobRequisitions`.
- Unlike every employer so far, Hilton is a global hospitality company with **3,971 total open postings** — orders of magnitude past any other employer here, and fetch-everything-then-filter-client-side (the Workday/iCIMS approach) would be both wasteful and slow. Instead, the client asks Oracle's own location facet to pre-filter server-side to one geography, via a `selectedLocationsFacet=<GeographyId>` finder parameter — discovered by watching what the site's own "filter by location" UI sends. That GeographyId (`300000003889994` for "Memphis, TN, United States") is scoped to Hilton's specific Oracle Fusion tenant, not a stable/global Oracle ID, so it's stored per-employer in the config rather than hardcoded in the client — the next Oracle Recruiting Cloud employer will need its own value found the same way.
- Oracle's search results already carry the full primary + secondary location list per posting up front — no Workday-style separate detail-fetch needed to resolve "N Locations" ambiguity; `normalize()` just joins them into one location string (e.g. `"McLean, VA, United States; Dallas, TX, United States; Memphis, TN, United States"`), which flows straight into the existing `matchesMemphisArea()` check with zero new filtering logic needed.
- Oracle also exposes a **real, exact `PostedDate`** (`"2026-07-24"`) — better data than Workday's relative-text-only postings. `lib/posted-date.js` (previously Workday-only, despite its generic-sounding name) now recognizes an already-exact `YYYY-MM-DD` string and passes it through as `approx: false`, instead of only knowing how to estimate from "Posted N Days Ago" text.

New files:
- `lib/oracle-recruiting.js` — `fetchOracleRecruitingJobs(employer)`, pages via the finder string's own `offset`/`limit` (confirmed the `expand=requisitionList.secondaryLocations` query param is required — omitting it silently drops `requisitionList` from the response entirely, even at small page sizes, which looked at first like a broken endpoint).
- `lib/oracle-recruiting-employers.js` — config table, same shape as Workday/iCIMS's, plus the per-tenant `memphisLocationFacetId`.
- `lib/run-oracle-recruiting-employer.js`, `scripts/run-oracle-recruiting-employer.js` (single-employer CLI), `scripts/run-all-oracle-recruiting.js` (the loop the workflow calls) — directly mirror the Workday/iCIMS equivalents, including the same scoped-merge and scraper-health recording.
- `.github/workflows/daily-pipeline.yml` — added a "Fetch Oracle Recruiting Cloud employers" step, same `continue-on-error: true` pattern.

**Result:** 16 Memphis-area Hilton postings fetched (Oracle's own location facet already excluded the other ~3,955). Of those, **5 passed** the existing tech-role title filter with no AI review needed — Senior Software Engineer (Content Management System), Lead Software Engineer - Frontend, Lead Full-stack Software Engineer (PHP and React), Manager Software Engineering, and Senior Manager Data Architecture — all with exact posted dates and working job URLs (`https://efet.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1009/job/{id}`). The other 11 (tax analysts, hotel accounting, project management, etc.) correctly failed on title — a hospitality corporate office has plenty of non-tech roles too, same as every other employer here.

**How to verify yourself:**
1. Run `node scripts/run-oracle-recruiting-employer.js hilton` — should print `Hilton: 16 new, 0 updated, 0 unchanged` on a fresh run.
2. Run `node scripts/build-listings.js` — should add exactly 5 new Hilton postings to `data/listings.json`, all `"matchedVia": "rules"` with real `postedOnDate` values and `"postedOnApprox": false`.
3. Check `data/jobs.json` for `"sourceAts": "oracle-recruiting"` entries — every one should have a `location` string containing `Memphis, TN`.

### Slice 4: UKG Pro (UltiPro) — First Horizon (built and verified, first employer on this ATS)

First Horizon was on Phase 0's original 30-employer list, but marked low-confidence and unconfirmed (`SuccessFactors (probable)`) — parked in the hardest tier alongside TruGreen's chat UI and FedEx's unconfirmed backend, since automated research at the time hit fetch errors and couldn't independently confirm anything. You asked directly why no First Horizon postings were showing up; a fresh live investigation found the earlier guess was wrong, and the real answer is much easier than "hardest tier" suggested.

**What live investigation found:** the real ATS is **UKG Pro (UltiPro)** — the same family already used by MicroPort Orthopedics — not SuccessFactors. The public job board itself is a Knockout.js SPA (job data isn't in the raw HTML, ruling out a Workday/iCIMS-style plain scrape), but it loads results from a clean, unauthenticated JSON endpoint found by reading the page's own list of AJAX URLs: `POST recruiting.ultipro.com/{companyCode}/JobBoard/{boardId}/JobBoardView/LoadSearchResults`. No headless browser needed, despite Phase 0's original "JS-heavy portal" classification for this ATS family. Confirmed live: no enforced page-size cap up to `Top: 500`, and First Horizon's total posting count (233) is small enough to fetch everything and filter client-side — no Oracle-style server-side location facet needed.

The response data is arguably cleaner than any ATS integrated so far: a real per-location `Address.City`/`Address.State.Name` breakdown (no free-text parsing needed the way Workday's `locationsText` requires), an exact `PostedDate` (a full ISO timestamp, trimmed to `YYYY-MM-DD` — `lib/posted-date.js`'s exact-date passthrough from Slice 3 already handles it, no changes needed there), and a `BriefDescription` plain-text summary included at zero extra request cost, the same free-at-scrape-time shape as Oracle's `ShortDescriptionStr`.

New files:
- `lib/ultipro.js` — `fetchUltiproJobs(employer)`, pages via `Top`/`Skip` (page size 50, politely, despite the confirmed lack of a server-side cap). `normalize()` joins each posting's `Locations[]` into a `"City, State; City, State"` string, matching the multi-location join pattern Oracle's client already established.
- `lib/ultipro-employers.js` — config table: `host` (shared pod, `recruiting.ultipro.com`), plus per-employer `companyCode`/`boardId`.
- `lib/run-ultipro-employer.js`, `scripts/run-ultipro-employer.js` (single-employer CLI), `scripts/run-all-ultipro.js` (the loop the workflow calls) — directly mirror the Workday/iCIMS/Oracle equivalents.
- `.github/workflows/daily-pipeline.yml` — added a "Fetch UltiPro employers" step, same `continue-on-error: true` pattern.
- `scripts/build-job-pages.js` — the "description already on the record" branch (previously Oracle-only) now also covers `sourceAts === "ultipro"`, since `BriefDescription` is captured free at scrape time exactly like Oracle's summary.

**Result:** all 233 First Horizon postings fetched in one run. **2 passed** the tech-role title filter — Senior Manager Software Engineering (multi-location, including Memphis, Tennessee) and IT Developer Senior (Full Stack .Net Developer - Wealth) (Memphis, Tennessee) — both resolved directly by the rule-based filter, no AI review needed. The other 231 (relationship bankers, branch managers, tax/finance analysts, etc.) correctly failed on title — First Horizon is a regional bank, overwhelmingly non-technical roles, same pattern as every other employer here.

**How to verify yourself:**
1. Run `node scripts/run-ultipro-employer.js firsthorizon` — should print `First Horizon: 233 new, 0 updated, 0 unchanged` on a fresh run.
2. Run `node scripts/build-listings.js` — should add exactly 2 new First Horizon postings to `data/listings.json`, both `"matchedVia": "rules"`.
3. Check `data/jobs.json` for `"sourceAts": "ultipro"` entries — every one should have a `description` field already populated (no separate detail fetch needed).

### Slice 5: five more employers on already-built ATSes — pure config, no new scraper code

With Oracle Recruiting Cloud (Slice 3) and UKG Pro/UltiPro (Slice 4) both already built, the remaining employers on those same ATSes from Phase 0's original list became genuinely cheap to add: AutoZone, University of Memphis, and International Paper (all originally triaged as Oracle Recruiting Cloud), Shelby County Government (added to the same ATS's config), and MicroPort Orthopedics (UKG Pro/UltiPro, the same family as First Horizon). No new library code — every one of these is a new object in `lib/oracle-recruiting-employers.js` or `lib/ultipro-employers.js`, the exact payoff this "group by ATS, not by company" strategy was supposed to produce.

**Live investigation still mattered for each one** — Phase 0's guesses weren't uniformly reliable (see Slice 4's First Horizon correction):
- **University of Memphis** genuinely still redirects to Oracle Fusion (via a `workforum.memphis.edu` vanity front-end) — confirming the original triage right, but on a different regional pod (`.fa.ocs.oraclecloud.com`, not `.fa.us2.oraclecloud.com` like Hilton/AutoZone) and a different site number.
- **AutoZone**, **International Paper**, and **Shelby County Government** all confirmed straightforwardly via a direct site search.
- Every employer needed its own `memphisLocationFacetId`/GeographyId discovered fresh (per Slice 3's note, these are assigned per Oracle tenant, not reusable across employers) — found the same way each time: a `keyword=Memphis` search to find a candidate `GeographyId`, then confirmed via `selectedLocationsFacet` that it returns a materially different (usually smaller, more accurate) result set than the noisy keyword search.
- **MicroPort Orthopedics** confirmed on UKG Pro/UltiPro; all 11 of its postings are in Arlington, Tennessee — a Memphis-metro suburb already on `MEMPHIS_AREA_LOCATIONS`' allowlist, so effectively their entire job list is in scope.

**Result:** 355 new raw postings fetched (81 AutoZone + 141 University of Memphis + 6 International Paper + 116 Shelby County Government + 11 MicroPort). **4 passed** the tech-role title filter: AutoZone's Senior Software Engineer – Enterprise Search and Systems Engineer – SRE Enablement, Shelby County Government's Programmer Analyst II, and MicroPort's CNC Programmer. University of Memphis and International Paper both landed at zero passing postings today — not a bug (see below).

**Two real filter-accuracy findings surfaced by this batch, neither fixed here (same "recall traded for precision" tradeoff already accepted in Phase 3, not something to change unilaterally):**
- **A likely false positive:** MicroPort's "CNC Programmer" matched on the bare word "programmer," but reading the actual posting confirms it's a CNC-machining/manufacturing role (creates programs *for CNC equipment*), not a software job.
- **More false negatives, the same shape as Phase 9's "Analytics Advisor" near-miss:** International Paper has three real IT roles at its Memphis office — "IT Platform Architect - CSE Salesforce," "IT Business Analyst - CSE (Salesforce)," "IT Solution Architect CSE - Data & Analytics" — none matched, because the title whitelist's `IT (developer|architect|technologist)` pattern requires those words adjacent to "IT," and none of these titles has them adjacent (there's always a qualifier word in between). AutoZone has a similar pattern: several genuine "Systems Engineer" roles (SAP, Cloud Ops, InfoSec-HCM, Apigee) didn't match anything in the whitelist, since there's no generic `systems engineer` pattern — only the specific "SRE"/`\bsre\b` posting happened to also contain a whitelisted term.

**How to verify yourself:**
1. Run `node scripts/run-all-oracle-recruiting.js` and `node scripts/run-all-ultipro.js` — should print one line per employer, all `new` counts matching a fresh run (81/141/6/116 for the four new Oracle employers, 11 for MicroPort).
2. Run `node scripts/build-listings.js` — should add exactly 4 new postings to `data/listings.json`.
3. Check `data/scraper-health.json` — all five new employer keys (`autozone`, `uofm`, `internationalpaper`, `shelbycounty`, `microport`) should show `"ok": true`.

### Slice 6: UTHSC — another Taleo→Oracle migration, and a genuine Taleo blocker at MLGW

Went after both remaining Phase 0 "Taleo" employers together. One turned out to be another easy Oracle Recruiting Cloud config row; the other is the first real, unresolved blocker on a *new* ATS in this project (as opposed to MAA/Baptist Memorial, which blocked on an already-built ATS).

**UTHSC — done, zero new code.** `ut.taleo.net` doesn't even resolve anymore (DNS failure) — same shape of surprise as Orgill's and First Horizon's stale Phase 0 guesses. The whole University of Tennessee system (Knoxville, Memphis, Chattanooga, all campuses together) has since moved to Oracle Recruiting Cloud, on yet another distinct regional pod (`fa-ewlq-saasfaprod1.fa.ocs.oraclecloud.com`). The Memphis location facet (`300000010468193`) correctly scopes the shared multi-campus tenant down to just UTHSC's campus — added as one more row in `lib/oracle-recruiting-employers.js`, no library code touched. **222 postings fetched, 0 pass the tech-role filter** — expected for a medical school's faculty/clinical postings, same non-bug pattern as MSCS in Slice 2.

**MLGW — genuinely still on Taleo, and genuinely blocked, for a more fundamental reason than it first looked like.** Unlike every ATS integrated so far, Taleo's job search isn't a simple `fetch()`-able endpoint:
- The visible job list is populated by an AJAX `POST /careersection/rest/jobboard/searchjobs` call — found by reading the page's own faceted-search JS modules (`SearchHandler.js`), not documented anywhere.
- The POST body is assembled client-side from four separate JS panel modules (`FieldPanel`, `FilterPanel`, `AdvancedSearchPanel`, `SortPanel`), each contributing its own named key (`fieldData`, `filterSelectionParam`, `advancedSearchFiltersSelectionParam`, `sortingSelection`) to one combined JSON object, plus a top-level `multilineEnabled: true` flag not owned by any single module — traced all of it by hand from the JS source and initially still got a generic `500 Internal Server Error` ("An Error Occurred in TEE") no matter what was tried, including a session cookie and a CSRF token pulled from the page's own JS config.
- You asked for a headless-browser investigation (Playwright, installed one-off exactly like the MSCS/iCIMS precedent in Slice 2) to settle it properly. That confirmed the *exact* request shape by capturing real traffic — `multilineEnabled` plus fully-populated (not empty) filter-category arrays was indeed the missing piece, and the CSRF token turned out to be unnecessary. But it also surfaced something bigger: **replaying that exact, byte-identical request — same headers, same cookie, same body — succeeds every time from Playwright's real browser and fails every time from `curl` or Node's own `fetch()`.** That's not a payload problem anymore; it's TLS/browser fingerprinting at the network level, invisible to HTTP header inspection. No plain HTTP client can pass it, however correct the request looks.
- That means the only way to actually scrape MLGW is to run a real headless browser for *every single daily scrape* — a fundamentally heavier execution model than any other employer here, not a one-time investigation. Surfaced directly to you rather than deciding unilaterally, since it means adding Playwright and a Chromium download as permanent project dependencies just for one utility company with ~19 total postings.

**Decision: parked, not built.** Same call already made for MAA and Baptist Memorial — for a single small employer, a permanently heavier scraping architecture isn't worth it. No Taleo library code was committed; the investigation above is preserved here so the reasoning (and the now-confirmed-correct request shape, in case this is revisited later) isn't lost.

**How to verify yourself:**
1. Run `node scripts/run-oracle-recruiting-employer.js uthsc` — should print `University of Tennessee Health Science Center: 222 new, 0 updated, 0 unchanged` on a fresh run.
2. Confirm `ut.taleo.net` is genuinely dead: `curl -v https://ut.taleo.net` should fail to resolve.
3. Confirm MLGW's blocker is real: `curl -X POST "https://mlgw.taleo.net/careersection/rest/jobboard/searchjobs?lang=en&portal=8116756061" -H "Content-Type: application/json" -d '{}'` returns `500`; the identical request from a real browser (or Playwright) succeeds.

### Slice 7: a real fetch-step hang, and closing the gap it exposed in Phase 8's monitoring

The Workday fetch step ran for over an hour on 2026-07-27 before being cancelled by hand — normal end-to-end pipeline runs take 4-5 minutes total. The step's log showed **zero output** for its entire runtime: not even the first employer's (Medtronic's) completion line, which `runWorkdayEmployer` logs on every single run, success or failure. That means the very first request hung completely before the per-request `AbortSignal.timeout(20_000)` in `lib/workday.js` ever fired — the exact protection added after an earlier, similar stall (documented in that file's own comment). A single incident isn't enough to pin down root cause with certainty; it looks like a GitHub-hosted-runner-level network stall, not a bug in the request logic, since nothing else was competing for the event loop and the timer itself never ran.

That incident exposed a real gap in Phase 8's monitoring: a step that hangs gets killed before the scraper script ever writes anything to `data/scraper-health.json` for the employer it was stuck on — so from that file's perspective, a silent multi-hour hang and a perfectly healthy day can look identical. Two changes close this:

- **`timeout-minutes: 10` added to all four ATS fetch steps** in `daily-pipeline.yml` — a hard, GitHub-Actions-level backstop that doesn't depend on anything inside the Node process still being able to run its own timeout logic. 10 minutes is generously above the ~4-5 minute normal *total* pipeline time, so it won't false-positive on a merely-slow day.
- **`scripts/record-step-outcomes.js`** (new) — runs right after the four fetch steps, reading each one's `steps.<id>.outcome` (passed in via env vars, since only the workflow itself knows whether a step was killed) and recording it as its own `data/scraper-health.json` entry (`workday-step`, `icims-step`, `oracle-recruiting-step`, `ultipro-step`). This deliberately reuses Phase 8's existing machinery rather than building a second notification path: a timed-out step now flows straight into the same "Scraper health alert" GitHub Issue that a broken employer already does, and closes itself the same way once a run comes back clean.

**How to verify yourself:**
1. `FETCH_WORKDAY_OUTCOME=failure FETCH_ICIMS_OUTCOME=success FETCH_ORACLE_OUTCOME=success FETCH_ULTIPRO_OUTCOME=cancelled node scripts/record-step-outcomes.js` then `node scripts/check-scraper-health.js --dry-run` — should list `workday-step` and `ultipro-step` as unhealthy with a clear "did not complete successfully" error, and print the issue body that would be filed. Then `git checkout -- data/scraper-health.json` to discard the test entries.
2. `grep timeout-minutes .github/workflows/daily-pipeline.yml` — should show `10` on every fetch step (Slice 8 below added a fifth, NEOGOV).
3. Next real scheduled run: check the Actions tab for the "Record fetch step outcomes" step's log — should print every step as healthy on a normal day.

### Slice 8: City of Memphis — got the ATS wrong first, caught by a spot-check, corrected to Oracle Recruiting Cloud

**First pass was wrong.** Built a full NEOGOV scraper against `governmentjobs.com/careers/memphistn` (Phase 0's original triage), got a real, well-formed "No jobs at this time" response, and — suspicious of a possible request bug — spent real effort convincing myself it was accurate: the identical request mechanism correctly found 67 real postings on Nashville's NEOGOV site, and the one Memphis job URL findable via web search turned out to have closed back in 2018. All of that was true. What it missed: whether `memphistn.gov`'s *own* careers page still actually points at NEOGOV at all. You checked — by hand, spot-checking the real site — and found it links out to an `oraclecloud.com` domain instead. It does: NEOGOV is a stale, abandoned page nobody's posted to in years; the real board has quietly moved to Oracle Recruiting Cloud, exactly like UTHSC and University of Memphis before it, and no amount of testing the *NEOGOV* mechanism itself was ever going to surface that, because the flaw wasn't in the mechanism — it was in the assumption that NEOGOV was still the right target in the first place.

**Corrected: City of Memphis is Oracle Recruiting Cloud, `eeim.fa.us2.oraclecloud.com`, site `CMEM`.** Found directly from `memphistn.gov/careers`'s own outbound links this time, not inferred. `CoM` (the other site code linked from that page) 302-redirects to `CMEM`, confirming `CMEM` is the one canonical site. Memphis location facet (`300000002243835`) discovered the standard way (`keyword=Memphis` search, confirmed via `locationsFacet` in the response) and scopes correctly — 24 real, current postings (Police Officer, Firefighter Paramedic, Park Maintenance Manager, etc., posted as recently as this week), zero new library code, one more config row in `lib/oracle-recruiting-employers.js`. Zero pass the tech-role filter, same expected non-bug pattern as UTHSC and MSCS — a city government's open roles skew public-safety/maintenance, not software. All NEOGOV code (`lib/neogov.js` and friends) was deleted, not kept around unused.

**The bigger fix: Phase 8's monitoring had a real blind spot, and this is what exposed it.** `classifyEmptyResult` only flags an employer as unhealthy when its count *drops* from a previously-healthy nonzero number — an employer that's *always* zero (like the wrong NEOGOV scraper would have stayed, forever) never trips that check, because it never had a nonzero baseline to fall from. It would have looked indefinitely "healthy" while silently watching nothing. You asked for a per-run receipt so this class of mistake is visible to you directly rather than depending on my judgment catching it. Added `scripts/write-run-summary.js`, run right after the fetch steps: prints every employer's job count and its delta from before this run's fetches (captured via a "Snapshot scraper health before this run" step early in the workflow) to GitHub's own Job Summary — visible at the top of every Actions run, no digging into `data/scraper-health.json` required. Flags both `unhealthy` scrapers and, separately and unconditionally, any employer that found **zero** jobs this run, whether or not Phase 8's own logic considers that suspicious — deliberately raw, not filtered through a "is this expected" judgment call, since that judgment call is exactly what went wrong here.

**No new location-detection logic needed.** Like MSCS and UTHSC, Oracle's search results already carry a real location field per posting — no `fixedLocation` guesswork required here at all (that concern only applied to the abandoned NEOGOV approach).

**How to verify yourself:**
1. `node scripts/run-oracle-recruiting-employer.js cityofmemphis` — should print `City of Memphis: 0 new, 0 updated, 0 unchanged` (jobs already scraped once during this work) and 24 total.
2. Confirm the real site yourself: `curl -s https://memphistn.gov/careers/ | grep -o 'https://[a-zA-Z0-9.-]*oraclecloud[a-zA-Z0-9./_?=&-]*'` — should show `eeim.fa.us2.oraclecloud.com` links, not `governmentjobs.com`.
3. `node scripts/write-run-summary.js` (after copying `data/scraper-health.json` somewhere and pointing `SCRAPER_HEALTH_BEFORE_PATH` at it) — should print a markdown table with every employer's current count, including a `zero jobs found` flag on `maa`.
4. Next real scheduled run: check the Actions run page directly — the "Write run summary" step's Job Summary should show the full per-employer table without needing to open any log or JSON file.

---

## Branch protection for `main`

Not a numbered phase — an operational/process change layered on top of everything above, added once the project had enough real history to be worth protecting against an unreviewed bad change landing directly on `main`.

**What's set up:**
- A GitHub ruleset on `main` requiring at least 1 approving review before merging any pull request.
- **Bypass role: Repository admin.** This is what lets the daily automated data-refresh commit keep pushing straight to `main` without a PR — gating a machine-generated commit that runs unattended every morning behind manual approval would mean the site simply stops updating unless someone approves a PR at 5-6am daily, which defeats the point of automating it.
- `gh` CLI installed and authenticated (`gh auth login`), so pull requests can be opened directly from this session instead of you having to click GitHub's "Compare & pull request" banner manually each time.

**Real, worth-knowing consequence of the bypass choice:** "Repository admin" bypass applies to *any* push authenticated as an admin-role account — not just the automated commit's PAT. Since Claude has been pushing to `main` using your own git credentials all along, and you're the repo admin, **Claude's own direct pushes also bypass the PR requirement** — GitHub doesn't distinguish "the daily bot" from "you (or Claude acting as you) pushing code directly." Decided explicitly: this is fine as *discipline, not enforcement* — going forward, Claude will voluntarily push code changes to a branch and open a PR for your review rather than committing straight to `main`, even though the ruleset itself wouldn't technically stop a direct push. If stricter, GitHub-enforced separation is ever wanted (even your own/Claude's direct pushes blocked without a PR), that needs a genuinely separate lower-privileged identity (e.g., a second account or machine user with Write-only access) holding the automation's PAT instead of an admin account — more setup, not done here.

**How the daily commit authenticates:** `.github/workflows/daily-pipeline.yml`'s checkout step now passes `token: ${{ secrets.GH_PUSH_TOKEN }}` — a fine-grained PAT (Contents: Read and write, scoped to just this repo) belonging to the admin account, stored as a repo secret. The default `GITHUB_TOKEN` can no longer push to `main` on its own now that the ruleset is active.

**A real near-miss during setup, worth remembering:** the first PAT created got pasted into an editor tab visible in this session before being added as the secret — meaning it was exposed outside GitHub's own secret storage. Treated as compromised immediately: revoked via `github.com/settings/tokens?type=beta`, and a fresh token was generated and used instead, without ever appearing in chat/logs again. General rule going forward: token values get typed straight into GitHub's own secret field, never into a shared editor, terminal echo, or chat.

**Verified working end-to-end:** merged a real PR (#2, adding the `GH_PUSH_TOKEN` change itself) using GitHub's "merge without waiting for requirements to be met" bypass option (needed since GitHub never allows self-approval, even for admins — a hard platform rule, not a config issue), then manually triggered the workflow via `gh workflow run`. Full run went green, and critically, the "Commit updated data" step produced a real `Automated data refresh` commit that landed on `origin/main` — confirming the new token genuinely bypasses the PR requirement for that one step while the rule stays enforced for everything else.

**How to verify yourself:**
1. `github.com/gittony/test-memphis-tech-jobs/settings/rules/rulesets` — the ruleset should show "Require a pull request before merging" active, with Repository admin in the bypass list.
2. Try pushing a throwaway branch + PR from an account *without* admin/write access (or just note that any future collaborator without write access would be blocked) to confirm the rule actually applies to non-bypassed accounts.
3. Check `github.com/gittony/test-memphis-tech-jobs/settings/secrets/actions` for `GH_PUSH_TOKEN` — should exist; its value is never visible again once saved.
4. Trigger the workflow manually and confirm the "Commit updated data" step succeeds and a new commit appears on `main` afterward.

---

## Open questions log

Running list of things surfaced mid-project that don't fit neatly into a single phase above:
- (none yet)
