'use strict';
// ---------------------------------------------------------------------------
// Mini-games. Each is a scene pushed on top of the world; it resolves with
// { win, score }. Shared intro card -> play -> result card.
// ---------------------------------------------------------------------------
class MiniGame {
  constructor(def, city) {
    this.def = def; this.city = city; this.phase = 'intro'; this.t = 0; this.score = 0;
    this.help = []; this.flash = 0; this.msg = ''; this.msgT = 0;
  }
  enter() { if (this.city) Snd.play(this.city.song, 1.25); }
  update() {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.msgT > 0) this.msgT--;
    if (this.phase === 'intro') {
      if (this.t > 30 && (Input.hit('a') || Input.hit('start'))) { this.phase = 'play'; this.t = 0; Snd.sfx('select'); this.start && this.start(); }
      return;
    }
    if (this.phase === 'play') { this.play(); return; }
    if (this.phase === 'end' && this.t > 60 && (Input.hit('a') || Input.hit('start'))) {
      if (this.city) Snd.play(this.city.song, 1);
      popScene({ win: this.win, score: this.score });
    }
  }
  say(m, t = 60) { this.msg = m; this.msgT = t; }
  finish(win, msg) {
    if (this.phase !== 'play') return;
    this.phase = 'end'; this.t = 0; this.win = win; this.endMsg = msg || (win ? 'YOU DID IT!' : 'SO CLOSE!');
    Snd.play(win ? 'jwin' : 'jlose');
  }
  timerBar(left, total) {
    rect(0, 0, W, 9, 3);
    text(this.def.title || '', 3, 1, 0);
    const w = 40, x = W - w - 3;
    rect(x, 2, w, 5, 0); rect(x + 1, 3, Math.max(0, (w - 2) * left / total), 3, left < total * 0.25 && (fc >> 3) & 1 ? 4 : 2);
  }
  draw() {
    this.drawGame();
    if (this.msgT > 0 && this.phase === 'play') {
      const m = norm(this.msg); const w = textW(m) + 8;
      box((W - w) / 2, 12, w, 14); textC(m, 16, 3);
    }
    if (this.phase === 'intro') {
      box(8, 22, W - 16, 100);
      textC(this.def.title || '', 30, 3);
      rect(16, 40, W - 32, 1, 2);
      const lines = this.help.flatMap(h => wrap(norm(fmt(h)), 22));
      lines.slice(0, 6).forEach((l, i) => text(l, 16, 45 + i * 9, 3));
      if ((fc >> 4) & 1) textC('PRESS A TO START', 108, 2);
    }
    if (this.phase === 'end') {
      box(16, 44, W - 32, 52);
      textC(this.win ? 'GREAT!' : 'OH NO!', 52, this.win ? 4 : 3, 2);
      const ls = wrap(norm(this.endMsg), 20);
      ls.forEach((l, i) => textC(l, 72 + i * 9, 3));
      if (this.t > 60 && (fc >> 4) & 1) text('|', W - 28, 86, 3);
    }
  }
}
function hearts(n, x = 3, y = 11) { for (let i = 0; i < 3; i++) if (i < n) blit(icon('heart'), x + i * 9, y); else { rect(x + i * 9 + 1, y + 2, 6, 4, 1); } }
function bothChars(x, y, dir, frame, sideFirst) {
  const a = G.char, b = G.side;
  blit(charSpr(sideFirst ? a : b, dir, frame), x + (sideFirst ? 14 : 0), y, dir === 'left');
  blit(charSpr(sideFirst ? b : a, dir, frame + 1), x + (sideFirst ? 0 : 14), y, dir === 'left');
}

