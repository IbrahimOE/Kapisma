/* ==========================================================
   DERBİ KAPIŞMASI — Spiel-Engine
   ========================================================== */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ---------- Speicher mit Notfallplan ---------- */
const Store = (() => {
  let mem = {};
  let ok = true;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch (e) { ok = false; }
  return {
    get(k, d) {
      try { const v = ok ? localStorage.getItem(k) : mem[k]; return v ? JSON.parse(v) : d; }
      catch (e) { return d; }
    },
    set(k, v) {
      try { const s = JSON.stringify(v); ok ? localStorage.setItem(k, s) : (mem[k] = s); } catch (e) { }
    }
  };
})();

const SAVE = Object.assign({
  trophies: {}, wins: {}, kos: 0, bestCombo: 0, fights: 0, diff: 1, sound: 1, roundTime: 75, chaos: 0
}, Store.get('dk.save', {}));
const persist = () => Store.set('dk.save', SAVE);

/* ==========================================================
   KÄMPFER
   ========================================================== */
const CLUBS = {
  gs: { name: 'Galatasaray', a: '#B01B2E', b: '#F4B840', logo: 'assets/logo_gs.webp', chant: 'Cimbom!' },
  fb: { name: 'Fenerbahçe', a: '#153E86', b: '#FFDF00', logo: 'assets/logo_fb.webp', chant: 'Fenerbahçe!' }
};

const FIGHTERS = [
  {
    id: 'mikail', name: 'MIKAIL', nick: 'The Lion', club: 'gs', rank: 'Legend',
    sprite: 'assets/mikail.webp', head: 'assets/mikail_head.webp',
    rig: { h: 780, w: 384, waist: 362, split: 193, armX: 190, armY: 99, armW: 194, armH: 235, legLW: 193, legRW: 191, legH: 418, armPivot: [16, 16], legLPivot: [66, 3], legRPivot: [33, 3] },
    height: '1,78 m', weight: '102 kg', style: 'Power Puncher',
    power: 9, speed: 8, defense: 7, stamina: 8,
    ab: { fullStaminaPower: 1, lowHpDefense: 1 },
    abilities: [
      ['Taraftar Gücü', 'Volle Ausdauer heißt 22 % mehr Wucht'],
      ['Cimbom Ruhu', 'Unter 30 % Leben steckt er ein Viertel weniger ein'],
      ['Güçlü Vuruş', 'Der schnellste Jab im Ring']
    ],
    special: { name: 'LION RUSH', tr: 'Aslan Hücumu', hits: 4, dmg: 9.5, gap: 165 },
    ultimate: { name: 'CIMBOM FIRTINASI', tr: 'Efsane Seri', hits: 7, dmg: 10, gap: 130 },
    emotes: ['Aslan gibi kükre! 🦁', 'Cimbom bitmez!', 'Ist das alles?', 'Setz dich lieber hin 😴']
  },
  {
    id: 'beytullah', name: 'BEYTULLAH', nick: 'The Lion', club: 'fb', rank: 'Gold III',
    sprite: 'assets/beytullah.webp', head: 'assets/beytullah_head.webp',
    rig: { h: 780, w: 367, waist: 411, split: 187, armX: 179, armY: 159, armW: 188, armH: 242, legLW: 187, legRW: 180, legH: 369, armPivot: [16, 15], legLPivot: [66, 4], legRPivot: [33, 4] },
    height: '1,65 m', weight: '92 kg', style: 'Pressure Fighter',
    power: 8, speed: 7, defense: 8, stamina: 9,
    ab: { fastRegen: 1, lowHpDefense: 1, comboPower: 1 },
    abilities: [
      ['Aslan Yüreği', 'Ausdauer kommt 60 % schneller zurück'],
      ['Ringde Hâkim', 'Jeder Treffer in Folge macht mehr Schaden'],
      ['Fenerbahçe Ruhu', 'Unter 30 % Leben steckt er ein Viertel weniger ein']
    ],
    special: { name: 'ASLAN COMBO', tr: 'Sol Kroşe', hits: 5, dmg: 7.5, gap: 130 },
    ultimate: { name: 'SARI KANARYA', tr: 'Kanat Çırpışı', hits: 8, dmg: 8, gap: 115 },
    emotes: ['Fenerbahçe! 💛💙', 'Sol kroşe geliyor!', 'Zu langsam, Kardeşim', 'Sarı Kanarya 🐤']
  },
  {
    id: 'ibrahim', name: 'IBRAHIM', nick: 'The Lion', club: 'gs', rank: 'Legend',
    sprite: 'assets/ibrahim.webp', head: 'assets/ibrahim_head.webp',
    rig: { h: 780, w: 394, waist: 396, split: 192, armX: 197, armY: 115, armW: 197, armH: 210, legLW: 192, legRW: 202, legH: 384, armPivot: [16, 18], legLPivot: [66, 3], legRPivot: [33, 3] },
    height: '1,73 m', weight: '150+ kg', style: 'Heavy Destroyer',
    power: 9, speed: 5, defense: 10, stamina: 9,
    ab: { ironBody: 1, endless: 1, meterOverTime: 1 },
    abilities: [
      ['Demir Gövde', 'Nimmt grundsätzlich 18 % weniger Schaden'],
      ['Aslan Gücü', 'Schläge kosten ihn kaum Ausdauer'],
      ['Ruh 1905', 'Die Spezialleiste füllt sich von allein']
    ],
    special: { name: 'RUH 1905', tr: 'Body Smash', hits: 2, dmg: 24, gap: 340 },
    ultimate: { name: '1905 KIYAMETI', tr: 'Son Darbe', hits: 4, dmg: 22, gap: 260 },
    emotes: ['1905 🦁', 'Boyun mu var?', 'Ich bin die Wand.', 'Sixt zahlt den Krankenwagen']
  }
];
const byId = id => FIGHTERS.find(f => f.id === id);

const MOVES = {
  jab: { dmg: 5.5, stam: 7, startup: 115, recover: 155, meter: .75, word: 'PAT!', knock: 6, stop: 55, hitDur: 190 },
  hook: { dmg: 13, stam: 17, startup: 255, recover: 330, meter: .95, word: 'KÜT!', knock: 18, stop: 110, hitDur: 340 },
  body: { dmg: 8.5, stam: 11, startup: 185, recover: 240, meter: .85, word: 'BAM!', knock: 9, stop: 80, hitDur: 250, stamHit: 15 }
};

const DIFFS = [
  { name: 'Amateur', react: 520, blockP: .22, gap: [560, 1050], hookP: .22, specP: .55, hold: [380, 700] },
  { name: 'Profi', react: 330, blockP: .46, gap: [330, 720], hookP: .34, specP: .88, hold: [320, 620] },
  { name: 'Legende', react: 185, blockP: .64, gap: [200, 470], hookP: .46, specP: 1, hold: [260, 520] }
];

/* ==========================================================
   TON (komplett synthetisch, keine Dateien)
   ========================================================== */
