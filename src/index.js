// Serves sites/<name>/ at <name>.<your domain>. The first part of the hostname picks the folder:
// johnny.hazwoperosha.us/about -> sites/johnny/about.html (or sites/johnny/about/index.html).
// /_shared/ is the exception: every site gets sites/_shared/ there (checkout, course catalog).
// "_shared" can't be a subdomain, so it is never served as a site of its own.
// hub.<domain> lists every site (tools/hub.mjs) and is kept out of search engines.
// Every HTML page gets the Google Analytics tag added before </head>, so sites never include it.

const NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SHARED = "/_shared/";
const NOINDEX = new Set(["hub"]);
const GA_ID = "G-CSJ7GHDZXW";
const GA_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GA_ID}');
</script>
`;

export function siteFor(hostname) {
  const name = hostname.toLowerCase().split(".")[0];
  return NAME.test(name) ? name : null;
}

export default {
  async fetch(request, env) {
    const site = siteFor(new URL(request.url).hostname);
    const res = await withAnalytics(await serve(request, env, site));
    if (!NOINDEX.has(site)) return res;
    const headers = new Headers(res.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(res.body, { status: res.status, headers });
  },
};

async function withAnalytics(res) {
  if (!res.body || !(res.headers.get("Content-Type") || "").includes("text/html")) return res;
  const html = await res.text();
  const at = html.search(/<\/head>/i);
  const headers = new Headers(res.headers);
  headers.delete("Content-Length");
  const body = at === -1 || html.includes(GA_ID) ? html : html.slice(0, at) + GA_TAG + html.slice(at);
  return new Response(body, { status: res.status, headers });
}

async function serve(request, env, site) {
  const url = new URL(request.url);
  if (!site) return notFound();

  const prefix = `/${site}`;
  const path = url.pathname.startsWith(SHARED) ? url.pathname : prefix + url.pathname;
  const res = await env.ASSETS.fetch(new Request(new URL(path + url.search, url), request));

  // Asset serving redirects /about.html -> /about and /docs -> /docs/. Those redirects carry the
  // folder prefix, which visitors must never see.
  const location = res.headers.get("Location");
  if (location) {
    const target = new URL(location, url);
    if (target.pathname === prefix || target.pathname.startsWith(prefix + "/")) {
      target.pathname = target.pathname.slice(prefix.length) || "/";
      const headers = new Headers(res.headers);
      headers.set("Location", target.pathname + target.search);
      return new Response(res.body, { status: res.status, headers });
    }
  }

  if (res.status === 404) {
    const page = await env.ASSETS.fetch(new Request(new URL(`${prefix}/404.html`, url)));
    if (page.ok) return new Response(page.body, { status: 404, headers: page.headers });
    return notFound();
  }
  return res;
}

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
