'use strict';
/* =====================================================================
   Efeitos: sons sintetizados (Web Audio, sem arquivos), animações,
   confete e contadores.
   ===================================================================== */
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const Sfx = {
  ctx: null, master: null,
  on: localStorage.getItem('lousa:sound') !== 'off',
  set(v) { this.on = v; localStorage.setItem('lousa:sound', v ? 'on' : 'off'); if (v) this.play('toggle'); },
  ac() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = 1.6; const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.12; this.master.connect(comp); comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone({ f = 440, f2 = null, type = 'sine', d = 0.12, v = 0.2, at = 0, attack = 0.006 }) {
    const c = this.ac(); if (!c) return; const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.03);
  },
  noise({ d = 0.18, v = 0.12, f = 1200, f2 = 3000, at = 0, q = 1.2 }) {
    const c = this.ac(); if (!c) return; const t = c.currentTime + at;
    const len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f, t); bp.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(bp); bp.connect(g); g.connect(this.master); s.start(t); s.stop(t + d);
  },
  play(name, arg) {
    if (!this.on) return;
    try {
      switch (name) {
        case 'tap': this.tone({ f: 640, f2: 420, d: 0.07, v: 0.09, type: 'sine' }); break;
        case 'toggle': this.tone({ f: 880, d: 0.05, v: 0.08, type: 'triangle' }); this.tone({ f: 1320, d: 0.06, v: 0.06, type: 'triangle', at: 0.045 }); break;
        case 'select': this.tone({ f: 520, f2: 760, d: 0.08, v: 0.11, type: 'triangle' }); break;
        case 'open': this.noise({ d: 0.16, v: 0.07, f: 600, f2: 2600 }); this.tone({ f: 420, f2: 660, d: 0.12, v: 0.05 }); break;
        case 'close': this.noise({ d: 0.12, v: 0.05, f: 2400, f2: 700 }); break;
        case 'create': this.tone({ f: 330, f2: 990, d: 0.1, v: 0.14, type: 'sine' }); this.tone({ f: 1480, d: 0.06, v: 0.06, type: 'triangle', at: 0.07 }); break;
        case 'delete': this.tone({ f: 420, f2: 110, d: 0.16, v: 0.13, type: 'triangle' }); this.noise({ d: 0.1, v: 0.04, f: 900, f2: 300 }); break;
        case 'undo': this.tone({ f: 700, f2: 520, d: 0.06, v: 0.08, type: 'triangle' }); this.tone({ f: 520, f2: 400, d: 0.06, v: 0.07, type: 'triangle', at: 0.06 }); break;
        case 'redo': this.tone({ f: 520, f2: 700, d: 0.06, v: 0.08, type: 'triangle' }); this.tone({ f: 700, f2: 900, d: 0.06, v: 0.07, type: 'triangle', at: 0.06 }); break;
        case 'pop': this.tone({ f: 900, f2: 1400, d: 0.06, v: 0.1, type: 'sine' }); break;
        case 'magic': [784, 988, 1175, 1568].forEach((f, i) => this.tone({ f, d: 0.12, v: 0.07, type: 'triangle', at: i * 0.05 })); break;
        case 'correct': this.tone({ f: 1047, d: 0.13, v: 0.16, type: 'triangle' }); this.tone({ f: 1319, d: 0.22, v: 0.16, type: 'triangle', at: 0.09 }); this.tone({ f: 2637, d: 0.18, v: 0.03, type: 'sine', at: 0.12 }); break;
        case 'wrong': this.tone({ f: 220, f2: 160, d: 0.28, v: 0.12, type: 'sawtooth' }); this.tone({ f: 233, f2: 170, d: 0.28, v: 0.08, type: 'square', at: 0.01 }); break;
        case 'combo': { const n = Math.min(arg || 3, 10); [0, 1, 2].forEach(i => this.tone({ f: 660 * Math.pow(1.06, n + i * 3), d: 0.1, v: 0.09, type: 'triangle', at: i * 0.06 })); break; }
        case 'complete': [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, d: 0.18, v: 0.13, type: 'triangle', at: i * 0.11 })); [1047, 1319, 1568].forEach(f => this.tone({ f, d: 0.6, v: 0.07, type: 'sine', at: 0.46 })); break;
        case 'meh': [523, 494, 523].forEach((f, i) => this.tone({ f, d: 0.16, v: 0.1, type: 'triangle', at: i * 0.12 })); break;
        case 'xp': this.tone({ f: 1568, d: 0.05, v: 0.05, type: 'square' }); break;
        case 'whoosh': this.noise({ d: 0.22, v: 0.06, f: 400, f2: 3200, q: 0.8 }); break;
        case 'error': this.tone({ f: 180, d: 0.12, v: 0.1, type: 'square' }); this.tone({ f: 150, d: 0.16, v: 0.1, type: 'square', at: 0.1 }); break;
      }
    } catch { }
  }
};

