// Helpers for tools/build.mjs and the site templates in content/.

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function money(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Just enough Markdown for the guides. Blocks are separated by blank lines:
//   ## / ### headings, "- " and "1. " lists, "> " callouts, | pipe | tables |,
//   {{buy:587}} an enroll card for that course id.
// Inline: **bold**, *italic*, [text](url), [[587]] a link to that course's page.
export function md(text, h) {
  const inline = (s) => esc(s)
    .replace(/\[\[(\d+)\]\]/g, (_, id) => h.courseLink(Number(id)))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);

  return text.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.trim().split("\n").map((l) => l.trim());
    const first = lines[0];
    let m;
    if ((m = first.match(/^\{\{buy:(\d+)\}\}$/))) {
      const c = h.course(Number(m[1]));
      return `<div class="cta-card"><div><strong>${esc(c.name)}</strong><span>${esc(c.duration)} · ${money(c.price)} ${h.L.perSeat}</span></div>${h.buy(c.id, h.L.enroll)}</div>`;
    }
    if (first.startsWith("### ")) return `<h3>${inline(first.slice(4))}</h3>`;
    if (first.startsWith("## ")) return `<h2>${inline(first.slice(3))}</h2>`;
    if (first.startsWith("> ")) return `<blockquote>${lines.map((l) => inline(l.replace(/^>\s?/, ""))).join(" ")}</blockquote>`;
    if (first.startsWith("- ")) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
    if (/^\d+\. /.test(first)) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>`;
    if (first.startsWith("|")) {
      const cells = (l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const [head, , ...rows] = lines;
      return `<div class="table-wrap"><table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${
        rows.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return `<p>${inline(lines.join(" "))}</p>`;
  }).join("\n");
}

export function courseRow(c, h) {
  return `<div class="course-row"><div class="course-row-info"><a class="course-row-name" href="${c.url}">${esc(c.name)}</a><span class="course-row-meta">${esc(c.duration)} · ${h.L.course} #${c.id} · ${esc(c.citation)}</span></div><span class="course-row-price">${money(c.price)}</span>${h.buy(c.id, h.L.enroll, "btn btn-sm")}</div>`;
}

export function guideCard(g, h) {
  return `<a class="guide-card" href="${g.url}"><span class="guide-card-meta">${g.minutes} ${h.L.minRead}</span><strong>${esc(g.title)}</strong><span>${esc(g.description)}</span><span class="guide-card-cta">${h.L.read} →</span></a>`;
}

// Default header/footer and home page for sites that don't define their own shell() or home().
// They render the classes styled under body.tpl in sites/_shared/base.css; the site's style.css
// gives them their look. A site sets `hero` (and optionally `logo`, `heroArt`, `feature`).
export function defaultShell(site, { body, h }) {
  const logo = site.logo || esc(site.brand);
  return `<header class="top"><div class="wrap top-in">
<a class="logo" href="/">${logo}</a>
<nav><a href="/courses/">${h.L.courses}</a><a href="/guides/">${h.L.guides}</a>${h.buy(site.hero.cta[0], site.navCta || h.L.enroll, "btn btn-sm")}</nav>
</div></header>
<main>${body}</main>
<footer class="foot"><div class="wrap foot-in">
<div><a class="logo" href="/">${logo}</a><p>${esc(site.footNote || `${site.brand}: training from HAZWOPER OSHA Training LLC, delivered on hazwoper-osha.com.`)}</p></div>
<div><h4>${h.L.courses}</h4>${h.courses.map((c) => `<a href="${c.url}">${esc(c.short || c.name)}</a>`).join("")}</div>
<div><h4>Contact</h4><a href="tel:+18664296742">+1-866-429-6742</a><a href="mailto:info@hazwoper-osha.com">info@hazwoper-osha.com</a><a href="/guides/">${h.L.guides}</a><a href="/courses/#all">${h.L.allTrainings}</a></div>
</div></footer>`;
}

export function defaultHome(site, h) {
  const { hero } = site;
  const [ctaId, ctaLabel] = hero.cta;
  return `<section class="hero">${site.heroArt || ""}<div class="wrap hero-in">
<div class="hero-copy">
<p class="hero-call">Questions? Call <a href="tel:+18664296742">(866) 429-6742</a></p>
<h1>${hero.title}</h1>
<p class="hero-lede">${esc(hero.lede)}</p>
<div class="hero-cta">${h.buy(ctaId, ctaLabel)}${hero.alt ? `<a class="btn btn-alt" href="${hero.alt[0]}">${esc(hero.alt[1])}</a>` : ""}</div>
</div>
</div></section>
${site.feature ? site.feature(h) : ""}
<section class="sec sec-courses"><div class="wrap">
<h2 class="title">${site.coursesTitle || h.L.courses}</h2>
<div class="cgrid">${h.courses.map((c) => `<article class="cc"><p class="meta">${esc(c.duration)} · #${c.id}</p><h3><a href="${c.url}">${esc(c.short || c.name)}</a></h3><p>${esc(c.summary)}</p><div class="cc-foot"><b>${money(c.price)}</b>${h.buy(c.id, h.L.enroll, "btn btn-sm")}</div></article>`).join("")}</div>
<p class="all-link"><a href="/courses/#all">${h.L.allTrainings} (${h.total}) →</a></p>
</div></section>
<section class="sec sec-guides"><div class="wrap">
<h2 class="title">${site.guidesTitle || h.L.guides}</h2>
<div class="guide-list">${h.guides.map(h.guideCard).join("")}</div>
</div></section>`;
}