const Sfx = (() => {
  let ctx = null, master = null, crowdGain = null, on = !!SAVE.sound;
  function boot() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    // Publikum: gefiltertes Rauschen mit langsamer Modulation
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .5;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = .7;
    crowdGain = ctx.createGain(); crowdGain.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = .16;
    const lg = ctx.createGain(); lg.gain.value = .35;
    lfo.connect(lg); lg.connect(crowdGain.gain); lfo.start();
    src.connect(bp); bp.connect(crowdGain); crowdGain.connect(master); src.start();
  }
  function noise(dur) {
    const n = ctx.sampleRate * dur | 0;
    const b = ctx.createBuffer(1, n, ctx.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }
  const api = {
    resume() { boot(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    toggle(v) { on = v; if (crowdGain) crowdGain.gain.value = on ? crowdGain.__t || 0 : 0; },
    crowd(level) {
      if (!ctx) return; const t = on ? level : 0; crowdGain.__t = level;
      crowdGain.gain.setTargetAtTime(t, ctx.currentTime, .5);
    },
    punch(power = 1, blocked = false) {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      const s = noise(.16), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(blocked ? 1800 : 900, t);
      f.frequency.exponentialRampToValueAtTime(120, t + .13);
      g.gain.setValueAtTime(clamp(.22 + power * .3, 0, .85), t);
      g.gain.exponentialRampToValueAtTime(.001, t + .17);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .2);
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(blocked ? 210 : 130, t);
      o.frequency.exponentialRampToValueAtTime(45, t + .14);
      og.gain.setValueAtTime(.4 * power, t); og.gain.exponentialRampToValueAtTime(.001, t + .16);
      o.connect(og); og.connect(master); o.start(t); o.stop(t + .18);
    },
    bell(times = 3) {
      if (!ctx || !on) return;
      for (let i = 0; i < times; i++) {
        const t = ctx.currentTime + i * .32;
        [1, 2.76, 5.4].forEach((m, k) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 660 * m;
          g.gain.setValueAtTime(.24 / (k + 1), t);
          g.gain.exponentialRampToValueAtTime(.001, t + 1.1);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.2);
        });
      }
    },
    roar() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(58, t + .7);
      f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 6;
      g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.5, t + .08);
      g.gain.exponentialRampToValueAtTime(.001, t + .85);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + .9);
      const s = noise(.6), sg = ctx.createGain(), sf = ctx.createBiquadFilter();
      sf.type = 'bandpass'; sf.frequency.value = 420;
      sg.gain.setValueAtTime(.3, t); sg.gain.exponentialRampToValueAtTime(.001, t + .6);
      s.connect(sf); sf.connect(sg); sg.connect(master); s.start(t); s.stop(t + .65);
    },
    ko() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      [90, 134, 61].forEach((fq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(fq * 3, t);
        o.frequency.exponentialRampToValueAtTime(fq * .6, t + 1.4);
        g.gain.setValueAtTime(.3 - i * .07, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.6);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.7);
      });
    },
    airhorn() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      [1, 1.5].forEach((mul, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(233 * mul, t + i * .03);
        f.type = 'lowpass'; f.frequency.value = 2200;
        g.gain.setValueAtTime(0, t + i * .03);
        g.gain.linearRampToValueAtTime(.28, t + i * .03 + .05);
        g.gain.setValueAtTime(.28, t + .62);
        g.gain.exponentialRampToValueAtTime(.001, t + .95);
        o.connect(f); f.connect(g); g.connect(master);
        o.start(t + i * .03); o.stop(t + 1);
      });
    },
    zap() {
      if (!ctx || !on) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(1800, t);
      o.frequency.exponentialRampToValueAtTime(90, t + .22);
      g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .24);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + .26);
    },
    ui(freq = 520, dur = .07) {
      if (!ctx || !on) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
    },
    block() {
      if (!ctx || !on) return;
      const t = ctx.currentTime, s = noise(.09), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 2;
      g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .1);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .12);
    }
  };
  return api;
})();

const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

/* ==========================================================
   NAVIGATION
   ========================================================== */
let screen = 'home';
function go(name) {
  $$('.screen').forEach(s => s.removeAttribute('data-active'));
  const el = $('#s-' + name);
  el.setAttribute('data-active', '1');
  el.classList.remove('fading'); void el.offsetWidth; el.classList.add('fading');
  screen = name;
}
function setClubVars(el, club) {
  el.style.setProperty('--c1', CLUBS[club].a);
  el.style.setProperty('--c2', CLUBS[club].b);
}

/* ==========================================================
   DASHBOARD
   ========================================================== */
function renderHome() {
  const tc = $('#trophyCase');
  const total = Object.values(SAVE.trophies).reduce((a, b) => a + b, 0);
  tc.innerHTML = total
    ? FIGHTERS.filter(f => SAVE.trophies[f.id]).map(f =>
      `<div class="tk" style="border-color:${CLUBS[f.club].b}55"><i>🏆</i> ${f.name} <b>×${SAVE.trophies[f.id]}</b></div>`).join('')
    : `<div class="tk"><i>🏆</i> Noch kein Pokal vergeben</div>`;

  $('#roster').innerHTML = FIGHTERS.map(f => {
    const c = CLUBS[f.club];
    const bars = n => Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    return `<div class="rcard" data-fighter="${f.id}" style="--c1:${c.a};--c2:${c.b}">
      <img src="${f.head}" alt="${f.name}">
      <div class="rc-txt">
        <div class="rc-name">${f.name}</div>
        <div class="rc-sub">${c.name} · ${f.style} · ${f.weight}</div>
        <div class="rc-bars">${bars(f.power)}</div>
      </div>
      <div class="rc-rank">${f.rank}</div>
    </div>`;
  }).join('');

  $('#records').innerHTML = `
    <div class="rec"><b>${SAVE.fights}</b><span>Kämpfe</span></div>
    <div class="rec"><b>${SAVE.kos}</b><span>K.O.s</span></div>
    <div class="rec"><b>${SAVE.bestCombo}</b><span>Bester Combo</span></div>`;

  $$('#diffSeg button').forEach(b => b.classList.toggle('on', +b.dataset.diff === SAVE.diff));
  $$('#soundSeg button').forEach(b => b.classList.toggle('on', +b.dataset.snd === SAVE.sound));
  $$('#timeSeg button').forEach(b => b.classList.toggle('on', +b.dataset.time === SAVE.roundTime));
  $$('#chaosSeg button').forEach(b => b.classList.toggle('on', +b.dataset.chaos === SAVE.chaos));
}

$('#diffSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  SAVE.diff = +b.dataset.diff; persist(); renderHome(); Sfx.ui(660);
});
$('#soundSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  SAVE.sound = +b.dataset.snd; persist(); Sfx.toggle(!!SAVE.sound); renderHome(); Sfx.ui(660);
});
$('#timeSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  SAVE.roundTime = +b.dataset.time; persist(); renderHome(); Sfx.ui(660);
});
$('#chaosSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  SAVE.chaos = +b.dataset.chaos; persist(); renderHome(); Sfx.ui(660);
});
$('#roster').addEventListener('click', e => {
  const c = e.target.closest('.rcard'); if (!c) return;
  Sfx.resume(); Sfx.ui(760);
  MATCH.mode = 'quick'; startSelect(c.dataset.fighter);
});
$$('.mode').forEach(b => b.addEventListener('click', () => {
  Sfx.resume(); Sfx.ui(820);
  MATCH.mode = b.dataset.mode;
  startSelect();
}));
$$('[data-back]').forEach(b => b.addEventListener('click', () => { Sfx.ui(420); go(b.dataset.back); }));

/* ==========================================================
   CHARAKTERWAHL
   ========================================================== */
const MATCH = { mode: 'quick', p1: null, p2: null, stage: 0, bracket: [], twoPlayer: false };
let selWho = 1, selIdx = 0;

function startSelect(preset) {
  MATCH.twoPlayer = MATCH.mode === 'versus';
  MATCH.p1 = MATCH.p2 = null; MATCH.stage = 0; MATCH.bracket = [];
  selWho = 1; selIdx = preset ? FIGHTERS.findIndex(f => f.id === preset) : 0;
  paintSelect(); go('select');
}

function paintSelect() {
  const f = FIGHTERS[selIdx], c = CLUBS[f.club];
  const sec = $('#s-select'); setClubVars(sec, f.club);
  $('#selTitle').textContent = MATCH.twoPlayer
    ? (selWho === 1 ? 'Spieler 1 wählt' : 'Spieler 2 wählt')
    : (MATCH.mode === 'tournament' ? 'Dein Kämpfer' : selWho === 1 ? 'Dein Kämpfer' : 'Gegner wählen');

  $('#selStage').innerHTML =
    `<div class="glow"></div><img class="crest" src="${c.logo}" alt=""><img class="who" src="${f.sprite}" alt="${f.name}">`;

  $('#selInfo').innerHTML = `
    <div class="si-name">${f.name}</div>
    <div class="si-nick">${f.nick} · ${c.name}</div>
    <div class="si-meta">${f.height} · ${f.weight} · ${f.style}</div>
    <div class="si-stats">
      <div><b>${f.power}</b><span>Power</span></div>
      <div><b>${f.speed}</b><span>Speed</span></div>
      <div><b>${f.defense}</b><span>Defense</span></div>
      <div><b>${f.stamina}</b><span>Stamina</span></div>
    </div>
    <div class="si-abil">${f.abilities.map(a => `<p><b>${a[0]}</b> — ${a[1]}</p>`).join('')}</div>
    <div class="si-special">SPECIAL · ${f.special.name}</div>`;

  $('#selStrip').innerHTML = FIGHTERS.map((x, i) => {
    const taken = MATCH.p1 && x.id === MATCH.p1 && selWho === 2 && !MATCH.twoPlayer ? 'taken' : '';
    return `<button data-i="${i}" class="${i === selIdx ? 'on' : ''} ${taken}"><img src="${x.head}" alt="${x.name}"></button>`;
  }).join('');
  $('#selConfirm').textContent = selWho === 1
    ? (MATCH.mode === 'tournament' ? 'Turnier starten' : 'Weiter')
    : 'In den Ring';
}

