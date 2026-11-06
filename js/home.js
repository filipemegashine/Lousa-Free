'use strict';
/* ================= Início, Explicações (quadros) e Questões (quiz) ================= */
const INEP_URL = 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos';
const SV = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON_BACK = SV('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');
const ICON_CHEV = SV('<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');
const ICON_X = SV('<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>');
const ICON_FIRE = SV('<path d="M12 2.5c1 3.5 5.5 5.6 5.5 11a5.5 5.5 0 01-11 0c0-2.6 1.4-4.3 2.6-5.6.2 1.7 1 2.8 2 3.2-.5-3.4.2-6 .9-8.6z" fill="currentColor"/><path d="M12 13c1 1.4 2.4 2.2 2.4 4a2.4 2.4 0 01-4.8 0c0-1.4.9-2.4 2.4-4z" fill="#fff5c2" opacity=".85"/>');
const ICON_BOLT = SV('<path d="M13.5 2L4.5 13.5h6L9.5 22l10-12h-6.2z" fill="currentColor"/>');
const ICON_SND = on => SV(on ? '<path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' : '<path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>');
const ICON_ABC = SV('<rect x="2.5" y="4" width="19" height="16" rx="4" fill="#ffc800"/><text x="12" y="15.8" text-anchor="middle" font-size="8.5" font-weight="900" fill="#4b3200" font-family="Nunito,Segoe UI,sans-serif">ABC</text>');
const ICON_BOARD = SV('<rect x="2.5" y="4" width="19" height="14" rx="3" fill="#1cb0f6"/><path d="M6 13c2-3 4 1 6-2s3-1 5-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M8 21l2-3M16 21l-2-3" stroke="#1899d6" stroke-width="2" stroke-linecap="round"/>');
const goBoardUrl = (id, extra = '') => location.pathname + '?b=' + encodeURIComponent(id) + extra;
const GREETINGS = ['Bora estudar?', 'Que bom te ver!', 'Partiu aprender?', 'Pronto para mais uma?'];

