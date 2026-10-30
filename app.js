/* =========================================================
   PaoloOS 13 — app.js
   HTML + CSS3 + JavaScript puro. Sem dependências.
   ========================================================= */
'use strict';

/* ---------------------------------------------------------
   0. CONFIGURAÇÃO
   --------------------------------------------------------- */
const CONFIG = {
  nome: 'Paolo',
  idade: 13,
  nascimento: '2013-10-30T00:00:00',
  de: 'Iván',
  site: 'https://paoloos.consuliam.com',
  mensagem:
`Paolo,

13 anos! Oficialmente adolescente — e já com currículo de engenheiro: montou um videogame com ESP32, sem solda, que simula a Apollo 11 inteira, até os 195 h 18 min de missão.

Este PaoloOS é um presente feito em código, do jeito que você gosta: foguetes, Lua, Marte, carros, pixel art e um monte de segredos escondidos. (Dica: explore o terminal… e o direcional do ESPBoy guarda um código clássico ⬆⬆⬇⬇.)

Continue criando, desmontando, consertando e inventando. O mundo precisa de gente que transforma ideia em coisa que funciona.

Feliz aniversário, comandante!`,
};

/* ---------------------------------------------------------
   1. UTILITÁRIOS
   --------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (n, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function cssVar(name) { return getComputedStyle(document.body).getPropertyValue(name).trim(); }

/* Armazenamento local */
const store = {
  get(k, def) { try { const v = localStorage.getItem('paoloos:' + k); return v === null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('paoloos:' + k, JSON.stringify(v)); } catch { /* sem storage */ } },
};

/* ---------------------------------------------------------
   2. SOM (Web Audio, gerado por código — sem arquivos)
   --------------------------------------------------------- */
function silentWav(n = 4000) {
  const buf = new Uint8Array(44 + n); const v = new DataView(buf.buffer);
  const str = (o, t) => [...t].forEach((c, i) => { buf[o + i] = c.charCodeAt(0); });
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true); buf.fill(128, 44);
  let bin = ''; buf.forEach(x => { bin += String.fromCharCode(x); });
  return 'data:audio/wav;base64,' + btoa(bin);
}
const Sound = {
  ctx: null,
  on: store.get('sound', true),
  unlocked: false,
  init() {
    if (!this.ctx) {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* ok */ }
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.on = false; return; }
    }
    if (this.ctx.state !== 'running') { try { this.ctx.resume(); } catch { /* ok */ } }
  },
  /* Precisa rodar dentro de um toque: libera o áudio no iOS/Android, inclusive com a chave de silêncio do iPhone */
  unlock() {
    this.init(); if (!this.ctx || this.unlocked) return;
    try {
      const b = this.ctx.createBuffer(1, 1, 22050); const s = this.ctx.createBufferSource();
      s.buffer = b; s.connect(this.ctx.destination); s.start(0);
      if (!navigator.audioSession) {
        const a = document.createElement('audio');
        a.setAttribute('x-webkit-airplay', 'deny'); a.preload = 'auto'; a.loop = true; a.volume = 0.01;
        a.src = silentWav();
        const p = a.play(); if (p && p.catch) p.catch(() => {});
      }
      this.unlocked = true;
    } catch { /* ok */ }
  },
  beep(freq = 660, dur = 0.08, type = 'square', vol = 0.06, when = 0) {
    if (!this.on) return; this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  click() { this.beep(880, 0.04, 'square', 0.03); },
  chime() { [784, 988, 1319].forEach((f, i) => this.beep(f, 0.18, 'triangle', 0.07, i * 0.09)); },
  error() { this.beep(160, 0.2, 'sawtooth', 0.06); },
  /* Melodia de "Parabéns pra você" (domínio público) */
  birthday() {
    const N = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784 };
    const song = [['G4',.75],['G4',.25],['A4',1],['G4',1],['C5',1],['B4',2],['G4',.75],['G4',.25],['A4',1],['G4',1],['D5',1],['C5',2],
      ['G4',.75],['G4',.25],['G5',1],['E5',1],['C5',1],['B4',1],['A4',2],['F5',.75],['F5',.25],['E5',1],['C5',1],['D5',1],['C5',2.5]];
    let t = 0; const beat = 0.42;
    song.forEach(([n, d]) => { this.beep(N[n], d * beat * 0.95, 'triangle', 0.09, t); this.beep(N[n] / 2, d * beat * 0.9, 'sine', 0.04, t); t += d * beat; });
    return t;
  },
};
['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => addEventListener(ev, () => Sound.unlock(), { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && Sound.ctx) Sound.init(); });

/* ---------------------------------------------------------
   3. TOASTS, CONFETE E CONQUISTAS
   --------------------------------------------------------- */
function toast(title, sub = '', ico = '🛰️') {
  const t = h(`<div class="toast"><span class="t-ico">${ico}</span><div><strong>${esc(title)}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`);
  const box = $('#toasts'); while (box.children.length >= 4) box.firstElementChild.remove();
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3600);
}

const Confetti = (() => {
  const cv = $('#confetti'); const ctx = cv.getContext('2d'); let parts = []; let raf = 0;
  function resize() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  addEventListener('resize', resize); resize();
  function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += 0.12 * devicePixelRatio; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    });
    parts = parts.filter(p => p.y < cv.height + 40);
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  return function burst(n = 160) {
    const cols = ['#38E1FF', '#FF8A3D', '#3DFFA2', '#FF4D6D', '#FFD60A', '#FFFFFF', '#D4AF37', '#FF2E97'];
    const d = devicePixelRatio;
    for (let i = 0; i < n; i++) {
      parts.push({ x: cv.width / 2 + rand(-80, 80) * d, y: cv.height * 0.55, vx: rand(-9, 9) * d, vy: rand(-16, -6) * d,
        r: rand(0, 6), vr: rand(-0.3, 0.3), s: rand(6, 12) * d, c: cols[i % cols.length] });
    }
    if (!raf) loop();
  };
})();

const ACHIEVEMENTS = {
  ignicao:   { ico: '🔥', name: 'Ignição', desc: 'Iniciou o PaoloOS 13.' },
  karman:    { ico: '🌌', name: 'Linha de Kármán', desc: 'Passou dos 100 km de altitude.' },
  iss:       { ico: '🛰️', name: 'Vizinho da ISS', desc: 'Chegou aos 400 km.' },
  geo:       { ico: '📡', name: 'Geoestacionário', desc: 'Passou dos 35.786 km.' },
  lua:       { ico: '🌕', name: 'Tranquility Base', desc: 'Levou um foguete até a Lua.' },
  rover1k:   { ico: '🔴', name: 'Explorador de Marte', desc: 'Andou 1.000 m com o rover.' },
  geologo:   { ico: '💎', name: 'Geólogo', desc: 'Coletou 10 amostras numa corrida.' },
  quarto:    { ico: '🏁', name: 'Quarto de milha', desc: 'Fez os 402 m em menos de 9,3 s.' },
  venceu:    { ico: '🏆', name: 'Ganhou do Iván', desc: 'Venceu o carro do Iván no drag race.' },
  troca:     { ico: '⚙️', name: 'Troca perfeita', desc: 'Fez todas as trocas de marcha perfeitas.' },
  espboy:    { ico: '🎮', name: 'ESPBoy online', desc: 'Ligou o ESPBoy virtual.' },
  splash:    { ico: '🪂', name: 'Splashdown', desc: 'Completou a Apollo 11 no ESPBoy.' },
  estilista: { ico: '🎨', name: 'Estilista', desc: 'Testou 4 temas diferentes.' },
  konami:    { ico: '🕹️', name: 'Código secreto', desc: 'Desbloqueou o tema Apollo Gold.' },
  velas:     { ico: '🎂', name: '13 velas', desc: 'Apagou todas as velas do bolo.' },
  sudo:      { ico: '💻', name: 'Root', desc: 'Usou sudo no terminal.' },
  eagle:     { ico: '🦅', name: 'The Eagle has landed', desc: 'Pousou o módulo lunar inteiro.' },
  artista:   { ico: '👾', name: 'Pixel artista', desc: 'Desenhou um sprite com 40+ pixels.' },
  relogio:   { ico: '⏱️', name: 'Cronometrista', desc: 'Viu quantos segundos de vida você tem.' },
  festa:     { ico: '🎉', name: 'Festeiro', desc: 'Apertou o botão de festa.' },
};
const Ach = {
  got: store.get('ach', {}),
  unlock(id) {
    if (this.got[id] || !ACHIEVEMENTS[id]) return;
    this.got[id] = Date.now(); store.set('ach', this.got);
    const a = ACHIEVEMENTS[id];
    toast('Conquista: ' + a.name, a.desc, a.ico); Sound.chime();
    document.dispatchEvent(new CustomEvent('ach'));
  },
  count() { return Object.keys(this.got).length; },
};

/* ---------------------------------------------------------
   4. TEMAS
   --------------------------------------------------------- */
const THEMES = [
  { id: 'mission',   name: 'Mission Control', cols: ['#070B1A', '#38E1FF', '#FF8A3D'] },
  { id: 'espboy',    name: 'ESPBoy Retrô',    cols: ['#0F380F', '#8BAC0F', '#9BBC0F'] },
  { id: 'mars',      name: 'Marte',           cols: ['#1A0905', '#FF6B35', '#F2C57C'] },
  { id: 'garage',    name: 'Garagem GT',      cols: ['#0B0B0D', '#FF2D2D', '#FFD60A'] },
  { id: 'blueprint', name: 'Blueprint Maker', cols: ['#0B3D91', '#FFFFFF', '#FC3D21'] },
  { id: 'synthwave', name: 'Synthwave',       cols: ['#120024', '#FF2E97', '#00F0FF'] },
  { id: 'apollo',    name: 'Apollo Gold 🔒',  cols: ['#000000', '#D4AF37', '#FFFFFF'], secret: true },
];
const Theme = {
  tried: new Set(store.get('themesTried', [])),
  current: store.get('theme', 'mission'),
  set(id) {
    const t = THEMES.find(x => x.id === id); if (!t) return false;
    if (t.secret && !Ach.got.konami) { toast('Tema bloqueado', 'Existe um código secreto…', '🔒'); Sound.error(); return false; }
    this.current = id; document.body.dataset.theme = id; store.set('theme', id);
    $('meta[name="theme-color"]').setAttribute('content', t.cols[0]);
    this.tried.add(id); store.set('themesTried', [...this.tried]);
    if (this.tried.size >= 4) Ach.unlock('estilista');
    document.dispatchEvent(new CustomEvent('theme'));
    return true;
  },
  next() {
    const list = THEMES.filter(t => !t.secret || Ach.got.konami);
    const i = list.findIndex(t => t.id === this.current);
    this.set(list[(i + 1) % list.length].id); Sound.click();
  },
};

/* ---------------------------------------------------------
   5. FUNDO ESTRELADO
   --------------------------------------------------------- */
(function stars() {
  const cv = $('#stars'); const ctx = cv.getContext('2d'); let W, H, st = [], shoot = null;
  function resize() {
    W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio;
    st = Array.from({ length: Math.round((innerWidth * innerHeight) / 5000) }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.3, 1.6) * devicePixelRatio, p: rand(0, 6) }));
  }
  addEventListener('resize', resize); resize();
  let col = '#fff';
  document.addEventListener('theme', () => { col = cssVar('--text') || '#fff'; });
  function loop(t) {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = col;
    st.forEach(s => { ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 + s.p)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); });
    if (!shoot && Math.random() < 0.004) shoot = { x: rand(0, W), y: rand(0, H / 2), vx: rand(8, 14) * devicePixelRatio, vy: rand(3, 6) * devicePixelRatio, life: 1 };
    if (shoot) {
      ctx.globalAlpha = shoot.life; ctx.strokeStyle = col; ctx.lineWidth = 2 * devicePixelRatio;
      ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 8, shoot.y - shoot.vy * 8); ctx.stroke();
      shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.02; if (shoot.life <= 0) shoot = null;
    }
    ctx.globalAlpha = 1; requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ---------------------------------------------------------
   6. MODO (desktop ou celular) E NAVEGAÇÃO
   --------------------------------------------------------- */
const MODE = (() => {
  const pref = store.get('mode', 'auto');
  if (pref === 'desktop' || pref === 'mobile') return pref;
  return matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches ? 'desktop' : 'mobile';
})();
const DESKTOP = MODE === 'desktop';
document.body.classList.add('mode-' + MODE);
function switchMode(m) { store.set('mode', m); location.reload(); }

const buzz = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* sem vibração */ } };

const Nav = {
  stack: [],
  hist: true,
  top() { return this.stack[this.stack.length - 1] || null; },
  layer() { const t = this.top(); return t ? t.el : $('#home'); },
  open(id) {
    const app = APPS[id]; if (!app) return;
    if (app.action) { app.action(); return; }
    const idx = this.stack.findIndex(s => s.id === id);
    if (idx >= 0) { const n = this.stack.length - 1 - idx; if (n > 0) this.back(n); return; }
    Sound.click(); buzz(8);
    const sheet = !!app.sheet;
    const prev = this.top(); const prevName = prev ? (APPS[prev.id].short || APPS[prev.id].name) : 'Início';
    const el = sheet
      ? h(`<section class="sheet-wrap" role="dialog" aria-label="${esc(app.name)}"><div class="backdrop"></div>
          <div class="sheet off"><div class="grab-zone"><div class="grabber"></div>
            <div class="sheet-head"><h1>${app.icon} ${esc(app.name)}</h1><button class="x" aria-label="Fechar">✕</button></div></div>
          <div class="scr-body"></div></div></section>`)
      : h(`<section class="screen off" role="dialog" aria-label="${esc(app.name)}">
          <header class="scr-head"><button class="back" aria-label="Voltar"><b>‹</b><span>${esc(prevName)}</span></button>
            <h1>${esc(app.name)}</h1><span class="head-r">${app.icon}</span></header>
          <div class="scr-body ${app.flush ? 'flush' : ''}"></div></section>`);
    this.layer().classList.add(sheet ? 'behind' : 'under');
    $('#stack').appendChild(el);
    const panel = sheet ? $('.sheet', el) : el;
    const rec = { id, el, panel, sheet, cleanup: null, onKey: null };
    this.stack.push(rec);
    requestAnimationFrame(() => requestAnimationFrame(() => { panel.classList.remove('off'); el.classList.add('show'); }));
    if (sheet) { $('.backdrop', el).onclick = () => this.back(); $('.x', el).onclick = () => this.back(); this.sheetDrag(rec); }
    else $('.back', el).onclick = () => this.back();
    try { history.pushState({ p13: this.stack.length }, ''); } catch { this.hist = false; }
    const api = { onKey: fn => { rec.onKey = fn; }, close: () => this.back(), body: $('.scr-body', el) };
    rec.cleanup = app.render($('.scr-body', el), api) || null;
  },
  back(n = 1) {
    if (!this.stack.length) return;
    n = Math.min(n, this.stack.length);
    if (this.hist) { try { history.go(-n); return; } catch { this.hist = false; } }
    while (n--) this._pop();
  },
  _pop() {
    const r = this.stack.pop(); if (!r) return;
    Sound.beep(520, 0.03, 'square', 0.02);
    if (typeof r.cleanup === 'function') { try { r.cleanup(); } catch (e) { console.warn(e); } }
    r.panel.classList.add('off'); r.el.classList.remove('show');
    r.panel.style.transform = '';
    setTimeout(() => r.el.remove(), 380);
    this.layer().classList.remove('under', 'behind');
    document.dispatchEvent(new CustomEvent('nav'));
  },
  sheetDrag(rec) {
    const zone = $('.grab-zone', rec.el), sh = rec.panel; let y0 = null, dy = 0;
    zone.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; sh.classList.add('dragging'); zone.setPointerCapture(e.pointerId); });
    zone.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 === null) return; y0 = null; sh.classList.remove('dragging'); if (dy > 90) this.back(); else sh.style.transform = ''; };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  },
};
addEventListener('popstate', e => {
  if (DESKTOP) return;
  const depth = (e.state && e.state.p13) || 0;
  while (Nav.stack.length > depth) Nav._pop();
});

