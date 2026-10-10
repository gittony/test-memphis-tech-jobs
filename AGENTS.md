# Agent instructions — Memphis Tech Jobs

This file is the source of truth for how any AI coding agent (Claude Code, Codex,
Cursor, etc.) should work in this repo. If you're an agent reading this: follow it.
If you're a human contributor: this doubles as the short version of "how we work
here" — [PLAN.md](PLAN.md) has the long version.

## What this project is

A curated job board for software/data roles in Greater Memphis. It scrapes a
fixed list of employers' career sites (each running some ATS — Workday, iCIMS,
Oracle Recruiting Cloud, UKG/UltiPro, Jobvite, etc.), filters postings down to
ones genuinely located in the Memphis metro (not just posted by a company
headquartered here), and republishes them as a static site on GitHub Pages.
Runs on a daily GitHub Actions cron. Cost target: under $5/month.

## The one rule that matters most: document as you go, in PLAN.md

`PLAN.md` is not a stale planning doc — it's the running record of every
decision, every real bug hit and fixed, and every gap left deliberately
unfinished (with the reasoning why). Whenever you add or change something
non-trivial, add a dated "Slice" entry to `PLAN.md` describing:
- what you built and why
- what you found when you actually ran it against live data
- any real mistakes made along the way and how they were caught/corrected
  (don't sanitize this out — a wrong assumption that got caught is useful
  history, not an embarrassment to hide)
- anything you deliberately left unfixed, and why

A future agent (or Carter, or you) should be able to read PLAN.md top to
bottom and understand *why* the code looks the way it does, not just *what*
it does. Don't let PLAN.md drift out of sync with reality — it's not a memory
system that improves silently, it's a document that goes stale if nobody
updates it.

## Git workflow — non-negotiable

- `main` has branch protection: PRs require review before merging.
- **Never commit directly to `main`.** Always branch off a freshly-pulled
  `main` for any change, one PR per logical change.
- Before starting new work on an existing local branch, confirm it isn't
  already merged (`gh pr view <n> --json state,mergedAt`) — committing onto a
  stale, already-merged branch has happened more than once in this repo and
  is always an annoying cleanup.
- An admin-bypass role exists on the branch ruleset. It is intentionally used
  by exactly one thing: the daily pipeline's automated data-commit step (via
  a PAT in `GH_PUSH_TOKEN`), because that step needs to push straight to
  `main` every morning without a human review cycle. Nothing else should use
  it. Don't push directly "just this once."
- Never force-push, never skip hooks, never amend a commit that's already
  been pushed — same defaults as any repo, just stated explicitly here since
  not every agent tool defaults to this level of caution.

## Verify claims against the live site — don't trust assumptions

The single worst mistake made in this project so far was assuming an
employer's ATS from indirect research (a NEOGOV URL pattern for the City of
Memphis) without spot-checking the real, current careers page — it had
actually migrated to Oracle Recruiting Cloud. The mistake was caught by a
human spot-check, not by the agent.

Before building or trusting a scraper for any employer: load the real
careers page yourself, confirm what ATS it's actually running today (sites
migrate ATS vendors over time), and verify a handful of real postings by URL.
"This matches the pattern I expected" is not verification.

## Scraper architecture — the shape every ATS integration follows

Each ATS gets the same five-file shape (look at `lib/workday*.js` /
`scripts/*workday*.js` as the reference implementation):

- `lib/<ats>.js` — the API/scraping client for that ATS family (fetch +
  normalize to the common job shape).
- `lib/<ats>-employers.js` — a plain config array, one object per employer on
  that ATS (host/tenant/site-equivalent fields). Adding an employer already
  on a supported ATS should usually be *just* a new row here.
- `lib/run-<ats>-employer.js` — shared "scrape one employer → merge → record
  health" logic.
- `scripts/run-<ats>-employer.js` — single-employer CLI, for local testing.
- `scripts/run-all-<ats>.js` — loops every configured employer on that ATS;
  this is what the daily workflow actually calls.

