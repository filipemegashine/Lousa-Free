'use strict';
/* ---------- tinta digital: renderização, suavização, reconhecimento ---------- */
const Ink = {
  bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  },
  length(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]); return L; },
  pathD(pts, ox = 0, oy = 0, sharp = false) {
    const P = (p) => r1(p[0] - ox) + ' ' + r1(p[1] - oy);
    if (sharp && pts.length > 1) return 'M' + pts.map(P).join('L');
    if (pts.length === 1) return `M${P(pts[0])}l0.01 0`;
    if (pts.length === 2) return `M${P(pts[0])}L${P(pts[1])}`;
    let d = `M${P(pts[0])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
      d += `Q${P(pts[i])} ${P(m)}`;
    }
    return d + `L${P(pts[pts.length - 1])}`;
  },
  chaikin(pts, it = 2) {
    if (pts.length < 3) return pts;
    let p = pts;
    for (let k = 0; k < it; k++) {
      const q = [p[0]];
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1];
        q.push([r1(a[0] * .75 + b[0] * .25), r1(a[1] * .75 + b[1] * .25)], [r1(a[0] * .25 + b[0] * .75), r1(a[1] * .25 + b[1] * .75)]);
      }
      q.push(p[p.length - 1]); p = q;
    }
    return p;
  },
  resample(pts, step) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0].slice()]; let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      let a = pts[i - 1], b = pts[i], d = dist(a, b);
      while (acc + d >= step) {
        const t = (step - acc) / d; const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        out.push(p); a = p; d = dist(a, b); acc = 0;
      }
      acc += d;
    }
    if (dist(out[out.length - 1], pts[pts.length - 1]) > 0.01) out.push(pts[pts.length - 1].slice());
    return out;
  },
  /* cor ao longo do traço para tintas com efeito */
  effectColor(kind, len) {
    if (kind === 'rainbow') return `hsl(${(len * 0.9) % 360},92%,52%)`;
    const t = Math.sin(len / 70);
    return `hsl(${255 + t * 50},85%,${48 + Math.sin(len / 33) * 9}%)`;
  },
  arrowHead(tip, from, size) {
    const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
    const l = [tip[0] - size * Math.cos(a - 0.5), tip[1] - size * Math.sin(a - 0.5)];
    const r = [tip[0] - size * Math.cos(a + 0.5), tip[1] - size * Math.sin(a + 0.5)];
    return [l, tip, r];
  },
  backPoint(pts, fromEnd, d) {
    // ponto a distância d do início (fromEnd=false) ou do fim
    const seq = fromEnd ? pts.slice().reverse() : pts; let acc = 0;
    for (let i = 1; i < seq.length; i++) { acc += dist(seq[i - 1], seq[i]); if (acc >= d) return seq[i]; }
    return seq[seq.length - 1];
  },
  /* SVG de um traço; devolve {html, box} */
  svg(it) {
    const pts = it.points; if (!pts || !pts.length) return { html: '', box: { x: 0, y: 0, w: 0, h: 0 } };
    const w = it.width || 3;
    const hl = it.kind === 'highlighter';
    const sw = hl ? w : w;
    const pad = sw * 2 + 14;
    const b = this.bbox(pts); const ox = b.x - pad, oy = b.y - pad;
    let body = '';
    const cap = hl ? 'square' : 'round';
    if (it.kind === 'rainbow' || it.kind === 'galaxy') {
      let len = 0, seg = [pts[0]], segLen = 0;
      const flush = () => {
        if (seg.length < 2) return;
        body += `<polyline points="${seg.map(p => r1(p[0] - ox) + ',' + r1(p[1] - oy)).join(' ')}" stroke="${this.effectColor(it.kind, len)}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      };
      if (pts.length === 1) body += `<circle cx="${r1(pts[0][0] - ox)}" cy="${r1(pts[0][1] - oy)}" r="${sw / 2}" fill="${this.effectColor(it.kind, 0)}"/>`;
      for (let i = 1; i < pts.length; i++) {
        const d = dist(pts[i - 1], pts[i]); seg.push(pts[i]); segLen += d; len += d;
        if (segLen > 7) { flush(); seg = [pts[i]]; segLen = 0; }
      }
      flush();
      if (it.kind === 'galaxy') {
        const rand = rng(hashStr(it.id)); const rs = this.resample(pts, Math.max(10, sw * 2.2));
        for (const p of rs) {
          if (rand() > 0.55) continue;
          const ang = rand() * Math.PI * 2, rr = rand() * sw * 0.45, s = Math.max(0.8, sw * (0.08 + rand() * 0.14));
          const cx = r1(p[0] - ox + Math.cos(ang) * rr), cy = r1(p[1] - oy + Math.sin(ang) * rr);
          body += `<path d="M${cx} ${r1(cy - s * 2)}Q${cx} ${cy} ${r1(cx + s * 2)} ${cy}Q${cx} ${cy} ${cx} ${r1(cy + s * 2)}Q${cx} ${cy} ${r1(cx - s * 2)} ${cy}Q${cx} ${cy} ${cx} ${r1(cy - s * 2)}Z" fill="#fff" opacity="${(0.6 + rand() * 0.4).toFixed(2)}"/>`;
        }
      }
    } else {
      body += `<path d="${this.pathD(pts, ox, oy, it.sharp)}" stroke="${esc(it.color)}" stroke-width="${sw}" fill="none" stroke-linecap="${cap}" stroke-linejoin="round"${hl ? ' opacity="0.42"' : ''}/>`;
    }
    if (it.arrow && it.arrow !== 'none' && pts.length > 1) {
      const size = Math.max(12, sw * 3.2);
      const heads = [];
      heads.push([pts[pts.length - 1], this.backPoint(pts, true, size * 0.9), this.effColorAt(it, true)]);
      if (it.arrow === 'both') heads.push([pts[0], this.backPoint(pts, false, size * 0.9), this.effColorAt(it, false)]);
      for (const [tip, from, col] of heads) {
        const [l, t, r] = this.arrowHead(tip, from, size);
        body += `<path d="M${r1(l[0] - ox)} ${r1(l[1] - oy)}L${r1(t[0] - ox)} ${r1(t[1] - oy)}L${r1(r[0] - ox)} ${r1(r[1] - oy)}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
    const hitD = this.pathD(pts, ox, oy, it.sharp);
    body += `<path class="hit" d="${hitD}" stroke="transparent" stroke-width="${Math.max(sw + 12, 16)}" fill="none" stroke-linecap="round"/>`;
    return { html: body, box: { x: ox, y: oy, w: b.w + pad * 2, h: b.h + pad * 2 } };
  },
  effColorAt(it, end) {
    if (it.kind === 'rainbow' || it.kind === 'galaxy') return this.effectColor(it.kind, end ? this.length(it.points) : 0);
    return esc(it.color);
  },

  /* ---------- geometria ---------- */
  segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = clamp(t, 0, 1);
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  },
  hull(pts) {
    const p = pts.map(q => q.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop(); return lo.concat(up);
  },
  polyDist(p, poly) { let m = Infinity; for (let i = 0; i < poly.length; i++) m = Math.min(m, this.segDist(p, poly[i], poly[(i + 1) % poly.length])); return m; },
  regular(n, cx, cy, r, rot = -Math.PI / 2) { const o = []; for (let i = 0; i <= n; i++) { const a = rot + i * 2 * Math.PI / n; o.push([r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))]); } return o; },

  /* ---------- tinta para forma ---------- */
  recognize(raw) {
    if (!raw || raw.length < 3) return null;
    const L = this.length(raw); const b = this.bbox(raw); const D = Math.hypot(b.w, b.h);
    if (L < 24 || D < 16) return null;
    const a = raw[0], z = raw[raw.length - 1];
    // linha
    if (dist(a, z) / L > 0.94) return { name: 'linha', points: [a.slice(), z.slice()] };
    if (dist(a, z) > Math.max(0.28 * L, D * 0.35)) return null; // não fechada
    const pts = this.resample(raw, L / 72);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    // círculo / elipse
    const ex = b.w / 2, ey = b.h / 2, ecx = b.x + ex, ecy = b.y + ey;
    if (ex > 4 && ey > 4) {
      let err = 0; for (const p of pts) err += Math.abs(Math.hypot((p[0] - ecx) / ex, (p[1] - ecy) / ey) - 1); err /= pts.length;
      const hullE = this.hull(pts); const simpleE = this.simplify(hullE, D);
      if ((err < 0.09 && simpleE.length > 6) || err < 0.035) {
        const ratio = ex / ey;
        if (ratio > 0.85 && ratio < 1.18) { const r = (ex + ey) / 2; return { name: 'círculo', points: this.regular(56, ecx, ecy, r) }; }
        const o = []; for (let i = 0; i <= 56; i++) { const t = i / 56 * Math.PI * 2; o.push([r1(ecx + ex * Math.cos(t)), r1(ecy + ey * Math.sin(t))]); }
        return { name: 'elipse', points: o };
      }
    }
    const hull = this.hull(pts);
    const poly = this.simplify(hull, D);
    const k = poly.length;
    let fit = 0; for (const p of pts) fit += this.polyDist(p, poly); fit /= pts.length;
    if (fit > D * 0.07 || k < 3 || k > 6) return null;
    const close = arr => arr.concat([arr[0].slice()]).map(p => [r1(p[0]), r1(p[1])]);
    if (k === 3) return { name: 'triângulo', points: close(poly) };
    if (k === 4) {
      const angs = poly.map((p, i) => { const q = poly[(i + 1) % 4]; const ang = Math.abs(deg(Math.atan2(q[1] - p[1], q[0] - p[0]))) % 90; return Math.min(ang, 90 - ang); });
      const axis = angs.every(x => x < 20);
      const diag = angs.every(x => Math.abs(x - 45) < 20);
      const hb = this.bbox(poly);
      if (axis) {
        const sq = hb.w / hb.h > 0.86 && hb.w / hb.h < 1.16;
        if (sq) { const s = (hb.w + hb.h) / 2, mx = hb.x + hb.w / 2, my = hb.y + hb.h / 2; return { name: 'quadrado', points: close([[mx - s / 2, my - s / 2], [mx + s / 2, my - s / 2], [mx + s / 2, my + s / 2], [mx - s / 2, my + s / 2]]) }; }
        return { name: 'retângulo', points: close([[hb.x, hb.y], [hb.x + hb.w, hb.y], [hb.x + hb.w, hb.y + hb.h], [hb.x, hb.y + hb.h]]) };
      }
      if (diag) { const mx = hb.x + hb.w / 2, my = hb.y + hb.h / 2; return { name: 'losango', points: close([[mx, hb.y], [hb.x + hb.w, my], [mx, hb.y + hb.h], [hb.x, my]]) }; }
      return { name: 'quadrilátero', points: close(poly) };
    }
    const r = poly.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cy), 0) / k;
    if (k === 5) return { name: 'pentágono', points: this.regular(5, cx, cy, r) };
    return { name: 'hexágono', points: this.regular(6, cx, cy, r, 0) };
  },
  simplify(poly, D) {
    let p = poly.slice(); const eps = D * 0.085;
    while (p.length > 3) {
      let mi = -1, mv = Infinity;
      for (let i = 0; i < p.length; i++) { const v = this.segDist(p[i], p[(i - 1 + p.length) % p.length], p[(i + 1) % p.length]); if (v < mv) { mv = v; mi = i; } }
      if (mv > eps) break; p.splice(mi, 1);
    }
    // funde vértices muito próximos
    for (let i = p.length - 1; i > 0 && p.length > 3; i--) if (dist(p[i], p[i - 1]) < D * 0.08) p.splice(i, 1);
    return p;
  },

  /* ---------- borracha ---------- */
  hits(it, a, b, r) {
    const w = (it.width || 3) / 2; const pts = it.points;
    if (pts.length === 1) return this.segDist(pts[0], a, b) < r + w;
    for (let i = 1; i < pts.length; i++) if (this.segSegDist(pts[i - 1], pts[i], a, b) < r + w) return true;
    return false;
  },
  segSegDist(p1, p2, q1, q2) {
    return Math.min(this.segDist(p1, q1, q2), this.segDist(p2, q1, q2), this.segDist(q1, p1, p2), this.segDist(q2, p1, p2), this.intersects(p1, p2, q1, q2) ? 0 : Infinity);
  },
  intersects(a, b, c, d) {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
  },
  /* borracha precisa: devolve os pedaços restantes (ou null se não tocou) */
  split(it, a, b, r) {
    if (!this.hits(it, a, b, r)) return null;
    const w = (it.width || 3) / 2;
    const pts = this.resample(it.points, Math.max(1.5, r / 3));
    const runs = []; let cur = [];
    for (const p of pts) {
      if (this.segDist(p, a, b) < r + w) { if (cur.length) runs.push(cur); cur = []; }
      else cur.push([r1(p[0]), r1(p[1])]);
    }
    if (cur.length) runs.push(cur);
    return runs.filter(run => run.length > 1 || (run.length === 1 && it.points.length === 1));
  },

  /* ---------- tinta para tabela ---------- */
  toTable(strokes) {
    const H = [], V = [];
    for (const s of strokes) {
      const rec = this.recognize(s.points) || (dist(s.points[0], s.points[s.points.length - 1]) / this.length(s.points) > 0.85 ? { name: 'linha', points: [s.points[0], s.points[s.points.length - 1]] } : null);
      if (!rec) continue;
      if (rec.name === 'linha') {
        const [p, q] = rec.points; const ang = Math.abs(deg(Math.atan2(q[1] - p[1], q[0] - p[0]))) % 180;
        if (ang < 18 || ang > 162) H.push((p[1] + q[1]) / 2);
        else if (Math.abs(ang - 90) < 18) V.push((p[0] + q[0]) / 2);
      } else if (rec.name === 'retângulo' || rec.name === 'quadrado') {
        const bb = this.bbox(rec.points); H.push(bb.y, bb.y + bb.h); V.push(bb.x, bb.x + bb.w);
      }
    }
    const all = strokes.flatMap(s => s.points); const bb = this.bbox(all);
    const tol = Math.max(14, Math.min(bb.w, bb.h) * 0.08);
    const cl = arr => { arr.sort((x, y) => x - y); const o = []; for (const v of arr) { if (o.length && v - o[o.length - 1] < tol) continue; o.push(v); } return o; };
    let hs = cl(H.concat([bb.y, bb.y + bb.h])), vs = cl(V.concat([bb.x, bb.x + bb.w]));
    const rows = hs.length - 1, cols = vs.length - 1;
    if (rows < 1 || cols < 1 || rows * cols < 2 || rows > 30 || cols > 15) return null;
    return { x: bb.x, y: bb.y, w: bb.w, h: bb.h, rows, cols };
  },

  /* ---------- captura de tinta a partir de imagem (esqueletização) ---------- */
  grabFromImage(img, box) {
    const maxS = 360; const sc = Math.min(1, maxS / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.max(4, Math.round(img.naturalWidth * sc)), Hh = Math.max(4, Math.round(img.naturalHeight * sc));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, Hh); cx.drawImage(img, 0, 0, W, Hh);
    const d = cx.getImageData(0, 0, W, Hh).data; const g = new Float32Array(W * Hh); const hist = new Array(256).fill(0);
    for (let i = 0; i < W * Hh; i++) { const v = (d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114) | 0; g[i] = v; hist[v]++; }
    // limiar de Otsu
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, th = 128; const tot = W * Hh;
    for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF; const v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; th = t; } }
    const darkCount = hist.slice(0, th).reduce((a, b) => a + b, 0); const invert = darkCount > tot / 2;
    const m = new Uint8Array(W * Hh); let ink = 0, rS = 0, gS = 0, bS = 0;
    for (let i = 0; i < W * Hh; i++) { const on = invert ? g[i] > th : g[i] <= th; if (on) { m[i] = 1; ink++; rS += d[i * 4]; gS += d[i * 4 + 1]; bS += d[i * 4 + 2]; } }
    if (!ink || ink > tot * 0.45) return [];
    const color = '#' + [rS, gS, bS].map(v => Math.round(v / ink).toString(16).padStart(2, '0')).join('');
    // Zhang-Suen
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= Hh) ? 0 : m[y * W + x];
    let changed = true;
    while (changed) {
      changed = false;
      for (let step = 0; step < 2; step++) {
        const del = [];
        for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
          if (!m[y * W + x]) continue;
          const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
          const B = p.reduce((a, b) => a + b, 0); if (B < 2 || B > 6) continue;
          let A = 0; for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) A++;
          if (A !== 1) continue;
          if (step === 0 ? (p[0] * p[2] * p[4] === 0 && p[2] * p[4] * p[6] === 0) : (p[0] * p[2] * p[6] === 0 && p[0] * p[4] * p[6] === 0)) del.push(y * W + x);
        }
        if (del.length) { changed = true; del.forEach(i => m[i] = 0); }
      }
    }
    let skel = 0; for (let i = 0; i < m.length; i++) skel += m[i];
    const thick = Math.max(1, ink / Math.max(1, skel));
    // rastreia caminhos
    const N8 = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
    const nb = (x, y) => N8.filter(([dx, dy]) => at(x + dx, y + dy));
    const strokes = [];
    const takeFrom = (sx, sy) => {
      const path = [[sx, sy]]; m[sy * W + sx] = 0; let x = sx, y = sy;
      for (; ;) { const n = nb(x, y); if (!n.length) break; x += n[0][0]; y += n[0][1]; m[y * W + x] = 0; path.push([x, y]); }
      return path;
    };
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      if (!m[y * W + x]) continue;
      if (pass === 0 && nb(x, y).length !== 1) continue;
      const p = takeFrom(x, y); if (p.length >= 4) strokes.push(p);
    }
    const kx = box.w / W, ky = box.h / Hh;
    return strokes.map(p => {
      const simp = this.dp(p, 0.9).map(([x, y]) => [r1(box.x + (x + .5) * kx), r1(box.y + (y + .5) * ky)]);
      return { points: this.chaikin(simp, 1), color, width: Math.max(1.5, r1(thick * kx)) };
    });
  },
  dp(pts, eps) {
    if (pts.length < 3) return pts;
    let mi = 0, mv = 0; const a = pts[0], b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) { const v = this.segDist(pts[i], a, b); if (v > mv) { mv = v; mi = i; } }
    if (mv <= eps) return [a, b];
    return this.dp(pts.slice(0, mi + 1), eps).slice(0, -1).concat(this.dp(pts.slice(mi), eps));
  },

  /* ---------- tinta para texto (API de reconhecimento de escrita, se houver) ---------- */
  async toText(strokes) {
    if (!('createHandwritingRecognizer' in navigator)) return null;
    try {
      const rec = await navigator.createHandwritingRecognizer({ languages: ['pt-BR'] }).catch(() => navigator.createHandwritingRecognizer({ languages: ['en'] }));
      const drawing = rec.startDrawing({ recognitionType: 'text', inputType: 'pen' });
      let t = 0;
      for (const s of strokes) { const hs = new HandwritingStroke(); for (const [x, y] of s.points) hs.addPoint({ x, y, t: t += 8 }); drawing.addStroke(hs); }
      const pred = await drawing.getPrediction(); rec.finish?.();
      return pred?.[0]?.text || '';
    } catch { return null; }
  }
};
