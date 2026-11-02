'use strict';
// ---------------------------------------------------------------------------
// Title, character select, intro, flights, passport stamps, ending + boot.
// ---------------------------------------------------------------------------
const CODES = { london: 'LON', toulouse: 'TLS', lisbon: 'LIS', amsterdam: 'AMS', vienna: 'VIE', doha: 'DOH', santiago: 'SCL', queenstown: 'ZQN' };

class TitleScene {
  enter() { setPal(GB, '#e8a040'); Snd.play('title'); this.t = 0; }
  resume() { this.enter(); }
  update() {
    this.t++;
    if (this.t > 20 && (Input.hit('start') || Input.hit('a'))) { Snd.sfx('select'); setScene(new SelectScene()); }
  }
  draw() {
    cls(0);
    for (let i = 0; i < 5; i++) rect((i * 47 + fc / 4) % 200 - 30, 10 + i * 9 % 30, 18, 3, 1);
    rect(0, 100, W, 44, 1); rect(0, 100, W, 2, 2);
    for (let x = 0; x < W; x += 12) rect(x + ((fc >> 2) % 12), 120, 6, 2, 2);
    textC('KWASSONT', 28, 2, 2); textC('KWASSONT', 27, 3, 2);
    textC('QUEST', 46, 2, 2); textC('QUEST', 45, 3, 2);
    const by = 66 + Math.round(Math.abs(Math.sin(fc / 14)) * -6);
    blit(icon('croissant'), 72, by, false, 2);
    blit(icon('cup'), 44, 74, false, 2); blit(icon('cup'), 100, 74, false, 2);
    const f = (fc >> 4) & 1;
    blit(charSpr('mariana', 'right', f), 54, 104); blit(charSpr('matias', 'left', f), 90, 104, true);
    text('~', 77, 100 - ((fc >> 3) & 1), 4);
    if ((fc >> 5) & 1) textC('PRESS START', 128, 3);
    text('M&M', 2, 136, 2);
  }
}

class SelectScene {
  constructor() { this.i = 0; this.saves = { mariana: loadSave('mariana'), matias: loadSave('matias') }; }
  enter() { setPal(GB, '#e8a040'); Snd.play('title'); }
  update() {
    if (busy) return;
    if (Input.hit('left') || Input.hit('right')) { this.i = 1 - this.i; Snd.sfx('blip'); }
    if (Input.hit('b')) { setScene(new TitleScene()); return; }
    if (Input.hit('a') || Input.hit('start')) { Snd.sfx('select'); run(() => this.choose()); }
  }
  get who() { return this.i ? 'matias' : 'mariana'; }
  async choose() {
    const who = this.who, save = this.saves[who];
    G.char = who;
    if (save) {
      const done = save.city >= CITIES.length;
      const c = await choose(done ? 'TRIP COMPLETE! WHAT NOW?' : 'SAVED TRIP: ' + CITIES[save.city].name + '.', [done ? 'SEE ENDING' : 'CONTINUE', 'NEW TRIP', 'BACK'], 2);
      if (c === 2) return;
      if (c === 0) {
        G.s = save;
        await fadeOut();
        if (done) setScene(new EndingScene()); else setScene(new World(save.city));
        fadeIn(); return;
      }
      const sure = await choose('START OVER? THIS ERASES ' + G.P + '\'S TRIP.', ['YES, NEW TRIP', 'NO'], 1);
      if (sure === 1) return;
    }
    G.s = newSave(); writeSave();
    await fadeOut(); setScene(new IntroScene()); fadeIn();
  }
  draw() {
    cls(0);
    textC('WHO IS TRAVELLING?', 6, 3);
    const opts = ['mariana', 'matias'];
    opts.forEach((who, i) => {
      const x = 12 + i * 76, sel = this.i === i;
      rect(x, 18, 60, 66, sel ? 3 : 2); rect(x + 2, 20, 56, 62, sel ? 1 : 0);
      ctx.save(); ctx.translate(x + 6, 24 + (sel ? -((fc >> 4) & 1) : 0)); ctx.scale(3, 3);
      blit(charSpr(who, 'down', sel ? (fc >> 4) & 1 : 0), 0, 0); ctx.restore();
      textC(who.toUpperCase(), 88, sel ? 3 : 2, 1, x + 30);
      const sv = this.saves[who];
      textC(sv ? (sv.city >= CITIES.length ? 'DONE!' : CODES[CITIES[sv.city].id] + ' ' + (sv.city + 1) + '/8') : 'NEW', 98, 2, 1, x + 30);
    });
    const desc = this.i === 0
      ? ['HATES WALKING. LOVES', 'CUTE THINGS (ENERGY!)', 'AND SHOPPING.']
      : ['STRONG. CARRIES BAGS.', 'SWEET TOOTH. ENDLESS', 'PIT. NEEDS THE TOILET.'];
    box(0, 106, W, 38);
    desc.forEach((l, i) => text(l, 6, 112 + i * 9, 3));
  }
}

