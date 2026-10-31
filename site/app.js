const $ = (s) => document.querySelector(s);
const READ_KEY = 'stories-read';
const TOPIC_KEY = 'stories-topic';

const store = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

let data = { topics: [], stories: [] };
let topic = store.get(TOPIC_KEY, 'All');
const read = new Set(store.get(READ_KEY, []));

function ago(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function renderTopics() {
  const names = ['All', ...data.topics];
  if (!names.includes(topic)) topic = 'All';
  $('#topics').replaceChildren(...names.map((name) => {
    const b = document.createElement('button');
    b.textContent = name;
    b.setAttribute('aria-pressed', name === topic);
    b.onclick = () => { topic = name; store.set(TOPIC_KEY, topic); renderTopics(); renderList(); scrollTo(0, 0); };
    return b;
  }));
}

function renderList() {
  const stories = data.stories
    .filter((s) => topic === 'All' || s.topic === topic)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  $('#list').replaceChildren(...stories.map((s) => {
    const li = document.createElement('li');
    li.className = 'story' + (read.has(s.link) ? ' read' : '');
    const a = document.createElement('a');
    a.href = s.link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.onclick = () => { read.add(s.link); store.set(READ_KEY, [...read].slice(-1000)); li.classList.add('read'); };

    const text = document.createElement('div');
    text.className = 'text';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = [s.source, ago(s.date)].filter(Boolean).join(' · ');
    const h2 = document.createElement('h2');
    h2.textContent = s.title;
    text.append(meta, h2);
    if (s.summary) { const p = document.createElement('p'); p.textContent = s.summary; text.append(p); }
    a.append(text);

    if (s.image) {
      const img = document.createElement('img');
      img.src = s.image; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
      img.onerror = () => img.remove();
      a.append(img);
    }
    li.append(a);
    return li;
  }));
  $('#status').textContent = stories.length ? '' : 'No stories yet.';
}

async function load() {
  try {
    const res = await fetch('stories.json', { cache: 'no-cache' });
    data = await res.json();
    $('#updated').textContent = data.updated ? `Updated ${ago(data.updated)}` : '';
  } catch {
    $('#status').textContent = "Couldn't load stories. Check your connection.";
    return;
  }
  renderTopics();
  renderList();
}

load();
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
