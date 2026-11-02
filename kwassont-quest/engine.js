'use strict';
// ---------------------------------------------------------------------------
// Kwassont Quest — engine: screen, palette, font, sprites, input, sound,
// scenes, dialog boxes and saves.
// ---------------------------------------------------------------------------
const W = 160, H = 144, T = 16;
const cv = document.getElementById('screen');
let ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const screenCtx = ctx;

const GB = ['#e0f8d0', '#88c070', '#346856', '#081820'];
let PAL = GB.slice(), ACC = '#e8a040', palV = PAL.join() + ACC;
function setPal(p, a) { PAL = p.slice(); ACC = a || p[2]; palV = PAL.join() + ACC; }
function col(c) { return typeof c === 'number' ? (c === 4 ? ACC : PAL[c]) : c; }
function rect(x, y, w, h, c) {
  ctx.fillStyle = col(c);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function cls(c) { rect(0, 0, W, H, c); }
function disc(cx, cy, r, c) {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    rect(cx - dx, cy + dy, dx * 2 + 1, 1, c);
  }
}
function ring(cx, cy, r, c) {
  const n = Math.max(16, Math.floor(r * 7));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    rect(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), 1, 1, c);
  }
}
function line(x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) rect(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 1, 1, c);
}
// Pokémon-style double border box
function box(x, y, w, h) {
  rect(x, y, w, h, 3);
  rect(x + 1, y + 1, w - 2, h - 2, 0);
  rect(x + 2, y + 2, w - 4, h - 4, 2);
  rect(x + 3, y + 3, w - 6, h - 6, 0);
}

// ---------------------------------------------------------------- font ----
const FONT = {
  A: [14,17,17,31,17,17,17], B: [30,17,17,30,17,17,30], C: [14,17,16,16,16,17,14],
  D: [28,18,17,17,17,18,28], E: [31,16,16,30,16,16,31], F: [31,16,16,30,16,16,16],
  G: [14,17,16,23,17,17,15], H: [17,17,17,31,17,17,17], I: [14,4,4,4,4,4,14],
  J: [7,2,2,2,2,18,12], K: [17,18,20,24,20,18,17], L: [16,16,16,16,16,16,31],
  M: [17,27,21,21,17,17,17], N: [17,17,25,21,19,17,17], O: [14,17,17,17,17,17,14],
  P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,20,18,17],
  S: [15,16,16,14,1,1,30], T: [31,4,4,4,4,4,4], U: [17,17,17,17,17,17,14],
  V: [17,17,17,17,17,10,4], W: [17,17,17,21,21,21,10], X: [17,17,10,4,10,17,17],
  Y: [17,17,10,4,4,4,4], Z: [31,1,2,4,8,16,31],
  0: [14,17,19,21,25,17,14], 1: [4,12,4,4,4,4,14], 2: [14,17,1,2,4,8,31],
  3: [31,2,4,2,1,17,14], 4: [2,6,10,18,31,2,2], 5: [31,16,30,1,1,17,14],
  6: [6,8,16,30,17,17,14], 7: [31,1,2,4,8,8,8], 8: [14,17,17,14,17,17,14],
  9: [14,17,17,15,1,2,12],
  '.': [0,0,0,0,0,12,12], ',': [0,0,0,0,12,4,8], '!': [4,4,4,4,4,0,4],
  '?': [14,17,1,2,4,0,4], "'": [4,4,8,0,0,0,0], '-': [0,0,0,31,0,0,0],
  ':': [0,12,12,0,12,12,0], '/': [1,1,2,4,8,16,16], '(': [2,4,8,8,8,4,2],
  ')': [8,4,2,2,2,4,8], '+': [0,4,4,31,4,4,0], '%': [24,25,2,4,8,19,3],
  '&': [12,18,20,8,21,18,13], '"': [10,10,0,0,0,0,0], '*': [0,4,21,14,21,4,0],
  '<': [2,4,8,16,8,4,2], '>': [8,4,2,1,2,4,8], '=': [0,0,31,0,31,0,0],
  '#': [10,10,31,10,31,10,10], '$': [4,15,20,14,5,30,4],
  '~': [0,10,31,31,14,4,0],            // heart
  '^': [4,14,21,4,4,4,4], '|': [4,4,4,4,21,14,4], // up / down arrows
  '@': [0,4,14,31,14,4,0],             // sparkle
  '_': [0,0,0,0,0,0,31], ';': [0,12,12,0,12,4,8],
  '[': [14,8,8,8,8,8,14], ']': [14,2,2,2,2,2,14],
};
function norm(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}
const glyphCache = {};
function glyph(ch, c) {
  const k = ch + c;
  let g = glyphCache[k];
  if (!g) {
    const d = FONT[ch] || FONT['?'];
    g = document.createElement('canvas'); g.width = 5; g.height = 7;
    const gx = g.getContext('2d'); gx.fillStyle = c;
    for (let r = 0; r < 7; r++) for (let b = 0; b < 5; b++) if (d[r] & (16 >> b)) gx.fillRect(b, r, 1, 1);
    glyphCache[k] = g;
  }
  return g;
}
function text(s, x, y, c = 3, sc = 1) {
  s = norm(s);
  const cc = col(c);
  let cx = x;
  for (const ch of s) {
    if (ch !== ' ') ctx.drawImage(glyph(ch, cc), Math.round(cx), Math.round(y), 5 * sc, 7 * sc);
    cx += 6 * sc;
  }
}
function textW(s, sc = 1) { return norm(s).length * 6 * sc - sc; }
function textC(s, y, c = 3, sc = 1, cx = W / 2) { text(s, Math.round(cx - textW(s, sc) / 2), y, c, sc); }
// text with a 1px outline so it reads over busy art
function textO(s, x, y, c = 0, o = 3, sc = 1) {
  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) text(s, x + dx, y + dy, o, sc);
  text(s, x, y, c, sc);
}
function wrap(s, n) {
  const out = [];
  for (const para of String(s).split('\n')) {
    let cur = '';
    for (const w of para.split(' ')) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= n) cur += ' ' + w;
      else { out.push(cur); cur = w; }
    }
    out.push(cur);
  }
  return out;
}

