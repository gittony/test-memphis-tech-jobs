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
1. Run `node scripts/run-medtronic.js` — check `data/scraper-health.json` shows `"employer": "medtronic", "ok": true`.
2. Run `node scripts/check-scraper-health.js --dry-run` — should print `All scrapers healthy.`
3. To see the alert path without waiting for a real failure: back up `data/scraper-health.json`, overwrite it with an entry that has `"ok": false` and an `"error"` string, run `node scripts/check-scraper-health.js --dry-run` again — it should print the issue title/body it would file — then restore the backup.
4. Once this is pushed and run for real in Actions (no `--dry-run`), you can deliberately verify the live path by breaking `fetch-medtronic.js`'s URL temporarily, triggering the workflow, watching a real Issue appear in the **Issues** tab, then reverting and confirming the next run closes it.

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
