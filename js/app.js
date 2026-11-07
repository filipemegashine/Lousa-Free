'use strict';
/* ================= estado ================= */
const App = {
  user: null, boardId: null, boardRec: null, items: new Map(), sel: new Set(), cam: { x: 0, y: 0, z: 1 },
  tool: 'select',
  pens: [{ kind: 'pen', color: '#f1f7fb', width: 3 }, { kind: 'pen', color: '#1cb0f6', width: 3 }, { kind: 'rainbow', color: '#e53935', width: 6 }],
  penIdx: 0, hl: { color: '#ffeb3b', width: 18 }, eraser: 'stroke', arrow: 'none', shapeInk: true,
  undo: [], redo: [], peers: new Map(), editing: null, noteColor: NOTE_COLORS[0].c, sticker: null, cursor: null, dark: false,
  settings: { guides: true, gridSnap: false, colorByPerson: false }
};
let vp, ov, G = null, spaceDown = false, lastPen = 0;
const pointers = new Map();

/* ================= utilidades de itens ================= */
const getItem = id => { const it = App.items.get(id); return it && !it.deleted ? it : null; };
const liveItems = () => [...App.items.values()].filter(i => !i.deleted && i.type !== 'meta');
const selItems = () => [...App.sel].map(getItem).filter(Boolean);
const meta = () => App.items.get('__meta');
function stamp(it) { it.ts = Math.max(now(), (it.ts || 0) + 1); it.by = App.user.id; return it; }
function topZ() { let m = 0; for (const it of App.items.values()) if (!it.deleted && it.type !== 'meta' && (it.z || 0) > m) m = it.z; return Math.round(m) + 1; }

function putItems(list, send = true) {
  for (const it of list) { stamp(it); App.items.set(it.id, it); R.render(it); if (it.deleted) App.sel.delete(it.id); }
  if (send && list.length && App.boardId) Net.send(App.boardId, { t: 'op', items: list });
  scheduleSave(); requestOverlay();
}
const sendLive = throttle(ids => {
  const list = ids.map(getItem).filter(Boolean); list.forEach(stamp);
  if (list.length) Net.send(App.boardId, { t: 'op', items: list });
}, 70);
function record(changes) {
  changes = changes.filter(c => JSON.stringify(c.before) !== JSON.stringify(c.after));
  if (!changes.length) return;
  App.undo.push(changes); if (App.undo.length > 250) App.undo.shift(); App.redo = []; UI.history();
}
function applyStates(changes, which) {
  const out = [];
  for (const c of changes) { const st = c[which]; out.push(st ? clone(st) : { id: c.id, deleted: true }); }
  putItems(out);
  App.sel = new Set(out.filter(x => !x.deleted).map(x => x.id)); onSelChange();
}
function undo() { stopEditing(); const ch = App.undo.pop(); if (!ch) return; Sfx.play('undo'); applyStates(ch, 'before'); App.redo.push(ch); UI.history(); }
function redo() { stopEditing(); const ch = App.redo.pop(); if (!ch) return; Sfx.play('redo'); applyStates(ch, 'after'); App.undo.push(ch); UI.history(); }
function mutate(ids, fn, rec = true) {
  const changes = [], out = [];
  for (const id of ids) { const it = getItem(id); if (!it) continue; const before = clone(it); fn(it); out.push(it); changes.push({ id, before, after: clone(it) }); }
  putItems(out); if (rec) record(changes); UI.ctxSoon(); return changes;
}
function addItems(list, select = true) {
  putItems(list); record(list.map(it => ({ id: it.id, before: null, after: clone(it) })));
  const shown = list.filter(it => it.type !== 'ink');
  if (shown.length) { Sfx.play('create'); shown.forEach(it => Fx.kick(R.els.get(it.id), 'pop')); }
  if (select) { App.sel = new Set(list.map(i => i.id)); onSelChange(); }
}
function deleteItems(ids) {
  const changes = [], out = [];
  for (const id of ids) { const it = getItem(id); if (it && id !== '__meta') { changes.push({ id, before: clone(it), after: null }); out.push({ id, deleted: true }); } }
  if (changes.length) Sfx.play('delete');
  putItems(out); record(changes); App.sel.clear(); onSelChange();
}
function translateItem(it, b, dx, dy) {
  if (b.points) it.points = b.points.map(([x, y]) => [r1(x + dx), r1(y + dy)]);
  else { it.x = r1(b.x + dx); it.y = r1(b.y + dy); }
}

/* ================= câmera / tela infinita ================= */
const toWorld = (sx, sy) => ({ x: (sx - App.cam.x) / App.cam.z, y: (sy - App.cam.y) / App.cam.z });
const toScreen = (x, y) => ({ x: x * App.cam.z + App.cam.x, y: y * App.cam.z + App.cam.y });
const saveCam = debounce(() => App.boardId && localStorage.setItem('lousa:cam:' + App.boardId, JSON.stringify(App.cam)), 400);
function applyCam() {
  const c = App.cam; R.world.style.transform = `translate(${c.x}px,${c.y}px) scale(${c.z})`;
  updateBg(); requestOverlay(); UI.zoomLabel(); saveCam();
}
function zoomAt(sx, sy, f) {
  const z2 = clamp(App.cam.z * f, 0.08, 8); const w = toWorld(sx, sy);
  App.cam.z = z2; App.cam.x = sx - w.x * z2; App.cam.y = sy - w.y * z2; applyCam();
}
function fitContent() {
  const b = unionBox(liveItems());
  if (!b) { App.cam = { x: innerWidth / 2, y: innerHeight / 2, z: 1 }; applyCam(); return; }
  const z = clamp(Math.min((innerWidth - 160) / Math.max(b.w, 1), (innerHeight - 180) / Math.max(b.h, 1)), 0.1, 1.5);
  App.cam = { z, x: innerWidth / 2 - (b.x + b.w / 2) * z, y: innerHeight / 2 - (b.y + b.h / 2) * z + 10 }; applyCam();
}
function isDark(hex) { const v = parseInt((hex || '#fff').slice(1), 16); return ((v >> 16) * .299 + ((v >> 8) & 255) * .587 + (v & 255) * .114) < 110; }
function applyMeta() {
  const m = meta(); if (!m) return;
  vp.style.backgroundColor = m.bg || '#131f24'; App.dark = isDark(m.bg);
  if (document.activeElement !== $('#boardName')) $('#boardName').value = m.name || '';
  document.title = (m.name || 'Quadro') + ' · Lousa Livre';
  updateBg();
}
function updateBg() {
  const m = meta(); const p = m?.pattern || 'none'; const z = App.cam.z;
  let s = 24 * z; while (s < 12) s *= 4;
  const c = App.dark ? 'rgba(255,255,255,.17)' : 'rgba(30,30,60,.15)';
  const st = vp.style;
  if (p === 'grid') { st.backgroundImage = `linear-gradient(to right,${c} 1px,transparent 1px),linear-gradient(to bottom,${c} 1px,transparent 1px)`; st.backgroundSize = `${s}px ${s}px`; }
  else if (p === 'dots') { const r = clamp(1.3 * Math.sqrt(z), 0.9, 2.2); st.backgroundImage = `radial-gradient(circle,${App.dark ? 'rgba(255,255,255,.3)' : 'rgba(30,30,60,.28)'} ${r}px,transparent ${r + 0.6}px)`; st.backgroundSize = `${s}px ${s}px`; }
  else if (p === 'lines') { st.backgroundImage = `linear-gradient(to bottom,${c} 1px,transparent 1px)`; st.backgroundSize = `${s * 1.5}px ${s * 1.5}px`; }
  else { st.backgroundImage = 'none'; }
  st.backgroundPosition = `${App.cam.x}px ${App.cam.y}px`;
}
function setMeta(fn) {
  const m = meta(); const before = clone(m); fn(m); putItems([m]); record([{ id: '__meta', before, after: clone(m) }]); applyMeta();
}

/* ================= quadros ================= */
const scheduleSave = debounce(() => saveNow(), 500);
async function saveNow() {
  if (!App.boardId || !App.boardRec) return;
  const m = meta();
  App.boardRec = { ...App.boardRec, name: m?.name || App.boardRec.name, updated: now(), items: [...App.items.values()] };
  try { await DB.put('boards', App.boardRec); } catch (e) { console.warn(e); toast('Não foi possível salvar localmente (espaço cheio?)'); }
}
async function openBoard(id, opt = {}) {
  stopEditing(); Pop.close();
  if (App.boardId) { Net.send(App.boardId, { t: 'bye' }); Net.leave(App.boardId); await saveNow(); }
  App.items.clear(); R.clear(); App.sel.clear(); App.undo = []; App.redo = []; App.peers.clear();
  let rec = await DB.get('boards', id);
  if (!rec) { rec = { id, name: opt.name || 'Quadro compartilhado', created: now(), updated: now(), shared: !!opt.join, items: [] }; await DB.put('boards', rec); }
  App.boardId = id; App.boardRec = rec;
  for (const it of rec.items || []) App.items.set(it.id, it);
  if (!App.items.get('__meta')) App.items.set('__meta', { id: '__meta', type: 'meta', name: rec.name, bg: '#131f24', pattern: 'dots', ts: 0, by: '' });
  for (const it of App.items.values()) R.render(it);
  applyMeta();
  migrateToDark();
  const cam = JSON.parse(localStorage.getItem('lousa:cam:' + id) || 'null');
  if (cam) { App.cam = cam; applyCam(); } else fitContent();
  localStorage.setItem('lousa:last', id);
  try { history.replaceState(null, '', location.pathname + '?b=' + id); } catch { }
  Net.join(id, onRoomMsg);
  Net.send(id, { t: 'sync-req' });
  if (Net.server) Net.send(id, { t: 'seed', items: [...App.items.values()] });
  presenceTick(); onSelChange(); UI.history(); UI.collabs();
}
/* quadros criados antes do tema escuro usavam o fundo claro padrão: passam para o escuro,
   clareando textos, traços e linhas que estavam escuros (cores escolhidas pelo usuário são mantidas) */