$('#selStage').addEventListener('pointermove', e => {
  const img = $('#selStage img.who'); if (!img) return;
  const r = $('#selStage').getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
  img.style.transform = `rotateY(${(px * 20).toFixed(1)}deg) rotateX(${(-py * 15).toFixed(1)}deg)`;
});
$('#selStage').addEventListener('pointerleave', () => {
  const img = $('#selStage img.who'); if (img) img.style.transform = '';
});
$('#selStrip').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  selIdx = +b.dataset.i; Sfx.ui(700); paintSelect();
});
$('#selConfirm').addEventListener('click', () => {
  Sfx.resume(); Sfx.ui(880);
  const id = FIGHTERS[selIdx].id;
  if (selWho === 1) {
    MATCH.p1 = id;
    if (MATCH.mode === 'tournament') {
      MATCH.bracket = FIGHTERS.filter(f => f.id !== id).map(f => f.id);
      MATCH.stage = 0; MATCH.p2 = MATCH.bracket[0];
      return beginFight();
    }
    selWho = 2;
    selIdx = FIGHTERS.findIndex(f => f.id !== id);
    paintSelect();
  } else {
    if (!MATCH.twoPlayer && id === MATCH.p1) { shakeEl($('#selStrip')); return; }
    MATCH.p2 = id; beginFight();
  }
});
function shakeEl(el) {
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' },
  { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 220 });
}

/* ==========================================================
   VS-INTRO
   ========================================================== */
function playIntro(done) {
  const A = byId(MATCH.p1), B = byId(MATCH.p2);
  const stageTxt = MATCH.mode === 'tournament'
    ? (MATCH.stage === 0 ? 'Halbfinale' : 'Finale · Şampiyonlar Ligi')
    : MATCH.twoPlayer ? '2 Spieler · Ein Handy' : 'Schnellkampf';
  $('#introStage').textContent = stageTxt;
  $('#introL img').src = A.sprite; $('#introR img').src = B.sprite;
  $('#introNameL').innerHTML = `${A.name}<small>${CLUBS[A.club].name}</small>`;
  $('#introNameR').innerHTML = `${B.name}<small>${CLUBS[B.club].name}</small>`;
  ['#beltA', '#beltB', '#introL', '#introR', '#introNameL', '#introNameR', '#introVS', '#introStage']
    .forEach(s => $(s).classList.remove('go'));
  $('#introCount').classList.remove('tick'); $('#introCount').textContent = '';
  go('intro');
  Sfx.crowd(.10);

  const seq = [
    [40, () => { $('#beltA').classList.add('go'); $('#beltB').classList.add('go'); }],
    [180, () => { $('#introL').classList.add('go'); Sfx.ui(320, .12); }],
    [340, () => { $('#introNameL').classList.add('go'); }],
    [420, () => { $('#introR').classList.add('go'); Sfx.ui(280, .12); }],
    [580, () => { $('#introNameR').classList.add('go'); }],
    [760, () => { $('#introVS').classList.add('go'); $('#introStage').classList.add('go'); Sfx.roar(); Sfx.crowd(.24); buzz(40); }],
    [1500, () => count(3)],
  ];
  seq.forEach(([t, fn]) => setTimeout(fn, t));
  function count(n) {
    const el = $('#introCount');
    el.textContent = n > 0 ? n : 'DÖVÜŞ!';
    el.style.fontSize = n > 0 ? '' : 'clamp(48px,17vw,96px)';
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    Sfx.ui(n > 0 ? 440 + (3 - n) * 120 : 980, n > 0 ? .1 : .22);
    if (n > 0) setTimeout(() => count(n - 1), 640);
    else setTimeout(done, 520);
  }
}

/* ==========================================================
   KAMPF
   ========================================================== */
const arena = $('#arena'), camEl = $('#cam'), fxc = $('#fx'), ctx2 = fxc.getContext('2d');
const els = {
  l: { root: $('#fL'), sh: $('#shL'), hp: $('#hpL'), ghost: $('#ghostL'), st: $('#stL'), mt: $('#mtL'), mtw: $('#mtWrapL'), pips: $('#pipsL'), name: $('#nameL'), logo: $('#logoL') },
  r: { root: $('#fR'), sh: $('#shR'), hp: $('#hpR'), ghost: $('#ghostR'), st: $('#stR'), mt: $('#mtR'), mtw: $('#mtWrapR'), pips: $('#pipsR'), name: $('#nameR'), logo: $('#logoR') }
};

/* ---------- Körperteil-Rig ---------- */
function buildRig(side, def) {
  const e = els[side], r = def.rig;
  e.root.innerHTML = '<div class="rig"></div>';
  const rig = e.root.querySelector('.rig');
  const mk = (cls, src) => {
    const img = document.createElement('img');
    img.className = cls; img.src = src; img.alt = '';
    rig.appendChild(img);
    return img;
  };
  e.torso = mk('p-torso', `assets/${def.id}_torso.webp`);
  e.legL = mk('p-legL', `assets/${def.id}_legL.webp`);
  e.legR = mk('p-legR', `assets/${def.id}_legR.webp`);
  e.arm = mk('p-arm', `assets/${def.id}_arm.webp`);
  e.rig = rig;
  e.rigDef = r;
  layoutRig(side);
}

function layoutRig(side) {
  const e = els[side]; if (!e.rig || !e.rigDef) return;
  const r = e.rigDef;
  const hpx = e.root.getBoundingClientRect().height;
  if (!hpx) return;
  const s = hpx / r.h;
  e.rig.style.width = (r.w * s) + 'px';
  e.torso.style.cssText = `left:0;top:0;width:${r.w * s}px`;
  e.legL.style.cssText = `left:0;top:${r.waist * s}px;width:${r.legLW * s}px;transform-origin:${r.legLPivot[0]}% ${r.legLPivot[1]}%`;
  e.legR.style.cssText = `left:${r.split * s}px;top:${r.waist * s}px;width:${r.legRW * s}px;transform-origin:${r.legRPivot[0]}% ${r.legRPivot[1]}%`;
  e.arm.style.cssText = `left:${r.armX * s}px;top:${r.armY * s}px;width:${r.armW * s}px;transform-origin:${r.armPivot[0]}% ${r.armPivot[1]}%`;
}

function poseFighter(f) {
  const e = els[f.side]; if (!e.arm) return;
  let armR = 0, legLR = 0, legRR = 0;
  const idle = Math.sin(f.bob / 380) * 3;

  switch (f.state) {
    case 'idle':
      armR = idle * .7; legLR = idle * .5; legRR = -idle * .5;
      break;
    case 'block':
      armR = -24; legLR = 5; legRR = -5;
      break;
    case 'attack': {
      const mv = f.move, up = mv.startup * f.spdF, rec = mv.recover * f.spdF;
      const raw = f.atkT < up ? f.atkT / up : 1 - (f.atkT - up) / rec;
      const t = clamp(raw, 0, 1);
      const shape = f.moveKey === 'jab' ? -44 : f.moveKey === 'hook' ? -72 : 36;
      armR = shape * t;
      legLR = 12 * t; legRR = -16 * t;
      break;
    }
    case 'special': {
      const flick = Math.sin(G.clock / 55) > 0 ? -74 : -18;
      armR = flick; legLR = 10; legRR = -12;
      break;
    }
    case 'hit':
      armR = 16 * (1 - f.hitT / f.hitDur);
      legLR = -7; legRR = 7;
      break;
    case 'stun':
      armR = 12 * Math.sin(G.clock / 65);
      legLR = 4 * Math.sin(G.clock / 65);
      break;
    case 'ko': {
      const k = Math.min(1, f.koT / 700), e2 = 1 - Math.pow(1 - k, 3);
      armR = 68 * e2; legLR = -32 * e2; legRR = 32 * e2;
      break;
    }
    case 'taunt':
      armR = -28 + Math.sin(G.clock / 55) * 16;
      legLR = Math.sin(G.clock / 90) * 4;
      break;
  }
  e.arm.style.transform = `rotate(${armR.toFixed(1)}deg)`;
  e.legL.style.transform = `rotate(${legLR.toFixed(1)}deg)`;
  e.legR.style.transform = `rotate(${legRR.toFixed(1)}deg)`;
}