/* Janelas (desktop) */
const WM = {
  wins: new Map(), z: 10, top: null, cascade: 0,
  open(id) {
    const app = APPS[id]; if (!app) return;
    $('#start-menu').classList.add('hidden');
    if (app.action) { app.action(); return; }
    if (this.wins.has(id)) { this.focus(id); return; }
    Sound.click();
    const area = $('#windows').getBoundingClientRect();
    const w = Math.min(app.w || 560, area.width - 40), hgt = Math.min(app.h || 600, area.height - 20);
    const off = (this.cascade++ % 6) * 28;
    const x = clamp((area.width - w) / 2 - 60 + off, 10, Math.max(10, area.width - w - 10));
    const y = clamp((area.height - hgt) / 2 - 30 + off, 10, Math.max(10, area.height - hgt - 10));
    const win = h(`<section class="win" role="dialog" aria-label="${esc(app.name)}" style="left:${x}px;top:${y}px;width:${w}px;height:${hgt}px">
      <header class="win-bar"><span>${app.icon}</span><span class="win-title">${esc(app.name)}</span>
        <div class="win-btns"><button class="b-max" title="Maximizar" aria-label="Maximizar">▢</button><button class="b-close" title="Fechar" aria-label="Fechar">✕</button></div>
      </header><div class="win-body ${app.flush ? 'flush' : ''}"></div></section>`);
    $('#windows').appendChild(win);
    const tb = h(`<button class="task-app" title="${esc(app.name)}">${app.icon} <span class="t-name">${esc(app.short || app.name)}</span></button>`);
    $('#task-apps').appendChild(tb);
    const rec = { id, win, tb, cleanup: null, onKey: null };
    this.wins.set(id, rec);
    tb.onclick = () => (this.top === id ? this.close(id) : this.focus(id));
    $('.b-close', win).onclick = () => this.close(id);
    $('.b-max', win).onclick = () => { win.classList.toggle('max'); window.dispatchEvent(new Event('resize')); };
    win.addEventListener('pointerdown', () => this.focus(id));
    this.drag(win);
    this.focus(id);
    const api = { onKey: fn => { rec.onKey = fn; }, close: () => this.close(id) };
    rec.cleanup = app.render($('.win-body', win), api) || null;
  },
  focus(id) {
    const r = this.wins.get(id); if (!r) return;
    r.win.style.zIndex = ++this.z; this.top = id;
    this.wins.forEach(o => o.tb.classList.toggle('active', o.id === id));
  },
  close(id) {
    const r = this.wins.get(id); if (!r) return;
    if (typeof r.cleanup === 'function') { try { r.cleanup(); } catch (e) { console.warn(e); } }
    r.win.classList.add('closing'); r.tb.remove(); this.wins.delete(id);
    setTimeout(() => r.win.remove(), 180);
    if (this.top === id) {
      const rest = [...this.wins.values()].sort((a, b) => b.win.style.zIndex - a.win.style.zIndex);
      this.top = null; if (rest[0]) this.focus(rest[0].id);
    }
  },
  drag(win) {
    const bar = $('.win-bar', win); let sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || win.classList.contains('max')) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop; bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', e => {
      if (!on) return;
      const area = $('#windows').getBoundingClientRect();
      win.style.left = clamp(ox + e.clientX - sx, -win.offsetWidth + 80, area.width - 80) + 'px';
      win.style.top = clamp(oy + e.clientY - sy, 0, area.height - 40) + 'px';
    });
    bar.addEventListener('pointerup', () => { on = false; });
    bar.addEventListener('dblclick', () => { win.classList.toggle('max'); window.dispatchEvent(new Event('resize')); });
  },
};

const UI = {
  open(id) { DESKTOP ? WM.open(id) : Nav.open(id); },
  top() { return DESKTOP ? (WM.top && WM.wins.get(WM.top)) || null : Nav.top(); },
};

/* Teclado */

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPos = 0;
function konamiFeed(key) {
  const k = key.length === 1 ? key.toLowerCase() : key;
  konamiPos = k === KONAMI[konamiPos] ? konamiPos + 1 : (k === KONAMI[0] ? 1 : 0);
  if (konamiPos === KONAMI.length) {
    konamiPos = 0;
    const first = !Ach.got.konami;
    Ach.unlock('konami'); Theme.set('apollo'); Confetti(220);
    toast(first ? 'Tema secreto desbloqueado!' : 'Apollo Gold ativado', 'Apollo Gold — "The Eagle has landed."', '🌕');
  }
}
addEventListener('keydown', e => {
  konamiFeed(e.key);
  const r = UI.top();
  if (r && r.onKey) r.onKey(e, 'down');
  if (e.key !== 'Escape') return;
  if (DESKTOP) $('#start-menu').classList.add('hidden');
  else if (r && !e.defaultPrevented) Nav.back();
});
addEventListener('keyup', e => { const r = UI.top(); if (r && r.onKey) r.onKey(e, 'up'); });

