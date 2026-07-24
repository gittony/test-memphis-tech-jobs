import { fileURLToPath } from "node:url";
import { fetchMedtronicJobs } from "./fetch-medtronic.js";
import { loadJobs, saveJobs, mergeJobs } from "../lib/store.js";

const DATA_PATH = fileURLToPath(new URL("../data/jobs.json", import.meta.url));

const now = new Date().toISOString();
const { jobs: fresh } = await fetchMedtronicJobs();
const existing = loadJobs(DATA_PATH);
const { jobs, stats } = mergeJobs(existing, fresh, { now });
saveJobs(DATA_PATH, jobs);

console.log(
  `Medtronic: ${stats.new} new, ${stats.updated} updated, ${stats.unchanged} unchanged. ` +
    `Total stored in data/jobs.json: ${jobs.length}.`
);
