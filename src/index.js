// Serves sites/<name>/ at <name>.<your domain>. The first part of the hostname picks the folder:
// johnny.abc.com/about -> sites/johnny/about.html (or sites/johnny/about/index.html).

const NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function siteFor(hostname) {
  const name = hostname.toLowerCase().split(".")[0];
  return NAME.test(name) ? name : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const site = siteFor(url.hostname);
    if (!site) return notFound();

    const prefix = `/${site}`;
    const res = await env.ASSETS.fetch(new Request(new URL(prefix + url.pathname + url.search, url), request));

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
  },
};

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
