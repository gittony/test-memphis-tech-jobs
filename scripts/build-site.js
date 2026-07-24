// Copies the latest data/listings.json into site/data/ so the static page
// can fetch it. index.html/styles.css/app.js are hand-written and don't
// change per run — this step only refreshes the data.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LISTINGS_PATH = fileURLToPath(new URL("../data/listings.json", import.meta.url));
const SITE_DATA_DIR = fileURLToPath(new URL("../site/data", import.meta.url));
const SITE_DATA_PATH = fileURLToPath(new URL("../site/data/listings.json", import.meta.url));

if (!existsSync(LISTINGS_PATH)) {
  console.error("data/listings.json not found — run `node scripts/build-listings.js` first.");
  process.exit(1);
}

mkdirSync(SITE_DATA_DIR, { recursive: true });
copyFileSync(LISTINGS_PATH, SITE_DATA_PATH);

console.log("Copied data/listings.json -> site/data/listings.json");