/* Canvas nítido no tamanho do container */
function fitCanvas(cv, hgt) {
  const d = devicePixelRatio || 1; const w = cv.clientWidth || 300; const ht = hgt || cv.clientHeight || 200;
  cv.width = Math.round(w * d); cv.height = Math.round(ht * d); cv.style.height = ht + 'px';
  const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); return { ctx, W: w, H: ht };
}
function holdButton(btn, onDown, onUp) {
  btn.addEventListener('pointerdown', e => { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch { /* ok */ } btn.classList.add('pressed'); buzz(6); onDown(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, () => { btn.classList.remove('pressed'); onUp(); }));
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

/* =========================================================
   7. APPS
   ========================================================= */
const APPS = {};

/* ---------- 7.1 ROCKET LAB ---------- */
const ENGINES = {
  faisca: { name: 'Faísca',  thrust: 600e3,  isp: 290, mass: 900 },
  merlin: { name: 'Merlin',  thrust: 850e3,  isp: 311, mass: 1300 },
  raptor: { name: 'Raptor',  thrust: 2300e3, isp: 350, mass: 1600 },
  f1:     { name: 'F-1',     thrust: 6770e3, isp: 263, mass: 8400 },
};
function buildRocket(cfg) {
  const e = ENGINES[cfg.engine]; const fuelTotal = cfg.fuel * 1000; const n = cfg.stages;
  const stages = [];
  for (let i = 0; i < n; i++) {
    const share = n === 1 ? 1 : (i === 0 ? 0.6 : (n === 2 ? 0.4 : (i === 1 ? 0.28 : 0.12)));
    const fuel = fuelTotal * share;
    const engines = i === 0 ? cfg.engines : Math.max(1, Math.ceil(cfg.engines / (i === 1 ? 3 : 9)));
    stages.push({ fuel, fuel0: fuel, dry: 2500 + fuel * 0.06 + engines * e.mass, engines });
  }
  return { e, stages, payload: cfg.payload * 1000 };
}
function rocketMass(r) { return r.payload + r.stages.reduce((s, st) => s + st.dry + st.fuel, 0); }

APPS.rocket = {
  name: 'Rocket Lab', short: 'Rocket', icon: '🚀', tile: ['#FF8A3D', '#C2185B'], w: 480, h: 720,
  render(body, api) {
    const best = store.get('rocketBest', 0);
    body.innerHTML = `
      <div class="col">
        <div>
          <canvas class="game"></canvas>
          <div class="telemetry">
            <div class="card stat"><b data-t="alt">0</b><span>alt km</span></div>
            <div class="card stat"><b data-t="vel">0</b><span>vel m/s</span></div>
            <div class="card stat"><b data-t="fuel">100%</b><span>comb.</span></div>
            <div class="card stat"><b data-t="time">T+0</b><span>tempo</span></div>
          </div>
        </div>
        <div class="card">
          <div class="kv"><span class="muted">Empuxo/peso (TWR)</span><b data-o="twr"></b></div>
          <div class="kv"><span class="muted">Massa total</span><b data-o="mass"></b></div>
          <div class="kv"><span class="muted">Δv teórico</span><b data-o="dv"></b></div>
          <div class="kv"><span class="muted">Recorde</span><b data-o="best">${fmt(best / 1000)} km</b></div>
        </div>
        <h3 class="h">MONTE SEU FOGUETE</h3>
        <div class="field"><label>Motor</label><div class="seg" data-k="engine">
          ${Object.entries(ENGINES).map(([k, e]) => `<button data-v="${k}">${e.name}</button>`).join('')}</div></div>
        <div class="field"><label>Nº de motores <b data-o="engines"></b></label><input type="range" min="1" max="9" data-k="engines"></div>
        <div class="field"><label>Combustível <b data-o="fuel"></b></label><input type="range" min="20" max="1500" step="10" data-k="fuel"></div>
        <div class="field"><label>Estágios</label><div class="seg" data-k="stages"><button data-v="1">1</button><button data-v="2">2</button><button data-v="3">3</button></div></div>
        <div class="field"><label>Carga útil <b data-o="payload"></b></label><input type="range" min="1" max="60" data-k="payload"></div>
        <p class="muted small">Simulação vertical simplificada (sobe reto, sem entrar em órbita). TWR precisa ser maior que 1 para sair do chão. Dá pra chegar na Lua? 🌕</p>
        <div class="sticky-cta"><button class="btn btn-big wide" data-a="launch">🔥 LANÇAR</button></div>
      </div>`;
    const cfg = Object.assign({ engine: 'merlin', engines: 9, fuel: 400, stages: 2, payload: 10 }, store.get('rocketCfg', {}));
    const o = k => $(`[data-o="${k}"]`, body); const t = k => $(`[data-t="${k}"]`, body);
    function sync() {
      $$('.seg', body).forEach(sg => $$('button', sg).forEach(b => b.classList.toggle('on', String(cfg[sg.dataset.k]) === b.dataset.v)));
      $$('input[data-k]', body).forEach(i => { i.value = cfg[i.dataset.k]; });
      o('engines').textContent = cfg.engines + '×'; o('fuel').textContent = fmt(cfg.fuel) + ' t'; o('payload').textContent = cfg.payload + ' t';
      const r = buildRocket(cfg); const m = rocketMass(r); const twr = (r.e.thrust * cfg.engines) / (m * 9.81);
      let dv = 0, mm = m; r.stages.forEach(st => { dv += r.e.isp * 9.81 * Math.log(mm / (mm - st.fuel)); mm -= st.fuel + st.dry; });
      o('twr').textContent = twr.toFixed(2); o('twr').style.color = twr > 1.15 ? 'var(--ok)' : 'var(--danger)';
      o('mass').textContent = fmt(m / 1000) + ' t'; o('dv').textContent = fmt(dv) + ' m/s';
      store.set('rocketCfg', cfg);
    }
    $$('.seg', body).forEach(sg => sg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || flying) return;
      cfg[sg.dataset.k] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; Sound.click(); sync(); drawIdle();
    }));
    $$('input[data-k]', body).forEach(i => i.addEventListener('input', () => { cfg[i.dataset.k] = +i.value; sync(); drawIdle(); }));

    const cv = $('canvas', body); let ctx, W, H;
    let ready = false;
    const resize = () => { ({ ctx, W, H } = fitCanvas(cv, 250)); if (ready) drawIdle(); };
    resize(); addEventListener('resize', resize);

    let flying = false, raf = 0, sim = null, smoke = [], milestones = {};
    const R = 6371e3, MOON = 384400e3;

    function drawScene(alt, vel, burning, stageIdx, stagesLeft, msg) {
      const k = clamp(alt / 70000, 0, 1);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `rgb(${lerp(40, 0, k)},${lerp(110, 0, k)},${lerp(220, 8, k)})`);
      sky.addColorStop(1, `rgb(${lerp(140, 2, k)},${lerp(200, 4, k)},${lerp(255, 20, k)})`);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // estrelas
      if (k > 0.2) { ctx.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { ctx.globalAlpha = k * (0.3 + (i % 5) / 6); ctx.fillRect((i * 97.3) % W, (i * 53.7 + alt / 4000) % H, 1.5, 1.5); } ctx.globalAlpha = 1; }
      const cx = W / 2, ry = H * 0.62;
      // Terra vista de cima
      if (alt > 20000) {
        const er = (H * 2.2) / (1 + alt / 1.2e6); const ey = ry + 60 + er * 0.98 - Math.min(alt / 400, 0);
        const g = ctx.createRadialGradient(cx - er * .3, ey - er * .3, er * .1, cx, ey, er);
        g.addColorStop(0, '#4FA3FF'); g.addColorStop(.7, '#1E5BB8'); g.addColorStop(1, '#0B2A66');
        ctx.globalAlpha = clamp((alt - 20000) / 60000, 0, 1); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, ey, er, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(120,200,255,.6)'; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
      }
      // Lua se aproximando
      if (alt > 30e6) {
        const p = clamp((alt - 30e6) / (MOON - 30e6), 0, 1); const mr = lerp(6, H * 0.35, p * p);
        ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.arc(cx + 90, lerp(40, ry - mr - 30, p), mr, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.arc(cx + 90 - mr * .3, lerp(40, ry - mr - 30, p) - mr * .2, mr * .2, 0, 7); ctx.fill();
      }
      // chão e torre
      const gy = ry + 52 + alt * 0.6;
      if (gy < H + 10) {
        ctx.fillStyle = '#2F6F3E'; ctx.fillRect(0, gy, W, H - gy);
        ctx.fillStyle = '#555'; ctx.fillRect(cx - 40, gy - 6, 80, 6);
        ctx.fillStyle = '#C0392B'; ctx.fillRect(cx - 34, gy - 120, 6, 114);
        for (let y = gy - 116; y < gy - 8; y += 14) { ctx.fillRect(cx - 34, y, 18, 2); }
      }
      // fumaça
      smoke.forEach(s => { ctx.globalAlpha = s.a; ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      // foguete
      const segH = 34, total = stagesLeft;
      ctx.save(); ctx.translate(cx, ry);
      if (burning) {
        const fl = rand(26, 46);
        const g = ctx.createLinearGradient(0, 50, 0, 50 + fl);
        g.addColorStop(0, '#fff'); g.addColorStop(.3, '#FFD60A'); g.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-9, 50); ctx.lineTo(9, 50); ctx.lineTo(0, 50 + fl); ctx.fill();
      }
      ctx.fillStyle = '#333'; ctx.fillRect(-7, 44, 14, 8);
      for (let i = 0; i < total; i++) {
        const y = 44 - (i + 1) * segH;
        ctx.fillStyle = i % 2 ? '#E8E8E8' : '#FFFFFF'; ctx.fillRect(-12, y, 24, segH);
        ctx.fillStyle = '#111'; ctx.fillRect(-12, y + segH - 3, 24, 3);
        if (i === 0) { ctx.fillStyle = '#FC3D21'; ctx.beginPath(); ctx.moveTo(-12, 44); ctx.lineTo(-24, 52); ctx.lineTo(-12, 26); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, 44); ctx.lineTo(24, 52); ctx.lineTo(12, 26); ctx.fill(); }
      }
      const top = 44 - total * segH;
      ctx.fillStyle = '#0B3D91'; ctx.fillRect(-12, top - 18, 24, 18);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('P13', 0, top - 6);
      ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(-12, top - 18); ctx.lineTo(12, top - 18); ctx.lineTo(0, top - 44); ctx.fill();
      ctx.restore();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(8, 8, 190, 26);
      ctx.fillStyle = '#3DFFA2'; ctx.font = '12px JetBrains Mono, monospace'; ctx.textAlign = 'left';
      ctx.fillText(msg || (alt < 1 ? 'PRONTO PARA LANÇAMENTO' : `ALT ${fmt(alt / 1000, 1)} km`), 16, 26);
    }
    function drawIdle() { if (!flying) drawScene(0, 0, false, 0, cfg.stages, 'PRONTO PARA LANÇAMENTO'); }

    async function launch() {
      if (flying) return;
      const r = buildRocket(cfg); const m0 = rocketMass(r);
      if ((r.e.thrust * cfg.engines) / (m0 * 9.81) <= 1) { Sound.error(); toast('Não vai decolar!', 'O empuxo é menor que o peso. Mais motores ou menos massa.', '⚠️'); return; }
      flying = true; $('[data-a="launch"]', body).disabled = true; milestones = {}; smoke = [];
      for (let i = 10; i > 0; i--) { if (!flying) return; drawScene(0, 0, i <= 3, 0, cfg.stages, `T-${i}`); Sound.beep(i <= 3 ? 880 : 520, 0.1); await new Promise(res => setTimeout(res, i <= 3 ? 600 : 350)); }
      if (!flying) return;
      Sound.beep(1200, 0.4, 'sawtooth', 0.05);
      sim = { r, alt: 0, vel: 0, t: 0, si: 0, maxAlt: 0, done: false };
      let last = performance.now();
      const step = now => {
        if (!flying) return;
        const fdt = Math.min(0.05, (now - last) / 1000); last = now;
        const s = sim; const st = s.r.stages[s.si];
        const burning = st && st.fuel > 0;
        const warp = burning ? clamp(1 + s.t / 8, 1, 12) : clamp(s.alt / 1500, 6, 40000);
        let simLeft = fdt * warp;
        while (simLeft > 0 && !s.done) {
          const cur = s.r.stages[s.si]; const burn = cur && cur.fuel > 0;
          const dt = Math.min(simLeft, burn ? 0.05 : clamp(s.alt / 20000, 0.05, 20)); simLeft -= dt;
          const m = rocketMass(s.r); const g = 9.81 * (R / (R + s.alt)) ** 2;
          const rho = 1.225 * Math.exp(-s.alt / 8500);
          const drag = 0.5 * rho * s.vel * Math.abs(s.vel) * 0.5 * (10 + cfg.engines);
          let thrust = 0;
          if (burn) {
            thrust = s.r.e.thrust * cur.engines * (1 + 0.12 * (1 - rho / 1.225));
            const mdot = (s.r.e.thrust * cur.engines) / (s.r.e.isp * 9.81);
            cur.fuel = Math.max(0, cur.fuel - mdot * dt);
          }
          s.vel += ((thrust - drag) / m - g) * dt; s.alt += s.vel * dt; s.t += dt;
          if (cur && cur.fuel <= 0 && s.si < s.r.stages.length - 1) { s.r.stages.shift(); Sound.beep(300, 0.15, 'square', 0.05); toast('Separação de estágio', 'Estágio vazio descartado.', '💥'); }
          if (s.alt < 0) { s.alt = 0; if (s.t > 5) s.done = 'crash'; else s.vel = Math.max(0, s.vel); }
          s.maxAlt = Math.max(s.maxAlt, s.alt);
          if (s.alt >= MOON) { s.done = 'lua'; }
          else if (!burn && s.vel < 0 && s.t > 5) { s.done = 'apogeu'; }
        }
        [[100e3, 'karman', 'Espaço! Linha de Kármán', '🌌'], [400e3, 'iss', 'Altitude da ISS', '🛰️'], [35786e3, 'geo', 'Órbita geoestacionária', '📡'], [MOON, 'lua', 'CHEGOU NA LUA!', '🌕']]
          .forEach(([a, id, txt, ic]) => { if (s.alt >= a && !milestones[id]) { milestones[id] = 1; toast(txt, `${fmt(a / 1000)} km`, ic); Ach.unlock(id); } });
        if (burning) for (let i = 0; i < 2; i++) smoke.push({ x: W / 2 + rand(-8, 8), y: H * 0.62 + 70, r: rand(6, 14), a: 0.5 });
        smoke.forEach(p => { p.y += 2 + s.vel * 0.002; p.r += 0.5; p.a -= 0.01; }); smoke = smoke.filter(p => p.a > 0);
        const fuelLeft = s.r.stages.reduce((a, b) => a + b.fuel, 0); const fuel0 = s.r.stages.reduce((a, b) => a + b.fuel0, 0) || 1;
        drawScene(s.alt, s.vel, burning, s.si, s.r.stages.length, warp > 7 ? `ALT ${fmt(s.alt / 1000, 0)} km  ⏩${fmt(warp)}x` : null);
        t('alt').textContent = fmt(s.alt / 1000, s.alt < 1e6 ? 1 : 0); t('vel').textContent = fmt(s.vel);
        t('fuel').textContent = Math.round((fuelLeft / (cfg.fuel * 1000)) * 100) + '%';
        t('time').textContent = `T+${fmt(s.t)}s · E${cfg.stages - s.r.stages.length + 1}`;
        if (s.done) return finish(s);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    function finish(s) {
      flying = false; $('[data-a="launch"]', body).disabled = false;
      const km = s.maxAlt / 1000; const prev = store.get('rocketBest', 0);
      if (s.maxAlt > prev) { store.set('rocketBest', s.maxAlt); o('best').textContent = fmt(km) + ' km'; }
      if (s.done === 'lua') { Confetti(); toast('Missão cumprida!', 'O PAO-13 chegou à Lua 🌕', '🏆'); }
      else if (s.done === 'crash') toast('RUD!', 'Desmontagem rápida não programada 💥', '💥');
      else toast(`Apogeu: ${fmt(km, 1)} km`, s.maxAlt > prev ? 'NOVO RECORDE!' : 'A cápsula volta de paraquedas 🪂', '📈');
      drawScene(s.alt, 0, false, 0, s.r.stages.length, s.done === 'lua' ? '🌕 LUA ALCANÇADA!' : `APOGEU ${fmt(km, 1)} km`);
    }
    $('[data-a="launch"]', body).onclick = () => { buzz(30); launch(); body.scrollTo({ top: 0, behavior: 'smooth' }); };
    sync(); ready = true; drawIdle();
    api.onKey((e, d) => { if (d === 'down' && e.key === ' ' && e.target.tagName !== 'INPUT') { e.preventDefault(); launch(); } });
    return () => { flying = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  },
};

/* ---------- 7.2 MARS ROVER ---------- */
APPS.rover = {
  name: 'Mars Rover', short: 'Rover', icon: '🔴', flush: true, tile: ['#FF6B35', '#7A1F0C'], w: 820, h: 560,
  render(body, api) {
    body.innerHTML = `
      <div class="game-col">
        <div class="hud">
          <div class="card stat"><b data-o="dist">0</b><span>metros</span></div>
          <div class="card stat"><b data-o="samp">0</b><span>amostras</span></div>
          <div class="card stat"><b data-o="best">${fmt(store.get('roverBest', 0))}</b><span>recorde</span></div>
          <div class="card stat"><span>bateria</span><div class="bar" style="margin-top:6px"><i data-o="bat" style="width:100%"></i></div></div>
        </div>
        <canvas class="game"></canvas>
        <p class="muted small center" style="margin:0">Segure os botões · colete 💎 para recarregar · cuidado nos saltos!</p>
        <div class="btn-row">
          <button class="ctl" data-a="back">◀ RÉ</button>
          <button class="ctl go" data-a="go">ACELERAR ▶</button>
        </div>
      </div>`;
    const cv = $('canvas', body); let ctx, W, H;
    const resize = () => { const r = cv.getBoundingClientRect(); ({ ctx, W, H } = fitCanvas(cv, Math.max(200, r.height || 300))); if (s && !s.air) s.y = gy(s.x); };
    requestAnimationFrame(resize); addEventListener('resize', resize);
    const o = k => $(`[data-o="${k}"]`, body);
    const seed = rand(0, 1000);
    const ground = x => {
      const d = 1 + x / 9000;
      return 0.68 + (Math.sin((x + seed) * 0.0021) * 0.07 + Math.sin((x + seed) * 0.0063) * 0.04 * d + Math.sin((x + seed) * 0.017) * 0.012 * d
        + (Math.sin(x * 0.0009) > 0.6 ? Math.sin(x * 0.012) * 0.05 * d : 0));
    };
    let s, keys = { l: false, r: false }, raf = 0, last = 0, dust = [];
    const G = 230;
    function reset() {
      s = { x: 60, y: 0, vx: 0, vy: 0, air: false, ang: 0, bat: 100, samples: 0, over: false, crash: false, gems: [] };
      for (let x = 500; x < 200000; x += rand(350, 800)) s.gems.push({ x, got: false });
      s.y = ground(s.x) * H;
    }
    function gy(x) { return ground(x) * H; }
    function update(dt) {
      if (s.over) return;
      const thr = (keys.r ? 1 : 0) - (keys.l ? 0.6 : 0);
      if (s.bat <= 0) s.bat = 0;
      const power = s.bat > 0 ? thr : 0;
      const slope = (gy(s.x + 2) - gy(s.x - 2)) / 4;
      if (!s.air) {
        s.vx += (power * 260 - slope * G * 0.9 - s.vx * 0.35) * dt;
        s.vx = clamp(s.vx, -120, 520);
        const nx = s.x + s.vx * dt; const vy = slope * s.vx;
        const freeY = s.y + vy * dt + 0.5 * G * dt * dt;
        if (gy(nx) - freeY > 1.5 && Math.abs(s.vx) > 120) { s.air = true; s.vy = vy; }
        s.x = nx; if (!s.air) { s.y = gy(s.x); s.ang = Math.atan(slope); }
      }
      if (s.air) {
        s.vy += G * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        s.ang = lerp(s.ang, Math.atan2(s.vy, Math.max(60, Math.abs(s.vx))) * 0.6, 0.08);
        if (s.y >= gy(s.x)) {
          const sl = (gy(s.x + 2) - gy(s.x - 2)) / 4; const impact = s.vy - sl * s.vx;
          s.y = gy(s.x); s.air = false;
          if (impact > 330) { s.over = true; s.crash = true; Sound.error(); }
          else if (impact > 160) { Sound.beep(120, 0.12, 'square', 0.05); for (let i = 0; i < 14; i++) dust.push({ x: s.x, y: s.y, vx: rand(-80, 80), vy: rand(-120, -20), a: 1 }); }
        }
      }
      s.bat -= (Math.abs(power) * 2.4 + 0.25) * dt;
      s.gems.forEach(g => {
        if (!g.got && Math.abs(g.x - s.x) < 22 && Math.abs(gy(g.x) - 14 - s.y) < 40) {
          g.got = true; s.samples++; s.bat = Math.min(100, s.bat + 18); Sound.beep(1320, 0.08, 'triangle', 0.07); Sound.beep(1760, 0.1, 'triangle', 0.06, 0.07);
          if (s.samples >= 10) Ach.unlock('geologo');
        }
      });
      if (keys.r && !s.air && Math.random() < 0.5) dust.push({ x: s.x - 20, y: s.y, vx: rand(-60, -10), vy: rand(-50, -10), a: .7 });
      dust.forEach(d => { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 120 * dt; d.a -= dt * 1.2; }); dust = dust.filter(d => d.a > 0);
      const m = Math.max(0, Math.floor((s.x - 60) / 10));
      if (m >= 1000) Ach.unlock('rover1k');
      if (s.bat <= 0 && Math.abs(s.vx) < 4 && !s.air) s.over = true;
      if (s.over) {
        const best = store.get('roverBest', 0); if (m > best) { store.set('roverBest', m); o('best').textContent = fmt(m); }
        toast(s.crash ? 'Rover capotou!' : 'Bateria esgotada', `${fmt(m)} m · ${s.samples} amostras${m > best ? ' · NOVO RECORDE!' : ''}`, s.crash ? '💥' : '🔋');
      }
    }
    function draw() {
      const camX = s.x - W * 0.3;
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#E8B18A'); sky.addColorStop(1, '#C96B3C');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,240,220,.9)'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.18, 14, 0, 7); ctx.fill();
      // montanhas ao fundo (parallax)
      ctx.fillStyle = 'rgba(140,60,30,.45)'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.5 + Math.sin((x + camX * 0.2) * 0.008) * 30 + Math.sin((x + camX * 0.2) * 0.02) * 12);
      ctx.lineTo(W, H); ctx.fill();
      // solo
      ctx.fillStyle = '#8E3B1E'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) ctx.lineTo(x, gy(x + camX));
      ctx.lineTo(W, H); ctx.fill();
      ctx.strokeStyle = '#B5562E'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = 0; x <= W; x += 4) x ? ctx.lineTo(x, gy(x + camX)) : ctx.moveTo(x, gy(x + camX)); ctx.stroke();
      // marcadores de distância
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '10px JetBrains Mono, monospace';
      for (let mx = Math.ceil(camX / 1000) * 1000; mx < camX + W; mx += 1000) { const sx = mx - camX; ctx.fillRect(sx, gy(mx) - 30, 2, 30); ctx.fillText(fmt((mx - 60) / 10) + 'm', sx + 4, gy(mx) - 22); }
      // amostras
      s.gems.forEach(g => { if (g.got || g.x < camX - 20 || g.x > camX + W + 20) return; const sx = g.x - camX, sy = gy(g.x) - 14;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.PI / 4); ctx.shadowColor = '#7DF9FF'; ctx.shadowBlur = 14; ctx.fillStyle = '#7DF9FF'; ctx.fillRect(-6, -6, 12, 12); ctx.restore(); });
      // poeira
      dust.forEach(d => { ctx.globalAlpha = d.a; ctx.fillStyle = '#D9895A'; ctx.fillRect(d.x - camX, d.y, 3, 3); }); ctx.globalAlpha = 1;
      // rover
      ctx.save(); ctx.translate(s.x - camX, s.y); ctx.rotate(s.ang);
      const wheel = (x) => { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x, -7, 7, 0, 7); ctx.fill(); ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, -7, 4, 0, 7); ctx.stroke(); };
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -7); ctx.lineTo(-6, -18); ctx.lineTo(6, -18); ctx.lineTo(18, -7); ctx.stroke();
      wheel(-18); wheel(0); wheel(18);
      ctx.fillStyle = '#EDEDED'; ctx.fillRect(-20, -28, 40, 12);
      ctx.fillStyle = '#1F3A6B'; ctx.fillRect(-24, -32, 30, 4);
      ctx.fillStyle = '#ccc'; ctx.fillRect(10, -46, 3, 18); ctx.fillStyle = '#EDEDED'; ctx.fillRect(6, -52, 12, 7); ctx.fillStyle = '#38E1FF'; ctx.fillRect(14, -50, 3, 3);
      ctx.fillStyle = '#FC3D21'; ctx.font = 'bold 7px JetBrains Mono'; ctx.fillText('P-13', -15, -19);
      ctx.restore();
      if (s.over) {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 22px Orbitron, sans-serif'; ctx.fillText(s.crash ? 'ROVER CAPOTOU' : 'SEM BATERIA', W / 2, H / 2 - 10);
        ctx.font = '13px JetBrains Mono, monospace'; ctx.fillText('Toque ou aperte Enter para tentar de novo', W / 2, H / 2 + 18); ctx.textAlign = 'left';
      }
      o('dist').textContent = fmt(Math.max(0, (s.x - 60) / 10)); o('samp').textContent = s.samples; o('bat').style.width = s.bat + '%';
    }
    function loop(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; if (H) update(dt); if (H) draw(); raf = requestAnimationFrame(loop); }
    requestAnimationFrame(() => { resize(); reset(); raf = requestAnimationFrame(loop); });
    holdButton($('[data-a="go"]', body), () => { keys.r = true; if (s.over) reset(); }, () => { keys.r = false; });
    holdButton($('[data-a="back"]', body), () => { keys.l = true; }, () => { keys.l = false; });
    cv.addEventListener('pointerdown', () => { if (s && s.over) reset(); });
    api.onKey((e, d) => {
      const v = d === 'down';
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.r = v; e.preventDefault(); }
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.l = v; e.preventDefault(); }
      if (v && (e.key === 'Enter' || e.key === ' ') && s.over) reset();
    });
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  },
};

