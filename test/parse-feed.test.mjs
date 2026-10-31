import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed } from '../scripts/parse-feed.mjs';

test('parses RSS 2.0 with CDATA, entities and media images', () => {
  const xml = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>Feed</title><link>https://example.com</link>
  <item>
    <title><![CDATA[Paris Fashion Week: the best looks &amp; more]]></title>
    <link>https://example.com/a?utm=1</link>
    <pubDate>Fri, 30 Oct 2026 10:00:00 +0000</pubDate>
    <description><![CDATA[<p>Runway <b>highlights</b> from day&nbsp;one.</p>]]></description>
    <media:content url="https://img.example.com/a.jpg" medium="image"/>
  </item>
  <item>
    <title>Second &#8217;story&#8217;</title>
    <link>https://example.com/b</link>
    <description>&lt;img src="https://img.example.com/b.jpg"&gt;Text</description>
  </item>
  <item><title>No link</title></item>
</channel></rss>`;
  const items = parseFeed(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Paris Fashion Week: the best looks & more');
  assert.equal(items[0].link, 'https://example.com/a?utm=1');
  assert.equal(items[0].date, '2026-10-30T10:00:00.000Z');
  assert.equal(items[0].summary, 'Runway highlights from day one.');
  assert.equal(items[0].image, 'https://img.example.com/a.jpg');
  assert.equal(items[1].title, 'Second ’story’');
  assert.equal(items[1].image, 'https://img.example.com/b.jpg');
  assert.equal(items[1].summary, 'Text');
  assert.equal(items[1].date, null);
});

test('parses Atom', () => {
  const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title>
  <link href="https://example.com/"/>
  <entry>
    <title type="html">New record review</title>
    <link rel="alternate" type="text/html" href="https://example.com/review"/>
    <updated>2026-10-29T08:30:00Z</updated>
    <summary>A great album.</summary>
  </entry>
</feed>`;
  const [item] = parseFeed(xml);
  assert.equal(item.title, 'New record review');
  assert.equal(item.link, 'https://example.com/review');
  assert.equal(item.date, '2026-10-29T08:30:00.000Z');
  assert.equal(item.summary, 'A great album.');
});
