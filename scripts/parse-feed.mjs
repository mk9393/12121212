// Small, dependency-free RSS 2.0 / Atom parser. Good enough for news feeds.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

export function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    });
}

export function stripHtml(s = '') {
  return decode(s)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m) => decode(m))
    .replace(/\s+/g, ' ')
    .trim();
}

const esc = (t) => t.replace(/[:.]/g, '\\$&');

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${esc(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc(name)}>`, 'i'));
  return m ? m[1].trim() : '';
}

function attr(xml, name, attrName) {
  const m = xml.match(new RegExp(`<${esc(name)}\\s[^>]*?${attrName}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return m ? decode(m[1]) : '';
}

function atomLink(xml) {
  const links = xml.match(/<link\s[^>]*>/gi) || [];
  for (const l of links) {
    const rel = (l.match(/rel\s*=\s*["']([^"']+)/i) || [])[1];
    const href = (l.match(/href\s*=\s*["']([^"']+)/i) || [])[1];
    if (href && (!rel || rel === 'alternate')) return decode(href);
  }
  return '';
}

function findImage(xml) {
  const candidates = [
    attr(xml, 'media:content', 'url'),
    attr(xml, 'media:thumbnail', 'url'),
  ];
  const enc = xml.match(/<enclosure\s[^>]*>/i);
  if (enc && /type\s*=\s*["']image/i.test(enc[0])) candidates.push((enc[0].match(/url\s*=\s*["']([^"']+)/i) || [])[1]);
  const html = decode(tag(xml, 'content:encoded') || tag(xml, 'description') || tag(xml, 'content'));
  const img = html.match(/<img\s[^>]*src\s*=\s*["']([^"']+)/i);
  if (img) candidates.push(img[1]);
  const url = candidates.find((u) => u && /^https?:\/\//.test(u));
  return url ? decode(url) : '';
}

export function parseFeed(xml) {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
  return blocks.map((b) => {
    const title = stripHtml(tag(b, 'title'));
    const link = isAtom ? atomLink(b) : decode(tag(b, 'link')) || decode(tag(b, 'guid'));
    const dateStr = tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date');
    const date = dateStr ? new Date(decode(dateStr)) : null;
    const summary = stripHtml(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'));
    return {
      title,
      link: link.trim(),
      date: date && !isNaN(date) ? date.toISOString() : null,
      summary: summary.length > 240 ? summary.slice(0, 237).replace(/\s+\S*$/, '') + '…' : summary,
      image: findImage(b),
    };
  }).filter((s) => s.title && /^https?:\/\//.test(s.link));
}
