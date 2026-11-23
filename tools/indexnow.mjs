#!/usr/bin/env node
/**
 * Submit the sitemap URLs to IndexNow (Bing, Yandex, Seznam, Naver).
 *   npm run indexnow
 */
import { readFileSync } from 'node:fs';

const KEY = process.env.INDEXNOW_KEY ?? '1b50271b9b0edd9c9fc72032f5708caf';
const SITE = 'https://lulu-kids-page.vercel.app';
const host = 'lulu-kids-page.vercel.app';

const xml = readFileSync('sitemap.xml', 'utf8');
const urlList = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList,
  }),
});
console.log(`IndexNow ${res.status} ${res.statusText}: ${urlList.length} URLs from ${SITE}`);
if (![200, 202].includes(res.status)) {
  console.error((await res.text()).slice(0, 500));
  process.exit(1);
}