const G = {
  running: false, paused: false, clock: 0, hitstop: 0, shake: 0, shakeT: 0,
  round: 1, timeLeft: 75, fighters: {}, timers: [], particles: [], over: false,
  cine: false, ai: null, slowmo: 0, mod: null, rageOn: false
};

function makeFighter(def, side) {
  const maxStam = 68 + def.stamina * 6;
  return {
    def, side, dir: side === 'l' ? 1 : -1,
    hp: 100, maxHp: 100, ghostHp: 100,
    stam: maxStam, maxStam, meter: 0, overcharge: 0, rage: false,
    state: 'idle', move: null, atkT: 0, hitDone: false,
    hitT: 0, hitDur: 0, stunT: 0,
    blocking: false, blockStart: -9999, guardBroken: 0,
    combo: 0, lastHit: -9999, bestCombo: 0, dmgDealt: 0,
    lunge: 0, recoil: 0, rot: 0, bob: rnd(0, 6), koT: 0, tauntT: 0,
    rounds: 0, specialQueue: 0, tookDamage: false, wasLow: false,
    powF: .72 + def.power * .048,
    spdF: 1.28 - def.speed * .055,
    dfnF: 1.22 - def.defense * .042
  };
}

function gainMeter(f, amt) {
  if (f.meter < 100) f.meter = Math.min(100, f.meter + amt);
  else f.overcharge = Math.min(100, f.overcharge + amt * .6);
}

const MODS = [
  { key: 'double', label: 'DOPPELTER SCHADEN', hint: 'Jeder Treffer zählt doppelt' },
  { key: 'blitz', label: 'BLITZSTART', hint: 'Beide starten mit voller Leiste' },
  { key: 'freestam', label: 'FREIE AUSDAUER', hint: 'Schläge kosten keine Kraft' },
  { key: 'sudden', label: 'SUDDEN DEATH', hint: 'Der erste saubere Treffer entscheidet' }
];

function beginFight() {
  const A = byId(MATCH.p1), B = byId(MATCH.p2);
  G.fighters.l = makeFighter(A, 'l');
  G.fighters.r = makeFighter(B, 'r');
  G.round = 1; G.over = false;
  buildRig('l', A); buildRig('r', B);
  els.l.name.textContent = A.name; els.r.name.textContent = B.name;
  els.l.logo.src = CLUBS[A.club].logo; els.r.logo.src = CLUBS[B.club].logo;
  els.l.root.style.setProperty('--c1', CLUBS[A.club].a);
  els.r.root.style.setProperty('--c1', CLUBS[B.club].a);
  $('#s-fight').style.setProperty('--c1', CLUBS[A.club].a);

  $('.hud-side-l').style.setProperty('--c1', CLUBS[A.club].a);
  $('.hud-side-l').style.setProperty('--c2', CLUBS[A.club].b);
  $('.hud-side-r').style.setProperty('--c1', CLUBS[B.club].a);
  $('.hud-side-r').style.setProperty('--c2', CLUBS[B.club].b);

  $('#pads').classList.toggle('solo', !MATCH.twoPlayer);
  $$('.pad-l .b-spec .sname').forEach(e => { e.textContent = A.special.name; e.dataset.spec = A.special.name; e.dataset.ultra = A.ultimate.name; });
  $$('.pad-r .b-spec .sname').forEach(e => { e.textContent = B.special.name; e.dataset.spec = B.special.name; e.dataset.ultra = B.ultimate.name; });
  buildEmoteTrays();
  if (!MATCH.twoPlayer) {
    G.ai = { cd: 400, blockUntil: 0, think: 0, diff: DIFFS[SAVE.diff] };
    $('#cpuStrip').classList.add('on');
    $('#cpuStrip').innerHTML = `<b>${B.name}</b><span>${CLUBS[B.club].name} · KI: ${DIFFS[SAVE.diff].name}</span>
      <em class="cpu-mood" id="cpuMood">wartet auf den Gong…</em>`;
  } else { G.ai = null; $('#cpuStrip').classList.remove('on'); }

  playIntro(() => { go('fight'); requestAnimationFrame(() => resizeFx()); startRound(true); });
}

function startRound(first) {
  const L = G.fighters.l, R = G.fighters.r;
  [L, R].forEach(f => {
    f.hp = f.maxHp; f.ghostHp = f.maxHp; f.stam = f.maxStam;
    f.state = 'idle'; f.blocking = false; f.combo = 0; f.rot = 0;
    f.lunge = f.recoil = 0; f.koT = 0; f.hitT = 0; f.stunT = 0; f.rage = false;
    if (first) { f.meter = 0; f.overcharge = 0; f.tookDamage = false; f.wasLow = false; }
    else { f.meter = Math.min(60, f.meter); f.overcharge = Math.min(35, f.overcharge); }
  });
  G.timeLeft = SAVE.roundTime; G.clock = 0; G.timers = []; G.particles = [];
  G.over = false; G.paused = false; G.cine = false; G.slowmo = 0; G.rageOn = false;
  arena.classList.remove('cine', 'ultra');
  $('#rageVin').classList.remove('on');
  $('#roundTag').textContent = 'Runde ' + G.round;
  paintPips();
  G.running = false;

  G.mod = (SAVE.chaos && Math.random() < .85) ? pick(MODS) : null;
  if (G.mod && G.mod.key === 'blitz') { L.meter = 100; R.meter = 100; }

  announce(`RUNDE ${G.round}`, first ? 'Şampiyonlar Ligi' : '');
  Sfx.bell(first ? 3 : 1); Sfx.crowd(.18);
  after(1300, () => { announce('DÖVÜŞ!', ''); Sfx.ui(980, .2); });
  if (G.mod) after(1650, () => modBadgeFlash(G.mod.label));
  after(1900, () => { G.running = true; });
  if (!loopRunning) { loopRunning = true; requestAnimationFrame(loop); }
}

function after(ms, fn) { G.timers.push({ t: ms, fn }); }
function tickTimers(dt) {
  for (let i = G.timers.length - 1; i >= 0; i--) {
    G.timers[i].t -= dt;
    if (G.timers[i].t <= 0) { const f = G.timers[i].fn; G.timers.splice(i, 1); f(); }
  }
}

function paintPips() {
  ['l', 'r'].forEach(s => {
    els[s].pips.innerHTML = [0, 1].map(i => `<i class="${G.fighters[s].rounds > i ? 'won' : ''}"></i>`).join('');
  });
}

/* ---------- Angriffe ---------- */
function tryAttack(f, key) {
  if (!G.running || G.cine || f.state !== 'idle' && f.state !== 'block') return;
  const mv = MOVES[key];
  const free = G.mod && G.mod.key === 'freestam';
  const cost = free ? 0 : mv.stam * (f.def.ab.endless ? .68 : 1);
  if (!free && f.stam < cost) { noStamina(f); return; }
  f.stam -= cost;
  f.state = 'attack'; f.move = mv; f.moveKey = key; f.atkT = 0; f.hitDone = false;
  f.blocking = false;
}
function noStamina(f) {
  popText(f, 'AUSDAUER!', 'blocked');
  Sfx.ui(180, .12);
}
function trySpecial(f) {
  if (!G.running || G.cine || f.state === 'ko') return;
  if (f.overcharge >= 100) return fireMove(f, f.def.ultimate, true);
  if (f.meter >= 100) return fireMove(f, f.def.special, false);
}
function fireMove(f, sp, isUltimate) {
  const o = other(f);
  f.meter = 0; f.overcharge = 0; f.state = 'special'; f.blocking = false;
  G.cine = true; arena.classList.add('cine');
  if (isUltimate) { arena.classList.add('ultra'); Sfx.zap(); impactPulse(); }
  G.hitstop = isUltimate ? 320 : 260; shake(isUltimate ? 23 : 16);
  Sfx.roar(); buzz(isUltimate ? [40, 50, 40, 80] : [30, 40, 60]);
  Sfx.crowd(isUltimate ? .5 : .38);
  announce(sp.name, sp.tr, isUltimate ? 'gold' : '');
  for (let i = 0; i < sp.hits; i++) {
    const last = i === sp.hits - 1;
    after(420 + i * sp.gap, () => {
      if (G.over || o.state === 'ko') return;
      const blocked = o.blocking;
      let dmg = sp.dmg * f.powF * o.dfnF * (blocked ? .45 : 1);
      if (o.def.ab.ironBody) dmg *= .82;
      if (f.rage) dmg *= 1.18;
      if (G.mod && G.mod.key === 'double') dmg *= 1.8;
      applyHit(f, o, dmg, {
        special: true, ultimate: isUltimate, blocked, big: true, finisher: last && isUltimate,
        word: last ? (isUltimate ? 'BİTTİ!' : 'ASLAN!') : null
      });
    });
  }
  after(520 + sp.hits * sp.gap + 260, () => {
    G.cine = false; arena.classList.remove('cine'); arena.classList.remove('ultra');
    if (f.state === 'special') f.state = 'idle';
  });
}
const other = f => f.side === 'l' ? G.fighters.r : G.fighters.l;

