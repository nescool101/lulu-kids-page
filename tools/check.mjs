// SEO/link audit, no deps. Run: node tools/check.mjs  (exit 1 on any problem). Run `node tools/build-en.mjs` first.
import { readFileSync, existsSync } from 'node:fs';
import { pages, url, BASE, enCards } from './build-en.mjs';
const bad = []; const err = (p, m) => bad.push(`${p}: ${m}`);
const all = [...pages(), ...pages().map(p => 'en/' + p), 'privacy.html'];
const seenT = {}, seenD = {};
const text = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
const words = h => (text(h).match(/\S+/g) || []).length;
const strip = (h, l) => h.replace(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>[\\s\\S]*?</\\1>`, 'g'), ''); // shallow; enough for h1/span counts
const resolve = h => { let f = h.split('#')[0].split('?')[0].replace(/^\//, ''); if (!f || f.endsWith('/')) f += 'index.html'; return f; };
for (const p of all) {
  const h = readFileSync(p, 'utf8'), en = p.startsWith('en/'), src = en ? p.slice(3) : p, art = /^blog\/(?!index)/.test(src);
  const g = re => (h.match(re) || [])[1];
  if (/LULU-[A-Z0-9]{3,}-[A-Z0-9]{3,}/.test(h)) err(p, 'promo code on a public page');
  if (/US\$ ?1\.99|full version|versión completa/i.test(h)) err(p, 'paid-version claim (app is free)');
  const title = g(/<title>(.*?)<\/title>/), desc = g(/<meta name="description" content="([^"]*)"/);
  if (!title || title.length > 60) err(p, `title ${title && title.length} chars (>60)`);
  if (!desc || desc.length > 160) err(p, `description ${desc && desc.length} chars (>160)`);
  if (seenT[title]) err(p, `dup title with ${seenT[title]}`); seenT[title] = p;
  if (seenD[desc]) err(p, `dup description with ${seenD[desc]}`); seenD[desc] = p;
  if (!h.includes(`<html lang="${en ? 'en' : 'es'}"`)) err(p, 'html lang');
  const canon = g(/<link rel="canonical" href="([^"]*)"/);
  if (p !== 'privacy.html') {
    if (canon !== url(src, en)) err(p, `canonical ${canon}`);
    for (const [l, e] of [['es', 0], ['en', 1], ['x-default', 0]]) if (!h.includes(`<link rel="alternate" hreflang="${l}" href="${url(src, e)}">`)) err(p, `hreflang ${l}`);
    if (!/index,follow/.test(h)) err(p, 'robots meta not index,follow');
    const h1 = (h.match(/<h1\b/g) || []).length - (en ? 0 : (h.match(/<h1[^>]*data-l="en"/g) || []).length);
    if (h1 !== 1) err(p, `${h1} visible h1`);
  }
  for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    let o; try { o = JSON.parse(m[1]); } catch { err(p, 'bad JSON-LD'); continue; }
    for (const x of o['@graph'] || [o]) if (x['@type'] === 'Article' && x.inLanguage !== (en ? 'en' : 'es')) err(p, 'Article inLanguage');
  }
  for (const m of h.matchAll(/<img\b[^>]*>/g)) { if (!/\balt="[^"]*"/.test(m[0])) err(p, 'img no alt'); if (!/loading="lazy"/.test(m[0]) || !/\bwidth=/.test(m[0]) || !/\bheight=/.test(m[0])) err(p, 'img needs loading=lazy + width/height'); }
  for (const m of h.matchAll(/\b(?:href|src)="(\/[^"]*)"/g)) { const f = resolve(m[1]); if (!existsSync(f)) err(p, `broken link ${m[1]}`); }
  if (art) {
    const body = en ? h : strip(h, 'en'); // es view = without data-l=en blocks
    if (words(body) < 800) err(p, `only ${words(body)} words`);
    const rel = (body.match(/<h2>(?:Keep reading|Sigue leyendo)<\/h2>\s*<ul>([\s\S]*?)<\/ul>/) || [])[1] || '';
    if ((rel.match(/<a href="\/(en\/)?blog\/[^"]+\.html"/g) || []).length < 3) err(p, '<3 related links');
    if (!/BreadcrumbList/.test(h)) err(p, 'no BreadcrumbList');
    if (!/"datePublished"/.test(h) || !/class="meta"/.test(h)) err(p, 'byline/dates');
    const hub = readFileSync(en ? 'en/blog/index.html' : 'blog/index.html', 'utf8');
    if (!hub.includes(`href="${en ? '/en' : ''}/${src}"`)) err(p, 'not listed on hub');
  }
}
const sm = readFileSync('sitemap.xml', 'utf8'), locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
for (const p of all) if (!locs.includes(p === 'privacy.html' ? BASE + '/privacy.html' : url(p.replace(/^en\//, ''), p.startsWith('en/')))) err(p, 'missing from sitemap');
for (const l of locs) if (!existsSync(resolve(l.slice(BASE.length)))) err('sitemap', `dead loc ${l}`);
if (new Set(locs).size !== locs.length) err('sitemap', 'duplicate loc');
if (!/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m.test(readFileSync('robots.txt', 'utf8'))) err('robots.txt', 'no Sitemap line');
for (const s of Object.keys(enCards)) if (!existsSync('blog/' + s)) err('blog/index.html', `card for missing ${s}`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`ok: ${all.length} pages, ${locs.length} sitemap urls`);