// ------------------------------------------------------------- sprites ----
// rows: array of strings; map: char -> colour (palette index or css string)
const sprCache = {};
function makeSpr(rows, map) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const v = map[rows[y][x]];
    if (v === undefined || v === null) continue;
    g.fillStyle = col(v); g.fillRect(x, y, 1, 1);
  }
  return c;
}
function getSpr(key, rows, map, fixed) {
  const k = fixed ? key : key + '#' + palV;
  return sprCache[k] || (sprCache[k] = makeSpr(rows, map));
}
function blit(c, x, y, flip, sc = 1) {
  x = Math.round(x); y = Math.round(y);
  if (flip) {
    ctx.save(); ctx.translate(x + c.width * sc, y); ctx.scale(-1, 1);
    ctx.drawImage(c, 0, 0, c.width * sc, c.height * sc); ctx.restore();
  } else ctx.drawImage(c, x, y, c.width * sc, c.height * sc);
}
const IDX = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4 };

// --------------------------------------------------------------- input ----
const Input = {
  held: {}, q: {},
  press(k) { if (!this.held[k]) this.q[k] = true; this.held[k] = true; Snd.unlock(); },
  release(k) { this.held[k] = false; },
  down(k) { return !!this.held[k]; },
  hit(k) { return !!this.q[k]; },
  eat(k) { this.q[k] = false; },
  any() { return this.q.a || this.q.start; },
  end() { this.q = {}; },
  dir() {
    if (this.held.up) return 'up'; if (this.held.down) return 'down';
    if (this.held.left) return 'left'; if (this.held.right) return 'right';
    return null;
  },
};
(function setupInput() {
  const keymap = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right', KeyZ: 'a', KeyJ: 'a', Space: 'a', KeyX: 'b', KeyK: 'b',
    Enter: 'start', ShiftLeft: 'select', ShiftRight: 'select', Backspace: 'select',
  };
  addEventListener('keydown', e => {
    const k = keymap[e.code]; if (!k) return;
    e.preventDefault(); if (!e.repeat) Input.press(k);
  });
  addEventListener('keyup', e => { const k = keymap[e.code]; if (k) { e.preventDefault(); Input.release(k); } });
  addEventListener('blur', () => { for (const k in Input.held) Input.held[k] = false; });

  document.querySelectorAll('[data-k]').forEach(b => {
    const k = b.dataset.k;
    const on = e => { e.preventDefault(); b.classList.add('down'); Input.press(k); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
    const off = e => { e.preventDefault(); b.classList.remove('down'); Input.release(k); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });

  const pad = document.getElementById('dpad');
  let cur = null;
  const setDir = d => {
    if (d === cur) return;
    if (cur) Input.release(cur);
    cur = d;
    pad.className = d ? d[0] : '';
    if (d) Input.press(d);
  };
  const fromEvent = e => {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 10) return cur;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (_) {} setDir(fromEvent(e)); });
  pad.addEventListener('pointermove', e => { if (cur) setDir(fromEvent(e)); });
  const end = e => { e.preventDefault(); setDir(null); };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
  pad.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());
})();