/* ---------- Trefferauflösung ---------- */
function resolveHit(att) {
  const dfd = other(att), mv = att.move;
  if (dfd.state === 'ko' || att.state === 'ko') return;
  const parry = dfd.blocking && (G.clock - dfd.blockStart) < 230;
  const blocked = dfd.blocking;
  const counter = dfd.state === 'attack' && !dfd.hitDone;

  if (parry) {
    gainMeter(dfd, 15);
    att.state = 'stun'; att.stunT = 520; att.combo = 0;
    popText(dfd, 'KONTER!', 'parry');
    Sfx.block(); Sfx.ui(1200, .12); shake(7); buzz(18);
    sparks(hitPoint(dfd), '#7BE3B4', 16, 1.3); ringFx(hitPoint(dfd), '#7BE3B4');
    G.hitstop = 90;
    return;
  }
  let dmg = mv.dmg * att.powF;
  if (att.def.ab.fullStaminaPower && att.stam > att.maxStam * .85) dmg *= 1.22;
  if (att.def.ab.comboPower) dmg *= 1 + Math.min(.32, att.combo * .08);
  if (counter) dmg *= 1.45;
  if (att.rage) dmg *= 1.18;
  dmg *= dfd.dfnF;
  if (dfd.def.ab.ironBody) dmg *= .82;
  if (dfd.def.ab.lowHpDefense && dfd.hp < dfd.maxHp * .3) dmg *= .75;
  dmg *= rnd(.92, 1.08);
  if (G.mod && G.mod.key === 'double') dmg *= 1.8;

  if (blocked) {
    dmg *= .2;
    dfd.stam -= mv.stam * 1.15;
    if (dfd.stam <= 0) { dfd.stam = 0; guardBreak(dfd); }
  }
  applyHit(att, dfd, dmg, { blocked, counter, word: mv.word, mv });
}

function guardBreak(f) {
  f.blocking = false; f.state = 'stun'; f.stunT = 780;
  popText(f, 'DECKUNG OFFEN!', 'blocked');
  Sfx.ui(140, .3); shake(9);
}

function triggerRage(f) {
  if (f.rage || f.state === 'ko') return;
  f.rage = true; G.rageOn = true;
  $('#rageVin').classList.add('on');
  popText(f, 'ÖFKE MODU!', 'crit');
  Sfx.roar(); buzz([25, 40, 25]);
}

function applyHit(att, dfd, dmg, o = {}) {
  dmg = Math.max(1, dmg);
  dfd.hp = Math.max(0, dfd.hp - dmg);
  att.dmgDealt += dmg;
  const p = hitPoint(dfd);
  if (dfd.hp < dfd.maxHp * .2) dfd.wasLow = true;
  if (dfd.hp < dfd.maxHp * .25 && dfd.state !== 'ko') triggerRage(dfd);

  if (!o.blocked) {
    dfd.tookDamage = true;
    att.combo = (G.clock - att.lastHit < 1100) ? att.combo + 1 : 1;
    att.lastHit = G.clock;
    att.bestCombo = Math.max(att.bestCombo, att.combo);
    dfd.state = 'hit'; dfd.hitT = 0;
    dfd.hitDur = (o.mv ? o.mv.hitDur : 200) * (o.special ? .6 : 1);
    dfd.recoil = -(o.mv ? o.mv.knock : 10) * dfd.dir * (o.special ? .8 : 1);
    dfd.blocking = false;
    gainMeter(att, dmg * (o.mv ? o.mv.meter : .3));
    gainMeter(dfd, dmg * .55);
    if (o.mv && o.mv.stamHit) dfd.stam = Math.max(0, dfd.stam - o.mv.stamHit);
    flash(dfd);
    sparks(p, o.counter ? '#FFD84A' : o.ultimate ? '#FFD84A' : '#FFFFFF', o.big ? 26 : 14, o.big ? 1.5 : 1);
    if (o.big || o.counter) ringFx(p, o.counter ? '#FFD84A' : CLUBS[att.def.club].b);
    if (o.finisher) { ringFx(p, '#fff'); impactPulse(); }
    G.hitstop = (o.mv ? o.mv.stop : 70) * (o.counter ? 1.5 : 1);
    shake(clamp(dmg * .85, 4, 22));
    Sfx.punch(clamp(dmg / 14, .4, 1.4), false);
    buzz(o.big ? 35 : 14);
    if (o.word) popWord(p, o.counter ? 'KONTER ' + o.word : o.word, o.counter ? 'crit' : 'word');
    popDamage(p, Math.round(dmg), o.counter || o.big);
    if (att.combo >= 3) popText(att, att.combo + ' HIT COMBO', 'parry');
    if (Math.random() < .3) Sfx.crowd(.34);
  } else {
    dfd.state = dfd.state === 'attack' ? 'idle' : dfd.state;
    dfd.recoil = -4 * dfd.dir;
    gainMeter(att, dmg * .4);
    sparks(p, '#8FC7FF', 8, .7);
    popText(dfd, 'BLOCK', 'blocked');
    Sfx.block(); shake(4); G.hitstop = 45;
  }
  if (dfd.hp <= 0) knockout(att, dfd);
  else if (G.mod && G.mod.key === 'sudden' && !o.blocked && !G.over) suddenWin(att);
}

function hitPoint(f) {
  const e = els[f.side];
  const r = (e.rig || e.root).getBoundingClientRect(), a = arena.getBoundingClientRect();
  return { x: r.left - a.left + r.width * (f.side === 'l' ? .78 : .22), y: r.top - a.top + r.height * .40 };
}

