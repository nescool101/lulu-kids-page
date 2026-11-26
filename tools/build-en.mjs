// Generates /en/** (English-only, lang=en) from the bilingual source pages, and adds hreflang to the sources.
// Run: node tools/build-en.mjs   (idempotent). Source of truth = the bilingual files; never edit /en by hand.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
export const BASE = 'https://lulu-kids-page.vercel.app';
// privacy.html is one page with both languages in anchored sections: left as is, no /en twin.
export const pages = () => ['index.html', 'about.html', 'contact.html', 'terms.html', 'blog/index.html',
  ...readdirSync('blog').filter(f => f.endsWith('.html') && !f.startsWith('_') && f !== 'index.html').map(f => 'blog/' + f)];
export const url = (p, en) => BASE + (en ? '/en' : '') + '/' + p.replace(/index\.html$/, '');
const href = (p, en) => url(p, en).slice(BASE.length) || '/';
const EN = { // en title/description for non-article pages (articles take theirs from blog/index.html cards)
  'index.html': ['Lulu Kids – Calm learning games for kids', 'Calm learning games for kids 2 to 8+, in Spanish and English. Free with ads, no accounts or purchases. Works offline.'],
  'about.html': ['About Lulu Kids', 'Who makes Lulu Kids, why it exists and how we prepare the parent guides and learning games for children aged 2 to 8+.'],
  'contact.html': ['Contact Lulu Kids', 'How to contact Lulu Kids: questions, suggestions, bug reports and privacy requests.'],
  'terms.html': ['Terms of Use', 'Terms of use for the Lulu Kids app and website.'],
  'blog/index.html': ['Parent guides', 'Parent guides on educational games, screen time, reading, numbers and feelings for children aged 2 to 8.'],
};
// Short SEO titles (<=47 chars + " | Lulu Kids") per article: [es, en]. Optional desc overrides when the default is >160 chars.
const TITLES = {
  'animales-vocabulario-curiosidad': ['Animales para niños: vocabulario y curiosidad', 'Animals for kids: vocabulary and curiosity'],
  'apps-seguras-ninos-checklist': ['Apps seguras para niños: lista para padres', 'Safe apps for kids: a parent checklist'],
  'aprender-a-perder-frustracion-juegos': ['Aprender a perder: frustración en los juegos', 'Learning to lose: frustration in games'],
  'aprender-letras-sin-presion': ['Aprender las letras sin presión', 'Learning letters without pressure'],
  'cuentos-emociones-ninos': ['Cuentos sobre emociones para niños', 'Stories about feelings for kids'],
  'dibujar-y-pintar-creatividad': ['Dibujar y pintar: creatividad sin dirigir', 'Drawing and painting: nurture creativity'],
  'ensenar-colores-y-formas': ['Enseñar colores y formas sin flashcards', 'Teach colors and shapes without flashcards'],
  'juegos-de-logica-pensamiento': ['Juegos de lógica para niños: patrones', 'Logic games for kids: patterns and sequences'],
  'juegos-de-memoria-concentracion': ['Juegos de memoria para niños', 'Memory games for kids'],
  'juegos-educativos-por-edad': ['Juegos educativos según la edad (2 a 8+)', 'Educational games by age (2 to 8+)'],
  'jugar-sin-internet-viajes': ['Juegos sin internet para viajes y esperas', 'Offline play for trips and waiting rooms'],
  'ninos-bilingues-espanol-ingles': ['Niños bilingües en español e inglés', 'Bilingual kids in Spanish and English'],
  'juegos-en-familia-sin-pantallas': ['Juegos en familia sin pantallas', 'Screen-free family games'],
  'leer-en-voz-alta-ninos': ['Leer en voz alta a los niños', 'Reading aloud to kids'],
  'musica-ritmo-ninos-piano': ['Música y ritmo para niños', 'Music and rhythm for kids'],
  'preguntas-por-que-curiosidad-ninos': ['Los "por qué" de los niños', 'Kids\' endless "why" questions'],
  'rutina-para-dormir-ninos': ['Rutina para dormir en niños pequeños', 'A calm bedtime routine for kids'],
  'primeros-numeros-contar-jugando': ['Primeros números: enseñar a contar jugando', 'First numbers: teach counting through play'],
  'rompecabezas-beneficios-ninos': ['Rompecabezas para niños: beneficios y edades', 'Puzzles for kids: benefits and ages'],
  'tiempo-de-pantalla-rutina': ['Tiempo de pantalla en niños pequeños', 'Screen time for young kids: a calm routine'],
};
const DESCS = {
  'jugar-sin-internet-viajes': ['Ideas de juegos sin conexión, con y sin pantalla, para el coche, el avión y las salas de espera, y por qué conviene no depender de internet.', 'Offline game ideas, with and without screens, for the car, plane and waiting rooms, and why it helps not to depend on internet.'],
  'index': ['Guías para padres sobre juegos educativos, tiempo de pantalla, lectura, números y emociones para niños de 2 a 8 años.', null],
  'home': ['Juegos educativos tranquilos para niños de 2 a 8+ años, en español e inglés. Gratis con anuncios, sin cuentas ni compras. Funciona sin internet.', null],
};
const slugOf = p => p.replace(/^blog\//, '').replace(/\.html$/, '');
// remove every <tag ... data-l="x"> ... </tag> block, depth-aware
function strip(html, lang) {
  const re = new RegExp(`<(\\w+)\\b[^>]*\\bdata-l="${lang}"[^>]*>`, 'g'); let m;
  while ((m = re.exec(html))) {
    const tag = m[1], open = new RegExp(`<${tag}\\b|</${tag}>`, 'g'); open.lastIndex = m.index + m[0].length;
    let d = 1, t; while (d && (t = open.exec(html))) d += t[0][1] === '/' ? -1 : 1;
    html = html.slice(0, m.index) + html.slice(open.lastIndex); re.lastIndex = m.index;
  }
  return html;
}
const attr = (h, re) => (h.match(re) || [])[1];
const alts = p => `<link rel="alternate" hreflang="es" href="${url(p, 0)}">\n<link rel="alternate" hreflang="en" href="${url(p, 1)}">\n<link rel="alternate" hreflang="x-default" href="${url(p, 0)}">`;
function enMeta(p, src, cards) {
  if (EN[p]) return EN[p];
  const c = cards[p.slice(5)]; if (!c) throw new Error('no en card for ' + p);
  const s = slugOf(p); return [TITLES[s][1], (DESCS[s] || [])[1] || c.desc];
}
const cards = {}; // slug.html -> {title, desc} from blog index english spans
for (const m of readFileSync('blog/index.html', 'utf8').matchAll(/<h2><a href="\/blog\/([^"]+)"><span data-l="es">.*?<\/span><span data-l="en">(.*?)<\/span><\/a><\/h2><p data-l="es">.*?<\/p><p data-l="en">(.*?)<\/p>/g)) cards[m[1]] = { title: m[2], desc: m[3] };
export const enCards = cards;
const trail = (p, en) => { // [[name, path]] for BreadcrumbList; none for home
  if (p === 'index.html') return null;
  const g = en ? 'Guides' : 'Guías', last = p === 'blog/index.html' ? null : [p.startsWith('blog/') ? (TITLES[slugOf(p)] || [])[en ? 1 : 0] : EN_NAME[p]?.[en ? 1 : 0], p];
  return [['Lulu Kids', 'index.html'], ...(p.startsWith('blog/') ? [[g, 'blog/index.html']] : []), ...(last ? [last] : [])];
};
const EN_NAME = { 'about.html': ['Acerca de', 'About'], 'contact.html': ['Contacto', 'Contact'], 'terms.html': ['Términos de uso', 'Terms of Use'] };
const crumbLd = (p, en) => { const t = trail(p, en); return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: t.map(([n, f], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: url(f, en) })) })}</script>`; };
const crumbHtml = p => { const t = trail(p, 0), e = trail(p, 1);
  return `<nav class="crumbs" aria-label="Breadcrumb">${t.map(([n, f], i) => { const x = i ? `<span data-l="es">${n}</span><span data-l="en">${e[i][0]}</span>` : n; return i < t.length - 1 ? `<a href="${href(f, 0)}">${x}</a> › ` : `<span aria-current="page">${x}</span>`; }).join('')}</nav>`; };
const faqLd = (h, i) => { const sec = [...h.matchAll(/<section class="faq">(.*?)<\/section>/gs)][i]; if (!sec) return '';
  const t = x => x.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(), q = [...sec[1].matchAll(/<h3>(.*?)<\/h3>\s*<p>(.*?)<\/p>/gs)];
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: q.map(([, a, b]) => ({ '@type': 'Question', name: t(a), acceptedAnswer: { '@type': 'Answer', text: t(b) } })) })}</script>`; };
const FAQ_RE = /<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?<\/script>\n?/;
const esc = s => s.replace(/"/g, '&quot;');
for (const p of pages()) {
  let h = readFileSync(p, 'utf8');
  // 1) sources: hreflang block (replace any old one) after canonical
  h = h.replace(/<link rel="alternate" hreflang[^>]*>\n?/g, '');
  h = h.replace(/(<link rel="canonical"[^>]*>)/, `$1\n${alts(p)}`);
  const sl = slugOf(p), ts = TITLES[sl]?.[0], ds = DESCS[p === 'index.html' ? 'home' : sl]?.[0];
  if (ts) h = h.replace(/<title>.*?<\/title>/, `<title>${ts} | Lulu Kids</title>`);
  if (p === 'index.html') h = h.replace(/<title>.*?<\/title>/, '<title>Lulu Kids – Juegos educativos para niños</title>');
  if (ds) h = h.replace(/(<meta name="description" content=")[^"]*/, `$1${esc(ds)}`);
  h = h.replace('<meta name="twitter:card" content="summary">', '<meta name="twitter:card" content="summary_large_image">');
  const sw = /<button([^>]*)onclick="L\([^"]*"([^>]*)>(.*?)<\/button>/;
  h = h.replace(sw, `<a class="langsw" href="${href(p, 1)}" hreflang="en" lang="en">English</a>`)
    .replace('<script src="/blog/blog.js"></script>\n', '')
    .replace(/<script>\s*function L\(l\)\{[^\n]*\n\s*try \{ L\([^\n]*\n/, '<script>\n')
    .replace(/<script type="application\/ld\+json">(.*?)<\/script>/s, (_, j) => { const o = JSON.parse(j);
      for (const x of o['@graph'] || [o]) { if (x['@type'] !== 'MobileApplication' && x.inLanguage) x.inLanguage = 'es'; if (x.alternativeHeadline) delete x.alternativeHeadline; }
      return `<script type="application/ld+json">${JSON.stringify(o)}</script>`; });
  h = h.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList".*?<\/script>\n?/, '').replace(/<nav class="crumbs".*?<\/nav>\n?/, '');
  h = h.replace(FAQ_RE, '');
  if (trail(p, 0)) {
    h = h.replace(/(<script type="application\/ld\+json">.*?<\/script>)/s, `$1\n${crumbLd(p, 0)}`).replace(/(<\/div>\n)(?=<(?:article|h1))/, `$1${crumbHtml(p)}\n`);
    if (!h.includes('class="crumbs"')) throw new Error('crumb slot missing ' + p);
  }
  if (faqLd(h, 0)) h = h.replace(/(<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList".*?<\/script>)/, `$1\n${faqLd(h, 0)}`);
  writeFileSync(p, h);
  // 2) English twin
  const [t, d] = enMeta(p, h, cards), title = p === 'index.html' ? t : t + ' | Lulu Kids', cu = url(p, 1);
  let e = strip(h, 'es').replace('<html lang="es">', '<html lang="en">');
  e = e.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(d)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${cu}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(t)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(d)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${cu}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(t)}`)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(d)}`)
    .replace('content="es_ES"', 'content="en_US"').replace(/(<meta property="og:locale:alternate" content=")en_US/, '$1es_ES');
  // JSON-LD: english strings + inLanguage en + url
  e = e.replace(/<script type="application\/ld\+json">(.*?)<\/script>/s, (_, j) => {
    const o = JSON.parse(j); const fix = x => {
      if (Array.isArray(x)) return x.map(fix);
      if (x && typeof x === 'object') {
        for (const k in x) x[k] = fix(x[k]);
        if (x.inLanguage && x['@type'] !== 'MobileApplication') x.inLanguage = 'en';
        if (x.headline) { x.headline = t; x.description = d; }
        if (x['@type'] && ['CollectionPage', 'AboutPage', 'ContactPage', 'WebPage'].includes(x['@type'])) { x.name = t; }
        if (typeof x.url === 'string' && x.url === url(p, 0)) x.url = cu;
        if (typeof x.mainEntityOfPage === 'string') x.mainEntityOfPage = cu;
        if (x['@type'] === 'WebSite' || x['@type'] === 'MobileApplication') x.url = x.url; // home entity urls stay generic
      }
      return x;
    };
    return `<script type="application/ld+json">${JSON.stringify(fix(o))}</script>`;
  });
  if (trail(p, 1)) e = e.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList".*?<\/script>/, crumbLd(p, 1));
  e = e.replace(FAQ_RE, faqLd(e, 0) + (faqLd(e, 0) ? '\n' : ''));
  e = e.replace(/<meta name="robots" content="noindex">\n?/, '');
  // internal links -> /en twin (only for pages that have one); lang toggle -> link to ES twin
  e = e.replace(/href="(\/[^"#?]*)(#[^"]*)?"/g, (m, path, hash = '') => {
    const f = path === '/' ? 'index.html' : path.endsWith('/') ? path.slice(1) + 'index.html' : path.slice(1);
    return pages().includes(f) ? `href="${href(f, 1)}${hash}"` : m;
  });
  const es = href(p, 0);
  e = e.replace(/<a class="langsw"[^>]*>.*?<\/a>/, `<a class="langsw" href="${es}" hreflang="es" lang="es">Español</a>`).replace(/href="\/privacy\.html"/g, 'href="/privacy.html#en"');
  const out = 'en/' + p; mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, e);
}

// sitemap.xml: every page in es + en with xhtml alternates; privacy.html is bilingual (single entry)
const mod = p => (readFileSync(p, 'utf8').match(/"dateModified":\s*"([\d-]+)"/) || [])[1];
const dates = pages().filter(p => p.startsWith('blog/') && p !== 'blog/index.html').map(mod).sort();
const lm = p => { const d = p === 'blog/index.html' ? dates.at(-1) : mod(p); return d ? `<lastmod>${d}</lastmod>` : ''; };
const entry = (p, en) => `<url><loc>${url(p, en)}</loc>${lm(p)}<xhtml:link rel="alternate" hreflang="es" href="${url(p, 0)}"/><xhtml:link rel="alternate" hreflang="en" href="${url(p, 1)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${url(p, 0)}"/></url>`;
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  [...pages().flatMap(p => [entry(p, 0), entry(p, 1)]), `<url><loc>${BASE}/privacy.html</loc></url>`].join('\n') + '\n</urlset>\n');

const blogSlugs = Object.keys(TITLES);
const llms = [
  '# Lulu Kids — Juegos educativos tranquilos para niños (2 a 8+ años) / Calm Learning Games for Kids',
  '',
  '> App bilingüe (español e inglés) de juegos educativos, cuentos ilustrados y actividades sin internet para niños de 2 a 8+ años. Gratis con anuncios (se quitan con un código tras donar), sin cuentas ni compras, disponible en Google Play.',
  '',
  `Sitio web: ${BASE}/ (Español) · ${BASE}/en/ (English)`,
  'Google Play Store: https://play.google.com/store/apps/details?id=app.lulukids.kids_app',
  '',
  '## Páginas principales / Main Pages',
  `- [Inicio (ES)](${BASE}/) · [English Home](${BASE}/en/)`,
  `- [Guías para padres (ES)](${BASE}/blog/) · [Parent Guides (EN)](${BASE}/en/blog/)`,
  `- [Acerca de (ES)](${BASE}/about.html) · [About (EN)](${BASE}/en/about.html)`,
  `- [Contacto (ES)](${BASE}/contact.html) · [Contact (EN)](${BASE}/en/contact.html)`,
  `- [Términos de uso (ES)](${BASE}/terms.html) · [Terms of Use (EN)](${BASE}/en/terms.html)`,
  `- [Política de privacidad (ES/EN)](${BASE}/privacy.html)`,
  '',
  `## Guías para padres en Español (${blogSlugs.length})`,
  ...blogSlugs.map(s => `- [${TITLES[s][0]}](${BASE}/blog/${s}.html)`),
  '',
  `## Parent Guides in English (${blogSlugs.length})`,
  ...blogSlugs.map(s => `- [${TITLES[s][1]}](${BASE}/en/blog/${s}.html): ${(DESCS[s] || [])[1] || (cards[s + '.html'] && cards[s + '.html'].desc) || ''}`),
  ''
].join('\n');
writeFileSync('llms.txt', llms);
