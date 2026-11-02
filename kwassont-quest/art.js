'use strict';
// ---------------------------------------------------------------------------
// Art: character sprites, animals, props, icons, tiles, buildings, landmarks.
// All drawn from tiny pixel maps or simple rects in the 4-shade city palette
// (+ one accent colour, index 4). Mariana and Matias keep their own colours.
// ---------------------------------------------------------------------------

// ---- Mariana & Matias ------------------------------------------------------
// k outline/eyes/shoes, h hair, s skin, c top, p trousers
const CHAR_COL = {
  mariana: { k: '#1c1214', h: '#2b1810', s: '#d8aa7e', c: '#e0587a', p: '#d8aa7e', w: '#fff4f0' },
  matias:  { k: '#1c1214', h: '#4a2a18', s: '#d4a478', c: '#2f6fbf', p: '#2a2f48', w: '#fff4f0' },
};
const BODY = {
  mariana: {
    down: [
      '................', '.....hhhhhh.....', '....hhhhhhhh....', '...hhhhhhhhhh...',
      '...hhsssssshh...', '...hhsksskshh...', '...hhsssssshh...', '...hhssccsshh...',
      '..hhhccsscchhh..', '..hhcccccccchh..', '..hhcccccccchh..', '...sccccccccs...',
      '...sccccccccs...', '....cccccccc....'],
    up: [
      '................', '.....hhhhhh.....', '....hhhhhhhh....', '...hhhhhhhhhh...',
      '...hhhhhhhhhh...', '...hhhhhhhhhh...', '...hhhhhhhhhh...', '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '...sccccccccs...',
      '...sccccccccs...', '....cccccccc....'],
    side: [
      '................', '.....hhhhhh.....', '....hhhhhhhh....', '...hhhhhhhhhh...',
      '...hhhhhsssss...', '...hhhhsssks....', '...hhhhssssss...', '...hhhhsssck....',
      '..hhhhhcss......', '..hhhhcccccc....', '..hhhhcccccc....', '....ccccccs.....',
      '....cccccc......', '....cccccc......'],
    legs: {
      down: [['.....ss..ss.....', '.....kk..kk.....'], ['....ss....ss....', '....kk....kk....']],
      side: [['.....ss.ss......', '.....kk.kk......'], ['......sss.......', '......kkk.......']],
    },
  },
  matias: {
    down: [
      '.......hh.......', '......hhhh......', '.....hhhhhh.....', '....hhhhhhhh....',
      '....hssssssh....', '....hskssksh....', '....hssssssh....', '.....sskkss.....',
      '......ssss......', '..cccccccccccc..', '.sccccccccccccs.', '.sccccccccccccs.',
      '.s.cccccccccc.s.', '...pppppppppp...'],
    up: [
      '.......hh.......', '......hhhh......', '.....hhhhhh.....', '....hhhhhhhh....',
      '....hhhhhhhh....', '....hhhhhhhh....', '....shhhhhhs....', '.....ssssss.....',
      '......ssss......', '..cccccccccccc..', '.sccccccccccccs.', '.sccccccccccccs.',
      '.s.cccccccccc.s.', '...pppppppppp...'],
    side: [
      '......hh........', '.....hhhh.......', '.....hhhhhh.....', '....hhhhhhhh....',
      '....hhhsssss....', '....hhssssks....', '....hssssssss...', '.....sssssk.....',
      '......ssss......', '...cccccccc.....', '...ccccccccs....', '...ccccccccs....',
      '...cccccccc.....', '...pppppppp.....'],
    legs: {
      down: [['....ppp..ppp....', '....kkk..kkk....'], ['...ppp....ppp...', '...kkk....kkk...']],
      side: [['....pp..pp......', '....kk..kk......'], ['.....pppp.......', '.....kkkk.......']],
    },
  },
};
function charSpr(who, dir, frame, colours, keyExtra = '') {
  const b = BODY[who];
  const view = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side';
  const legs = b.legs[view === 'side' ? 'side' : 'down'][frame & 1];
  const rows = b[view].concat(legs);
  const cmap = colours || CHAR_COL[who];
  return getSpr('ch:' + who + view + (frame & 1) + keyExtra, rows, cmap, !colours);
}
// NPC: borrow a body, recolour into the city palette
function npcSpr(look, frame) {
  const body = look.body || 'matias';
  let rows = BODY[body].down.slice();
  if (look.short) { rows[0] = '................'; rows[1] = '................'; rows[2] = '.....hhhhhh.....'; }
  rows = rows.concat(BODY[body].legs.down[frame & 1]);
  const m = { k: 3, h: look.hair ?? 3, s: look.skin ?? 1, c: look.shirt ?? 2, p: look.pants ?? 3 };
  return getSpr('npc:' + JSON.stringify(look) + (frame & 1), rows, m);
}
function drawHat(kind, x, y, c) {
  switch (kind) {
    case 'tall': rect(x + 3, y - 9, 10, 13, 3); rect(x + 4, y - 10, 8, 1, 3); rect(x + 7, y + 4, 2, 4, 3); break;
    case 'chef': rect(x + 4, y - 5, 8, 7, 0); rect(x + 3, y - 7, 10, 3, 0); rect(x + 4, y + 1, 8, 1, 3); rect(x + 3, y - 7, 1, 3, 3); rect(x + 12, y - 7, 1, 3, 3); rect(x + 4, y - 8, 8, 1, 3); break;
    case 'beret': rect(x + 3, y + 1, 11, 3, c ?? 3); rect(x + 7, y, 2, 1, c ?? 3); break;
    case 'cap': rect(x + 4, y + 1, 8, 3, c ?? 4); rect(x + 10, y + 3, 5, 1, c ?? 4); break;
    case 'beanie': rect(x + 4, y, 8, 4, c ?? 4); rect(x + 3, y + 3, 10, 2, c ?? 4); rect(x + 7, y - 1, 2, 1, c ?? 4); break;
    case 'cloth': rect(x + 3, y + 1, 10, 3, 0); rect(x + 3, y + 4, 2, 9, 0); rect(x + 11, y + 4, 2, 9, 0); rect(x + 3, y + 1, 10, 1, 3); break;
    case 'helmet': rect(x + 3, y, 10, 4, c ?? 4); rect(x + 3, y + 3, 10, 1, 3); break;
    case 'wig': rect(x + 3, y, 10, 4, 0); rect(x + 2, y + 3, 3, 6, 0); rect(x + 11, y + 3, 3, 6, 0); break;
    case 'flower': rect(x + 11, y + 2, 3, 3, c ?? 4); rect(x + 12, y + 3, 1, 1, 0); break;
    case 'bow': rect(x + 10, y + 1, 2, 3, c ?? 4); rect(x + 13, y + 1, 2, 3, c ?? 4); rect(x + 12, y + 2, 1, 1, c ?? 4); break;
    case 'tiara': rect(x + 5, y + 1, 6, 1, '#f0c840'); rect(x + 5, y, 1, 1, '#f0c840'); rect(x + 8, y - 1, 1, 2, '#f0c840'); rect(x + 10, y, 1, 1, '#f0c840'); break;
    case 'sunnies': rect(x + 4, y + 5, 3, 2, '#101010'); rect(x + 9, y + 5, 3, 2, '#101010'); rect(x + 7, y + 5, 2, 1, '#101010'); break;
    case 'scarf': rect(x + 4, y + 8, 8, 2, c ?? 4); rect(x + 9, y + 9, 2, 4, c ?? 4); break;
  }
}
// Mariana's shop accessory (colour stays fixed so it looks the same in every city)
function drawAcc(acc, x, y, dir) {
  if (!acc) return;
  if (dir === 'up' && (acc.t === 'sunnies' || acc.t === 'scarf')) { if (acc.t === 'scarf') rect(x + 4, y + 8, 8, 2, acc.c); return; }
  if (dir === 'left' || dir === 'right') {
    const fx = dir === 'left';
    const sx = v => fx ? x + 16 - v : x + v;
    if (acc.t === 'sunnies') { rect(fx ? x + 4 : x + 9, y + 5, 4, 2, '#101010'); return; }
    if (acc.t === 'scarf') { rect(x + 5, y + 8, 6, 2, acc.c); return; }
    if (acc.t === 'flower' || acc.t === 'bow') { rect(Math.min(sx(4), sx(7)), y + 2, 3, 3, acc.c); return; }
  }
  drawHat(acc.t, x, y, acc.c);
}