function impactPulse() {
  const el = $('#impactFlash');
  el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
}
function modBadgeFlash(text) {
  const el = $('#modBadge');
  el.textContent = text;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

function suddenWin(att) {
  G.over = true; G.running = false;
  Sfx.airhorn(); shake(18);
  announce('ANİ ÖLÜM!', att.def.name + ' trifft zuerst', 'mega');
  after(1400, () => endRound(att, false));
}

function knockout(att, dfd) {
  if (G.over) return;
  G.over = true; G.running = false;
  dfd.state = 'ko'; dfd.koT = 0; dfd.blocking = false;
  att.state = 'idle';
  G.hitstop = 220; G.slowmo = 760; shake(30);
  Sfx.ko(); Sfx.airhorn(); Sfx.crowd(.55); buzz([70, 70, 140]);
  impactPulse();
  dust(hitPoint(dfd));
  after(620, () => announce('K.O.!', att.def.name + ' trifft voll', 'mega'));
  after(2000, () => endRound(att, true));
}

function endRound(winner, byKo) {
  const L = G.fighters.l, R = G.fighters.r;
  G.running = false;
  if (winner) winner.rounds++;
  else { L.rounds++; R.rounds++; }
  paintPips();
  const matchOver = L.rounds >= 2 || R.rounds >= 2 || G.round >= 3;
  if (matchOver) {
    const champ = L.rounds === R.rounds ? (L.hp >= R.hp ? L : R) : (L.rounds > R.rounds ? L : R);
    after(600, () => finishMatch(champ, byKo));
  } else {
    G.round++;
    after(400, () => {
      announce(winner ? winner.def.name : 'UNENTSCHIEDEN', winner ? 'gewinnt die Runde' : '');
      after(1500, () => startRound(false));
    });
  }
}

function timeUp() {
  const L = G.fighters.l, R = G.fighters.r;
  G.running = false;
  Sfx.bell(2);
  announce('ZEIT!', '');
  const w = L.hp === R.hp ? null : (L.hp > R.hp ? L : R);
  after(1400, () => endRound(w, false));
}

/* ---------- Emotes ---------- */
function buildEmoteTrays() {
  ['l', 'r'].forEach(side => {
    const f = side === 'l' ? byId(MATCH.p1) : byId(MATCH.p2);
    const tray = $(`.emote-tray[data-tray="${side}"]`);
    tray.innerHTML = f.emotes.map((t, i) => `<button data-e="${i}"><span>${t}</span></button>`).join('');
    tray.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      tray.classList.remove('open');
      doEmote(G.fighters[side], f.emotes[+b.dataset.e]);
    };
  });
}
function doEmote(f, text) {
  if (!G.running || f.state === 'ko') return;
  if (f.state === 'idle' || f.state === 'block') { f.state = 'taunt'; f.tauntT = 380; f.blocking = false; }
  f.meter = Math.min(100, f.meter + 7);
  bubble(f, text); Sfx.ui(760, .1);
}
function bubble(f, text) {
  const r = els[f.side].root.getBoundingClientRect(), a = arena.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'bubble';
  el.style.left = clamp(r.left - a.left + r.width / 2, 70, a.width - 70) + 'px';
  el.style.top = (r.top - a.top + 6) + 'px';
  el.textContent = text;
  $('#pops').appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

/* ---------- Anzeige-Effekte ---------- */
function announce(big, small, cls) {
  const el = $('#announce');
  el.className = 'announce' + (cls ? ' ' + cls : '');
  el.innerHTML = big + (small ? `<small>${small}</small>` : '');
  void el.offsetWidth; el.classList.add('show');
}
function popWord(p, text, cls) {
  const el = document.createElement('div');
  el.className = 'pop ' + cls; el.textContent = text;
  el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
  $('#pops').appendChild(el);
  setTimeout(() => el.remove(), 800);
}
function popDamage(p, n, big) {
  const el = document.createElement('div');
  el.className = 'pop ' + (big ? 'crit' : 'dmg'); el.textContent = '-' + n;
  el.style.left = (p.x + rnd(-18, 18)) + 'px'; el.style.top = (p.y - 26) + 'px';
  $('#pops').appendChild(el);
  setTimeout(() => el.remove(), 800);
}
function popText(f, text, cls) {
  const r = els[f.side].root.getBoundingClientRect(), a = arena.getBoundingClientRect();
  popWord({ x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height * .22 }, text, cls);
}
function flash(f) {
  const el = els[f.side].root;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 90);
}
function shake(v) { G.shake = Math.max(G.shake, v); }

/* ---------- Partikel ---------- */
function resizeFx() {
  const r = arena.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  fxc.width = r.width * d; fxc.height = r.height * d;
  ctx2.setTransform(d, 0, 0, d, 0, 0);
  layoutRig('l'); layoutRig('r');
  placeShadows();
}
function placeShadows() {
  const a = arena.getBoundingClientRect();
  ['l', 'r'].forEach(side => {
    const e = els[side];
    const box = (e.rig || e.root).getBoundingClientRect();
    if (!box.width) return;
    e.sh.style.left = ((box.left - a.left + box.width / 2) / a.width * 100) + '%';
    e.sh.style.width = (box.width * .8) + 'px';
  });
}
addEventListener('resize', () => { if (screen === 'fight') resizeFx(); });
addEventListener('orientationchange', () => { if (screen === 'fight') setTimeout(resizeFx, 200); });

function sparks(p, color, n, power) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(1.5, 7) * power;
    G.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rnd(240, 520), max: 520, c: color, r: rnd(1.5, 3.6) * power, g: .06, type: 'spark' });
  }
}
function ringFx(p, color) {
  G.particles.push({ x: p.x, y: p.y, r: 6, life: 300, max: 300, c: color, type: 'ring' });
}
function dust(p) {
  for (let i = 0; i < 26; i++) {
    const a = rnd(-Math.PI, 0);
    G.particles.push({
      x: p.x + rnd(-30, 30), y: p.y + rnd(30, 70), vx: Math.cos(a) * rnd(1, 5),
      vy: Math.sin(a) * rnd(.5, 2.5), life: rnd(500, 900), max: 900, c: '#6B617C', r: rnd(3, 9), g: .01, type: 'spark'
    });
  }
}
function drawFx(dt) {
  ctx2.clearRect(0, 0, fxc.width, fxc.height);
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.life -= dt;
    if (p.life <= 0) { G.particles.splice(i, 1); continue; }
    const k = p.life / p.max;
    if (p.type === 'ring') {
      p.r += dt * .28;
      ctx2.globalAlpha = k * .8; ctx2.strokeStyle = p.c; ctx2.lineWidth = 3 * k + .5;
      ctx2.beginPath(); ctx2.arc(p.x, p.y, p.r, 0, 7); ctx2.stroke();
    } else {
      p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += p.g * dt / 16 * 3;
      ctx2.globalAlpha = k; ctx2.fillStyle = p.c;
      ctx2.beginPath(); ctx2.arc(p.x, p.y, p.r * k, 0, 7); ctx2.fill();
    }
  }
  ctx2.globalAlpha = 1;
}

/* ==========================================================
   HAUPTSCHLEIFE
   ========================================================== */
let loopRunning = false, lastT = 0;
function loop(now) {
  const raw = Math.min(50, now - lastT || 16); lastT = now;
  if (screen !== 'fight') { loopRunning = false; return; }
  let dt = raw;
  if (G.paused) dt = 0;
  if (G.hitstop > 0) { G.hitstop -= raw; dt = 0; }
  if (G.slowmo > 0) G.slowmo -= raw;

  if (dt > 0) {
    G.clock += dt;
    tickTimers(dt);
    updateFighter(G.fighters.l, dt);
    updateFighter(G.fighters.r, dt);
    if (G.running && !G.cine) {
      G.timeLeft -= dt / 1000;
      if (G.timeLeft <= 0) { G.timeLeft = 0; timeUp(); }
      if (G.ai) updateAI(dt);
    }
    G.fighters.l.ghostHp += (G.fighters.l.hp - G.fighters.l.ghostHp) * Math.min(1, dt / 260);
    G.fighters.r.ghostHp += (G.fighters.r.hp - G.fighters.r.ghostHp) * Math.min(1, dt / 260);
  }
  G.shake *= Math.pow(.86, raw / 16);
  if (G.shake < .3) G.shake = 0;
  drawFx(raw);
  render();
  requestAnimationFrame(loop);
}

function updateFighter(f, dt) {
  const free = G.mod && G.mod.key === 'freestam';
  const regen = (f.def.ab.fastRegen ? 22 : 14) * (f.state === 'idle' ? 1 : .45);
  if (f.state !== 'ko') {
    if (free) f.stam = Math.min(f.maxStam, f.stam + regen * dt / 1000);
    else if (f.blocking) f.stam = Math.max(0, f.stam - 16 * dt / 1000);
    else f.stam = Math.min(f.maxStam, f.stam + regen * dt / 1000);
  }
  if (f.def.ab.meterOverTime && G.running) gainMeter(f, 2.4 * dt / 1000);

  switch (f.state) {
    case 'attack': {
      f.atkT += dt;
      const mv = f.move, up = mv.startup * f.spdF, rec = mv.recover * f.spdF;
      if (!f.hitDone && f.atkT >= up) { f.hitDone = true; resolveHit(f); }
      f.lunge = f.atkT < up ? (f.atkT / up) * 30 : Math.max(0, 30 * (1 - (f.atkT - up) / rec));
      if (f.atkT >= up + rec) { f.state = 'idle'; f.lunge = 0; f.move = null; }
      break;
    }
    case 'hit':
      f.hitT += dt;
      if (f.hitT >= f.hitDur) { f.state = 'idle'; }
      break;
    case 'stun':
      f.stunT -= dt;
      if (f.stunT <= 0) f.state = 'idle';
      break;
    case 'taunt':
      f.tauntT -= dt;
      if (f.tauntT <= 0) f.state = 'idle';
      break;
    case 'ko':
      f.koT += dt * (G.slowmo > 0 ? .3 : 1);
      break;
  }
  f.recoil *= Math.pow(.88, dt / 16);
  f.bob += dt;
}