function migrateToDark() {
  const m = meta(); if (!m) return;
  const oldDefault = m.bg === '#f6f6f4';
  if (!oldDefault && !isDark(m.bg)) return; // fundo claro escolhido pelo usuário: não mexe
  const DARK_TXT = ['#1d1d24', '#1f1f24', '#2b2b36', '#000000', '#333333'], GRAY = ['#555', '#666', '#555555', '#666666'];
  const out = oldDefault ? [{ ...m, bg: '#131f24' }] : [];
  for (const it of liveItems()) {
    const c = (it.color || '').toLowerCase();
    if (it.type === 'text' && (!it.color || DARK_TXT.includes(c))) out.push({ ...it, color: '#f1f7fb' });
    else if (it.type === 'text' && GRAY.includes(c)) out.push({ ...it, color: '#afafaf' });
    else if ((it.type === 'ink' || it.type === 'line') && DARK_TXT.includes(c)) out.push({ ...it, color: '#f1f7fb' });
  }
  if (out.length) { putItems(out); applyMeta(); }
}
async function createBoard(name, welcome) {
  const id = uid();
  await DB.put('boards', { id, name, created: now(), updated: now(), shared: false, items: [{ id: '__meta', type: 'meta', name, bg: '#131f24', pattern: 'dots', ts: now(), by: App.user.id }] });
  localStorage.removeItem('lousa:cam:' + id);
  await openBoard(id);
  if (welcome) seedWelcome();
  return id;
}

/* ================= colaboração ================= */
function onRoomMsg(m) {
  if (m.t === 'op' || m.t === 'sync') {
    let touched = false;
    for (const raw of (Array.isArray(m.items) ? m.items : [])) {
      const it = Compat.cleanItem(raw);
      if (!it) continue;
      if (!newer(it, App.items.get(it.id))) continue;
      App.items.set(it.id, it); R.render(it);
      if (it.deleted) App.sel.delete(it.id);
      if (it.id === '__meta') applyMeta();
      if (App.sel.has(it.id)) touched = true;
    }
    scheduleSave(); requestOverlay(); if (touched && !G) UI.ctxSoon();
    if (m.from) { const p = App.peers.get(m.from); if (p) p.t = now(); }
  } else if (m.t === 'sync-req') {
    if (App.items.size > 1) setTimeout(() => Net.send(App.boardId, { t: 'sync', items: [...App.items.values()] }), 50 + Math.random() * 300);
    presenceTick();
  } else if (m.t === 'presence') {
    const isNew = !App.peers.has(m.from);
    App.peers.set(m.from, { ...m.p, t: now() });
    if (isNew) { UI.collabs(); presenceTick(); toast(`${m.p?.user?.name || 'Alguém'} entrou no quadro`); }
    requestOverlay();
  } else if (m.t === 'bye') { App.peers.delete(m.from); UI.collabs(); requestOverlay(); }
}
function presenceTick() {
  if (!App.boardId || !App.user) return;
  Net.send(App.boardId, { t: 'presence', p: { user: App.user, cursor: App.cursor, sel: [...App.sel] } });
  let gone = false; for (const [k, p] of App.peers) if (now() - p.t > 9000) { App.peers.delete(k); gone = true; }
  if (gone) { UI.collabs(); requestOverlay(); }
}
const sendCursor = throttle(presenceTick, 80);
App.onNetStatus = () => UI.net();
App.onLoopChanged = id => {
  for (const it of App.items.values()) if (!it.deleted && it.type === 'loop' && it.loopId === id) R.render(it);
  UI.loopViewRefresh?.(id); requestOverlay();
};

/* ================= overlay: seleção, guias, cursores ================= */
let ovReq = false;
function requestOverlay() { if (!ovReq) { ovReq = true; requestAnimationFrame(() => { ovReq = false; drawOverlay(); }); } }
const HCUR = { '-1,-1': 'nwse-resize', '1,1': 'nwse-resize', '1,-1': 'nesw-resize', '-1,1': 'nesw-resize', '0,-1': 'ns-resize', '0,1': 'ns-resize', '-1,0': 'ew-resize', '1,0': 'ew-resize' };
function handleSet(it, multi) {
  if (multi) return { dirs: 'all', rot: false };
  switch (it.type) {
    case 'grid': return { dirs: [], rot: false };
    case 'text': return { dirs: [[-1, 0], [1, 0]], rot: true };
    case 'loop': return { dirs: [[-1, 0], [1, 0]], rot: false };
    case 'embed': return { dirs: 'all', rot: false };
    case 'sticker': return { dirs: [[-1, -1], [1, -1], [1, 1], [-1, 1]], rot: true };
    default: return { dirs: 'all', rot: true };
  }
}
const ALL_DIRS = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
function selScreenBox() {
  const s = selItems(); if (!s.length) return null;
  const b = unionBox(s); const a = toScreen(b.x, b.y); return { x: a.x, y: a.y, w: b.w * App.cam.z, h: b.h * App.cam.z };
}
function drawOverlay() {
  if (!ov) return;
  const z = App.cam.z; let html = '';
  const s = selItems();
  const drawing = G && (G.type === 'stroke' || G.type === 'erase');
  if (s.length && !drawing) {
    if (s.length === 1 && s[0].type === 'line') {
      const it = s[0];
      it.points.forEach((p, i) => { const q = toScreen(p[0], p[1]); html += `<div class="handle pt" data-pt="${i}" style="left:${q.x}px;top:${q.y}px;cursor:crosshair"></div>`; });
    } else {
      const multi = s.length > 1; const it = s[0];
      const boxItem = !multi && !it.points && it.type !== 'sticker' ? it : null;
      let cx, cy, w, hh, rot = 0;
      if (boxItem) { const c = toScreen(it.x + it.w / 2, it.y + (it.h || 0) / 2); cx = c.x; cy = c.y; w = it.w * z; hh = (it.h || 0) * z; rot = it.rot || 0; }
      else if (!multi && it.type === 'sticker') { const c = toScreen(it.x + it.size / 2, it.y + it.size / 2); cx = c.x; cy = c.y; w = hh = it.size * z; rot = it.rot || 0; }
      else { const b = unionBox(s); const c = toScreen(b.x + b.w / 2, b.y + b.h / 2); cx = c.x; cy = c.y; w = b.w * z; hh = b.h * z; }
      const pad = 4; w += pad * 2; hh += pad * 2;
      html += `<div class="selbox${multi ? ' multi' : ''}" style="left:${cx - w / 2}px;top:${cy - hh / 2}px;width:${w}px;height:${hh}px;transform:rotate(${rot}deg)"></div>`;
      const hs = handleSet(it, multi); const dirs = hs.dirs === 'all' ? ALL_DIRS : hs.dirs; const a = rad(rot);
      const at = (lx, ly) => rotPt(cx + lx, cy + ly, cx, cy, a);
      if (!App.editing || multi) {
        for (const [hx, hy] of dirs) { const [x, y] = at(hx * w / 2, hy * hh / 2); html += `<div class="handle" data-h="${hx},${hy}" style="left:${x}px;top:${y}px;cursor:${HCUR[hx + ',' + hy]}"></div>`; }
        if (hs.rot && !multi) { const [x, y] = at(0, -hh / 2 - 26); html += `<div class="handle rot" data-rot="1" style="left:${x}px;top:${y}px"></div>`; }
      }
    }
  }
  if (G?.guides) for (const g of G.guides) {
    if (g.v) { const a = toScreen(g.x, g.y0), b = toScreen(g.x, g.y1); html += `<div class="guide v" style="left:${a.x}px;top:${a.y}px;height:${b.y - a.y}px"></div>`; }
    else { const a = toScreen(g.x0, g.y), b = toScreen(g.x1, g.y); html += `<div class="guide h" style="left:${a.x}px;top:${a.y}px;width:${b.x - a.x}px"></div>`; }
  }
  if (G?.type === 'marquee' && G.rect) { const r = G.rect; html += `<div class="marquee" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"></div>`; }
  if (App.tool === 'eraser' && App.eraserPos) { const d = eraserRadius() * 2 * z; html += `<div class="ecursor" style="left:${App.eraserPos.x}px;top:${App.eraserPos.y}px;width:${d}px;height:${d}px"></div>`; }
  for (const [, p] of App.peers) {
    const col = p.user?.color || '#888', name = esc(p.user?.id === App.user.id ? p.user.name + ' (outra aba)' : p.user?.name || '');
    for (const id of p.sel || []) { const it = getItem(id); if (!it) continue; const b = bboxOf(it); const a = toScreen(b.x, b.y); html += `<div class="rsel" style="left:${a.x - 4}px;top:${a.y - 4}px;width:${b.w * z + 8}px;height:${b.h * z + 8}px;border-color:${col}"><span style="background:${col}">${name}</span></div>`; }
    if (p.cursor) { const q = toScreen(p.cursor.x, p.cursor.y); html += `<div class="rcursor" style="transform:translate(${q.x}px,${q.y}px)"><svg viewBox="0 0 20 20"><path d="M2 2l15 7-6.5 1.5L7 17z" fill="${col}" stroke="#fff" stroke-width="1.5"/></svg><span style="background:${col}">${name}</span></div>`; }
  }
  ov.innerHTML = html;
  UI.placeCtx();
}
function onSelChange() { requestOverlay(); UI.ctx(); for (const [id, el] of R.els) el.classList.toggle('selected', App.sel.has(id)); if (App.boardId) sendCursor(); }