// ------------------------------------------------------------------ timing ----
class TimingGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.help = ['A MARKER SLIDES ALONG THE BAR.', 'PRESS A WHEN IT IS INSIDE THE BOX.', `${def.rounds} HITS TO WIN. ${def.misses} MISSES AND YOU LOSE.`];
    this.hits = 0; this.miss = 0; this.pos = 0; this.dir = 1; this.speed = def.speed; this.newZone(); this.wob = 0;
  }
  newZone() { this.zw = Math.max(10, this.def.zone - this.hits * 3); this.zx = 20 + Math.floor(Math.random() * (120 - this.zw)); }
  play() {
    this.pos += this.speed * this.dir;
    if (this.pos >= 120) { this.pos = 120; this.dir = -1; } if (this.pos <= 0) { this.pos = 0; this.dir = 1; }
    if (this.wob > 0) this.wob--;
    if (Input.hit('a')) {
      const cx = 20 + this.pos;
      if (cx >= this.zx && cx <= this.zx + this.zw) {
        this.hits++; Snd.sfx('coin'); this.wob = 30;
        this.say(this.def.stages[this.hits - 1] || 'NICE!', 70);
        this.speed *= 1.18; this.newZone();
        if (this.hits >= this.def.rounds) this.finish(true, this.def.faces[this.def.rounds]);
      } else {
        this.miss++; Snd.sfx('bad'); this.flash = 12; this.say('MISSED!', 40);
        if (this.miss >= this.def.misses) this.finish(false, 'TRY AGAIN. YOU CAN DO IT!');
      }
    }
  }
  drawGame() {
    const art = this.def.art, h = this.hits;
    cls(0);
    if (art === 'guard') {
      rect(0, 60, W, 60, 1); for (let i = 0; i < W; i += 20) rect(i, 60, 1, 60, 2);
      rect(48, 0, 64, 60, 2); rect(52, 4, 56, 56, 1); // sentry box
      ctx.save(); ctx.translate(56, 26 + (this.wob ? (fc >> 1) & 1 : 0)); ctx.scale(3, 3);
      const look = { body: 'matias', short: true, shirt: 4, pants: 3, hat: 'tall' };
      blit(npcSpr(look, 0), 0, 0); drawHat('tall', 0, 0);
      if (h >= 2) { rect(5, 7, 6, 1, 3); }
      ctx.restore();
      const f = norm(this.def.faces[Math.min(h, 3)]);
      textC(f, 14, 3);
      blit(charSpr(G.char, 'right', (fc >> 4) & 1), 16, 74 - (h && (fc >> 3) & 1 ? 2 : 0));
      blit(charSpr(G.side, 'left', (fc >> 4) & 1), 128, 74, true);
    } else if (art === 'souq') {
      rect(0, 0, W, 70, 1);
      for (let i = 0; i < 8; i++) { rect(i * 20 + 4, 6, 12, 18, 4); rect(i * 20 + 9, 0, 2, 6, 3); }
      rect(0, 70, W, 30, 2); rect(0, 70, W, 2, 3);
      ctx.save(); ctx.translate(60, 30); ctx.scale(2.5, 2.5);
      blit(npcSpr({ body: 'matias', short: true, shirt: 0, hat: 'cloth' }, 0), 0, 0); drawHat('cloth', 0, 0);
      ctx.restore();
      blit(icon('scarf'), 110, 50, false, 2);
      textC(this.def.faces[Math.min(h, 3)], 12, 3, 2);
      blit(charSpr(G.char, 'right', 0), 16, 76);
      blit(charSpr(G.side, 'right', 1), 30, 76);
    } else if (art === 'bungee') {
      for (let y = 0; y < 100; y += 4) rect(0, y, W, 4, y < 40 ? 0 : 1);
      for (let i = 0; i < 4; i++) { rect(i * 6, 30 + i * 8, 40 - i * 6, 90, 2); rect(W - 40 + i * 6, 30 + i * 8, 40, 90, 2); }
      rect(0, 96, W, 6, 2); for (let i = 0; i < W; i += 8) rect(i, 98, 4, 2, 0);
      rect(20, 36, 120, 5, 3); rect(20, 41, 120, 2, 2);
      for (let i = 0; i < 6; i++) rect(24 + i * 22, 41, 2, 10, 3);
      const px = 60 + h * 14;
      rect(px + 14, 36 - 30, 1, 30, 3); // cord
      blit(charSpr(G.char, 'right', 0), px, 20);
      blit(charSpr(G.side, 'right', 1), px + 12, 20);
      textC(this.def.faces[Math.min(h, 3)], 12, 3);
    }
    if (this.phase === 'end' && this.win && art === 'bungee') {
      const y = Math.min(70, this.t * 2);
      rect(88, 0, 1, 20 + y, 3);
      blit(charSpr(G.char, 'down', 0), 74, 20 + y); blit(charSpr(G.side, 'down', 1), 88, 20 + y);
    }
    // bar
    rect(14, 104, 132, 18, 3); rect(15, 105, 130, 16, this.flash ? 4 : 0);
    rect(this.zx, 106, this.zw, 14, 1); rect(this.zx, 106, 1, 14, 3); rect(this.zx + this.zw - 1, 106, 1, 14, 3);
    const cx = 20 + this.pos;
    rect(cx - 1, 102, 3, 22, 3); rect(cx, 103, 1, 20, 4);
    text('HITS ' + h + '/' + this.def.rounds, 6, 128, 3);
    text('MISS ' + this.miss + '/' + this.def.misses, 96, 128, 3);
    rect(0, 0, W, 9, 3); text(this.def.title, 3, 1, 0);
  }
}