const Home = {
  root: null,
  init() {
    document.body.classList.add('page-view');
    this.root = h('main', { id: 'page' }); document.body.append(this.root);
    addEventListener('hashchange', () => { Sfx.play('whoosh'); this.route(); });
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
    else b.append(h('div', { class: 'pg-brand', html: '<img src="icons/icon-192.png" alt=""><span>lousa livre</span>' }));
    if (title) b.append(h('h1', {}, title));
    const s = Progress.streak();
    b.append(h('div', { class: 'stat fire' + (s.days ? '' : ' off'), title: `${s.days} dia(s) seguido(s) estudando`, html: ICON_FIRE + `<span>${s.days}</span>` }));
    b.append(h('div', { class: 'stat xp', title: 'XP total', html: ICON_BOLT + `<span class="xp-n">${Progress.xp()}</span>` }));
    const snd = h('button', { class: 'snd' + (Sfx.on ? ' on' : ''), title: 'Sons', 'aria-label': 'Ligar ou desligar sons', 'data-nosfx': '', html: ICON_SND(Sfx.on) });
    snd.onclick = () => { Sfx.set(!Sfx.on); snd.classList.toggle('on', Sfx.on); snd.innerHTML = ICON_SND(Sfx.on); };
    b.append(snd);
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
    const wrap = h('div', { class: 'pg-wrap view-enter' });
    const hero = h('div', { class: 'hero', html: mascot('happy', 128) + `<div class="hero-txt"><div class="bubble">Olá, ${esc(first)}! ${GREETINGS[(Math.random() * GREETINGS.length) | 0]}</div><h2>Aprenda <em>do seu jeito.</em></h2><p>Explique no quadro e pratique com as provas do ENEM.</p></div>` });
    hero.querySelector('.mascot').addEventListener('click', e => { Sfx.play('pop'); setMood(e.currentTarget, 'happy'); Fx.burst(e.currentTarget, 18); });
    wrap.append(hero);
    const card = (href, ic, title, sub, meta, color) => h('a', { class: 'home-card', href, style: { '--c': color }, html: `<div class="hc-ico">${ic}</div><div class="hc-txt"><b>${title}</b><span>${sub}</span><small>${meta}</small></div><div class="hc-go">${ICON_CHEV}</div>` });
    const grid = h('div', { class: 'home-grid' },
      card('#/explicacoes', ICON_BOARD, 'Explicações', 'Seus quadros e os compartilhados com você', `${mine} meu(s) · ${shared} compartilhado(s)`, '#1cb0f6'),
      card('#/questoes', ICON_ABC, 'Questões', 'Inglês do ENEM, de 2014 a 2025', done ? `${done} nível(is) concluído(s)` : `${Enem.count ? Enem.count + ' oficiais + ' : ''}${QUESTIONS.length + Quiz.extra().length} extras`, '#ffc800'));
    wrap.append(grid);
    this.root.append(wrap);
    Fx.stagger(grid, ':scope > *', 90);
  },

  /* ---------- Explicações: meus quadros e compartilhados ---------- */
  async explicacoes(tab) {
    tab = tab || sessionStorage.getItem('lousa:tab') || 'mine'; sessionStorage.setItem('lousa:tab', tab);
    const all = (await DB.all('boards').catch(() => [])).sort((a, b) => b.updated - a.updated);
    this.root.innerHTML = '';
    this.root.append(this.bar('Explicações', '#/'));
    const wrap = h('div', { class: 'pg-wrap view-enter' });
    const tabs = h('div', { class: 'seg' });
    [['mine', 'Meus quadros'], ['shared', 'Compartilhados']].forEach(([k, n]) => tabs.append(h('button', { class: k === tab ? 'on' : '', onclick: () => { Sfx.play('select'); this.explicacoes(k); } }, n, h('span', { class: 'seg-n' }, String(all.filter(b => k === 'mine' ? !b.shared : b.shared).length)))));
    const acts = h('div', { class: 'pg-actions' },
      h('button', { class: 'pbtn pri', onclick: () => this.newBoard(!all.length) }, '+ Novo quadro'),
      h('button', { class: 'pbtn', onclick: () => Compat.pick() }, 'Abrir arquivo'));
    wrap.append(tabs, acts);
    const rows = all.filter(b => tab === 'mine' ? !b.shared : b.shared);
    const list = h('div', { class: 'blist' });
    if (!rows.length) list.append(h('div', { class: 'empty', html: mascot(tab === 'mine' ? 'idle' : 'sad', 96) + (tab === 'mine'
      ? `<b>Nenhum quadro ainda</b><span>Crie um quadro para desenhar, escrever e organizar suas explicações.</span>`
      : `<b>Nada compartilhado ainda</b><span>Quadros abertos por um link ou por um arquivo recebido de outra pessoa aparecem aqui.</span>`) }));
    for (const b of rows) {
      const m = (b.items || []).find(i => i.id === '__meta') || {};
      const n = (b.items || []).filter(i => !i.deleted && i.type !== 'meta').length;
      const row = h('a', { class: 'bitem', href: goBoardUrl(b.id), html: `<div class="bi-thumb" style="background:${esc(m.bg || '#131f24')}">${icon('note')}</div><div class="bi-txt"><b>${esc(m.name || b.name)}</b><span>${n} item(ns) · ${new Date(b.updated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>` });
      const more = h('button', { class: 'ib', title: 'Opções', html: icon('more') });
      more.onclick = e => { e.preventDefault(); e.stopPropagation(); this.boardMenu(more, b, m); };
      row.append(more); list.append(row);
    }
    wrap.append(list);
    this.root.append(wrap);
    Fx.stagger(list, ':scope > *', 50);
  },
  async newBoard(first) {
    const v = await promptText('Novo quadro', 'Nome do quadro', first ? 'Meu primeiro quadro' : 'Nova explicação');
    if (v == null) return;
    Sfx.play('create');
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
      if (!ok) return; Sfx.play('delete'); await DB.del('boards', b.id); localStorage.removeItem('lousa:cam:' + b.id); this.explicacoes();
    });
    Pop.open(anchor, menu);
  }
};