/* ================= entrada: ponteiro, gestos ================= */
function isInkTool() { return App.tool === 'pen' || App.tool === 'highlighter' || App.tool === 'eraser'; }
function setTool(t) {
  if (t !== 'select') { stopEditing(); }
  App.tool = t; if (t !== 'select' && t !== 'pan') { App.sel.clear(); onSelChange(); }
  vp.className = ({ pan: 't-pan', pen: 't-ink', highlighter: 't-ink', eraser: 't-eraser', sticker: 't-sticker' })[t] || '';
  App.eraserPos = null; requestOverlay(); UI.inkbar();
}
function eraserRadius() { return (App.eraser === 'precise' ? 7 : 12) / App.cam.z; }
function bindInput() {
  vp.addEventListener('pointerdown', onDown);
  ov.addEventListener('pointerdown', onHandleDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  vp.addEventListener('wheel', e => {
    if (e.target.closest('.loop-body, .emb-body iframe') && !e.ctrlKey) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0025) * (Math.abs(e.deltaY) < 50 ? 2.5 : 1)));
    else { App.cam.x -= e.deltaX * (e.deltaMode ? 20 : 1); App.cam.y -= e.deltaY * (e.deltaMode ? 20 : 1); applyCam(); }
  }, { passive: false });
  vp.addEventListener('contextmenu', e => { if (!e.target.closest('[contenteditable="true"],input,a')) e.preventDefault(); });
  vp.addEventListener('dblclick', e => {
    if (App.tool !== 'select') return;
    const itemEl = e.target.closest('.item');
    if (itemEl) { const it = getItem(itemEl.dataset.id); if (it?.type === 'embed') { itemEl.classList.add('interact'); toast('Modo interativo: clique fora para voltar'); } return; }
    if (!e.target.closest('.item')) { const p = toWorld(e.clientX, e.clientY); insert(Make.text({ x: p.x, y: p.y - 16 }), true); }
  });
  vp.addEventListener('dragover', e => { e.preventDefault(); });
  vp.addEventListener('drop', e => { e.preventDefault(); const p = toWorld(e.clientX, e.clientY); if (e.dataTransfer.files.length) insertFiles([...e.dataTransfer.files], p); else { const t = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'); if (t) pasteText(t, p); } });
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', e => { if (e.key === ' ') { spaceDown = false; if (App.tool !== 'pan') vp.classList.remove('t-pan'); } });
  document.addEventListener('copy', e => onCopy(e, false));
  document.addEventListener('cut', e => onCopy(e, true));
  document.addEventListener('paste', onPaste);
  document.addEventListener('input', onInput);
  document.addEventListener('focusout', e => { if (App.editing && e.target === App.editing.ed) setTimeout(() => { if (App.editing && !App.editing.ed.contains(document.activeElement) && !document.activeElement?.closest?.('#ctxbar,#popover')) stopEditing(); }, 0); });
  R.world.addEventListener('click', onLiveClick);
  window.addEventListener('resize', () => { requestOverlay(); UI.mobile(); });
  window.addEventListener('beforeunload', () => { if (App.boardId) Net.send(App.boardId, { t: 'bye' }); saveNow(); });
}

function onDown(e) {
  const t = e.target;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
  if (e.pointerType === 'pen') lastPen = now();
  if (pointers.size === 2 && [...pointers.values()].every(p => p.type === 'touch')) { cancelGesture(); startPinch(); return; }
  if (pointers.size > 2 || G) return;
  if (e.pointerType === 'touch' && isInkTool() && now() - lastPen < 1500) return; // rejeição da palma
  const tool = App.tool;
  if (!t.closest('.item.embed.interact')) $$('.item.embed.interact').forEach(x => x.classList.remove('interact'));
  if (e.button === 1 || (e.button === 0 && (spaceDown || tool === 'pan'))) { e.preventDefault(); startPan(e); return; }
  if (e.button !== 0) return;
  Pop.close();
  if (tool === 'pen' || tool === 'highlighter') { e.preventDefault(); stopEditing(); startStroke(e); return; }
  if (tool === 'eraser') { e.preventDefault(); startErase(e); return; }
  if (tool === 'sticker') { e.preventDefault(); placeSticker(e); return; }
  // selecionar
  if (t.closest('.live, .grid-title')) return;
  if (App.editing && t.closest('[contenteditable="true"]') && App.editing.ed.contains(t)) return;
  if (t.closest('.item.embed.interact')) return;
  if (App.editing) stopEditing();
  const itemEl = t.closest('.item');
  if (itemEl && getItem(itemEl.dataset.id)) {
    const id = itemEl.dataset.id; const wasOnly = App.sel.has(id) && App.sel.size === 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (App.sel.has(id)) { App.sel.delete(id); onSelChange(); return; }
      App.sel.add(id); onSelChange();
    } else if (!App.sel.has(id)) { App.sel = new Set([id]); onSelChange(); }
    e.preventDefault();
    startMove(e, wasOnly ? t : null);
    return;
  }
  e.preventDefault();
  if (!e.shiftKey && App.sel.size) { App.sel.clear(); onSelChange(); }
  if (e.pointerType === 'touch') startPan(e); else startMarquee(e);
}
function cancelGesture() {
  if (!G) return;
  if (G.type === 'stroke') { App.items.delete(G.it.id); R.remove(G.it.id); clearTimeout(G.hold); }
  if (G.type === 'move' || G.type === 'resize' || G.type === 'rotate') { for (const [id, b] of G.before) { const it = getItem(id); if (it) { Object.assign(it, clone(b)); R.render(it); } } }
  G = null; requestOverlay();
}
function onMove(e) {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { ...pointers.get(e.pointerId), x: e.clientX, y: e.clientY });
  const w = toWorld(e.clientX, e.clientY);
  if (App.boardId && (G || (e.target instanceof Node && vp.contains(e.target)))) { App.cursor = { x: r1(w.x), y: r1(w.y) }; sendCursor(); }
  if (App.tool === 'eraser' && e.pointerType !== 'touch' || (G && G.type === 'erase')) { App.eraserPos = { x: e.clientX, y: e.clientY }; requestOverlay(); }
  if (!G || (G.pid !== undefined && G.pid !== e.pointerId && G.type !== 'pinch')) return;
  e.preventDefault?.();
  GESTURES[G.type]?.move(e, w);
}
function onUp(e) {
  pointers.delete(e.pointerId);
  if (!G) return;
  if (G.type === 'pinch') { if (pointers.size < 2) { G = null; } return; }
  if (G.pid !== e.pointerId) return;
  const g = G; GESTURES[g.type]?.up(e, toWorld(e.clientX, e.clientY));
  G = null; g.guides = null; requestOverlay();
}
const GESTURES = {};

