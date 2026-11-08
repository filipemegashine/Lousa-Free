'use strict';
/* =====================================================================
   Salas ao vivo na nuvem (Supabase)
   - Cada quadro compartilhado vira uma "sala" com um código de 8 letras.
   - Tempo real: canal de broadcast do Supabase (mesmas mensagens do Net).
   - Estado salvo: tabela lousa_items, com "vence o mais recente" por item.
   - Arquivos (imagens, PDFs, vídeos): bucket público lousa-media.
   ===================================================================== */
const Cloud = {
  SDK: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js',
  ALPHA: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  cfg: window.LOUSA_CONFIG || {},
  sb: null, loading: null, byBoard: new Map(), offloading: false,
  enabled() { return !!(this.cfg.supabaseUrl && this.cfg.supabaseKey); },
  norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); },
  fmt(c) { c = this.norm(c); return c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4) : c; },
  newCode() { const a = crypto.getRandomValues(new Uint8Array(8)); return [...a].map(x => this.ALPHA[x % this.ALPHA.length]).join(''); },
  link(code) { return location.origin + location.pathname + '?s=' + this.norm(code); },

  init() {
    if (!this.enabled()) return Promise.resolve(false);
    if (this.sb) return Promise.resolve(true);
    return this.loading || (this.loading = new Promise(res => {
      const go = () => {
        try {
          this.sb = window.supabase.createClient(this.cfg.supabaseUrl, this.cfg.supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            realtime: { params: { eventsPerSecond: 40 } }
          });
          res(true);
        } catch (e) { console.warn(e); this.loading = null; res(false); }
      };
      if (window.supabase?.createClient) return go();
      const s = document.createElement('script'); s.src = this.SDK; s.async = true;
      s.onload = go; s.onerror = () => { this.loading = null; res(false); };
      document.head.append(s);
    }));
  },
  async rpc(fn, args) { const { data, error } = await this.sb.rpc(fn, args); if (error) throw error; return data; },
  async roomBoard(code) { const d = await this.rpc('lousa_room', { p_code: this.norm(code) }); return typeof d === 'string' ? d : (d && d.lousa_room) || null; },
  async createRoom(boardId) {
    if (!(await this.init())) throw new Error('Sem conexão com a nuvem');
    for (let i = 0; i < 5; i++) { const c = this.newCode(); if (await this.rpc('lousa_create_room', { p_code: c, p_board: boardId })) return c; }
    throw new Error('Não foi possível criar a sala');
  },

  /* ---------- entrar / sair da sala de um quadro ---------- */
  codeOf(boardId) { return this.byBoard.get(boardId)?.code || null; },
  state(boardId) { return this.byBoard.get(boardId)?.status || null; },
  async attach(boardId, code) {
    code = this.norm(code);
    if (!code || !this.enabled() || this.codeOf(boardId) === code) return;
    this.detach(boardId);
    const e = { code, ch: null, status: 'connecting', queue: new Map(), timer: null };
    this.byBoard.set(boardId, e); App.onNetStatus?.();
    if (!(await this.init())) { e.status = 'error'; App.onNetStatus?.(); return; }
    if (this.byBoard.get(boardId) !== e) return;
    const ch = this.sb.channel('lousa-' + code, { config: { broadcast: { self: false, ack: false } } });
    ch.on('broadcast', { event: 'm' }, ({ payload }) => { if (payload && typeof payload === 'object') Net.deliver(payload); });
    ch.subscribe(st => {
      const was = e.status;
      e.status = st === 'SUBSCRIBED' ? 'on' : st === 'CLOSED' ? 'off' : (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') ? 'error' : e.status;
      App.onNetStatus?.();
      if (st === 'SUBSCRIBED') { presenceTick(); if (was !== 'connecting') this.load(boardId); }
    });
    e.ch = ch;
    await this.load(boardId);
    this.offloadSoon(boardId);
  },
  detach(boardId) {
    const e = this.byBoard.get(boardId); if (!e) return;
    this.flush(boardId);
    try { if (e.ch) this.sb.removeChannel(e.ch); } catch { }
    this.byBoard.delete(boardId); App.onNetStatus?.();
  },
  /* estado atual da sala (quadro + componentes Loop) */
  async load(boardId) {
    const e = this.byBoard.get(boardId); if (!e) return;
    try {
      const rows = await this.rpc('lousa_get', { p_code: e.code });
      const items = [], loops = [];
      for (const r of rows || []) {
        const d = r && r.lousa_get ? r.lousa_get : r;
        if (!d || typeof d.id !== 'string') continue;
        if (d.id.startsWith('L:')) loops.push({ ...d, id: d.id.slice(2) }); else items.push(d);
      }
      if (loops.length) Net.deliver({ t: 'sync', room: LOOP_ROOM, items: loops, from: 'cloud', mid: uid() });
      if (items.length) Net.deliver({ t: 'sync', room: boardId, items, from: 'cloud', mid: uid() });
    } catch (err) { console.warn('Cloud.load', err); e.status = 'error'; App.onNetStatus?.(); }
  },
  /* envia o quadro inteiro (ao criar a sala) */
  seed(boardId) {
    const loopIds = this.loopRefs(boardId);
    this.persist(boardId, [...App.items.values()].filter(it => this.small(it)));
    this.persist(boardId, [...loopIds].map(id => Loops.get(id)).filter(Boolean).map(l => ({ ...l, id: 'L:' + l.id })));
    this.flush(boardId);
  },
  loopRefs(boardId) { return new Set(boardId === App.boardId ? liveItems().filter(i => i.type === 'loop').map(i => i.loopId) : []); },
  small(it) { try { return JSON.stringify(it).length < 180000; } catch { return false; } },

  /* chamado pelo Net.send para cada mensagem */
  forward(room, m) {
    if (!this.byBoard.size) return;
    if (room === LOOP_ROOM) {
      if (m.t !== 'op' || !Array.isArray(m.items)) return;
      for (const [bid, e] of this.byBoard) {
        const refs = this.loopRefs(bid); const items = m.items.filter(l => refs.has(l.id) && this.small(l));
        if (!items.length) continue;
        this.persist(bid, items.map(l => ({ ...l, id: 'L:' + l.id })));
        this.bcast(e, { ...m, items });
      }
      return;
    }
    const e = this.byBoard.get(room); if (!e) return;
    if (m.t === 'op' || m.t === 'sync' || m.t === 'seed') {
      const items = (m.items || []).filter(it => this.small(it));
      if (items.length) this.persist(room, items);
      if (m.t !== 'op' || !items.length) return; // o estado completo vem do banco, não do canal
      m = { ...m, items };
    }
    if (m.t === 'sync-req') return;
    this.bcast(e, m);
  },
  bcast(e, m) {
    if (e.status !== 'on' || !e.ch) return;
    try { if (JSON.stringify(m).length > 240000) return; } catch { return; }
    try { const p = e.ch.send({ type: 'broadcast', event: 'm', payload: m }); p?.catch?.(() => { }); } catch { }
  },
  persist(boardId, items) {
    const e = this.byBoard.get(boardId); if (!e) return;
    for (const it of items) if (it && it.id) e.queue.set(it.id, it);
    clearTimeout(e.timer); e.timer = setTimeout(() => this.flush(boardId), 700);
  },
  flush(boardId) {
    const e = this.byBoard.get(boardId); if (!e || !e.queue.size || !this.sb) return;
    clearTimeout(e.timer);
    const all = [...e.queue.values()]; e.queue.clear();
    for (let i = 0; i < all.length; i += 250) {
      const chunk = all.slice(i, i + 250);
      this.rpc('lousa_upsert', { p_code: e.code, p_items: chunk }).catch(err => {
        console.warn('Cloud.flush', err);
        if (this.byBoard.get(boardId) === e) { chunk.forEach(it => { if (!e.queue.has(it.id)) e.queue.set(it.id, it); }); e.timer = setTimeout(() => this.flush(boardId), 4000); }
      });
    }
  },

  /* ---------- imagens, PDFs e vídeos vão para o armazenamento ---------- */
  offloadSoon: debounce(function (boardId) { Cloud.offload(boardId); }, 400),
  async offload(boardId) {
    const e = this.byBoard.get(boardId); if (!e || this.offloading || boardId !== App.boardId) return;
    this.offloading = true; let n = 0;
    try {
      for (const it of liveItems()) {
        const src = it.src;
        if (!['image', 'embed'].includes(it.type) || typeof src !== 'string' || !src.startsWith('data:')) continue;
        const blob = await (await fetch(src)).blob();
        const ext = ((blob.type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('svg+xml', 'svg').replace(/[^a-z0-9]/gi, '')) || 'bin';
        const path = `${e.code}/${uid()}.${ext}`;
        const { error } = await this.sb.storage.from('lousa-media').upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: false });
        if (error) throw error;
        const url = this.sb.storage.from('lousa-media').getPublicUrl(path).data.publicUrl;
        const cur = getItem(it.id);
        if (cur && cur.src === src) { cur.src = url; putItems([cur]); n++; }
      }
    } catch (err) { console.warn('Cloud.offload', err); toast('Um arquivo não pôde ser enviado para a nuvem (limite de 25 MB).'); }
    finally { this.offloading = false; }
    if (n) this.flush(boardId);
  }
};
addEventListener('beforeunload', () => { for (const bid of Cloud.byBoard.keys()) Cloud.flush(bid); });
