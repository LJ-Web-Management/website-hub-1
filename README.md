# Website Hub

Every folder in `sites/` is its own website, served at a subdomain with the same name:

```
sites/johnny/  ->  https://johnny.hazwoperosha.us
sites/tim/     ->  https://tim.hazwoperosha.us
sites/lucy/    ->  https://lucy.hazwoperosha.us
```

To add a site, add a folder with an `index.html` and push. To remove one, delete its folder.
No DNS change is needed either way.

All the sites run as one Cloudflare Worker (`src/index.js`). It reads the first part of the
hostname and serves the matching folder.

## Folder names

- Lowercase letters, numbers and hyphens only (`my-site`, not `My Site`). The name can't start or end with a hyphen.
- `about.html` is served at `/about`, and `docs/index.html` at `/docs/`.
- An optional `404.html` in a site's folder is shown for that site's missing pages.
- `www` is just another folder: `sites/www/` would serve `www.hazwoperosha.us`.
- The bare domain (`hazwoperosha.us`) is not served by this repo.

## One-time setup

1. Make sure hazwoperosha.us is on Cloudflare (its nameservers point to Cloudflare and the domain shows **Active**).
2. In Cloudflare DNS for hazwoperosha.us, add a wildcard record:

   | Type | Name | Content | Proxy |
   |------|------|---------|-------|
   | AAAA | `*`  | `100::` | Proxied (orange cloud) |

   `100::` is a placeholder address. The Worker answers every request, so nothing ever reaches it.
   Cloudflare's free certificate covers `*.hazwoperosha.us`, so HTTPS works for every new folder automatically.
3. Go to **Workers & Pages → Create → Import a repository**, pick this repo, and use:
   - Build command: *(leave empty)*
   - Deploy command: `npx wrangler deploy`
   - Production branch: `main`

   Every push to `main` now redeploys all the sites.

### Existing subdomains

A DNS record with a specific name (like `mail` or `shop`) always wins over the `*` record:

- If it's **DNS only** (grey cloud), it keeps working as before.
- If it's **Proxied** (orange cloud), the Worker route catches it and returns 404, unless there's a folder with that name. On hazwoperosha.us this includes `www` while it points to GitHub Pages: keep it DNS only. Make such records DNS only, or add a route for that hostname with no Worker under **Workers Routes** in the Cloudflare dashboard.

## Working locally

```sh
npm test                                           # routing tests
npx wrangler dev --local-upstream tim.hazwoperosha.us      # preview sites/tim at http://localhost:8787
```

Locally, Wrangler doesn't pass your real hostname through, so `--local-upstream` picks which site to preview.
