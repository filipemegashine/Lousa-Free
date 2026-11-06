'use strict';
/* Ilustrações originais das questões, desenhadas em SVG:
   tirinhas (comic), cartazes (poster), postagens (post) e gráficos (chart). */
const Visual = {
  INK: '#2b2b36',
  SANS: "'Segoe UI',system-ui,-apple-system,Roboto,sans-serif",
  HAND: "'Comic Sans MS','Segoe Print','Chalkboard SE','Comic Neue',cursive",
  wrap(text, max) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/).filter(Boolean)) {
        if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
      }
      out.push(line);
    }
    return out;
  },
  tspans(lines, x, y, lh) { return lines.map((l, i) => `<tspan x="${x}" y="${y + i * lh}">${esc(l)}</tspan>`).join(''); },
  render(v, opt = {}) { try { return this[v.type] ? this[v.type](v, opt) : ''; } catch (e) { console.warn(e); return ''; } },
  open(W, H, cls, alt) { return `<svg class="vis ${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt || '')}" xmlns="http://www.w3.org/2000/svg">`; },

  /* ---------- tirinha ---------- */
  comic(v, opt = {}) {
    // no celular (opt.narrow) os quadros ficam empilhados, para o texto continuar legível
    const PW = 300, PH = 290, G = 12, n = v.panels.length, vert = !!opt.narrow && n > 1;
    const W = vert ? PW + 2 * G : n * PW + (n + 1) * G, H = vert ? n * PH + (n + 1) * G : PH + 2 * G;
    let s = this.open(W, H, 'comic' + (vert ? ' vert' : ''), v.alt) + `<rect width="${W}" height="${H}" rx="14" fill="#f1f0f7"/>`;
    v.panels.forEach((p, i) => {
      const ox = vert ? G : G + i * (PW + G), oy = vert ? G + i * (PH + G) : G;
      s += `<g transform="translate(${ox},${oy})"><rect width="${PW}" height="${PH}" rx="6" fill="${p.bg || '#fff'}"/>`;
      s += `<path d="M0 ${PH - 6}H${PW}" stroke="#e3e1ee" stroke-width="2"/>`;
      if (p.sign) s += this.sign(p.sign, PH);
      const heads = (p.chars || []).map(c => { s += this.char(c, c.x * PW, PH); return { x: c.x * PW, top: PH - 6 - 72 - 44 }; });
      let by = 10;
      const tails = [];
      for (const b of p.bubbles || []) {
        const hd = heads[b.who] || { x: PW / 2, top: PH - 120 };
        // área livre: não cobrir o rabicho dos balões anteriores
        let lo = 10, hi = PW - 10;
        for (const t of tails) { if (hd.x > t) lo = Math.max(lo, t + 14); else hi = Math.min(hi, t - 14); }
        if (hi - lo < 120) { lo = 10; hi = PW - 10; }
        const maxW = hi - lo, lines = this.wrap(b.text, Math.max(12, Math.floor((maxW - 28) / 7.7)));
        const bw = Math.min(maxW, Math.max(...lines.map(l => l.length)) * 7.7 + 28), bh = lines.length * 18 + 16;
        const bx = clamp(hd.x - bw / 2, lo, hi - bw);
        const tx = clamp(hd.x, bx + 22, bx + bw - 22);
        const tipY = Math.min(by + bh + 30, hd.top - 6), tipX = tx + (hd.x - tx) * 0.6;
        s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="16" fill="#fff" stroke="${this.INK}" stroke-width="2"/>`;
        if (tipY > by + bh + 4) s += `<path d="M${tx - 8} ${by + bh - 1}L${tipX} ${tipY}L${tx + 8} ${by + bh - 1}" fill="#fff" stroke="${this.INK}" stroke-width="2" stroke-linejoin="round"/><path d="M${tx - 6.5} ${by + bh - 1}H${tx + 6.5}" stroke="#fff" stroke-width="3"/>`;
        s += `<text font-family="${this.HAND}" font-size="14" fill="${this.INK}" text-anchor="middle">${this.tspans(lines, bx + bw / 2, by + 22, 18)}</text>`;
        tails.push(tx); by += bh + 12;
      }
      s += `<rect width="${PW}" height="${PH}" rx="6" fill="none" stroke="${this.INK}" stroke-width="2.5"/></g>`;
    });
    return s + '</svg>';
  },
  sign(sg, PH) {
    const lines = this.wrap(sg.text, 14), w = Math.max(...lines.map(l => l.length)) * 8.4 + 22, hh = lines.length * 17 + 12;
    const x = sg.x - w / 2, y = PH - 6 - 70 - hh;
    return `<path d="M${sg.x} ${y + hh}V${PH - 6}" stroke="#8d6e63" stroke-width="5"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="4" fill="${sg.color || '#fff8e1'}" stroke="${this.INK}" stroke-width="2"/><text font-family="${this.SANS}" font-weight="700" font-size="13" fill="${this.INK}" text-anchor="middle">${this.tspans(lines, sg.x, y + 19, 17)}</text>`;
  },
  char(c, cx, PH) {
    const K = this.INK, g = PH - 6, bt = g - 72, hy = bt - 21, f = c.flip ? -1 : 1;
    let s = '';
    if (c.kind === 'robot') {
      s += `<rect x="${cx - 26}" y="${bt}" width="52" height="66" rx="8" fill="#b9c2d3" stroke="${K}" stroke-width="2"/><rect x="${cx - 14}" y="${bt + 14}" width="28" height="18" rx="3" fill="#8fd3c9" stroke="${K}" stroke-width="1.5"/>`;
      s += `<path d="M${cx} ${hy - 22}V${hy - 34}" stroke="${K}" stroke-width="2"/><circle cx="${cx}" cy="${hy - 36}" r="4" fill="#e53935" stroke="${K}" stroke-width="1.5"/>`;
      s += `<rect x="${cx - 25}" y="${hy - 22}" width="50" height="42" rx="9" fill="#d8dee9" stroke="${K}" stroke-width="2"/>`;
      if (c.mood === 'sad') s += `<path d="M${cx - 14} ${hy - 4}h8M${cx + 6} ${hy - 4}h8" stroke="${K}" stroke-width="3" stroke-linecap="round"/><path d="M${cx - 9} ${hy + 12}q9 -6 18 0" fill="none" stroke="${K}" stroke-width="2"/>`;
      else s += `<rect x="${cx - 15}" y="${hy - 9}" width="9" height="9" rx="2" fill="#4fc3f7" stroke="${K}" stroke-width="1.5"/><rect x="${cx + 6}" y="${hy - 9}" width="9" height="9" rx="2" fill="#4fc3f7" stroke="${K}" stroke-width="1.5"/><path d="M${cx - 10} ${hy + 9}h20" stroke="${K}" stroke-width="2"/><path d="M${cx - 5} ${hy + 6}v6M${cx} ${hy + 6}v6M${cx + 5} ${hy + 6}v6" stroke="${K}" stroke-width="1.2"/>`;
    } else {
      const shirt = c.shirt || '#5b5fc7', skin = c.skin || '#f2c9a0', hair = c.hair || '#4e342e', small = c.small;
      const k = small ? 0.82 : 1, hyy = small ? bt + 13 - 21 * k : hy, btt = small ? g - 72 * k : bt;
      s += `<path d="M${cx - 26 * k} ${g}V${btt + 18}q0 -18 18 -18h${16 * k}q18 0 18 18V${g}" fill="${shirt}" stroke="${K}" stroke-width="2"/>`;
      s += `<path d="M${cx - 20 * k} ${btt + 26}l-8 26M${cx + 20 * k} ${btt + 26}l8 26" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
      s += `<circle cx="${cx}" cy="${hyy}" r="${23 * k}" fill="${skin}" stroke="${K}" stroke-width="2"/>`;
      if (c.hairStyle !== 'none') s += `<path d="M${cx - 23 * k} ${hyy - 2}a${23 * k} ${23 * k} 0 0 1 ${46 * k} 0q-8 -9 -22 -8q-14 -1 -24 8z" fill="${hair}" stroke="${K}" stroke-width="2"/>`;
      if (c.hairStyle === 'long') s += `<path d="M${cx - 23 * k} ${hyy - 2}q-6 20 2 34M${cx + 23 * k} ${hyy - 2}q6 20 -2 34" fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>`;
      const ey = hyy + 2, m = c.mood || 'neutral';
      if (m === 'shock') s += `<circle cx="${cx - 8}" cy="${ey - 2}" r="4.5" fill="#fff" stroke="${K}" stroke-width="1.5"/><circle cx="${cx + 8}" cy="${ey - 2}" r="4.5" fill="#fff" stroke="${K}" stroke-width="1.5"/><circle cx="${cx - 8}" cy="${ey - 2}" r="1.8" fill="${K}"/><circle cx="${cx + 8}" cy="${ey - 2}" r="1.8" fill="${K}"/><ellipse cx="${cx}" cy="${ey + 11}" rx="4" ry="5.5" fill="${K}"/>`;
      else {
        s += m === 'smug' ? `<path d="M${cx - 11} ${ey - 2}h6M${cx + 5} ${ey - 2}h6" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>` : `<circle cx="${cx - 8}" cy="${ey - 2}" r="2.6" fill="${K}"/><circle cx="${cx + 8}" cy="${ey - 2}" r="2.6" fill="${K}"/>`;
        const mouth = { happy: `M${cx - 8} ${ey + 7}q8 8 16 0`, sad: `M${cx - 7} ${ey + 12}q7 -6 14 0`, smug: `M${cx - 7} ${ey + 9}q9 4 14 -3`, neutral: `M${cx - 6} ${ey + 9}h12` }[m] || `M${cx - 6} ${ey + 9}h12`;
        s += `<path d="${mouth}" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
    const P = c.prop;
    if (P === 'cactus') { const px = cx + 50 * f; s += `<path d="M${px - 13} ${g}l-3 -22h32l-3 22z" fill="#d7864f" stroke="${K}" stroke-width="2"/><path d="M${px - 7} ${g - 22}v-34a7 7 0 0 1 14 0v34z" fill="#66bb6a" stroke="${K}" stroke-width="2"/><path d="M${px + 7} ${g - 42}h6v-10" fill="none" stroke="${K}" stroke-width="2"/><path d="M${px - 7} ${g - 36}h-6v-9" fill="none" stroke="${K}" stroke-width="2"/>`; }
    if (P === 'newspaper') s += `<g transform="rotate(-4 ${cx} ${hy})"><rect x="${cx - 36}" y="${hy - 30}" width="72" height="56" rx="2" fill="#f5f1e6" stroke="${K}" stroke-width="2"/><text x="${cx}" y="${hy - 12}" font-family="${this.SANS}" font-size="12" font-weight="800" text-anchor="middle" fill="${K}">NEWS</text><path d="M${cx - 28} ${hy - 4}h56M${cx - 28} ${hy + 4}h56M${cx - 28} ${hy + 12}h40" stroke="#9e9e9e" stroke-width="2"/></g>`;
    if (P === 'book') s += `<rect x="${cx - 4 * f - (f < 0 ? 34 : 0)}" y="${bt + 18}" width="34" height="26" rx="2" fill="${c.propColor || '#8d6e63'}" stroke="${K}" stroke-width="2"/><text x="${cx - 4 * f + (f < 0 ? -17 : 17)}" y="${bt + 35}" font-family="${this.SANS}" font-size="7.5" font-weight="700" text-anchor="middle" fill="#fff">${esc(c.propText || '')}</text>`;
    if (P === 'phone') s += `<rect x="${cx + 18 * f - 6}" y="${bt + 30}" width="12" height="20" rx="2" fill="#37474f" stroke="${K}" stroke-width="1.5"/>`;
    if (P === 'podium') s += `<path d="M${cx - 34} ${g}l6 -44h56l6 44z" fill="#90a4ae" stroke="${K}" stroke-width="2"/><circle cx="${cx}" cy="${g - 28}" r="7" fill="#fff" stroke="${K}" stroke-width="1.5"/>`;
    if (P === 'desk') s += `<rect x="${cx - 44}" y="${g - 30}" width="88" height="30" rx="3" fill="#bcaaa4" stroke="${K}" stroke-width="2"/>`;
    return s;
  },

  /* ---------- cartaz / anúncio ---------- */
  ICONS: {
    drop: (x, y, c) => `<path d="M${x} ${y - 34}c14 18 24 30 24 44a24 24 0 0 1 -48 0c0 -14 10 -26 24 -44z" fill="${c}"/>`,
    phone: (x, y, c) => `<rect x="${x - 20}" y="${y - 36}" width="40" height="70" rx="7" fill="${c}"/><rect x="${x - 15}" y="${y - 28}" width="30" height="48" rx="2" fill="rgba(255,255,255,.35)"/><circle cx="${x}" cy="${y + 27}" r="3" fill="rgba(255,255,255,.7)"/>`,
    cup: (x, y, c) => `<path d="M${x - 24} ${y - 18}h40v26a20 20 0 0 1 -40 0z" fill="${c}"/><path d="M${x + 16} ${y - 10}h6a9 9 0 0 1 0 18h-6" fill="none" stroke="${c}" stroke-width="5"/><path d="M${x - 14} ${y - 26}q4 -8 0 -16M${x - 2} ${y - 26}q4 -8 0 -16" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    book: (x, y, c) => `<path d="M${x} ${y - 22}q-16 -10 -32 -6v46q16 -4 32 6zM${x} ${y - 22}q16 -10 32 -6v46q-16 -4 -32 6z" fill="${c}"/><path d="M${x} ${y - 22}v46" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`
  },
  poster(v) {
    const W = 520, title = this.wrap(v.title, 20), body = this.wrap(v.body || '', 38);
    const H = 64 + title.length * 38 + 16 + body.length * 25 + (v.footer ? 70 : 34);
    let s = this.open(W, H, 'poster', v.alt) + `<rect width="${W}" height="${H}" rx="16" fill="${v.bg}"/>`;
    s += `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="10" fill="none" stroke="${v.fg}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 6"/>`;
    if (v.icon && this.ICONS[v.icon]) s += this.ICONS[v.icon](W - 74, 82, v.accent || v.fg);
    s += `<text font-family="${this.SANS}" font-weight="800" font-size="32" fill="${v.fg}">${this.tspans(title, 38, 70, 38)}</text>`;
    const by = 70 + title.length * 38 + 8;
    s += `<text font-family="${this.SANS}" font-size="18" fill="${v.fg}">${this.tspans(body, 38, by, 25)}</text>`;
    if (v.footer) { const fy = H - 44; s += `<rect x="38" y="${fy - 4}" width="${W - 76}" height="2" fill="${v.fg}" opacity=".4"/><text x="38" y="${fy + 24}" font-family="${this.SANS}" font-size="15" font-weight="700" fill="${v.accent || v.fg}">${esc(v.footer)}</text>`; }
    return s + '</svg>';
  },

  /* ---------- postagem de rede social ---------- */
  post(v) {
    const W = 520, lines = this.wrap(v.text, 50), H = 92 + lines.length * 25 + 52;
    let s = this.open(W, H, 'post', v.alt) + `<rect width="${W}" height="${H}" rx="16" fill="#fff" stroke="#e2e2ea" stroke-width="2"/>`;
    s += `<circle cx="46" cy="46" r="22" fill="${v.color || '#5b5fc7'}"/><text x="46" y="53" font-family="${this.SANS}" font-weight="700" font-size="18" fill="#fff" text-anchor="middle">${esc((v.name || '?')[0])}</text>`;
    s += `<text x="80" y="42" font-family="${this.SANS}" font-weight="700" font-size="16" fill="#1d1d24">${esc(v.name)}</text><text x="80" y="62" font-family="${this.SANS}" font-size="14" fill="#6c6c7a">${esc(v.handle)}</text>`;
    s += `<text font-family="${this.SANS}" font-size="17" fill="#1d1d24">${this.tspans(lines, 24, 104, 25)}</text>`;
    const fy = H - 26;
    s += `<path d="M24 ${fy - 14}H${W - 24}" stroke="#eee" stroke-width="1.5"/>`;
    s += `<path d="M34 ${fy + 6}c-8 -6 -12 -10 -12 -14a5 5 0 0 1 12 -3a5 5 0 0 1 12 3c0 4 -4 8 -12 14z" fill="#e0245e"/><text x="54" y="${fy + 6}" font-family="${this.SANS}" font-size="14" fill="#6c6c7a">${esc(v.likes)}</text>`;
    s += `<path d="M136 ${fy - 8}h20a4 4 0 0 1 4 4v9a4 4 0 0 1 -4 4h-12l-6 5v-5h-2a4 4 0 0 1 -4 -4v-9a4 4 0 0 1 4 -4z" fill="none" stroke="#6c6c7a" stroke-width="1.8"/><text x="168" y="${fy + 6}" font-family="${this.SANS}" font-size="14" fill="#6c6c7a">${esc(v.replies)}</text>`;
    return s + '</svg>';
  },

  /* ---------- gráfico de barras ---------- */
  chart(v) {
    const W = 520, title = this.wrap(v.title, 46), n = v.data.length, top = 34 + title.length * 22, H = top + n * 46 + (v.note ? 44 : 22);
    const max = Math.max(...v.data.map(d => d[1])), LW = 96, BW = W - LW - 90;
    let s = this.open(W, H, 'chart', v.alt) + `<rect width="${W}" height="${H}" rx="16" fill="#fff" stroke="#e2e2ea" stroke-width="2"/>`;
    s += `<text font-family="${this.SANS}" font-weight="700" font-size="16" fill="#1d1d24">${this.tspans(title, 24, 34, 22)}</text>`;
    v.data.forEach(([label, val], i) => {
      const y = top + i * 46, w = Math.max(4, val / max * BW);
      s += `<text x="${LW + 12}" y="${y + 22}" font-family="${this.SANS}" font-size="14" fill="#1d1d24" text-anchor="end">${esc(label)}</text>`;
      s += `<rect x="${LW + 22}" y="${y + 6}" width="${w}" height="24" rx="6" fill="${v.color || '#5b5fc7'}" opacity="${1 - i * 0.12}"/>`;
      s += `<text x="${LW + 30 + w}" y="${y + 23}" font-family="${this.SANS}" font-size="14" font-weight="700" fill="#1d1d24">${esc(String(val).replace('.', v.decimalComma ? ',' : '.'))}${esc(v.unit || '')}</text>`;
    });
    if (v.note) s += `<text x="24" y="${H - 18}" font-family="${this.SANS}" font-size="12.5" fill="#6c6c7a">${esc(v.note)}</text>`;
    return s + '</svg>';
  }
};