// ------------------------------------------------------------------- catch ----
class CatchGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.help = ['LEFT / RIGHT TO MOVE.', `CATCH ${def.goal} ${def.good === 'croissant' ? 'CROISSANTS' : 'TREATS'}.`, 'DODGE THE PIGEONS!'];
    if (G.char === 'matias') this.help.push('(MATIAS MIGHT EAT A FEW...)');
    this.x = 72; this.items = []; this.lives = 3; this.caught = 0; this.left = def.time * 60; this.spawn = 0; this.n = 0; this.walk = 0;
  }
  play() {
    this.left--;
    const d = Input.down('left') ? -1 : Input.down('right') ? 1 : 0;
    this.x = clamp(this.x + d * 2.4, 2, W - 18); if (d) { this.walk++; this.face = d < 0 ? 'left' : 'right'; }
    if (--this.spawn <= 0) {
      const prog = 1 - this.left / (this.def.time * 60);
      this.spawn = 34 - prog * 16;
      const bad = Math.random() < 0.28;
      this.items.push({ x: 24 + Math.random() * 112, y: 30, vx: (Math.random() - 0.5) * 0.8, vy: 0.7 + Math.random() * 0.7 + prog * 0.9, bad });
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.x = clamp(it.x + it.vx, 2, W - 18); it.y += it.vy;
      if (it.y > 96 && it.y < 112 && it.x + 12 > this.x && it.x < this.x + 14) {
        this.items.splice(i, 1);
        if (it.bad) { this.lives--; this.flash = 15; Snd.sfx('bad'); this.say('PIGEON ATTACK!', 40); if (this.lives <= 0) return this.finish(false, 'THE PIGEONS WON THIS TIME.'); }
        else {
          this.n++;
          if (G.char === 'matias' && this.n % 6 === 0) { Snd.sfx('eat'); this.say('*MUNCH* ...OOPS.', 50); G.s.stats.croissants++; }
          else { this.caught++; this.score = this.caught; Snd.sfx('coin'); }
          if (this.caught >= this.def.goal) return this.finish(true, 'A BASKET FULL OF CROISSANTS!');
        }
      } else if (it.y > 136) this.items.splice(i, 1);
    }
    if (this.left <= 0) this.finish(false, 'OUT OF TIME! ' + this.caught + ' CAUGHT.');
  }
  drawGame() {
    cls(0);
    // bakery facade
    rect(0, 9, W, 22, 1); for (let i = 0; i < W; i += 32) { rect(i + 6, 12, 20, 16, 3); rect(i + 7, 13, 18, 14, 4); rect(i + 8, 22, 16, 5, 0); }
    rect(0, 31, W, 2, 3);
    rect(0, 120, W, 24, 1); rect(0, 120, W, 1, 3);
    for (const it of this.items) blit(icon(it.bad ? this.def.bad : this.def.good), it.x, it.y, it.vx < 0, 2);
    const y = 104;
    if (!(this.flash & 2)) blit(charSpr(G.char, this.face || 'down', (this.walk >> 3) & 1), this.x, y, this.face === 'left');
    rect(this.x - 2, y - 4, 20, 5, 3); rect(this.x - 1, y - 3, 18, 3, 2);
    blit(charSpr(G.side, 'down', (fc >> 5) & 1), 140, 124 - 16 + 4);
    this.timerBar(this.left, this.def.time * 60);
    hearts(this.lives, 3, 34);
    text(this.caught + '/' + this.def.goal, W - 34, 35, 3);
  }
}