/* ================= Questões: quiz estilo Duolingo ================= */
const Quiz = {
  active: false, list: [], i: 0, sel: null, checked: false, right: 0, wrong: 0, level: null, log: [], combo: 0, bestCombo: 0, xp: 0,
  stats() { try { return JSON.parse(localStorage.getItem('lousa:quiz:stats') || '{}'); } catch { return {}; } },
  extra() { try { return JSON.parse(localStorage.getItem('lousa:quiz:extra') || '[]'); } catch { return []; } },
  SOURCES: { enem: 'Provas ENEM', extra: 'Extras', all: 'Todas' },
  src() { const s = localStorage.getItem('lousa:quiz:src'); return this.SOURCES[s] ? s : 'enem'; },
  bank(level, src = this.src()) {
    const pool = src === 'enem' ? Enem.questions() : src === 'extra' ? [...QUESTIONS, ...this.extra()] : [...Enem.questions(), ...QUESTIONS, ...this.extra()];
    return pool.filter(q => q.level === level);
  },
  statKey(level, src = this.src()) { return src === 'extra' ? level : src + ':' + level; },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

  menu() {
    const R = Home.root; R.innerHTML = ''; R.append(Home.bar('Questões', '#/'));
    const st = this.stats(); const wrap = h('div', { class: 'pg-wrap view-enter' }); const src = this.src();
    wrap.append(h('div', { class: 'pg-hello' }, h('h2', {}, 'Inglês · ENEM'), h('p', {}, 'Escolha a fonte e a dificuldade. Uma questão de cada vez.')));
    const seg = h('div', { class: 'seg' });
    for (const [k, n] of Object.entries(this.SOURCES)) seg.append(h('button', { class: k === src ? 'on' : '', onclick: () => { Sfx.play('select'); localStorage.setItem('lousa:quiz:src', k); this.menu(); } }, n));
    wrap.append(seg);
    if (src !== 'extra' && !Enem.count) {
      const box = h('div', { class: 'pdf-card' });
      if (Enem.loading) box.append(h('b', {}, 'Carregando as questões oficiais…'), h('span', {}, 'Lendo o PDF das provas neste aparelho.'));
      else box.append(
        h('b', {}, 'Carregue o PDF das provas'),
        h('span', {}, 'Uma vez por aparelho. As 60 questões oficiais de 2014 a 2025 vêm do arquivo Enem_Ingles_2014-2025.pdf; o app lê as imagens e guarda só aqui. Gabarito e classificação já estão no app.'),
        h('div', { class: 'pg-actions' }, h('button', { class: 'pbtn pri', onclick: () => this.pickPdf() }, 'Carregar PDF'), h('a', { class: 'pbtn', href: INEP_URL, target: '_blank', rel: 'noopener' }, 'Site do INEP')));
      wrap.append(box);
      if (src === 'enem') { Home.root.append(wrap); return; }
    }
    const grid = h('div', { class: 'lvl-list' });
    for (const [k, L] of Object.entries(LEVELS)) {
      const n = this.bank(k).length, s = st[this.statKey(k)];
      const best = s && s.best != null ? `Recorde ${s.best}/${s.total}` : 'Ainda não concluído';
      const pct = s && s.best != null ? Math.round(s.best / s.total * 100) : 0;
      grid.append(h('a', { class: 'lvl', href: '#/questoes/' + k, style: { '--c': L.color }, html: `${pct === 100 ? '<span class="crown">Perfeito</span>' : ''}<div class="lvl-dot">${{ facil: '1', medio: '2', dificil: '3' }[k]}</div><div class="lvl-txt"><b>${L.name}</b><span>${L.desc}</span><small>${n} questões · ${best}</small><div class="lvl-bar"><i style="width:${pct}%"></i></div></div><div class="hc-go">${ICON_CHEV}</div>` }));
    }
    wrap.append(grid);
    const about = h('details', { class: 'about' },
      h('summary', {}, 'Sobre as questões'),
      h('p', {}, 'Provas ENEM: as 60 questões da opção Inglês de 2014 a 2025 (caderno Azul), com o gabarito oficial do INEP. Cada uma foi avaliada e classificada: 18 fáceis, 28 médias e 14 difíceis. As imagens vêm do seu PDF e ficam só neste aparelho.'),
      h('p', {}, 'Extras: 36 questões originais no mesmo formato, com tirinhas, cartazes e gráficos criados para o app.'),
      h('p', {}, 'Cada acerto vale 10 XP, e sequências de 3 acertos ou mais dão bônus. Estudar todo dia mantém a sua ofensiva acesa.'),
      Enem.count ? h('div', { class: 'pg-actions' }, h('button', { class: 'pbtn', onclick: async () => { await Enem.remove(); toast('PDF das provas removido deste aparelho'); this.menu(); } }, 'Remover PDF')) : null,
      h('div', { class: 'pg-actions' },
        h('a', { class: 'pbtn', href: INEP_URL, target: '_blank', rel: 'noopener' }, 'Provas oficiais (INEP)'),
        h('button', { class: 'pbtn', onclick: () => this.importPick() }, 'Importar questões'),
        h('button', { class: 'pbtn', onclick: () => this.template() }, 'Modelo de arquivo'),
        this.extra().length ? h('button', { class: 'pbtn', onclick: () => { localStorage.removeItem('lousa:quiz:extra'); toast('Questões importadas removidas'); this.menu(); } }, `Remover ${this.extra().length} importada(s)`) : null));
    wrap.append(about);
    R.append(wrap);
    Fx.stagger(grid, ':scope > *', 80);
  },

  start(level) {
    if (!LEVELS[level]) { location.hash = '#/questoes'; return; }
    if (Enem.loading && this.src() !== 'extra') { Enem.loading.then(() => { if (location.hash === '#/questoes/' + level && !this.active) this.start(level); }); Home.root.innerHTML = '<div class="pg-wrap">' + mascot('idle', 96) + '<p>Carregando as questões…</p></div>'; return; }
    this.runSrc = this.src();
    this.level = level; this.list = this.shuffle(this.bank(level)); this.i = 0; this.right = 0; this.wrong = 0; this.log = []; this.combo = 0; this.bestCombo = 0; this.xp = 0;
    if (!this.list.length) { toast('Nenhuma questão neste nível'); location.hash = '#/questoes'; return; }
    this.active = true; document.body.classList.add('quiz-on');
    this.show();
  },
  show() {
    const q = this.list[this.i]; const L = LEVELS[this.level]; const R = Home.root;
    this.sel = null; this.checked = false;
    R.innerHTML = '';
    const bar = h('i', { style: { width: (this.i / this.list.length * 100) + '%' } });
    const top = h('div', { class: 'qz-top' },
      h('button', { class: 'qz-stop', title: 'Parar quiz', 'aria-label': 'Parar quiz', html: ICON_X, onclick: () => this.finish(true) }),
      h('div', { class: 'qz-prog' }, bar),
      h('span', { class: 'qz-count' }, `${this.i + 1}/${this.list.length}`));
    const card = h('section', { class: 'qz view-enter' });
    card.append(h('div', { class: 'qz-tags' }, h('span', { class: 'tag', style: { background: L.color, color: '#fff' } }, L.name), h('span', { class: 'tag' }, q.skill || 'Leitura'), q.source ? h('span', { class: 'tag' }, q.source) : null));
    if (q.visual) {
      const vis = h('div', { class: 'qz-vis', html: Visual.render(q.visual, { narrow: innerWidth < 600 }) });
      card.append(vis);
      if (q.visual.type === 'comic') { let narrow = innerWidth < 600; const re = () => { if (!vis.isConnected) return removeEventListener('resize', re); if ((innerWidth < 600) !== narrow) { narrow = !narrow; vis.innerHTML = Visual.render(q.visual, { narrow }); } }; addEventListener('resize', re); }
    }
    if (q.image) { const src = safeUrl(q.image); if (src) card.append(h('div', { class: 'qz-vis' }, h('img', { src, alt: q.alt || 'Imagem da questão' }))); }
    if (q.pdfImg) {
      // questão oficial: a imagem vem do PDF guardado neste aparelho; as alternativas estão nela
      const img = h('img', { class: 'enem-img', alt: `Questão ${q.source}` });
      const zoom = h('button', { class: 'zoom-btn', title: 'Ver em tela cheia', onclick: () => { Sfx.play('open'); this.zoomImg(img.src); } }, '⤢');
      card.append(h('div', { class: 'qz-vis enem' }, img, zoom));
      Enem.url(q.pdfImg).then(u => { img.src = u; });
    }
    if (q.text) card.append(h('div', { class: 'qz-text', lang: 'en' }, q.text));
    if (q.stem) card.append(h('p', { class: 'qz-stem' }, q.stem));
    else card.append(h('p', { class: 'qz-stem small' }, 'Escolha a alternativa correta:'));
    const opts = h('div', { class: 'qz-opts' + (q.official ? ' letters' : ''), role: 'radiogroup' });
    q.options.forEach((o, k) => {
      const b = h('button', { class: 'opt', role: 'radio', 'data-nosfx': '', 'aria-checked': 'false', 'aria-label': 'Alternativa ' + 'ABCDE'[k], 'data-k': k }, h('span', { class: 'ltr' }, 'ABCDE'[k]), o ? h('span', { class: 'otx' }, o) : null);
      b.onclick = () => this.choose(k); opts.append(b);
    });
    card.append(opts);
    const foot = h('footer', { class: 'qz-foot' }, h('div', { class: 'qf-in' }, h('div', { class: 'qf-msg' }), h('button', { class: 'big', 'data-nosfx': '', disabled: true, onclick: () => this.primary() }, 'Verificar')));
    R.append(top, card, foot);
    this.foot = foot;
    Fx.stagger(opts, ':scope > *', 45);
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = (this.i / this.list.length * 100) + '%'; }));
  },
  choose(k) {
    if (this.checked) return;
    if (this.sel !== k) Sfx.play('select');
    this.sel = k;
    $$('.opt', Home.root).forEach(b => { const on = +b.dataset.k === k; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
    this.foot.querySelector('.big').disabled = false;
  },
  primary() { if (!this.checked) this.check(); else this.next(); },
  check() {
    if (this.sel == null || this.checked) return;
    const q = this.list[this.i]; const ok = this.sel === q.answer; this.checked = true;
    if (ok) { this.right++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo); this.xp += 10 + (this.combo >= 3 ? 5 : 0); }
    else { this.wrong++; this.combo = 0; }
    this.log.push({ q, sel: this.sel, ok });
    $$('.opt', Home.root).forEach(b => { const k = +b.dataset.k; b.disabled = true; if (k === q.answer) b.classList.add('ok'); else if (k === this.sel) b.classList.add('bad'); });
    const bar = $('.qz-prog i', Home.root); if (bar) bar.style.width = ((this.i + 1) / this.list.length * 100) + '%';
    const f = this.foot; f.classList.add(ok ? 'is-ok' : 'is-bad');
    const praise = ['Muito bem!', 'Mandou bem!', 'Excelente!', 'Isso aí!', 'Perfeito!'];
    f.querySelector('.qf-msg').innerHTML = mascot(ok ? 'happy' : 'sad', 64) + `<div class="qf-txt"><b>${ok ? praise[(Math.random() * praise.length) | 0] : 'Resposta correta: ' + 'ABCDE'[q.answer]}</b>${q.explain ? `<span>${esc(q.explain)}</span>` : ''}</div>`;
    const btn = f.querySelector('.big'); btn.textContent = this.i + 1 < this.list.length ? 'Continuar' : 'Ver resultado'; btn.focus({ preventScroll: true });
    if (ok) {
      Sfx.play('correct'); Fx.burst($('.opt.ok', Home.root), 22);
      if (this.combo >= 3) { setTimeout(() => Sfx.play('combo', this.combo), 260); document.body.append(Object.assign(h('div', { class: 'combo', html: ICON_FIRE + `${this.combo} seguidas!` }), {})); setTimeout(() => $('.combo')?.remove(), 1700); }
    } else Sfx.play('wrong');
    navigator.vibrate?.(ok ? 20 : [30, 40, 30]);
  },
  next() { this.i++; if (this.i >= this.list.length) this.finish(false); else { Sfx.play('whoosh'); this.show(); scrollTo(0, 0); document.body.scrollTop = 0; } },
  finish(stopped) {
    this.active = false; document.body.classList.remove('quiz-on'); $('.combo')?.remove();
    const total = this.list.length, answered = this.right + this.wrong, L = LEVELS[this.level];
    if (!stopped) {
      const st = this.stats(), key = this.statKey(this.level, this.runSrc); const cur = st[key];
      if (!cur || cur.best == null || this.right > cur.best || cur.total !== total) st[key] = { best: this.right, total, at: now() };
      localStorage.setItem('lousa:quiz:stats', JSON.stringify(st));
    }
    let streak = null;
    if (answered) { Progress.addXp(this.xp); streak = Progress.practiced(); }
    const pct = answered ? Math.round(this.right / answered * 100) : 0;
    const great = answered && pct >= 70;
    const R = Home.root; R.innerHTML = '';
    R.append(Home.bar('Resultado', '#/questoes'));
    const wrap = h('div', { class: 'pg-wrap res view-enter' });
    wrap.insertAdjacentHTML('beforeend', mascot(!answered ? 'idle' : great ? 'happy' : 'sad', 140));
    wrap.append(h('h2', {}, !answered ? 'Até a próxima!' : stopped ? (great ? 'Boa parada!' : 'Continue praticando!') : pct === 100 ? 'Perfeito!' : great ? 'Lição concluída!' : 'Você chegou ao fim!'));
    wrap.append(h('p', { class: 'res-sub' }, stopped ? `Você respondeu ${answered} de ${total} questões (${L.name}).` : `Você concluiu as ${total} questões do nível ${L.name}.` + (streak?.grew ? ` Ofensiva de ${streak.days} dia(s)!` : '')));
    const stat = (cls, label, iconHtml) => { const b = h('b', { html: (iconHtml || '') + '<span>0</span>' }); return [h('div', { class: 'rs ' + cls }, h('span', {}, label), b), b.lastChild]; };
    const [sOk, nOk] = stat('ok', 'Certas'), [sBad, nBad] = stat('bad', 'Erradas'), [sXp, nXp] = stat('xp', 'XP ganho', ICON_BOLT), [sPct, nPct] = stat('pct', 'Precisão');
    wrap.append(h('div', { class: 'res-stats' }, sOk, sBad, sXp, sPct));
    const wrongs = this.log.filter(x => !x.ok);
    if (wrongs.length) {
      const rev = h('details', { class: 'about' }, h('summary', {}, wrongs.length === 1 ? 'Revisar a questão que você errou' : `Revisar as ${wrongs.length} que você errou`));
      wrongs.forEach(({ q, sel }) => rev.append(h('div', { class: 'rev' }, h('p', { class: 'rev-q' }, q.stem || q.source), h('p', { class: 'rev-bad' }, `Sua resposta: ${'ABCDE'[sel]}${q.options[sel] ? ') ' + q.options[sel] : ''}`), h('p', { class: 'rev-ok' }, `Correta: ${'ABCDE'[q.answer]}${q.options[q.answer] ? ') ' + q.options[q.answer] : ''}`), q.explain ? h('p', { class: 'rev-ex' }, q.explain) : null)));
      wrap.append(rev);
    }
    wrap.append(h('div', { class: 'pg-actions center' },
      h('button', { class: 'pbtn pri', onclick: () => { location.hash === '#/questoes/' + this.level ? this.start(this.level) : (location.hash = '#/questoes/' + this.level); } }, 'Fazer de novo'),
      h('a', { class: 'pbtn', href: '#/questoes' }, 'Escolher nível')));
    R.append(wrap);
    scrollTo(0, 0); document.body.scrollTop = 0;
    if (answered) { Sfx.play(great ? 'complete' : 'meh'); if (great) { Fx.confetti({ n: 180 }); setTimeout(() => Fx.confetti({ n: 90, x: innerWidth * .2, y: innerHeight * .6, spread: 1.2, power: 14 }), 350); setTimeout(() => Fx.confetti({ n: 90, x: innerWidth * .8, y: innerHeight * .6, spread: 1.2, power: 14 }), 550); } }
    setTimeout(() => { Fx.countUp(nOk, this.right, 700); Fx.countUp(nBad, this.wrong, 700); Fx.countUp(nPct, pct, 900); nPct.after('%'); let lastT = 0; Fx.countUp(nXp, this.xp, 1100, () => { const t = performance.now(); if (t - lastT > 60) { Sfx.play('xp'); lastT = t; } }); }, 350);
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