const Fx = {
  /* confete em canvas */
  confetti(opts = {}) {
    if (reduceMotion()) return;
    const n = opts.n || 140, cv = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
    cv.className = 'fx-confetti'; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; document.body.append(cv);
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const cols = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#a5ed6e'];
    const ox = opts.x ?? innerWidth / 2, oy = opts.y ?? innerHeight * 0.35;
    const ps = Array.from({ length: n }, () => {
      const a = (opts.spread ? -Math.PI / 2 + (Math.random() - 0.5) * opts.spread : Math.random() * Math.PI * 2), sp = (opts.power || 9) * (0.4 + Math.random() * 0.8);
      return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: cols[(Math.random() * cols.length) | 0], shape: Math.random() < 0.5 };
    });
    const t0 = performance.now(), life = opts.life || 1800;
    const step = t => {
      const k = (t - t0) / life; c.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of ps) {
        p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        c.save(); c.globalAlpha = Math.max(0, 1 - k * k); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col;
        if (p.shape) c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { c.beginPath(); c.arc(0, 0, p.r / 1.4, 0, Math.PI * 2); c.fill(); }
        c.restore();
      }
      if (k < 1) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  },
  /* explosão pequena a partir de um elemento */
  burst(el, n = 26) { const r = el.getBoundingClientRect(); this.confetti({ n, x: r.left + r.width / 2, y: r.top + r.height / 2, power: 6, life: 900 }); },
  countUp(el, to, ms = 900, onTick) {
    if (reduceMotion()) { el.textContent = to; return; }
    const t0 = performance.now(); let last = -1;
    const step = t => { const k = Math.min(1, (t - t0) / ms), v = Math.round(to * (1 - Math.pow(1 - k, 3))); if (v !== last) { el.textContent = v; last = v; onTick?.(v); } if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  },
  /* reinicia uma animação CSS por classe */
  kick(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); el.addEventListener('animationend', () => el.classList.remove(cls), { once: true }); },
  /* entrada escalonada dos filhos */
  stagger(root, sel = ':scope > *', step = 55) { if (!root) return; [...root.querySelectorAll(sel)].forEach((el, i) => { el.style.setProperty('--i', i); el.classList.add('in-up'); el.style.animationDelay = (i * step) + 'ms'; }); }
};

/* ---------- XP e ofensiva (dias seguidos estudando) ---------- */
const Progress = {
  xp() { return +(localStorage.getItem('lousa:xp') || 0); },
  addXp(n) { const v = this.xp() + n; localStorage.setItem('lousa:xp', v); return v; },
  today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  streak() {
    const s = JSON.parse(localStorage.getItem('lousa:streak') || '{"days":0,"last":""}');
    const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    if (s.last !== this.today() && s.last !== ys) s.days = 0;
    return s;
  },
  practiced() {
    const s = this.streak(); if (s.last === this.today()) return { ...s, grew: false };
    s.days += 1; s.last = this.today(); localStorage.setItem('lousa:streak', JSON.stringify(s)); return { ...s, grew: true };
  }
};

/* ---------- som de toque em todos os botões ---------- */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest?.('button, a.pbtn, a.home-card, a.lvl, a.bitem, .tile, .swatch, select');
  if (!b || b.disabled || b.closest('[data-nosfx]') || b.dataset.nosfx != null) return;
  Sfx.play(b.classList.contains('swatch') ? 'pop' : 'tap');
}, true);