// ------------------------------------------------------------------ runner ----
class RunnerGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.help = ['UP / DOWN TO SWITCH LANES.', 'DODGE ' + (def.variant === 'tram' ? 'CARS AND PIGEONS.' : 'ROCKS AND DOGS.'), 'GRAB SNACKS. REACH THE TOP!'];
    this.lane = 1; this.y = 94; this.objs = []; this.lives = 3; this.left = def.time * 60; this.spawn = 40; this.scroll = 0; this.inv = 0; this.snacks = 0;
  }
  play() {
    this.left--; this.scroll += 1.6 + (1 - this.left / (this.def.time * 60)) * 1.2;
    if (Input.hit('up')) this.lane = Math.max(0, this.lane - 1);
    if (Input.hit('down')) this.lane = Math.min(2, this.lane + 1);
    const ty = [70, 94, 118][this.lane]; this.y += (ty - this.y) * 0.35;
    if (this.inv > 0) this.inv--;
    const sp = 1.8 + (1 - this.left / (this.def.time * 60)) * 1.6;
    if (--this.spawn <= 0) {
      this.spawn = 26 + Math.random() * 26;
      const lane = Math.floor(Math.random() * 3);
      const pick = Math.random() < 0.3;
      this.objs.push({ x: 170, lane, pick, k: pick ? this.def.pick : rnd(this.def.ob) });
    }
    for (let i = this.objs.length - 1; i >= 0; i--) {
      const o = this.objs[i]; o.x -= sp;
      if (o.x < -20) { this.objs.splice(i, 1); continue; }
      if (o.lane === this.lane && Math.abs(o.x - 28) < 14) {
        if (o.pick) { this.objs.splice(i, 1); this.snacks++; this.score = this.snacks; Snd.sfx('coin'); G.s.stats.food++; }
        else if (!this.inv) {
          this.lives--; this.inv = 70; Snd.sfx('bad'); this.flash = 12;
          this.say(o.k === 'dog' ? 'A DOG WANTS PETS!' : o.k === 'pigeon' ? 'PIGEON!' : 'BONK!', 45);
          if (this.lives <= 0) return this.finish(false, 'TOO MANY BUMPS. ONE MORE TRY!');
        }
      }
    }
    if (this.left <= 0) this.finish(true, (this.def.variant === 'tram' ? 'TOP OF THE HILL! ' : 'THE SUMMIT! ') + this.snacks + ' SNACKS GRABBED.');
  }
  drawGame() {
    cls(0);
    const s = this.scroll;
    // far hills / city
    for (let x = 0; x < W; x++) {
      const h = 18 + Math.sin((x + s * 0.2) / 14) * 6 + Math.sin((x + s * 0.2) / 5) * 2;
      rect(x, 56 - h, 1, h, 1);
    }
    if (this.def.variant === 'tram') {
      for (let i = -1; i < 9; i++) { const hx = i * 22 - (s * 0.5) % 22; rect(hx, 34, 18, 22, 2); rect(hx + 3, 38, 4, 5, 0); rect(hx + 11, 38, 4, 5, 0); rect(hx, 32, 18, 3, 4); }
    } else {
      for (let i = -1; i < 6; i++) { const tx = i * 34 - (s * 0.5) % 34; rect(tx + 10, 44, 3, 12, 3); disc(tx + 11, 42, 6, 2); }
    }
    rect(0, 56, W, 88, 1);
    for (let l = 0; l < 3; l++) {
      const ly = [70, 94, 118][l] + 14;
      rect(0, ly, W, 2, 2);
      if (this.def.variant === 'tram') for (let x = -((s) % 12); x < W; x += 12) rect(x, ly - 1, 2, 4, 3);
      else for (let x = -((s) % 20); x < W; x += 20) rect(x, ly + 3, 6, 1, 2);
    }
    for (const o of this.objs) {
      const oy = [70, 94, 118][o.lane];
      if (o.k === 'dog') blit(animalSpr('dog'), o.x - 8, oy - 2, true);
      else blit(icon(o.k), o.x - 8, oy, false, 2);
    }
    const blink = this.inv && (fc >> 2) & 1;
    if (!blink) {
      const y = Math.round(this.y), f = (fc >> 3) & 1;
      if (this.def.variant === 'tram') {
        rect(12, y - 6, 34, 22, 3); rect(13, y - 5, 32, 20, 4); rect(13, y + 5, 32, 3, 0);
        rect(16, y - 3, 10, 7, 0); rect(30, y - 3, 10, 7, 0);
        blit(charSpr(G.char, 'right', 0), 14, y - 9); blit(charSpr(G.side, 'right', 0), 28, y - 9);
        rect(16, y - 3, 10, 1, 3); rect(13, y + 15, 32, 2, 3);
        rect(28, y - 14, 1, 8, 3);
      } else {
        // Matias carrying Mariana piggyback
        blit(charSpr('mariana', 'right', 0), 18, y - 8);
        blit(charSpr('matias', 'right', f), 22, y);
      }
    }
    this.timerBar(this.left, this.def.time * 60);
    hearts(this.lives, 3, 12);
    blit(icon(this.def.pick), W - 30, 12); text('' + this.snacks, W - 20, 12, 3);
  }
}