// ---- animals & props (city palette) ---------------------------------------
const ANIMALS = {
  cat: ['................', '................', '................', '...3.....3......', '...33...33......',
    '...3333333......', '...3033303......', '...3332333...3..', '....33333....3..', '...3333333..3...',
    '..333333333.3...', '..3333333333....', '..3333333333....', '..33.33.33.33...', '................', '................'],
  dog: ['................', '................', '................', '..33............', '.3333...........',
    '.30333........3.', '.33333.......3..', '..333333333333..', '...33333333333..', '...3333333333...',
    '...33333333333..', '...33......33...', '...33......33...', '...33......33...', '................', '................'],
  bird: ['................', '................', '................', '................', '.....333........',
    '....30333.......', '...4333333......', '.....3333333....', '.....22222233...', '......2222233...',
    '.......33333....', '.......3..3.....', '......33.33.....', '................', '................', '................'],
  sheep: ['................', '................', '................', '.....000000.....', '...0000000000...',
    '..000000000000..', '.3300000000000..', '330300000000000.', '.33300000000000.', '..3.000000000...',
    '....00000000....', '....3..3..3.3...', '....3..3..3.3...', '................', '................', '................'],
  kiwi: ['................', '................', '................', '................', '................',
    '......2222......', '.....222222.....', '....22222222....', '...3222222222...', '..33.22222222...',
    '.3...2222222....', '......2222......', '.......3..3.....', '......33.33.....', '................', '................'],
  duck: ['................', '................', '................', '......333.......', '.....30333......',
    '.....333344.....', '......33........', '.....333........', '..3333333333....', '..3111111113....',
    '...311111113....', '....33333333....', '................', '................', '................', '................'],
  falcon: ['................', '................', '....333.........', '...30333........', '...3334.........',
    '...33333........', '..3332333.......', '..33222333......', '..332223333.....', '...3333.333.....',
    '....33...33.....', '....3.3.........', '................', '................', '................', '................'],
};
function animalSpr(kind, flip) { return getSpr('an:' + kind, ANIMALS[kind], IDX); }

