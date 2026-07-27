// Shared per-ATS "get this job's real description" logic. Originally lived
// only inside build-job-pages.js; Slice 11 needs the same thing earlier in
// the pipeline too, to give the AI real content instead of just a title and
// department label when judging a title-ambiguous posting — a department
// name alone can be actively misleading (e.g. Buckman files a genuine
// "Digital Innovation Engineer" software role under "Marketing," not
// "Digital" or "Technology"), so a plain department string isn't always
// enough to judge role relevance correctly.
//
// Oracle/UltiPro already carry a description captured free at scrape time;
// Workday/iCIMS/Jobvite need a per-job detail fetch. Never throws — a
// failed fetch degrades to "no description available" rather than blocking
// the caller.

import { fetchWorkdayJobDetail, jobBaseUrl } from "./workday.js";
import { fetchIcimsJobDescription } from "./icims.js";
import { fetchJobviteJobDescription } from "./jobvite.js";
import { WORKDAY_EMPLOYERS } from "./workday-employers.js";

const WORKDAY_BY_COMPANY = new Map(WORKDAY_EMPLOYERS.map((e) => [e.company, e]));

// Returns { text, isPlainText } | null.
export async function fetchJobDescription(job, { log = () => {} } = {}) {
  if (job.sourceAts === "oracle-recruiting" || job.sourceAts === "ultipro") {
    return job.description ? { text: job.description, isPlainText: true } : null;
  }

  if (job.sourceAts === "workday") {
    const employer = WORKDAY_BY_COMPANY.get(job.company);
    if (!employer) return null;
    try {
      const externalPath = job.url.slice(jobBaseUrl(employer).length);
      const detail = await fetchWorkdayJobDetail({ ...employer, externalPath });
      return detail.jobDescription ? { text: detail.jobDescription, isPlainText: false } : null;
    } catch (err) {
      log(`- ${job.id}: Workday description fetch failed (${err.message})`);
      return null;
    }
  }

  if (job.sourceAts === "icims") {
    try {
      const text = await fetchIcimsJobDescription(job.url);
      return text ? { text, isPlainText: false } : null;
    } catch (err) {
      log(`- ${job.id}: iCIMS description fetch failed (${err.message})`);
      return null;
    }
  }

  if (job.sourceAts === "jobvite") {
    try {
      const text = await fetchJobviteJobDescription(job.url);
      return text ? { text, isPlainText: false } : null;
    } catch (err) {
      log(`- ${job.id}: Jobvite description fetch failed (${err.message})`);
      return null;
    }
  }

  return null;
}

// ATSes that need a real per-job HTTP request (as opposed to Oracle/UltiPro,
// where the description is already on the record for free) — used by
// callers that want to apply a politeness delay only when one was actually
// needed.
export const DESCRIPTION_REQUIRES_FETCH = new Set(["workday", "icims", "jobvite"]);