/* ---------- KI ---------- */
function updateAI(dt) {
  const me = G.fighters.r, foe = G.fighters.l, d = G.ai.diff;
  if (me.state === 'ko' || G.cine) return;
  G.ai.think -= dt; G.ai.cd -= dt;

  // Bedrohung erkennen
  const incoming = foe.state === 'attack' && !foe.hitDone;
  if (incoming && G.ai.think <= 0) {
    G.ai.think = d.react;
    if (Math.random() < d.blockP && me.state === 'idle' && me.stam > 18) {
      me.blocking = true; me.blockStart = G.clock;
      G.ai.blockUntil = G.clock + rnd(d.hold[0], d.hold[1]);
    }
  }
  if (me.blocking && G.clock > G.ai.blockUntil) me.blocking = false;
  if (me.stam < 12) me.blocking = false;

  if (me.state !== 'idle' || me.blocking) return;
  if (G.ai.cd > 0) return;

  if (me.meter >= 100 && Math.random() < d.specP) { trySpecial(me); G.ai.cd = 1400; return; }

  const hpRatio = me.hp / me.maxHp;
  const r = Math.random();
  let key = 'jab';
  if (r < d.hookP && me.stam > 30) key = 'hook';
  else if (r < d.hookP + .3 && me.stam > 20) key = 'body';
  if (me.stam < 16) { G.ai.cd = 420; return; }
  tryAttack(me, key);
  G.ai.cd = rnd(d.gap[0], d.gap[1]) * (hpRatio < .3 ? .8 : 1);

  const mood = $('#cpuMood');
  if (mood && Math.random() < .12) {
    mood.textContent = hpRatio < .25 ? 'wankt, gibt aber nicht auf…'
      : me.stam < me.maxStam * .3 ? 'schnauft schwer'
        : foe.hp < 35 ? 'riecht den K.O.'
          : pick(['sucht die Lücke', 'geht nach vorn', 'boxt aus der Deckung', 'tanzt kurz']);
  }
  if (Math.random() < .035 && foe.hp < me.hp - 25) doEmote(me, pick(me.def.emotes));
}

/* ---------- Zeichnen ---------- */
function render() {
  const sway = Math.sin(G.clock / 2600) * .5;
  const rx = sway * .4 + (G.shake ? rnd(-1, 1) * G.shake * .36 : 0);
  const ry = sway + (G.shake ? rnd(-1, 1) * G.shake * .4 : 0);
  const tz = G.shake ? rnd(-1, .2) * G.shake * 1.1 : 0;
  camEl.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(${tz.toFixed(1)}px)`;

  ['l', 'r'].forEach(side => {
    const f = G.fighters[side], e = els[side];
    let x = f.dir * (f.lunge + f.recoil * -1);
    let z = 230 + f.lunge * .5;
    let y = 0, rotZ = 0, rotX = 0, scy = 1, scx = 1;

    if (f.state === 'ko') {
      const k = Math.min(1, f.koT / 700), e2 = 1 - Math.pow(1 - k, 3);
      rotX = -80 * e2; rotZ = 7 * f.dir * e2; y = 24 * e2; x += 15 * f.dir * e2; z -= 16 * e2;
    } else if (f.state === 'hit') {
      const k = 1 - f.hitT / f.hitDur;
      rotZ = -7 * f.dir * k; x += -10 * f.dir * k; z -= 8 * k;
    } else if (f.state === 'stun') {
      rotZ = Math.sin(G.clock / 60) * 5; y = 3;
    } else if (f.blocking) {
      scy = .95; y = 5; x -= 4 * f.dir;
    } else if (f.state === 'attack') {
      const mv = f.move, up = mv.startup * f.spdF;
      const t = clamp(f.atkT / up, 0, 1);
      rotZ = 5 * f.dir * t; scx = 1 + .03 * t;
    } else if (f.state === 'taunt') {
      y = -6 * Math.abs(Math.sin(G.clock / 90));
    } else {
      y = Math.sin(f.bob / 400) * 4;
      scy = 1 + Math.sin(f.bob / 400) * .012;
    }
    e.root.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scx},${scy})`;
    e.root.classList.toggle('guard', f.blocking && f.state !== 'ko');
    e.root.classList.toggle('charged', f.meter >= 100 && f.state !== 'ko');
    poseFighter(f);
    e.sh.style.transform = `translateX(-50%) translateX(${x * .5}px) scaleX(${f.state === 'ko' ? 1.5 : 1})`;
    e.sh.style.opacity = f.state === 'ko' ? .5 : .85;

    e.hp.style.transform = `scaleX(${clamp(f.hp / f.maxHp, 0, 1)})`;
    e.ghost.style.transform = `scaleX(${clamp(f.ghostHp / f.maxHp, 0, 1)})`;
    e.st.style.transform = `scaleX(${clamp(f.stam / f.maxStam, 0, 1)})`;
    e.st.parentElement.classList.toggle('tired', f.stam < f.maxStam * .3);
    e.mt.style.transform = `scaleX(${clamp(f.meter / 100, 0, 1)})`;
    e.mtw.classList.toggle('full', f.meter >= 100);
  });

  const c = $('#clock'); const t = Math.ceil(G.timeLeft);
  if (c.textContent !== String(t)) c.textContent = t;
  c.classList.toggle('low', t <= 10);

  ['l', 'r'].forEach(side => {
    const f = G.fighters[side];
    const ultra = f.overcharge >= 100;
    $$(`.pad-${side} .b-spec`).forEach(b => {
      b.classList.toggle('ready', f.meter >= 100 && !ultra);
      b.classList.toggle('ultra', ultra);
      const sn = b.querySelector('.sname');
      if (sn) {
        if (!sn.dataset.spec) { sn.dataset.spec = f.def.special.name; sn.dataset.ultra = f.def.ultimate.name; }
        const want = ultra ? sn.dataset.ultra : sn.dataset.spec;
        if (sn.textContent !== want) sn.textContent = want;
      }
      const ovc = b.querySelector('.ovc');
      if (ovc) ovc.style.width = (f.meter >= 100 ? f.overcharge : 0) + '%';
    });
  });
}

/* ---------- Eingabe ---------- */
function bindPad(pad) {
  const side = pad.dataset.side;
  pad.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    e.preventDefault();
    Sfx.resume();
    const f = G.fighters[side]; if (!f) return;
    const act = b.dataset.act;
    if (act === 'block') {
      if (f.state === 'idle' && f.stam > 4 && G.running) {
        f.blocking = true; f.blockStart = G.clock; b.classList.add('held'); pad._bpid = e.pointerId;
      }
    } else if (act === 'special') { trySpecial(f); }
    else if (act === 'emote') {
      const tray = $(`.emote-tray[data-tray="${side}"]`);
      tray.classList.toggle('open');
    } else { tryAttack(f, act); }
  }, { passive: false });

  const release = e => {
    const f = G.fighters[side]; if (!f) return;
    if (e && e.pointerId !== undefined && pad._bpid !== undefined && e.pointerId !== pad._bpid) return;
    pad._bpid = undefined;
    f.blocking = false;
    $$('.b-block', pad).forEach(b => b.classList.remove('held'));
  };
  pad.addEventListener('pointerup', release);
  pad.addEventListener('pointercancel', release);
  pad.addEventListener('pointerleave', release);
}
$$('.pad').forEach(bindPad);

// Tastatur für den Desktop-Test
addEventListener('keydown', e => {
  if (screen !== 'fight' || e.repeat) return;
  const L = G.fighters.l, R = G.fighters.r;
  const m = { a: () => tryAttack(L, 'jab'), s: () => tryAttack(L, 'hook'), d: () => tryAttack(L, 'body'), f: () => trySpecial(L) };
  if (m[e.key]) m[e.key]();
  if (e.key === ' ') { L.blocking = true; L.blockStart = G.clock; e.preventDefault(); }
  if (MATCH.twoPlayer) {
    const n = { j: () => tryAttack(R, 'jab'), k: () => tryAttack(R, 'hook'), l: () => tryAttack(R, 'body'), ö: () => trySpecial(R) };
    if (n[e.key]) n[e.key]();
    if (e.key === 'Enter') { R.blocking = true; R.blockStart = G.clock; }
  }
});
addEventListener('keyup', e => {
  if (screen !== 'fight') return;
  if (e.key === ' ') G.fighters.l.blocking = false;
  if (e.key === 'Enter') G.fighters.r.blocking = false;
});

