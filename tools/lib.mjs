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