// ------------------------------------------------------------------ memory ----
class MemoryGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.help = ['D-PAD TO MOVE. A TO FLIP A CARD.', 'MATCH ALL 6 PAIRS BEFORE TIME RUNS OUT.'];
    const deck = def.icons.concat(def.icons).map(k => ({ k, up: false, done: false }));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    this.cards = deck; this.cur = 0; this.open = []; this.hold = 0; this.left = def.time * 60; this.pairs = 0;
  }
  play() {
    this.left--;
    if (Input.hit('left')) this.cur = (this.cur + 11) % 12; if (Input.hit('right')) this.cur = (this.cur + 1) % 12;
    if (Input.hit('up')) this.cur = (this.cur + 8) % 12; if (Input.hit('down')) this.cur = (this.cur + 4) % 12;
    if (this.hold > 0) {
      if (--this.hold === 0) {
        const [a, b] = this.open;
        if (this.cards[a].k === this.cards[b].k) { this.cards[a].done = this.cards[b].done = true; this.pairs++; this.score = this.pairs; Snd.sfx('coin'); if (this.pairs === 6) return this.finish(true, 'FOUND THEM! BIKES AND MEMORIES.'); }
        else { this.cards[a].up = this.cards[b].up = false; }
        this.open = [];
      }
    } else if (Input.hit('a')) {
      const c = this.cards[this.cur];
      if (!c.up && !c.done) { c.up = true; this.open.push(this.cur); Snd.sfx('blip'); if (this.open.length === 2) this.hold = 36; }
    }
    if (this.left <= 0) this.finish(false, 'TIME UP! ' + this.pairs + ' PAIRS FOUND.');
  }
  drawGame() {
    cls(0);
    for (let x = 0; x < W; x += 8) rect(x, 128, 4, 16, 1);
    this.cards.forEach((c, i) => {
      const x = 12 + (i % 4) * 36, y = 18 + Math.floor(i / 4) * 36;
      rect(x, y, 28, 32, 3);
      if (c.up || c.done) { rect(x + 1, y + 1, 26, 30, c.done ? 1 : 0); blit(icon(c.k), x + 6, y + 8, false, 2); }
      else { rect(x + 1, y + 1, 26, 30, 2); for (let k = 0; k < 4; k++) rect(x + 4 + k * 6, y + 4 + k * 6, 4, 4, 4); }
      if (i === this.cur && (fc >> 3) & 1) { rect(x - 2, y - 2, 32, 2, 4); rect(x - 2, y + 32, 32, 2, 4); rect(x - 2, y, 2, 32, 4); rect(x + 28, y, 2, 32, 4); }
    });
    this.timerBar(this.left, this.def.time * 60);
    text('PAIRS ' + this.pairs + '/6', 4, 130, 3);
  }
}

