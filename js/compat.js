'use strict';
/* =====================================================================
   Compatibilidade entre dispositivos e navegadores
   - Formato de arquivo versionado (.lousa.json), com migração de versões antigas
   - Validação de tudo que vem de fora (arquivos e colaboradores)
   - Importar: abrir, mesclar alterações (ida e volta PC ⇄ celular) ou abrir como cópia
   - Exportar: baixar ou enviar pela folha de compartilhamento do celular
   ===================================================================== */
const Compat = {
  FORMAT: 'lousa-livre', VERSION: 2, APP: 'Lousa Livre 1.1',

  /* ---------- validação ---------- */
  num(v, d = 0, min = -1e7, max = 1e7) { v = +v; return Number.isFinite(v) ? clamp(v, min, max) : d; },
  str(v, max = 200) { return typeof v === 'string' ? v.slice(0, max) : ''; },
  id(v) { return typeof v === 'string' && /^[\w-]{1,64}$/.test(v) ? v : null; },
  color(v, d) { return typeof v === 'string' && /^(#[0-9a-f]{3,8}|transparent|(rgb|hsl)a?\([\d\s.,%]+\))$/i.test(v.trim()) ? v.trim() : d; },
  one(v, list, d) { return list.includes(v) ? v : d; },
  pts(a, max) { return Array.isArray(a) ? a.slice(0, max).filter(p => Array.isArray(p) && Number.isFinite(+p[0]) && Number.isFinite(+p[1])).map(p => [r1(clamp(+p[0], -1e7, 1e7)), r1(clamp(+p[1], -1e7, 1e7))]) : []; },
  html(v) { return sanitize(this.str(v, 30000)); },
  font(v) { return this.num(v, 0, 0, FONTS.length - 1) | 0; },
  httpUrl(v) { const s = this.str(v, 2048); try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } },
  dataUrl(v, re, max = 40e6) { return typeof v === 'string' && v.length < max && re.test(v) ? v : ''; },
  reactions(r) {
    if (!r || typeof r !== 'object') return undefined;
    const out = {}; let n = 0;
    for (const [k, v] of Object.entries(r)) { if (n++ > 20 || typeof k !== 'string' || k.length > 12 || !Array.isArray(v)) continue; const ids = v.filter(x => typeof x === 'string').map(x => x.slice(0, 64)).slice(0, 1000); if (ids.length) out[k] = ids; }
    return Object.keys(out).length ? out : undefined;
  },
  /* devolve uma cópia limpa do item, ou null se inválido */
  cleanItem(raw) {
    const C = Compat;
    if (!raw || typeof raw !== 'object') return null;
    const id = C.id(raw.id); if (!id) return null;
    const base = { id, ts: C.num(raw.ts, 0, 0, 1e14), by: C.str(raw.by, 64) };
    if (raw.deleted) return { ...base, deleted: true };
    const z = C.num(raw.z, 0, -1e6, 1e6);
    const box = { x: C.num(raw.x), y: C.num(raw.y), w: C.num(raw.w, 160, 1, 1e5), h: C.num(raw.h, 120, 1, 1e5), z };
    const rot = C.num(raw.rot, 0, -3600, 3600);
    switch (raw.type) {
      case 'meta': return { ...base, type: 'meta', name: C.str(raw.name, 120) || 'Quadro', bg: C.color(raw.bg, '#f6f6f4'), pattern: C.one(raw.pattern, ['none', 'dots', 'grid', 'lines'], 'dots') };
      case 'ink': {
        const points = C.pts(raw.points, 20000); if (!points.length) return null;
        return { ...base, type: 'ink', z, kind: C.one(raw.kind, ['pen', 'highlighter', 'rainbow', 'galaxy'], 'pen'), color: C.color(raw.color, '#1f1f24'), width: C.num(raw.width, 3, 0.5, 200), arrow: C.one(raw.arrow, ['none', 'end', 'both'], 'none'), sharp: raw.sharp === true || undefined, points };
      }
      case 'line': {
        const points = C.pts(raw.points, 2); if (points.length < 2) return null;
        return { ...base, type: 'line', z, points, style: C.one(raw.style, ['straight', 'elbow', 'curve'], 'straight'), dash: raw.dash === true, startArrow: raw.startArrow === true, endArrow: raw.endArrow === true, color: C.color(raw.color, '#1f1f24'), width: C.num(raw.width, 3, 0.5, 60) };
      }
      case 'note': return { ...base, type: 'note', ...box, rot, color: C.color(raw.color, NOTE_COLORS[0].c), html: C.html(raw.html), author: C.str(raw.author, 60), font: C.font(raw.font), fontSize: raw.fontSize ? C.num(raw.fontSize, 18, 6, 200) : undefined, bold: raw.bold === true || undefined, align: C.one(raw.align, ['left', 'center', 'right'], undefined), showAuthor: raw.showAuthor === false ? false : undefined, reactions: C.reactions(raw.reactions) };
      case 'grid': {
        const notes = (Array.isArray(raw.notes) ? raw.notes : []).slice(0, 300).map(n => n && C.id(n.id) ? { id: n.id, color: C.color(n.color, NOTE_COLORS[0].c), html: C.html(n.html), author: C.str(n.author, 60) } : null).filter(Boolean);
        const colorOrder = (Array.isArray(raw.colorOrder) ? raw.colorOrder : [0]).slice(0, 48).map(v => C.num(v, 0, 0, NOTE_COLORS.length - 1) | 0);
        return { ...base, type: 'grid', x: box.x, y: box.y, z, cols: C.num(raw.cols, 3, 1, 8) | 0, title: C.str(raw.title, 200), notes, colorOrder: colorOrder.length ? colorOrder : [0], font: C.font(raw.font) };
      }
      case 'text': return { ...base, type: 'text', ...box, rot, html: C.html(raw.html), color: C.color(raw.color, '#1d1d24'), fontSize: C.num(raw.fontSize, 22, 6, 400), font: C.font(raw.font), align: C.one(raw.align, ['left', 'center', 'right'], undefined), bold: raw.bold === true || undefined };
      case 'shape': return { ...base, type: 'shape', ...box, rot, shape: SHAPES[raw.shape] ? raw.shape : 'rect', fill: C.color(raw.fill, '#d6e9ff'), stroke: C.color(raw.stroke, '#1e88e5'), strokeWidth: C.num(raw.strokeWidth, 3, 0, 30), html: C.html(raw.html), textColor: C.color(raw.textColor, '#1d1d24'), fontSize: C.num(raw.fontSize, 18, 6, 200), font: C.font(raw.font) };
      case 'image': {
        const src = C.dataUrl(raw.src, /^data:image\/(png|jpe?g|gif|webp|bmp|svg\+xml|avif);base64,/i) || C.httpUrl(raw.src); if (!src) return null;
        return { ...base, type: 'image', ...box, rot, src };
      }
      case 'embed': {
        const url = C.httpUrl(raw.url); let kind = C.one(raw.kind, ['video', 'file-video', 'pdf', 'link'], null); let src = '';
        if (kind === 'video') { src = url && parseVideo(url) || ''; if (!src) kind = url ? 'link' : null; }
        else if (kind === 'file-video') { src = C.dataUrl(raw.src, /^data:video\/[\w.+-]+;base64,/i) || C.httpUrl(raw.src); if (!src) return null; }
        else if (kind === 'pdf') { src = C.dataUrl(raw.src, /^data:application\/pdf;base64,/i); if (!src) return null; }
        else if (kind === 'link' && !url) return null;
        if (!kind) return null;
        return { ...base, type: 'embed', ...box, kind, url: url || undefined, src: src || undefined, name: C.str(raw.name, 200) || undefined, title: C.str(raw.title, 200) || undefined, preview: kind === 'link' && raw.preview === true || undefined };
      }
      case 'loop': { const loopId = C.id(raw.loopId); if (!loopId) return null; return { ...base, type: 'loop', x: box.x, y: box.y, w: C.num(raw.w, 460, 200, 4000), h: C.num(raw.h, 220, 20, 1e5), z, loopId }; }
      case 'sticker': return { ...base, type: 'sticker', x: box.x, y: box.y, z, rot, emoji: C.str(raw.emoji, 16) || '👍', size: C.num(raw.size, 56, 12, 4000) };
      default: {
        // tipo criado por uma versão mais nova: preservado (para reexportar), exibido como aviso
        const type = C.str(raw.type, 40); if (!type) return null;
        let s; try { s = JSON.stringify(raw); } catch { return null; }
        if (s.length > 300000) return null;
        return { ...JSON.parse(s), id, type, unknown: true, x: box.x, y: box.y, w: C.num(raw.w, 200, 40, 4000), h: C.num(raw.h, 120, 40, 4000), z };
      }
    }
  },
  cleanLoop(raw) {
    const C = Compat;
    if (!raw || typeof raw !== 'object') return null;
    const id = C.id(raw.id); const type = C.one(raw.type, ['table', 'tasks', 'notes'], null); if (!id || !type) return null;
    const d = raw.data || {}; let data;
    if (type === 'table') { const rows = (Array.isArray(d.cells) ? d.cells : [['']]).slice(0, 200).map(r => (Array.isArray(r) ? r : []).slice(0, 30).map(c => C.str(c, 4000))); const cols = Math.max(1, ...rows.map(r => r.length)); data = { cells: (rows.length ? rows : [['']]).map(r => r.concat(new Array(cols - r.length).fill(''))) }; }
    else if (type === 'tasks') data = { tasks: (Array.isArray(d.tasks) ? d.tasks : []).slice(0, 1000).map(t => t && C.id(t.id) ? { id: t.id, text: C.str(t.text, 4000), done: t.done === true } : null).filter(Boolean) };
    else data = { html: C.html(d.html) };
    return { id, type, title: C.str(raw.title, 200), data, ts: C.num(raw.ts, 0, 0, 1e14), by: C.str(raw.by, 64), byName: C.str(raw.byName, 60) || undefined, created: C.num(raw.created, 0, 0, 1e14) };
  },

  /* ---------- formato do arquivo ---------- */
  async boardData(id) {
    if (id === App.boardId) await saveNow();
    const rec = await DB.get('boards', id); if (!rec) throw new Error('Quadro não encontrado');
    const items = rec.items || []; const m = items.find(i => i.id === '__meta');
    const loopIds = new Set(items.filter(i => i.type === 'loop' && !i.deleted).map(i => i.loopId));
    return {
      format: this.FORMAT, version: this.VERSION, app: this.APP,
      exportedAt: new Date().toISOString(), exportedBy: App.user.name, exportedById: App.user.id,
      board: { id: rec.id, name: m?.name || rec.name, created: rec.created, updated: rec.updated },
      items, loops: [...loopIds].map(l => Loops.get(l)).filter(Boolean)
    };
  },
  parse(text) {
    let d;
    try { d = JSON.parse(text); } catch { throw new Error('Este arquivo não é um quadro da Lousa Livre.'); }
    // versão 1 (primeira exportação do app)
    if (d && d.app === 'lousa-livre' && d.board && Array.isArray(d.board.items)) d = { format: this.FORMAT, version: 1, board: d.board, items: d.board.items, loops: d.loops || [] };
    // lista solta de itens (ex.: área de transferência)
    if (Array.isArray(d)) d = { format: this.FORMAT, version: 1, board: { name: 'Itens importados' }, items: d, loops: [] };
    if (!d || d.format !== this.FORMAT || !Array.isArray(d.items)) throw new Error('Este arquivo não é um quadro da Lousa Livre.');
    const warnings = [];
    if (+d.version > this.VERSION) warnings.push('Feito numa versão mais nova do app. Itens que esta versão não conhece aparecem como aviso e são preservados.');
    const items = []; let dropped = 0, unknown = 0;
    for (const raw of d.items.slice(0, 50000)) { const it = this.cleanItem(raw); if (!it) { dropped++; continue; } if (it.unknown) unknown++; items.push(it); }
    if (dropped) warnings.push(`${dropped} item(ns) inválido(s) foram ignorados.`);
    if (unknown) warnings.push(`${unknown} item(ns) de tipo desconhecido foram preservados.`);
    const board = d.board || {};
    const id = this.id(board.id) || uid();
    if (!items.some(i => i.id === '__meta')) items.push({ id: '__meta', type: 'meta', name: this.str(board.name, 120) || 'Quadro importado', bg: '#f6f6f4', pattern: 'dots', ts: 1, by: '' });
    const meta = items.find(i => i.id === '__meta');
    const loops = (Array.isArray(d.loops) ? d.loops : []).slice(0, 500).map(l => this.cleanLoop(l)).filter(Boolean);
    return {
      id, name: meta.name || 'Quadro', items, loops, warnings,
      created: this.num(board.created, now(), 0, 1e14), version: +d.version || 1,
      exportedBy: this.str(d.exportedBy, 60), exportedById: this.str(d.exportedById, 64), exportedAt: this.str(d.exportedAt, 40),
      count: items.filter(i => !i.deleted && i.type !== 'meta').length
    };
  },
  fileName(name) { return (String(name || 'quadro').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 80) || 'quadro') + '.lousa.json'; },
  async makeFile(id) {
    const d = await this.boardData(id);
    return new File([JSON.stringify(d)], this.fileName(d.board.name), { type: 'application/json' });
  },

  /* ---------- exportar ---------- */
  async download(id = App.boardId, file) {
    const f = file || await this.makeFile(id);
    const url = URL.createObjectURL(f);
    const a = h('a', { href: url, download: f.name, style: { display: 'none' } });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast(`Arquivo “${f.name}” salvo em Downloads`, [], 4500);
  },
  async share(id = App.boardId, ready) {
    // ready: arquivo já montado, para chamar navigator.share ainda dentro do toque (exigência do Safari)
    const f = ready || await this.makeFile(id);
    const text = 'Quadro da Lousa Livre. Para editar: abra o app › Quadros › Abrir arquivo.';
    // celulares nem sempre aceitam .json na folha de compartilhamento: tenta como texto
    const asTxt = new File([f], f.name.replace(/\.json$/, '.txt'), { type: 'text/plain' });
    for (const file of [f, asTxt]) {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: f.name, text }); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
    }
    await this.download(id, f);
  },

  /* ---------- importar ---------- */
  pick() {
    const fi = h('input', { type: 'file', accept: '.json,.lousa,.txt,application/json,text/plain', style: { display: 'none' } });
    fi.onchange = () => { const f = fi.files[0]; fi.remove(); if (f) this.importFile(f); };
    document.body.append(fi); fi.click();
  },
  isBoardFile(f) { const n = (f.name || '').toLowerCase(); return n.includes('.lousa') || n.endsWith('.json') || f.type === 'application/json'; },
  async importFile(file) {
    if (file.size > 200e6) { toast('Arquivo grande demais (máx. 200 MB)'); return; }
    let text; try { text = await readFile(file, 'text'); } catch { toast('Não foi possível ler o arquivo'); return; }
    await this.importText(text);
  },
  async importText(text) {
    let p; try { p = this.parse(text); } catch (e) { modal('Não foi possível abrir', [h('p', {}, e.message), h('p', {}, 'Use um arquivo exportado pela Lousa Livre (termina em .lousa.json ou .lousa.txt).')]); return; }
    const existing = await DB.get('boards', p.id).catch(() => null);
    const when = p.exportedAt ? new Date(p.exportedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const info = [h('p', { html: `<b>${esc(p.name)}</b> · ${p.count} item(ns)${p.exportedBy ? ' · enviado por ' + esc(p.exportedBy) : ''}${when ? ' em ' + when : ''}` })];
    p.warnings.forEach(w => info.push(h('p', { style: { color: '#b26a00' } }, '⚠ ' + w)));
    let choice;
    if (existing) {
      info.push(h('p', {}, 'Este quadro já está neste dispositivo. Mesclar junta as alterações dos dois lados: itens novos entram e, quando o mesmo item foi editado nos dois, fica a versão mais recente.'));
      choice = await modal('Quadro já existe aqui', info, [['Cancelar', '', () => null], ['Abrir como cópia', '', () => 'copy'], ['Mesclar alterações', 'pri', () => 'merge']]);
    } else {
      info.push(h('p', {}, 'Abrir mantém o vínculo com o quadro original: depois é possível devolver o arquivo e mesclar as alterações, ou colaborar ao vivo pelo servidor.'));
      choice = await modal('Abrir quadro recebido', info, [['Cancelar', '', () => null], ['Abrir como cópia', '', () => 'copy'], ['Abrir', 'pri', () => 'open']]);
    }
    if (!choice) return;
    this.mergeLoops(p.loops);
    if (choice === 'merge') await this.merge(p);
    else await this.openNew(p, choice === 'copy');
  },
  mergeLoops(loops) {
    const changed = [];
    for (const l of loops) if (newer(l, Loops.get(l.id))) { Loops.save(l, true); changed.push(l); }
    if (changed.length) Net.send(LOOP_ROOM, { t: 'op', items: changed });
  },
  async openNew(p, copy) {
    const id = copy ? uid() : p.id;
    const items = clone(p.items);
    const meta = items.find(i => i.id === '__meta');
    if (copy) { meta.name = (meta.name || 'Quadro') + ' (cópia)'; meta.ts = now(); }
    const fromOther = p.exportedById && p.exportedById !== App.user.id;
    await DB.put('boards', { id, name: meta.name, created: p.created, updated: now(), shared: !copy && !!fromOther, items });
    localStorage.removeItem('lousa:cam:' + id);
    if (this.onPage()) { location.href = goBoardUrl(id); return; }
    await openBoard(id);
    toast(copy ? 'Cópia aberta' : `Quadro “${meta.name}” aberto`);
  },
  async merge(p) {
    let added = 0, updated = 0, kept = 0;
    const count = (inc, cur) => { if (!cur) { added++; return true; } if (newer(inc, cur)) { updated++; return true; } kept++; return false; };
    if (App.boardId === p.id) {
      const changed = [];
      for (const it of p.items) { const cur = App.items.get(it.id); if (count(it, cur)) { App.items.set(it.id, it); R.render(it); changed.push(it); if (it.deleted) App.sel.delete(it.id); } }
      if (changed.length) Net.send(p.id, { t: 'op', items: changed });
      applyMeta(); scheduleSave(); onSelChange();
    } else {
      const rec = await DB.get('boards', p.id); const map = new Map((rec.items || []).map(i => [i.id, i]));
      for (const it of p.items) if (count(it, map.get(it.id))) map.set(it.id, it);
      rec.items = [...map.values()]; rec.updated = now(); rec.name = map.get('__meta')?.name || rec.name;
      await DB.put('boards', rec);
      if (this.onPage()) { sessionStorage.setItem('lousa:merged', `${added}|${updated}|${kept}`); location.href = goBoardUrl(p.id); return; }
      await openBoard(p.id);
    }
    modal('Alterações mescladas', [h('p', {}, `${added} item(ns) novo(s), ${updated} atualizado(s) e ${kept} mantido(s) porque a sua versão era mais recente ou igual.`)]);
  },

  onPage() { return document.body.classList.contains('page-view'); },

  /* ---------- navegador ---------- */
  check() {
    const miss = [];
    if (!window.indexedDB) miss.push('armazenamento local (os quadros não serão salvos)');
    if (!window.PointerEvent) miss.push('eventos de caneta/toque');
    if (miss.length) toast('Este navegador não oferece: ' + miss.join(', ') + '. Atualize-o para a melhor experiência.', [], 8000);
    // Safari (iPhone/iPad): impede o zoom da página inteira pelo gesto de pinça
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    // app instalado (PWA) aberto por um arquivo .lousa.json
    if ('launchQueue' in window) launchQueue.setConsumer(async params => { for (const fh of params.files || []) this.importFile(await fh.getFile()); });
    // funciona offline e pode ser instalado, quando servido por https ou localhost
    if ('serviceWorker' in navigator && window.isSecureContext && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  }
};
