'use strict';
/* ---------- biblioteca de formas (espaço 100x100) ---------- */
const starPath = (() => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 21 : 50; d += (i ? 'L' : 'M') + r1(50 + r * Math.cos(a) * 1) + ' ' + r1(52 + r * Math.sin(a) * 1.02); } return d + 'Z'; })();
const pentaPath = (() => { let d = ''; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; d += (i ? 'L' : 'M') + r1(50 + 50 * Math.cos(a)) + ' ' + r1(55 + 52 * Math.sin(a)); } return d + 'Z'; })();
const SHAPES = {
  rect: { n: 'Retângulo', d: 'M0 0H100V100H0Z' },
  rounded: { n: 'Arredondado', d: 'M14 0H86Q100 0 100 14V86Q100 100 86 100H14Q0 100 0 86V14Q0 0 14 0Z' },
  ellipse: { n: 'Elipse', d: 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z' },
  triangle: { n: 'Triângulo', d: 'M50 0L100 100H0Z' },
  rtriangle: { n: 'Triângulo retângulo', d: 'M0 0L100 100H0Z' },
  diamond: { n: 'Losango', d: 'M50 0L100 50L50 100L0 50Z' },
  pentagon: { n: 'Pentágono', d: pentaPath },
  hexagon: { n: 'Hexágono', d: 'M25 0H75L100 50L75 100H25L0 50Z' },
  octagon: { n: 'Octógono', d: 'M30 0H70L100 30V70L70 100H30L0 70V30Z' },
  star: { n: 'Estrela', d: starPath },
  parallelogram: { n: 'Paralelogramo', d: 'M22 0H100L78 100H0Z' },
  trapezoid: { n: 'Trapézio', d: 'M22 0H78L100 100H0Z' },
  arrowR: { n: 'Seta', d: 'M0 28H62V0L100 50L62 100V72H0Z' },
  arrowDbl: { n: 'Seta dupla', d: 'M0 50L28 0V26H72V0L100 50L72 100V74H28V100Z' },
  chevron: { n: 'Divisa', d: 'M0 0H70L100 50L70 100H0L30 50Z' },
  plus: { n: 'Cruz', d: 'M35 0H65V35H100V65H65V100H35V65H0V35H35Z' },
  heart: { n: 'Coração', d: 'M50 96C20 72 0 54 0 30A26 26 0 0 1 50 18A26 26 0 0 1 100 30C100 54 80 72 50 96Z' },
  cloud: { n: 'Nuvem', d: 'M25 85A22 22 0 0 1 20 42A26 26 0 0 1 62 22A22 22 0 0 1 92 45A20 20 0 0 1 80 85Z' },
  bubble: { n: 'Balão de fala', d: 'M8 0H92Q100 0 100 8V62Q100 70 92 70H40L18 96L24 70H8Q0 70 0 62V8Q0 0 8 0Z' },
  cylinder: { n: 'Cilindro (banco de dados)', d: 'M0 12A50 12 0 0 1 100 12V88A50 12 0 0 1 0 88Z', extra: 'M0 12A50 12 0 0 0 100 12' },
  document: { n: 'Documento', d: 'M0 0H100V86Q75 70 50 86T0 86Z' },
  process: { n: 'Processo predefinido', d: 'M0 0H100V100H0Z', extra: 'M12 0V100M88 0V100' }
};
function shapeThumb(key) {
  const s = SHAPES[key];
  return `<svg viewBox="-6 -6 112 112" aria-hidden="true"><path d="${s.d}" fill="#d6e9ff" stroke="#1e88e5" stroke-width="6" stroke-linejoin="round"/>${s.extra ? `<path d="${s.extra}" fill="none" stroke="#1e88e5" stroke-width="6"/>` : ''}</svg>`;
}

/* ---------- geometria dos itens ---------- */
const GRID = { note: 150, gap: 10, pad: 14, title: 44 };
function gridSize(it) {
  const cols = it.cols || 3, n = (it.notes || []).length + 1, rows = Math.ceil(n / cols);
  return { w: GRID.pad * 2 + cols * GRID.note + (cols - 1) * GRID.gap + 2, h: GRID.pad * 2 + GRID.title + rows * GRID.note + (rows - 1) * GRID.gap + 2 };
}
function bboxOf(it) {
  if (it.points) { const b = Ink.bbox(it.points); const p = (it.width || 2) / 2; return { x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 }; }
  if (it.type === 'sticker') return { x: it.x, y: it.y, w: it.size, h: it.size };
  const w = it.w || 0, hh = it.h || 0;
  if (!it.rot) return { x: it.x, y: it.y, w, h: hh };
  const cx = it.x + w / 2, cy = it.y + hh / 2, a = rad(it.rot);
  const pts = [[it.x, it.y], [it.x + w, it.y], [it.x + w, it.y + hh], [it.x, it.y + hh]].map(([x, y]) => rotPt(x, y, cx, cy, a));
  return Ink.bbox(pts);
}
function unionBox(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of list) { const b = bboxOf(it); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }
  return isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/* ---------- ajuste automático de texto ---------- */
function fitText(el, max = 30, min = 9) {
  let lo = min, hi = max, best = min;
  el.style.fontSize = max + 'px';
  if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) return;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2; el.style.fontSize = mid + 'px';
    if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) { best = mid; lo = mid; } else hi = mid;
  }
  el.style.fontSize = best + 'px';
}