const PROPS = {
  bench: ['................', '................', '................', '................', '................',
    '................', '................', '3333333333333333', '3222222222222223', '3333333333333333',
    '................', '3333333333333333', '3222222222222223', '3333333333333333', '.33..........33.', '.33..........33.'],
  flowers: ['................', '................', '................', '................', '................',
    '..4.....4....4..', '.444.4.444..444.', '..4.444.4.4..4..', '..1..4..1.444...', '..1..1..1..1....',
    '3333333333333333', '3222222222222223', '3211111111111123', '3222222222222223', '3333333333333333', '................'],
  cart: ['......4444......', '....44444444....', '..444444444444..', '.4444444444444444', '.......33.......',
    '.......33.......', '.......33.......', '.3333333333333333', '.3000000000000003', '.3000000000000003', '.3333333333333333',
    '.3222222222222223', '.3222222222222223', '.3333333333333333', '..333.......333..', '..333.......333..'],
  lamp: ['......3333......', '.....300003.....', '.....300003.....', '......3333......', '.......33.......',
    '.......33.......', '.......33.......', '.......33.......', '.......33.......', '.......33.......',
    '.......33.......', '.......33.......', '.......33.......', '.......33.......', '......3333......', '.....333333.....'],
  tree: ['.....222222.....', '...2222222222...', '..222222222222..', '.22222122222222.', '.22221222222222.',
    '.22222222212222.', '..222222222222..', '...2222222222...', '....22222222....', '.......33.......',
    '.......33.......', '.......33.......', '.......33.......', '......3333......', '................', '................'],
  telescope: ['................', '................', '................', '........3333....', '.......300003...',
    '......3000033...', '.....30003......', '.....3333.......', '.......33.......', '.......33.......',
    '......3..3......', '.....3....3.....', '....3......3....', '................', '................', '................'],
  bikes: ['................', '................', '................', '................', '.....3.......3..',
    '..333333...333333', '.3..3..3.3..3..3', '3...3...33...3..3', '3..333..33..333.3', '3...3...33...3..3',
    '.3.....3..3.....3', '..33333....33333.', '................', '................', '................', '................'],
};
function propSpr(k) { return getSpr('pr:' + k, PROPS[k], IDX); }

// ---- 8x8 icons (food, shop items, minigame objects) ------------------------
const ICONS = {
  box: ['........', '.333333.', '.322223.', '.321123.', '.322223.', '.322223.', '.333333.', '........'],
  bottle: ['...33...', '...22...', '..3223..', '.322223.', '.311113.', '.311113.', '.322223.', '.333333.'],
  can: ['..3333..', '.322223.', '.344443.', '.322223.', '.322223.', '.344443.', '.322223.', '..3333..'],
  jar: ['..3333..', '.344443.', '.311113.', '.312213.', '.312213.', '.311113.', '.311113.', '..3333..'],
  bread: ['........', '..3333..', '.322223.', '32121213', '32222223', '32222223', '.333333.', '........'],
  cheese: ['........', '......3.', '....3323', '..332223', '.3222123', '32212223', '33333333', '........'],
  fruit: ['....3...', '...34...', '..3333..', '.322223.', '.321223.', '.322223.', '.322223.', '..3333..'],
  fish: ['........', '........', '..3333.3', '.3222233', '30222223', '.3222233', '..3333.3', '........'],
  bag: ['..3..3..', '.3.33.3.', '.333333.', '.344443.', '.344443.', '.344443.', '.333333.', '........'],
  cake: ['...4....', '...3....', '.333333.', '.311113.', '.344443.', '.322223.', '.333333.', '........'],
  cup: ['..2.2...', '...2.2..', '333333..', '31111333', '31111303', '31111333', '.3333...', '........'],
  croissant: ['....3333....', '..33211233..', '.3212112123.', '321211112123', '32133..33123', '323......323', '.3........3.', '............'],
  bike: ['........', '...3333.', '....3...', '.33.333.', '3..33..3', '3.3.3..3', '3..3...3', '.33..33.'],
  tulip: ['........', '.4.4.4..', '.44444..', '.44444..', '..444...', '...3.3..', '...33...', '...3....'],
  duck: ['........', '..333...', '.30333..', '.333344.', '..33....', '.333333.', '3222223.', '.33333..'],
  house: ['...33...', '..3223..', '.322223.', '33333333', '.311113.', '.313313.', '.313313.', '.333333.'],
  waffle: ['........', '.333333.', '32323233', '33232323', '32323233', '.333333.', '........', '........'],
  herb: ['....3...', '..3.3.3.', '...333..', '.3.3.3..', '..333...', '...3....', '...3....', '........'],
  nata: ['........', '........', '.333333.', '34141413', '31414143', '.322223.', '..3333..', '........'],
  empanada: ['........', '........', '...3333.', '..322223', '.3212223', '32222223', '33333333', '........'],
  burger: ['........', '..3333..', '.322223.', '33333333', '44444444', '33333333', '.322223.', '..3333..'],
  pigeon: ['........', '...33...', '..3033..', '..3334..', '.322223.', '3222223.', '.33333..', '..3..3..'],
  car: ['........', '..3333..', '.311113.', '33333333', '34222243', '33333333', '.3....3.', '........'],
  rock: ['........', '........', '...33...', '..3223..', '.322223.', '.3222223', '33333333', '........'],
  note: ['...333..', '...3.33.', '...3..3.', '...3....', '.333....', '3333....', '.33.....', '........'],
  star: ['...3....', '...3....', '3333333.', '.33333..', '..333...', '.33.33..', '.3...3..', '........'],
  heart: ['........', '.44.44..', '4444444.', '4444444.', '.44444..', '..444...', '...4....', '........'],
  scarf: ['........', '.444444.', '.444444.', '...44...', '...44...', '...44...', '...4.4..', '........'],
  coin: ['..3333..', '.344443.', '34433443', '34434443', '34434443', '34433443', '.344443.', '..3333..'],
  sheep: ['........', '..0000..', '.000000.', '30000000', '33000000', '.0000000', '..3..3..', '..3..3..'],
  gondola: ['3333333.', '...3....', '.33333..', '.31013..', '.31013..', '.33333..', '........', '........'],
  dog: ['........', '33......', '3033....', '3333..3.', '.333333.', '.333333.', '.3....3.', '.3....3.'],
};
function icon(k) { return getSpr('ic:' + k, ICONS[k] || ICONS.box, IDX); }