/* ---------- 7.3 GARAGEM ---------- */
const CAR_PARTS = {
  motor: { v6: { n: 'V6 Turbo', kw: 300, kg: 0, gears: 6 }, v8: { n: 'V8 Biturbo', kw: 480, kg: 60, gears: 6 }, v12: { n: 'V12', kw: 600, kg: 110, gears: 7 }, ev: { n: 'Elétrico', kw: 750, kg: 220, gears: 1 } },
  pneu:  { rua: { n: 'Rua', mu: 0.95 }, sport: { n: 'Esportivo', mu: 1.15 }, slick: { n: 'Slick', mu: 1.4 } },
  aero:  { none: { n: 'Liso', cda: 0.62, df: 0 }, spoiler: { n: 'Spoiler', cda: 0.68, df: 0.6 }, asa: { n: 'Asa GT', cda: 0.8, df: 1.4 } },
  chassi:{ aco: { n: 'Aço', kg: 1500 }, alu: { n: 'Alumínio', kg: 1300 }, carbono: { n: 'Carbono', kg: 1100 } },
};
const CAR_COLORS = ['#FF2D2D', '#FFD60A', '#38E1FF', '#3DFFA2', '#FF8A3D', '#FFFFFF', '#1F1F1F', '#8B5CF6', '#0B3D91'];
function carSpec(c) {
  const m = CAR_PARTS.motor[c.motor], p = CAR_PARTS.pneu[c.pneu], a = CAR_PARTS.aero[c.aero], ch = CAR_PARTS.chassi[c.chassi];
  const mass = ch.kg + m.kg + 80; const P = m.kw * 1000;
  const vmax = Math.min(Math.cbrt(P / (0.5 * 1.2 * a.cda)), m.gears === 1 ? 97 : 140);
  return { P, mass, mu: p.mu, cda: a.cda, df: a.df, gears: m.gears, vmax, ev: m.gears === 1 };
}
/* Física do drag race */
function carStep(st, sp, dt, wantShift) {
  const ratios = sp.gears === 1 ? [1] : Array.from({ length: sp.gears }, (_, i) => 0.24 + 0.76 * Math.pow(i / (sp.gears - 1), 0.85));
  const gearTop = sp.vmax * ratios[st.gear] * 1.02;
  st.rpm = clamp(st.v / gearTop, 0.12, 1.05);
  let P = 0;
  if (st.shiftT > 0) st.shiftT -= dt;
  else if (st.rpm < 1) P = sp.P * (sp.ev ? 1 : (0.45 + 0.55 * Math.sin(st.rpm * Math.PI / 2)));
  const Fpow = P / Math.max(st.v, 2.5);
  const Fgrip = sp.mu * (sp.mass * 9.81 + sp.df * 0.5 * 1.2 * st.v * st.v * 3) * 0.95;
  const Fdrag = 0.5 * 1.2 * sp.cda * st.v * st.v + sp.mass * 9.81 * 0.015;
  st.v = Math.max(0, st.v + ((Math.min(Fpow, Fgrip) - Fdrag) / sp.mass) * dt);
  st.x += st.v * dt; st.t += dt;
  if (wantShift && st.gear < ratios.length - 1 && st.shiftT <= 0) {
    const q = st.rpm >= 0.86 && st.rpm <= 1.01 ? 'perfeita' : (st.rpm < 0.86 ? 'cedo' : 'tarde');
    st.gear++; st.shiftT = q === 'perfeita' ? 0.08 : 0.32; return q;
  }
  return null;
}
function carSimulate(sp) {
  const st = { v: 0, x: 0, t: 0, gear: 0, rpm: 0, shiftT: 0 }; let t100 = null;
  while (st.x < 402 && st.t < 40) { carStep(st, sp, 0.01, st.rpm >= 0.97); if (!t100 && st.v >= 27.78) t100 = st.t; }
  return { t100: t100 || 99, q: st.t, vq: st.v };
}
function carSVG(c) {
  const col = c.cor, a = c.aero;
  const wing = a === 'asa' ? `<path d="M40 52 L40 34 L92 30 L92 36 L50 40 L52 54Z" fill="#111"/><rect x="34" y="28" width="62" height="6" rx="2" fill="${col}" stroke="#111"/>`
    : a === 'spoiler' ? `<path d="M44 62 L84 56 L86 62 L46 66Z" fill="#111"/>` : '';
  const rim = c.pneu === 'slick' ? '#FFD60A' : c.pneu === 'sport' ? '#C0C0C0' : '#777';
  return `<svg viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg" aria-label="Carro configurado">
    <ellipse cx="200" cy="140" rx="170" ry="10" fill="rgba(0,0,0,.35)"/>
    ${wing}
    <path d="M30 110 Q32 78 70 70 L140 62 Q175 36 220 34 L270 36 Q300 40 330 68 L372 78 Q390 84 388 104 L386 116 L30 118 Z" fill="${col}" stroke="#111" stroke-width="3"/>
    <path d="M150 64 Q180 42 222 40 L266 42 Q290 46 312 68 Z" fill="#0d1b2a" stroke="#111" stroke-width="2"/>
    <path d="M228 42 L232 68" stroke="${col}" stroke-width="5"/>
    <path d="M40 100 L380 96" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
    <rect x="356" y="84" width="22" height="7" rx="3" fill="#FFF6B0"/>
    <rect x="30" y="86" width="14" height="7" rx="3" fill="#FF2D2D"/>
    <rect x="170" y="96" width="62" height="16" rx="2" fill="#fff" stroke="#111"/>
    <text x="201" y="108.5" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11" text-anchor="middle" fill="#111">${esc(c.placa.slice(0, 8))}</text>
    ${[95, 315].map(x => `<circle cx="${x}" cy="118" r="26" fill="#111"/><circle cx="${x}" cy="118" r="15" fill="${rim}"/><circle cx="${x}" cy="118" r="4" fill="#111"/>
      ${[0, 72, 144, 216, 288].map(r => `<rect x="${x - 1.5}" y="104" width="3" height="10" fill="#111" transform="rotate(${r} ${x} 118)"/>`).join('')}`).join('')}
    <text x="200" y="88" font-family="Orbitron, sans-serif" font-weight="900" font-size="18" text-anchor="middle" fill="rgba(0,0,0,.35)">13</text>
  </svg>`;
}
const IVAN_TIME = 9.9;
APPS.garage = {
  name: 'Garagem do Paolo', short: 'Garagem', icon: '🏎️', tile: ['#FFD60A', '#E0161B'], w: 540, h: 720,
  render(body, api) {
    const c = Object.assign({ motor: 'v8', pneu: 'sport', aero: 'spoiler', chassi: 'alu', cor: '#FF2D2D', placa: 'PAO-13' }, store.get('car', {}));
    const best = store.get('dragBest', null);
    body.innerHTML = `
      <div class="col">
        <div class="car-stage" data-o="car"></div>
        <div class="card" data-o="race" style="padding:10px">
          <canvas class="game"></canvas>
          <div class="row between" style="margin:10px 0">
            <div class="gauge"><span class="shift-light" data-o="light"></span><span class="rpm" data-o="rpm">0</span><span class="muted">km/h</span></div>
            <b class="muted" data-o="gear" style="font-family:var(--font-pixel);font-size:10px">N</b>
          </div>
          <div class="btn-row">
            <button class="ctl" data-a="start">🚦 CORRER</button>
            <button class="ctl go" data-a="shift" disabled>⬆ TROCAR</button>
          </div>
          <p class="muted small" style="margin:10px 0 0">Espere o verde e toque LARGAR. Troque a marcha quando a luz acender. Adversário: <b>GT do ${esc(CONFIG.de)}</b> (${fmt(IVAN_TIME, 1)} s). Recorde: <b data-o="best">${best ? fmt(best, 2) + ' s' : '—'}</b></p>
        </div>
        <div class="card">
          ${[['pot', 'Potência'], ['acc', '0–100 km/h'], ['top', 'Vel. máxima'], ['qm', '402 m (estimado)']].map(([k, l]) => `
            <div style="margin-bottom:8px"><div class="kv"><span class="muted">${l}</span><b data-s="${k}"></b></div><div class="bar"><i data-b="${k}"></i></div></div>`).join('')}
        </div>
        <h3 class="h">CONFIGURAR</h3>
        ${Object.entries({ motor: 'Motor', pneu: 'Pneus', aero: 'Aerodinâmica', chassi: 'Chassi' }).map(([k, lbl]) => `
          <div class="field"><label>${lbl}</label><div class="seg" data-k="${k}">${Object.entries(CAR_PARTS[k]).map(([v, p]) => `<button data-v="${v}">${p.n}</button>`).join('')}</div></div>`).join('')}
        <div class="field"><label>Cor</label><div class="swatches">${CAR_COLORS.map(col => `<button class="swatch" data-c="${col}" style="background:${col}" aria-label="Cor ${col}"></button>`).join('')}</div></div>
        <div class="field"><label>Placa</label><input class="text-in" data-k="placa" maxlength="8" autocomplete="off"></div>
      </div>`;
    const o = k => $(`[data-o="${k}"]`, body);
    function sync() {
      $$('.seg', body).forEach(sg => $$('button', sg).forEach(b => b.classList.toggle('on', c[sg.dataset.k] === b.dataset.v)));
      $$('.swatch', body).forEach(s => s.classList.toggle('on', s.dataset.c === c.cor));
      $('[data-k="placa"]', body).value = c.placa;
      o('car').innerHTML = carSVG(c);
      const sp = carSpec(c); const sim = carSimulate(sp);
      const set = (k, txt, pct) => { $(`[data-s="${k}"]`, body).textContent = txt; $(`[data-b="${k}"]`, body).style.width = clamp(pct, 4, 100) + '%'; };
      set('pot', fmt(sp.P / 735.5) + ' cv', sp.P / 7500);
      set('acc', fmt(sim.t100, 2) + ' s', (6 - sim.t100) / 4 * 100);
      set('top', fmt(sp.vmax * 3.6) + ' km/h', (sp.vmax * 3.6 - 150) / 2.5);
      set('qm', fmt(sim.q, 2) + ' s', (16 - sim.q) / 8 * 100);
      store.set('car', c);
    }
    $$('.seg', body).forEach(sg => sg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || racing) return; c[sg.dataset.k] = b.dataset.v; Sound.click(); sync(); }));
    $$('.swatch', body).forEach(s => s.addEventListener('click', () => { c.cor = s.dataset.c; Sound.click(); sync(); }));
    $('[data-k="placa"]', body).addEventListener('input', e => { c.placa = e.target.value.toUpperCase() || 'PAO-13'; o('car').innerHTML = carSVG(c); store.set('car', c); });

    // --- drag race ---
    const cv = $('canvas', body); let ctx, W, H;
    const resize = () => ({ ctx, W, H } = fitCanvas(cv, 140)); resize(); addEventListener('resize', resize);
    let racing = false, raf = 0, phase = 'idle', st, ghost, sp, lightT = 0, greenAt = 0, reaction = 0, shifts = [], wantShift = false;
    const GHOST_T = IVAN_TIME;
    function drawRace() {
      ctx.fillStyle = '#1b1b1f'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(0, 22, W, 46); ctx.fillRect(0, 82, W, 46);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(0, 75); ctx.lineTo(W, 75); ctx.stroke(); ctx.setLineDash([]);
      const px = x => 40 + (x / 402) * (W - 80);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(px(402), 22 + i * 10.6, 6, 10.6); }
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px JetBrains Mono'; ctx.fillText('LARGADA', 4, 16); ctx.fillText('402 m', W - 48, 16);
      const car = (x, y, col, name) => { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px(x) - 34, y, 34, 16, 5) : ctx.rect(px(x) - 34, y, 34, 16); ctx.fill();
        ctx.fillStyle = '#0d1b2a'; ctx.fillRect(px(x) - 18, y + 3, 9, 10); ctx.fillStyle = '#111'; ctx.fillRect(px(x) - 30, y - 2, 7, 3); ctx.fillRect(px(x) - 10, y - 2, 7, 3); ctx.fillRect(px(x) - 30, y + 15, 7, 3); ctx.fillRect(px(x) - 10, y + 15, 7, 3);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '9px JetBrains Mono'; ctx.fillText(name, px(x) - 34, y + 30); };
      car(st ? st.x : 0, 37, c.cor, c.placa); car(ghost ? ghost.x : 0, 97, '#888', 'IVÁN GT');
      // árvore de largada
      const lights = phase === 'lights' ? Math.min(3, Math.floor(lightT / 0.5)) : (phase === 'race' || phase === 'done' ? 4 : 0);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = lights > i && lights < 4 ? '#FFB000' : '#333'; ctx.beginPath(); ctx.arc(W / 2 - 24 + i * 24, 10, 6, 0, 7); ctx.fill(); }
      if (phase === 'burn') { ctx.fillStyle = '#FF2D2D'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(W / 2 - 24 + i * 24, 10, 6, 0, 7); ctx.fill(); } }
      if (lights === 4) { ctx.fillStyle = '#22E07A'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(W / 2 - 24 + i * 24, 10, 6, 0, 7); ctx.fill(); } }
    }
    function start() {
      if (racing) return; racing = true; sp = carSpec(c); st = { v: 0, x: 0, t: 0, gear: 0, rpm: 0, shiftT: 0 }; ghost = { x: 0 }; shifts = [];
      phase = 'lights'; lightT = 0; greenAt = 1.5 + rand(0.2, 1.0); reaction = null;
      $('[data-a="start"]', body).disabled = true; $('[data-a="shift"]', body).disabled = false; $('[data-a="shift"]', body).textContent = '🟢 LARGAR';
      let last = performance.now();
      const loop = now => {
        const dt = Math.min(0.033, (now - last) / 1000); last = now;
        if (phase === 'lights') {
          const before = Math.floor(lightT / 0.5); lightT += dt; if (Math.floor(lightT / 0.5) !== before && lightT < 1.6) Sound.beep(600, 0.08);
          if (lightT >= greenAt) { phase = 'wait'; Sound.beep(1200, 0.2); lightT = 0; }
        } else if (phase === 'wait') {
          lightT += dt; ghostMove(dt); if (lightT > 3) launchCar();
        } else if (phase === 'race') {
          ghostMove(dt);
          for (let i = 0; i < 4; i++) { const q = carStep(st, sp, dt / 4, wantShift && i === 0); if (q) { shifts.push(q); Sound.beep(q === 'perfeita' ? 1100 : 300, 0.06); } }
          wantShift = false;
          if (st.x >= 402) return finish();
        }
        const rpmOk = sp.gears > 1 && st.rpm >= 0.86 && st.gear < sp.gears - 1;
        o('light').classList.toggle('on', phase === 'race' ? rpmOk : phase === 'wait');
        o('rpm').textContent = fmt(st.v * 3.6); o('gear').textContent = phase === 'race' ? (sp.ev ? 'EV' : 'M' + (st.gear + 1)) : 'N';
        drawRace(); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    function ghostMove(dt) { ghost.t = (ghost.t || 0) + dt; const p = clamp(ghost.t / GHOST_T, 0, 1); ghost.x = 402 * (p * p * (1.6 - 0.6 * p)); }
    function launchCar() { reaction = lightT; phase = 'race'; $('[data-a="shift"]', body).textContent = sp.ev ? '⚡ ELÉTRICO' : '⬆ TROCAR'; if (sp.ev) $('[data-a="shift"]', body).disabled = true; }
    function press() {
      if (!racing) return;
      if (phase === 'lights') { // queimou a largada
        racing = false; phase = 'burn'; cancelAnimationFrame(raf); Sound.error(); toast('Queimou a largada!', 'Espere a luz verde 🟢', '🚫'); resetBtns(); drawRace(); return;
      }
      if (phase === 'wait') { launchCar(); return; }
      if (phase === 'race') wantShift = true;
    }
    function finish() {
      racing = false; phase = 'done'; cancelAnimationFrame(raf);
      const total = st.t + (reaction || 0); const ivan = GHOST_T; const win = total < ivan;
      const prev = store.get('dragBest', null);
      if (!prev || total < prev) { store.set('dragBest', total); o('best').textContent = fmt(total, 2) + ' s'; }
      if (total < 9.3) Ach.unlock('quarto'); if (win) Ach.unlock('venceu');
      if (!sp.ev && shifts.length === sp.gears - 1 && shifts.every(q => q === 'perfeita')) Ach.unlock('troca');
      const pf = shifts.filter(q => q === 'perfeita').length;
      toast(win ? 'VITÓRIA!' : 'Perdeu por pouco', `${fmt(total, 2)} s (reação ${fmt(reaction || 0, 2)} s)${sp.ev ? '' : ` · ${pf}/${shifts.length} trocas perfeitas`}`, win ? '🏆' : '🏁');
      if (win) Confetti(120);
      resetBtns(); drawRace();
    }
    function resetBtns() { $('[data-a="start"]', body).disabled = false; $('[data-a="shift"]', body).disabled = true; $('[data-a="shift"]', body).textContent = '⬆ TROCAR'; }
    $('[data-a="start"]', body).onclick = start;
    $('[data-a="shift"]', body).addEventListener('pointerdown', e => { e.preventDefault(); buzz(15); press(); });
    api.onKey((e, d) => { if (d === 'down' && e.key === ' ' && e.target.tagName !== 'INPUT') { e.preventDefault(); racing ? press() : start(); } });
    sp = carSpec(c); st = { v: 0, x: 0, rpm: 0, gear: 0 }; ghost = { x: 0 };
    sync(); drawRace();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  },
};