/* --- deslocar / pinça --- */
function startPan(e) { G = { type: 'pan', pid: e.pointerId, sx: e.clientX, sy: e.clientY, cx: App.cam.x, cy: App.cam.y }; vp.classList.add('panning'); }
GESTURES.pan = {
  move(e) { App.cam.x = G.cx + e.clientX - G.sx; App.cam.y = G.cy + e.clientY - G.sy; applyCam(); },
  up() { vp.classList.remove('panning'); }
};
function startPinch() {
  const [a, b] = [...pointers.values()];
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  G = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: App.cam.z, w0: toWorld(mid.x, mid.y) };
}
GESTURES.pinch = {
  move() {
    if (pointers.size < 2) return; const [a, b] = [...pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; const z = clamp(G.z0 * Math.hypot(a.x - b.x, a.y - b.y) / G.d0, 0.08, 8);
    App.cam.z = z; App.cam.x = mid.x - G.w0.x * z; App.cam.y = mid.y - G.w0.y * z; applyCam();
  }, up() { }
};

/* --- seleção por área --- */
function startMarquee(e) { G = { type: 'marquee', pid: e.pointerId, sx: e.clientX, sy: e.clientY, base: new Set(App.sel), rect: null }; }
GESTURES.marquee = {
  move(e) {
    const r = { x: Math.min(G.sx, e.clientX), y: Math.min(G.sy, e.clientY), w: Math.abs(e.clientX - G.sx), h: Math.abs(e.clientY - G.sy) }; G.rect = r;
    const a = toWorld(r.x, r.y), b = toWorld(r.x + r.w, r.y + r.h);
    const s = new Set(G.base);
    for (const it of liveItems()) { const bb = bboxOf(it); if (bb.x < b.x && bb.x + bb.w > a.x && bb.y < b.y && bb.y + bb.h > a.y) s.add(it.id); }
    App.sel = s; onSelChange();
  }, up() { }
};

/* --- mover com guias de alinhamento e encaixe --- */
function startMove(e, tapTarget) {
  const before = new Map(selItems().map(it => [it.id, clone(it)]));
  const start = toWorld(e.clientX, e.clientY);
  const box0 = unionBox([...before.values()]);
  G = { type: 'move', pid: e.pointerId, start, sx: e.clientX, sy: e.clientY, moved: false, before, box0, tapTarget, others: null, ev: e };
}
function snapBoxes() {
  const vis = { a: toWorld(-200, -200), b: toWorld(innerWidth + 200, innerHeight + 200) };
  const out = [];
  for (const it of liveItems()) {
    if (App.sel.has(it.id) || it.type === 'ink') continue;
    const b = bboxOf(it); if (b.x > vis.b.x || b.x + b.w < vis.a.x || b.y > vis.b.y || b.y + b.h < vis.a.y) continue;
    out.push(b); if (out.length > 400) break;
  }
  return out;
}
function computeSnap(box) {
  const guides = []; let dx = 0, dy = 0;
  if (App.settings.guides) {
    const thr = 7 / App.cam.z; let bx = null, by = null;
    const xs = [box.x, box.x + box.w / 2, box.x + box.w], ys = [box.y, box.y + box.h / 2, box.y + box.h];
    for (const o of G.others) {
      const oxs = [o.x, o.x + o.w / 2, o.x + o.w], oys = [o.y, o.y + o.h / 2, o.y + o.h];
      for (const a of xs) for (const b of oxs) { const d = b - a; if (Math.abs(d) < thr && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, x: b, o }; }
      for (const a of ys) for (const b of oys) { const d = b - a; if (Math.abs(d) < thr && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, y: b, o }; }
    }
    if (bx) { dx = bx.d; guides.push({ v: true, x: bx.x, y0: Math.min(box.y, bx.o.y), y1: Math.max(box.y + box.h, bx.o.y + bx.o.h) }); }
    if (by) { dy = by.d; guides.push({ v: false, y: by.y, x0: Math.min(box.x, by.o.x), x1: Math.max(box.x + box.w, by.o.x + by.o.w) }); }
    if (App.settings.gridSnap) { if (!bx) dx = Math.round(box.x / 24) * 24 - box.x; if (!by) dy = Math.round(box.y / 24) * 24 - box.y; }
  } else if (App.settings.gridSnap) { dx = Math.round(box.x / 24) * 24 - box.x; dy = Math.round(box.y / 24) * 24 - box.y; }
  return { dx, dy, guides };
}
GESTURES.move = {
  move(e, w) {
    if (!G.moved && Math.hypot(e.clientX - G.sx, e.clientY - G.sy) < 4) return;
    if (!G.moved) { G.moved = true; G.others = snapBoxes(); Pop.close(); UI.ctxHide(); }
    let dx = w.x - G.start.x, dy = w.y - G.start.y;
    if (G.box0 && !e.altKey) { const s = computeSnap({ ...G.box0, x: G.box0.x + dx, y: G.box0.y + dy }); dx += s.dx; dy += s.dy; G.guides = s.guides; }
    for (const [id, b] of G.before) { const it = getItem(id); if (!it) continue; translateItem(it, b, dx, dy); R.render(it); }
    requestOverlay(); sendLive([...G.before.keys()]);
  },
  up(e) {
    if (G.moved) {
      const changes = [], out = [];
      for (const [id, b] of G.before) { const it = getItem(id); if (it) { out.push(it); changes.push({ id, before: b, after: clone(it) }); } }
      putItems(out); record(changes); UI.ctx();
    } else if (G.tapTarget) {
      const it = getItem([...G.before.keys()][0]); if (it) startEditing(it, G.tapTarget, G.ev);
    }
  }
};

/* --- redimensionar / girar / pontas de linha --- */
function onHandleDown(e) {
  const hd = e.target.closest('.handle'); if (!hd) return;
  e.preventDefault(); e.stopPropagation(); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
  const s = selItems(); if (!s.length) return;
  const before = new Map(s.map(it => [it.id, clone(it)]));
  const w = toWorld(e.clientX, e.clientY);
  UI.ctxHide();
  if (hd.dataset.pt !== undefined) { G = { type: 'endpoint', pid: e.pointerId, idx: +hd.dataset.pt, before }; return; }
  if (hd.dataset.rot) {
    const it = s[0]; const b = bboxOf(it); const c = it.points ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : it.type === 'sticker' ? { x: it.x + it.size / 2, y: it.y + it.size / 2 } : { x: it.x + it.w / 2, y: it.y + it.h / 2 };
    G = { type: 'rotate', pid: e.pointerId, before, c, a0: Math.atan2(w.y - c.y, w.x - c.x) }; return;
  }
  const [hx, hy] = hd.dataset.h.split(',').map(Number);
  G = { type: 'resize', pid: e.pointerId, before, hx, hy, box: unionBox(s), single: s.length === 1 && !s[0].points && s[0].type !== 'sticker' ? s[0].id : null };
}
function finishGeom() {
  const changes = [], out = [];
  for (const [id, b] of G.before) { const it = getItem(id); if (it) { out.push(it); changes.push({ id, before: b, after: clone(it) }); } }
  putItems(out); record(changes); UI.ctx();
}
GESTURES.endpoint = {
  move(e, w) {
    const [id, b] = [...G.before][0]; const it = getItem(id); if (!it) return;
    let p = [r1(w.x), r1(w.y)]; const o = b.points[1 - G.idx];
    if (e.shiftKey) { const a = Math.round(Math.atan2(p[1] - o[1], p[0] - o[0]) / (Math.PI / 12)) * (Math.PI / 12); const d = dist(p, o); p = [r1(o[0] + d * Math.cos(a)), r1(o[1] + d * Math.sin(a))]; }
    it.points = b.points.map((q, i) => i === G.idx ? p : q.slice()); R.render(it); requestOverlay(); sendLive([id]);
  }, up: finishGeom
};
GESTURES.rotate = {
  move(e, w) {
    let da = deg(Math.atan2(w.y - G.c.y, w.x - G.c.x) - G.a0);
    for (const [id, b] of G.before) {
      const it = getItem(id); if (!it) continue;
      if (b.points) { let d = da; if (e.shiftKey) d = Math.round(d / 15) * 15; it.points = b.points.map(([x, y]) => rotPt(x, y, G.c.x, G.c.y, rad(d)).map(r1)); }
      else { let r = (b.rot || 0) + da; if (e.shiftKey) r = Math.round(r / 15) * 15; else { const m = ((r % 90) + 90) % 90; if (m < 3) r -= m; else if (m > 87) r += 90 - m; } it.rot = r1(((r % 360) + 360) % 360); }
      R.render(it);
    }
    requestOverlay(); sendLive([...G.before.keys()]);
  }, up: finishGeom
};
GESTURES.resize = {
  move(e, w) {
    const { hx, hy } = G;
    if (G.single) {
      const b = G.before.get(G.single), it = getItem(G.single); if (!it) return;
      const bh = b.h || 30, th = rad(b.rot || 0), c = { x: b.x + b.w / 2, y: b.y + bh / 2 };
      const L = rotPt(w.x, w.y, c.x, c.y, -th); const lx = L[0] - c.x, ly = L[1] - c.y;
      const ax = -hx * b.w / 2, ay = -hy * bh / 2; const MIN = it.type === 'text' ? 40 : 24;
      let nw = hx ? Math.max(MIN, hx * (lx - ax)) : b.w, nh = hy ? Math.max(MIN, hy * (ly - ay)) : bh;
      const keep = (it.type === 'image' && !e.shiftKey) || (it.type !== 'image' && e.shiftKey);
      if (keep && hx && hy) { const s = Math.max(nw / b.w, nh / bh); nw = b.w * s; nh = bh * s; }
      const ncx = ax + hx * nw / 2, ncy = ay + hy * nh / 2;
      const [wx, wy] = rotPt(c.x + ncx, c.y + ncy, c.x, c.y, th);
      it.w = r1(nw); if (!['text', 'loop'].includes(it.type)) it.h = r1(nh);
      it.x = r1(wx - nw / 2); it.y = r1(wy - (['text', 'loop'].includes(it.type) ? bh : nh) / 2);
      R.render(it);
    } else {
      const B = G.box; const ax = hx < 0 ? B.x + B.w : B.x, ay = hy < 0 ? B.y + B.h : B.y;
      const ex = hx < 0 ? B.x : B.x + B.w, ey = hy < 0 ? B.y : B.y + B.h;
      let sx = hx ? Math.max(0.05, (w.x - ax) / (ex - ax || 1)) : 1, sy = hy ? Math.max(0.05, (w.y - ay) / (ey - ay || 1)) : 1;
      const onlySticker = G.before.size === 1 && [...G.before.values()][0].type === 'sticker';
      if ((hx && hy && !e.shiftKey) || onlySticker) { const s = hx && hy ? Math.max(sx, sy) : (hx ? sx : sy); sx = sy = s; }
      for (const [id, b] of G.before) {
        const it = getItem(id); if (!it) continue;
        if (b.points) { it.points = b.points.map(([x, y]) => [r1(ax + (x - ax) * sx), r1(ay + (y - ay) * sy)]); }
        else if (b.type === 'sticker') { const s = Math.min(sx, sy); it.size = Math.max(16, r1(b.size * s)); it.x = r1(ax + (b.x + b.size / 2 - ax) * sx - it.size / 2); it.y = r1(ay + (b.y + b.size / 2 - ay) * sy - it.size / 2); }
        else if (b.type === 'grid') { it.x = r1(ax + (b.x - ax) * sx); it.y = r1(ay + (b.y - ay) * sy); }
        else {
          const cx = b.x + b.w / 2, cy = b.y + (b.h || 0) / 2; const nw = Math.max(20, b.w * sx), nh = Math.max(20, (b.h || 0) * sy);
          const ncx = ax + (cx - ax) * sx, ncy = ay + (cy - ay) * sy;
          it.w = r1(nw); if (!['text', 'loop'].includes(b.type)) it.h = r1(nh);
          if (b.type === 'text') it.fontSize = r1(clamp((b.fontSize || 22) * Math.sqrt(sx * sy), 6, 400));
          it.x = r1(ncx - nw / 2); it.y = r1(ncy - (['text', 'loop'].includes(b.type) ? b.h : nh) / 2);
        }
        R.render(it);
      }
    }
    requestOverlay(); sendLive([...G.before.keys()]);
  }, up: finishGeom
};

/* --- tinta: desenho, linhas retas, setas, tinta para forma --- */
function startStroke(e) {
  const p = toWorld(e.clientX, e.clientY); const hl = App.tool === 'highlighter';
  const conf = hl ? App.hl : App.pens[App.penIdx];
  const it = { id: uid(), type: 'ink', kind: hl ? 'highlighter' : conf.kind, color: conf.color, width: conf.width, arrow: hl ? 'none' : App.arrow, points: [[r1(p.x), r1(p.y)]], z: topZ(), by: App.user.id };
  App.items.set(it.id, it);
  G = { type: 'stroke', pid: e.pointerId, it, ptype: e.pointerType, start: [p.x, p.y], sm: [p.x, p.y], straight: false, converted: false, anchor: [e.clientX, e.clientY], hold: null };
  armHold(); R.render(it); requestOverlay();
}
function armHold() {
  clearTimeout(G.hold);
  if (G.ptype === 'mouse') return;
  const g = G;
  g.hold = setTimeout(() => {
    if (G !== g || g.converted || g.it.points.length < 4) return;
    const rec = Ink.recognize(g.it.points);
    if (rec) { g.it.points = rec.points; g.it.sharp = true; g.converted = rec.name; navigator.vibrate?.(25); Sfx.play('magic'); R.render(g.it); toast('Tinta convertida em ' + rec.name, [], 1600); }
  }, 600);
}
let strokeRAF = 0;
GESTURES.stroke = {
  move(e) {
    const g = G; if (g.converted) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) {
      const w = toWorld(ev.clientX, ev.clientY);
      if (e.shiftKey) { g.straight = true; g.it.points = [[r1(g.start[0]), r1(g.start[1])], [r1(w.x), r1(w.y)]]; continue; }
      if (g.straight) { g.straight = false; }
      let p = [w.x, w.y];
      if (g.ptype === 'mouse') { g.sm = [g.sm[0] + (p[0] - g.sm[0]) * 0.42, g.sm[1] + (p[1] - g.sm[1]) * 0.42]; p = g.sm; }
      const last = g.it.points[g.it.points.length - 1];
      if (dist(last, p) < 0.8 / App.cam.z) continue;
      g.it.points.push([r1(p[0]), r1(p[1])]);
    }
    if (Math.hypot(e.clientX - g.anchor[0], e.clientY - g.anchor[1]) > 5) { g.anchor = [e.clientX, e.clientY]; armHold(); }
    if (!strokeRAF) strokeRAF = requestAnimationFrame(() => { strokeRAF = 0; if (G === g) { R.render(g.it); } });
    sendLiveStroke(g.it);
  },
  up(e, w) {
    const g = G; clearTimeout(g.hold); cancelAnimationFrame(strokeRAF); strokeRAF = 0;
    const it = g.it;
    if (g.ptype === 'mouse' && !g.straight && !g.converted) { it.points.push([r1(w.x), r1(w.y)]); it.points = Ink.chaikin(it.points, 2); }
    App.items.delete(it.id);
    addItems([it], false);
    if (g.ptype === 'mouse' && App.shapeInk && !g.straight && !g.converted && it.kind !== 'highlighter') {
      const rec = Ink.recognize(it.points);
      if (rec) {
        mutate([it.id], x => { x.points = rec.points; x.sharp = true; }); Sfx.play('magic');
        toast(`Convertido em ${rec.name}`, [['Desfazer', () => undo()]], 4000);
      }
    }
  }
};
const sendLiveStroke = throttle(it => { if (G && G.it === it) Net.send(App.boardId, { t: 'op', items: [{ ...it, ts: now(), by: App.user.id }] }); }, 120);