// --------------------------------------------------------------- sound ----
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(tok) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(tok); if (!m) return 0;
  let n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}
function parseTrack(str) {
  const toks = str.trim().split(/\s+/);
  const ev = new Array(toks.length).fill(null);
  for (let i = 0; i < toks.length; i++) {
    const f = noteFreq(toks[i]); if (!f) continue;
    let len = 1; while (toks[i + len] === '-') len++;
    ev[i] = { f, len };
  }
  return { ev, len: toks.length };
}
const songCache = {};
function parseSong(name) {
  if (songCache[name]) return songCache[name];
  const s = SONGS[name];
  const lead = parseTrack(s.lead), bass = parseTrack(s.bass);
  const drum = s.drum ? s.drum.replace(/\s+/g, '') : null;
  return (songCache[name] = { bpm: s.bpm, lead, bass, drum, len: lead.len, once: !!s.once });
}
const Snd = {
  ac: null, on: true, song: null, name: null, mul: 1, step: 0, next: 0, master: null, noise: null, timer: null,
  unlock() {
    if (!this.ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ac = new AC();
        this.master = this.ac.createGain();
        this.master.gain.value = this.on ? 0.55 : 0;
        this.master.connect(this.ac.destination);
        const len = this.ac.sampleRate * 0.3;
        this.noise = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.timer = setInterval(() => this.pump(), 25);
        if (this.name) { this.next = this.ac.currentTime + 0.05; }
      } catch (e) { this.ac = null; }
    }
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
  },
  toggle() {
    this.on = !this.on;
    if (this.master) this.master.gain.value = this.on ? 0.55 : 0;
    try { localStorage.setItem('kq_sound', this.on ? '1' : '0'); } catch (e) {}
  },
  play(name, mul = 1) {
    if (this.name === name && this.mul === mul && this.song) return;
    this.name = name; this.mul = mul; this.song = parseSong(name); this.step = 0;
    this.next = this.ac ? this.ac.currentTime + 0.06 : 0;
  },
  stop() { this.song = null; this.name = null; },
  pump() {
    if (!this.ac || !this.song) return;
    const s = this.song, sd = 60 / (s.bpm * this.mul) / 2;
    if (this.next < this.ac.currentTime - 0.3) this.next = this.ac.currentTime + 0.02;
    while (this.next < this.ac.currentTime + 0.15) {
      const i = this.step, t = this.next;
      const l = s.lead.ev[i % s.lead.len]; if (l) this.tone(l.f, t, l.len * sd * 0.92, 'square', 0.07);
      const b = s.bass.ev[i % s.bass.len]; if (b) this.tone(b.f, t, b.len * sd * 0.9, 'triangle', 0.16);
      if (s.drum) { const d = s.drum[i % s.drum.length]; if (d === 'x') this.hit(t, 0.05, 0.12); else if (d === 'o') this.hit(t, 0.02, 0.05); }
      this.step++; this.next += sd;
      if (this.step >= s.len) {
        if (s.once) { this.song = null; this.name = null; break; }
        this.step = 0;
      }
    }
  },
  tone(f, t, d, wave, vol) {
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = wave; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, d - 0.03));
    g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.03);
  },
  hit(t, d, vol) {
    const s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = this.noise; g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.02);
  },
  sfx(name) {
    if (!this.ac) return;
    const t = this.ac.currentTime + 0.01;
    const seq = {
      blip: [[880, 0.03]], select: [[660, 0.04], [990, 0.05]], coin: [[988, 0.05], [1319, 0.12]],
      bad: [[220, 0.08], [160, 0.14]], cute: [[784, 0.05], [988, 0.05], [1175, 0.05], [1568, 0.1]],
      eat: 'n', jump: [[330, 0.04], [440, 0.04], [660, 0.06]], photo: [[1760, 0.03], [0, 0.04], [1760, 0.05]],
      win: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.25]], lose: [[392, 0.1], [349, 0.1], [330, 0.1], [262, 0.3]],
      step: 'n2', stamp: [[196, 0.05], [0, 0.03], [784, 0.05], [1047, 0.15]],
    }[name];
    if (!seq) return;
    if (seq === 'n') { this.hit(t, 0.06, 0.2); this.hit(t + 0.09, 0.05, 0.15); return; }
    if (seq === 'n2') { this.hit(t, 0.015, 0.05); return; }
    let tt = t;
    for (const [f, d] of seq) { if (f) this.tone(f, tt, d, 'square', 0.08); tt += d; }
  },
};
try { if (localStorage.getItem('kq_sound') === '0') Snd.on = false; } catch (e) {}