arena.addEventListener('pointerdown', () => $$('.emote-tray').forEach(t => t.classList.remove('open')));
$('#pauseBtn').addEventListener('click', () => { G.paused = true; $('#pauseOv').classList.add('open'); });
$('#resumeBtn').addEventListener('click', () => { G.paused = false; $('#pauseOv').classList.remove('open'); });
$('#quitBtn').addEventListener('click', () => {
  G.paused = false; G.running = false; loopRunning = false;
  $('#pauseOv').classList.remove('open'); Sfx.crowd(0); renderHome(); go('home');
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'fight' && G.running) {
    G.paused = true; $('#pauseOv').classList.add('open');
  }
});

/* ==========================================================
   ERGEBNIS & POKAL
   ========================================================== */
const CUP = `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#FFF0BF"/><stop offset=".45" stop-color="#F4B840"/>
<stop offset="1" stop-color="#9A6A0C"/></linearGradient></defs>
<g fill="url(#g)">
<path d="M56 18h88c4 0 7 3 7 7v42c0 30-23 54-51 54S49 97 49 67V25c0-4 3-7 7-7z"/>
<path d="M44 30c-18 2-30 14-30 30 0 20 16 34 36 36l-4-16c-11-2-18-10-18-20 0-8 6-13 16-14z"/>
<path d="M156 30c18 2 30 14 30 30 0 20-16 34-36 36l4-16c11-2 18-10 18-20 0-8-6-13-16-14z"/>
<rect x="88" y="118" width="24" height="30" rx="3"/>
<path d="M62 150h76c3 0 5 2 5 5l-4 18H61l-4-18c0-3 2-5 5-5z"/>
<rect x="46" y="178" width="108" height="20" rx="4"/>
<rect x="34" y="198" width="132" height="16" rx="4"/>
</g>
<g fill="#0B0A0F" opacity=".22"><circle cx="100" cy="58" r="26"/></g>
<text x="100" y="66" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="24" fill="#FFF0BF">1905</text>
</svg>`;

function trophy3D(layers = 18, depth = 1.35) {
  let inner = '';
  for (let i = 0; i < layers; i++) {
    const z = (i - (layers - 1) / 2) * depth;
    const shade = .68 + (i / (layers - 1)) * .42;
    inner += `<div class="face" style="transform:translateZ(${z.toFixed(2)}px);filter:brightness(${shade.toFixed(2)})">${CUP}</div>`;
  }
  return `<div class="trophy3d-wrap"><div class="trophy3d-tilt"><div class="trophy3d" style="animation-delay:-${rnd(0, 4.6).toFixed(2)}s">${inner}</div></div></div>`;
}

function finishMatch(champ, byKo) {
  const loser = other(champ);
  const isPlayerSide = champ.side === 'l';
  SAVE.fights++;
  SAVE.bestCombo = Math.max(SAVE.bestCombo, G.fighters.l.bestCombo, G.fighters.r.bestCombo);
  if (byKo) SAVE.kos++;
  SAVE.wins[champ.def.id] = (SAVE.wins[champ.def.id] || 0) + 1;

  const tournament = MATCH.mode === 'tournament';
  const finalStage = tournament && MATCH.stage === 1;
  const advancing = tournament && isPlayerSide && MATCH.stage === 0;
  const trophy = (!tournament) || finalStage && isPlayerSide;
  const flawless = !champ.tookDamage;
  const comeback = !flawless && champ.wasLow;

  if (tournament && finalStage && isPlayerSide) {
    SAVE.trophies[champ.def.id] = (SAVE.trophies[champ.def.id] || 0) + 1;
  }
  persist();

  const sec = $('#s-result'); setClubVars(sec, champ.def.club);
  $('#resFighter img').src = champ.def.sprite;
  $('#resCrown').innerHTML = (!tournament || finalStage) ? trophy3D() : '';
  $('#resKicker').textContent = tournament
    ? (finalStage ? (isPlayerSide ? 'Şampiyon · Pokalsieger' : 'Turnier beendet') : (isPlayerSide ? 'Halbfinale gewonnen' : 'Ausgeschieden'))
    : 'Sieger';
  $('#resName').textContent = champ.def.name;
  const badge = $('#resBadge');
  if (flawless) { badge.innerHTML = '<span>MÜKEMMEL ZAFER · FLAWLESS</span>'; badge.classList.add('on'); }
  else if (comeback) { badge.innerHTML = '<span>BÜYÜK DÖNÜŞ · COMEBACK</span>'; badge.classList.add('on'); }
  else { badge.classList.remove('on'); badge.innerHTML = ''; }
  $('#resLine').textContent = byKo
    ? `K.O. gegen ${loser.def.name} in Runde ${G.round}`
    : `${champ.rounds}:${loser.rounds} nach Punkten gegen ${loser.def.name}`;
  $('#resStats').innerHTML = `
    <div><b>${Math.round(champ.dmgDealt)}</b><span>Schaden</span></div>
    <div><b>${champ.bestCombo}</b><span>Bester Combo</span></div>
    <div><b>${Math.round(champ.hp)}%</b><span>Rest-Leben</span></div>`;
  $('#resNext').textContent = advancing ? 'Ab ins Finale' : 'Nochmal';
  $('#resNext').dataset.act = advancing ? 'next' : 'again';

  go('result');
  Sfx.crowd(.42); Sfx.bell(3);
  if (trophy || advancing) confettiBurst(CLUBS[champ.def.club], trophy && tournament);
  loopRunning = false;
}

$('#resNext').addEventListener('click', () => {
  Sfx.ui(880);
  if ($('#resNext').dataset.act === 'next') {
    MATCH.stage = 1; MATCH.p2 = MATCH.bracket[1];
    beginFight();
  } else if (MATCH.mode === 'tournament') {
    MATCH.stage = 0; MATCH.p2 = MATCH.bracket[0]; beginFight();
  } else beginFight();
});
$('#resHome').addEventListener('click', () => { Sfx.ui(420); Sfx.crowd(0); renderHome(); go('home'); });

/* ---------- Konfetti ---------- */
const cfc = $('#confetti'), cctx = cfc.getContext('2d');
let cfParts = [], cfRun = false;
function confettiBurst(club, big) {
  const r = cfc.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  cfc.width = r.width * d; cfc.height = r.height * d; cctx.setTransform(d, 0, 0, d, 0, 0);
  cfParts = [];
  const cols = [club.a, club.b, '#FFFFFF', '#F4B840'];
  const n = big ? 260 : 140;
  for (let i = 0; i < n; i++) {
    cfParts.push({
      x: rnd(0, r.width), y: rnd(-r.height, 0), w: rnd(4, 9), h: rnd(7, 15),
      vy: rnd(1.2, big ? 4.6 : 3.6), vx: rnd(-.7, .7), rot: rnd(0, 6), vr: rnd(-.12, .12), c: pick(cols)
    });
  }
  if (big) {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        for (let k = 0; k < 40; k++) {
          const a = rnd(0, Math.PI * 2), sp = rnd(2, 7);
          cfParts.push({
            x: r.width * (.2 + i * .3), y: r.height * .3, w: 6, h: 10,
            vy: Math.sin(a) * sp, vx: Math.cos(a) * sp, rot: rnd(0, 6), vr: rnd(-.2, .2), c: pick(cols)
          });
        }
      }, i * 260);
    }
  }
  if (!cfRun) { cfRun = true; requestAnimationFrame(cfLoop); }
  function cfLoop() {
    if (screen !== 'result') { cfRun = false; cctx.clearRect(0, 0, cfc.width, cfc.height); return; }
    cctx.clearRect(0, 0, cfc.width, cfc.height);
    cfParts.forEach(p => {
      p.y += p.vy; p.x += p.vx + Math.sin(p.y / 40) * .6; p.rot += p.vr; p.vy += .01;
      if (p.y > r.height + 20) { p.y = -20; p.x = rnd(0, r.width); }
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.fillStyle = p.c; cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cctx.restore();
    });
    requestAnimationFrame(cfLoop);
  }
}

/* ==========================================================
   START
   ========================================================== */
renderHome();
Sfx.toggle(!!SAVE.sound);
document.addEventListener('pointerdown', () => Sfx.resume(), { once: true });

// Bilder früh laden, damit im Ring nichts ruckelt
FIGHTERS.forEach(f => { [f.sprite, f.head].forEach(s => { const i = new Image(); i.src = s; }); });
Object.values(CLUBS).forEach(c => { const i = new Image(); i.src = c.logo; });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { }));
}
