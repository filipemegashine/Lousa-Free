'use strict';
/* =====================================================================
   Questões em grupo, dentro do quadro.
   O estado vive no próprio quadro, então sincroniza como qualquer item:
   - "__quiz": a sessão (fonte, nível, ordem, questão atual, fase)
   - "__qa_<pessoa>": as respostas de cada pessoa (cada um só escreve a sua)
   ===================================================================== */
const GQ = {
  el: null, open: false, sig: '', phaseKey: '', imgs: new Map(), asked: new Set(), _qm: null,
  init() {
    if (this.el) return;
    this.el = h('aside', { id: 'gq', class: 'panel', 'aria-label': 'Questões em grupo' });
    document.body.append(this.el);
    Enem.init().catch(() => 0).then(() => { this.sig = ''; this.render(); }); // imagens das provas guardadas neste aparelho
  },
  qmap() { if (!this._qm) this._qm = new Map([...Enem.questionsAll(), ...QUESTIONS].map(q => [q.id, q])); return this._qm; },
  sess() { const s = getItem('__quiz'); return s && s.active ? s : null; },
  people() {
    const m = new Map([[App.user.id, { ...App.user, me: true }]]);
    for (const p of App.peers.values()) if (p.user && p.user.id && !m.has(p.user.id)) m.set(p.user.id, p.user);
    return [...m.values()];
  },
  answers(sid) { return [...App.items.values()].filter(i => !i.deleted && i.type === 'quizans' && i.sid === sid); },
  toggle(force) {
    this.open = force ?? !this.open;
    this.el.classList.toggle('open', this.open);
    $('#btnQuiz')?.classList.toggle('on', this.open);
    Sfx.play(this.open ? 'open' : 'close');
    this.sig = ''; this.render();
  },
  changed: debounce(function () { GQ.tick(); }, 40),

  /* reage a mudanças: sons de fase, revelação automática, aviso para quem está com o painel fechado */
  tick() {
    if (!this.el) return;
    const s = this.sess();
    const key = s ? `${s.sid}:${s.i}:${s.phase}` : 'none';
    if (key !== this.phaseKey) {
      const prev = this.phaseKey; this.phaseKey = key;
      if (s && prev) {
        if (s.phase === 'reveal') { const mine = this.myAnswer(s); const q = this.qmap().get(s.order[s.i]); if (mine != null && q) Sfx.play(mine === q.answer ? 'correct' : 'wrong'); }
        else if (s.phase === 'done') { Sfx.play('complete'); if (this.open) Fx.confetti({ n: 140 }); }
        else if (s.phase === 'answer') Sfx.play('whoosh');
      }
      if (s && (!prev || prev === 'none' || !prev.startsWith(s.sid)) && !this.open && s.host !== App.user.id) {
        toast(`${s.hostName || 'Alguém'} começou um quiz em grupo`, [['Abrir', () => this.toggle(true)]], 8000);
        $('#btnQuiz')?.classList.add('pulse');
      }
    }
    // revela sozinho quando todos que estão na sala responderam
    if (s && s.phase === 'answer') {
      const qid = s.order[s.i], ans = this.answers(s.sid), ppl = this.people();
      if (ppl.length && ppl.every(p => ans.some(a => a.user.id === p.id && a.a[qid] != null))) this.setPhase('reveal');
    }
    this.render();
  },
  myAnswer(s) { const a = getItem('__qa_' + App.user.id); return a && a.sid === s.sid ? a.a[s.order[s.i]] ?? null : null; },

  /* ---------- ações (qualquer participante pode fazer) ---------- */
  start(src, level) {
    const pool = (src === 'enem' ? Enem.questionsAll() : QUESTIONS).filter(q => q.level === level);
    const order = Quiz.shuffle(pool).map(q => q.id);
    if (!order.length) { toast('Nenhuma questão neste nível'); return; }
    putItems([{ id: '__quiz', type: 'quiz', active: true, sid: uid(), src, level, order, i: 0, phase: 'answer', host: App.user.id, hostName: App.user.name }]);
    Sfx.play('create');
  },
  answer(k) {
    const s = this.sess(); if (!s || s.phase !== 'answer') return;
    const id = '__qa_' + App.user.id, cur = getItem(id);
    const it = cur && cur.sid === s.sid ? clone(cur) : { id, type: 'quizans', sid: s.sid, a: {} };
    it.user = { id: App.user.id, name: App.user.name, color: App.user.color };
    it.a[s.order[s.i]] = k; Sfx.play('select'); putItems([it]);
  },
  setPhase(phase) { const s = this.sess(); if (!s || s.phase === phase) return; putItems([{ ...s, phase }]); },
  next() { const s = this.sess(); if (!s) return; if (s.i + 1 >= s.order.length) putItems([{ ...s, phase: 'done' }]); else putItems([{ ...s, i: s.i + 1, phase: 'answer' }]); },
  end() { const s = getItem('__quiz'); if (s) putItems([{ ...s, active: false }]); },

  /* ---------- imagem da questão oficial: do PDF local ou de quem tem o PDF ---------- */
  async imgUrl(k) {
    if (Enem.count) return Enem.url(k);
    if (this.imgs.has(k)) return this.imgs.get(k);
    if (!this.asked.has(k)) { this.asked.add(k); Net.send(App.boardId, { t: 'gq-img-req', k }); setTimeout(() => this.asked.delete(k), 6000); }
    return '';
  },
  async shrink(k) {
    const u = await Enem.url(k); if (!u) return null;
    const img = new Image(); img.src = u; await img.decode();
    const w = Math.min(760, img.naturalWidth > 1200 ? img.naturalWidth / 2 : img.naturalWidth), hh = Math.round(img.naturalHeight * w / img.naturalWidth);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = hh; const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, w, hh); c.drawImage(img, 0, 0, w, hh);
    return cv.toDataURL('image/jpeg', 0.72);
  },
  async onMsg(m) {
    if (m.t === 'gq-img-req' && Enem.count && Number.isInteger(m.k) && m.k >= 1 && m.k <= ENEM_META.length) {
      const data = await this.shrink(m.k).catch(() => null);
      if (data) Net.send(App.boardId, { t: 'gq-img', k: m.k, data });
    } else if (m.t === 'gq-img' && typeof m.data === 'string' && /^data:image\/jpeg;base64,/.test(m.data) && m.data.length < 400000) {
      this.imgs.set(m.k, m.data); this.sig = ''; this.render();
    }
  },
  /* coloca a questão no quadro para anotar junto */
  async toBoard(q) {
    const at = viewCenter();
    if (q.pdfImg) {
      let src = await this.imgUrl(q.pdfImg); if (!src) { toast('A imagem ainda está chegando'); return; }
      if (src.startsWith('blob:')) src = await readFile(await (await fetch(src)).blob());
      const img = new Image(); img.src = src; await img.decode().catch(() => { });
      insert(Make.image(src, img.naturalWidth || 700, img.naturalHeight || 900, at));
    } else if (q.visual) {
      const svg = Visual.render(q.visual); const vb = (svg.match(/viewBox="0 0 (\d+) (\d+)"/) || []).slice(1).map(Number);
      const src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" '))));
      insert(Make.image(src, vb[0] || 600, vb[1] || 300, at));
    }
    if (q.text || q.stem) { const t = Make.text({ x: at.x - 260, y: at.y + (q.pdfImg || q.visual ? 260 : 0), w: 520 }); t.html = esc([q.text, q.stem].filter(Boolean).join('\n\n')).replace(/\n/g, '<br>'); t.fontSize = 18; insert(t); }
    toast('Questão colocada no quadro');
    if (isMobile()) this.toggle(false);
  },

  /* ---------- desenho do painel ---------- */
  avatar(u, extra = '') { return `<span class="gq-av${extra}" style="background:${esc(u.color || '#1cb0f6')}" title="${esc(u.name || '')}">${esc(initials(u.name))}</span>`; },
  render() {
    if (!this.el || !this.open) return;
    const s = this.sess(), ppl = this.people(), ans = s ? this.answers(s.sid) : [];
    const sig = JSON.stringify([s && [s.sid, s.i, s.phase, s.order.length], ppl.map(p => p.id + p.name), ans.map(a => [a.user.id, a.a]), Enem.count, this.imgs.size]);
    if (sig === this.sig) return; this.sig = sig;
    const scroll = this.el.scrollTop; this.el.innerHTML = '';
    const head = h('div', { class: 'gq-head' }, h('b', {}, 'Questões em grupo'), h('button', { class: 'ib', title: 'Fechar', html: icon('close'), onclick: () => this.toggle(false) }));
    const room = Cloud.codeOf(App.boardId);
    const people = h('div', { class: 'gq-people', html: ppl.map(p => this.avatar(p)).join('') + `<span>${ppl.length === 1 ? 'Só você por enquanto' : ppl.length + ' na sala'}${room ? ' · ' + Cloud.fmt(room) : ''}</span>` });
    this.el.append(head, people);
    if (!s) this.renderSetup(); else if (s.phase === 'done') this.renderDone(s, ans, ppl); else this.renderQuestion(s, ans, ppl);
    this.el.scrollTop = s && this._lastQ === `${s.sid}:${s.i}` ? scroll : 0;
    this._lastQ = s ? `${s.sid}:${s.i}` : '';
  },
  renderSetup() {
    let src = localStorage.getItem('lousa:gq:src') || 'enem';
    const box = h('div', { class: 'gq-body' });
    box.append(h('p', { class: 'gq-hint' }, 'Todos na sala respondem a mesma questão. As respostas aparecem juntas quando todos responderem.'));
    const seg = h('div', { class: 'seg' });
    [['enem', 'Provas ENEM'], ['extra', 'Extras']].forEach(([k, n]) => seg.append(h('button', { class: k === src ? 'on' : '', onclick: () => { localStorage.setItem('lousa:gq:src', k); this.sig = ''; this.render(); } }, n)));
    box.append(seg);
    if (src === 'enem' && !Enem.count) box.append(h('p', { class: 'gq-hint warn' }, 'Este aparelho não tem o PDF das provas: as imagens das questões virão de quem tiver.'));
    for (const [k, L] of Object.entries(LEVELS)) {
      const n = (src === 'enem' ? Enem.questionsAll() : QUESTIONS).filter(q => q.level === k).length;
      box.append(h('button', { class: 'gq-level', style: { '--c': L.color }, onclick: () => this.start(src, k), html: `<span class="lvl-dot">${{ facil: 1, medio: 2, dificil: 3 }[k]}</span><span><b>${L.name}</b><small>${n} questões</small></span>` }));
    }
    this.el.append(box);
  },
  renderQuestion(s, ans, ppl) {
    const q = this.qmap().get(s.order[s.i]); const L = LEVELS[s.level];
    const box = h('div', { class: 'gq-body' });
    if (!q) { box.append(h('p', {}, 'Questão indisponível nesta versão do app.'), h('button', { class: 'pbtn', onclick: () => this.next() }, 'Pular')); this.el.append(box); return; }
    const reveal = s.phase === 'reveal', mine = this.myAnswer(s), qid = q.id;
    box.append(h('div', { class: 'gq-prog' }, h('i', { style: { width: ((s.i + (reveal ? 1 : 0)) / s.order.length * 100) + '%', background: L.color } })),
      h('div', { class: 'qz-tags' }, h('span', { class: 'tag', style: { background: L.color, color: '#fff' } }, `${s.i + 1}/${s.order.length}`), h('span', { class: 'tag' }, q.source || q.skill || L.name)));
    if (q.visual) box.append(h('div', { class: 'qz-vis', html: Visual.render(q.visual, { narrow: true }) }));
    if (q.pdfImg) {
      const img = h('img', { class: 'enem-img', alt: q.source });
      const wrap = h('div', { class: 'qz-vis enem' }, img, h('button', { class: 'zoom-btn', title: 'Tela cheia', onclick: () => img.src && Quiz.zoomImg(img.src) }, '⤢'));
      box.append(wrap);
      this.imgUrl(q.pdfImg).then(u => { if (u) img.src = u; else wrap.replaceWith(h('div', { class: 'gq-wait' }, 'Pedindo a imagem a quem tem o PDF das provas…')); });
    }
    if (q.text) box.append(h('div', { class: 'qz-text', lang: 'en' }, q.text));
    if (q.stem) box.append(h('p', { class: 'qz-stem' }, q.stem));
    const opts = h('div', { class: 'qz-opts' + (q.official ? ' letters' : '') });
    q.options.forEach((o, k) => {
      const who = reveal ? ans.filter(a => a.a[qid] === k).map(a => this.avatar(a.user, ' sm')).join('') : '';
      const cls = 'opt' + (!reveal && mine === k ? ' sel' : '') + (reveal && k === q.answer ? ' ok' : '') + (reveal && mine === k && k !== q.answer ? ' bad' : '');
      const b = h('button', { class: cls, 'data-nosfx': '', disabled: reveal, html: `<span class="ltr">${'ABCDE'[k]}</span>${o ? `<span class="otx">${esc(o)}</span>` : ''}${who ? `<span class="gq-who">${who}</span>` : ''}` });
      b.onclick = () => this.answer(k); opts.append(b);
    });
    box.append(opts);
    const done = ppl.filter(p => ans.some(a => a.user.id === p.id && a.a[qid] != null)).length;
    if (!reveal) {
      box.append(h('div', { class: 'gq-status', html: ppl.map(p => this.avatar(p, ans.some(a => a.user.id === p.id && a.a[qid] != null) ? ' done' : ' wait')).join('') + `<span>${done} de ${ppl.length} responderam</span>` }));
      box.append(h('div', { class: 'gq-actions' },
        h('button', { class: 'pbtn', onclick: () => this.toBoard(q) }, 'Levar ao quadro'),
        h('button', { class: 'pbtn pri', disabled: !done, onclick: () => this.setPhase('reveal') }, 'Revelar')));
    } else {
      const ok = mine === q.answer;
      box.append(h('div', { class: 'gq-result ' + (mine == null ? 'none' : ok ? 'ok' : 'bad'), html: `<b>${mine == null ? 'Resposta: ' + 'ABCDE'[q.answer] : ok ? 'Você acertou!' : 'Resposta certa: ' + 'ABCDE'[q.answer]}</b>${q.explain ? `<span>${esc(q.explain)}</span>` : ''}` }));
      if (ok) requestAnimationFrame(() => Fx.burst($('.opt.ok', this.el) || this.el, 20));
      box.append(h('div', { class: 'gq-actions' },
        h('button', { class: 'pbtn', onclick: () => this.toBoard(q) }, 'Levar ao quadro'),
        h('button', { class: 'pbtn pri', onclick: () => this.next() }, s.i + 1 >= s.order.length ? 'Ver placar' : 'Próxima')));
    }
    box.append(h('button', { class: 'gq-end', onclick: () => this.end() }, 'Encerrar quiz'));
    this.el.append(box);
  },
  renderDone(s, ans, ppl) {
    const qm = this.qmap();
    const rows = ans.map(a => ({ u: a.user, right: s.order.filter(id => a.a[id] != null && qm.get(id) && a.a[id] === qm.get(id).answer).length, answered: s.order.filter(id => a.a[id] != null).length })).sort((x, y) => y.right - x.right);
    const box = h('div', { class: 'gq-body' });
    box.append(h('h3', { class: 'gq-title' }, 'Placar'));
    const list = h('div', { class: 'gq-board' });
    rows.forEach((r, i) => list.append(h('div', { class: 'gq-row' + (i === 0 ? ' first' : ''), html: `<span class="gq-pos">${i + 1}</span>${this.avatar(r.u)}<span class="gq-name">${esc(r.u.name)}</span><b>${r.right}/${s.order.length}</b>` })));
    const team = rows.reduce((t, r) => t + r.right, 0), tot = rows.reduce((t, r) => t + r.answered, 0);
    box.append(list, h('p', { class: 'gq-hint' }, `Juntos: ${team} acertos em ${tot} respostas.`));
    box.append(h('div', { class: 'gq-actions' }, h('button', { class: 'pbtn pri', onclick: () => this.end() }, 'Nova rodada')));
    this.el.append(box);
    Fx.stagger(list, ':scope > *', 90);
  }
};
