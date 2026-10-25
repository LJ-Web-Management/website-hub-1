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

## Shared files

`sites/_shared/` is served to every site at `/_shared/` (for example
`https://rcra.hazwoperosha.us/_shared/checkout.js`). It holds the course catalog, the Stripe checkout
and the base styles the course sites use. `_shared` can't be a subdomain, so it is never a site itself.

## Course landing sites

Ten sites sell hazwoper-osha.com courses, each with its own niche, design, guides and course pages:

| Site | Niche | LMS course ids |
|---|---|---|
| [forty-hour](https://forty-hour.hazwoperosha.us) | OSHA 40-hour and industry tracks | 587, 588, 590, 591, 592, 589 |
| [refresher](https://refresher.hazwoperosha.us) | Annual 8-hour refreshers | 595, 900, 596, 574, 598 |
| [cal-osha](https://cal-osha.hazwoperosha.us) | Cal/OSHA and California waste | 577, 576, 578, 575, 579, 1051 |
| [rcra](https://rcra.hazwoperosha.us) | EPA RCRA generator compliance | 601, 600, 580, 415, 412, 602, 403 |
| [spill-response](https://spill-response.hazwoperosha.us) | Spills, kits and booms | 416, 479, 478, 1056, 591 |
| [supervisor](https://supervisor.hazwoperosha.us) | Supervisors, command, trainers | 597, 593, 596, 1016 |
| [espanol](https://espanol.hazwoperosha.us) | Spanish-language 40-hour | 1100, 1099, 595 |
| [micro-modules](https://micro-modules.hazwoperosha.us) | 15-20 minute modules | 585, 584, 583, 586, 478, 479 |
| [first-responder](https://first-responder.hazwoperosha.us) | Emergency response (q) | 1099, 593, 702, 589, 574 |
| [tsdf](https://tsdf.hazwoperosha.us) | TSD facility operations (p) | 582, 594, 599, 575, 579 |

They're generated. Edit the sources, then rebuild and commit the output:

```
content/catalog.json        every course: LMS course id, name, list price, length, citation
content/<site>/site.mjs     the site's copy, course list, guides, header/footer and home page
content/<site>/style.css    the site's design
tools/build.mjs             writes sites/<site>/ and sites/_shared/catalog.js
```

```sh
npm run build
```

To add a course site, copy a folder in `content/`, change it and run the build. Course prices and
names come from `content/catalog.json`, which was taken from the hazwoperosha.us repo
(`data/source.json` and `data/lms-ids.json`). Update both places when a price changes.

### Checkout

Any element with `data-buy="<LMS course id>"` opens the checkout dialog
(`sites/_shared/checkout.js`), and `?buy=<id>` opens it on page load. It works like the
hazwoperosha.us checkout: Stripe.js turns the card into a PaymentMethod, then the dialog calls the
hazwoper-osha.com `add_new_user` and `add_order` APIs with the course id and seat count. Orders are
tagged `order_from: <site>-hazwoperosha-us`, for example `rcra-hazwoperosha-us`.

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

   Every push to `main` now redeploys all the sites. Pushes to other branches only build a preview
   (`wrangler preview`, enabled by the `previews` block in `wrangler.jsonc`) and never change the live sites.

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
