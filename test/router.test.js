import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { siteFor } from "../src/index.js";

// Stands in for Cloudflare's asset server: files maps paths under sites/ to their contents.
function assets(files, redirects = {}) {
  return {
    async fetch(req) {
      const path = new URL(req.url).pathname;
      if (redirects[path]) return new Response(null, { status: 307, headers: { Location: redirects[path] } });
      if (path in files) return new Response(files[path], { status: 200 });
      return new Response("missing", { status: 404 });
    },
  };
}

const get = (url, env) => worker.fetch(new Request(url), env);

test("picks the folder from the first part of the hostname", () => {
  assert.equal(siteFor("johnny.hazwoperosha.us"), "johnny");
  assert.equal(siteFor("Lucy.ABC.com"), "lucy");
  assert.equal(siteFor("-bad.hazwoperosha.us"), null);
});

test("serves each site's own files", async () => {
  const env = { ASSETS: assets({ "/johnny/": "johnny home", "/tim/": "tim home" }) };
  assert.equal(await (await get("https://johnny.hazwoperosha.us/", env)).text(), "johnny home");
  assert.equal(await (await get("https://tim.hazwoperosha.us/", env)).text(), "tim home");
});

test("strips the folder from redirects", async () => {
  const env = { ASSETS: assets({}, { "/johnny/about.html": "/johnny/about", "/johnny/docs": "/johnny/docs/?x=1" }) };
  assert.equal((await get("https://johnny.hazwoperosha.us/about.html", env)).headers.get("Location"), "/about");
  assert.equal((await get("https://johnny.hazwoperosha.us/docs", env)).headers.get("Location"), "/docs/?x=1");
});

test("uses the site's 404.html when it has one", async () => {
  const env = { ASSETS: assets({ "/lucy/404.html": "lucy 404" }) };
  const res = await get("https://lucy.hazwoperosha.us/nope", env);
  assert.equal(res.status, 404);
  assert.equal(await res.text(), "lucy 404");
  assert.equal((await get("https://nobody.hazwoperosha.us/", env)).status, 404);
});

test("serves sites/_shared/ to every site", async () => {
  const env = { ASSETS: assets({ "/_shared/checkout.js": "shared js", "/johnny/_shared/checkout.js": "johnny's own" }) };
  assert.equal(await (await get("https://johnny.hazwoperosha.us/_shared/checkout.js", env)).text(), "shared js");
  assert.equal(await (await get("https://tim.hazwoperosha.us/_shared/checkout.js", env)).text(), "shared js");
  assert.equal(siteFor("_shared.hazwoperosha.us"), null);
});

test("keeps the hub out of search engines", async () => {
  const env = { ASSETS: assets({ "/hub/": "hub", "/tim/": "tim home" }) };
  assert.equal((await get("https://hub.hazwoperosha.us/", env)).headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal((await get("https://tim.hazwoperosha.us/", env)).headers.get("X-Robots-Tag"), null);
});