/* ---------- 7.4 ESPBOY ---------- */
const APOLLO = [ // [hora GET, fase, dist. da Terra km, velocidade km/h]
  [0, 'LANCAMENTO', 0, 0], [0.2, 'ORBITA TERRA', 190, 28000], [2.7, 'INJECAO TLI', 330, 39000], [30, 'RUMO A LUA', 190000, 5500],
  [75.8, 'ORBITA LUNAR', 384000, 5900], [102.75, 'POUSO EAGLE', 384400, 0], [109.4, 'CAMINHADA', 384400, 0], [124.4, 'SUBIDA', 384400, 6000],
  [135.4, 'VOLTA TEI', 380000, 9000], [170, 'RUMO A TERRA', 150000, 6000], [195.05, 'REENTRADA', 120, 39900], [195.3, 'SPLASHDOWN', 0, 0],
];
APPS.espboy = {
  name: 'ESPBoy: Apollo 11', short: 'ESPBoy', icon: '🎮', tile: ['#3DFF7A', '#1B5E20'], w: 400, h: 640,
  render(body, api) {
    Ach.unlock('espboy');
    body.innerHTML = `
      <div class="espboy">
        <div class="bezel"><small>● POWER · ESP32</small><canvas width="128" height="128"></canvas></div>
        <div class="brand"><b>ESP</b>Boy <span style="font-size:7px">APOLLO 11 EDITION</span></div>
        <div class="controls">
          <div class="joy"><button class="u" data-k="up">▲</button><button class="l" data-k="left">◀</button><button class="r" data-k="right">▶</button><button class="d" data-k="down">▼</button></div>
          <div style="display:flex;gap:10px;transform:rotate(-20deg)"><button class="ab" data-k="b" style="background:#5B6080;box-shadow:0 4px 0 #353a55">B</button><button class="ab" data-k="a">A</button></div>
        </div>
      </div>
      <p class="muted small center" style="margin-top:16px">Homenagem ao ESPBoy de Paolo, Arthur e Caetano P.<br>ESP32 + TFT 1.44" + joystick, sem solda.<br>Dizem que o direcional guarda um código clássico… 🕹️</p>`;
    const cv = $('canvas', body); const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const G1 = '#3DFF7A', G2 = '#1B8F3F', BK = '#000';
    let mode = 'menu', sel = 0, get = 0, speed = 1, yaw = 0.6, pitch = 0.3, joy = { x: 0, y: 0 }, raf = 0, last = 0, splashed = false;
    const items = ['SIMULACAO ORBITAL', 'COMP. DE BORDO', 'NAVE 3D'];
    const text = (s, x, y, c = G1, sz = 8) => { ctx.fillStyle = c; ctx.font = `${sz}px "Press Start 2P", monospace`; ctx.fillText(s, x, y); };
    function phaseAt(g) { let i = 0; while (i < APOLLO.length - 1 && APOLLO[i + 1][0] <= g) i++; const a = APOLLO[i], b = APOLLO[Math.min(i + 1, APOLLO.length - 1)]; const t = b[0] === a[0] ? 0 : (g - a[0]) / (b[0] - a[0]); return { i, name: a[1], dist: lerp(a[2], b[2], t), vel: lerp(a[3], b[3], t) }; }
    const clock = g => { const hh = Math.floor(g), mm = Math.floor((g - hh) * 60); return `${String(hh).padStart(3, '0')}:${String(mm).padStart(2, '0')}`; };
    function shipPos(g) { // figura de 8 Terra -> Lua
      const ex = 22, mx = 106, cy = 70;
      if (g < 2.7) { const a = g / 2.7 * Math.PI * 4; return [ex + Math.cos(a) * 13, cy + Math.sin(a) * 13]; }
      if (g < 75.8) { const t = (g - 2.7) / 73.1; return [lerp(ex + 13, mx - 9, t), cy - Math.sin(t * Math.PI) * 26]; }
      if (g < 135.4) { const a = (g - 75.8) / 2 * Math.PI; return [mx + Math.cos(a) * 9, cy + Math.sin(a) * 9]; }
      if (g < 195.05) { const t = (g - 135.4) / 59.65; return [lerp(mx - 9, ex + 12, t), cy + Math.sin(t * Math.PI) * 26]; }
      return [ex + 10, cy + 6];
    }
    function drawMenu() {
      text('ESPBOY v1.1', 18, 18); ctx.fillStyle = G2; ctx.fillRect(8, 24, 112, 1);
      items.forEach((it, i) => { if (i === sel) { ctx.fillStyle = G1; ctx.fillRect(6, 38 + i * 22, 116, 16); text(it, 10, 50 + i * 22, BK, 7); } else text(it, 10, 50 + i * 22, G1, 7); });
      text('A=OK', 44, 120, G2, 7);
    }
    function drawOrbit() {
      const p = phaseAt(get);
      text('GET ' + clock(get), 4, 10, G1, 7); text(p.name, 4, 20, G2, 6);
      ctx.fillStyle = '#1E5BB8'; ctx.beginPath(); ctx.arc(22, 70, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.arc(106, 70, 5, 0, 7); ctx.fill();
      ctx.fillStyle = G2; for (let g = 0; g < Math.min(get, 195); g += 1.2) { const [x, y] = shipPos(g); ctx.fillRect(x, y, 1, 1); }
      const [sx, sy] = shipPos(get); ctx.fillStyle = (Date.now() / 200 | 0) % 2 ? G1 : '#fff'; ctx.fillRect(sx - 1, sy - 1, 3, 3);
      if (p.name === 'SPLASHDOWN') { text('MISSAO', 38, 108, G1, 7); text('CUMPRIDA!', 30, 120, G1, 7); }
      else text(`x${speed}  A=ACELERA`, 4, 122, G2, 6);
    }
    function drawComp() {
      const p = phaseAt(get);
      text('COMPUTADOR', 4, 10, G1, 7); text('GET ' + clock(get), 4, 22, G2, 6);
      const rows = [['FASE', p.name.slice(0, 11)], ['DIST T', fmt(p.dist) + 'km'], ['DIST L', fmt(Math.max(0, 384400 - p.dist)) + 'km'], ['VEL', fmt(p.vel) + 'km/h'],
        ['COMB', Math.max(4, Math.round(100 - get / 2.1)) + '%'], ['TEMP', (21 + Math.sin(get) * 1.5).toFixed(1) + 'C'], ['PRESS', '5.0psi']];
      rows.forEach(([k, v], i) => { text(k, 4, 38 + i * 13, G2, 6); text(v, 50, 38 + i * 13, G1, 6); });
    }
    function draw3D() {
      text('NAVE 3D', 4, 10, G1, 7); text('CSM+LM', 74, 10, G2, 6);
      const V = [], E = []; const add = (p) => (V.push(p), V.length - 1);
      const ring = (y, r, n = 10) => Array.from({ length: n }, (_, i) => add([Math.cos(i / n * 6.283) * r, y, Math.sin(i / n * 6.283) * r]));
      const link = (a, b) => a.forEach((v, i) => E.push([v, b[i]]));
      const loop = a => a.forEach((v, i) => E.push([v, a[(i + 1) % a.length]]));
      const apex = add([0, -2.1, 0]); const r0 = ring(-1.2, 0.9); loop(r0); r0.forEach(v => E.push([apex, v]));
      const r1 = ring(0.9, 0.9); loop(r1); link(r0, r1); const nz1 = ring(1.2, 0.25, 6); const nz2 = ring(1.8, 0.5, 6); loop(nz2); link(nz1, nz2);
      const b = [[-0.6, 2.1, -0.6], [0.6, 2.1, -0.6], [0.6, 2.1, 0.6], [-0.6, 2.1, 0.6], [-0.6, 3.0, -0.6], [0.6, 3.0, -0.6], [0.6, 3.0, 0.6], [-0.6, 3.0, 0.6]].map(add);
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, c]) => E.push([b[a], b[c]]));
      [[-1.1, 3.5, -1.1], [1.1, 3.5, -1.1], [1.1, 3.5, 1.1], [-1.1, 3.5, 1.1]].forEach((p, i) => E.push([b[4 + i], add(p)]));
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), spn = Math.sin(pitch);
      const P = V.map(([x, y, z]) => { const x1 = x * cy - z * sy, z1 = x * sy + z * cy; const y1 = y * cp - z1 * spn, z2 = y * spn + z1 * cp; const s = 60 / (z2 + 7); return [64 + x1 * s * 1.4, 68 + (y1 - 0.7) * s * 1.4]; });
      ctx.strokeStyle = G1; ctx.lineWidth = 1; ctx.beginPath(); E.forEach(([a, c]) => { ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[c][0], P[c][1]); }); ctx.stroke();
      text('JOYSTICK GIRA', 18, 124, G2, 6);
    }
    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      ctx.fillStyle = BK; ctx.fillRect(0, 0, 128, 128);
      if (mode !== 'menu' && mode !== '3d') { get = Math.min(195.3, get + dt * 2.2 * speed); if (get >= 195.3 && !splashed) { splashed = true; Ach.unlock('splash'); Sound.chime(); } }
      if (mode === '3d') { if (joy.x || joy.y) { yaw += joy.x * dt * 2.5; pitch += joy.y * dt * 2.5; } else yaw += dt * 0.6; }
      ({ menu: drawMenu, orbit: drawOrbit, comp: drawComp, '3d': draw3D })[mode]();
      raf = requestAnimationFrame(frame);
    }
    function press(k, down = true) {
      if (k === 'left' || k === 'right') joy.x = down ? (k === 'left' ? -1 : 1) : 0;
      if (k === 'up' || k === 'down') joy.y = down ? (k === 'up' ? -1 : 1) : 0;
      if (!down) return;
      Sound.beep(1500, 0.03, 'square', 0.03);
      if (mode === 'menu') {
        if (k === 'up') sel = (sel + 2) % 3; if (k === 'down') sel = (sel + 1) % 3;
        if (k === 'a') { mode = ['orbit', 'comp', '3d'][sel]; if (get >= 195.3) { get = 0; splashed = false; } speed = 1; }
      } else {
        if (k === 'b') mode = 'menu';
        if (k === 'a' && mode !== '3d') speed = speed >= 16 ? 1 : speed * 2;
      }
    }
    const KMAP = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', a: 'a', b: 'b' };
    $$('[data-k]', body).forEach(b => holdButton(b, () => { konamiFeed(KMAP[b.dataset.k]); press(b.dataset.k, true); }, () => press(b.dataset.k, false)));
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'a', z: 'a', Z: 'a', ' ': 'a', Escape: 'b', x: 'b', X: 'b', Backspace: 'b' };
    api.onKey((e, d) => { const k = map[e.key]; if (!k) return; e.preventDefault(); if (d === 'down' && e.repeat) return; press(k, d === 'down'); });
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  },
};