/* --- borracha de traço e borracha precisa --- */
function startErase(e) {
  const w = toWorld(e.clientX, e.clientY);
  G = { type: 'erase', pid: e.pointerId, last: [w.x, w.y], before: new Map() };
  App.eraserPos = { x: e.clientX, y: e.clientY };
  eraseSeg([w.x, w.y], [w.x, w.y]);
}
function eraseSeg(a, b) {
  const r = eraserRadius(); const box = { x: Math.min(a[0], b[0]) - r, y: Math.min(a[1], b[1]) - r, w: Math.abs(a[0] - b[0]) + 2 * r, h: Math.abs(a[1] - b[1]) + 2 * r };
  const out = [];
  for (const it of liveItems()) {
    if (it.type !== 'ink') continue;
    const bb = bboxOf(it); if (bb.x > box.x + box.w || bb.x + bb.w < box.x || bb.y > box.y + box.h || bb.y + bb.h < box.y) continue;
    if (App.eraser === 'stroke') {
      if (Ink.hits(it, a, b, r)) { if (!G.before.has(it.id)) G.before.set(it.id, clone(it)); out.push({ id: it.id, deleted: true }); }
    } else {
      const runs = Ink.split(it, a, b, r); if (!runs) continue;
      if (!G.before.has(it.id)) G.before.set(it.id, clone(it));
      if (!runs.length) { out.push({ id: it.id, deleted: true }); continue; }
      it.points = runs[0]; if (runs.length > 1 && it.arrow === 'end') { it.arrow = 'none'; }
      out.push(it);
      for (let i = 1; i < runs.length; i++) { const n = { ...clone(it), id: uid(), points: runs[i], arrow: i === runs.length - 1 && G.before.get(it.id).arrow === 'end' ? 'end' : 'none' }; G.before.set(n.id, null); out.push(n); }
    }
  }
  if (out.length) putItems(out);
}
GESTURES.erase = {
  move(e, w) { const p = [w.x, w.y]; eraseSeg(G.last, p); G.last = p; },
  up() { const changes = []; for (const [id, b] of G.before) { const it = getItem(id); changes.push({ id, before: b, after: it ? clone(it) : null }); } record(changes); }
};

/* --- adesivos e reações --- */
function placeSticker(e) {
  const emoji = App.sticker || '👍';
  const noteEl = e.target.closest('.item.note');
  if (noteEl) { toggleReaction(noteEl.dataset.id, emoji, true); Sfx.play('pop'); Fx.kick(noteEl.querySelector('.reacts'), 'pop'); return; }
  const p = toWorld(e.clientX, e.clientY); const size = 56;
  addItems([{ id: uid(), type: 'sticker', emoji, x: r1(p.x - size / 2), y: r1(p.y - size / 2), size, z: topZ() }], false);
}
function toggleReaction(id, emoji, add) {
  mutate([id], it => {
    it.reactions = it.reactions || {}; const arr = it.reactions[emoji] = it.reactions[emoji] || []; const me = App.user.id; const i = arr.indexOf(me);
    if (i >= 0 && !add) arr.splice(i, 1); else if (i < 0) arr.push(me);
    if (!arr.length) delete it.reactions[emoji];
  });
}

/* ================= edição de texto ================= */
function editorOf(it, target) {
  const el = R.els.get(it.id); if (!el) return null;
  if (it.type === 'note') return { ed: el.querySelector('.note-body') };
  if (it.type === 'text') return { ed: el.querySelector('.text-body') };
  if (it.type === 'shape') return { ed: el.querySelector('.shape-label') };
  if (it.type === 'grid') { const b = target?.closest?.('.gnote-body'); if (b) return { ed: b, nid: b.closest('.gnote').dataset.nid }; }
  return null;
}
function startEditing(it, target, ev, fresh) {
  const E = editorOf(it, target); if (!E) return;
  stopEditing();
  App.editing = { id: it.id, ed: E.ed, nid: E.nid, before: clone(it), fresh };
  E.ed.contentEditable = 'true'; R.els.get(it.id).classList.add('editing');
  E.ed.focus({ preventScroll: true });
  const sel = getSelection(); let placed = false;
  if (ev && ev.clientX != null) {
    let range = null;
    if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    else if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(ev.clientX, ev.clientY); if (p) { range = document.createRange(); range.setStart(p.offsetNode, p.offset); } }
    if (range && E.ed.contains(range.startContainer)) { sel.removeAllRanges(); sel.addRange(range); placed = true; }
  }
  if (!placed) { const r = document.createRange(); r.selectNodeContents(E.ed); if (!fresh) r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
  requestOverlay(); UI.ctx();
}
function stopEditing() {
  const E = App.editing; if (!E) return; App.editing = null;
  E.ed.contentEditable = 'false';
  if (document.activeElement === E.ed) E.ed.blur();
  R.els.get(E.id)?.classList.remove('editing');
  const it = getItem(E.id); if (!it) return;
  const text = (E.ed.innerText || '').trim();
  if (it.type === 'text' && !text) {
    if (E.fresh && App.undo.length && App.undo[App.undo.length - 1].some(c => c.id === it.id && !c.before)) App.undo.pop();
    else record([{ id: it.id, before: E.before, after: null }]);
    putItems([{ id: it.id, deleted: true }]); App.sel.delete(it.id); onSelChange(); UI.history(); return;
  }
  putItems([it]);
  if (E.fresh && App.undo.length) { const last = App.undo[App.undo.length - 1]; const c = last.find(c => c.id === it.id && !c.before); if (c) { c.after = clone(it); requestOverlay(); UI.ctx(); return; } }
  record([{ id: it.id, before: E.before, after: clone(it) }]);
  requestOverlay(); UI.ctx();
}
function onInput(e) {
  const t = e.target;
  const card = t.closest?.('.loop-card'); if (card) { onLoopInput(card, t); return; }
  if (t.classList?.contains('grid-title')) {
    const it = getItem(t.closest('.item').dataset.id); if (!it) return; it.title = t.value; stamp(it); scheduleSave(); sendLive([it.id]); return;
  }
  const E = App.editing; if (!E || !E.ed.contains(t)) return;
  const it = getItem(E.id); if (!it) return;
  const html = sanitize(E.ed.innerHTML); E.ed._html = html;
  if (E.nid) { const n = (it.notes || []).find(n => n.id === E.nid); if (n) n.html = html; fitText(E.ed, 24, 9); }
  else it.html = html;
  stamp(it); R.render(it); requestOverlay(); sendLive([it.id]); scheduleSave();
}