Conventions that apply across all of them:
- Polite by default: descriptive `User-Agent` with a contact email, a delay
  between requests (300ms is the norm elsewhere in this repo), and an
  explicit request timeout (`AbortSignal.timeout`, 20s) — `fetch()` has no
  default timeout and a stalled request will hang the whole pipeline behind
  it if you don't set one.
- **One employer's failure must never take down another employer's data, or
  the rest of the pipeline.** Wrap per-employer and per-job fetches in
  try/catch; log and fall through to a safe default rather than throwing.
  This project has been bitten twice by an unhandled fetch error crashing an
  entire workflow run — see PLAN.md for both incidents before you assume a
  try/catch is unnecessary "because it probably won't fail."
- `mergeJobs()` in `lib/store.js` requires a `scope` filter — a scraper run
  for one employer must not be allowed to mark another employer's jobs as
  missing/expired just because it didn't see them (it was never looking).
- New ATS family workflow steps get `continue-on-error: true` and
  `timeout-minutes` in `.github/workflows/daily-pipeline.yml`, matching the
  existing fetch steps — one broken employer or one hung request shouldn't
  block the whole daily run.

## Filtering and AI review

- `lib/filter.js`'s `classify()` is rule-based and cheap, and runs first. It
  returns separate `titleVerdict`/`locationVerdict`, not just one combined
  verdict — a job that's uncertain on one axis but already confirmed on the
  other shouldn't redo work that's already settled.
- Only genuinely ambiguous cases go to AI (`lib/ai-classify.js`, Claude Haiku
  4.5, kept deliberately cheap and used sparingly — this is the one part of
  the pipeline that costs real money per call).
- **Don't trust an employer's department label alone when judging role
  relevance.** It can be actively misleading — a real software/data role has
  been found filed under a "Marketing" department before. When a title is
  ambiguous enough to need AI review, fetch the actual job description first
  and give the AI real content, not just a title + department string.
- A conservative title whitelist (specific phrases, not a bare `/engineer/`)
  is deliberate — it trades some recall for precision so a bare "Engineer"
  title at a manufacturing/industrial employer doesn't flood the AI-review
  queue. If you're tempted to broaden it, check `TITLE_MAYBE_PATTERNS` in
  `lib/filter.js` first — it may already be the right, narrower fix.

## Scraped content is untrusted content

- Never insert raw scraped HTML into the site. `lib/sanitize-description.js`
  enforces a strict tag/attribute allowlist (no links, images, scripts,
  styles) and truncates to a short excerpt — the site links back to the
  original posting for the full text rather than reproducing it wholesale
  (also lower copyright/reuse exposure).
- `site/app.js` never uses `innerHTML` for anything derived from scraped
  data — build DOM via `textContent` / the sanitized, pre-built HTML from the
  build step only.

## Static site constraints

- No bundler, no framework, deployed to GitHub Pages with no custom domain —
  every asset reference must be a relative path.
- `site/*.js` has zero imports/shared modules with `lib/` — small helpers
  used on both sides (e.g. `slugifyJobId`) are deliberately duplicated rather
  than shared, since there's no build step to share them through.
- Job detail pages are pre-rendered at build time (`scripts/build-job-pages.js`)
  into real static files under `site/job/<slug>/index.html` — there's no
  server to add routes to.

## Secrets

- `.env` is gitignored and stays that way — never commit it, never remove it
  from `.gitignore`. Real secrets (`ANTHROPIC_API_KEY`, `GH_PUSH_TOKEN`) live
  in GitHub Actions secrets, not in any tracked file.
- `.claude/` is also gitignored — local tool settings don't travel with the
  repo; put anything meant to be shared in this file instead.

## Where to look for more context

- `PLAN.md` — the full history: every phase/slice, every real bug, every
  employer's integration story, every deliberately-parked gap and why.
- `README.md` — one-paragraph orientation, points here and to PLAN.md.
- `data/scraper-health.json` — per-employer last-run status, used to
  distinguish "this employer's scraper is broken" from "this employer
  legitimately has zero open roles right now."