/* ---------- 7.5 TERMINAL ---------- */
const NASA_FACTS = [
  'O computador de bordo da Apollo (AGC) tinha cerca de 4 KB de RAM e 72 KB de memória fixa.',
  'A memória do programa da Apollo era "core rope": fios tecidos à mão por costureiras.',
  'As pegadas deixadas na Lua podem durar milhões de anos — lá não tem vento.',
  'A ISS dá uma volta completa na Terra a cada ~90 minutos.',
  'O Saturn V tinha cerca de 110 metros de altura — mais alto que a Estátua da Liberdade.',
  'Um dia em Marte (sol) dura cerca de 24 h 39 min.',
  'A Voyager 1, lançada em 1977, é o objeto feito por humanos mais distante da Terra.',
  'O rover Perseverance pousou em Marte em 2021 levando o helicóptero Ingenuity.',
  'A missão Apollo 11 durou 195 h 18 min, do lançamento ao splashdown.',
];
const FILES = {
  'missao_apollo11.txt': 'Lançamento: 16/07/1969 · Pouso: 20/07/1969 · Tripulação: Armstrong, Aldrin, Collins.',
  'espboy.ino': '// ESP32 + TFT 1.44" + joystick\n// Tudo em 3,3 V. Nunca ligue 5 V direto nos pinos!\nvoid loop() { missao(); }',
  'segredo.txt': 'Os clássicos nunca morrem: ⬆ ⬆ ⬇ ⬇ ⬅ ➡ ⬅ ➡ B A',
  'lista_de_desejos.md': '- [ ] Impressora 3D\n- [ ] Mais ESP32\n- [ ] Ir ao Kennedy Space Center\n- [x] Fazer 13 anos',
};
APPS.terminal = {
  name: 'Terminal', icon: '⌨️', flush: true, tile: ['#2b2b2b', '#000000'], w: 680, h: 460,
  render(body, api) {
    const CHIPS = ['help', 'parabens', 'idade', 'nasa', 'bolo', 'ls', 'cat segredo.txt', 'whoami', 'apollo', 'matrix', 'sudo launch', 'clear'];
    body.innerHTML = `<div class="term"><div class="out"></div><div class="in"><span class="c-acc">paolo@os13:~$</span><input autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></div></div>
      <div class="chips">${CHIPS.map(c => `<button class="chip">${c}</button>`).join('')}</div>`;
    let iv = 0;
    const term = $('.term', body), out = $('.out', body), inp = $('input', body);
    const hist = []; let hi = 0;
    const print = (s, cls = '') => { const d = document.createElement('div'); d.className = 'line ' + cls; d.textContent = s; out.appendChild(d); term.scrollTop = term.scrollHeight; };
    const cmds = {
      help: () => print('Comandos: help, sobre, parabens, idade, nasa, apollo, espboy, ls, cat <arquivo>, launch, rover, garagem, lander, pixel, paolometro, carta, tema <nome>, temas, conquistas, bolo, matrix, whoami, data, site, clear, exit\n(e alguns segredos…)', 'c-acc'),
      sobre: () => print(`PaoloOS 13.0 "Mission Control"\nKernel: JavaScript puro · Sem frameworks · Feito por ${CONFIG.de} para ${CONFIG.nome}`),
      parabens: () => { print(`🎉 PARABÉNS, ${CONFIG.nome.toUpperCase()}! ${CONFIG.idade} ANOS! 🎉`, 'c-gold'); Confetti(); Sound.birthday(); },
      idade: () => { const s = CONFIG.idade * 365.25 * 86400; print(`${CONFIG.idade} anos = ~${fmt(CONFIG.idade * 365.25)} dias = ~${fmt(s)} segundos.\nEm Marte você teria ~${(CONFIG.idade / 1.881).toFixed(1)} anos.\nVocê já deu ${CONFIG.idade} voltas no Sol (~${fmt(CONFIG.idade * 940)} milhões de km)!`); },
      nasa: () => print('🛰️  ' + NASA_FACTS[Math.floor(Math.random() * NASA_FACTS.length)], 'c-acc'),
      apollo: () => print('"Houston, Tranquility Base here. The Eagle has landed." — 20/07/1969', 'c-gold'),
      espboy: () => { print('Ligando ESPBoy…'); setTimeout(() => UI.open('espboy'), 300); },
      ls: () => print(Object.keys(FILES).join('   ')),
      cat: a => print(FILES[a] || `cat: ${a || '?'}: arquivo não encontrado`, FILES[a] ? '' : 'c-err'),
      launch: () => { print('Abrindo Rocket Lab… 🚀'); setTimeout(() => UI.open('rocket'), 300); },
      rover: () => UI.open('rover'), garagem: () => UI.open('garage'), carta: () => UI.open('letter'),
      lander: () => UI.open('lander'), pixel: () => UI.open('pixel'), paolometro: () => UI.open('age'),
      site: () => print(CONFIG.site, 'c-acc'),
      temas: () => print(THEMES.filter(t => !t.secret || Ach.got.konami).map(t => t.id).join(', ')),
      tema: a => { if (!a) return print('uso: tema <nome>  (veja "temas")', 'c-warn'); Theme.set(a) ? print('Tema: ' + a) : print('tema inválido ou bloqueado', 'c-err'); },
      conquistas: () => print(`${Ach.count()}/${Object.keys(ACHIEVEMENTS).length} conquistas. Abra o app 🏆 para ver.`),
      whoami: () => print(`${CONFIG.nome.toLowerCase()} — comandante, maker, piloto e engenheiro de foguetes.`),
      data: () => print(new Date().toLocaleString('pt-BR')),
      bolo: () => print(`         ${'i'.repeat(13)}\n        |${'~'.repeat(13)}|\n        |  PAOLO  13  |\n      __|_____________|__\n     |___________________|`, 'c-gold'),
      clear: () => { out.innerHTML = ''; },
      exit: () => api.close(),
      sudo: a => { Ach.unlock('sudo'); print(a ? `[sudo] permissão concedida, comandante. Executando "${a}"…` : 'uso: sudo <comando>', 'c-warn'); if (a) run(a, true); },
      rm: a => print(a && a.includes('-rf') ? 'Boa tentativa. 😏 O PaoloOS é à prova de hackers… quase.' : 'rm: operação não permitida', 'c-err'),
      matrix: () => {
        clearInterval(iv); let n = 0; iv = setInterval(() => { print(Array.from({ length: 60 }, () => Math.random() < .5 ? String.fromCharCode(0x30A0 + Math.random() * 96) : ' ').join('')); if (++n > 24) { clearInterval(iv); print('Acorde, Paolo… 🐇', 'c-acc'); } }, 60);
      },
      konami: () => print('Você está perto. Mas o código não se digita aqui… 🎮', 'c-warn'),
      '42': () => print('A resposta para a vida, o universo e tudo mais.'),
      hello: () => print('Olá, mundo! 👋'), ola: () => print('Olá, comandante! 👋'),
    };
    function run(line, viaSudo) {
      const [c, ...rest] = line.trim().split(/\s+/); const a = rest.join(' ');
      if (!c) return;
      const fn = cmds[c.toLowerCase()];
      if (fn) fn(a); else { print(`comando não encontrado: ${c}. Digite "help".`, 'c-err'); if (!viaSudo) Sound.error(); }
    }
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const v = inp.value; print('paolo@os13:~$ ' + v); if (v.trim()) { hist.push(v); hi = hist.length; } inp.value = ''; run(v); }
      else if (e.key === 'ArrowUp') { if (hi > 0) inp.value = hist[--hi]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); e.preventDefault(); }
      if (e.key !== 'Escape') e.stopPropagation(); konamiPos = 0;
    });
    term.addEventListener('click', () => inp.focus());
    $$('.chip', body).forEach(b => b.addEventListener('click', () => { buzz(6); Sound.click(); print('paolo@os13:~$ ' + b.textContent); run(b.textContent); }));
    print(`PaoloOS 13.0 — terminal de missão\nToque nos atalhos aqui embaixo ou digite um comando.\nComece com "parabens" 😉`, 'c-acc');
    if (matchMedia('(pointer: fine)').matches) setTimeout(() => inp.focus(), 350);
    return () => clearInterval(iv);
  },
};