// -------------------------------------------------------------- scenes ----
let stack = [], overlays = [], busy = 0, fc = 0;
let fade = 0, fadeDir = 0, fadeCb = null;
function topScene() { return stack[stack.length - 1]; }
function setScene(s) { stack = [s]; overlays = []; s.enter && s.enter(); }
function pushScene(s) {
  return new Promise(res => { s._res = res; stack.push(s); s.enter && s.enter(); });
}
function popScene(v) {
  const s = stack.pop(); const t = topScene();
  t && t.resume && t.resume();
  s && s._res && s._res(v);
}
function wait(frames) { return new Promise(res => overlays.push({ t: frames, update() { if (--this.t <= 0) { overlays.splice(overlays.indexOf(this), 1); res(); } }, draw() {}, invisible: true })); }
function fadeOut() { return new Promise(res => { fadeDir = 1; fadeCb = res; }); }
function fadeIn() { return new Promise(res => { fadeDir = -1; fadeCb = res; }); }
// run an async script while blocking world input
async function run(fn) { busy++; try { await fn(); } catch (e) { console.error(e); } finally { busy--; } }

// --------------------------------------------------------------- dialog ----
// line format: "NAME: text" or plain narration
class Dialog {
  constructor(lines, res) {
    this.pages = [];
    for (const ln of lines) {
      if (!ln) continue;
      const m = /^([A-Z0-9 .'&-]{2,14}):\s(.*)$/.exec(norm(ln));
      const who = m ? m[1] : '', body = m ? m[2] : norm(ln);
      const ws = wrap(body, 24);
      for (let i = 0; i < ws.length; i += 3) this.pages.push({ who, lines: ws.slice(i, i + 3) });
    }
    this.res = res; this.i = 0; this.n = 0; this.t = 0;
    if (!this.pages.length) this.pages.push({ who: '', lines: [''] });
  }
  get page() { return this.pages[this.i]; }
  get total() { return this.page.lines.join('').length; }
  update() {
    this.t++;
    if (this.n < this.total) {
      this.n += 1.5;
      if (Input.hit('a') || Input.hit('b')) this.n = this.total;
      if ((this.t & 3) === 0) Snd.sfx('step');
    } else if (Input.hit('a') || Input.hit('b')) {
      Snd.sfx('blip');
      this.i++; this.n = 0;
      if (this.i >= this.pages.length) { overlays.splice(overlays.indexOf(this), 1); this.res(); }
    }
  }
  draw() {
    const p = this.page; if (!p) return;
    const y = H - 42;
    box(0, y, W, 42);
    if (p.who) {
      const w = textW(p.who) + 10;
      box(4, y - 11, w, 14); rect(7, y - 1, w - 6, 3, 0);
      text(p.who, 9, y - 7, 3);
    }
    let left = Math.floor(this.n);
    p.lines.forEach((ln, i) => {
      const s = ln.slice(0, Math.max(0, left)); left -= ln.length;
      text(s, 7, y + 7 + i * 10, 3);
    });
    if (this.n >= this.total && (fc >> 4) & 1) text('|', W - 12, y + 31, 3);
  }
}
function say(...lines) {
  lines = lines.flat().filter(Boolean);
  if (!lines.length) return Promise.resolve();
  return new Promise(res => overlays.push(new Dialog(lines.map(fmt), res)));
}

class Choice {
  constructor(prompt, opts, res, cancel) {
    this.prompt = prompt ? new Dialog([fmt(prompt)], () => {}) : null;
    if (this.prompt) this.prompt.n = 999;
    this.opts = opts.map(o => norm(fmt(o))); this.res = res; this.i = 0; this.cancel = cancel;
  }
  update() {
    if (Input.hit('up')) { this.i = (this.i + this.opts.length - 1) % this.opts.length; Snd.sfx('blip'); }
    if (Input.hit('down')) { this.i = (this.i + 1) % this.opts.length; Snd.sfx('blip'); }
    const done = v => { overlays.splice(overlays.indexOf(this), 1); this.res(v); };
    if (Input.hit('a')) { Snd.sfx('select'); done(this.i); }
    else if (Input.hit('b') && this.cancel != null) { Snd.sfx('blip'); done(this.cancel); }
  }
  draw() {
    if (this.prompt) { this.prompt.n = 999; this.prompt.draw(); }
    const w = Math.max(...this.opts.map(o => textW(o))) + 20, h = this.opts.length * 11 + 9;
    const x = W - w - 2, y = (this.prompt ? H - 44 : H - 2) - h;
    box(x, y, w, h);
    this.opts.forEach((o, i) => {
      text(o, x + 13, y + 6 + i * 11, 3);
      if (i === this.i) text('>', x + 5, y + 6 + i * 11, 3);
    });
  }
}
function choose(prompt, opts, cancel = null) {
  return new Promise(res => overlays.push(new Choice(prompt, opts, res, cancel)));
}

// Small speech bubble that floats over a world character (non-blocking)
const bubbles = [];
function bubble(target, msg, frames = 150) {
  for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].target === target) bubbles.splice(i, 1);
  bubbles.push({ target, lines: wrap(norm(fmt(msg)), 16), t: frames });
}

