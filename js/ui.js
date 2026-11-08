'use strict';
/* ================= interface ================= */
const isMobile = () => matchMedia('(max-width:760px),(pointer:coarse) and (max-width:1024px)').matches;
function ib(iconHtml, title, onclick, opts = {}) {
  const b = h('button', { class: 'ib' + (opts.on ? ' on' : '') + (opts.cls ? ' ' + opts.cls : ''), title, 'aria-label': title, html: iconHtml });
  b.addEventListener('pointerdown', e => { if (App.editing) e.preventDefault(); });
  b.addEventListener('click', e => onclick(e, b));
  if (opts.disabled) b.disabled = true;
  return b;
}
function cb(label, title, onclick, opts = {}) {
  const b = h('button', { class: 'cbtn' + (opts.on ? ' on' : ''), title, html: label });
  b.addEventListener('pointerdown', e => e.preventDefault());
  b.addEventListener('click', e => onclick(e, b));
  return b;
}
function swatchBtn(color, title, onclick) {
  const special = color === 'rainbow' || color === 'galaxy';
  const b = h('button', { class: 'swatch' + (special ? ' ' + color : ''), title, style: special ? {} : { background: color === 'transparent' ? 'repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 50%/8px 8px' : color } });
  b.addEventListener('pointerdown', e => e.preventDefault());
  b.addEventListener('click', e => onclick(e, b));
  return b;
}