/* ---------- 7.6 CARTA + BOLO ---------- */
APPS.letter = {
  name: 'Transmissão recebida', short: 'Carta', icon: '🎂', tile: ['#FF77A8', '#7E2553'], w: 560, h: 700,
  render(body) {
    store.set('letterRead', true); document.dispatchEvent(new CustomEvent('ach'));
    body.innerHTML = `
      <div class="letter col">
        <p class="transmission">▲ TRANSMISSÃO DE ${esc(CONFIG.de.toUpperCase())} · PRIORIDADE MÁXIMA</p>
        <div class="big13">${CONFIG.idade}</div>
        <h2>Feliz aniversário, ${esc(CONFIG.nome)}!</h2>
        <canvas class="game" style="background:transparent;border:0" aria-label="Bolo com velas — toque nas velas para apagar"></canvas>
        <p class="muted small" data-o="hint" style="margin:0">Toque nas velas (ou sopre 💨) e faça um pedido!</p>
        <div class="btn-row"><button class="btn alt" data-a="blow">💨 Soprar</button><button class="btn" data-a="song">🎵 Parabéns</button></div>
        <div class="card msg" data-o="msg"></div>
        <p style="text-align:right;margin:0">— <b>${esc(CONFIG.de)}</b></p>
        <button class="btn ghost wide" data-a="party">🎉 Mais confete!</button>
      </div>`;
    // mensagem digitada
    const msgEl = $('[data-o="msg"]', body); msgEl.classList.add('typing'); let i = 0; const msg = CONFIG.mensagem;
    const typer = setInterval(() => { i += 2; msgEl.textContent = msg.slice(0, i); if (i % 6 === 0) Sound.beep(1800, 0.01, 'square', 0.015); if (i >= msg.length) { clearInterval(typer); msgEl.classList.remove('typing'); } }, 22);
    // bolo com 13 velas (se ajusta à largura do celular)
    const cv = $('canvas', body); let ctx, W, H; const resize = () => ({ ctx, W, H } = fitCanvas(cv, 170)); resize(); addEventListener('resize', resize);
    const candles = Array.from({ length: CONFIG.idade }, () => ({ lit: true })); let raf = 0;
    const cakeW = () => Math.min(280, W - 24);
    const candleX = k => W / 2 - (cakeW() / 2 - 16) + ((cakeW() - 32) / Math.max(1, candles.length - 1)) * k;
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cw = cakeW();
      ctx.fillStyle = '#5B3A29'; ctx.fillRect(cx - cw / 2 - 10, 110, cw + 20, 50); ctx.fillStyle = '#7A4E37'; ctx.fillRect(cx - cw / 2 - 10, 110, cw + 20, 8);
      ctx.fillStyle = '#F7C8D8'; ctx.fillRect(cx - cw / 2, 70, cw, 42);
      ctx.fillStyle = '#fff'; for (let x = cx - cw / 2; x < cx + cw / 2 - 4; x += 20) { ctx.beginPath(); ctx.arc(x + 10, 72, 10, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = '#0B3D91'; ctx.font = 'bold 14px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${CONFIG.nome.toUpperCase()} · ${CONFIG.idade}`, cx, 102);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(cx - cw / 2 - 20, 160, cw + 40, 6);
      candles.forEach((c, k) => {
        const x = candleX(k);
        ctx.fillStyle = k % 2 ? '#38E1FF' : '#FF8A3D'; ctx.fillRect(x - 3, 42, 6, 28);
        ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(x, 42); ctx.lineTo(x, 37); ctx.stroke();
        if (c.lit) {
          const f = Math.sin(t / 90 + k) * 1.5;
          const g = ctx.createRadialGradient(x, 30, 1, x, 30, 14); g.addColorStop(0, 'rgba(255,220,120,.8)'); g.addColorStop(1, 'rgba(255,200,80,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 30, 14, 0, 7); ctx.fill();
          ctx.fillStyle = '#FFD60A'; ctx.beginPath(); ctx.ellipse(x + f * .3, 30, 3.5, 7 + f, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, 32, 1.5, 3, 0, 0, 7); ctx.fill();
        } else if (c.smoke > 0) {
          ctx.globalAlpha = c.smoke; ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(x + Math.sin(t / 200) * 3, 30 - (1 - c.smoke) * 25, 3 + (1 - c.smoke) * 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; c.smoke -= 0.015;
        }
      });
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    function blowOut(k) { const c = candles[k]; if (!c || !c.lit) return; c.lit = false; c.smoke = 1; Sound.beep(300 + k * 40, 0.08, 'sine', 0.05); buzz(10); }
    function check() {
      const left = candles.filter(c => c.lit).length;
      $('[data-o="hint"]', body).textContent = left ? `Faltam ${left} velas…` : '✨ Pedido registrado no banco de dados do universo! ✨';
      if (!left && !body.dataset.done) { body.dataset.done = 1; Confetti(240); Ach.unlock('velas'); Sound.birthday(); buzz([30, 40, 30, 40, 80]); }
    }
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      if (y > 95) return;
      let best = -1, bd = 1e9; candles.forEach((c, k) => { const d = Math.abs(candleX(k) - x); if (c.lit && d < bd) { bd = d; best = k; } });
      if (best >= 0 && bd < 16) blowOut(best); check();
    });
    $('[data-a="blow"]', body).onclick = () => {
      const lit = candles.map((c, k) => c.lit ? k : -1).filter(k => k >= 0).sort(() => Math.random() - .5);
      lit.slice(0, 2 + Math.floor(Math.random() * 3)).forEach((k, j) => setTimeout(() => { blowOut(k); check(); }, j * 90));
      if (!lit.length) check();
    };
    $('[data-a="song"]', body).onclick = () => Sound.birthday();
    $('[data-a="party"]', body).onclick = () => { Confetti(); Sound.chime(); buzz(20); };
    setTimeout(() => Confetti(140), 500);
    return () => { clearInterval(typer); cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  },
};

/* ---------- 7.7 TEMAS ---------- */
APPS.themes = {
  name: 'Temas', icon: '🎨', sheet: true, tile: ['#FF2E97', '#00F0FF'], w: 560, h: 480,
  render(body) {
    const paint = () => {
      body.innerHTML = `<p class="muted small" style="margin-top:0">Atalho: 🎨 na barra de status ou <b>tema &lt;nome&gt;</b> no terminal.</p>
      <div class="theme-grid">${THEMES.map(t => {
        const locked = t.secret && !Ach.got.konami;
        return `<button class="theme-card ${Theme.current === t.id ? 'on' : ''} ${locked ? 'locked' : ''}" data-t="${t.id}">
          <div class="pv" style="background:${t.cols[0]}">${t.cols.slice(1).map(c => `<i style="background:${c}"></i>`).join('')}</div>
          <div class="nm">${locked ? '🔒 ???' : esc(t.name.replace(' 🔒', ''))}${Theme.current === t.id ? ' ✓' : ''}</div></button>`; }).join('')}</div>`;
      $$('.theme-card', body).forEach(b => b.onclick = () => { if (Theme.set(b.dataset.t)) { Sound.click(); buzz(6); paint(); } });
    };
    paint();
    const fn = () => paint(); document.addEventListener('theme', fn);
    return () => document.removeEventListener('theme', fn);
  },
};

/* ---------- 7.8 CONQUISTAS ---------- */
APPS.trophies = {
  name: 'Conquistas', icon: '🏆', tile: ['#FFD60A', '#AB5236'], w: 480, h: 600,
  render(body) {
    const paint = () => {
      const total = Object.keys(ACHIEVEMENTS).length; const lb = store.get('landerBest', null);
      body.innerHTML = `<div class="card">
          <div class="row between"><span class="h" style="margin:0">PROGRESSO</span><b class="stat"><b>${Ach.count()}/${total}</b></b></div>
          <div class="bar" style="margin-top:10px"><i style="width:${(Ach.count() / total) * 100}%"></i></div>
        </div>
        <div style="margin-top:8px">${Object.entries(ACHIEVEMENTS).map(([id, a]) => { const got = Ach.got[id]; const secret = id === 'konami' && !got;
          return `<div class="ach ${got ? '' : 'locked'}"><span class="a-ico">${secret ? '❓' : a.ico}</span><div><b>${secret ? '???' : esc(a.name)}</b><br><small class="muted">${secret ? 'Um código dos videogames clássicos… o ESPBoy tem um direcional 😉' : esc(a.desc)}</small></div></div>`; }).join('')}</div>
        <h3 class="h" style="margin-top:18px">RECORDES</h3>
        <div class="card">
          <div class="kv"><span class="muted">🚀 Foguete</span><b>${fmt(store.get('rocketBest', 0) / 1000)} km</b></div>
          <div class="kv"><span class="muted">🌙 Pouso lunar</span><b>${lb !== null ? fmt(lb) + '% de comb.' : '—'}</b></div>
          <div class="kv"><span class="muted">🔴 Rover</span><b>${fmt(store.get('roverBest', 0))} m</b></div>
          <div class="kv"><span class="muted">🏎️ 402 m</span><b>${store.get('dragBest', null) ? fmt(store.get('dragBest'), 2) + ' s' : '—'}</b></div>
        </div>`;
    };
    paint(); const fn = () => paint(); document.addEventListener('ach', fn);
    return () => document.removeEventListener('ach', fn);
  },
};

/* ---------- 7.9 PAOLÔMETRO ---------- */
const birth = () => new Date(CONFIG.nascimento);
function isBirthdayToday(d = new Date()) { const b = birth(); return d.getDate() === b.getDate() && d.getMonth() === b.getMonth(); }
function nextBirthday(d = new Date()) {
  const b = birth(); let n = new Date(d.getFullYear(), b.getMonth(), b.getDate());
  if (n < new Date(d.getFullYear(), d.getMonth(), d.getDate())) n = new Date(d.getFullYear() + 1, b.getMonth(), b.getDate());
  return n;
}
const fmtDate = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
APPS.age = {
  name: 'Paolômetro', icon: '⏱️', tile: ['#29ADFF', '#1D2B53'], w: 520, h: 660,
  render(body) {
    Ach.unlock('relogio');
    body.innerHTML = `<div class="col">
      <div class="card center">
        <div class="h" style="margin:0 0 8px">SEGUNDOS DE VIDA</div>
        <div class="big-counter" data-o="sec">—</div>
        <div class="muted small" style="margin-top:6px">desde ${fmtDate(birth())} · ao vivo</div>
      </div>
      <div class="card" data-o="next"></div>
      <div class="facts" data-o="facts"></div>
      <p class="muted small">Contas aproximadas, feitas com médias (coração a ~80 bpm, 16 respirações por minuto). A data de nascimento fica no CONFIG, no topo do app.js.</p>
    </div>`;
    const b = birth(); const o = k => $(`[data-o="${k}"]`, body);
    const big = n => n >= 1e9 ? fmt(n / 1e9, 2) + ' bi' : n >= 1e6 ? fmt(n / 1e6, 1) + ' mi' : fmt(n);
    function paint() {
      const now = new Date(); const sec = Math.max(0, (now - b) / 1000); const days = sec / 86400; const years = days / 365.2422;
      o('sec').textContent = fmt(Math.floor(sec));
      const facts = [
        ['📅', fmt(Math.floor(days)), 'dias de vida'],
        ['⏰', fmt(Math.floor(sec / 3600)), 'horas'],
        ['❤️', '≈ ' + big(sec * 80 / 60), 'batidas do coração'],
        ['🫁', '≈ ' + big(sec * 16 / 60), 'respirações'],
        ['☀️', big(sec * 29.78), 'km viajados em volta do Sol'],
        ['🌍', fmt(Math.floor(days)), 'giros da Terra (dias!)'],
        ['🔴', fmt(years / 1.8808, 2), 'anos em Marte'],
        ['🪐', fmt(years / 11.862, 2), 'anos em Júpiter'],
        ['☿️', fmt(years / 0.2408, 1), 'anos em Mercúrio'],
        ['🌕', fmt(Math.floor(days / 27.32)), 'voltas da Lua na Terra'],
        ['🛰️', fmt(Math.floor(sec / 5556)), 'voltas da ISS na Terra'],
        ['🚀', big(sec * 17), 'km que a Voyager 1 andou nesse tempo'],
      ];
      o('facts').innerHTML = facts.map(([e, v, l]) => `<div class="card stat"><span class="e">${e}</span><b>${v}</b><span>${l}</span></div>`).join('');
      const nb = nextBirthday(now); const dleft = Math.round((nb - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
      const m500 = new Date(b.getTime() + 500e6 * 1000); const d5000 = new Date(b.getTime() + 5000 * 864e5);
      o('next').innerHTML = `
        <div class="kv"><span>${isBirthdayToday(now) ? '🎉 <b>É HOJE! Feliz aniversário!</b>' : `🎂 Faltam <b>${dleft}</b> dias para os ${CONFIG.idade + 1}`}</span></div>
        <div class="kv"><span class="muted">⏳ 500.000.000 de segundos</span><b>${m500 < now ? 'já foi!' : fmtDate(m500)}</b></div>
        <div class="kv"><span class="muted">🗓️ 5.000 dias de vida</span><b>${d5000 < now ? 'já foi!' : fmtDate(d5000)}</b></div>`;
    }
    paint(); const iv = setInterval(paint, 1000);
    return () => clearInterval(iv);
  },
};

/* ---------- 7.10 EAGLE LANDER ---------- */
APPS.lander = {
  name: 'Eagle Lander', short: 'Lander', icon: '🌙', flush: true, tile: ['#C2C3C7', '#1D2B53'], w: 780, h: 600,
  render(body, api) {
    const best0 = store.get('landerBest', null);
    body.innerHTML = `
      <div class="game-col">
        <div class="hud">
          <div class="card stat"><b data-o="alt">0</b><span>alt m</span></div>
          <div class="card stat"><b data-o="vv">0</b><span>desce m/s</span></div>
          <div class="card stat"><b data-o="vh">0</b><span>lado m/s</span></div>
          <div class="card stat"><span>combustível</span><div class="bar" style="margin-top:6px"><i data-o="fuel" style="width:100%"></i></div></div>
        </div>
        <canvas class="game"></canvas>
        <p class="muted small center" style="margin:0">Pouse no alvo amarelo devagar (menos de 2 m/s) e com a nave reta. Recorde: <b data-o="best">${best0 !== null ? fmt(best0) + '% comb.' : '—'}</b></p>
        <div class="btn-row three">
          <button class="ctl" data-a="l" aria-label="Girar para a esquerda">⟲</button>
          <button class="ctl go" data-a="t" aria-label="Motor">🔥 MOTOR</button>
          <button class="ctl" data-a="r" aria-label="Girar para a direita">⟳</button>
        </div>
      </div>`;
    const cv = $('canvas', body); const o = id => $(`[data-o="${id}"]`, body);
    let ctx, W = 0, H = 0, k = 2, s = null, ter = [], pad = null, stars = [], raf = 0, last = 0;
    const keys = { l: false, r: false, t: false };
    const G = 1.62, THR = 4.2, WARP = 1.7;
    function resize() { const r = cv.getBoundingClientRect(); ({ ctx, W, H } = fitCanvas(cv, Math.max(220, Math.round(r.height) || 320))); k = H / 230; if (!s || s.over) newGame(); }
    function newGame() {
      const N = 12, padI = 2 + Math.floor(Math.random() * (N - 5)); ter = [];
      for (let i = 0; i <= N; i++) ter.push([W * i / N, H * (0.66 + Math.random() * 0.26)]);
      ter[padI + 1][1] = ter[padI + 2][1] = ter[padI][1];
      pad = { x1: ter[padI][0], x2: ter[padI + 2][0], y: ter[padI][1] };
      stars = Array.from({ length: 60 }, () => [Math.random() * W, Math.random() * H * 0.7, Math.random()]);
      const left = (pad.x1 + pad.x2) / 2 > W / 2;
      s = { x: W * (left ? 0.12 : 0.88), y: H * 0.08, vx: (left ? 1 : -1) * 4 * k, vy: 0, a: 0, fuel: 100, over: false, ok: false, burn: false, boom: 0 };
    }
    function groundAt(x) {
      for (let i = 0; i < ter.length - 1; i++) { const [x1, y1] = ter[i], [x2, y2] = ter[i + 1]; if (x >= x1 && x <= x2) return lerp(y1, y2, (x - x1) / (x2 - x1 || 1)); }
      return H;
    }
    function update(dt) {
      if (!s || s.over) { if (s && s.boom > 0) s.boom -= dt; return; }
      dt *= WARP;
      if (keys.l) s.a -= 1.8 * dt; if (keys.r) s.a += 1.8 * dt; s.a = clamp(s.a, -1.6, 1.6);
      s.burn = keys.t && s.fuel > 0;
      if (s.burn) { s.fuel = Math.max(0, s.fuel - 7 * dt); s.vx += Math.sin(s.a) * THR * k * dt; s.vy -= Math.cos(s.a) * THR * k * dt; }
      s.vy += G * k * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 0) s.x += W; if (s.x > W) s.x -= W; if (s.y < 12) { s.y = 12; s.vy = Math.max(0, s.vy); }
      if (s.y + 10 >= groundAt(s.x)) {
        s.over = true; s.burn = false;
        const vv = s.vy / k, vh = Math.abs(s.vx / k), onPad = s.x - 10 >= pad.x1 && s.x + 10 <= pad.x2;
        s.ok = onPad && vv < 2.2 && vh < 1.5 && Math.abs(s.a) < 0.22;
        if (s.ok) {
          s.y = pad.y - 10; s.a = 0; const f = Math.round(s.fuel); const prev = store.get('landerBest', null);
          if (prev === null || f > prev) { store.set('landerBest', f); o('best').textContent = fmt(f) + '% comb.'; }
          Ach.unlock('eagle'); Confetti(160); Sound.chime(); buzz([20, 40, 20]);
          toast('The Eagle has landed!', `Pouso perfeito · sobrou ${f}% de combustível${prev === null || f > prev ? ' · RECORDE!' : ''}`, '🦅');
        } else {
          s.boom = 1.2; Sound.error(); buzz(120);
          toast('Perdemos o Eagle 💥', !onPad ? 'Errou o alvo amarelo.' : vv >= 2.2 ? `Desceu rápido demais (${fmt(vv, 1)} m/s).` : vh >= 1.5 ? 'Estava indo de lado.' : 'A nave estava torta.', '💥');
        }
      }
    }
    function draw(t) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      stars.forEach(([x, y, p]) => { ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t / 900 + p * 9)); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1.5, 1.5); }); ctx.globalAlpha = 1;
      // a Terra no céu (Earthrise!)
      const ex = W * 0.8, ey = H * 0.15; ctx.fillStyle = '#1E5BB8'; ctx.beginPath(); ctx.arc(ex, ey, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#3DBE5A'; ctx.beginPath(); ctx.arc(ex - 4, ey - 3, 5, 0, 7); ctx.arc(ex + 5, ey + 4, 3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.arc(ex + 6, ey, 13, -Math.PI / 2, Math.PI / 2); ctx.fill();
      // solo
      ctx.fillStyle = '#6e6e6e'; ctx.beginPath(); ctx.moveTo(0, H); ter.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(W, H); ctx.fill();
      ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 2; ctx.beginPath(); ter.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      // alvo
      ctx.fillStyle = '#FFEC27'; ctx.fillRect(pad.x1, pad.y - 2, pad.x2 - pad.x1, 4);
      if ((t / 400 | 0) % 2) { ctx.fillRect(pad.x1, pad.y - 10, 2, 8); ctx.fillRect(pad.x2 - 2, pad.y - 10, 2, 8); }
      // nave
      if (s.boom > 0 && !s.ok) {
        const r = (1.2 - s.boom) * 40; ctx.fillStyle = `rgba(255,${120 + r * 2 | 0},0,${s.boom / 1.2})`; ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, 7); ctx.fill();
      } else if (!(s.over && !s.ok)) {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
        if (s.burn) { const fl = rand(8, 18); const g = ctx.createLinearGradient(0, 6, 0, 6 + fl); g.addColorStop(0, '#fff'); g.addColorStop(.4, '#FFD60A'); g.addColorStop(1, 'rgba(255,80,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(4, 6); ctx.lineTo(0, 6 + fl); ctx.fill(); }
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(-12, 10); ctx.moveTo(8, 5); ctx.lineTo(12, 10); ctx.moveTo(-14, 10); ctx.lineTo(-10, 10); ctx.moveTo(10, 10); ctx.lineTo(14, 10); ctx.stroke();
        ctx.fillStyle = '#D4AF37'; ctx.fillRect(-9, 0, 18, 6);
        ctx.fillStyle = '#E6E6E6'; ctx.fillRect(-7, -9, 14, 10);
        ctx.fillStyle = '#1D2B53'; ctx.fillRect(-3, -7, 6, 4);
        ctx.restore();
      }
      if (s.over) {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H / 2 - 34, W, 62); ctx.textAlign = 'center';
        ctx.fillStyle = s.ok ? '#FFEC27' : '#FF4D6D'; ctx.font = '12px "Press Start 2P", monospace'; ctx.fillText(s.ok ? 'POUSO PERFEITO!' : 'NAVE PERDIDA', W / 2, H / 2 - 6);
        ctx.fillStyle = '#fff'; ctx.font = '12px JetBrains Mono, monospace'; ctx.fillText('toque para tentar de novo', W / 2, H / 2 + 16); ctx.textAlign = 'left';
      }
      const alt = Math.max(0, (groundAt(s.x) - s.y - 10) / k);
      o('alt').textContent = fmt(alt); o('vv').textContent = fmt(s.vy / k, 1); o('vh').textContent = fmt(Math.abs(s.vx / k), 1);
      o('vv').style.color = s.vy / k < 2.2 ? 'var(--ok)' : 'var(--danger)';
      o('fuel').style.width = s.fuel + '%';
    }
    function loop(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; if (H && s) { update(dt); draw(t); } raf = requestAnimationFrame(loop); }
    requestAnimationFrame(() => { resize(); newGame(); raf = requestAnimationFrame(loop); });
    addEventListener('resize', resize);
    const restartIfOver = () => { if (s && s.over && (s.ok || s.boom <= 0.4)) { newGame(); return true; } return false; };
    [['l', 'l'], ['r', 'r'], ['t', 't']].forEach(([a, key]) => holdButton($(`[data-a="${a}"]`, body), () => { if (!restartIfOver()) keys[key] = true; }, () => { keys[key] = false; }));
    cv.addEventListener('pointerdown', restartIfOver);
    api.onKey((e, d) => {
      const v = d === 'down';
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.l = v; e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.r = v; e.preventDefault(); }
      if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) { if (v && restartIfOver()) return; keys.t = v; e.preventDefault(); }
    });
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  },
};

/* ---------- 7.11 PIXEL MAKER ---------- */
const PICO = ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA']; /* paleta PICO-8 */
const SPRITE_ROCKET = [
  '.......88.......', '......8888......', '......7777......', '.....777777.....',
  '.....77cc77.....', '.....7cccc7.....', '.....77cc77.....', '.....777777.....',
  '.....111111.....', '.....777777.....', '....87777778....', '...8877777788...',
  '...88.5555.88...', '......9aa9......', '.......99.......', '.......88.......'];