// ------------------------------------------------------------------ rhythm ----
class RhythmGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.help = ['ARROWS FALL TO THE LINE.', 'PRESS THAT DIRECTION ON THE D-PAD WHEN IT REACHES THE LINE.', 'HIT ' + Math.round(def.need * 100) + '% TO WIN.'];
    this.lanes = ['left', 'down', 'up', 'right'];
    this.notes = []; let b = 4;
    for (let i = 0; i < def.notes; i++) { this.notes.push({ beat: b, lane: Math.floor(Math.random() * 4), st: 0 }); b += rnd([1, 1, 2, 2, 3]); }
    this.beatF = 3600 / 168; this.speed = 1.4; this.f = 0; this.hits = 0; this.done = 0; this.combo = 0;
  }
  enter() { if (this.city) Snd.play(this.city.song, 1); }
  start() { Snd.play(this.city ? this.city.song : 'title', 1); Snd.step = 0; this.f = 0; }
  play() {
    this.f++;
    const lineY = 112, travel = (lineY + 8) / this.speed;
    for (const n of this.notes) {
      n.y = lineY - (n.beat * this.beatF - this.f) * this.speed;
      if (n.st === 0 && n.y > lineY + 14) { n.st = 2; this.done++; this.combo = 0; this.say('MISS', 20); }
    }
    this.lanes.forEach((d, li) => {
      if (!Input.hit(d)) return;
      let best = null, bd = 99;
      for (const n of this.notes) if (n.st === 0 && n.lane === li) { const dd = Math.abs(n.y - lineY); if (dd < bd) { bd = dd; best = n; } }
      if (best && bd < 13) { best.st = 1; this.hits++; this.done++; this.combo++; this.score = this.hits; Snd.sfx('blip'); this.say(bd < 5 ? 'PERFECT!' : 'GOOD', 20); }
      else { this.combo = 0; this.flash = 6; }
    });
    if (this.done >= this.notes.length) {
      const r = this.hits / this.notes.length;
      this.finish(r >= this.def.need, Math.round(r * 100) + '% IN STEP!');
    }
    void travel;
  }
  drawGame() {
    cls(0);
    // ballroom: chandelier + twirling couple
    rect(0, 9, W, 50, 1);
    for (let i = 0; i < W; i += 16) rect(i, 9, 1, 50, 2);
    disc(80, 12, 6, 4); rect(74, 16, 13, 2, 3);
    const a = this.f / 20;
    blit(charSpr(G.char, ['down', 'right', 'up', 'left'][Math.floor(a) % 4], 0), 72 + Math.cos(a) * 14, 34 + Math.sin(a) * 3, Math.floor(a) % 4 === 3);
    blit(charSpr(G.side, ['up', 'left', 'down', 'right'][Math.floor(a) % 4], 1), 72 - Math.cos(a) * 14, 34 - Math.sin(a) * 3, Math.floor(a) % 4 === 1);
    rect(0, 58, W, 2, 3);
    const lx = [44, 68, 92, 116];
    lx.forEach((x, i) => { rect(x - 1, 60, 2, 76, 1); });
    rect(30, 111, 100, 2, this.flash ? 4 : 3);
    const glyphs = ['<', '|', '^', '>'];
    lx.forEach((x, i) => { box(x - 8, 106, 16, 12); text(glyphs[i], x - 2, 108, 2); });
    for (const n of this.notes) {
      if (n.st !== 0 || n.y < 60 || n.y > 140) continue;
      const x = lx[n.lane];
      rect(x - 7, n.y - 5, 14, 11, 3); rect(x - 6, n.y - 4, 12, 9, 4); text(glyphs[n.lane], x - 2, n.y - 3, 0);
    }
    rect(0, 0, W, 9, 3); text(this.def.title, 3, 1, 0);
    text(this.hits + '/' + this.notes.length, W - 40, 1, 0);
    if (this.combo > 2) text('COMBO ' + this.combo, 4, 124, 3);
  }
}

