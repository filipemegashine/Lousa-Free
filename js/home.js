'use strict';
/* ================= Início, Explicações (quadros) e Questões (quiz) ================= */
const INEP_URL = 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos';
const ICON_BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#2b2b36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_CHEV = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="#9a9aae" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_QUIZ = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#e8f5e9"/><path d="M7.5 12.5l3 3 6-7" fill="none" stroke="#43a047" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_ABC = '<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="16" rx="4" fill="#fff4d6" stroke="#f9a825" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="800" fill="#b26a00" font-family="Segoe UI,sans-serif">ABC</text></svg>';
const goBoardUrl = (id, extra = '') => location.pathname + '?b=' + encodeURIComponent(id) + extra;

const Home = {
  root: null,
  init() {
    document.body.classList.add('page-view');
    this.root = h('main', { id: 'page' }); document.body.append(this.root);
    addEventListener('hashchange', () => this.route());
    document.addEventListener('keydown', e => Quiz.onKey(e));
    Enem.loading = Enem.init().catch(() => 0).finally(() => { Enem.loading = null; if (/^#\/?(questoes)?$/.test(location.hash || '#/')) this.route(); });
    this.route();
    if (!localStorage.getItem('lousa:named')) setTimeout(() => UI.askName().then(() => this.route()), 300);
  },
  route() {
    const r = location.hash.replace(/^#\/?/, '');
    Quiz.active = false; document.body.classList.remove('quiz-on');
    if (r === 'explicacoes') this.explicacoes();
    else if (r === 'questoes') Quiz.menu();
    else if (r.startsWith('questoes/')) Quiz.start(r.split('/')[1]);
    else this.home();
    document.body.scrollTop = 0; scrollTo(0, 0);
  },
  bar(title, back) {
    const b = h('header', { class: 'pg-bar' });
    if (back) b.append(h('a', { class: 'pg-back', href: back, 'aria-label': 'Voltar', html: ICON_BACK }));
    else b.append(h('div', { class: 'pg-brand', html: '<img src="icons/icon-192.png" alt=""><span>Lousa Livre</span>' }));
    if (title) b.append(h('h1', {}, title));
    b.append(h('div', { class: 'pg-user', title: App.user.name, onclick: () => UI.askName().then(() => this.route()) }, h('span', { class: 'avatar', style: { background: App.user.color } }, initials(App.user.name))));
    return b;
  },
  async home() {
    const boards = await DB.all('boards').catch(() => []);
    const mine = boards.filter(b => !b.shared).length, shared = boards.length - mine;
    const st = Quiz.stats(); const done = Object.values(st).filter(x => x && x.best != null).length;
    const first = App.user.name.split(' ')[0];
    this.root.innerHTML = '';
    this.root.append(this.bar());
    const wrap = h('div', { class: 'pg-wrap' });
    wrap.append(h('div', { class: 'pg-hello' }, h('h2', {}, `Olá, ${first}!`), h('p', {}, 'O que vamos fazer hoje?')));
    const card = (href, ic, title, sub, meta, color) => h('a', { class: 'home-card', href, style: { '--c': color }, html: `<div class="hc-ico">${ic}</div><div class="hc-txt"><b>${title}</b><span>${sub}</span><small>${meta}</small></div><div class="hc-go">${ICON_CHEV}</div>` });
    wrap.append(h('div', { class: 'home-grid' },
      card('#/explicacoes', icon('boards'), 'Explicações', 'Seus quadros e os compartilhados com você', `${mine} meu(s) · ${shared} compartilhado(s)`, '#5b5fc7'),
      card('#/questoes', ICON_ABC, 'Questões', 'Inglês do ENEM, de 2014 a 2025', done ? `${done} nível(is) concluído(s)` : `${Enem.count ? Enem.count + ' oficiais + ' : ''}${QUESTIONS.length + Quiz.extra().length} extras · 3 níveis`, '#f9a825')
    ));
    this.root.append(wrap);
  },

  /* ---------- Explicações: meus quadros e compartilhados ---------- */
  async explicacoes(tab) {
    tab = tab || sessionStorage.getItem('lousa:tab') || 'mine'; sessionStorage.setItem('lousa:tab', tab);
    const all = (await DB.all('boards').catch(() => [])).sort((a, b) => b.updated - a.updated);
    this.root.innerHTML = '';
    this.root.append(this.bar('Explicações', '#/'));
    const wrap = h('div', { class: 'pg-wrap' });
    const tabs = h('div', { class: 'seg' });
    [['mine', 'Meus quadros'], ['shared', 'Compartilhados comigo']].forEach(([k, n]) => tabs.append(h('button', { class: k === tab ? 'on' : '', onclick: () => this.explicacoes(k) }, n, h('span', { class: 'seg-n' }, String(all.filter(b => k === 'mine' ? !b.shared : b.shared).length)))));
    const acts = h('div', { class: 'pg-actions' },
      h('button', { class: 'pbtn pri', onclick: () => this.newBoard(!all.length) }, '+ Novo quadro'),
      h('button', { class: 'pbtn', onclick: () => Compat.pick() }, 'Abrir arquivo'));
    wrap.append(tabs, acts);
    const rows = all.filter(b => tab === 'mine' ? !b.shared : b.shared);
    const list = h('div', { class: 'blist' });
    if (!rows.length) list.append(h('div', { class: 'empty', html: tab === 'mine'
      ? `${icon('note')}<b>Nenhum quadro ainda</b><span>Crie um quadro para desenhar, escrever e organizar suas explicações.</span>`
      : `${icon('share')}<b>Nada compartilhado ainda</b><span>Quadros abertos por um link ou por um arquivo recebido de outra pessoa aparecem aqui.</span>` }));
    for (const b of rows) {
      const m = (b.items || []).find(i => i.id === '__meta') || {};
      const n = (b.items || []).filter(i => !i.deleted && i.type !== 'meta').length;
      const row = h('a', { class: 'bitem', href: goBoardUrl(b.id), html: `<div class="bi-thumb" style="background:${esc(m.bg || '#f6f6f4')}">${icon('note')}</div><div class="bi-txt"><b>${esc(m.name || b.name)}</b><span>${n} item(ns) · ${new Date(b.updated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>` });
      const more = h('button', { class: 'ib', title: 'Opções', html: icon('more') });
      more.onclick = e => { e.preventDefault(); e.stopPropagation(); this.boardMenu(more, b, m); };
      row.append(more); list.append(row);
    }
    wrap.append(list);
    this.root.append(wrap);
  },
  async newBoard(first) {
    const v = await promptText('Novo quadro', 'Nome do quadro', first ? 'Meu primeiro quadro' : 'Nova explicação');
    if (v == null) return;
    location.href = goBoardUrl(uid(), `&new=${first ? 'welcome' : '1'}&n=${encodeURIComponent(v.trim() || 'Novo quadro')}`);
  },
  boardMenu(anchor, b, m) {
    const menu = h('div', { class: 'menu' });
    const item = (ic, label, fn) => { const x = h('button', { html: icon(ic) + label }); x.onclick = () => { Pop.close(); fn(); }; menu.append(x); };
    item('share', 'Exportar / enviar arquivo', () => Compat.share(b.id));
    item('text', 'Renomear', async () => {
      const v = await promptText('Renomear quadro', '', m.name || b.name); if (!v) return;
      const rec = await DB.get('boards', b.id); const mm = rec.items.find(i => i.id === '__meta');
      if (mm) { mm.name = v.trim(); mm.ts = Math.max(now(), (mm.ts || 0) + 1); mm.by = App.user.id; }
      rec.name = v.trim(); await DB.put('boards', rec); this.explicacoes();
    });
    item('trash', 'Excluir deste aparelho', async () => {
      const ok = await modal('Excluir quadro?', [h('p', {}, `“${m.name || b.name}” será removido deste aparelho. Quem já tem o quadro mantém a cópia.`)], [['Cancelar', '', () => false], ['Excluir', 'danger', () => true]]);
      if (!ok) return; await DB.del('boards', b.id); localStorage.removeItem('lousa:cam:' + b.id); this.explicacoes();
    });
    Pop.open(anchor, menu);
  }
};

/* ================= Questões: quiz estilo Duolingo ================= */
const Quiz = {
  active: false, list: [], i: 0, sel: null, checked: false, right: 0, wrong: 0, level: null, log: [],
  stats() { try { return JSON.parse(localStorage.getItem('lousa:quiz:stats') || '{}'); } catch { return {}; } },
  extra() { try { return JSON.parse(localStorage.getItem('lousa:quiz:extra') || '[]'); } catch { return []; } },
  SOURCES: { enem: 'Provas ENEM 2014–2025', extra: 'Questões extras', all: 'Todas' },
  src() { const s = localStorage.getItem('lousa:quiz:src'); return this.SOURCES[s] ? s : 'enem'; },
  bank(level, src = this.src()) {
    const pool = src === 'enem' ? Enem.questions() : src === 'extra' ? [...QUESTIONS, ...this.extra()] : [...Enem.questions(), ...QUESTIONS, ...this.extra()];
    return pool.filter(q => q.level === level);
  },
  statKey(level, src = this.src()) { return src === 'extra' ? level : src + ':' + level; },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

  menu() {
    const R = Home.root; R.innerHTML = ''; R.append(Home.bar('Questões', '#/'));
    const st = this.stats(); const wrap = h('div', { class: 'pg-wrap' }); const src = this.src();
    wrap.append(h('div', { class: 'pg-hello' }, h('h2', {}, 'Inglês · ENEM'), h('p', {}, 'Escolha a fonte e a dificuldade. As questões aparecem uma de cada vez.')));
    const seg = h('div', { class: 'seg' });
    for (const [k, n] of Object.entries(this.SOURCES)) seg.append(h('button', { class: k === src ? 'on' : '', onclick: () => { localStorage.setItem('lousa:quiz:src', k); this.menu(); } }, n));
    wrap.append(seg);
    if (src !== 'extra' && !Enem.count) {
      const box = h('div', { class: 'pdf-card' });
      if (Enem.loading) box.append(h('b', {}, 'Carregando as questões oficiais…'), h('span', {}, 'Lendo o PDF das provas neste aparelho.'));
      else box.append(
        h('b', {}, 'Carregue o PDF das provas (uma vez por aparelho)'),
        h('span', {}, 'As 60 questões oficiais de 2014 a 2025 vêm do arquivo Enem_Ingles_2014-2025.pdf. O app lê as imagens das questões e guarda só neste aparelho; o gabarito e a classificação já estão no app.'),
        h('div', { class: 'pg-actions' }, h('button', { class: 'pbtn pri', onclick: () => this.pickPdf() }, 'Carregar PDF'), h('a', { class: 'pbtn', href: INEP_URL, target: '_blank', rel: 'noopener' }, 'Provas no site do INEP')));
      wrap.append(box);
      if (src === 'enem') { Home.root.append(wrap); return; }
    }
    const grid = h('div', { class: 'lvl-list' });
    for (const [k, L] of Object.entries(LEVELS)) {
      const n = this.bank(k).length, s = st[this.statKey(k)];
      const best = s && s.best != null ? `Melhor resultado: ${s.best}/${s.total}` : 'Ainda não concluído';
      const pct = s && s.best != null ? Math.round(s.best / s.total * 100) : 0;
      grid.append(h('a', { class: 'lvl', href: '#/questoes/' + k, style: { '--c': L.color, '--s': L.soft }, html: `<div class="lvl-dot">${{ facil: '1', medio: '2', dificil: '3' }[k]}</div><div class="lvl-txt"><b>${L.name}</b><span>${L.desc}</span><small>${n} questões · ${best}</small><div class="lvl-bar"><i style="width:${pct}%"></i></div></div><div class="hc-go">${ICON_CHEV}</div>` }));
    }
    wrap.append(grid);
    const about = h('details', { class: 'about' },
      h('summary', {}, 'Sobre as questões'),
      h('p', {}, 'Provas ENEM: as 60 questões da opção Inglês de 2014 a 2025 (caderno Azul), com o gabarito oficial do INEP. Cada uma foi avaliada e classificada: 18 fáceis, 28 médias e 14 difíceis. As imagens vêm do seu PDF e ficam só neste aparelho.'),
      h('p', {}, 'Questões extras: 36 questões originais no mesmo formato, com tirinhas, cartazes e gráficos criados para o app.'),
      h('p', {}, 'Fácil: informação explícita, cartazes e cartuns diretos. Médio: finalidade do texto, inferência e expressões idiomáticas. Difícil: poemas e textos literários densos, ironia, crítica implícita e alternativas-armadilha.'),
      Enem.count ? h('div', { class: 'pg-actions' }, h('button', { class: 'pbtn', onclick: async () => { await Enem.remove(); toast('PDF das provas removido deste aparelho'); this.menu(); } }, 'Remover PDF deste aparelho')) : null,
      h('div', { class: 'pg-actions' },
        h('a', { class: 'pbtn', href: INEP_URL, target: '_blank', rel: 'noopener' }, 'Provas oficiais (INEP)'),
        h('button', { class: 'pbtn', onclick: () => this.importPick() }, 'Importar questões'),
        h('button', { class: 'pbtn', onclick: () => this.template() }, 'Modelo de arquivo'),
        this.extra().length ? h('button', { class: 'pbtn', onclick: () => { localStorage.removeItem('lousa:quiz:extra'); toast('Questões importadas removidas'); this.menu(); } }, `Remover ${this.extra().length} importada(s)`) : null));
    wrap.append(about);
    R.append(wrap);
  },

  start(level) {
    if (!LEVELS[level]) { location.hash = '#/questoes'; return; }
    if (Enem.loading && this.src() !== 'extra') { Enem.loading.then(() => { if (location.hash === '#/questoes/' + level && !this.active) this.start(level); }); Home.root.innerHTML = '<div class="pg-wrap"><p>Carregando as questões…</p></div>'; return; }
    this.runSrc = this.src();
    this.level = level; this.list = this.shuffle(this.bank(level)); this.i = 0; this.right = 0; this.wrong = 0; this.log = [];
    if (!this.list.length) { toast('Nenhuma questão neste nível'); location.hash = '#/questoes'; return; }
    this.active = true; document.body.classList.add('quiz-on');
    this.show();
  },
  show() {
    const q = this.list[this.i]; const L = LEVELS[this.level]; const R = Home.root;
    this.sel = null; this.checked = false;
    R.innerHTML = '';
    const top = h('div', { class: 'qz-top' },
      h('button', { class: 'qz-stop', onclick: () => this.finish(true) }, 'Parar quiz'),
      h('div', { class: 'qz-prog', style: { '--c': L.color } }, h('i', { style: { width: (this.i / this.list.length * 100) + '%' } })),
      h('span', { class: 'qz-count' }, `${this.i + 1}/${this.list.length}`));
    const card = h('section', { class: 'qz' });
    card.append(h('div', { class: 'qz-tags' }, h('span', { class: 'tag', style: { background: L.soft, color: L.color } }, L.name), h('span', { class: 'tag' }, q.skill || 'Leitura'), q.source ? h('span', { class: 'tag' }, q.source) : null));
    if (q.visual) {
      const vis = h('div', { class: 'qz-vis', html: Visual.render(q.visual, { narrow: innerWidth < 600 }) });
      card.append(vis);
      if (q.visual.type === 'comic') { let narrow = innerWidth < 600; const re = () => { if (!vis.isConnected) return removeEventListener('resize', re); if ((innerWidth < 600) !== narrow) { narrow = !narrow; vis.innerHTML = Visual.render(q.visual, { narrow }); } }; addEventListener('resize', re); }
    }
    if (q.image) { const src = safeUrl(q.image); if (src) card.append(h('div', { class: 'qz-vis' }, h('img', { src, alt: q.alt || 'Imagem da questão' }))); }
    if (q.pdfImg) {
      // questão oficial: a imagem vem do PDF guardado neste aparelho; as alternativas estão nela
      const img = h('img', { class: 'enem-img', alt: `Questão ${q.source}` });
      const zoom = h('button', { class: 'zoom-btn', title: 'Ver em tela cheia', onclick: () => this.zoomImg(img.src) }, '⤢');
      card.append(h('div', { class: 'qz-vis enem' }, img, zoom));
      Enem.url(q.pdfImg).then(u => { img.src = u; });
    }
    if (q.text) card.append(h('div', { class: 'qz-text', lang: 'en' }, q.text));
    if (q.stem) card.append(h('p', { class: 'qz-stem' }, q.stem));
    else card.append(h('p', { class: 'qz-stem small' }, 'Escolha a alternativa correta:'));
    const opts = h('div', { class: 'qz-opts' + (q.official ? ' letters' : ''), role: 'radiogroup' });
    q.options.forEach((o, k) => {
      const b = h('button', { class: 'opt', role: 'radio', 'aria-checked': 'false', 'aria-label': 'Alternativa ' + 'ABCDE'[k], 'data-k': k }, h('span', { class: 'ltr' }, 'ABCDE'[k]), o ? h('span', { class: 'otx' }, o) : null);
      b.onclick = () => this.choose(k); opts.append(b);
    });
    card.append(opts);
    const foot = h('footer', { class: 'qz-foot' }, h('div', { class: 'qf-in' }, h('div', { class: 'qf-msg' }), h('button', { class: 'big', disabled: true, onclick: () => this.primary() }, 'Verificar')));
    R.append(top, card, foot);
    this.foot = foot;
  },
  choose(k) {
    if (this.checked) return;
    this.sel = k;
    $$('.opt', Home.root).forEach(b => { const on = +b.dataset.k === k; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
    this.foot.querySelector('.big').disabled = false;
  },
  primary() { if (!this.checked) this.check(); else this.next(); },
  check() {
    if (this.sel == null || this.checked) return;
    const q = this.list[this.i]; const ok = this.sel === q.answer; this.checked = true;
    ok ? this.right++ : this.wrong++;
    this.log.push({ q, sel: this.sel, ok });
    $$('.opt', Home.root).forEach(b => { const k = +b.dataset.k; b.disabled = true; if (k === q.answer) b.classList.add('ok'); else if (k === this.sel) b.classList.add('bad'); });
    const f = this.foot; f.classList.add(ok ? 'is-ok' : 'is-bad');
    f.querySelector('.qf-msg').innerHTML = `<b>${ok ? 'Correto!' : 'Resposta correta: ' + 'ABCDE'[q.answer]}</b>${q.explain ? `<span>${esc(q.explain)}</span>` : ''}`;
    const btn = f.querySelector('.big'); btn.textContent = this.i + 1 < this.list.length ? 'Continuar' : 'Ver resultado'; btn.focus({ preventScroll: true });
    navigator.vibrate?.(ok ? 20 : [30, 40, 30]);
  },
  next() { this.i++; if (this.i >= this.list.length) this.finish(false); else { this.show(); scrollTo(0, 0); document.body.scrollTop = 0; } },
  finish(stopped) {
    this.active = false; document.body.classList.remove('quiz-on');
    const total = this.list.length, answered = this.right + this.wrong, L = LEVELS[this.level];
    if (!stopped) {
      const st = this.stats(), key = this.statKey(this.level, this.runSrc); const cur = st[key];
      if (!cur || cur.best == null || this.right > cur.best || cur.total !== total) st[key] = { best: this.right, total, at: now() };
      localStorage.setItem('lousa:quiz:stats', JSON.stringify(st));
    }
    const pct = answered ? Math.round(this.right / answered * 100) : 0;
    const R = Home.root; R.innerHTML = '';
    R.append(Home.bar('Resultado', '#/questoes'));
    const wrap = h('div', { class: 'pg-wrap res' });
    wrap.append(h('div', { class: 'ring', style: { '--p': pct, '--c': L.color }, html: `<div><b>${pct}%</b><span>de acerto</span></div>` }));
    wrap.append(h('p', { class: 'res-sub' }, stopped ? `Quiz interrompido: você respondeu ${answered} de ${total} questões (${L.name}).` : `Você concluiu as ${total} questões do nível ${L.name}!`));
    wrap.append(h('div', { class: 'res-stats' },
      h('div', { class: 'rs ok' }, h('b', {}, String(this.right)), h('span', {}, 'certas')),
      h('div', { class: 'rs bad' }, h('b', {}, String(this.wrong)), h('span', {}, 'erradas'))));
    const wrongs = this.log.filter(x => !x.ok);
    if (wrongs.length) {
      const rev = h('details', { class: 'about' }, h('summary', {}, `Revisar as ${wrongs.length} que você errou`));
      wrongs.forEach(({ q, sel }) => rev.append(h('div', { class: 'rev' }, h('p', { class: 'rev-q' }, q.stem || q.source), h('p', { class: 'rev-bad' }, `Sua resposta: ${'ABCDE'[sel]}${q.options[sel] ? ') ' + q.options[sel] : ''}`), h('p', { class: 'rev-ok' }, `Correta: ${'ABCDE'[q.answer]}${q.options[q.answer] ? ') ' + q.options[q.answer] : ''}`), q.explain ? h('p', { class: 'rev-ex' }, q.explain) : null)));
      wrap.append(rev);
    }
    wrap.append(h('div', { class: 'pg-actions center' },
      h('button', { class: 'pbtn pri', onclick: () => { location.hash === '#/questoes/' + this.level ? this.start(this.level) : (location.hash = '#/questoes/' + this.level); } }, 'Fazer de novo'),
      h('a', { class: 'pbtn', href: '#/questoes' }, 'Escolher dificuldade')));
    R.append(wrap);
    scrollTo(0, 0); document.body.scrollTop = 0;
  },
  onKey(e) {
    if (!this.active || isTyping() || document.querySelector('.modal-back')) return;
    const k = e.key.toLowerCase(); const idx = '12345'.indexOf(k) >= 0 ? '12345'.indexOf(k) : 'abcde'.indexOf(k);
    if (idx >= 0 && k.length === 1 && idx < this.list[this.i].options.length) { this.choose(idx); e.preventDefault(); }
    else if (k === 'enter' && (this.sel != null)) { e.preventDefault(); this.primary(); }
  },

  /* ---------- PDF das provas oficiais ---------- */
  pickPdf() {
    const fi = h('input', { type: 'file', accept: 'application/pdf,.pdf', style: { display: 'none' } });
    fi.onchange = async () => {
      const f = fi.files[0]; fi.remove(); if (!f) return;
      const R = Home.root; const box = $('.pdf-card', R);
      if (box) box.innerHTML = '<b>Lendo o PDF…</b><span>Extraindo as 60 questões. Isso leva alguns segundos.</span>';
      try { await Enem.importPdf(f); localStorage.setItem('lousa:quiz:src', 'enem'); toast(`${Enem.count} questões oficiais prontas`); }
      catch (e) { modal('Não foi possível usar este PDF', [h('p', {}, e.message || 'Arquivo inválido.')]); }
      this.menu();
    };
    document.body.append(fi); fi.click();
  },
  zoomImg(src) {
    if (!src) return;
    // tamanho real da imagem (as de 2025 vêm em dobro), para ler com folga no celular
    const img = h('img', { src, alt: '' });
    const back = h('div', { class: 'img-zoom' }, img, h('button', { class: 'zoom-close', 'aria-label': 'Fechar', onclick: () => back.remove() }, '✕'));
    img.onload = () => { const w = img.naturalWidth > 1200 ? img.naturalWidth / 2 : img.naturalWidth; img.style.width = Math.max(w, Math.min(innerWidth - 32, 1100)) + 'px'; };
    back.addEventListener('click', e => { if (e.target === back) back.remove(); });
    document.body.append(back);
  },

  /* ---------- importar questões (ex.: oficiais do INEP digitadas por você) ---------- */
  importPick() {
    const fi = h('input', { type: 'file', accept: '.json,application/json,text/plain', style: { display: 'none' } });
    fi.onchange = async () => { const f = fi.files[0]; fi.remove(); if (!f) return; try { this.importText(await readFile(f, 'text')); } catch { toast('Não foi possível ler o arquivo'); } };
    document.body.append(fi); fi.click();
  },
  importText(text) {
    let arr; try { arr = JSON.parse(text); } catch { toast('Arquivo inválido (JSON)'); return; }
    if (arr && Array.isArray(arr.questions)) arr = arr.questions;
    if (!Array.isArray(arr)) { toast('O arquivo deve conter uma lista de questões'); return; }
    const C = Compat, ok = [];
    for (const r of arr.slice(0, 2000)) {
      if (!r || typeof r !== 'object') continue;
      const level = C.one(r.level, Object.keys(LEVELS), null);
      const options = (Array.isArray(r.options) ? r.options : []).slice(0, 5).map(o => C.str(o, 600)).filter(Boolean);
      let ans = typeof r.answer === 'string' ? 'ABCDE'.indexOf(r.answer.trim().toUpperCase()) : +r.answer;
      if (!level || options.length < 2 || !(ans >= 0 && ans < options.length) || !C.str(r.stem, 2000)) continue;
      const image = C.dataUrl(r.image, /^data:image\/(png|jpe?g|gif|webp);base64,/i, 3e6) || C.httpUrl(r.image) || undefined;
      ok.push({ id: 'x' + uid(), level, options, answer: ans, stem: C.str(r.stem, 2000), text: C.str(r.text, 6000) || undefined, image, alt: C.str(r.alt, 300) || undefined, explain: C.str(r.explain, 2000) || undefined, skill: C.str(r.skill, 40) || undefined, source: C.str(r.source, 60) || undefined });
    }
    if (!ok.length) { toast('Nenhuma questão válida encontrada. Veja o modelo de arquivo.'); return; }
    try { localStorage.setItem('lousa:quiz:extra', JSON.stringify([...this.extra(), ...ok])); }
    catch { toast('Espaço cheio: use links de imagem em vez de imagens embutidas.'); return; }
    toast(`${ok.length} questão(ões) importada(s)`); this.menu();
  },
  template() {
    const sample = [{ level: 'medio', source: 'ENEM 20XX · Q00', skill: 'Inferência', text: 'Cole aqui o texto em inglês da questão.', image: 'https://exemplo.com/tirinha.png', alt: 'Descrição da imagem', stem: 'Enunciado em português…', options: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D', 'Alternativa E'], answer: 'C', explain: 'Por que a C está correta (opcional).' }];
    const url = URL.createObjectURL(new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' }));
    const a = h('a', { href: url, download: 'modelo-questoes.json', style: { display: 'none' } }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
    toast('Modelo salvo em Downloads. “level” pode ser facil, medio ou dificil; “answer” é a letra correta.', [], 6000);
  }
};