APPS.pixel = {
  name: 'Pixel Maker', short: 'Pixel', icon: '👾', tile: ['#83769C', '#1D2B53'], w: 440, h: 720,
  render(body) {
    const N = 16;
    let grid = store.get('pixel', null); if (!Array.isArray(grid) || grid.length !== N * N) grid = Array(N * N).fill(-1);
    let color = 8, tool = 'pen', down = false;
    body.innerHTML = `<div class="col">
      <canvas class="pix" aria-label="Tela de pixel art 16 por 16"></canvas>
      <div class="palette">${PICO.map((c, i) => `<button class="pal" data-i="${i}" style="background:${c}" aria-label="Cor ${i}"></button>`).join('')}</div>
      <div class="seg" data-k="tool"><button data-v="pen">✏️ Lápis</button><button data-v="fill">🪣 Balde</button><button data-v="erase">🧽 Apagar</button></div>
      <div class="btn-row"><button class="btn ghost" data-a="tpl">🚀 Modelo</button><button class="btn ghost" data-a="clear">🗑️ Limpar</button>
        <button class="btn" data-a="png">💾 Salvar PNG</button><button class="btn alt" data-a="code">⌁ Código C</button></div>
      <p class="muted small" style="margin:0">O desenho fica salvo neste aparelho. <b>Código C</b> copia o sprite como um array RGB565, o formato que telinhas TFT (como a do ESPBoy) usam com a TFT_eSPI: <code>tft.pushImage(x, y, 16, 16, sprite)</code>.</p>
    </div>`;
    const cv = $('canvas', body); let ctx, W;
    const resize = () => { const w = cv.clientWidth || 300; ({ ctx, W } = fitCanvas(cv, w)); draw(); };
    function draw() {
      if (!ctx) return; const c = W / N;
      for (let i = 0; i < N * N; i++) {
        const x = (i % N) * c, y = Math.floor(i / N) * c;
        ctx.fillStyle = grid[i] >= 0 ? PICO[grid[i]] : (((i % N) + Math.floor(i / N)) % 2 ? '#2a2a33' : '#33333d');
        ctx.fillRect(x, y, c + 0.5, c + 0.5);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 1; i < N; i++) { ctx.moveTo(i * c, 0); ctx.lineTo(i * c, W); ctx.moveTo(0, i * c); ctx.lineTo(W, i * c); } ctx.stroke();
    }
    function save() { store.set('pixel', grid); if (grid.filter(v => v >= 0).length >= 40) Ach.unlock('artista'); }
    function cellAt(e) { const r = cv.getBoundingClientRect(); const cx = Math.floor((e.clientX - r.left) / r.width * N), cy = Math.floor((e.clientY - r.top) / r.height * N); return cx >= 0 && cy >= 0 && cx < N && cy < N ? cy * N + cx : -1; }
    function fill(i, to) { const from = grid[i]; if (from === to) return; const q = [i]; while (q.length) { const j = q.pop(); if (grid[j] !== from) continue; grid[j] = to; const x = j % N, y = Math.floor(j / N); if (x > 0) q.push(j - 1); if (x < N - 1) q.push(j + 1); if (y > 0) q.push(j - N); if (y < N - 1) q.push(j + N); } }
    function act(e, first) {
      const i = cellAt(e); if (i < 0) return;
      if (tool === 'fill') { if (first) { fill(i, color); Sound.beep(700, 0.05); } }
      else { const v = tool === 'erase' ? -1 : color; if (grid[i] !== v) { grid[i] = v; Sound.beep(tool === 'erase' ? 300 : 900 + (i % 16) * 30, 0.02, 'square', 0.02); } }
      draw();
    }
    cv.addEventListener('pointerdown', e => { e.preventDefault(); down = true; try { cv.setPointerCapture(e.pointerId); } catch { /* ok */ } act(e, true); });
    cv.addEventListener('pointermove', e => { if (down) act(e, false); });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if (down) { down = false; save(); } }));
    const paintUI = () => {
      $$('.pal', body).forEach(b => b.classList.toggle('on', +b.dataset.i === color && tool !== 'erase'));
      $$('[data-k="tool"] button', body).forEach(b => b.classList.toggle('on', b.dataset.v === tool));
    };
    $$('.pal', body).forEach(b => b.onclick = () => { color = +b.dataset.i; if (tool === 'erase') tool = 'pen'; Sound.click(); paintUI(); });
    $$('[data-k="tool"] button', body).forEach(b => b.onclick = () => { tool = b.dataset.v; Sound.click(); paintUI(); });
    $('[data-a="tpl"]', body).onclick = () => { grid = SPRITE_ROCKET.join('').padEnd(N * N, '.').slice(0, N * N).split('').map(ch => ch === '.' ? -1 : parseInt(ch, 16)); draw(); save(); Sound.chime(); };
    $('[data-a="clear"]', body).onclick = () => { grid = Array(N * N).fill(-1); draw(); save(); Sound.beep(200, 0.1); };
    $('[data-a="png"]', body).onclick = () => {
      const S = 16, out = document.createElement('canvas'); out.width = out.height = N * S; const c2 = out.getContext('2d');
      grid.forEach((v, i) => { if (v >= 0) { c2.fillStyle = PICO[v]; c2.fillRect((i % N) * S, Math.floor(i / N) * S, S, S); } });
      out.toBlob(async blob => {
        if (!blob) return; const file = new File([blob], 'paolo-sprite.png', { type: 'image/png' });
        try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Meu sprite — PaoloOS' }); return; } } catch { /* cancelou ou não suporta */ }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'paolo-sprite.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast('PNG salvo!', 'paolo-sprite.png (256×256)', '💾');
      }, 'image/png');
    };
    $('[data-a="code"]', body).onclick = async () => {
      const hex = grid.map(v => { if (v < 0) return '0xF81F'; const n = parseInt(PICO[v].slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
        return '0x' + (((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)).toString(16).toUpperCase().padStart(4, '0'); });
      const rows = []; for (let i = 0; i < N; i++) rows.push('  ' + hex.slice(i * N, i * N + N).join(', '));
      const code = `// Sprite 16x16 feito no PaoloOS (RGB565). 0xF81F = transparente\nconst uint16_t sprite[256] PROGMEM = {\n${rows.join(',\n')}\n};\n// tft.pushImage(x, y, 16, 16, sprite, 0xF81F);\n`;
      let ok = false;
      try { await navigator.clipboard.writeText(code); ok = true; } catch {
        const ta = document.createElement('textarea'); ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; } ta.remove();
      }
      ok ? toast('Código copiado!', 'Cole no seu sketch .ino 🛠️', '⌁') : toast('Não deu para copiar', 'Seu navegador bloqueou a área de transferência.', '⚠️');
      Sound.chime();
    };
    requestAnimationFrame(resize); addEventListener('resize', resize); paintUI();
    return () => removeEventListener('resize', resize);
  },
};

/* ---------- 7.12 FESTA ---------- */
let partyUntil = 0;
APPS.party = {
  name: 'Festa!', icon: '🎉', tile: ['#FFEC27', '#FF004D'],
  action() {
    Confetti(260); buzz([40, 60, 40, 60, 120]); Ach.unlock('festa');
    if (performance.now() > partyUntil) partyUntil = performance.now() + Sound.birthday() * 1000;
    toast(`PARABÉNS, ${CONFIG.nome.toUpperCase()}!`, `${CONFIG.idade} anos de missão 🚀`, '🎉');
  },
};

/* =========================================================
   8. HOME, DESKTOP E RELÓGIO
   ========================================================= */
const HOME_SECTIONS = [
  ['Aniversário', ['letter', 'age', 'party']],
  ['Jogos', ['rocket', 'lander', 'rover', 'garage', 'espboy']],
  ['Maker', ['pixel', 'terminal']],
  ['Sistema', ['themes', 'trophies']],
];
const DOCK = ['letter', 'rocket', 'espboy', 'terminal'];
function appBtn(id) {
  const a = APPS[id]; const [c1, c2] = a.tile || ['#38E1FF', '#0B3D91'];
  return `<button class="app" data-app="${id}" aria-label="${esc(a.name)}"><span class="tile" style="--c1:${c1};--c2:${c2}">${a.icon}</span><span class="lbl">${esc(a.short || a.name)}</span></button>`;
}
function buildHome() {
  $('#home-scroll').innerHTML = `
    <button class="w-bday" data-app="letter" aria-label="Abrir a mensagem de aniversário">
      <div class="orbit"></div><div class="planet"></div>
      <div class="k">${isBirthdayToday() ? '★ HOJE É O DIA ★' : '★ MISSÃO ANIVERSÁRIO ★'}</div>
      <div class="big">${CONFIG.idade}</div>
      <div class="t">FELIZ ANIVERSÁRIO,<br>${esc(CONFIG.nome.toUpperCase())}!</div>
      <div class="s">📡 Transmissão de ${esc(CONFIG.de)} · toque para abrir ▶</div>
    </button>
    <div class="widget-row">
      <button class="widget" data-app="age"><span class="k">SEGUNDOS DE VIDA</span><span class="v" data-w="sec">—</span><span class="u">e contando… ⏱️</span></button>
      <button class="widget" data-app="trophies"><span class="k">CONQUISTAS</span><span class="v" data-w="ach">0</span><span class="bar"><i data-w="achbar"></i></span></button>
    </div>
    ${HOME_SECTIONS.map(([lbl, ids]) => `<h2 class="sec-label">${lbl}</h2><div class="app-grid">${ids.map(appBtn).join('')}</div>`).join('')}
    <p class="muted small center" style="margin-top:30px;opacity:.7">PaoloOS 13 · HTML + CSS + JavaScript puro<br>${esc(CONFIG.site.replace(/^https?:\/\//, ''))}</p>`;
  $('#dock').innerHTML = DOCK.map(appBtn).join('');
  $$('[data-app]', $('#home')).forEach(b => b.addEventListener('click', () => Nav.open(b.dataset.app)));
  if (innerWidth >= 900) {
    const sw = h(`<p class="center"><button class="btn ghost">🖥️ Ver versão desktop</button></p>`);
    $('button', sw).onclick = () => switchMode('desktop'); $('#home-scroll').appendChild(sw);
  }
  paintHome();
}

const DESK_ORDER = ['letter', 'rocket', 'lander', 'rover', 'garage', 'espboy', 'pixel', 'terminal', 'age', 'party', 'themes', 'trophies'];
function buildDesktop() {
  const icons = $('#icons'); icons.innerHTML = '';
  DESK_ORDER.forEach(id => {
    const a = APPS[id]; const b = h(`<button class="icon" data-app="${id}" title="${esc(a.name)}"><span class="ico">${a.icon}</span><span class="lbl">${esc(a.name)}</span></button>`);
    b.addEventListener('click', () => WM.open(id)); icons.appendChild(b);
  });
  $('#desktop').appendChild(h(`<div class="desk-banner"><div class="big">FELIZ ${CONFIG.idade}, ${esc(CONFIG.nome.toUpperCase())}!</div><div class="small">Mission Control · Ano ${CONFIG.idade}</div></div>`));
  const list = $('#start-list'); list.innerHTML = '';
  DESK_ORDER.forEach(id => { const li = h(`<li><button>${APPS[id].icon} ${esc(APPS[id].name)}</button></li>`); $('button', li).onclick = () => WM.open(id); list.appendChild(li); });
  const mob = h(`<li><button>📱 Versão celular</button></li>`); $('button', mob).onclick = () => switchMode('mobile'); list.appendChild(mob);
  const rb = h(`<li><button>🔄 Reiniciar (boot)</button></li>`); $('button', rb).onclick = () => location.reload(); list.appendChild(rb);
  $('#start-btn').addEventListener('click', e => { e.stopPropagation(); Sound.click(); $('#start-menu').classList.toggle('hidden'); });
  document.addEventListener('click', e => { if (!e.target.closest('#start-menu')) $('#start-menu').classList.add('hidden'); });
  $('#theme-btn-d').addEventListener('click', () => Theme.next());
  paintHome();
}

function paintHome() {
  const total = Object.keys(ACHIEVEMENTS).length;
  const a = $('[data-w="ach"]'); if (a) a.textContent = `${Ach.count()}/${total}`;
  const ab = $('[data-w="achbar"]'); if (ab) ab.style.width = (Ach.count() / total * 100) + '%';
  $$('[data-app="letter"].app, [data-app="letter"].icon').forEach(b => {
    const has = $('.badge', b); const unread = !store.get('letterRead', false);
    if (unread && !has) b.insertAdjacentHTML('beforeend', '<span class="badge">1</span>'); else if (!unread && has) has.remove();
  });
}
function tick() {
  const d = new Date(); const t = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  $$('.js-clock').forEach(c => { c.textContent = t; });
  const w = $('[data-w="sec"]'); if (w) w.textContent = fmt(Math.floor((d - birth()) / 1000));
}
document.addEventListener('ach', paintHome);

$('#theme-btn').addEventListener('click', () => Nav.open('themes'));
const paintSound = () => $$('.js-sound').forEach(b => { b.textContent = Sound.on ? '🔊' : '🔇'; });
$$('.js-sound').forEach(b => b.addEventListener('click', () => { Sound.on = !Sound.on; store.set('sound', Sound.on); paintSound(); Sound.click(); buzz(6); }));
paintSound();

/* =========================================================
   9. BOOT
   ========================================================= */
(function boot() {
  Theme.set(Theme.current) || Theme.set('mission');
  if (DESKTOP) {
    $('.boot-sub').textContent = 'Mission Control Edition';
    $('#boot-start').textContent = '▶ INICIAR MISSÃO';
    $('.boot-hint').innerHTML = 'Clique ou aperte <kbd>Enter</kbd>';
  }
  const log = $('#boot-log');
  const lines = DESKTOP ? [
    'PaoloOS BIOS v13.0 — (c) Mission Control Labs',
    'CPU: ESP32 dual-core @ 240 MHz ............ OK',
    'RAM: 520 KB (Apollo AGC tinha ~4 KB) ...... OK',
    'Display TFT 1.44" @ 3,3 V ................. OK',
    'Joystick analógico (-1000..+1000) ......... OK',
    'Carregando módulos: rocket.lab  lander  mars.rover  garage.gt  espboy.sim  pixel',
    'Sincronizando com Houston ................. OK',
    `Detectado: comandante ${CONFIG.nome.toUpperCase()} · idade ${CONFIG.idade}`,
    'Status do aniversário ..................... GO',
    '',
    'TODOS OS SISTEMAS: GO PARA LANÇAMENTO',
  ] : [
    'PaoloOS BIOS v13.0',
    '(c) Mission Control Labs',
    '',
    'CPU ESP32 @240MHz ....... OK',
    'RAM 520KB (AGC: 4KB) .... OK',
    'TFT 1.44" @3,3V ......... OK',
    'JOYSTICK ................ OK',
    'MÓDULOS: rocket lander rover',
    '         garage espboy pixel',
    'LINK COM HOUSTON ........ OK',
    `COMANDANTE: ${CONFIG.nome.toUpperCase()} · ${CONFIG.idade} ANOS`,
    'ANIVERSÁRIO ............. GO',
    '',
    '>> GO PARA LANÇAMENTO',
  ];
  let i = 0, skip = false, entered = false;
  function next() {
    if (skip) return;
    if (i < lines.length) { log.textContent += lines[i++] + '\n'; setTimeout(next, i < 3 ? 240 : 150); }
    else showLogo();
  }
  function showLogo() { $('#boot-logo').classList.remove('hidden'); }
  function enter() {
    if (entered) return;
    if ($('#boot-logo').classList.contains('hidden')) { skip = true; log.textContent = lines.join('\n') + '\n'; showLogo(); return; }
    entered = true;
    Sound.init(); Sound.chime(); buzz(20);
    $('#boot').classList.add('hidden');
    if (DESKTOP) {
      $('#desktop').classList.remove('hidden'); $('#taskbar').classList.remove('hidden');
      buildDesktop(); tick(); setInterval(tick, 1000);
      Ach.unlock('ignicao');
      setTimeout(() => WM.open('letter'), 500);
    } else {
      $('#home').classList.remove('hidden');
      try { history.replaceState({ p13: 0 }, ''); } catch { Nav.hist = false; }
      buildHome(); tick(); setInterval(tick, 1000);
      Ach.unlock('ignicao');
      if (!store.get('letterRead', false)) setTimeout(() => Nav.open('letter'), 700);
    }
    removeEventListener('keydown', onKey);
  }
  const onKey = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } };
  $('#boot').addEventListener('click', enter);
  addEventListener('keydown', onKey);
  setTimeout(next, 250);
})();