class IntroScene {
  enter() { setPal(['#f8ecd8', '#d8b088', '#8a5a40', '#2a1810'], '#e0587a'); Snd.play('title'); this.go = false; }
  update() {
    if (!this.go) {
      this.go = true;
      run(async () => {
        await wait(30);
        await say('MARIANA AND MATIAS LOVE THREE THINGS: CROISSANTS, COFFEE, AND SEEING THE WORLD.',
          'ONE MORNING, OVER A VERY GOOD CROISSANT...',
          'MATIAS: WE SHOULD GO EVERYWHERE.', 'MARIANA: EVERYWHERE? THAT IS A LOT OF WALKING.',
          'MATIAS: EIGHT CITIES. EIGHT PASSPORT STAMPS. INFINITE SNACKS.',
          'MARIANA: ...AND SHOPPING?', 'MATIAS: AND SHOPPING. I WILL CARRY THE BAGS.',
          'MARIANA: DEAL.', 'AND SO, THE KWASSONT QUEST BEGAN!');
        await fadeOut(); setScene(new FlightScene(-1, 0)); fadeIn();
      });
    }
  }
  draw() {
    cls(0);
    rect(0, 70, W, 74, 1); for (let x = 0; x < W; x += 16) rect(x, 70, 1, 74, 2);
    rect(20, 10, 40, 30, 3); rect(22, 12, 36, 26, 1); rect(40, 12, 1, 26, 3); rect(22, 25, 36, 1, 3);
    rect(100, 14, 40, 18, 3); rect(102, 16, 36, 14, 0); text('CAFE', 108, 19, 3);
    ctx.save(); ctx.translate(30, 34); ctx.scale(2, 2);
    blit(charSpr('mariana', 'right', 0), 0, 0); blit(charSpr('matias', 'left', 0), 34, 0, true);
    ctx.restore();
    rect(56, 70, 48, 6, 3); rect(58, 72, 44, 3, 2); rect(78, 76, 4, 30, 3);
    blit(icon('cup'), 62, 62); blit(icon('croissant'), 76, 63); blit(icon('cup'), 90, 62);
  }
}