// --------------------------------------------------------------------- eat ----
class EatGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.isMat = G.char === 'matias';
    this.help = ['TAP A TO TAKE A BITE.', 'FINISH THE PLATE BEFORE TIME RUNS OUT.', this.isMat ? 'MATIAS IS A BOTTOMLESS PIT. GO WILD.' : 'DON\'T GET TOO FULL OR YOU HAVE TO REST!'];
    this.left = 20 * 60; this.bites = 0; this.full = 0; this.stuffed = 0; this.chew = 0;
    this.per = this.isMat ? 3.5 : 10;
  }
  play() {
    this.left--;
    this.full = Math.max(0, this.full - 0.38);
    if (this.chew > 0) this.chew--;
    if (this.stuffed > 0) { if (--this.stuffed === 0) this.say('OK... MORE.', 30); }
    else if (Input.hit('a')) {
      this.bites++; this.chew = 8; this.full += this.per; Snd.sfx('eat'); this.score = this.bites;
      if (this.full >= 100) { this.full = 100; this.stuffed = 80; this.say(G.P + ' IS STUFFED!', 70); Snd.sfx('bad'); }
      if (this.bites >= this.def.bites) return this.finish(true, this.isMat ? 'CLEAN PLATE. "...IS THERE DESSERT?"' : 'CLEAN PLATE! SO GOOD.');
    }
    if (this.left <= 0) this.finish(false, 'TIME! ' + (this.def.bites - this.bites) + ' BITES LEFT. TAKE IT TO GO?');
  }
  drawGame() {
    cls(0);
    rect(0, 70, W, 74, 1); rect(0, 70, W, 2, 3); for (let x = 0; x < W; x += 16) rect(x, 72, 8, 72, 2);
    rect(0, 70, W, 2, 3);
    // the diner
    const jaw = this.chew > 4 ? 1 : 0;
    ctx.save(); ctx.translate(56, 18); ctx.scale(3, 3);
    blit(charSpr(G.char, 'down', 0), 0, 0);
    if (jaw) rect(6, 7, 4, 1, '#1c1214');
    ctx.restore();
    blit(charSpr(G.side, 'down', (fc >> 5) & 1), 132, 46);
    // plate
    disc(80, 100, 26, 3); disc(80, 100, 25, 0); disc(80, 100, 20, 1);
    const left = 1 - this.bites / this.def.bites;
    const sc = Math.max(1, Math.round(1 + left * 4));
    const ic = icon(this.def.icon || 'bread');
    if (left > 0) blit(ic, 80 - 4 * sc, 100 - 4 * sc, false, sc);
    // fullness meter
    rect(6, 76, 14, 60, 3); rect(7, 77, 12, 58, 0);
    const fh = Math.round(56 * this.full / 100);
    rect(8, 134 - fh, 10, fh, this.full > 80 ? 4 : 2);
    text('FULL', 2, 66, 3);
    if (this.stuffed && (fc >> 3) & 1) textC('STUFFED!', 136, 4);
    text(this.bites + '/' + this.def.bites, W - 34, 128, 3);
    this.timerBar(this.left, 20 * 60);
    text(this.def.dish, 3, 11, 3);
  }
}

