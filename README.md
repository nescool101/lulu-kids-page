# lulu-kids-page

Static site on Vercel (`index.html`, `privacy.html`, `blog/`, `api/suggest.js`). Bilingual es/en via `data-l` spans and the ES/EN toggle.

## Add a weekly guide

1. `cp blog/_template.html blog/<slug>.html` and replace `TITLE_ES`, `TITLE_EN`, `DESCRIPTION`, `SLUG`, `YYYY-MM-DD`; remove the `noindex` robots meta; write 600+ original words in each language.
2. Add a card at the top of `blog/index.html` (below the `POSTS` comment).
3. Add the URL with `<lastmod>` to `sitemap.xml`.
4. Optionally link it from the home "Guías / Guides" card. Open a PR; Vercel previews it.