/* ================= teclado e área de transferência ================= */
function onKey(e) {
  if (e.key === ' ' && !isTyping()) { if (!spaceDown) { spaceDown = true; vp.classList.add('t-pan'); } e.preventDefault(); return; }
  if (isTyping()) { if (e.key === 'Escape') { stopEditing(); document.activeElement?.blur?.(); } return; }
  if ($('.modal-back')) return;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k === 'a') { e.preventDefault(); setTool('select'); App.sel = new Set(liveItems().map(i => i.id)); onSelChange(); return; }
  if (mod && k === 'd') { e.preventDefault(); duplicate(); return; }
  if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomAt(innerWidth / 2, innerHeight / 2, 1.2); return; }
  if (mod && k === '-') { e.preventDefault(); zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2); return; }
  if (mod && k === '0') { e.preventDefault(); fitContent(); return; }
  if (mod) return;
  if ((k === 'delete' || k === 'backspace') && App.sel.size) { e.preventDefault(); deleteItems([...App.sel]); return; }
  if (k === 'escape') { Pop.close(); if (App.sel.size) { App.sel.clear(); onSelChange(); } else setTool('select'); return; }
  if (k === 'enter' && App.sel.size === 1) { const it = selItems()[0]; if (['note', 'text', 'shape'].includes(it.type)) { e.preventDefault(); startEditing(it); } return; }
  if (k.startsWith('arrow') && App.sel.size) {
    e.preventDefault(); const d = e.shiftKey ? 10 : 1; const dx = k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0, dy = k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0;
    mutate([...App.sel], it => translateItem(it, clone(it), dx, dy)); return;
  }
  const map = { v: 'select', h: 'pan', p: 'pen', m: 'highlighter', e: 'eraser' };
  if (map[k]) { setTool(map[k]); return; }
  if (k === 'n') { insert(Make.note(), true); return; }
  if (k === 't') { insert(Make.text(), true); return; }
}
const CLIP = 'LOUSA-ITEMS:';
function onCopy(e, cut) {
  if (isTyping() || !App.sel.size) return;
  const list = selItems().map(clone);
  e.clipboardData.setData('text/plain', CLIP + JSON.stringify(list)); e.preventDefault();
  App.clip = list;
  if (cut) deleteItems([...App.sel]); else toast(`${list.length} item(ns) copiado(s)`, [], 1500);
}
function pasteItems(list, offset, at) {
  const z0 = topZ(); const b = unionBox(list); if (!b) return;
  let dx = offset, dy = offset;
  if (at) { dx = at.x - (b.x + b.w / 2); dy = at.y - (b.y + b.h / 2); }
  const out = list.map((src, i) => { const it = clone(src); it.id = uid(); delete it.ts; it.z = z0 + i; translateItem(it, src, dx, dy); if (it.type === 'grid') it.notes = (it.notes || []).map(n => ({ ...n, id: uid() })); return it; });
  addItems(out);
}
function duplicate() { if (App.sel.size) pasteItems(selItems().map(clone), 24); }
function onPaste(e) {
  if (isTyping()) return;
  const dt = e.clipboardData; if (!dt) return;
  const files = [...dt.files]; const center = viewCenter();
  if (files.length) { e.preventDefault(); insertFiles(files, center); return; }
  const txt = dt.getData('text/plain'); if (!txt) return;
  e.preventDefault();
  if (txt.startsWith(CLIP)) { try { const list = JSON.parse(txt.slice(CLIP.length)).map(Compat.cleanItem).filter(x => x && !x.deleted && x.type !== 'meta'); if (!list.length) throw 0; const fromHere = list.every(x => App.items.has(x.id)); pasteItems(list, 24, fromHere ? null : center); } catch { toast('Não foi possível colar'); } return; }
  pasteText(txt, center);
}
function pasteText(txt, at) {
  txt = txt.trim();
  if (/^https?:\/\/\S+$/i.test(txt)) { insertEmbedUrl(txt, at); return; }
  const it = Make.text({ x: at.x - 160, y: at.y - 20, w: 320 }); it.html = esc(txt).replace(/\n/g, '<br>'); insert(it);
}

/* ================= criação de itens ================= */
let spawnN = 0;
function viewCenter() { return toWorld(innerWidth / 2, innerHeight / 2); }
function spawn(w, h) { const c = viewCenter(); const o = (spawnN++ % 6) * 26 / App.cam.z; return { x: r1(c.x - w / 2 + o), y: r1(c.y - h / 2 + o) }; }
function myNoteColor() { if (!App.settings.colorByPerson) return App.noteColor; return NOTE_COLORS[hashStr(App.user.id) % NOTE_COLORS.length].c; }
const Make = {
  note(o = {}) { const p = o.x != null ? o : spawn(200, 200); return { id: uid(), type: 'note', x: p.x, y: p.y, w: 200, h: 200, color: o.color || myNoteColor(), html: o.html || '', author: App.user.name, font: 0, z: topZ() }; },
  grid(o = {}) {
    const order = [0, 3, 6, 8];
    const notes = (o.notes || ['', '', '']).map((html, i) => ({ id: uid(), color: NOTE_COLORS[order[i % order.length]].c, html, author: App.user.name }));
    const it = { id: uid(), type: 'grid', cols: o.cols || 3, title: o.title || '', notes, colorOrder: order, font: 0, z: topZ() };
    const s = gridSize(it); const p = o.x != null ? o : spawn(s.w, s.h); it.x = p.x; it.y = p.y; return it;
  },
  text(o = {}) { const p = o.x != null ? o : spawn(300, 40); return { id: uid(), type: 'text', x: p.x, y: p.y, w: o.w || 300, h: 36, html: o.html || '', color: App.dark ? '#ffffff' : '#1d1d24', fontSize: o.fontSize || 22, font: 0, z: topZ() }; },
  shape(key, o = {}) { const w = o.w || 160, hh = o.h || (key === 'cylinder' ? 140 : key === 'arrowR' || key === 'arrowDbl' ? 90 : 120); const p = o.x != null ? o : spawn(w, hh); return { id: uid(), type: 'shape', shape: key, x: p.x, y: p.y, w, h: hh, rot: 0, fill: o.fill || '#d6e9ff', stroke: o.stroke || '#1e88e5', strokeWidth: 3, html: o.html || '', textColor: '#1d1d24', fontSize: 18, font: 0, z: topZ() }; },
  line(o = {}) { const c = viewCenter(); const off = (spawnN++ % 6) * 26 / App.cam.z; const a = o.a || [c.x - 100 + off, c.y + off], b = o.b || [c.x + 100 + off, c.y + off]; return { id: uid(), type: 'line', points: [a.map(r1), b.map(r1)], style: o.style || 'straight', dash: !!o.dash, startArrow: !!o.startArrow, endArrow: o.endArrow ?? false, color: App.dark ? '#ffffff' : '#1f1f24', width: 3, z: topZ() }; },
  image(src, nw, nh, at) { const s = Math.min(1, 480 / Math.max(nw, nh)); const w = r1(nw * s), hh = r1(nh * s); const p = at ? { x: at.x - w / 2, y: at.y - hh / 2 } : spawn(w, hh); return { id: uid(), type: 'image', src, x: r1(p.x), y: r1(p.y), w, h: hh, rot: 0, z: topZ() }; },
  embed(kind, o, at) { const w = o.w || 480, hh = o.h || (kind === 'link' ? 220 : kind === 'pdf' ? 620 : 300); const p = at ? { x: at.x - w / 2, y: at.y - hh / 2 } : spawn(w, hh); return { id: uid(), type: 'embed', kind, x: r1(p.x), y: r1(p.y), w, h: hh, z: topZ(), ...o }; },
  loop(loopId, at) { const w = 460; const p = at || spawn(w, 220); return { id: uid(), type: 'loop', loopId, x: r1(p.x), y: r1(p.y), w, h: 220, z: topZ() }; }
};
function insert(it, edit) {
  if (App.tool !== 'select') setTool('select');
  addItems([it]);
  if (edit) requestAnimationFrame(() => startEditing(getItem(it.id), null, null, true));
}
async function insertFiles(files, at) {
  for (const f of files) {
    const n = f.name.toLowerCase();
    if (Compat.isBoardFile(f)) { await Compat.importFile(f); continue; }
    if (f.type.startsWith('image/')) {
      if (f.size > 12e6) { toast('Imagem muito grande (máx. 12 MB)'); continue; }
      const src = await readFile(f); const img = new Image(); img.src = src; await img.decode().catch(() => { });
      insert(Make.image(src, img.naturalWidth || 400, img.naturalHeight || 300, at));
    } else if (f.type === 'application/pdf' || n.endsWith('.pdf')) {
      if (f.size > 20e6) { toast('PDF muito grande (máx. 20 MB)'); continue; }
      insert(Make.embed('pdf', { src: await readFile(f), name: f.name, title: f.name }, at));
    } else if (f.type.startsWith('video/')) {
      if (f.size > 30e6) { toast('Vídeo muito grande (máx. 30 MB). Use um link do YouTube ou Vimeo.'); continue; }
      insert(Make.embed('file-video', { src: await readFile(f), name: f.name, title: f.name, h: 290 }, at));
    } else if (/\.(pptx?|ppsx?)$/.test(n)) {
      toast('A inserção de PowerPoint foi aposentada. Exporte o arquivo como PDF e insira o PDF.', [], 6000);
    } else toast('Tipo de arquivo não suportado: ' + f.name);
  }
}
function parseVideo(url) {
  let m;
  if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i))) return 'https://www.youtube-nocookie.com/embed/' + m[1];
  if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) return 'https://player.vimeo.com/video/' + m[1];
  if ((m = url.match(/loom\.com\/share\/(\w+)/i))) return 'https://www.loom.com/embed/' + m[1];
  return null;
}
function insertEmbedUrl(url, at) {
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try { new URL(url); } catch { toast('Link inválido'); return; }
  const v = parseVideo(url);
  if (v) insert(Make.embed('video', { url, src: v }, at));
  else if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) insert(Make.embed('file-video', { url, src: url, h: 290 }, at));
  else if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) { const img = new Image(); img.onload = () => insert(Make.image(url, img.naturalWidth, img.naturalHeight, at)); img.onerror = () => insert(Make.embed('link', { url }, at)); img.src = url; }
  else insert(Make.embed('link', { url }, at));
}