function geoXY(id) {
  const [lat, lon] = CITY_GEO[id];
  return [Math.round((lon + 180) / 360 * 160), Math.round(28 + (90 - lat) / 180 * 72)];
}
class FlightScene {
  constructor(from, to) { this.from = from; this.to = to; this.t = 0; this.dur = 170; }
  enter() {
    setPal(['#e8f4f8', '#a8d0d8', '#5a9a80', '#1c3040'], '#f0a040'); Snd.play('map');
    const tc = CITIES[this.to];
    const b = geoXY(tc.id);
    const a = this.from >= 0 ? geoXY(CITIES[this.from].id) : [b[0] - 30, b[1] + 6];
    let ax = a[0];
    if (b[0] - ax > 80) ax += 160; else if (ax - b[0] > 80) ax -= 160;
    this.a = [ax, a[1]]; this.b = b;
    this.quip = rnd(G.char === 'mariana'
      ? ['MATIAS: CAN I HAVE YOUR PLANE SNACK?', 'MATIAS: I NEED THE TOILET. ON A PLANE. AGAIN.', 'MARIANA: WAKE ME UP WHEN THERE ARE CROISSANTS.', 'MATIAS: THE PLANE FOOD IS... ACTUALLY GOOD?']
      : ['MARIANA: *ASLEEP ON YOUR SHOULDER*', 'MARIANA: DID WE PACK MY NEW BAGS? YOU DID. GOOD.', 'MATIAS: I ATE BOTH PLANE SNACKS. SHE WAS ASLEEP.', 'MARIANA: WINDOW SEAT IS SO CUUUTE.']);
  }
  update() {
    this.t++;
    if (this.t > 40 && (Input.hit('a') || Input.hit('start'))) this.t = Math.max(this.t, this.dur);
    if (this.t >= this.dur + 50 && !this.done) {
      this.done = true;
      run(async () => { await fadeOut(); setScene(new World(this.to)); fadeIn(); });
    }
  }
  draw() {
    cls(1);
    rect(0, 0, W, 22, 3);
    text('FLYING TO', 4, 3, 0); text(CITIES[this.to].name, 4, 12, 4);
    text(CITIES[this.to].country, W - 4 - textW(CITIES[this.to].country), 12, 0);
    for (let r = 0; r < WORLD.length; r++) for (let c = 0; c < 40; c++) if ((WORLD[r][c] || '.') === '#') rect(c * 4, 28 + r * 4, 4, 4, 2);
    for (let i = 0; i < CITIES.length; i++) {
      const [x, y] = geoXY(CITIES[i].id);
      const visited = G.s.stats.stamps.includes(CITIES[i].id);
      rect(x - 1, y - 1, 3, 3, visited ? 4 : 3); if (!visited) rect(x, y, 1, 1, 0);
    }
    const k = clamp(this.t / this.dur, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const [ax, ay] = this.a, [bx, by] = this.b;
    for (let i = 0; i <= 24; i++) {
      const s = i / 24; if (s > e) break;
      const x = ((ax + (bx - ax) * s) % 160 + 160) % 160, y = ay + (by - ay) * s - Math.sin(s * Math.PI) * 10;
      if (i % 2) rect(x, y, 1, 1, 3);
    }
    let px = ax + (bx - ax) * e; px = ((px % 160) + 160) % 160;
    const py = ay + (by - ay) * e - Math.sin(e * Math.PI) * 10;
    const dirRight = bx >= ax;
    rect(px - 4, py, 9, 2, 0); rect(px - (dirRight ? 3 : -2), py - 3, 2, 8, 0); rect(px + (dirRight ? -4 : 4), py - 2, 1, 3, 0);
    rect(px - 4, py + 1, 9, 1, 3);
    box(0, 108, W, 36);
    const lines = wrap(norm(this.quip), 24);
    lines.slice(0, 2).forEach((l, i) => text(l, 7, 115 + i * 10, 3));
  }
}

class StampScene {
  constructor(city) { this.city = city; this.t = 0; }
  enter() { this.prev = PAL.slice(); this.prevA = ACC; setPal(['#f8f0dc', '#d8c8a0', '#8a7050', '#2a2018'], '#c43a48'); Snd.play('jwin'); }
  update() {
    this.t++;
    if (this.t === 26) Snd.sfx('stamp');
    if (this.t > 70 && (Input.hit('a') || Input.hit('start'))) { setPal(this.prev, this.prevA); popScene(); }
  }
  draw() {
    cls(1);
    rect(8, 6, W - 16, H - 12, 3); rect(9, 7, W - 18, H - 14, 0); rect(W / 2, 7, 1, H - 14, 1);
    text('PASSPORT', 16, 12, 2); text(G.P, W / 2 + 8, 12, 2);
    CITIES.forEach((c, i) => {
      const x = 16 + (i % 4) * 34, y = 30 + Math.floor(i / 4) * 44;
      const has = G.s.stats.stamps.includes(c.id);
      const isNew = c.id === this.city.id;
      if (!has) { rect(x + 2, y + 2, 26, 26, 0); for (let k = 0; k < 26; k += 4) rect(x + 2 + k, y + 2, 2, 1, 1); text(CODES[c.id], x + 6, y + 12, 1); return; }
      if (isNew && this.t < 26) {
        const s = 1 + (26 - this.t) / 8;
        ctx.save(); ctx.translate(x + 15, y + 15); ctx.scale(s, s); ctx.translate(-15, -15);
        this.stamp(0, 0, c); ctx.restore();
      } else this.stamp(x, y, c);
    });
    if (this.t > 30) { box(16, H - 30, W - 32, 22); textC(this.city.name + ' STAMPED!', H - 22, 3); }
  }
  stamp(x, y, c) {
    ring(x + 15, y + 15, 13, 4); ring(x + 15, y + 15, 12, 4); ring(x + 15, y + 15, 9, 4);
    text(CODES[c.id], x + 7, y + 12, 4);
  }
}

// --------------------------------------------------------------- ending ----
function lmInfo(ph) {
  const city = CITIES.find(c => c.id === ph.city);
  const top = city.top.find(t => typeof t === 'object' && t.lm === ph.lm);
  const bot = (city.bottomLm || []).find(b => b.lm === ph.lm);
  return { city, top, bot, w: (top || bot || { w: 3 }).w };
}
const photoCache = {};
function photoCanvas(ph) {
  const k = ph.city + ph.lm;
  if (photoCache[k]) return photoCache[k];
  const { city, top, w } = lmInfo(ph);
  const prevP = PAL, prevA = ACC; setPal(city.pal, city.acc);
  const cw = Math.max(5, w + 2) * T;
  const c = document.createElement('canvas'); c.width = cw; c.height = 100;
  const prev = ctx; ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const ox = Math.round((cw - w * T) / 2);
  if (top) {
    drawBackdrop(city.backdrop, cw);
    ctx.save(); ctx.translate(ox, 0); LANDMARKS[ph.lm](0); ctx.restore();
    for (let x = 0; x < cw; x += T) tilePave(x, 80, false);
  } else {
    drawBackdrop(city.backdrop === 'none' ? 'roofs' : city.backdrop, cw);
    const gy = ph.lm === 'mirador' ? 80 : 50;
    rect(0, gy, cw, 100 - gy, city.bottom === 'water' ? 2 : 1);
    for (let i = 0; i < cw; i += 9) rect(i, gy + 10 + (i % 17), 4, 1, city.bottom === 'water' ? 1 : 2);
    ctx.save(); ctx.translate(ox, -150); LANDMARKS[ph.lm](0); ctx.restore();
    if (ph.lm === 'mirador') { blit(propSpr('telescope'), cw / 2 - 8, 70); }
  }
  ctx = prev; setPal(prevP, prevA);
  return (photoCache[k] = { c, pal: city.pal, acc: city.acc, city });
}

class EndingScene {
  constructor() { this.page = 'sunset'; this.photo = null; this.t = 0; }
  enter() {
    setPal(['#fff0d0', '#f0a070', '#a04870', '#301838'], '#f8d048'); Snd.play('ending');
    run(() => this.script());
  }
  async script() {
    const st = G.s.stats;
    await wait(80);
    await say('MARIANA: EIGHT CITIES.', 'MATIAS: EIGHT STAMPS.',
      'MARIANA: ' + st.cute + ' CUTE THINGS. ALL OF THEM SO CUUUTE.',
      'MATIAS: ' + st.food + ' THINGS EATEN. HONESTLY? NOT ENOUGH.',
      'MARIANA: ' + st.bags + ' SHOPPING BAG' + (st.bags === 1 ? '' : 'S') + '.', 'MATIAS: ...WHICH I CARRIED.',
      'MARIANA: AND ' + st.wc + ' TOILET STOPS.', 'MATIAS: WE DON\'T NEED TO COUNT THOSE.',
      'MARIANA: WHERE NEXT?', 'MATIAS: WHEREVER THERE ARE CROISSANTS.', 'MARIANA: ...AND BENCHES.');
    this.page = 'album';
    const photos = st.photos.slice();
    if (!photos.length) await say('(THE PHOTO ALBUM IS EMPTY. NEXT TRIP, STAND IN FRONT OF THE SIGHTS!)');
    let lastCity = null;
    for (const ph of photos) {
      this.photo = photoCanvas(ph); this.t = 0;
      if (this.photo.city.id !== lastCity) { lastCity = this.photo.city.id; Snd.play(this.photo.city.song); }
      await this.waitA(170);
    }
    this.photo = null; this.page = 'stats'; Snd.play('ending');
    await this.waitA(9999);
    this.page = 'end'; Snd.play('title');
    await this.waitA(9999);
    await fadeOut(); setScene(new TitleScene()); fadeIn();
  }
  waitA(n) {
    return new Promise(res => overlays.push({ t: 0, invisible: true, update() { this.t++; if (this.t > 25 && (this.t >= n || Input.hit('a') || Input.hit('start'))) { overlays.splice(overlays.indexOf(this), 1); res(); } }, draw() {} }));
  }
  update() { this.t++; }
  draw() {
    if (this.page === 'album' && this.photo) {
      setPal(this.photo.pal, this.photo.acc);
      cls(1);
      rect(0, 0, W, 12, 3); textC('PHOTO ALBUM', 3, 0);
      const c = this.photo.c, sc = Math.min(132 / c.width, 84 / c.height, 1.4);
      const w = Math.round(c.width * sc), h = Math.round(c.height * sc), x = Math.round((W - w) / 2), y = 18;
      rect(x - 4, y - 4, w + 8, h + 22, 0); rect(x - 4, y - 4, w + 8, 1, 3);
      ctx.drawImage(c, x, y, w, h);
      blit(charSpr('mariana', 'down', 0), x + w / 2 - 16, y + h - 18); drawAcc(G.s.acc, x + w / 2 - 16, y + h - 18, 'down');
      blit(charSpr('matias', 'down', 0), x + w / 2, y + h - 18);
      text('~', x + w / 2 - 3, y + h - 26, 4);
      const ph = G.s.stats.photos.find(p => photoCanvas(p) === this.photo);
      const name = ph ? ph.name : '';
      textC(name.length > 24 ? name.slice(0, 24) : name, y + h + 6, 3);
      textC(this.photo.city.name + ', ' + this.photo.city.country, 128, 3);
      return;
    }
    setPal(['#fff0d0', '#f0a070', '#a04870', '#301838'], '#f8d048');
    // sunset over the lake
    cls(0);
    for (let i = 0; i < 6; i++) rect(0, i * 8, W, 8, i < 3 ? 0 : 1);
    const sy = 56 + Math.min(20, this.t / 60);
    disc(80, sy, 14, 4);
    for (let px = 0; px < W; px++) { const h = 22 + Math.sin(px / 13) * 8 + Math.sin(px / 5) * 3; rect(px, 70 - h, 1, h, 2); rect(px, 70 - h, 1, 3, 0); }
    rect(0, 70, W, 74, 2);
    for (let i = 0; i < 9; i++) rect(70 + ((i * 7 + fc / 8) % 20) - 10, 74 + i * 5, 20 - i, 1, 4);
    rect(20, 100, 70, 5, 3); rect(21, 101, 68, 2, 1); for (let i = 0; i < 4; i++) rect(24 + i * 20, 105, 2, 39, 3);
    blit(charSpr('mariana', 'right', 0), 56, 86); drawAcc(G.s.acc, 56, 86, 'right');
    blit(charSpr('matias', 'right', 0), 68, 86);
    if ((fc >> 5) & 1) text('~', 66, 78, 4);
    if (this.page === 'stats') {
      const st = G.s.stats;
      box(8, 6, W - 16, 96);
      textC('TRIP REPORT', 12, 3);
      const rows = [['CITIES', st.stamps.length + '/8'], ['CROISSANTS', st.croissants], ['COFFEES', st.coffee], ['THINGS EATEN', st.food],
        ['CUTE THINGS', st.cute], ['PHOTOS', st.photos.length], ['BAGS CARRIED', st.bags], ['TOILET STOPS', st.wc], ['BUSHES', st.bush]];
      rows.forEach(([k, v], i) => { text(k, 16, 24 + i * 8, 3); text(String(v), W - 20 - textW(String(v)), 24 + i * 8, 2); });
    }
    if (this.page === 'end') {
      box(10, 14, W - 20, 64);
      textC('THE END', 22, 3, 2);
      textC('KWASSONT QUEST', 44, 3);
      textC('MADE FOR MARIANA', 56, 2);
      textC('& MATIAS ~', 66, 2);
    }
  }
}

// ----------------------------------------------------------------- boot ----
window.KQ = {
  G, CITIES, setScene, World, playGame, makeGame, Snd,
  start(char, ci) { G.char = char; G.s = newSave(); G.s.city = ci; G.s.arrived = true; setScene(new World(ci)); return topScene(); },
  scene: () => topScene(), overlays: () => overlays,
};
fitScreen();
setScene(new TitleScene());
requestAnimationFrame(loop);