const UI = {
  build() {
    $('#btnHome').innerHTML = icon('home'); $('#btnHome').onclick = async () => { await saveNow(); location.href = location.pathname + '#/explicacoes'; };
    $('#btnBoards').innerHTML = icon('boards'); $('#btnBoards').onclick = () => this.boards();
    $('#btnShare').innerHTML = icon('share') + '<span>Compartilhar</span>'; $('#btnShare').onclick = () => this.share();
    const qb = h('button', { class: 'ib', id: 'btnQuiz', title: 'Questões em grupo', 'aria-label': 'Questões em grupo', html: icon('quiz') });
    qb.onclick = () => { qb.classList.remove('pulse'); GQ.toggle(); };
    $('#btnShare').before(qb);
    $('#btnSettings').innerHTML = icon('palette'); $('#btnSettings').onclick = e => this.settingsPop(e.currentTarget);
    $('#btnMore').innerHTML = icon('more'); $('#btnMore').onclick = () => document.body.classList.toggle('ctl-open');
    $('#collabs').onclick = e => this.peoplePop(e.currentTarget);
    const bn = $('#boardName');
    bn.addEventListener('change', () => { const v = bn.value.trim() || 'Sem título'; setMeta(m => { m.name = v; }); });
    bn.addEventListener('keydown', e => { if (e.key === 'Enter') bn.blur(); });
    $('#fab').innerHTML = icon('plus'); $('#fab').onclick = () => this.toggleGallery();
    this.rail(); this.gallery(); this.zoombar(); this.inkbar();
    const fi = $('#fileInput'); fi.onchange = () => { if (fi.files.length) insertFiles([...fi.files], viewCenter()); fi.value = ''; };
  },
  pickFile(accept) { const fi = $('#fileInput'); fi.accept = accept; fi.multiple = true; fi.click(); },

  /* ---------- barra de tinta ---------- */
  inkbar() {
    const bar = $('#inkbar'); bar.innerHTML = '';
    const T = App.tool;
    bar.append(ib(icon('select'), 'Selecionar (V)', () => setTool('select'), { on: T === 'select' }));
    bar.append(ib(icon('hand'), 'Mover a tela (H ou segure Espaço)', () => setTool('pan'), { on: T === 'pan' }));
    bar.append(h('div', { class: 'sep' }));
    App.pens.forEach((p, i) => {
      const on = T === 'pen' && App.penIdx === i;
      const b = ib(icon('pen', p.kind === 'pen' ? p.color : p.kind === 'rainbow' ? '#ff9800' : '#7b2ff7'), `Caneta ${i + 1} — clique de novo para cor e espessura`, (e, el) => {
        if (on) this.penPop(el, i); else { App.penIdx = i; setTool('pen'); }
      }, { on });
      const dot = h('span', { class: 'dot' + (p.kind !== 'pen' ? ' swatch ' + p.kind : ''), style: p.kind === 'pen' ? { background: p.color } : {} }); b.append(dot);
      bar.append(b);
    });
    bar.append(ib(icon('highlighter', App.hl.color), 'Marca-texto (M) — clique de novo para opções', (e, el) => { if (T === 'highlighter') this.hlPop(el); else setTool('highlighter'); }, { on: T === 'highlighter' }));
    bar.append(ib(icon('eraser'), (App.eraser === 'precise' ? 'Borracha precisa' : 'Borracha de traço') + ' (E) — clique de novo para trocar', (e, el) => { if (T === 'eraser') this.eraserPop(el); else setTool('eraser'); }, { on: T === 'eraser' }));
    bar.append(h('div', { class: 'sep' }));
    const arrowIco = { none: 'arrowNone', end: 'arrowEnd', both: 'arrowBoth' }[App.arrow];
    bar.append(ib(icon(arrowIco), 'Setas de tinta: ' + ({ none: 'desligadas', end: 'ponta simples', both: 'ponta dupla' }[App.arrow]), (e, el) => this.arrowPop(el), { on: App.arrow !== 'none' }));
    bar.append(ib(icon('shapeInk'), 'Tinta para forma (' + (App.shapeInk ? 'ligada' : 'desligada') + '). Com caneta/dedo: desenhe e segure.', () => {
      App.shapeInk = !App.shapeInk; saveTools(); this.inkbar();
      toast(App.shapeInk ? 'Tinta para forma ligada: com mouse, formas são endireitadas automaticamente' : 'Tinta para forma desligada (com caneta, desenhar e segurar ainda converte)');
    }, { on: App.shapeInk }));
    bar.append(h('div', { class: 'sep' }));
    bar.append(this._undo = ib(icon('undo'), 'Desfazer (Ctrl+Z)', undo, { disabled: !App.undo.length }));
    bar.append(this._redo = ib(icon('redo'), 'Refazer (Ctrl+Y)', redo, { disabled: !App.redo.length }));
  },
  history() { if (this._undo) { this._undo.disabled = !App.undo.length; this._redo.disabled = !App.redo.length; } },
  widthRow(widths, cur, color, onPick) {
    const row = h('div', { class: 'pop-row' });
    widths.forEach(w => { const b = h('button', { class: 'wbtn' + (w === cur ? ' on' : ''), title: w + ' px' }, h('i', { style: { height: Math.min(w, 22) + 'px', width: Math.min(w, 22) + 'px', background: color } })); b.onclick = () => onPick(w); row.append(b); });
    return row;
  },
  swatchRow(colors, cur, onPick, names) {
    const row = h('div', { class: 'pop-row' });
    colors.forEach((c, i) => { const s = swatchBtn(c, names?.[i] || c, () => onPick(c)); if (c === cur) s.classList.add('on'); row.append(s); });
    return row;
  },
  penPop(anchor, i) {
    const p = App.pens[i]; const box = h('div');
    const upd = () => { saveTools(); this.inkbar(); Pop.close(); };
    box.append(h('div', { class: 'pop-title' }, 'Cor'));
    box.append(this.swatchRow(INK_COLORS, p.kind === 'pen' ? p.color : null, c => { p.color = c; p.kind = 'pen'; upd(); }));
    box.append(h('div', { class: 'pop-title' }, 'Tintas com efeito'));
    const fx = h('div', { class: 'pop-row' });
    [['rainbow', 'Arco-íris'], ['galaxy', 'Galáxia']].forEach(([k, n]) => { const s = swatchBtn(k, n, () => { p.kind = k; upd(); }); if (p.kind === k) s.classList.add('on'); fx.append(s, h('span', { style: { fontSize: '13px', marginRight: '8px' } }, n)); });
    box.append(fx);
    box.append(h('div', { class: 'pop-title' }, 'Espessura'));
    box.append(this.widthRow([2, 3, 5, 8, 12, 18], p.width, p.kind === 'pen' ? p.color : '#7b2ff7', w => { p.width = w; upd(); }));
    Pop.open(anchor, box, isMobile() ? 'above' : 'below');
  },
  hlPop(anchor) {
    const box = h('div'); const upd = () => { saveTools(); this.inkbar(); Pop.close(); };
    box.append(h('div', { class: 'pop-title' }, 'Marca-texto: destaque o que já está no quadro'));
    box.append(this.swatchRow(HL_COLORS, App.hl.color, c => { App.hl.color = c; upd(); }));
    box.append(this.widthRow([10, 16, 24, 34], App.hl.width, App.hl.color, w => { App.hl.width = w; upd(); }));
    Pop.open(anchor, box, isMobile() ? 'above' : 'below');
  },
  eraserPop(anchor) {
    const m = h('div', { class: 'menu' });
    const opt = (k, title, sub) => { const b = h('button', { html: `<div><b>${title}</b><div style="font-size:12px;color:#777">${sub}</div></div>` }); if (App.eraser === k) b.style.background = 'var(--acc2)'; b.onclick = () => { App.eraser = k; saveTools(); this.inkbar(); Pop.close(); }; m.append(b); };
    opt('stroke', 'Borracha de traço', 'Apaga o traço inteiro ao tocar — rápida');
    opt('precise', 'Borracha precisa', 'Apaga só onde passar, dividindo o traço');
    m.append(h('hr'));
    const all = h('button', { html: icon('trash') + 'Apagar toda a tinta do quadro' }); all.onclick = () => { Pop.close(); const ids = liveItems().filter(i => i.type === 'ink').map(i => i.id); if (ids.length) deleteItems(ids); toast(`${ids.length} traço(s) apagado(s)`, [['Desfazer', undo]]); };
    m.append(all);
    Pop.open(anchor, m, isMobile() ? 'above' : 'below');
  },
  arrowPop(anchor) {
    const m = h('div', { class: 'menu' });
    [['none', 'arrowNone', 'Sem seta'], ['end', 'arrowEnd', 'Ponta simples no final'], ['both', 'arrowBoth', 'Ponta dupla']].forEach(([k, ic, n]) => {
      const b = h('button', { html: icon(ic) + n }); if (App.arrow === k) b.style.background = 'var(--acc2)';
      b.onclick = () => { App.arrow = k; saveTools(); this.inkbar(); Pop.close(); if (!['pen'].includes(App.tool)) setTool('pen'); }; m.append(b);
    });
    Pop.open(anchor, m, isMobile() ? 'above' : 'below');
  },

  /* ---------- trilho de criação rápida ---------- */
  rail() {
    const r = $('#rail'); r.innerHTML = '';
    r.append(ib(icon('note'), 'Nota adesiva (N)', () => insert(Make.note(), true)));
    r.append(ib(icon('grid'), 'Grade de notas', () => insert(Make.grid())));
    r.append(ib(icon('text'), 'Caixa de texto (T)', () => insert(Make.text(), true)));
    r.append(ib(icon('shapes'), 'Formas', (e, b) => this.shapesPop(b)));
    r.append(ib(icon('image'), 'Imagem', () => this.pickFile('image/*')));
    r.append(ib(icon('smile'), 'Reações e adesivos', (e, b) => this.reactPop(b)));
    r.append(ib(icon('plus'), 'Galeria de criação', () => this.toggleGallery(), { cls: 'plus' }));
  },
  shapesPop(anchor) {
    const g = h('div', { class: 'gal-grid small', style: { width: '300px' } });
    Object.keys(SHAPES).forEach(k => { const t = h('button', { class: 'tile sm', title: SHAPES[k].n, html: shapeThumb(k) }); t.onclick = () => { Pop.close(); insert(Make.shape(k)); }; g.append(t); });
    Pop.open(anchor, g, 'right');
  },
  reactPop(anchor) {
    const box = h('div'); box.append(h('div', { class: 'pop-title' }, 'Escolha e toque numa nota para votar, ou no quadro para colar'));
    const row = h('div', { class: 'pop-row' });
    REACTIONS.forEach(e => { const b = h('button', { class: 'wbtn', style: { fontSize: '20px' } }, e); b.onclick = () => { Pop.close(); this.pickSticker(e); }; row.append(b); });
    box.append(row); Pop.open(anchor, box, 'right');
  },
  pickSticker(e) { App.sticker = e; setTool('sticker'); toast(`${e} Toque numa nota para votar, ou no quadro para colar. Esc para sair.`, [], 3000); if (isMobile()) this.toggleGallery(false); },

  /* ---------- galeria de criação ---------- */
  toggleGallery(force) { const g = $('#gallery'); const open = force ?? !g.classList.contains('open'); if (open !== g.classList.contains('open')) Sfx.play(open ? 'open' : 'close'); g.classList.toggle('open', open); Pop.close(); },
  gallery() {
    const g = $('#gallery'); g.innerHTML = '';
    const close = ib(icon('close'), 'Fechar', () => this.toggleGallery(false));
    g.append(h('div', { class: 'gal-head' }, 'Galeria de criação', close));
    const sc = h('div', { class: 'gal-scroll' }); g.append(sc);
    const done = () => { if (isMobile()) this.toggleGallery(false); };
    const sec = (title, tiles, small) => { sc.append(h('div', { class: 'gal-sec' }, title)); const grid = h('div', { class: 'gal-grid' + (small ? ' small' : '') }); tiles.forEach(t => grid.append(t)); sc.append(grid); return grid; };
    const tile = (ic, label, fn, opts = {}) => { const t = h('button', { class: 'tile' + (opts.sm ? ' sm' : ''), title: opts.title || label, html: ic + (label && !opts.sm ? `<span>${label}</span>` : '') }); if (opts.disabled) t.disabled = true; else t.onclick = () => { fn(); done(); }; return t; };
    sec('Notas', [
      tile(icon('note'), 'Nota adesiva', () => insert(Make.note(), true)),
      tile(icon('grid'), 'Grade de notas', () => insert(Make.grid())),
      tile(icon('text'), 'Texto', () => insert(Make.text(), true))
    ]);
    const nc = h('div', { class: 'pop-row', style: { margin: '8px 4px 0' } });
    NOTE_COLORS.forEach(c => { const s = swatchBtn(c.c, 'Nova nota ' + c.n, () => { App.noteColor = c.c; insert(Make.note({ color: c.c }), true); done(); }); nc.append(s); });
    sc.append(h('div', { class: 'gal-note' }, '12 cores de nota — clique numa cor para criar:'), nc);
    sec('Formas', Object.keys(SHAPES).map(k => tile(shapeThumb(k), SHAPES[k].n, () => insert(Make.shape(k)), { sm: true })), true);
    sec('Linhas e setas', [
      tile(icon('line').replace(/<path d="M12 5h7v7"[^>]*>/, ''), 'Linha', () => insert(Make.line())),
      tile(icon('line'), 'Seta', () => insert(Make.line({ endArrow: true }))),
      tile(icon('arrowBoth'), 'Seta dupla', () => insert(Make.line({ endArrow: true, startArrow: true }))),
      tile(icon('dashed'), 'Tracejada', () => insert(Make.line({ dash: true, endArrow: true }))),
      tile(icon('elbow'), 'Conector em cotovelo', () => insert(Make.line({ style: 'elbow', endArrow: true, b: null }))),
      tile(icon('curve'), 'Curva', () => insert(Make.line({ style: 'curve', endArrow: true })))
    ]);
    sec('Imagens, vídeos e documentos', [
      tile(icon('image'), 'Imagem', () => this.pickFile('image/*')),
      tile(icon('video'), 'Vídeo ou link', () => this.askLink()),
      tile(icon('link'), 'Link da web', () => this.askLink()),
      tile(icon('pdf'), 'PDF local', () => this.pickFile('application/pdf,.pdf')),
      tile(icon('video').replace('#ff4d4d', '#8e24aa'), 'Vídeo do computador', () => this.pickFile('video/*')),
      tile(icon('ppt'), 'PowerPoint', null, { disabled: true, title: 'Aposentado: exporte como PDF' })
    ]);
    sc.append(h('div', { class: 'gal-note' }, 'PowerPoint e PDFs de nuvem foram aposentados; continua disponível a inserção de PDF local. Arraste e solte ou cole (Ctrl+V) imagens, arquivos e links direto na tela.'));
    sec('Componentes Loop', [
      tile(icon('table'), 'Tabela', () => insert(Make.loop(Loops.create('table').id))),
      tile(icon('tasks'), 'Lista de tarefas', () => insert(Make.loop(Loops.create('tasks').id))),
      tile(icon('para'), 'Notas', () => insert(Make.loop(Loops.create('notes').id))),
      tile(icon('loop'), 'Inserir existente', () => this.existingLoops())
    ]);
    sc.append(h('div', { class: 'gal-note' }, 'Blocos vivos: o mesmo componente fica sincronizado em todos os quadros, abas e no link próprio dele.'));
    sec('Reações', REACTIONS.map(e => tile(`<span class="emo">${e}</span>`, '', () => this.pickSticker(e), { sm: true, title: 'Reação ' + e })), true);
  },
  async askLink() {
    const url = await promptText('Inserir vídeo ou link', 'Cole um link do YouTube, Vimeo, Loom, um vídeo .mp4, uma imagem ou qualquer página da web.', '', 'https://');
    if (url && url.trim() && url.trim() !== 'https://') insertEmbedUrl(url.trim());
  },
  existingLoops() {
    const list = [...Loops.map.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const box = h('div', { class: 'boards-list' });
    if (!list.length) box.append(h('p', {}, 'Nenhum componente Loop ainda.'));
    list.forEach(l => {
      const row = h('div', { class: 'brow', html: `<div class="bthumb" style="background:#f1edff">${icon(l.type === 'table' ? 'table' : l.type === 'tasks' ? 'tasks' : 'para')}</div><div class="binfo"><div class="bname">${esc(l.title || LOOP_NAMES[l.type])}</div><div class="bmeta">${LOOP_NAMES[l.type]} · atualizado ${new Date(l.ts || l.created).toLocaleString('pt-BR')}</div></div>` });
      row.onclick = () => { $('.modal-back')?.remove(); insert(Make.loop(l.id)); };
      box.append(row);
    });
    modal('Inserir componente Loop existente', [h('p', {}, 'O componente inserido continua o mesmo: editar aqui atualiza todos os lugares.'), box], [['Fechar', '', () => true]]);
  },

  /* ---------- zoom ---------- */
  zoombar() {
    const z = $('#zoombar'); z.innerHTML = '';
    z.append(ib(icon('zoomOut'), 'Diminuir zoom', () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.25)));
    const pct = h('button', { id: 'zoomPct', title: 'Voltar a 100%' }, '100%'); pct.onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / App.cam.z); z.append(pct);
    z.append(ib(icon('zoomIn'), 'Aumentar zoom', () => zoomAt(innerWidth / 2, innerHeight / 2, 1.25)));
    z.append(ib(icon('fit'), 'Ajustar ao conteúdo (Ctrl+0)', fitContent));
  },
  zoomLabel() { const p = $('#zoomPct'); if (p) p.textContent = Math.round(App.cam.z * 100) + '%'; },

  /* ---------- barra contextual ---------- */
  ctxSoon: debounce(() => UI.ctx(), 30),
  ctxHide() { $('#ctxbar').classList.remove('show'); },
  ctx() {
    const bar = $('#ctxbar'); bar.innerHTML = '';
    const s = selItems();
    if (!s.length || App.tool !== 'select') { bar.classList.remove('show'); return; }
    const types = new Set(s.map(i => i.type)); const ids = s.map(i => i.id); const one = s.length === 1 ? s[0] : null;
    const add = (...e) => bar.append(...e); const sep = () => add(h('div', { class: 'sep' }));
    const colorPop = (anchor, colors, cur, fn, names) => Pop.open(anchor, this.swatchRow(colors, cur, c => { fn(c); Pop.close(); }, names), 'above');
    const fontSel = (cur, fn) => { const sel = h('select', { class: 'cselect', title: 'Fonte' }); FONTS.forEach((f, i) => sel.append(h('option', { value: i, selected: i === (cur || 0) }, f.n))); sel.onchange = () => fn(+sel.value); return sel; };
    const fmt = () => { if (!App.editing || !App.sel.has(App.editing.id)) return; [['<b>N</b>', 'Negrito', 'bold'], ['<i>I</i>', 'Itálico', 'italic'], ['<u>S</u>', 'Sublinhado', 'underline'], ['<s>T</s>', 'Tachado', 'strikeThrough'], ['• Lista', 'Lista', 'insertUnorderedList']].forEach(([l, t, c]) => add(cb(l, t, () => document.execCommand(c)))); sep(); };
    const T = types.size === 1 ? [...types][0] : null;
    if (T === 'note') {
      fmt();
      add(swatchBtn(s[0].color, 'Cor da nota', (e, b) => colorPop(b, NOTE_COLORS.map(c => c.c), s[0].color, c => { App.noteColor = c; mutate(ids, it => { it.color = c; }); }, NOTE_COLORS.map(c => c.n))));
      add(fontSel(s[0].font, f => mutate(ids, it => { it.font = f; })));
      add(cb(s[0].fontSize ? 'A ' + s[0].fontSize : 'A auto', 'Tamanho do texto (auto = ajusta para caber)', (e, b) => {
        const box = h('div', { class: 'pop-row' });
        [['auto', 0], ['14', 14], ['18', 18], ['24', 24], ['32', 32]].forEach(([l, v]) => { const x = h('button', { class: 'wbtn', style: { width: 'auto', padding: '0 8px' } }, l); x.onclick = () => { mutate(ids, it => { it.fontSize = v || undefined; }); Pop.close(); }; box.append(x); });
        Pop.open(b, box, 'above');
      }));
      add(cb('😀', 'Reagir / votar', (e, b) => { const row = h('div', { class: 'pop-row' }); REACTIONS.forEach(em => { const x = h('button', { class: 'wbtn', style: { fontSize: '18px' } }, em); x.onclick = () => { ids.forEach(id => toggleReaction(id, em)); Pop.close(); }; row.append(x); }); Pop.open(b, row, 'above'); }));
      add(cb('👤', 'Mostrar/ocultar etiqueta de autor', () => mutate(ids, it => { it.showAuthor = it.showAuthor === false; }), { on: s[0].showAuthor !== false }));
      if (s.length > 1) add(cb(icon('sort') + 'Organizar por cor', 'Agrupa as notas selecionadas em colunas por cor', organizeNotesByColor));
    } else if (T === 'grid' && one) {
      const g = one;
      add(cb('− Col', 'Menos colunas', () => mutate(ids, it => { it.cols = Math.max(1, (it.cols || 3) - 1); })));
      add(h('span', { style: { fontSize: '13px', padding: '0 4px' } }, (g.cols || 3) + ' colunas'));
      add(cb('+ Col', 'Mais colunas', () => mutate(ids, it => { it.cols = Math.min(8, (it.cols || 3) + 1); })));
      sep();
      add(cb('+ Nota', 'Adicionar nota', () => gridAddNote(g.id)));
      add(cb(icon('palette') + 'Ordem das cores', 'Personalizar a ordem das cores', (e, b) => this.colorOrderPop(b, g)));
      add(cb(icon('sort') + 'Ordenar', 'Ordenar notas pela ordem das cores', () => gridSort(g.id)));
      add(fontSel(g.font, f => mutate(ids, it => { it.font = f; R.els.get(it.id)?.querySelectorAll('.gnote-body').forEach(b => b._fit = 0); })));
    } else if (T === 'text') {
      fmt();
      add(swatchBtn(s[0].color || '#1d1d24', 'Cor do texto', (e, b) => colorPop(b, INK_COLORS, s[0].color, c => mutate(ids, it => { it.color = c; }))));
      add(cb('A−', 'Diminuir', () => mutate(ids, it => { it.fontSize = Math.max(8, Math.round((it.fontSize || 22) / 1.15)); })));
      add(h('span', { style: { fontSize: '13px', minWidth: '26px', textAlign: 'center' } }, String(s[0].fontSize || 22)));
      add(cb('A+', 'Aumentar', () => mutate(ids, it => { it.fontSize = Math.min(300, Math.round((it.fontSize || 22) * 1.15)); })));
      add(fontSel(s[0].font, f => mutate(ids, it => { it.font = f; })));
      add(cb({ left: '⟸', center: '≡', right: '⟹' }[s[0].align || 'left'], 'Alinhamento', () => mutate(ids, it => { it.align = { left: 'center', center: 'right', right: 'left' }[it.align || 'left']; })));
    } else if (T === 'shape') {
      fmt();
      add(cb('Preench.', 'Cor de preenchimento', (e, b) => colorPop(b, SHAPE_COLORS, s[0].fill, c => mutate(ids, it => { it.fill = c; }))));
      add(swatchBtn(s[0].fill, 'Preenchimento', (e, b) => colorPop(b, SHAPE_COLORS, s[0].fill, c => mutate(ids, it => { it.fill = c; }))));
      add(cb('Borda', 'Cor da borda', (e, b) => colorPop(b, SHAPE_COLORS.slice(1), s[0].stroke, c => mutate(ids, it => { it.stroke = c; }))));
      add(swatchBtn(s[0].stroke, 'Cor da borda', (e, b) => colorPop(b, SHAPE_COLORS.slice(1), s[0].stroke, c => mutate(ids, it => { it.stroke = c; }))));
      add(cb('━', 'Espessura da borda', (e, b) => Pop.open(b, this.widthRow([0, 1, 2, 3, 5, 8], s[0].strokeWidth, '#333', w => { mutate(ids, it => { it.strokeWidth = w; }); Pop.close(); }), 'above')));
      add(cb(icon('shapes') + 'Forma', 'Trocar forma', (e, b) => { const g = h('div', { class: 'gal-grid small', style: { width: '280px' } }); Object.keys(SHAPES).forEach(k => { const t = h('button', { class: 'tile sm', title: SHAPES[k].n, html: shapeThumb(k) }); t.onclick = () => { mutate(ids, it => { it.shape = k; }); Pop.close(); }; g.append(t); }); Pop.open(b, g, 'above'); }));
      add(cb('Aa', 'Cor do texto', (e, b) => colorPop(b, INK_COLORS, s[0].textColor, c => mutate(ids, it => { it.textColor = c; }))));
      add(cb(icon('text') + 'Texto', 'Editar texto da forma', () => startEditing(s[0])));
    } else if (T === 'line') {
      add(swatchBtn(s[0].color, 'Cor', (e, b) => colorPop(b, INK_COLORS, s[0].color, c => mutate(ids, it => { it.color = c; }))));
      add(cb('━', 'Espessura', (e, b) => Pop.open(b, this.widthRow([1, 2, 3, 5, 8, 12], s[0].width, s[0].color, w => { mutate(ids, it => { it.width = w; }); Pop.close(); }), 'above')));
      add(cb('◂', 'Seta no início', () => mutate(ids, it => { it.startArrow = !it.startArrow; }), { on: s[0].startArrow }));
      add(cb('▸', 'Seta no fim', () => mutate(ids, it => { it.endArrow = !it.endArrow; }), { on: s[0].endArrow }));
      add(cb('┄', 'Tracejada', () => mutate(ids, it => { it.dash = !it.dash; }), { on: s[0].dash }));
      [['straight', 'line', 'Reta'], ['elbow', 'elbow', 'Cotovelo'], ['curve', 'curve', 'Curva']].forEach(([k, ic, n]) => add(cb(icon(ic), n, () => mutate(ids, it => { it.style = k; }), { on: (s[0].style || 'straight') === k })));
    } else if (T === 'ink') {
      const k = s[0].kind;
      add(swatchBtn(k === 'rainbow' || k === 'galaxy' ? k : s[0].color, 'Cor / efeito', (e, b) => {
        const box = h('div'); box.append(this.swatchRow(k === 'highlighter' ? HL_COLORS : INK_COLORS, s[0].color, c => { mutate(ids, it => { it.color = c; if (it.kind !== 'highlighter') it.kind = 'pen'; }); Pop.close(); }));
        const fx = h('div', { class: 'pop-row' }); [['rainbow', 'Arco-íris'], ['galaxy', 'Galáxia']].forEach(([kk, n]) => fx.append(swatchBtn(kk, n, () => { mutate(ids, it => { it.kind = kk; }); Pop.close(); }), h('span', { style: { fontSize: '13px' } }, n)));
        box.append(fx); Pop.open(b, box, 'above');
      }));
      add(cb('━', 'Espessura', (e, b) => Pop.open(b, this.widthRow([2, 3, 5, 8, 12, 18, 26], s[0].width, '#333', w => { mutate(ids, it => { it.width = w; }); Pop.close(); }), 'above')));
      add(cb(icon({ none: 'arrowNone', end: 'arrowEnd', both: 'arrowBoth' }[s[0].arrow || 'none']), 'Seta de tinta: alternar', () => mutate(ids, it => { it.arrow = { none: 'end', end: 'both', both: 'none' }[it.arrow || 'none']; })));
      sep();
      add(cb(icon('magic') + 'Em forma', 'Tinta para forma: endireitar traços', convertInkToShapes));
      add(cb(icon('inkText') + 'Em texto', 'Tinta para texto', inkToText));
      add(cb(icon('table') + 'Em tabela', 'Tinta para tabela (desenhe uma grade)', inkToTable));
    } else if (T === 'image' && one) {
      add(cb(icon('grab') + 'Capturar tinta', 'Ink grab: transforma o desenho da foto em traços de tinta editáveis', grabInk));
      add(cb('Proporção original', 'Restaurar proporção', () => { const img = R.els.get(one.id)?.querySelector('img'); if (img?.naturalWidth) mutate(ids, it => { it.h = r1(it.w * img.naturalHeight / img.naturalWidth); }); }));
    } else if (T === 'embed' && one) {
      add(cb(icon('hand2') + 'Interagir', 'Usar o vídeo/página/PDF sem mover (ou clique duas vezes)', () => { R.els.get(one.id)?.classList.add('interact'); }));
      if (one.url) add(cb(icon('open') + 'Abrir', 'Abrir em nova aba', () => window.open(one.url, '_blank', 'noopener')));
      if (one.kind === 'link') add(cb(one.preview ? 'Cartão' : 'Pré-visualizar', 'Alternar modo de exibição', () => mutate(ids, it => { it.preview = !it.preview; })));
    } else if (T === 'loop' && one) {
      add(cb(icon('link') + 'Copiar link', 'Link deste componente (abre sozinho, como num chat ou e-mail)', () => this.copy(loopLink(one.loopId), 'Link do componente copiado')));
      add(cb(icon('open') + 'Abrir sozinho', 'Abrir o componente fora do quadro', () => window.open(loopLink(one.loopId), '_blank')));
    } else if (T === 'sticker') {
      const row = h('div', { class: 'pop-row' });
      add(cb(s[0].emoji, 'Trocar adesivo', (e, b) => { REACTIONS.forEach(em => { const x = h('button', { class: 'wbtn', style: { fontSize: '18px' } }, em); x.onclick = () => { mutate(ids, it => { it.emoji = em; }); Pop.close(); }; row.append(x); }); Pop.open(b, row, 'above'); }));
    }
    if (s.length > 1) {
      if (types.has('ink') && types.size > 1) { add(cb(icon('magic') + 'Em forma', 'Converter tinta selecionada em formas', convertInkToShapes)); }
      add(cb(icon('align') + 'Alinhar', 'Alinhar e distribuir', (e, b) => {
        const m = h('div', { class: 'menu' });
        [['left', 'À esquerda'], ['hcenter', 'Centro horizontal'], ['right', 'À direita'], ['top', 'Topo'], ['vcenter', 'Centro vertical'], ['bottom', 'Base'], ['hdist', 'Distribuir na horizontal'], ['vdist', 'Distribuir na vertical']].forEach(([k, n], i) => { if (i === 6) m.append(h('hr')); const x = h('button', {}, n); x.onclick = () => { alignSel(k); Pop.close(); }; m.append(x); });
        Pop.open(b, m, 'above');
      }));
      add(h('span', { style: { fontSize: '12px', color: 'var(--muted)', padding: '0 6px' } }, s.length + ' itens'));
    }
    if (bar.children.length) sep();
    add(ib(icon('layers'), 'Camadas', (e, b) => {
      const m = h('div', { class: 'menu' });
      [['front', 'front', 'Trazer para frente'], ['forward', 'front', 'Avançar'], ['backward', 'back', 'Recuar'], ['back', 'back', 'Enviar para trás']].forEach(([k, ic, n]) => { const x = h('button', { html: icon(ic) + n }); x.onclick = () => { zOrder(k); Pop.close(); }; m.append(x); });
      Pop.open(b, m, 'above');
    }));
    add(ib(icon('copy'), 'Duplicar (Ctrl+D)', duplicate));
    add(ib(icon('trash'), 'Excluir (Delete)', () => deleteItems(ids)));
    bar.classList.add('show'); this.placeCtx();
  },
  placeCtx() {
    const bar = $('#ctxbar'); if (!bar.classList.contains('show')) return;
    if (G && G.type !== 'marquee') { bar.classList.remove('show'); return; }
    const b = selScreenBox(); if (!b) return;
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    let x = b.x + b.w / 2 - bw / 2, y = b.y - bh - 46;
    if (y < 62) y = b.y + b.h + 20;
    if (y + bh > innerHeight - (isMobile() ? 80 : 10)) y = Math.max(62, Math.min(innerHeight - bh - 80, b.y + 10));
    bar.style.left = clamp(x, 8, Math.max(8, innerWidth - bw - 8)) + 'px'; bar.style.top = y + 'px';
  },
  colorOrderPop(anchor, g) {
    const box = h('div'); let order = (g.colorOrder || []).slice();
    const cur = h('div', { class: 'pop-row' });
    const draw = () => { cur.innerHTML = ''; if (!order.length) cur.append(h('span', { style: { fontSize: '12px', color: '#888' } }, '(vazia)')); order.forEach((i, k) => cur.append(h('span', { class: 'swatch', title: (k + 1) + 'ª: ' + NOTE_COLORS[i].n, style: { background: NOTE_COLORS[i].c, display: 'inline-block' } }))); };
    box.append(h('div', { class: 'pop-title' }, 'Ordem atual (novas notas seguem esta sequência)'), cur);
    box.append(h('div', { class: 'pop-title' }, 'Clique nas cores na ordem desejada'));
    box.append(this.swatchRow(NOTE_COLORS.map(c => c.c), null, c => { order.push(NOTE_COLORS.findIndex(x => x.c === c)); draw(); }, NOTE_COLORS.map(c => c.n)));
    const row = h('div', { class: 'pop-row' });
    row.append(h('button', { class: 'mbtn', onclick: () => { order = []; draw(); } }, 'Limpar'));
    row.append(h('button', { class: 'mbtn pri', onclick: () => { if (!order.length) order = [0]; mutate([g.id], it => { it.colorOrder = order; }); gridSort(g.id); Pop.close(); } }, 'Aplicar e ordenar'));
    box.append(row); draw(); Pop.open(anchor, box, 'above');
  },

  /* ---------- pessoas e status ---------- */
  collabs() {
    const c = $('#collabs'); if (!c) return; c.innerHTML = '';
    const ppl = [{ user: App.user, me: true }, ...[...App.peers.values()]];
    ppl.slice(0, 5).forEach(p => c.append(h('div', { class: 'avatar', style: { background: p.user?.color || '#888' }, title: (p.user?.name || '') + (p.me ? ' (você)' : '') }, initials(p.user?.name))));
    if (ppl.length > 5) c.append(h('div', { class: 'avatar', style: { background: '#666' } }, '+' + (ppl.length - 5)));
  },
  peoplePop(anchor) {
    const box = h('div', { class: 'plist' });
    box.append(h('div', { class: 'pop-title' }, 'Colaborando neste quadro'));
    const row = (u, extra) => h('div', { class: 'prow' }, h('div', { class: 'avatar', style: { background: u?.color || '#888' } }, initials(u?.name)), h('div', {}, (u?.name || '?') + (extra || '')));
    box.append(row(App.user, ' (você)'));
    for (const p of App.peers.values()) box.append(row(p.user, p.user?.id === App.user.id ? ' (você, outra aba)' : ''));
    if (!App.peers.size) box.append(h('p', { style: { fontSize: '13px', color: '#777', margin: '4px 0' } }, 'Ninguém mais por aqui. Use “Compartilhar” para convidar.'));
    box.append(h('button', { class: 'mbtn', onclick: () => { Pop.close(); this.askName(); } }, 'Mudar meu nome'));
    Pop.open(anchor, box);
  },
  net() {
    const n = $('#netStatus'); if (!n) return;
    const code = App.boardId && Cloud.codeOf(App.boardId), st = code && Cloud.state(App.boardId);
    if (code) { n.className = 'net' + (st === 'on' ? ' on' : st === 'error' ? ' err' : ' local'); n.title = st === 'on' ? `Sala ao vivo ${Cloud.fmt(code)}: conectado` : st === 'error' ? 'Sem conexão com a nuvem. Tentando de novo…' : 'Conectando à sala…'; return; }
    if (Net.server) { n.className = 'net' + (Net.online ? ' on' : ''); n.title = Net.online ? 'Conectado ao servidor: colaboração em tempo real entre dispositivos' : 'Reconectando ao servidor…'; }
    else { n.className = 'net local'; n.title = 'Colaboração entre abas e janelas deste navegador. Para outros dispositivos, inicie o servidor (iniciar-servidor.cmd).'; }
  },
  async askName() {
    const inp = h('input', { class: 'field', value: App.user.name, maxlength: 40 });
    const v = await modal('Como você quer ser identificado?', [h('p', {}, 'Seu nome aparece na lista de colaboradores, no seu cursor e nas etiquetas de autor das notas.'), inp], [['Agora não', '', () => null], ['Salvar', 'pri', () => inp.value]]);
    if (v) setUserName(v); else localStorage.setItem('lousa:named', '1');
  },
  copy(text, msg) {
    const ok = () => toast(msg || 'Copiado');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, () => { prompt('Copie:', text); });
    else prompt('Copie:', text);
  },

  /* ---------- compartilhar ---------- */
  share() { return Cloud.enabled() ? this.shareLive() : this.shareLocal(); },
  /* sala ao vivo na nuvem: link, código curto e QR */
  async shareLive() {
    const id = App.boardId;
    const live = h('div', { class: 'share-live' }, h('p', {}, 'Preparando a sala ao vivo…'));
    const more = h('details', { class: 'share-more' }, h('summary', {}, 'Outras formas: enviar o arquivo do quadro'));
    const acts = h('div', { class: 'share-actions' }); let ready = null;
    Compat.makeFile(id).then(f => { ready = f; }).catch(() => { });
    acts.append(h('button', { html: icon('share') + 'Enviar arquivo', onclick: () => Compat.share(id, ready) }), h('button', { html: icon('open') + 'Baixar arquivo', onclick: () => Compat.download(id, ready) }));
    more.append(acts);
    modal('Compartilhar quadro', [live, more], [['Fechar', '', () => true]]);
    try {
      let code = meta().room;
      if (!code) { code = await Cloud.createRoom(id); const m = meta(); m.room = code; putItems([m]); }
      await Cloud.attach(id, code); Cloud.seed(id); Cloud.offloadSoon(id);
      const link = Cloud.link(code);
      live.innerHTML = '';
      const qr = h('div', { class: 'qr' }); this.qr(qr, link);
      live.append(
        h('p', {}, 'Quem abrir o link ou digitar o código entra neste quadro e edita junto com você, em qualquer aparelho. As questões em grupo também acontecem aqui.'),
        h('div', { class: 'share-grid' }, qr, h('div', { class: 'share-code' }, h('small', {}, 'Código da sala'), h('b', {}, Cloud.fmt(code)), h('small', {}, 'Na tela inicial: Entrar com código'))),
        h('input', { class: 'field', value: link, readonly: true, onfocus: e => e.target.select() }),
        h('div', { class: 'share-actions' },
          h('button', { html: icon('copy') + 'Copiar link', onclick: () => { Sfx.play('pop'); this.copy(link, 'Link copiado'); } }),
          navigator.share ? h('button', { html: icon('share') + 'Enviar link', onclick: () => navigator.share({ title: meta().name, text: 'Entre no meu quadro da Lousa Livre', url: link }).catch(() => { }) }) : h('button', { html: icon('copy') + 'Copiar código', onclick: () => this.copy(Cloud.fmt(code), 'Código copiado') })));
      if (/^(localhost|127\.|\[::1\]$)/.test(location.hostname)) live.append(h('p', { class: 'warn' }, 'Você está no endereço local (localhost): o link só abre neste PC. Em outro aparelho, use o código da sala no app publicado.'));
    } catch (err) {
      console.warn(err);
      live.innerHTML = ''; live.append(h('p', { class: 'warn' }, 'Não foi possível criar a sala na nuvem. Confira a internet e tente de novo.'));
    }
  },
  qr(box, text) {
    const draw = () => { try { const q = qrcode(0, 'M'); q.addData(text); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch { box.remove(); } };
    if (window.qrcode) return draw();
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = draw; s.onerror = () => box.remove(); document.head.append(s);
  },
  shareLocal() {
    const id = App.boardId;
    const local = /^(localhost|127\.|\[::1\]$)/.test(location.hostname);
    const lanUrls = (Net.info?.urls || []);
    const base = Net.server && local && lanUrls.length ? lanUrls[0] : location.href.split('?')[0].split('#')[0];
    const link = base + '?b=' + id;
    const inp = h('input', { class: 'field', value: link, readonly: true, onfocus: e => e.target.select() });
    const parts = [];
    // 1) arquivo: funciona em qualquer navegador, sem servidor
    parts.push(h('p', { html: '<b>Enviar o arquivo do quadro</b> — funciona em qualquer navegador, do PC ou do celular, mesmo sem internet. Quem recebe abre em <i>Quadros › Abrir arquivo</i>, edita e pode devolver para você mesclar as alterações.' }));
    const acts = h('div', { class: 'share-actions' });
    const canShare = !!navigator.canShare; let ready = null;
    Compat.makeFile(id).then(f => { ready = f; }).catch(() => { });
    acts.append(h('button', { html: icon('share') + (canShare ? 'Enviar…' : 'Enviar arquivo'), onclick: () => Compat.share(id, ready) }));
    acts.append(h('button', { html: icon('open') + 'Baixar arquivo', onclick: () => Compat.download(id, ready) }));
    parts.push(acts);
    // 2) link ao vivo
    parts.push(h('p', { html: '<b>Colaborar ao vivo pelo link</b> — todos editam o mesmo quadro ao mesmo tempo.' }), inp);
    if (!Net.server) parts.push(h('p', { html: 'Sem o servidor, o link só funciona em outras abas deste navegador. Para usar no celular ao vivo, rode <code>iniciar-servidor.cmd</code> no PC e abra o endereço de rede que ele mostrar.' }));
    else if (local && !lanUrls.length) parts.push(h('p', { html: Net.info?.lan === false ? 'O servidor está liberado só para este computador. Veja no LEIA-ME como liberar na rede (um comando, uma vez).' : 'Para o celular, use o endereço de rede mostrado na janela do servidor.' }));
    else if (local) parts.push(h('p', {}, 'O celular precisa estar no mesmo Wi-Fi que este PC.'));
    modal('Compartilhar quadro', parts, [['Fechar', '', () => true], ['Copiar link', 'pri', () => { this.copy(link, 'Link copiado'); return true; }]]);
  },

  /* ---------- fundo e ajustes ---------- */
  settingsPop(anchor) {
    const m = meta(); const box = h('div', { style: { width: '300px' } });
    box.append(h('div', { class: 'pop-title' }, 'Cor do fundo'));
    box.append(this.swatchRow(BG_COLORS, m.bg, c => { setMeta(x => { x.bg = c; }); this.settingsPop(anchor); this.settingsPop(anchor); }));
    box.append(h('div', { class: 'pop-title' }, 'Padrão do fundo'));
    const pr = h('div', { class: 'pop-row' });
    [['none', 'Liso'], ['dots', 'Pontilhado'], ['grid', 'Grade'], ['lines', 'Pautado']].forEach(([k, n]) => { const b = h('button', { class: 'mbtn' + (m.pattern === k ? ' pri' : '') }, n); b.onclick = () => { setMeta(x => { x.pattern = k; }); this.settingsPop(anchor); this.settingsPop(anchor); }; pr.append(b); });
    box.append(pr);
    box.append(h('div', { class: 'pop-title' }, 'Organização'));
    const tg = (key, label) => { const i = h('input', { type: 'checkbox' }); i.checked = !!App.settings[key]; i.onchange = () => { App.settings[key] = i.checked; saveSettings(); }; return h('label', { class: 'toggle' }, label, i); };
    box.append(tg('guides', 'Guias de alinhamento ao mover'), tg('gridSnap', 'Encaixar na grade'), tg('colorByPerson', 'Cor de nota por pessoa'));
    const snd = h('input', { type: 'checkbox' }); snd.checked = Sfx.on; snd.onchange = () => Sfx.set(snd.checked);
    box.append(h('label', { class: 'toggle' }, 'Sons e efeitos', snd));
    box.append(h('div', { class: 'pop-title', style: { marginTop: '10px' } }, 'Quadro'));
    const row = h('div', { class: 'pop-row' });
    row.append(h('button', { class: 'mbtn', onclick: () => { Pop.close(); Compat.share(App.boardId); } }, 'Exportar / enviar'), h('button', { class: 'mbtn', onclick: () => { Pop.close(); Compat.pick(); } }, 'Abrir arquivo'));
    box.append(row);
    Pop.open(anchor, box);
  },

  /* ---------- seletor de quadros ---------- */
  async boards(tab = 'mine') {
    const all = (await DB.all('boards')).sort((a, b) => b.updated - a.updated);
    const list = h('div', { class: 'boards-list' });
    const tabs = h('div', { class: 'tabs' });
    const show = t => {
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      list.innerHTML = '';
      const rows = all.filter(b => t === 'mine' ? !b.shared : b.shared);
      if (!rows.length) list.append(h('p', {}, t === 'mine' ? 'Nenhum quadro ainda.' : 'Quadros abertos por links de outras pessoas aparecem aqui.'));
      rows.forEach(b => {
        const m = (b.items || []).find(i => i.id === '__meta') || {};
        const n = (b.items || []).filter(i => !i.deleted && i.type !== 'meta').length;
        const r = h('div', { class: 'brow' + (b.id === App.boardId ? ' cur' : ''), html: `<div class="bthumb" style="background:${esc(m.bg || '#131f24')};box-shadow:inset 0 0 0 2px #37464f">${icon('note')}</div><div class="binfo"><div class="bname">${esc(m.name || b.name)}</div><div class="bmeta">${n} item(ns) · ${new Date(b.updated).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div></div>${b.shared ? '<span class="badge">Compartilhado comigo</span>' : ''}` });
        r.onclick = async e => { if (e.target.closest('.bact')) return; $('.modal-back')?.remove(); await openBoard(b.id); };
        const acts = h('div', { style: { display: 'flex', gap: '2px' } });
        acts.append(ib(icon('text'), 'Renomear', async () => {
          const v = await promptText('Renomear quadro', '', m.name || b.name); if (!v) return;
          if (b.id === App.boardId) setMeta(x => { x.name = v; }); else { const mm = b.items.find(i => i.id === '__meta'); if (mm) { mm.name = v; mm.ts = now(); } b.name = v; await DB.put('boards', b); }
          $('.modal-back')?.remove(); this.boards(t);
        }, { cls: 'bact' }));
        acts.append(ib(icon('share'), 'Exportar / enviar arquivo', () => Compat.share(b.id), { cls: 'bact' }));
        acts.append(ib(icon('copy'), 'Duplicar', async () => {
          if (b.id === App.boardId) await saveNow();
          const src = await DB.get('boards', b.id); const id = uid(); const items = clone(src.items); const mm = items.find(i => i.id === '__meta'); if (mm) { mm.name = (mm.name || b.name) + ' (cópia)'; mm.ts = now(); }
          await DB.put('boards', { ...src, id, name: (m.name || b.name) + ' (cópia)', shared: false, created: now(), updated: now(), items });
          $('.modal-back')?.remove(); this.boards('mine');
        }, { cls: 'bact' }));
        acts.append(ib(icon('trash'), 'Excluir', async () => {
          const ok = await modal('Excluir quadro?', [h('p', {}, `“${m.name || b.name}” será removido deste dispositivo. Colaboradores que já têm o quadro mantêm a cópia deles.`)], [['Cancelar', '', () => false], ['Excluir', 'danger', () => true]]);
          if (!ok) { this.boards(t); return; }
          await DB.del('boards', b.id); localStorage.removeItem('lousa:cam:' + b.id);
          if (b.id === App.boardId) { const rest = all.filter(x => x.id !== b.id); if (rest.length) await openBoard(rest[0].id); else await createBoard('Novo quadro'); }
          this.boards(t);
        }, { cls: 'bact' }));
        r.append(acts); list.append(r);
      });
    };
    [['mine', 'Meus quadros'], ['shared', 'Compartilhados comigo']].forEach(([k, n]) => { const b = h('button', { 'data-t': k }, n); b.onclick = () => show(k); tabs.append(b); });
    show(tab);
    const hint = h('p', { style: { fontSize: '12.5px' } }, 'Recebeu um quadro de outra pessoa ou do seu outro aparelho? Use “Abrir arquivo” (ou arraste o arquivo para a tela).');
    modal('Quadros', [tabs, list, hint], [['Fechar', '', () => true], ['Abrir arquivo', '', () => { Compat.pick(); return true; }], ['+ Novo quadro', 'pri', async () => { const v = await promptText('Novo quadro', 'Nome do quadro', 'Novo quadro'); if (v != null) await createBoard(v.trim() || 'Novo quadro'); return true; }]]);
  },

  mobile() { this.placeCtx(); },

  /* ---------- componente Loop sozinho (como apareceria num chat ou e-mail) ---------- */
  loopView(id) {
    document.body.classList.add('loop-view');
    const wrap = h('div', { class: 'loop-standalone' });
    wrap.append(h('h1', {}, 'Componente Loop · as edições aparecem em todos os quadros onde ele foi inserido'));
    const item = h('div', { class: 'item loop' }); const card = loopCard(id); item.append(card); wrap.append(item);
    document.body.append(wrap);
    const draw = () => { const l = Loops.get(id); if (l) renderLoop(card, l); else card.querySelector('.loop-body').innerHTML = '<p style="color:#888">Procurando o componente… mantenha um quadro com ele aberto em outra aba ou use o servidor.</p>'; };
    App.onLoopChanged = lid => { if (lid === id) draw(); };
    wrap.addEventListener('input', e => { const c = e.target.closest('.loop-card'); if (c) onLoopInput(c, e.target); });
    wrap.addEventListener('click', e => { const act = e.target.closest('[data-act]')?.dataset.act; if (act) onLoopAction(card, e.target, act); });
    draw();
  }
};
function loopLink(id) { return location.href.split('?')[0].split('#')[0] + '?loop=' + id; }