/* ================= cliques em controles vivos ================= */
function onLiveClick(e) {
  const t = e.target; const itemEl = t.closest('.item'); if (!itemEl) return; const id = itemEl.dataset.id;
  const chip = t.closest('.chip[data-react]'); if (chip) { toggleReaction(id, chip.dataset.react); return; }
  if (t.closest('.grid-add')) { gridAddNote(id); return; }
  const gn = t.closest('.gnote');
  if (gn && t.closest('.gdel')) { mutate([id], it => { it.notes = it.notes.filter(n => n.id !== gn.dataset.nid); }); return; }
  if (gn && t.closest('.gcolor')) {
    Pop.open(t.closest('.gcolor'), UI.swatchRow(NOTE_COLORS.map(c => c.c), null, c => { mutate([id], it => { const n = it.notes.find(n => n.id === gn.dataset.nid); if (n) n.color = c; }); Pop.close(); }, NOTE_COLORS.map(c => c.n)));
    return;
  }
  if (t.closest('[data-act="preview"]')) { mutate([id], it => { it.preview = true; }); toast('Alguns sites bloqueiam a pré-visualização incorporada'); return; }
  const card = t.closest('.loop-card'); const act = t.closest('[data-act]')?.dataset.act;
  if (card && act) onLoopAction(card, t, act);
}
function gridAddNote(id) {
  let nid;
  mutate([id], it => {
    const ord = it.colorOrder?.length ? it.colorOrder : [0]; const idx = ord[(it.notes.length) % ord.length];
    nid = uid(); it.notes.push({ id: nid, color: App.settings.colorByPerson ? myNoteColor() : NOTE_COLORS[idx].c, html: '', author: App.user.name });
  });
  App.sel = new Set([id]); onSelChange();
  requestAnimationFrame(() => { const b = R.els.get(id)?.querySelector(`.gnote[data-nid="${nid}"] .gnote-body`); if (b) startEditing(getItem(id), b, null, false); });
}
function gridSort(id) {
  mutate([id], it => {
    const ord = it.colorOrder || []; const rank = c => { const i = NOTE_COLORS.findIndex(x => x.c === c); const r = ord.indexOf(i); return r < 0 ? 100 + i : r; };
    it.notes = it.notes.slice().sort((a, b) => rank(a.color) - rank(b.color));
  });
}
function organizeNotesByColor() {
  const notes = selItems().filter(i => i.type === 'note'); if (notes.length < 2) return;
  const b = unionBox(notes); const groups = new Map();
  notes.sort((a, b2) => a.y - b2.y || a.x - b2.x).forEach(n => { const k = NOTE_COLORS.findIndex(c => c.c === n.color); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n.id); });
  const keys = [...groups.keys()].sort((a, b2) => a - b2);
  const pos = new Map(); keys.forEach((k, col) => groups.get(k).forEach((id, row) => pos.set(id, [b.x + col * 220, b.y + row * 220])));
  mutate(notes.map(n => n.id), it => { const p = pos.get(it.id); it.x = p[0]; it.y = p[1]; it.rot = 0; });
  toast('Notas organizadas por cor');
}
function alignSel(mode) {
  const s = selItems(); if (s.length < 2) return; const U = unionBox(s);
  const boxes = new Map(s.map(it => [it.id, bboxOf(it)]));
  let targets = new Map();
  if (mode === 'hdist' || mode === 'vdist') {
    const ax = mode === 'hdist' ? 'x' : 'y', sz = mode === 'hdist' ? 'w' : 'h';
    const sorted = s.slice().sort((a, b) => boxes.get(a.id)[ax] - boxes.get(b.id)[ax]);
    const total = sorted.reduce((t, it) => t + boxes.get(it.id)[sz], 0); const gap = (U[sz] - total) / (sorted.length - 1);
    let cur = U[ax]; sorted.forEach(it => { const b = boxes.get(it.id); targets.set(it.id, ax === 'x' ? [cur - b.x, 0] : [0, cur - b.y]); cur += b[sz] + gap; });
  } else s.forEach(it => {
    const b = boxes.get(it.id); let dx = 0, dy = 0;
    if (mode === 'left') dx = U.x - b.x; if (mode === 'right') dx = U.x + U.w - b.x - b.w; if (mode === 'hcenter') dx = U.x + U.w / 2 - b.x - b.w / 2;
    if (mode === 'top') dy = U.y - b.y; if (mode === 'bottom') dy = U.y + U.h - b.y - b.h; if (mode === 'vcenter') dy = U.y + U.h / 2 - b.y - b.h / 2;
    targets.set(it.id, [dx, dy]);
  });
  mutate(s.map(i => i.id), it => { const [dx, dy] = targets.get(it.id); translateItem(it, clone(it), dx, dy); });
}
function zOrder(mode) {
  const s = selItems(); if (!s.length) return;
  const all = liveItems().sort((a, b) => (a.z || 0) - (b.z || 0));
  if (mode === 'front') { let z = topZ(); mutate(s.sort((a, b) => a.z - b.z).map(i => i.id), it => { it.z = z++; }); }
  else if (mode === 'back') { let z = Math.min(...all.map(i => i.z || 0)) - s.length; mutate(s.sort((a, b) => a.z - b.z).map(i => i.id), it => { it.z = z++; }); }
  else {
    const ids = new Set(s.map(i => i.id)); const order = all.map(i => i.id);
    if (mode === 'forward') { for (let i = order.length - 2; i >= 0; i--) if (ids.has(order[i]) && !ids.has(order[i + 1])) [order[i], order[i + 1]] = [order[i + 1], order[i]]; }
    else { for (let i = 1; i < order.length; i++) if (ids.has(order[i]) && !ids.has(order[i - 1])) [order[i], order[i - 1]] = [order[i - 1], order[i]]; }
    const zmap = new Map(order.map((id, i) => [id, i + 1]));
    mutate(order.filter(id => getItem(id).z !== zmap.get(id)), it => { it.z = zmap.get(it.id); });
  }
}

/* ================= Loop: entrada e ações ================= */
function onLoopInput(card, t) {
  const id = card.dataset.loop; const nm = App.user.name;
  if (t.dataset.field === 'title') Loops.update(id, l => { l.title = t.value; l.byName = nm; });
  else if (t.matches('td')) Loops.update(id, l => { const row = l.data.cells[+t.dataset.r]; if (row) row[+t.dataset.c] = t.innerText.replace(/\n+$/, ''); l.byName = nm; });
  else if (t.matches('.lt-text')) { const tid = t.closest('.ltask').dataset.tid; Loops.update(id, l => { const x = l.data.tasks.find(q => q.id === tid); if (x) x.text = t.innerText.replace(/\n+$/, ''); l.byName = nm; }); }
  else if (t.matches('.lnotes')) Loops.update(id, l => { l.data.html = sanitize(t.innerHTML); l.byName = nm; });
}
function onLoopAction(card, t, act) {
  const id = card.dataset.loop; const nm = App.user.name; let focusTask = null;
  Loops.update(id, l => {
    const c = l.data.cells; l.byName = nm;
    if (act === 'addRow') c.push(new Array(c[0]?.length || 1).fill(''));
    if (act === 'addCol') c.forEach(r => r.push(''));
    if (act === 'delRow' && c.length > 1) c.pop();
    if (act === 'delCol' && c[0].length > 1) c.forEach(r => r.pop());
    if (act === 'addTask') { focusTask = uid(); l.data.tasks.push({ id: focusTask, text: '', done: false }); }
    if (act === 'delTask') { const tid = t.closest('.ltask').dataset.tid; l.data.tasks = l.data.tasks.filter(q => q.id !== tid); }
    if (act === 'toggle') { const tid = t.closest('.ltask').dataset.tid; const x = l.data.tasks.find(q => q.id === tid); if (x) x.done = t.checked; }
  });
  if (focusTask) requestAnimationFrame(() => card.querySelector(`.ltask[data-tid="${focusTask}"] .lt-text`)?.focus());
}

