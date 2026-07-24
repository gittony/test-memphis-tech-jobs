// Phase 4: runs whatever the rules genuinely can't resolve through Claude
// Haiku 4.5, logs every call for audit, and prints a cost estimate.
//
//   node scripts/enrich-uncertain.js             — real run against data/jobs.json
//   node scripts/enrich-uncertain.js --smoke-test — also runs one made-up
//     posting through the real API, to prove the AI call works even on a day
//     when the real uncertain bucket is empty. Clearly logged as synthetic.

import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classify } from "../lib/filter.js";
import { resolveUncertainLocations } from "./resolve-locations.js";
import { classifyUncertainJob } from "../lib/ai-classify.js";

const ENV_PATH = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(ENV_PATH)) process.loadEnvFile(ENV_PATH);

const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));
const LOG_PATH = fileURLToPath(new URL("../data/ai-log.jsonl", import.meta.url));

const jobs = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const uncertain = jobs.filter((job) => classify(job).verdict === "uncertain");

console.log(`Rule-based filter: ${uncertain.length} postings flagged uncertain.`);

const resolved = await resolveUncertainLocations(uncertain, { log: console.log });
console.log(
  `Resolved via location detail fetch (still rules, not AI): ${resolved.pass.length} pass, ` +
    `${resolved.fail.length} fail, ${resolved.stillUncertain.length} genuinely need AI.`
);

let toClassify = resolved.stillUncertain;

if (process.argv.includes("--smoke-test")) {
  console.log("\n--smoke-test: adding one synthetic posting to verify the AI call end-to-end.");
  toClassify = [
    ...toClassify,
    {
      id: "smoke-test:synthetic",
      title: "Senior Data Engineer",
      company: "Smoke Test Co",
      location: "Remote - United States",
      aiContext: "This is a synthetic test posting, not a real job — used only to verify the pipeline.",
    },
  ];
}

if (toClassify.length === 0) {
  console.log("\nNothing needs AI review today. $0.00 spent.");
  process.exit(0);
}

let totalCostUsd = 0;

for (const job of toClassify) {
  const { result, usage, costUsd } = await classifyUncertainJob(job);
  totalCostUsd += costUsd;

  appendFileSync(
    LOG_PATH,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      result,
      usage,
      costUsd,
    }) + "\n"
  );

  console.log(
    `- [${job.id}] ${job.title} -> ${result.locationVerdict} (confidence ${result.confidence}) — ${result.reason}`
  );
}

console.log(`\n${toClassify.length} call(s) made. Estimated cost: $${totalCostUsd.toFixed(4)}.`);
console.log(`Full audit log: data/ai-log.jsonl`);
