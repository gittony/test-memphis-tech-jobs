// Tiny static file server for previewing site/ locally. Browsers block
// fetch() against file:// URLs, so opening index.html directly won't load
// the data — this is just enough of an HTTP server to get around that,
// without adding a dependency for something this small.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";

const SITE_DIR = fileURLToPath(new URL("../site", import.meta.url));
const PORT = 8080;

const CONTENT_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  // GitHub Pages resolves a directory request (e.g. /job/{slug}/) to that
  // directory's index.html automatically; this server needs to do the same
  // explicitly, not just for "/", now that site/job/**/index.html exists.
  let path = req.url.split("?")[0];
  if (path.endsWith("/")) path += "index.html";
  const filePath = join(SITE_DIR, decodeURIComponent(path));

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Serving site/ at http://localhost:${PORT}`);
});
