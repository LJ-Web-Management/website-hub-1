// Writes sites/hub/index.html: a plain list of links to every site in sites/. Wrangler runs this
// before each deploy (the "build" block in wrangler.jsonc), so a new folder shows up on its own.
// The hub is kept out of search engines by its meta tag and by the Worker's X-Robots-Tag header.
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAIN = "hazwoperosha.us";
const sitesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "sites");
const NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const names = readdirSync(sitesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && NAME.test(d.name) && d.name !== "hub" && existsSync(join(sitesDir, d.name, "index.html")))
  .map((d) => d.name)
  .sort();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Site hub</title>
<style>body{font:16px/1.7 system-ui,sans-serif;margin:24px;color:#111;background:#fff}a{color:#0645ad}</style>
</head>
<body>
<h1>Sites (${names.length})</h1>
<ul>
${names.map((n) => `<li><a href="https://${n}.${DOMAIN}/">${n}.${DOMAIN}</a></li>`).join("\n")}
</ul>
</body>
</html>
`;

mkdirSync(join(sitesDir, "hub"), { recursive: true });
writeFileSync(join(sitesDir, "hub", "index.html"), html);
console.log(`hub: ${names.length} sites`);