// ----------------------------------------------------------------- game ----
const G = {
  char: 'mariana',           // who you play
  s: null,                   // save data
  get side() { return this.char === 'mariana' ? 'matias' : 'mariana'; },
  get P() { return this.char === 'mariana' ? 'MARIANA' : 'MATIAS'; },
  get S() { return this.char === 'mariana' ? 'MATIAS' : 'MARIANA'; },
};
// fill {P} {S} placeholders; pick per-character variant objects {mariana:..., matias:...}
function fmt(s) {
  if (s && typeof s === 'object' && !Array.isArray(s)) s = s[G.char] || s.any || '';
  return String(s).replace(/\{P\}/g, G.P).replace(/\{S\}/g, G.S);
}
function pick(v) { return (v && typeof v === 'object' && !Array.isArray(v) && (v.mariana || v.matias || v.any)) ? (v[G.char] || v.any) : v; }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

function newSave() {
  return {
    v: 1, city: 0, arrived: false, acc: null,
    stats: { food: 0, croissants: 0, coffee: 0, cute: 0, wc: 0, bush: 0, bags: 0, photos: [], stamps: [] },
    cs: null, // per-city state
  };
}
function saveKey(c) { return 'kq_save_' + c; }
function loadSave(c) { try { const s = JSON.parse(localStorage.getItem(saveKey(c))); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function writeSave() { try { localStorage.setItem(saveKey(G.char), JSON.stringify(G.s)); } catch (e) {} }
function clearSave(c) { try { localStorage.removeItem(saveKey(c)); } catch (e) {} }

// ---------------------------------------------------------------- loop ----
function tick() {
  fc++;
  if (fadeDir) {
    fade = clamp(fade + fadeDir * 0.12, 0, 1);
    if ((fadeDir > 0 && fade >= 1) || (fadeDir < 0 && fade <= 0)) { fadeDir = 0; const cb = fadeCb; fadeCb = null; cb && cb(); }
  } else if (overlays.length) overlays[overlays.length - 1].update();
  else { const s = topScene(); s && s.update && s.update(); }
  for (let i = bubbles.length - 1; i >= 0; i--) if (--bubbles[i].t <= 0) bubbles.splice(i, 1);
  if (Input.hit('select') && !(topScene() && topScene().ownSelect)) Snd.toggle();
  Input.end();
}
function render() {
  ctx = screenCtx;
  const s = topScene(); if (s && s.draw) s.draw();
  for (const o of overlays) if (!o.invisible) o.draw();
  if (fade > 0) {
    const steps = Math.round(fade * 4);
    // Game Boy fade: shift everything toward the lightest shade
    ctx.globalAlpha = steps / 4; rect(0, 0, W, H, 0); ctx.globalAlpha = 1;
  }
}
let last = 0, acc = 0;
function loop(t) {
  if (!last) last = t;
  acc += Math.min(100, t - last); last = t;
  let n = 0;
  while (acc >= 1000 / 60 && n < 4) { tick(); acc -= 1000 / 60; n++; }
  if (n) render();
  requestAnimationFrame(loop);
}

// Fit the canvas to the phone: largest whole-number scale that fits.
function fitScreen() {
  const bez = document.getElementById('bezel');
  const availW = bez.clientWidth - 28;
  const availH = Math.max(150, innerHeight - 330);
  let sc = Math.floor(Math.min(availW / W, availH / H) * 2) / 2;
  if (sc >= 2) sc = Math.floor(Math.min(availW / W, availH / H));
  sc = Math.max(1, sc);
  cv.style.width = W * sc + 'px';
  cv.style.height = H * sc + 'px';
}
addEventListener('resize', fitScreen);
