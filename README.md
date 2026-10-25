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

## Hub

https://hub.hazwoperosha.us is a plain list of links to every site. `tools/hub.mjs` writes it from
the folders in `sites/`, and Wrangler runs that script before every deploy (the `build` block in
`wrangler.jsonc`), so new sites appear on their own. The hub is hidden from search engines: its page
has a `noindex, nofollow` meta tag, and the Worker sends `X-Robots-Tag: noindex, nofollow` for it.

## Shared files

`sites/_shared/` is served to every site at `/_shared/` (for example
`https://rcra.hazwoperosha.us/_shared/checkout.js`). It holds the course catalog, the Stripe checkout
and the base styles the course sites use. `_shared` can't be a subdomain, so it is never a site itself.

## Course landing sites

Fifty sites sell hazwoper-osha.com courses, each with its own niche, design, guides and course pages:

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
| [24-hour](https://24-hour.hazwoperosha.us) | 24-hour HAZWOPER, low-exposure workers | 581, 576, 595, 1099 |
| [construction](https://construction.hazwoperosha.us) | Construction on contaminated sites | 588, 581, 597, 595, 585 |
| [oil-gas](https://oil-gas.hazwoperosha.us) | Oil and gas crews | 591, 1056, 416, 478, 592, 595 |
| [remediation](https://remediation.hazwoperosha.us) | Environmental remediation crews | 590, 586, 583, 584, 1056, 595 |
| [lab-waste](https://lab-waste.hazwoperosha.us) | Laboratory hazardous waste | 415, 601, 600, 580, 602, 412 |
| [healthcare](https://healthcare.hazwoperosha.us) | Hospitals, clinics, pharmacies | 601, 415, 602, 600, 1099, 412 |
| [manufacturing](https://manufacturing.hazwoperosha.us) | Plant ERTs and waste | 702, 1099, 593, 601, 416, 412 |
| [ammonia](https://ammonia.hazwoperosha.us) | Ammonia refrigeration | 598, 1056, 593, 1099, 574 |
| [utility](https://utility.hazwoperosha.us) | Gas, pipeline and electric utilities | 592, 1056, 593, 1099, 595, 574 |
| [waste-shipping](https://waste-shipping.hazwoperosha.us) | Shipping hazardous waste (RCRA + DOT) | 403, 580, 601, 600, 602 |
| [ehs-managers](https://ehs-managers.hazwoperosha.us) | Running a HAZWOPER program | 1016, 597, 593, 412, 601, 900 |
| [state-plans](https://state-plans.hazwoperosha.us) | OSHA state-plan states | 900, 595, 577, 576, 578 |
| [crews](https://crews.hazwoperosha.us) | Seats for whole crews | 587, 581, 595, 597, 1016, 1099 |
| [awareness](https://awareness.hazwoperosha.us) | First responder awareness | 1099, 479, 585, 416 |
| [environmental-services](https://environmental-services.hazwoperosha.us) | Field waste technicians | 599, 403, 582, 594, 580, 584 |
| [texas](https://texas.hazwoperosha.us) | Texas (OSHA, TCEQ, RRC) | 587, 581, 595, 591, 601 |
| [gulf-coast](https://gulf-coast.hazwoperosha.us) | Refineries and petrochemical plants | 587, 593, 1056, 702, 591, 595 |
| [new-jersey](https://new-jersey.hazwoperosha.us) | New Jersey (OSHA, PEOSH, NJDEP) | 590, 587, 595, 900, 601, 1099 |
| [washington](https://washington.hazwoperosha.us) | Washington State (WAC 296-843) | 587, 590, 581, 900, 595, 1056 |
| [michigan](https://michigan.hazwoperosha.us) | Michigan (MIOSHA Part 432) | 587, 702, 1099, 601, 900, 595 |
| [disaster-recovery](https://disaster-recovery.hazwoperosha.us) | Disaster cleanup crews | 587, 581, 1099, 416, 584, 585 |
| [brownfields](https://brownfields.hazwoperosha.us) | Brownfield redevelopment | 588, 590, 581, 597, 586, 1056 |
| [landfill](https://landfill.hazwoperosha.us) | Landfills and transfer stations | 1099, 1056, 581, 587, 416, 584 |
| [rail](https://rail.hazwoperosha.us) | Rail hazmat response | 1099, 589, 593, 416, 478, 574 |
| [trucking](https://trucking.hazwoperosha.us) | Hazmat carriers and drivers | 403, 1099, 416, 479, 580 |
| [warehouse](https://warehouse.hazwoperosha.us) | Warehouses and distribution centers | 1099, 479, 416, 602, 601, 585 |
| [fire-departments](https://fire-departments.hazwoperosha.us) | Fire departments | 1099, 589, 593, 574, 1056, 584 |
| [industrial-cleaning](https://industrial-cleaning.hazwoperosha.us) | Industrial cleaning crews | 587, 1056, 584, 585, 416, 595 |
| [demolition](https://demolition.hazwoperosha.us) | Demolition on contaminated sites | 588, 581, 597, 1056, 585, 584 |
| [universities](https://universities.hazwoperosha.us) | College campuses | 415, 601, 600, 602, 1099, 412 |
| [federal-sites](https://federal-sites.hazwoperosha.us) | DoD and DOE cleanup contractors | 590, 587, 597, 593, 1016, 595 |
| [water-utilities](https://water-utilities.hazwoperosha.us) | Water and wastewater utilities | 1099, 1056, 593, 702, 574, 416 |
| [auto-shops](https://auto-shops.hazwoperosha.us) | Auto repair and fleet shops | 601, 415, 602, 416, 479, 1099 |
| [metal-finishing](https://metal-finishing.hazwoperosha.us) | Plating and metal finishing | 601, 600, 415, 702, 1099, 412 |
| [agriculture](https://agriculture.hazwoperosha.us) | Farms and ag retailers | 1099, 416, 598, 1056, 479, 602 |
| [marine](https://marine.hazwoperosha.us) | Marinas, ports and terminals | 478, 416, 591, 1099, 593, 1056 |
| [bilingual](https://bilingual.hazwoperosha.us) | English/Spanish crews | 1100, 587, 597, 595, 1099 |
| [careers](https://careers.hazwoperosha.us) | Starting a career | 587, 581, 403, 599, 595, 1099 |
| [small-business](https://small-business.hazwoperosha.us) | Small businesses | 601, 415, 602, 580, 416, 1099 |
| [data-centers](https://data-centers.hazwoperosha.us) | Data center facilities | 416, 479, 602, 1099, 1056, 601 |

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

To add a course site, copy a folder in `content/`, change it and run the build. A site can define its own
`shell()` and `home()`, or leave them out and set `hero` to use the default header, footer and home
page in `tools/lib.mjs` (most sites from `texas` onward do this). Its `style.css` gives it its look. Course prices and
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