/* ---------- renderização ---------- */
const R = {
  els: new Map(), world: null, blobCache: new Map(),
  ensure(it) {
    let el = this.els.get(it.id);
    if (!el || el._type !== it.type) {
      el?.remove();
      el = document.createElement('div'); el.className = 'item ' + it.type; el.dataset.id = it.id; el._type = it.type;
      this.world.appendChild(el); this.els.set(it.id, el);
    }
    return el;
  },
  remove(id) { this.els.get(id)?.remove(); this.els.delete(id); },
  clear() { this.els.forEach(e => e.remove()); this.els.clear(); },
  render(it) {
    if (!it || it.deleted || it.type === 'meta') { if (it) this.remove(it.id); return; }
    const fn = it.unknown || !this[it.type] || it.type === 'unknown' ? this.unknown : this[it.type];
    const el = this.ensure(it);
    fn.call(this, el, it);
    el.style.zIndex = Math.round(it.z || 0);
    el.classList.toggle('selected', App.sel.has(it.id));
  },
  place(el, it, auto) {
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.width = it.w + 'px';
    el.style.height = auto ? '' : it.h + 'px';
    el.style.transform = it.rot ? `rotate(${it.rot}deg)` : '';
  },
  setHTML(ed, html) {
    if (ed.contains(document.activeElement) && ed.isContentEditable) return false;
    const s = sanitize(html || '');
    if (ed._html !== s) { ed.innerHTML = s; ed._html = s; return true; }
    return false;
  },

  ink(el, it) {
    const { html, box } = Ink.svg(it);
    el.classList.toggle('hl', it.kind === 'highlighter');
    el.style.left = box.x + 'px'; el.style.top = box.y + 'px'; el.style.width = box.w + 'px'; el.style.height = box.h + 'px';
    el.innerHTML = `<svg width="${r1(box.w)}" height="${r1(box.h)}">${html}</svg>`;
  },

  line(el, it) {
    const [a, b] = it.points; const w = it.width || 3; const pad = w * 4 + 16;
    const bb = Ink.bbox(it.points); const ox = bb.x - pad, oy = bb.y - pad;
    const A = [a[0] - ox, a[1] - oy], B = [b[0] - ox, b[1] - oy]; const mx = (A[0] + B[0]) / 2;
    let d, fromEnd, fromStart;
    if (it.style === 'elbow') { d = `M${r1(A[0])} ${r1(A[1])}H${r1(mx)}V${r1(B[1])}H${r1(B[0])}`; fromEnd = [mx, B[1]]; fromStart = [mx, A[1]]; if (Math.abs(B[0] - mx) < 1) fromEnd = [mx, A[1]]; }
    else if (it.style === 'curve') { d = `M${r1(A[0])} ${r1(A[1])}C${r1(mx)} ${r1(A[1])} ${r1(mx)} ${r1(B[1])} ${r1(B[0])} ${r1(B[1])}`; fromEnd = [mx, B[1]]; fromStart = [mx, A[1]]; }
    else { d = `M${r1(A[0])} ${r1(A[1])}L${r1(B[0])} ${r1(B[1])}`; fromEnd = A; fromStart = B; }
    const col = esc(it.color || '#1f1f24');
    let heads = '';
    const head = (tip, from) => { const s = Math.max(10, w * 3.4); const [l, t, r] = Ink.arrowHead(tip, from, s); return `<path d="M${r1(l[0])} ${r1(l[1])}L${r1(t[0])} ${r1(t[1])}L${r1(r[0])} ${r1(r[1])}Z" fill="${col}" stroke="${col}" stroke-width="${w}" stroke-linejoin="round"/>`; };
    if (it.endArrow) heads += head(B, fromEnd);
    if (it.startArrow) heads += head(A, fromStart);
    el.style.left = ox + 'px'; el.style.top = oy + 'px'; el.style.width = (bb.w + pad * 2) + 'px'; el.style.height = (bb.h + pad * 2) + 'px';
    el.innerHTML = `<svg width="${r1(bb.w + pad * 2)}" height="${r1(bb.h + pad * 2)}"><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${it.dash ? ` stroke-dasharray="${w * 3} ${w * 2.5}"` : ''}/>${heads}<path class="hit" d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(16, w + 12)}"/></svg>`;
  },

  note(el, it) {
    if (!el._b) { el.innerHTML = '<div class="note-body" data-ph="Escreva uma ideia…"></div><div class="note-foot"><span class="note-author"></span><span class="reacts"></span></div>'; el._b = 1; }
    this.place(el, it); el.style.background = it.color;
    const body = el.firstChild; body.style.fontFamily = fontOf(it.font);
    body.style.fontWeight = it.bold ? '700' : ''; body.style.textAlign = it.align || '';
    const changed = this.setHTML(body, it.html);
    el.querySelector('.note-author').textContent = it.showAuthor === false ? '' : (it.author || '');
    this.reacts(el.querySelector('.reacts'), it);
    const key = [it.w, it.h, it.font, it.fontSize, it.bold, body._html].join('|');
    if (changed || el._fk !== key) { el._fk = key; if (it.fontSize) body.style.fontSize = it.fontSize + 'px'; else fitText(body, 30, 9); }
  },
  reacts(box, it) {
    const r = it.reactions || {}; const me = App.user?.id;
    const html = Object.entries(r).filter(([, v]) => v && v.length).map(([e, v]) => `<button class="chip live${v.includes(me) ? ' mine' : ''}" data-react="${esc(e)}" title="${v.length} voto(s)">${esc(e)} ${v.length}</button>`).join('');
    if (box._h !== html) { box.innerHTML = html; box._h = html; }
  },

  grid(el, it) {
    const sz = gridSize(it); it.w = sz.w; it.h = sz.h;
    if (!el._b) { el.innerHTML = '<input class="grid-title" placeholder="Título da grade" spellcheck="false"><div class="grid-notes"></div>'; el._b = 1; }
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.width = sz.w + 'px'; el.style.height = sz.h + 'px'; el.style.transform = '';
    const title = el.firstChild; if (document.activeElement !== title) title.value = it.title || '';
    const box = el.lastChild; box.style.gridTemplateColumns = `repeat(${it.cols || 3}, ${GRID.note}px)`;
    const focused = box.contains(document.activeElement) ? document.activeElement.closest('.gnote')?.dataset.nid : null;
    const sig = JSON.stringify([it.cols, (it.notes || []).map(n => n.id)]);
    if (box._sig !== sig) {
      box._sig = sig;
      const keep = new Map([...box.querySelectorAll('.gnote')].map(n => [n.dataset.nid, n]));
      box.innerHTML = '';
      for (const n of it.notes || []) {
        let ne = keep.get(n.id);
        if (!ne) ne = h('div', { class: 'gnote', 'data-nid': n.id, html: '<div class="gnote-body" data-ph="Ideia…"></div><div class="gnote-foot"></div><button class="gbtn gcolor live" title="Mudar cor">🎨</button><button class="gbtn gdel live" title="Excluir nota">✕</button>' });
        box.append(ne);
      }
      box.append(h('button', { class: 'grid-add live', title: 'Adicionar nota' }, '+'));
    }
    for (const n of it.notes || []) {
      const ne = box.querySelector(`.gnote[data-nid="${n.id}"]`); if (!ne) continue;
      ne.style.background = n.color;
      const b = ne.firstChild; b.style.fontFamily = fontOf(it.font);
      if (n.id !== focused) { const ch = this.setHTML(b, n.html); if (ch || !b._fit) { b._fit = 1; fitText(b, 24, 9); } }
      ne.children[1].textContent = n.author || '';
    }
  },

  text(el, it) {
    if (!el._b) { el.innerHTML = '<div class="text-body"></div>'; el._b = 1; }
    this.place(el, it, true);
    const b = el.firstChild;
    b.style.color = it.color || '#1d1d24'; b.style.fontSize = (it.fontSize || 22) + 'px'; b.style.fontFamily = fontOf(it.font);
    b.style.textAlign = it.align || 'left'; b.style.fontWeight = it.bold ? '700' : '';
    this.setHTML(b, it.html);
    it.h = el.offsetHeight || it.h || 30;
  },

  shape(el, it) {
    if (!el._b) { el.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div class="shape-label"></div>'; el._b = 1; }
    this.place(el, it);
    const s = SHAPES[it.shape] || SHAPES.rect;
    const sw = it.strokeWidth ?? 3, fill = it.fill || 'transparent', stroke = it.stroke || '#1f1f24';
    const svg = `<path d="${s.d}" fill="${esc(fill)}" stroke="${sw ? esc(stroke) : 'none'}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${s.extra ? `<path d="${s.extra}" fill="none" stroke="${esc(stroke)}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>` : ''}`;
    const sv = el.firstChild; if (sv._h !== svg) { sv.innerHTML = svg; sv._h = svg; }
    const lb = el.lastChild; lb.style.color = it.textColor || '#1d1d24'; lb.style.fontSize = (it.fontSize || 18) + 'px'; lb.style.fontFamily = fontOf(it.font);
    if (it.shape === 'bubble') lb.style.bottom = '35%'; else lb.style.bottom = '';
    this.setHTML(lb, it.html);
  },

  image(el, it) {
    this.place(el, it);
    const src = safeUrl(it.src);
    if (el._src !== src) { el.innerHTML = ''; el.append(h('img', { src, draggable: 'false', alt: '' })); el._src = src; }
  },

  unknown(el, it) {
    el.classList.add('unknown');
    el.style.left = (it.x || 0) + 'px'; el.style.top = (it.y || 0) + 'px'; el.style.width = (it.w || 200) + 'px'; el.style.height = (it.h || 120) + 'px'; el.style.transform = '';
    const html = `<div>Item “${esc(it.type)}” criado numa versão mais nova da Lousa Livre.<br><small>Ele é preservado ao exportar.</small></div>`;
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
  },

  sticker(el, it) {
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.width = it.size + 'px'; el.style.height = it.size + 'px';
    el.style.transform = it.rot ? `rotate(${it.rot}deg)` : '';
    const html = `<span style="font-size:${it.size * 0.82}px">${esc(it.emoji)}</span>`;
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
  },

  embed(el, it) {
    this.place(el, it);
    const sig = [it.kind, it.src, it.url, it.preview].join('|');
    if (el._sig === sig) return; el._sig = sig;
    let host = ''; try { host = new URL(it.url).hostname.replace(/^www\./, ''); } catch { host = it.name || ''; }
    const ico = it.kind === 'pdf' ? 'pdf' : it.kind === 'link' ? 'link' : 'video';
    const head = `<div class="emb-head">${icon(ico)}<span>${esc(it.title || host || it.name || 'Mídia')}</span></div>`;
    let body = '';
    if (it.kind === 'video') body = `<iframe src="${esc(safeUrl(it.src))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="shield"></div>`;
    else if (it.kind === 'file-video') body = `<video controls preload="metadata" src="${esc(this.blob(it))}"></video><div class="shield"></div>`;
    else if (it.kind === 'pdf' && navigator.pdfViewerEnabled === false) body = `<div class="linkcard"><div class="lc-host">${icon('pdf')} ${esc(it.name || 'Documento PDF')}</div><div class="lc-url">Este navegador não mostra PDFs dentro da página (comum no Chrome para Android).</div><div class="lc-actions"><a class="lbtn live" href="${esc(this.blob(it))}" download="${esc(it.name || 'documento.pdf')}" target="_blank">Abrir PDF</a></div></div>`;
    else if (it.kind === 'pdf') body = `<iframe class="pdf" src="${esc(this.blob(it))}"></iframe><div class="shield"></div>`;
    else if (it.preview) body = `<iframe class="page" src="${esc(safeUrl(it.url))}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" referrerpolicy="no-referrer"></iframe><div class="shield"></div>`;
    else body = `<div class="linkcard"><div class="lc-host">${esc(host)}</div><div class="lc-url">${esc(it.url)}</div><div class="lc-actions"><a class="lbtn live" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">Abrir link</a><button class="lbtn sec live" data-act="preview">Pré-visualizar aqui</button></div></div>`;
    el.innerHTML = head + `<div class="emb-body">${body}</div>`;
  },
  blob(it) {
    if (!it.src) return '';
    if (!it.src.startsWith('data:')) return safeUrl(it.src);
    let u = this.blobCache.get(it.id);
    if (!u || u.src !== it.src) { u = { src: it.src, url: dataURLtoBlobURL(it.src) }; this.blobCache.set(it.id, u); }
    return u.url;
  },

  loop(el, it) {
    const l = Loops.get(it.loopId);
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.width = it.w + 'px'; el.style.height = ''; el.style.transform = '';
    if (!el._b) { el.innerHTML = ''; el.append(loopCard(it.loopId)); el._b = 1; }
    if (l) renderLoop(el.firstChild, l); else el.querySelector('.loop-body').innerHTML = '<p style="color:#888;font-size:13px">Sincronizando componente…</p>';
    it.h = el.offsetHeight || it.h || 160;
  }
};

/* ---------- componentes Loop ---------- */
const LOOP_NAMES = { table: 'Tabela', tasks: 'Lista de tarefas', notes: 'Notas' };
function loopCard(loopId) {
  return h('div', { class: 'loop-card', 'data-loop': loopId, html: `<div class="loop-head">${icon('loop')}<b>Loop</b><span class="ltype"></span><span class="sync">Sincronizado</span></div><input class="loop-title live" data-field="title" spellcheck="false"><div class="loop-body"></div><div class="lfoot"></div>` });
}
function renderLoop(card, l) {
  card.querySelector('.ltype').textContent = '· ' + (LOOP_NAMES[l.type] || '');
  const t = card.querySelector('.loop-title'); if (document.activeElement !== t) t.value = l.title || '';
  const body = card.querySelector('.loop-body');
  const focus = body.contains(document.activeElement) ? document.activeElement : null;
  const setTxt = (node, v) => { if (node !== focus && node.innerText !== v) node.innerText = v; };
  if (l.type === 'table') {
    const cells = l.data.cells || [[]]; const sig = cells.length + 'x' + (cells[0] || []).length;
    if (body._sig !== sig || !body.querySelector('table')) {
      body._sig = sig;
      body.innerHTML = `<table>${cells.map((row, r) => `<tr>${row.map((c, ci) => `<td class="live" contenteditable="true" data-r="${r}" data-c="${ci}"></td>`).join('')}</tr>`).join('')}</table><div class="loop-tools"><button class="live" data-act="addRow">+ Linha</button><button class="live" data-act="addCol">+ Coluna</button><button class="live" data-act="delRow">− Linha</button><button class="live" data-act="delCol">− Coluna</button></div>`;
    }
    body.querySelectorAll('td').forEach(td => setTxt(td, cells[td.dataset.r]?.[td.dataset.c] ?? ''));
  } else if (l.type === 'tasks') {
    const tasks = l.data.tasks || []; const sig = tasks.map(x => x.id).join(',');
    if (body._sig !== sig || !body.querySelector('.ltasks')) {
      body._sig = sig;
      body.innerHTML = `<div class="lprog"></div><div class="ltasks">${tasks.map(x => `<div class="ltask" data-tid="${x.id}"><input type="checkbox" class="live" data-act="toggle"><div class="lt-text live" contenteditable="true" data-ph="Tarefa"></div><button class="lt-del live" data-act="delTask" title="Remover">×</button></div>`).join('')}</div><div class="loop-tools"><button class="live" data-act="addTask">+ Nova tarefa</button></div>`;
    }
    body.querySelectorAll('.ltask').forEach(row => { const x = tasks.find(q => q.id === row.dataset.tid); if (!x) return; row.classList.toggle('done', !!x.done); row.querySelector('input').checked = !!x.done; setTxt(row.querySelector('.lt-text'), x.text || ''); });
    const done = tasks.filter(x => x.done).length; body.querySelector('.lprog').textContent = `${done} de ${tasks.length} concluída(s)`;
  } else {
    if (!body.querySelector('.lnotes')) body.innerHTML = '<div class="lnotes live" contenteditable="true"></div>';
    const n = body.querySelector('.lnotes'); if (n !== focus) { const s = sanitize(l.data.html || ''); if (n._h !== s) { n.innerHTML = s; n._h = s; } }
  }
  const when = l.ts ? new Date(l.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  card.querySelector('.lfoot').textContent = `Atualizado às ${when}${l.byName ? ' por ' + l.byName : ''} · aparece em todo lugar onde for compartilhado`;
}