// ---- tiles ------------------------------------------------------------------
function tilePave(x, y, alt) {
  rect(x, y, 16, 16, 0);
  rect(x, y + 15, 16, 1, 1); rect(x + (alt ? 7 : 15), y, 1, 8, 1); rect(x + (alt ? 15 : 7), y + 8, 1, 8, 1);
  rect(x, y + 7, 16, 1, 1);
}
function tileRoad(x, y, row, tx) {
  rect(x, y, 16, 16, 1);
  if (row === 7) rect(x, y, 16, 1, 2);
  if (row === 8 && tx % 2 === 0) rect(x + 2, y, 10, 1, 0);
  if ((tx * 7 + row) % 5 === 0) rect(x + 5, y + 9, 1, 1, 2);
}
function tileGrass(x, y, tx, ty) {
  rect(x, y, 16, 16, 1);
  const s = (tx * 13 + ty * 7) % 4;
  rect(x + 3 + s, y + 4, 1, 2, 2); rect(x + 11 - s, y + 10, 1, 2, 2); rect(x + 7, y + 13 - s, 1, 1, 2);
}
function tileWater(x, y, tx, ty) {
  rect(x, y, 16, 16, 2);
  const s = (tx * 5 + ty * 3) % 6;
  rect(x + s, y + 4, 4, 1, 1); rect(x + 10 - s, y + 10, 5, 1, 1);
}
function tilePromenade(x, y, tx) {
  rect(x, y, 16, 16, 0);
  rect(x, y + 13, 16, 3, 3);
  rect(x, y + 11, 16, 1, 2);
  rect(x + 3, y + 11, 1, 3, 2); rect(x + 11, y + 11, 1, 3, 2);
  if (tx % 3 === 0) rect(x + 7, y + 4, 1, 1, 1);
}
function tileWall(x, y, ty, tx) {
  // the low wall / hedge behind the pavement where no building stands
  if (ty === 4) {
    rect(x, y, 16, 16, 0);
    rect(x, y + 6, 16, 10, 2); rect(x, y + 6, 16, 2, 3);
    rect(x + 2 + (tx % 2) * 6, y + 10, 4, 3, 1);
  }
}

// ---- buildings ------------------------------------------------------------
function windows(x, y, w, h, cols, rows, c = 1) {
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const wx = x + 4 + i * Math.floor((w - 8) / cols) + 1, wy = y + 4 + r * 13;
    rect(wx, wy, 6, 8, 3); rect(wx + 1, wy + 1, 4, 6, c); rect(wx + 1, wy + 4, 4, 1, 3);
  }
}
function door(x, y, open) { rect(x, y, 12, 16, 3); rect(x + 1, y + 1, 10, 15, open ? 0 : 2); rect(x + 8, y + 8, 1, 2, 3); }
function awning(x, y, w, c = 4) {
  for (let i = 0; i < w; i += 6) { rect(x + i, y, 3, 6, c); rect(x + i + 3, y, 3, 6, 0); }
  rect(x, y + 6, w, 1, 3);
  for (let i = 0; i < w; i += 6) rect(x + i + 1, y + 7, 2, 1, c);
}
function sign(label, x, y, w) {
  const tw = textW(label);
  const sw = Math.min(w, tw + 6);
  const sx = x + Math.round((w - sw) / 2);
  rect(sx, y, sw, 11, 3); rect(sx + 1, y + 1, sw - 2, 9, 0);
  text(label, sx + Math.round((sw - tw) / 2), y + 2, 3);
}
// generic shop: tile x,w ; rows (top row = 5 - h)
function drawShop(px, w, h, kind, label, style) {
  const top = (5 - h) * 16, x = px, ww = w * 16, hh = h * 16;
  const wall = { cafe: 1, restaurant: 1, boutique: 0, grocery: 1, wc: 0, airport: 0 }[kind] ?? 1;
  rect(x, top + 4, ww, hh - 4, 3);
  rect(x + 1, top + 5, ww - 2, hh - 5, wall);
  // roof
  if (style === 'gable') {
    for (let i = 0; i < 8; i++) rect(x + ww / 2 - 4 - i * 2, top - 4 + i, 8 + i * 4, 1, 3);
    rect(x, top + 4, ww, 2, 3);
  } else if (style === 'dome') {
    disc(x + ww / 2, top + 4, 7, 2); rect(x, top + 2, ww, 3, 3);
  } else {
    rect(x - 1, top + 2, ww + 2, 4, 3); rect(x, top + 3, ww, 1, 2);
  }
  // facade bits
  if (kind === 'wc') {
    sign('WC', x, top + 8, ww); door(x + ww / 2 - 6, top + hh - 16, false);
    return;
  }
  sign(label, x, top + 8, ww);
  if (kind === 'airport') {
    rect(x + 4, top + 22, ww - 8, 8, 2); rect(x + 6, top + 24, ww - 12, 4, 1);
    // little plane
    const cx = x + ww / 2;
    rect(cx - 6, top + 25, 12, 2, 3); rect(cx - 1, top + 23, 2, 6, 3); rect(cx + 5, top + 23, 1, 3, 3);
  } else if (h >= 3) {
    rect(x + 3, top + 22, 10, 9, 3); rect(x + 4, top + 23, 8, 7, 0);
    rect(x + ww - 13, top + 22, 10, 9, 3); rect(x + ww - 12, top + 23, 8, 7, 0);
    if (kind === 'cafe') { blit(icon('cup'), x + 5, top + 23); blit(icon('croissant'), x + ww - 12, top + 23); }
    if (kind === 'restaurant') { blit(icon('fish'), x + 5, top + 23); blit(icon('cake'), x + ww - 12, top + 23); }
    if (kind === 'boutique') { blit(icon('bag'), x + 5, top + 23); blit(icon('scarf'), x + ww - 12, top + 23); }
    if (kind === 'grocery') { blit(icon('fruit'), x + 5, top + 23); blit(icon('bread'), x + ww - 12, top + 23); }
    awning(x + 2, top + 32, ww - 4, kind === 'boutique' ? 4 : kind === 'cafe' ? 2 : 4);
  }
  door(x + ww / 2 - 6, top + hh - 16, true);
}