// -------------------------------------------------------------------- belt ----
class BeltGame extends MiniGame {
  constructor(def, city) {
    super(def, city);
    this.help = ['GRAB EVERYTHING ON THE LIST.', 'PRESS A WHEN AN ITEM IS IN THE BOX.', G.char === 'matias' ? 'WRONG ITEMS GET EATEN. BY YOU.' : 'WRONG ITEMS COST TIME!'];
    this.list = def.list.map(([n, k]) => ({ n, k, got: false }));
    this.items = []; this.left = 40 * 60; this.spawn = 0; this.stun = 0; this.off = 0;
  }
  play() {
    this.left--; if (this.stun > 0) this.stun--;
    const sp = 0.9 + (1 - this.left / 2400) * 0.7;
    this.off += sp;
    if (--this.spawn <= 0) {
      this.spawn = 30 / sp + Math.random() * 18;
      const need = this.list.filter(l => !l.got);
      const it = Math.random() < 0.45 && need.length ? rnd(need) : (() => { const [n, k] = rnd(this.def.decoys); return { n, k }; })();
      this.items.push({ x: 168, n: it.n, k: it.k });
    }
    for (let i = this.items.length - 1; i >= 0; i--) { this.items[i].x -= sp; if (this.items[i].x < -20) this.items.splice(i, 1); }
    if (Input.hit('a') && !this.stun) {
      const inZ = this.items.filter(it => it.x + 8 > 64 && it.x + 8 < 96).sort((a, b) => Math.abs(a.x - 72) - Math.abs(b.x - 72))[0];
      if (inZ) {
        this.items.splice(this.items.indexOf(inZ), 1);
        const l = this.list.find(l => l.n === inZ.n && !l.got);
        if (l) { l.got = true; Snd.sfx('coin'); this.say('GOT ' + l.n + '!', 40); this.score++; if (this.list.every(l => l.got)) return this.finish(true, 'BASKET FULL. ' + (G.char === 'matias' ? 'MATIAS CARRIES IT. OBVIOUSLY.' : 'MATIAS CARRIES IT.')); }
        else if (G.char === 'matias') { this.stun = 40; Snd.sfx('eat'); this.say('MATIAS ATE THE ' + inZ.n + '.', 50); G.s.stats.food++; }
        else { this.left -= 120; Snd.sfx('bad'); this.say('NOT ON THE LIST!', 40); this.flash = 10; }
      }
    }
    if (this.left <= 0) this.finish(false, 'THE SHOP IS CLOSING! TRY AGAIN.');
  }
  drawGame() {
    cls(0);
    // shelves
    rect(0, 50, W, 20, 1); for (let x = 0; x < W; x += 10) rect(x + 2, 54, 6, 12, 2); rect(0, 66, W, 2, 3);
    // list
    rect(0, 9, W, 40, 0);
    this.list.forEach((l, i) => {
      const x = 4 + (i % 2) * 80, y = 13 + Math.floor(i / 2) * 11;
      rect(x, y, 7, 7, 3); rect(x + 1, y + 1, 5, 5, l.got ? 4 : 0);
      text(l.n.length > 11 ? l.n.slice(0, 11) : l.n, x + 10, y, l.got ? 1 : 3);
    });
    text('LIST:', 4, 36, 2); text(this.def.name || '', 36, 36, 2);
    // belt
    rect(0, 84, W, 18, 3); rect(0, 85, W, 16, 2);
    for (let x = -(this.off % 8); x < W; x += 8) rect(x, 86, 1, 14, 3);
    rect(62, 78, 36, 30, this.flash ? 4 : 3); rect(64, 80, 32, 26, 2);
    for (const it of this.items) blit(icon(it.k), it.x, 82, false, 2);
    const inZ = this.items.find(it => it.x + 8 > 64 && it.x + 8 < 96);
    if (inZ) { const n = inZ.n; box(Math.max(0, 80 - textW(n) / 2 - 6), 110, Math.min(W, textW(n) + 12), 14); textC(n, 114, 3); }
    blit(charSpr(G.char, 'up', 0), 72, 126);
    if (this.stun) textC('*MUNCH*', 70, 3);
    this.timerBar(this.left, 2400);
  }
}

function makeGame(def, city) {
  const M = { timing: TimingGame, catch: CatchGame, runner: RunnerGame, memory: MemoryGame, rhythm: RhythmGame, eat: EatGame, belt: BeltGame }[def.type];
  return new M(def, city);
}
async function playGame(def, city) { return pushScene(makeGame(def, city)); }
