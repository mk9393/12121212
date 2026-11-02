'use strict';
// ---------------------------------------------------------------------------
// The walk-around city: map building, movement, sidekick, meters, and every
// interaction (cafés, restaurants, shops, toilets, photos, people, the task).
// ---------------------------------------------------------------------------
const HUD = 10, VIEW_H = H - HUD, MAP_H = 15;
const KIND_W = { cafe: 3, restaurant: 3, boutique: 3, grocery: 3, wc: 2, airport: 4 };
const KIND_H = { cafe: 3, restaurant: 3, boutique: 3, grocery: 3, wc: 2, airport: 3 };
const ANIM_LM = { windmill: 1, riesenrad: 1, gondola: 1, steamer: 1, dhow: 1 };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const key = (x, y) => x + ',' + y;
const PAID_WC = { toulouse: 1, lisbon: 1, amsterdam: 1, vienna: 1 };

function cityState() {
  return { task: false, restaurant: false, grocery: false, boutique: false, cafe: false, sights: [], cutes: [], sniffed: [] };
}

class World {
  constructor(ci) {
    this.ci = ci; this.c = CITIES[ci];
    bubbles.length = 0;
    setPal(this.c.pal, this.c.acc);
    if (!G.s.cs || G.s.cs.id !== this.c.id) G.s.cs = Object.assign(cityState(), { id: this.c.id });
    if (!G.s.m) G.s.m = { energy: 100, hunger: 100, bladder: 20 };
    this.cs = G.s.cs; this.m = G.s.m;
    this.build();
    this.p = { tx: 1, ty: 6, px: 16, py: 96, dir: 'down', moving: false, walk: 0 };
    this.sk = { tx: 2, ty: 6, px: 32, py: 96, dir: 'down', walk: 0 };
    this.cam = { x: 0, y: 0 };
    this.chat = 420; this.wcT = 0; this.piggy = 0; this.sit = 0; this.hangry = false; this.pulled = false;
    this.title = 0;
  }

  // ---------------------------------------------------------------- build --
  build() {
    const c = this.c;
    this.items = []; let x = 1;
    for (const t of c.top) {
      const it = typeof t === 'string'
        ? { kind: t, id: t, x, w: KIND_W[t], h: KIND_H[t], label: (c.labels[t] || t.toUpperCase()) }
        : { kind: 'lm', id: t.lm, lm: t.lm, x, w: t.w, name: t.name, photo: t.photo };
      if (t === 'airport') it.label = this.ci === CITIES.length - 1 ? 'HOME' : 'FLY';
      if (t === 'wc') it.label = 'WC';
      this.items.push(it); x += it.w + 1;
    }
    this.w = x + 1; this.h = MAP_H;
    const water = c.bottom === 'water';
    this.solid = new Uint8Array(this.w * this.h);
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      if (ty <= 4 || (water && ty >= 11)) this.solid[ty * this.w + tx] = 1;
    }
    this.doors = {}; this.spots = {};
    for (const it of this.items) {
      if (it.kind === 'lm') this.spots[key(it.x + (it.w >> 1), 5)] = it;
      else { it.door = [it.x + (it.w >> 1), 4]; this.doors[key(it.x + (it.w >> 1), 4)] = it; }
    }
    this.bottoms = (c.bottomLm || []).map(b => Object.assign({ kind: 'lm' }, b));
    for (const b of this.bottoms) this.spots[key(b.x + (b.w >> 1), 10)] = b;