// ---- landmarks (drawn into the map canvas at pixel x, tile rows) ------------
const LANDMARKS = {
  bigben(x) { // w3 h5 ; base row 4
    const cx = x + 24;
    rect(cx - 12, 22, 24, 58, 3); rect(cx - 11, 23, 22, 57, 1);
    for (let y = 40; y < 78; y += 8) { rect(cx - 9, y, 4, 5, 3); rect(cx + 5, y, 4, 5, 3); rect(cx - 2, y, 4, 5, 2); }
    disc(cx, 30, 7, 3); disc(cx, 30, 6, 0); rect(cx, 26, 1, 4, 3); rect(cx, 30, 3, 1, 3);
    for (let i = 0; i < 9; i++) rect(cx - 9 + i, 21 - i * 2, 18 - i * 2, 2, i % 2 ? 2 : 3);
    rect(cx, 2, 1, 4, 3); rect(cx - 1, 0, 3, 2, 4);
  },
  phonebox(x) { // w1 h2
    rect(x + 3, 48, 11, 32, 3); rect(x + 4, 50, 9, 30, 4);
    rect(x + 5, 53, 7, 3, 0); text('', 0, 0);
    for (let r = 0; r < 4; r++) { rect(x + 5, 58 + r * 5, 3, 4, 1); rect(x + 9, 58 + r * 5, 3, 4, 1); }
    rect(x + 3, 46, 11, 3, 3);
  },
  towerbridge(x) { // bottom: in the river, w6
    const B = 176;
    rect(x + 30, B + 6, 36, 4, 3); rect(x + 30, B + 7, 36, 2, 2);
    for (let i = 0; i < 6; i++) rect(x + 32 + i * 6, B + 10, 1, 26, 3);
    for (const tx of [x + 14, x + 66]) {
      rect(tx, B, 16, 62, 3); rect(tx + 1, B + 1, 14, 60, 1);
      rect(tx + 4, B + 6, 3, 8, 3); rect(tx + 9, B + 6, 3, 8, 3); rect(tx + 4, B + 40, 8, 20, 2);
      for (let i = 0; i < 4; i++) rect(tx + 2 + i, B - 2 - i * 2, 12 - i * 2, 2, 3);
      rect(tx + 7, B - 13, 2, 5, 4);
    }
    rect(x, B + 34, 96, 6, 3); rect(x, B + 35, 96, 3, 4);
  },

  capitole(x) { // w6 h4 pink palace
    const top = 16;
    rect(x, top + 8, 96, 56, 3); rect(x + 1, top + 9, 94, 55, 1);
    rect(x - 2, top + 4, 100, 5, 3);
    for (let i = 0; i < 8; i++) { rect(x + 6 + i * 11, top + 14, 4, 46, 0); rect(x + 6 + i * 11, top + 14, 1, 46, 2); }
    rect(x + 36, top - 4, 24, 9, 3); rect(x + 38, top - 2, 20, 7, 4);
    rect(x + 42, top + 44, 12, 20, 3); rect(x + 43, top + 45, 10, 19, 2);
    for (let i = 0; i < 96; i += 8) rect(x + i, top + 64 - 2, 4, 2, 2);
  },
  saintsernin(x) { // w3 h5 tiered octagonal tower
    const cx = x + 24;
    rect(x + 2, 46, 44, 34, 3); rect(x + 3, 47, 42, 33, 1);
    rect(x + 18, 60, 12, 20, 3); rect(x + 19, 61, 10, 19, 2); disc(cx, 60, 6, 3); disc(cx, 60, 5, 2);
    for (let t = 0; t < 4; t++) {
      const ww = 26 - t * 5, yy = 38 - t * 9;
      rect(cx - ww / 2, yy, ww, 9, 3); rect(cx - ww / 2 + 1, yy + 1, ww - 2, 7, 1);
      for (let i = 0; i < ww - 4; i += 4) rect(cx - ww / 2 + 3 + i, yy + 3, 2, 4, 3);
    }
    for (let i = 0; i < 6; i++) rect(cx - 5 + i, 2 + i, 10 - i * 2 + 1, 1, 3);
    rect(cx, 0, 1, 3, 3);
  },
  pontneuf(x) { // bottom bridge w7
    const B = 180;
    rect(x, B, 112, 10, 3); rect(x, B + 1, 112, 4, 1); rect(x, B - 3, 112, 3, 2);
    for (let i = 0; i < 5; i++) { disc(x + 12 + i * 22, B + 26, 9, 2); rect(x + 3 + i * 22, B + 26, 18, 30, 2); }
    for (let i = 0; i < 6; i++) { rect(x + 1 + i * 22, B + 6, 6, 52, 3); disc(x + 4 + i * 22, B + 14, 3, 0); }
  },

  tram28(x) { // w4 h3 yellow tram at a stop
    const y = 44;
    rect(x + 2, y, 60, 30, 3); rect(x + 3, y + 1, 58, 28, 1);
    rect(x + 3, y + 15, 58, 3, 0);
    for (let i = 0; i < 6; i++) { rect(x + 6 + i * 9, y + 4, 6, 9, 3); rect(x + 7 + i * 9, y + 5, 4, 7, 0); }
    rect(x + 3, y + 18, 58, 11, 2); text('28', x + 26, y + 20, 0);
    rect(x + 10, y + 29, 6, 5, 3); rect(x + 46, y + 29, 6, 5, 3);
    rect(x + 30, y - 12, 1, 12, 3); rect(x + 24, y - 12, 14, 1, 3);
    rect(x, 76, 64, 2, 3);
  },
  miradouro(x) { // w5 h3 tiled terrace with rooftops below
    const top = 32;
    rect(x, top, 80, 48, 0);
    for (let i = 0; i < 6; i++) { rect(x + i * 14, top + 10 + (i % 3) * 3, 12, 14, 4); rect(x + i * 14, top + 8 + (i % 3) * 3, 12, 3, 3); }
    rect(x + 64, top + 2, 2, 12, 3); disc(x + 65, top + 4, 4, 2);
    rect(x, top + 30, 80, 18, 2);
    for (let i = 0; i < 80; i += 8) { rect(x + i + 1, top + 32, 6, 6, 0); rect(x + i + 3, top + 34, 2, 2, 2); rect(x + i + 1, top + 40, 6, 6, 0); rect(x + i + 3, top + 42, 2, 2, 2); }
    rect(x, top + 26, 80, 2, 3); for (let i = 0; i < 80; i += 5) rect(x + i, top + 22, 1, 5, 3);
  },
  belem(x) { // bottom: tower in the river, w3
    const B = 176;
    rect(x + 4, B + 30, 40, 26, 3); rect(x + 5, B + 31, 38, 24, 0);
    for (let i = 0; i < 9; i++) rect(x + 5 + i * 4, B + 27, 2, 4, 3);
    rect(x + 12, B - 6, 24, 38, 3); rect(x + 13, B - 5, 22, 37, 0);
    for (let i = 0; i < 6; i++) rect(x + 12 + i * 4, B - 10, 2, 4, 3);
    rect(x + 20, B + 2, 8, 10, 3); rect(x + 21, B + 3, 6, 9, 2);
    rect(x + 16, B + 18, 16, 3, 3); rect(x + 21, B + 40, 6, 12, 3);
  },

  canalhouses(x) { // w5 h5 narrow gabled houses
    const ws = [16, 16, 16, 16, 16], hs = [62, 70, 58, 66, 60];
    let cx = x;
    ws.forEach((w, i) => {
      const t = 80 - hs[i];
      rect(cx, t, w, hs[i], 3); rect(cx + 1, t + 1, w - 2, hs[i] - 1, i % 2 ? 2 : 1);
      for (let s = 0; s < 3; s++) rect(cx + 3 + s, t - 3 - s * 2, w - 6 - s * 2, 2, 3);
      for (let r = 0; r < 4; r++) { rect(cx + 3, t + 8 + r * 12, 4, 6, 0); rect(cx + 9, t + 8 + r * 12, 4, 6, 0); }
      rect(cx + 7, t - 6, 2, 3, 3);
      cx += w;
    });
  },
  windmill(x) { // w3 h5
    const cx = x + 24;
    for (let i = 0; i < 40; i++) rect(cx - 8 - i * 0.2, 40 + i, 16 + i * 0.4, 1, i % 6 === 0 ? 3 : 2);
    rect(cx - 4, 68, 8, 12, 3);
    disc(cx, 36, 7, 3); disc(cx, 36, 5, 1);
    const a = (fc / 60) % (Math.PI / 2);
    for (let k = 0; k < 4; k++) {
      const ang = a + k * Math.PI / 2;
      for (let r = 4; r < 26; r++) { rect(cx + Math.cos(ang) * r, 36 + Math.sin(ang) * r, 2, 2, 3); if (r > 8) rect(cx + Math.cos(ang) * r + Math.cos(ang + 1.57) * 3, 36 + Math.sin(ang) * r + Math.sin(ang + 1.57) * 3, 2, 2, 0); }
    }
    disc(cx, 36, 2, 4);
  },
  tulipmarket(x) { // w3 h3 flower stall
    const top = 40;
    for (let i = 0; i < 48; i += 8) { rect(x + i, top, 4, 8, 4); rect(x + i + 4, top, 4, 8, 0); }
    rect(x, top + 8, 48, 1, 3);
    rect(x + 2, top + 9, 2, 24, 3); rect(x + 44, top + 9, 2, 24, 3);
    rect(x, top + 26, 48, 14, 3); rect(x + 1, top + 27, 46, 12, 2);
    for (let i = 0; i < 9; i++) { rect(x + 3 + i * 5, top + 20, 1, 7, 3); rect(x + 2 + i * 5, top + 17, 3, 4, i % 3 === 1 ? 0 : 4); }
  },
  stephansdom(x) { // w3 h5 tall spire + zigzag roof
    rect(x, 50, 48, 30, 3); rect(x + 1, 51, 46, 29, 1);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) rect(x + 2 + i * 7 + (j % 2) * 3, 53 + j * 4, 4, 2, i % 2 ? 4 : 2);
    rect(x + 18, 64, 12, 16, 3); rect(x + 19, 65, 10, 15, 2);
    const cx = x + 36;
    for (let i = 0; i < 50; i++) { const w = Math.max(1, 12 - Math.floor(i / 4.5)); rect(cx - w / 2, 50 - i, w, 1, i % 7 === 0 ? 3 : 2); }
    rect(cx - 1, 0, 2, 2, 3);
  },
  riesenrad(x) { // w5 h5 giant ferris wheel
    const cx = x + 40, cy = 36, r = 30;
    ring(cx, cy, r, 3); ring(cx, cy, r - 1, 3); ring(cx, cy, r - 6, 2);
    const a = fc / 400;
    for (let k = 0; k < 12; k++) {
      const ang = a + k * Math.PI / 6;
      line(cx, cy, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 2);
      const gx = cx + Math.cos(ang) * r, gy = cy + Math.sin(ang) * r;
      rect(gx - 3, gy, 6, 5, 4); rect(gx - 2, gy + 1, 4, 2, 0);
    }
    disc(cx, cy, 3, 3);
    line(cx, cy, cx - 22, 80, 3); line(cx, cy, cx + 22, 80, 3); line(cx + 1, cy, cx - 21, 80, 3); line(cx - 1, cy, cx + 21, 80, 3);
  },
  schonbrunn(x) { // w6 h3 yellow palace
    const top = 34;
    rect(x, top, 96, 46, 3); rect(x + 1, top + 1, 94, 45, 1);
    rect(x - 2, top - 3, 100, 4, 3); rect(x + 30, top - 10, 36, 8, 3); rect(x + 32, top - 8, 32, 6, 2);
    for (let i = 0; i < 11; i++) { rect(x + 4 + i * 8, top + 6, 5, 9, 3); rect(x + 5 + i * 8, top + 7, 3, 7, 0); rect(x + 4 + i * 8, top + 22, 5, 9, 3); rect(x + 5 + i * 8, top + 23, 3, 7, 0); }
    rect(x + 42, top + 32, 12, 14, 3); rect(x + 43, top + 33, 10, 13, 2);
    rect(x + 46, top - 14, 4, 4, 4);
  },
  souq(x) { // w5 h3 mud-brick souq with arches & lanterns
    const top = 36;
    rect(x, top, 80, 44, 3); rect(x + 1, top + 1, 78, 43, 1);
    for (let i = 0; i < 80; i += 6) rect(x + i, top - 3, 3, 4, 3);
    for (let i = 0; i < 4; i++) { const ax = x + 6 + i * 19; rect(ax, top + 18, 13, 26, 3); disc(ax + 6, top + 18, 6, 3); rect(ax + 1, top + 19, 11, 25, 2); disc(ax + 6, top + 18, 5, 2); }
    for (let i = 0; i < 80; i += 10) { rect(x + i + 4, top + 5, 1, 4, 3); rect(x + i + 2, top + 9, 5, 5, 4); }
    for (let i = 4; i < 80; i += 12) rect(x + i, top + 2, 1, 14, 2);
  },
  mia(x) { // bottom: Museum of Islamic Art, geometric stacked blocks, w5
    const B = 176;
    rect(x + 4, B + 26, 72, 32, 3); rect(x + 5, B + 27, 70, 31, 0);
    rect(x + 16, B + 12, 48, 16, 3); rect(x + 17, B + 13, 46, 15, 0);
    rect(x + 26, B + 0, 28, 14, 3); rect(x + 27, B + 1, 26, 13, 0);
    rect(x + 34, B - 10, 12, 12, 3); rect(x + 35, B - 9, 10, 11, 0);
    rect(x + 38, B - 5, 4, 4, 3);
    for (let i = 0; i < 6; i++) rect(x + 8 + i * 11, B + 36, 6, 10, 2);
    rect(x + 30, B + 18, 20, 6, 2);
  },

  dhow(x) { // bottom: wooden boat w3
    const by = 206 + (fc % 80 < 40 ? 0 : 1);
    rect(x + 2, by, 44, 5, 3); rect(x + 6, by + 5, 36, 4, 3); rect(x + 3, by + 1, 42, 3, 2);
    rect(x + 22, by - 30, 2, 30, 3);
    for (let i = 0; i < 26; i++) rect(x + 24, by - 28 + i, Math.floor(i * 0.7), 1, i % 5 ? 0 : 1);
    line(x + 4, by, x + 22, by - 30, 3);
  },

  cathedral(x) { // w5 h4 Plaza de Armas cathedral
    const top = 22;
    rect(x, top + 14, 80, 44, 3); rect(x + 1, top + 15, 78, 43, 0);
    for (const tx of [x + 2, x + 62]) { rect(tx, top, 16, 58, 3); rect(tx + 1, top + 1, 14, 57, 1); rect(tx + 5, top + 6, 6, 8, 3); disc(tx + 8, top, 6, 3); disc(tx + 8, top, 5, 1); rect(tx + 7, top - 9, 2, 4, 3); }
    rect(x + 30, top + 16, 20, 4, 3);
    for (let i = 0; i < 4; i++) rect(x + 24 + i * 9, top + 22, 3, 30, 1);
    rect(x + 34, top + 38, 12, 20, 3); rect(x + 35, top + 39, 10, 19, 2);
    disc(x + 40, top + 28, 4, 4);
  },
  sancristobal(x) { // w6 h5 hill with white statue
    for (let i = 0; i < 64; i++) { const w = Math.min(96, 18 + i * 2.6); rect(x + 48 - w / 2, 16 + i, w, 1, i % 9 === 0 ? 3 : 2); }
    for (let i = 0; i < 9; i++) { const tx = x + 8 + i * 10; rect(tx, 56 + (i % 3) * 6, 6, 6, 3); rect(tx + 1, 57 + (i % 3) * 6, 4, 4, 1); }
    rect(x + 45, 2, 6, 16, 0); rect(x + 44, 2, 1, 14, 3); rect(x + 51, 2, 1, 14, 3); disc(x + 48, 2, 2, 0); rect(x + 42, 6, 12, 2, 0);
    line(x + 10, 78, x + 46, 22, 3); rect(x + 26, 50, 6, 5, 4); // funicular
  },
  gondola(x) { // w5 h5 cable car up the hill
    for (let i = 0; i < 70; i++) rect(x, 10 + i, Math.min(80, 20 + i * 1.2), 1, i % 10 === 0 ? 3 : 2);
    for (let i = 0; i < 6; i++) { const tx = x + 4 + i * 11; rect(tx + 3, 48 + i % 2 * 6, 2, 6, 3); rect(tx, 40 + i % 2 * 6, 8, 9, 3); rect(tx + 1, 41 + i % 2 * 6, 6, 7, 1); }
    line(x + 76, 74, x + 6, 14, 3);
    const t = (fc / 4) % 60;
    const gx = x + 70 - t, gy = 69 - t * 0.78;
    rect(gx, gy + 2, 9, 8, 3); rect(gx + 1, gy + 3, 7, 3, 0); rect(gx + 1, gy + 6, 7, 3, 4); rect(gx + 4, gy - 1, 1, 3, 3);
    rect(x + 2, 6, 16, 10, 3); rect(x + 3, 7, 14, 8, 0);
  },
  remarkables(x) { // w6 h5 jagged snowy mountains
    const peaks = [[0, 40], [18, 12], [30, 26], [46, 6], [62, 22], [80, 14], [96, 40]];
    for (let px = 0; px < 96; px++) {
      let i = 0; while (peaks[i + 1][0] < px) i++;
      const [x0, y0] = peaks[i], [x1, y1] = peaks[i + 1];
      const py = Math.round(y0 + (y1 - y0) * (px - x0) / (x1 - x0));
      rect(x + px, py, 1, 80 - py, 2);
      rect(x + px, py, 1, Math.max(2, 14 - (py - 6) * 0.6), 0);
      rect(x + px, py, 1, 1, 3);
    }
    rect(x, 70, 96, 10, 3); rect(x, 71, 96, 8, 1);
  },
  steamer(x) { // bottom: old lake steamship w4
    const by = 204;
    rect(x + 2, by, 60, 8, 3); rect(x + 3, by + 1, 58, 3, 4); rect(x + 6, by + 8, 52, 3, 3);
    rect(x + 12, by - 10, 40, 10, 3); rect(x + 13, by - 9, 38, 9, 0);
    for (let i = 0; i < 7; i++) rect(x + 15 + i * 5, by - 7, 3, 4, 2);
    rect(x + 30, by - 24, 6, 14, 3); rect(x + 31, by - 23, 4, 4, 4);
    if (fc % 40 < 20) disc(x + 34, by - 30, 3, 1); else disc(x + 36, by - 32, 4, 1);
  },

  lakeview(x) { // bottom marker: jetty
    const by = 184;
    rect(x, by, 48, 5, 3); rect(x + 1, by + 1, 46, 3, 1);
    for (let i = 0; i < 5; i++) rect(x + 4 + i * 10, by + 5, 2, 22, 3);
  },

  mirador(x) { /* uses telescope prop in park; nothing extra */ },
};

// distant backdrop behind the buildings (sky row)
function drawBackdrop(kind, w) {
  rect(0, 0, w, 80, 0);
  for (let i = 0; i < w; i += 70) { rect(i + 12, 8 + (i % 3) * 4, 16, 3, 1); rect(i + 16, 6 + (i % 3) * 4, 8, 2, 1); }
  if (kind === 'andes' || kind === 'alps') {
    for (let px = 0; px < w; px++) {
      const h = 34 + Math.sin(px / 23) * 10 + Math.sin(px / 9) * 4;
      rect(px, 80 - h, 1, h, 1);
      rect(px, 80 - h, 1, Math.max(0, 8 + Math.sin(px / 23) * 6), 0);
    }
  }
  if (kind === 'desert') {
    disc(w - 60, 18, 8, 1);
    for (let px = 0; px < w; px += 90) { rect(px + 30, 38, 4, 42, 1); rect(px + 31, 32, 2, 6, 1); }
  }
  if (kind === 'roofs') {
    for (let px = 0; px < w; px += 18) { rect(px, 50 + (px % 7), 16, 30, 1); }
  }
}
