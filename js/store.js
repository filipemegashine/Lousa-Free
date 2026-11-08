'use strict';
/* ---------- armazenamento local (IndexedDB) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('lousa-livre', 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        for (const name of ['boards', 'loops', 'enem']) if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath: 'id' });
      };
      r.onsuccess = () => { DB.db = r.result; DB.db.onversionchange = () => { DB.db.close(); toast('O app foi atualizado em outra aba. Recarregue esta página.', [['Recarregar', () => location.reload()]], 20000); }; res(); };
      r.onblocked = () => toast('Feche ou recarregue as outras abas da Lousa Livre para concluir a atualização.', [], 10000);
      r.onerror = () => rej(r.error);
    });
  },
  req(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  st(name, mode) { return DB.db.transaction(name, mode).objectStore(name); },
  get(s, id) { return DB.req(DB.st(s, 'readonly').get(id)); },
  all(s) { return DB.req(DB.st(s, 'readonly').getAll()); },
  put(s, v) { return DB.req(DB.st(s, 'readwrite').put(v)); },
  del(s, id) { return DB.req(DB.st(s, 'readwrite').delete(id)); }
};

/* LWW (último a escrever vence) */
function newer(a, b) { return !b || a.ts > b.ts || (a.ts === b.ts && (a.by || '') > (b.by || '')); }

/* ---------- transporte em tempo real ----------
   BroadcastChannel: outras abas/janelas do mesmo navegador.
   Servidor (server.ps1): SSE + POST, para outros dispositivos na rede. */
const Net = {
  cid: uid(), server: false, rooms: new Map(), bcs: new Map(), es: null, seen: new Set(), seenQ: [], online: false,
  async init() {
    if (location.protocol.startsWith('http')) {
      try { const r = await fetch('api/ping', { cache: 'no-store' }); this.server = r.ok && (await r.text()).trim() === 'lousa'; } catch { this.server = false; }
      if (this.server) { try { this.info = await (await fetch('api/info', { cache: 'no-store' })).json(); } catch { this.info = null; } }
    }
  },
  join(room, handler) {
    this.rooms.set(room, handler);
    if (!this.bcs.has(room) && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('lousa:' + room); bc.onmessage = e => this.deliver(e.data); this.bcs.set(room, bc);
    }
    this.reconnect();
  },
  leave(room) { this.rooms.delete(room); this.bcs.get(room)?.close(); this.bcs.delete(room); this.reconnect(); },
  reconnect: debounce(function () {
    if (!Net.server) return;
    Net.es?.close();
    const rooms = [...Net.rooms.keys()];
    if (!rooms.length) return;
    Net.es = new EventSource(`api/events?rooms=${encodeURIComponent(rooms.join(','))}&cid=${Net.cid}`);
    Net.es.onopen = () => { Net.online = true; App.onNetStatus?.(); };
    Net.es.onerror = () => { Net.online = false; App.onNetStatus?.(); };
    Net.es.onmessage = e => { try { Net.deliver(JSON.parse(e.data)); } catch { } };
  }, 50),
  deliver(m) {
    if (!m || m.from === this.cid) return;
    if (m.mid) { if (this.seen.has(m.mid)) return; this.seen.add(m.mid); this.seenQ.push(m.mid); if (this.seenQ.length > 2000) this.seen.delete(this.seenQ.shift()); }
    const fn = this.rooms.get(m.room); fn && fn(m);
  },
  send(room, m) {
    m.room = room; m.from = this.cid; m.mid = uid();
    this.seen.add(m.mid);
    try { this.bcs.get(room)?.postMessage(m); } catch { }
    if (this.server) fetch(`api/send?room=${encodeURIComponent(room)}&cid=${this.cid}`, { method: 'POST', body: JSON.stringify(m), headers: { 'Content-Type': 'text/plain;charset=utf-8' } }).catch(() => { });
    if (typeof Cloud !== 'undefined') Cloud.forward(room, m);
  }
};

/* ---------- Componentes Loop: blocos vivos, sincronizados em todo lugar ---------- */
const LOOP_ROOM = '__loops';
const Loops = {
  map: new Map(),
  async init() {
    (await DB.all('loops')).forEach(l => this.map.set(l.id, l));
    Net.join(LOOP_ROOM, m => this.onMsg(m));
    Net.send(LOOP_ROOM, { t: 'sync-req' });
    if (Net.server) Net.send(LOOP_ROOM, { t: 'seed', items: [...this.map.values()] });
  },
  defaults(type) {
    if (type === 'table') return { title: 'Tabela', data: { cells: [['Item', 'Responsável', 'Status'], ['', '', ''], ['', '', '']] } };
    if (type === 'tasks') return { title: 'Lista de tarefas', data: { tasks: [{ id: uid(), text: '', done: false }] } };
    return { title: 'Notas', data: { html: '' } };
  },
  create(type, init) {
    const d = this.defaults(type);
    const l = { id: uid(), type, title: init?.title || d.title, data: init?.data || d.data, created: now() };
    this.save(l); return l;
  },
  get(id) { return this.map.get(id); },
  update(id, fn) { const l = clone(this.map.get(id)); if (!l) return; fn(l); this.save(l); },
  save(l, remote) {
    if (!remote) { l.ts = Math.max(now(), (this.map.get(l.id)?.ts || 0) + 1); l.by = App.user?.id; }
    this.map.set(l.id, l); DB.put('loops', l).catch(() => { });
    if (!remote) Net.send(LOOP_ROOM, { t: 'op', items: [l] });
    App.onLoopChanged?.(l.id);
  },
  onMsg(m) {
    if ((m.t === 'op' || m.t === 'sync') && Array.isArray(m.items)) {
      for (const raw of m.items) { const l = Compat.cleanLoop(raw); if (l && newer(l, this.map.get(l.id))) this.save(l, true); }
    } else if (m.t === 'sync-req' && this.map.size) {
      setTimeout(() => Net.send(LOOP_ROOM, { t: 'sync', items: [...this.map.values()] }), Math.random() * 300);
    }
  }
};