    this.objs = []; this.occ = {};
    const find = id => this.items.find(i => i.id === id);
    const place = (o, at, dx, row) => {
      const base = find(at); let tx = (base ? base.x : 2) + (dx || 0), ty = row;
      for (let tries = 0; tries < 40; tries++) {
        if (this.canPlace(tx, ty)) break;
        tx = tx + 1 >= this.w - 1 ? 1 : tx + 1;
      }
      o.tx = tx; o.ty = ty; this.objs.push(o); this.occ[key(tx, ty)] = o;
    };
    for (const n of c.npcs) place(Object.assign({ type: n.prop ? 'prop' : 'npc' }, n), n.at, n.dx, n.row);
    c.cutes.forEach((cu, i) => place(Object.assign({ type: 'cute', idx: i }, cu), cu.at, cu.dx, cu.row));
    c.snacks.forEach((s, i) => place(Object.assign({ type: 'snack', idx: i }, s), s.at, s.dx, s.row));
    for (const b of this.bottoms) if (b.prop) { const o = { type: 'deco', prop: b.prop, tx: b.x + (b.w >> 1), ty: 11 }; this.objs.push(o); this.occ[key(o.tx, o.ty)] = o; }
    // street furniture
    for (let tx = 3; tx < this.w - 1; tx += 7) if (this.canPlace(tx, 9)) { const o = { type: 'deco', prop: 'lamp', tx, ty: 9 }; this.objs.push(o); this.occ[key(tx, 9)] = o; }
    for (let tx = 6; tx < this.w - 1; tx += 9) if (this.canPlace(tx, 10)) { const o = { type: 'bench', prop: 'bench', tx, ty: 10 }; this.objs.push(o); this.occ[key(tx, 10)] = o; }
    if (!water) for (let tx = 1; tx < this.w - 1; tx += 3) for (const ty of [12, 14]) {
      const sx = tx + (ty === 14 ? 1 : 0);
      if (this.canPlace(sx, ty) && !this.spots[key(sx, ty - 1)]) { const o = { type: 'deco', prop: 'tree', tx: sx, ty }; this.objs.push(o); this.occ[key(sx, ty)] = o; }
    }
    this.renderMap();
  }
  canPlace(tx, ty) {
    if (tx < 1 || tx >= this.w - 1 || ty < 5 || ty >= this.h) return false;
    if (this.solid[ty * this.w + tx]) return false;
    if (this.occ[key(tx, ty)] || this.spots[key(tx, ty)]) return false;
    if (ty === 5 && this.doors[key(tx, 4)]) return false;
    if (ty === 6 && tx <= 3) return false; // keep the start clear
    return true;
  }
  renderMap() {
    const c = this.c, cvs = document.createElement('canvas');
    cvs.width = this.w * T; cvs.height = this.h * T;
    const prev = ctx; ctx = cvs.getContext('2d'); ctx.imageSmoothingEnabled = false;
    drawBackdrop(c.backdrop, cvs.width);
    const water = c.bottom === 'water';
    for (let ty = 4; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const X = tx * T, Y = ty * T;
      if (ty === 4) tileWall(X, Y, ty, tx);
      else if (ty === 5 || ty === 6 || ty === 9) tilePave(X, Y, ty === 6);
      else if (ty === 7 || ty === 8) tileRoad(X, Y, ty, tx);
      else if (ty === 10) water ? tilePromenade(X, Y, tx) : tileGrass(X, Y, tx, ty);
      else water ? tileWater(X, Y, tx, ty) : tileGrass(X, Y, tx, ty);
    }
    for (const it of this.items) {
      if (it.kind === 'lm') { if (!ANIM_LM[it.lm]) LANDMARKS[it.lm](it.x * T); }
      else drawShop(it.x * T, it.w, it.h, it.kind, it.label, c.roof);
    }
    for (const b of this.bottoms) if (!ANIM_LM[b.lm]) LANDMARKS[b.lm](b.x * T);
    this.map = cvs; ctx = prev;
  }

  // ------------------------------------------------------------ helpers --
  walkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return false;
    if (this.solid[ty * this.w + tx]) return false;
    if (this.occ[key(tx, ty)]) return false;
    return true;
  }
  get speed() {
    if (G.char === 'matias' && this.hangry) return 1;
    return 2;
  }
  checklistDone() { return { sights: this.cs.sights.length, sightsN: this.items.filter(i => i.kind === 'lm').length + this.bottoms.length, cutes: this.cs.cutes.length, cutesN: this.c.cutes.length }; }
  hasMariana() { return true; }

  enter() { Snd.play(this.c.song); }
  resume() { setPal(this.c.pal, this.c.acc); Snd.play(this.c.song); }

  // ------------------------------------------------------------- update --
  update() {
    if (!G.s.arrived) { run(() => this.arrive()); return; }
    if (busy) return;
    if (Input.hit('start')) { run(() => this.pauseMenu()); return; }
    if (this.wcT > 0) { this.wcT--; if (this.wcT === 0) { run(() => this.bushIncident()); return; } }
    if (this.sit > 0) { this.sit--; return; }
    if (--this.chat <= 0) this.chatter();

    const p = this.p, sk = this.sk;
    if (p.moving) {
      const sp = this.speed;
      const tx = p.tx * T, ty = p.ty * T;
      p.px += Math.sign(tx - p.px) * Math.min(sp, Math.abs(tx - p.px));
      p.py += Math.sign(ty - p.py) * Math.min(sp, Math.abs(ty - p.py));
      const sx = sk.tx * T, sy = sk.ty * T;
      sk.px += Math.sign(sx - sk.px) * Math.min(sp, Math.abs(sx - sk.px));
      sk.py += Math.sign(sy - sk.py) * Math.min(sp, Math.abs(sy - sk.py));
      p.walk++; sk.walk++;
      if (p.px === tx && p.py === ty) { p.moving = false; sk.px = sx; sk.py = sy; this.onStep(); }
      return;
    }
    if (Input.hit('a')) { this.interact(); return; }
    const d = Input.dir();
    if (d) {
      p.dir = d;
      const nx = p.tx + DIRS[d][0], ny = p.ty + DIRS[d][1];
      const door = this.doors[key(nx, ny)];
      if (door) { run(() => this.enterDoor(door)); return; }
      if (this.walkable(nx, ny)) {
        const ox = p.tx, oy = p.ty;
        p.tx = nx; p.ty = ny; p.moving = true;
        if (sk.tx !== nx || sk.ty !== ny) {
          sk.dir = ox > sk.tx ? 'right' : ox < sk.tx ? 'left' : oy > sk.ty ? 'down' : oy < sk.ty ? 'up' : sk.dir;
          sk.tx = ox; sk.ty = oy;
          if (Math.abs(sk.px - ox * T) > T || Math.abs(sk.py - oy * T) > T) { sk.px = ox * T; sk.py = oy * T; }
        } else { sk.tx = ox; sk.ty = oy; sk.dir = d; }
      }
    }
  }

  onStep() {
    const m = this.m, p = this.p;
    if ((p.walk & 15) === 0) Snd.sfx('step');
    if (G.char === 'mariana') {
      if (this.piggy > 0) { this.piggy--; m.energy = Math.min(100, m.energy + 2); if (this.piggy === 0) bubble('sk', 'OK, YOUR TURN TO WALK!'); }
      else { m.energy -= 1.4; if (m.energy <= 0) { m.energy = 0; run(() => this.tired()); return; } }
    } else {
      m.hunger = Math.max(0, m.hunger - 0.8);
      if (m.hunger <= 0 && !this.hangry) { this.hangry = true; bubble('p', 'SO... HUNGRY... NEED SNACK.'); }
    }
    m.bladder = Math.min(100, m.bladder + 0.32);
    if (m.bladder >= 100 && !this.wcT) { run(() => this.toiletAlarm()); return; }
    const spot = this.spots[key(p.tx, p.ty)];
    if (spot && !this.cs.sights.includes(spot.name)) { run(() => this.photo(spot)); return; }
    // sidekick reactions
    for (const o of this.objs) {
      const dist = Math.abs(o.tx - p.tx) + Math.abs(o.ty - p.ty);
      if (dist > 2) continue;
      if (G.char === 'matias' && o.type === 'cute' && !this.cs.cutes.includes(o.n)) {
        this.cs.cutes.push(o.n); G.s.stats.cute++; Snd.sfx('cute'); bubble('sk', 'A ' + o.n + '! SO CUUUTE!');
      }
      if (G.char === 'mariana' && o.type === 'snack' && !this.cs.sniffed.includes(o.n)) {
        this.cs.sniffed.push(o.n); bubble('sk', (o.sweet ? '*SNIFF* IS THAT ' : 'I SMELL ') + o.n + '...');
      }
    }
    if (G.char === 'matias' && !this.cs.boutique && !this.pulled) {
      const b = this.items.find(i => i.kind === 'boutique');
      if (b && p.ty === 5 && Math.abs(p.tx - b.door[0]) <= 1) { this.pulled = true; run(() => this.boutiquePull(b)); }
    }
  }

  chatter() {
    this.chat = 600 + Math.floor(Math.random() * 400);
    const pool = this.c.chatter[G.side] || [];
    let line = rnd(pool);
    if (/TOILET/.test(line) && this.m.bladder < 50) line = rnd(pool);
    if (line) bubble('sk', line);
  }

  // ---------------------------------------------------------- interact --
  interact() {
    const p = this.p, [dx, dy] = DIRS[p.dir];
    const fx = p.tx + dx, fy = p.ty + dy;
    const o = this.occ[key(fx, fy)];
    if (o) { run(() => this.useObj(o)); return; }
    const door = this.doors[key(fx, fy)];
    if (door) { run(() => this.enterDoor(door)); return; }
    const spot = this.spots[key(p.tx, p.ty)] || this.spots[key(fx, fy)];
    if (spot) { run(() => this.photo(spot, true)); return; }
    if (this.sk.tx === fx && this.sk.ty === fy) { run(() => this.talkSidekick()); return; }
    const lm = fy === 4 && this.items.find(i => i.kind === 'lm' && fx >= i.x && fx < i.x + i.w);
    if (lm) { run(() => say(lm.name + '. STAND RIGHT IN FRONT OF IT FOR A PHOTO.')); }
  }
  async useObj(o) {
    if (o.type === 'npc') return this.talk(o);
    if (o.type === 'prop') return say(o.lines);
    if (o.type === 'cute') return this.cute(o);
    if (o.type === 'snack') return this.snack(o);
    if (o.type === 'bench') return this.bench();
    if (o.prop === 'telescope') return say('{P}: THE ANDES. SNOW ON TOP, CITY BELOW. WOW.');
  }
  async talkSidekick() {
    const m = this.m;
    if (G.side === 'matias') {
      if (m.bladder > 70) return say('MATIAS: ...I MIGHT NEED THE TOILET SOON.');
      return say(rnd([['MATIAS: ARE YOU HUNGRY? I AM HUNGRY.'], ['MATIAS: BEST TRIP EVER. ALSO, SNACK?'], ['MATIAS: WANT A PIGGYBACK? JUST SAY THE WORD.'], ['MATIAS: I LOVE YOU. ALSO I LOVE THAT BAKERY.']]));
    }
    if (!this.cs.boutique) return say('MARIANA: THERE IS A CUTE SHOP HERE. JUST SAYING.');
    return say(rnd([['MARIANA: I AM SO TIRED. CARRY ME?'], ['MARIANA: THIS IS SO CUUUTE!'], ['MARIANA: I LOVE YOU. NOW FEED ME A CROISSANT.'], ['MARIANA: DID YOU SEE MY NEW ' + (G.s.acc ? 'LOOK' : 'NOTHING... YET') + '?']]));
  }
  async talk(o) {
    const lines = o.lines;
    if (o.task) {
      if (this.cs.task) return say(o.n + ': THANK YOU AGAIN, YOU TWO! ENJOY ' + this.c.name + '!');
      await say(lines);
      await say(this.c.task.intro);
      for (;;) {
        const res = await playGame(this.c.task.game, this.c);
        if (res.win) {
          this.cs.task = true;
          if (!G.s.stats.stamps.includes(this.c.id)) G.s.stats.stamps.push(this.c.id);
          await say(this.c.task.win);
          await pushScene(new StampScene(this.c));
          await say('{S}: WE CAN FLY ON WHENEVER YOU ARE READY. THE AIRPORT IS AT THE END OF THE STREET.');
          writeSave();
          return;
        }
        const again = await choose('TRY AGAIN?', ['YES!', 'LATER'], 1);
        if (again === 1) return;
      }
    }
    return say(lines);
  }
  async cute(o) {
    const counted = this.cs.cutes.includes(o.n);
    if (o.kind === 'sheep') await say('SHEEP: BAAA.');
    if (G.char === 'mariana') {
      if (counted) { bubble('p', 'STILL SO CUTE.'); return; }
      this.cs.cutes.push(o.n); G.s.stats.cute++; Snd.sfx('cute');
      this.m.energy = Math.min(100, this.m.energy + 30);
      bubble('p', 'SO CUUUTE!');
      await say('MARIANA: A ' + o.n + '!! THIS IS SO CUUUTE!', '(CUTENESS GIVES MARIANA ENERGY!)');
    } else {
      if (counted) return say('MATIAS: STILL CUTE. MARIANA WAS RIGHT.');
      this.cs.cutes.push(o.n); G.s.stats.cute++; Snd.sfx('cute');
      await say('MATIAS: OH, A ' + o.n + '.', 'MARIANA: THIS IS SO CUUUTE!!', 'MATIAS: ...OK. IT IS PRETTY CUTE.');
    }
  }
  async snack(o) {
    const i = await choose(o.n + '?', ['BUY ONE', 'NO THANKS'], 1);
    if (i === 1) return;
    Snd.sfx('eat'); G.s.stats.food++;
    if (o.drink) this.m.bladder = Math.min(99, this.m.bladder + 25);
    if (G.char === 'matias') {
      this.m.hunger = Math.min(100, this.m.hunger + (o.sweet ? 60 : 35)); this.hangry = false;
      await say(o.sweet ? ['MATIAS: *CHOMP* ...SWEET TOOTH: SATISFIED.', '(SWEET TOOTH BONUS! HUNGER WAY DOWN.)'] : ['MATIAS: *CHOMP* ...WHAT ELSE IS THERE?']);
    } else {
      this.m.energy = Math.min(100, this.m.energy + 25); G.s.stats.food++;
      await say('MARIANA: MMM. ' + o.n + '!', 'MATIAS: ...AND ONE FOR ME. OK, TWO.', '(ENERGY UP!)');
    }
  }
  async bench() {
    if (G.char === 'mariana') {
      await say('MARIANA: A BENCH! MY FAVOURITE PLACE IN THE WHOLE CITY.');
      this.sit = 60; this.m.energy = 100;
      await say('(MARIANA IS FULLY RESTED.)');
    } else {
      await say('MATIAS: MARIANA SITS DOWN IMMEDIATELY.', 'MARIANA: FIVE MINUTES. MAYBE TEN.', 'MATIAS: I\'LL EAT A SNACK FROM MY POCKET.');
      this.m.hunger = Math.min(100, this.m.hunger + 10); this.hangry = false;
    }
  }
  async photo(spot, manual) {
    if (this.cs.sights.includes(spot.name)) {
      if (manual) return say(spot.name + '. ALREADY IN THE ALBUM.');
      return;
    }
    this.flash = 10; Snd.sfx('photo');
    this.cs.sights.push(spot.name);
    G.s.stats.photos.push({ city: this.c.id, name: spot.name, lm: spot.lm });
    await wait(14);
    await say('*SNAP!* PHOTO OF ' + G.P + ' & ' + G.S + ' AT ' + spot.name + '.', spot.photo);
    writeSave();
  }

  // -------------------------------------------------------------- doors --
  async enterDoor(it) {
    Snd.sfx('select');
    if (it.kind === 'cafe') return this.cafe();
    if (it.kind === 'restaurant') return this.restaurant();
    if (it.kind === 'boutique') return this.boutique();
    if (it.kind === 'grocery') return this.grocery();
    if (it.kind === 'wc') return this.wc();
    if (it.kind === 'airport') return this.airport();
  }
  async cafe() {
    const c = this.c.cafe;
    await say('BARISTA: WELCOME! ' + c.drink + ' AND A ' + c.pastry + '?');
    const i = await choose(null, ['YES PLEASE', 'NO THANKS'], 1);
    if (i === 1) return;
    const st = G.s.stats; st.coffee += 2; st.food += 2; if (/CROISSANT|KIPFERL|MEDIALUNA|CHOCOLATINE/.test(c.pastry)) st.croissants += 2;
    this.cs.cafe = true;
    this.m.energy = 100; this.m.hunger = Math.min(100, this.m.hunger + 45); this.hangry = false;
    this.m.bladder = Math.min(95, this.m.bladder + 30);
    Snd.sfx('coin');
    await say('{P} AND {S} SIT DOWN WITH A ' + c.drink + ' AND A ' + c.pastry + '.',
      { mariana: 'MATIAS: ...ARE YOU GOING TO FINISH THAT?', matias: 'MATIAS: *INHALES PASTRY*' },
      { mariana: 'MARIANA: YES. BACK OFF.', matias: 'MARIANA: ...WAS THAT MINE?' },
      '(ENERGY FULL. WC METER UP. GAME SAVED.)');
    writeSave();
  }
  async restaurant() {
    const r = this.c.restaurant;
    await say(r.intro);
    const i = await choose('TAKE A SEAT?', ['LET\'S EAT!', 'NOT NOW'], 1);
    if (i === 1) return;
    const res = await playGame({ type: 'eat', title: this.c.labels.restaurant, dish: r.dish, icon: r.icon, bites: r.bites }, this.c);
    if (res.win) {
      this.cs.restaurant = true; G.s.stats.food += 3; this.m.hunger = 100; this.hangry = false;
      this.m.bladder = Math.min(95, this.m.bladder + 15);
      await say(G.char === 'matias' ? ['MATIAS: THAT WAS A GOOD STARTER.', 'MARIANA: STARTER?!'] : ['MARIANA: I CAN\'T MOVE. MATIAS, CARRY ME.', 'MATIAS: ...ARE YOU FINISHING YOURS? OH. YOU DID.']);
    } else await say('{S}: WE\'LL GET A DOGGY BAG. MATIAS WILL EAT IT IN TEN MINUTES.');
    writeSave();
  }
  async grocery() {
    const g = this.c.grocery;
    await say('{S}: SNACKS FOR THE HOTEL! HERE\'S THE LIST.');
    const res = await playGame({ type: 'belt', title: 'GROCERY RUN', name: g.name, list: g.list, decoys: g.decoys }, this.c);
    if (res.win) {
      this.cs.grocery = true; G.s.stats.food += 2;
      await say(G.char === 'matias' ? 'MATIAS: I CARRY THE BAGS. I AM STRONG. I AM ALSO EATING ONE.' : 'MATIAS: I\'LL CARRY THE BAGS. *EATS FROM THE BAG*');
    } else await say('{S}: WE\'LL JUST LIVE ON CROISSANTS. WHICH IS FINE.');
    writeSave();
  }
  async boutique(pulled) {
    const b = this.c.boutique;
    await say('SHOPKEEPER: WELCOME TO ' + b.name + '!');
    const opts = b.items.map(i => i.n).concat(['JUST LOOKING']);
    const i = await choose(G.char === 'mariana' ? 'WHAT WILL YOU BUY?' : 'MARIANA IS POINTING AT...', opts, opts.length - 1);
    if (i < b.items.length) {
      const it = b.items[i];
      G.s.acc = { t: it.t, c: it.c }; G.s.stats.bags++; this.cs.boutique = true; Snd.sfx('coin');
      const n = G.s.stats.bags;
      if (G.char === 'mariana') await say('MARIANA: I\'LL TAKE THE ' + it.n + '!', 'MATIAS: AND I CARRY THE BAG. AS ALWAYS.', '(MATIAS IS NOW CARRYING ' + n + ' BAG' + (n > 1 ? 'S' : '') + '.)');
      else await say('MARIANA: THE ' + it.n + '! PLEASE?', 'MATIAS: FINE. I\'LL CARRY IT. OBVIOUSLY.', '(MATIAS IS NOW CARRYING ' + n + ' BAG' + (n > 1 ? 'S' : '') + '.)');
      writeSave();
    } else {
      await say(G.char === 'mariana' ? 'MARIANA: JUST LOOKING... FOR NOW.' : 'MARIANA: *LOOKS SADLY AT THE WINDOW*');
    }
  }
  async boutiquePull(b) {
    await say('MARIANA: OOOH! THAT SHOP! CAN WE GO IN? JUST FOR A SECOND!');
    const i = await choose(null, ['OK, GO ON', 'NOT NOW'], 1);
    if (i === 0) { await say('MATIAS: "A SECOND." SURE.'); return this.boutique(true); }
    await say('MARIANA: ...FINE.', '(MARIANA IS SULKING. VERY CUTELY.)');
  }
  async wc() {
    const paid = PAID_WC[this.c.id] ? (G.char === 'matias' ? 'MATIAS: 50 CENTS?! FOR A TOILET?! ...MARIANA, DO YOU HAVE COINS?' : 'MATIAS: IT COSTS 50 CENTS. MARIANA, CAN I BORROW 50 CENTS?') : null;
    if (this.wcT > 0) {
      this.wcT = 0; this.m.bladder = 0; G.s.stats.wc++; Snd.sfx('win');
      await say(paid, 'MATIAS: MADE IT!!! PHEW.', 'MARIANA: EVERY. SINGLE. CITY.');
      return;
    }
    this.m.bladder = 0; G.s.stats.wc++;
    await say(paid, 'MATIAS: ...JUST IN CASE.', 'MARIANA: OF COURSE.');
  }
  async airport() {
    const next = CITIES[this.ci + 1];
    if (!this.cs.task) {
      await say('{S}: WE CAN\'T LEAVE YET!', '{S}: SOMEONE HERE NEEDS OUR HELP. LOOK FOR THE "!".');
      return;
    }
    const left = [];
    if (!this.cs.restaurant) left.push('THE RESTAURANT');
    if (!this.cs.grocery) left.push('THE SHOP');
    const ck = this.checklistDone(); if (ck.sights < ck.sightsN) left.push('SOME PHOTOS');
    if (left.length) await say('{S}: WE HAVEN\'T DONE ' + left.join(', ') + ' YET... (CHECK THE START MENU.)');
    const i = await choose(next ? 'FLY TO ' + next.name + '?' : 'TIME TO FLY HOME?', ['LET\'S GO!', 'NOT YET'], 1);
    if (i === 1) return;
    await fadeOut();
    G.s.city = this.ci + 1; G.s.cs = null; G.s.arrived = false; G.s.m = { energy: 100, hunger: 80, bladder: 20 };
    writeSave();
    if (next) setScene(new FlightScene(this.ci, this.ci + 1)); else setScene(new EndingScene());
    fadeIn();
  }

  // ------------------------------------------------------------ events --
  async arrive() {
    G.s.arrived = true;
    this.title = 1;
    Snd.play(this.c.song);
    await wait(110);
    this.title = 0;
    await say(this.c.arrive);
    if (this.ci === 0) {
      await say('TIP: WALK WITH THE D-PAD. PRESS A TO TALK, LOOK AND GO INSIDE. START OPENS THE MENU.');
      await say(G.char === 'mariana'
        ? ['TIP: MARIANA GETS TIRED WALKING (~ METER). CUTE THINGS, BENCHES, SNACKS AND COFFEE GIVE HER ENERGY.']
        : ['TIP: MATIAS IS ALWAYS HUNGRY (FOOD METER). SNACK CARTS FEED HIM. SWEET THINGS SPARKLE (@).', 'TIP: MARIANA WILL WANT TO GO SHOPPING. YOU CARRY THE BAGS.']);
      await say('TIP: WATCH THE WC METER. MATIAS ALWAYS NEEDS THE TOILET.', 'TIP: HELP THE PERSON WITH THE "!" TO EARN A PASSPORT STAMP, THEN FLY ON FROM THE AIRPORT.');
    }
    writeSave();
  }
  async tired() {
    await say('MARIANA: MY FEET!! I CAN\'T WALK ANY MORE.');
    const i = await choose('MARIANA IS TIRED.', ['PIGGYBACK!', 'SIT AND REST'], 1);
    if (i === 0) { this.piggy = 30; this.m.energy = 30; await say('MATIAS: HOP ON. PIGGYBACK EXPRESS!', '(MARIANA RIDES FOR 30 STEPS AND GETS ENERGY BACK.)'); }
    else { this.sit = 100; this.m.energy = 60; await say('MARIANA: *SITS ON THE PAVEMENT*', 'MARIANA: OK. TEN MORE STEPS. MAYBE ELEVEN.'); }
  }
  async toiletAlarm() {
    this.wcT = 32 * 60;
    Snd.sfx('bad');
    await say('MATIAS: UH OH.', 'MATIAS: TOILET. NOW. RIGHT NOW.', G.char === 'mariana' ? 'MARIANA: AGAIN?!' : 'MARIANA: AGAIN?! WE JUST WENT!', 'GET TO THE WC BEFORE THE TIMER RUNS OUT!');
  }
  async bushIncident() {
    this.m.bladder = 0; G.s.stats.bush++;
    await say('MATIAS: ...', 'MATIAS: I FOUND A VERY NICE BUSH.', 'MARIANA: WE DO NOT TALK ABOUT THIS.');
  }
  async pauseMenu() {
    const panel = { update() {}, draw: () => this.drawChecklist() };
    overlays.push(panel);
    const i = await choose(null, ['RESUME', 'SOUND: ' + (Snd.on ? 'ON' : 'OFF'), 'SAVE & QUIT'], 0);
    overlays.splice(overlays.indexOf(panel), 1);
    if (i === 1) Snd.toggle();
    if (i === 2) { writeSave(); await fadeOut(); setScene(new TitleScene()); fadeIn(); }
  }

  // --------------------------------------------------------------- draw --
  drawChecklist() {
    const cs = this.cs, ck = this.checklistDone(), st = G.s.stats;
    box(0, 0, W, 98);
    text(this.c.name, 7, 6, 3);
    text('STAMPS ' + st.stamps.length + '/8', W - 70, 6, 2);
    rect(6, 15, W - 12, 1, 2);
    const row = (done, label, y) => { rect(7, y, 7, 7, 3); rect(8, y + 1, 5, 5, done ? 4 : 0); text(label, 18, y, 3); };
    row(cs.task, ('TASK: ' + this.c.task.name).length > 22 ? this.c.task.name : 'TASK: ' + this.c.task.name, 20);
    row(cs.restaurant, 'EAT: ' + this.c.restaurant.dish, 30);
    row(cs.grocery, 'GROCERY RUN', 40);
    row(cs.boutique, 'SHOPPING', 50);
    row(ck.sights >= ck.sightsN, 'PHOTOS ' + ck.sights + '/' + ck.sightsN, 60);
    row(ck.cutes >= ck.cutesN, 'CUTE THINGS ' + ck.cutes + '/' + ck.cutesN, 70);
    text('FOOD ' + st.food + '  WC ' + st.wc + '  BAGS ' + st.bags, 7, 84, 2);
  }
  charAt(who, x, y, dir, walk) {
    const f = (walk >> 3) & 1;
    blit(charSpr(who, dir, f), x, y, dir === 'left');
    if (who === 'mariana') drawAcc(G.s.acc, x, y, dir);
    if (who === 'matias' && G.s.stats.bags > 0 && !(this.piggy && G.char === 'mariana')) {
      const n = Math.min(G.s.stats.bags, 7);
      for (let i = 0; i < n; i++) { const bx = x + 3 + ((i % 2) ? 1 : -1), by = y - 4 - i * 4; rect(bx, by, 10, 4, 3); rect(bx + 1, by + 1, 8, 2, i % 2 ? 4 : 1); }
    }
  }
  draw() {
    const p = this.p, sk = this.sk;
    const cx = clamp(Math.round(p.px + 8 - W / 2), 0, this.w * T - W);
    const cy = clamp(Math.round(p.py + 8 - VIEW_H / 2 - 8), 0, this.h * T - VIEW_H);
    this.cam.x = cx; this.cam.y = cy;
    ctx.save(); ctx.translate(-cx, -cy + HUD);
    ctx.drawImage(this.map, 0, 0);
    for (const it of this.items) if (it.kind === 'lm' && ANIM_LM[it.lm] && it.x * T < cx + W + 100 && it.x * T + it.w * T > cx - 10) LANDMARKS[it.lm](it.x * T);
    for (const b of this.bottoms) if (ANIM_LM[b.lm] && b.x * T < cx + W + 100) LANDMARKS[b.lm](b.x * T);
    // water shimmer
    if (this.c.bottom === 'water') for (let i = 0; i < 6; i++) { const wx = cx + ((i * 53 + fc) % W), wy = 184 + ((i * 17) % 50); rect(wx, wy, 3, 1, 0); }
    // photo spots
    for (const k in this.spots) {
      const s = this.spots[k]; if (this.cs.sights.includes(s.name)) continue;
      const [sx, sy] = k.split(',').map(Number);
      if ((fc >> 4) & 1) { rect(sx * T + 4, sy * T + 6, 8, 6, 3); rect(sx * T + 5, sy * T + 7, 6, 4, 0); rect(sx * T + 7, sy * T + 8, 2, 2, 3); rect(sx * T + 6, sy * T + 5, 3, 1, 3); }
    }
    // sort drawables by row
    const list = [];
    for (const o of this.objs) list.push({ y: o.ty * T, o });
    const piggy = this.piggy > 0 && G.char === 'mariana';
    list.push({ y: p.py, who: 'p' });
    if (!piggy) list.push({ y: sk.py - 0.5, who: 'sk' });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) {
      if (d.who === 'p') {
        if (piggy) { this.charAt('mariana', p.px - 2, p.py - 7, p.dir, 0); this.charAt('matias', p.px, p.py, p.dir, p.walk); }
        else if (this.sit && G.char === 'mariana') { blit(charSpr('mariana', 'down', 0), p.px, p.py + 3); drawAcc(G.s.acc, p.px, p.py + 3, 'down'); }
        else this.charAt(G.char, p.px, p.py, p.dir, p.walk);
      } else if (d.who === 'sk') this.charAt(G.side, sk.px, sk.py, sk.dir, sk.walk);
      else this.drawObj(d.o);
    }
    // bubbles
    for (const b of bubbles) {
      const t = b.target === 'p' ? p : b.target === 'sk' ? (piggy ? p : sk) : null; if (!t) continue;
      const w = Math.max(...b.lines.map(l => textW(l))) + 8, h = b.lines.length * 9 + 5;
      let bx = clamp(t.px + 8 - w / 2, cx + 1, cx + W - w - 1), by = t.py - h - 6;
      if (by < cy + 2) by = t.py + 18;
      rect(bx, by, w, h, 3); rect(bx + 1, by + 1, w - 2, h - 2, 0);
      rect(t.px + 6, by + h - 1, 3, 3, 3); rect(t.px + 7, by + h - 1, 1, 2, 0);
      b.lines.forEach((l, i) => text(l, bx + 4, by + 3 + i * 9, 3));
    }
    ctx.restore();
    if (this.flash > 0) { this.flash--; rect(0, HUD, W, VIEW_H, 0); }
    this.drawHud();
    if (this.title > 0) {
      const a = Math.min(1, this.title / 20);
      box(14, 46, W - 28, 44);
      textC(this.c.name, 54, 3, 2);
      textC(this.c.country, 76, 2);
      void a;
    }
  }
  drawObj(o) {
    const x = o.tx * T, y = o.ty * T;
    if (o.type === 'npc') {
      if (o.animal) blit(animalSpr(o.animal), x, y, (fc >> 6) & 1);
      else { blit(npcSpr(o.look, (fc >> 5) & 1 && o.task ? 1 : 0), x, y); if (o.look.hat) drawHat(o.look.hat, x, y, o.look.hatc); }
      if (o.task && !this.cs.task) { const by = y - 13 - ((fc >> 4) & 1); rect(x + 5, by, 7, 10, 3); rect(x + 6, by + 1, 5, 8, 0); text('!', x + 6, by + 2, 4); }
    } else if (o.type === 'cute') {
      if (o.kind === 'flowers') blit(propSpr('flowers'), x, y);
      else blit(animalSpr(o.kind), x, y + (((fc >> 5) + o.tx) & 1), o.kind === 'bird' && ((fc >> 6) & 1));
      if (!this.cs.cutes.includes(o.n) && G.char === 'mariana' && (fc >> 4) & 1) text('~', x + 11, y - 4, 4);
    } else if (o.type === 'snack') {
      blit(propSpr('cart'), x, y);
      if (o.sweet && G.char === 'matias' && (fc >> 3) & 1) { text('@', x + 2, y - 6, 4); text('@', x + 11, y - 2, 4); }
    } else if (o.type === 'prop') blit(propSpr(o.prop), x, y);
    else if (o.prop === 'lamp') { blit(propSpr('lamp'), x, y - 8); }
    else if (o.prop) blit(propSpr(o.prop), x, y - (o.prop === 'tree' ? 6 : 0));
  }
  drawHud() {
    rect(0, 0, W, HUD, 3);
    text(this.c.name, 2, 2, 0);
    if (this.wcT > 0) {
      const s = Math.ceil(this.wcT / 60);
      const wcItem = this.items.find(i => i.kind === 'wc');
      const arrow = wcItem.door[0] < this.p.tx ? '<' : wcItem.door[0] > this.p.tx ? '>' : '^';
      if ((fc >> 3) & 1 || s > 10) text('WC! ' + s + ' ' + arrow, W - 64, 2, 4);
      return;
    }
    const bar = (x, v, warn) => { rect(x, 2, 22, 6, 0); rect(x + 1, 3, Math.round(20 * clamp(v, 0, 100) / 100), 4, warn ? ((fc >> 3) & 1 ? 4 : 1) : 1); };
    if (G.char === 'mariana') { text('~', 76, 2, 4); bar(83, this.m.energy, this.m.energy < 25); }
    else { blit(icon('croissant'), 69, 1); bar(83, this.m.hunger, this.m.hunger < 25); }
    text('WC', 110, 2, 0); bar(123, this.m.bladder, this.m.bladder > 80);
    if (this.cs.task) text('*', W - 10, 2, 4);
  }
}