/* ================= tinta: conversões ================= */
function convertInkToShapes() {
  const s = selItems().filter(i => i.type === 'ink'); let n = 0;
  const recs = new Map(s.map(it => [it.id, Ink.recognize(it.points)]));
  mutate(s.filter(it => recs.get(it.id)).map(i => i.id), it => { it.points = recs.get(it.id).points; it.sharp = true; n++; });
  Sfx.play(n ? 'magic' : 'error'); toast(n ? `${n} traço(s) convertido(s) em forma` : 'Nenhuma forma reconhecida');
}
function inkToTable() {
  const s = selItems().filter(i => i.type === 'ink'); const t = Ink.toTable(s);
  if (!t) { toast('Não reconheci uma tabela. Desenhe um retângulo com linhas internas.'); return; }
  const cells = Array.from({ length: t.rows }, () => new Array(t.cols).fill(''));
  const l = Loops.create('table', { title: 'Tabela', data: { cells } });
  const it = Make.loop(l.id, { x: t.x, y: t.y }); it.w = Math.max(260, r1(t.w));
  const changes = s.map(x => ({ id: x.id, before: clone(x), after: null }));
  putItems(s.map(x => ({ id: x.id, deleted: true })));
  putItems([it]); changes.push({ id: it.id, before: null, after: clone(it) }); record(changes);
  Sfx.play('magic'); App.sel = new Set([it.id]); onSelChange(); toast(`Tabela ${t.rows}×${t.cols} criada`);
}
async function inkToText() {
  const s = selItems().filter(i => i.type === 'ink'); if (!s.length) return;
  const b = unionBox(s); let txt = await Ink.toText(s);
  if (txt == null) {
    txt = await promptText('Tinta para texto', 'O reconhecimento de escrita à mão não está disponível neste navegador (é suportado no Chrome para ChromeOS/Android). Digite o texto que você escreveu para substituir a tinta:', '');
    if (txt == null || !txt.trim()) return;
  }
  const it = Make.text({ x: b.x, y: b.y, w: Math.max(160, b.w) }); it.html = esc(txt); it.fontSize = clamp(Math.round(b.h * 0.6), 14, 96); it.color = s[0].kind === 'pen' ? s[0].color : '#1d1d24';
  const changes = s.map(x => ({ id: x.id, before: clone(x), after: null }));
  putItems(s.map(x => ({ id: x.id, deleted: true }))); putItems([it]); changes.push({ id: it.id, before: null, after: clone(it) }); record(changes);
  App.sel = new Set([it.id]); onSelChange();
}
async function grabInk() {
  const it = selItems().find(i => i.type === 'image'); if (!it) return;
  const img = new Image(); img.crossOrigin = 'anonymous'; img.src = it.src;
  try { await img.decode(); } catch { toast('Não foi possível ler a imagem'); return; }
  let strokes;
  try { strokes = Ink.grabFromImage(img, { x: it.x, y: it.y, w: it.w, h: it.h }); } catch { toast('Esta imagem não permite captura (origem externa)'); return; }
  if (!strokes.length) { toast('Nenhum traço encontrado. Use uma foto de desenho escuro sobre fundo claro.'); return; }
  let z = topZ();
  const list = strokes.map(s => ({ id: uid(), type: 'ink', kind: 'pen', color: s.color, width: s.width, arrow: 'none', points: s.points, z: z++ }));
  addItems(list);
  toast(`${list.length} traços de tinta capturados da imagem`, [['Ocultar imagem', () => { mutate([it.id], x => { x.z = Math.min(...list.map(l => l.z)) - 1; }); deleteItems([it.id]); App.sel = new Set(list.map(l => l.id)); onSelChange(); }]], 6000);
}

/* ================= conteúdo de boas-vindas ================= */
function seedWelcome() {
  const items = [];
  let z = 1; const push = it => { it.z = z++; items.push(it); };
  push({ ...Make.text({ x: -420, y: -330, w: 700 }), html: '<b>Bem-vindo à Lousa Livre</b>', fontSize: 40 });
  push({ ...Make.text({ x: -420, y: -265, w: 760 }), html: 'Uma tela sem limites: desenhe, digite, crie notas e diagramas e mova tudo livremente. Use a roda do mouse ou dois dedos para navegar.', fontSize: 18, color: '#afafaf' });
  const g = Make.grid({ x: -420, y: -190, title: 'Ideias da equipe', notes: ['Toque duas vezes numa nota para editar', 'Use o 🎨 para mudar a cor', 'O + adiciona uma nota'] }); push(g);
  push(Make.note({ x: 140, y: -190, color: NOTE_COLORS[3].c, html: 'Arraste-me! Selecione e use a barra para mudar a cor' }));
  push(Make.note({ x: 360, y: -150, color: NOTE_COLORS[7].c, html: 'Vote com reações 👍' }));
  items[items.length - 1].reactions = { '👍': [App.user.id] };
  push(Make.shape('rounded', { x: 140, y: 80, w: 170, h: 80, html: 'Início', fill: '#dff6e3', stroke: '#43a047' }));
  push(Make.shape('diamond', { x: 400, y: 60, w: 150, h: 120, html: 'Decisão?', fill: '#fff4d6', stroke: '#f9a825' }));
  push({ ...Make.line({ a: [310, 120], b: [400, 120] }), endArrow: true });
  const inkPts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; inkPts.push([r1(-410 + t * 480), r1(230 + Math.sin(t * Math.PI * 2) * 28)]); }
  push({ id: uid(), type: 'ink', kind: 'rainbow', color: '#e53935', width: 7, arrow: 'end', points: inkPts });
  push({ ...Make.text({ x: -410, y: 280, w: 520 }), html: 'Tinta Arco-íris com seta automática. Segure Shift para linhas retas.', fontSize: 15, color: '#afafaf' });
  addItems(items, false); App.undo = []; UI.history(); fitContent();
}

/* ================= inicialização ================= */
function loadUser() {
  let u = JSON.parse(localStorage.getItem('lousa:user') || 'null');
  if (!u) { u = { id: uid(), name: 'Convidado ' + Math.floor(100 + Math.random() * 900), color: PEOPLE_COLORS[Math.floor(Math.random() * PEOPLE_COLORS.length)] }; localStorage.setItem('lousa:user', JSON.stringify(u)); }
  App.user = u;
  Object.assign(App.settings, JSON.parse(localStorage.getItem('lousa:settings') || '{}'));
  const tools = JSON.parse(localStorage.getItem('lousa:tools') || 'null');
  if (tools && Array.isArray(tools.pens)) tools.pens.forEach(p => { if (p.kind === 'pen' && p.color === '#1f1f24') p.color = '#f1f7fb'; }); // caneta preta some no fundo escuro
  if (tools) Object.assign(App, { pens: tools.pens || App.pens, hl: tools.hl || App.hl, arrow: tools.arrow || 'none', shapeInk: tools.shapeInk ?? true, eraser: tools.eraser || 'stroke' });
}
const saveTools = debounce(() => localStorage.setItem('lousa:tools', JSON.stringify({ pens: App.pens, hl: App.hl, arrow: App.arrow, shapeInk: App.shapeInk, eraser: App.eraser })), 300);
function saveSettings() { localStorage.setItem('lousa:settings', JSON.stringify(App.settings)); }
function setUserName(name) { App.user.name = name.trim().slice(0, 40) || App.user.name; localStorage.setItem('lousa:user', JSON.stringify(App.user)); localStorage.setItem('lousa:named', '1'); presenceTick(); UI.collabs(); }

async function boot() {
  vp = $('#viewport'); ov = $('#overlay'); R.world = $('#world');
  try { await DB.open(); } catch { toast('Armazenamento local indisponível; nada será salvo.'); }
  await Net.init();
  loadUser();
  Compat.check();
  await Loops.init();
  const q = new URLSearchParams(location.search);
  if (q.get('loop')) { UI.loopView(q.get('loop')); return; }
  const id = q.get('b');
  if (!id) { Home.init(); return; }   // tela inicial: Explicações e Questões
  UI.build(); bindInput();
  const isNew = q.get('new');
  await openBoard(id, { join: !isNew, name: q.get('n') || undefined });
  if (isNew && q.get('n')) setMeta(m => { m.name = q.get('n'); });
  if (isNew === 'welcome') seedWelcome();
  if (isNew) { App.undo = []; UI.history(); }
  const merged = sessionStorage.getItem('lousa:merged');
  if (merged) { sessionStorage.removeItem('lousa:merged'); const [a, u, k] = merged.split('|'); toast(`Mesclado: ${a} novo(s), ${u} atualizado(s), ${k} mantido(s)`, [], 6000); }
  UI.net();
  setInterval(presenceTick, 3000);
  if (!localStorage.getItem('lousa:named')) setTimeout(() => UI.askName(), 400);
}
document.addEventListener('DOMContentLoaded', boot);
