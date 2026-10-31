// Fetches every feed in feeds.json and writes site/stories.json.
// Run: node scripts/fetch-stories.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { parseFeed } from './parse-feed.mjs';

const PER_TOPIC = 60;
const MAX_AGE_DAYS = 14;

const root = new URL('..', import.meta.url);
const { topics } = JSON.parse(await readFile(new URL('feeds.json', root), 'utf8'));

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StoriesReader/1.0)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text());
}

const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
const out = { updated: new Date().toISOString(), topics: topics.map((t) => t.name), stories: [] };
const failures = [];

for (const topic of topics) {
  const results = await Promise.allSettled(topic.feeds.map(fetchFeed));
  const seen = new Set();
  const stories = [];
  results.forEach((r, i) => {
    const feed = topic.feeds[i];
    if (r.status === 'rejected') { failures.push(`${feed.name}: ${r.reason.message}`); return; }
    console.log(`  ${topic.name} / ${feed.name}: ${r.value.length} stories`);
    for (const s of r.value) {
      const key = s.link.split('?')[0];
      if (seen.has(key)) continue;
      if (s.date && Date.parse(s.date) < cutoff) continue;
      seen.add(key);
      stories.push({ ...s, source: feed.name, topic: topic.name });
    }
  });
  stories.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  out.stories.push(...stories.slice(0, PER_TOPIC));
}

await writeFile(new URL('site/stories.json', root), JSON.stringify(out));
console.log(`Wrote ${out.stories.length} stories.`);
if (failures.length) console.warn(`Failed feeds:\n  ${failures.join('\n  ')}`);
