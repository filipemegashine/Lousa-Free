'use strict';
/* ---------- utilitários gerais ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const now = () => Date.now();
const r1 = v => Math.round(v * 10) / 10;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const rotPt = (x, y, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function throttle(fn, ms) { let last = 0, t = null, args; return (...a) => { args = a; const d = now() - last; if (d >= ms) { last = now(); fn(...args); } else if (!t) { t = setTimeout(() => { t = null; last = now(); fn(...args); }, ms - d); } }; }
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) e.style.setProperty(sk, sv); else e.style[sk] = sv; }
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
function readFile(file, as = 'dataURL') {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); as === 'text' ? r.readAsText(file) : r.readAsDataURL(file); });
}
function dataURLtoBlobURL(d) {
  const [head, b64] = d.split(','); const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: mime }));
}
function hashStr(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
function rng(seed) { let s = seed || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function initials(name) { return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
function isTyping() { const a = document.activeElement; return a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }

/* ---------- paletas ---------- */
const NOTE_COLORS = [
  { n: 'Amarelo', c: '#FFF27A' }, { n: 'Laranja', c: '#FFD08A' }, { n: 'Coral', c: '#FFAFA3' }, { n: 'Rosa', c: '#FFB8E0' },
  { n: 'Lilás', c: '#E1C9FF' }, { n: 'Roxo', c: '#C4B5FF' }, { n: 'Azul', c: '#A8D8FF' }, { n: 'Turquesa', c: '#A3F0E8' },
  { n: 'Verde', c: '#BDF2AE' }, { n: 'Lima', c: '#E5F7A0' }, { n: 'Areia', c: '#EADBC8' }, { n: 'Cinza', c: '#E4E4E8' }
];
const INK_COLORS = ['#f1f7fb', '#1f1f24', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#00acc1', '#1e88e5', '#5e35b1', '#d81b60', '#795548', '#9e9e9e'];
const HL_COLORS = ['#ffeb3b', '#ffb74d', '#ff80ab', '#b388ff', '#80d8ff', '#b9f6ca'];
const SHAPE_COLORS = ['transparent', '#ffffff', '#1f1f24', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#5e35b1', '#d81b60', ...NOTE_COLORS.map(x => x.c)];
const PEOPLE_COLORS = ['#e53935', '#1e88e5', '#43a047', '#8e24aa', '#fb8c00', '#00897b', '#d81b60', '#3949ab', '#6d4c41', '#c0ca33'];
const FONTS = [
  { n: 'Padrão', f: "'Segoe UI',system-ui,-apple-system,Roboto,sans-serif" },
  { n: 'Manuscrita', f: "'Segoe Print','Comic Sans MS','Bradley Hand','Chalkboard SE',cursive" },
  { n: 'Serifada', f: "Georgia,'Times New Roman',serif" },
  { n: 'Monoespaçada', f: "Consolas,'Courier New',monospace" },
  { n: 'Arredondada', f: "'Trebuchet MS','Verdana',sans-serif" },
  { n: 'Caligráfica', f: "'Segoe Script','Brush Script MT','Snell Roundhand',cursive" }
];
const fontOf = i => (FONTS[i] || FONTS[0]).f;
const REACTIONS = ['👍', '❤️', '😂', '😮', '🎉', '💡', '⭐', '👏'];
const BG_COLORS = ['#131f24', '#000437', '#1a2a1f', '#2d1f3a', '#202f36', '#f6f6f4', '#ffffff', '#fdf6e3'];

/* ---------- sanitização de HTML (conteúdo de colaboradores) ---------- */
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'BR', 'DIV', 'P', 'SPAN', 'UL', 'OL', 'LI']);
function sanitize(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  const walk = node => {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) continue;
      if (ch.nodeType !== 1 || !ALLOWED_TAGS.has(ch.tagName)) {
        if (ch.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(ch.tagName)) { walk(ch); ch.replaceWith(...ch.childNodes); }
        else ch.remove();
        continue;
      }
      for (const a of [...ch.attributes]) ch.removeAttribute(a.name);
      walk(ch);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
const safeUrl = u => /^(https?:|data:image\/|data:video\/|data:application\/pdf|blob:)/i.test(u || '') ? u : '';

/* ---------- ícones coloridos ---------- */
const IC = {
  select: '<path d="M6 3.5l13 7.6-5.8 1.4-3 5.6z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  hand: '<path d="M8 12.5V6a1.5 1.5 0 013 0v5M11 10.5V4.5a1.5 1.5 0 013 0v6M14 10.5V6a1.5 1.5 0 013 0v5M17 9.5a1.5 1.5 0 013 0v5.5a6.5 6.5 0 01-6.5 6.5h-1a6.5 6.5 0 01-5-2.4l-3.3-4.2a1.6 1.6 0 012.5-2L8 14.5" fill="#ffe0c7" stroke="#6d4c41" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  pen: c => `<path d="M4 20l1.2-4.7L15.7 4.8a2.2 2.2 0 013.1 3.1L8.3 18.4z" fill="${c}" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 20l1.2-4.7 3.1 3.1z" fill="currentColor"/>`,
  highlighter: c => `<rect x="2.5" y="20.2" width="19" height="2.6" rx="1.3" fill="${c}"/><path d="M7.3 16.6L5 19h4l1.3-1.3" fill="currentColor"/><path d="M7.2 13.2l8.7-9a2 2 0 012.8 0l.9.9a2 2 0 010 2.8l-9 8.7z" fill="${c}" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.2 13.2l3.4 3.4-1.5 1.5-3.4-3.4z" fill="#555"/>`,
  eraser: '<path d="M3.8 14.6l8.8-8.8a2 2 0 012.8 0l3.8 3.8a2 2 0 010 2.8L12 19.6a2 2 0 01-1.4.6H8.4a2 2 0 01-1.4-.6l-3.2-3.2a2 2 0 010-2.8z" fill="#ff9ec4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.2 10.2l6 6" stroke="currentColor" stroke-width="1.5"/><path d="M12.5 20.2H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  arrowNone: '<path d="M4 18C8 9 13 15 20 6" fill="none" stroke="#5b5fc7" stroke-width="2.2" stroke-linecap="round"/>',
  arrowEnd: '<path d="M4 19C8 10 12 15 19 6" fill="none" stroke="#5b5fc7" stroke-width="2.2" stroke-linecap="round"/><path d="M13.2 5.6H19.2V11.6" fill="none" stroke="#5b5fc7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  arrowBoth: '<path d="M5 19C8 10 12 15 19 5" fill="none" stroke="#5b5fc7" stroke-width="2.2" stroke-linecap="round"/><path d="M13.2 5H19.2V11M4.6 13v6h6" fill="none" stroke="#5b5fc7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  shapeInk: '<path d="M3 20c1-3 2.5-5 4-6" fill="none" stroke="#9e9e9e" stroke-width="1.6" stroke-dasharray="2 2.2" stroke-linecap="round"/><circle cx="9" cy="8.5" r="5" fill="#ffe28a" stroke="#f9a825" stroke-width="1.6"/><path d="M13.5 20.5l4-7.5 4 7.5z" fill="#bfe3ff" stroke="#1e88e5" stroke-width="1.6" stroke-linejoin="round"/>',
  undo: '<path d="M9 14L4 9l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  redo: '<path d="M15 14l5-5-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  note: '<path d="M4 4h16v11l-5 5H4z" fill="#FFE96B" stroke="#d9a900" stroke-width="1.4" stroke-linejoin="round"/><path d="M15 20v-5h5" fill="#f4c93a" stroke="#d9a900" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 9h9M7.5 12.5h6" stroke="#b08a00" stroke-width="1.4" stroke-linecap="round"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="1.6" fill="#FFE96B"/><rect x="13" y="3" width="8" height="8" rx="1.6" fill="#FFB8E0"/><rect x="3" y="13" width="8" height="8" rx="1.6" fill="#A8D8FF"/><rect x="13" y="13" width="8" height="8" rx="1.6" fill="#BDF2AE"/>',
  text: '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6" fill="none" stroke="#7b4fd6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  shapes: '<rect x="3" y="10" width="10" height="10" rx="1.6" fill="#A8D8FF" stroke="#1e88e5" stroke-width="1.5"/><circle cx="15.5" cy="8.5" r="5.5" fill="#FFD08A" stroke="#fb8c00" stroke-width="1.5"/>',
  line: '<path d="M4.5 19.5L19 5" stroke="#43a047" stroke-width="2.4" stroke-linecap="round"/><path d="M12 5h7v7" fill="none" stroke="#43a047" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="#e3f2fd" stroke="#1e88e5" stroke-width="1.5"/><circle cx="9" cy="9.5" r="2" fill="#fdd835"/><path d="M3.8 18l5.2-5.2 4 4 2.6-2.6 4.8 4.8" fill="none" stroke="#43a047" stroke-width="1.8" stroke-linejoin="round"/>',
  video: '<rect x="2.5" y="5" width="19" height="14" rx="3.5" fill="#ff4d4d"/><path d="M10 9v6l5.2-3z" fill="#fff"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" fill="none" stroke="#1e88e5" stroke-width="2.2" stroke-linecap="round"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" fill="none" stroke="#00acc1" stroke-width="2.2" stroke-linecap="round"/>',
  pdf: '<path d="M6 2.5h8l5 5V21a.6.6 0 01-.6.6H6.6A.6.6 0 016 21z" fill="#fff" stroke="#e53935" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 2.5V8h5" fill="none" stroke="#e53935" stroke-width="1.5"/><rect x="2.5" y="12" width="13" height="6.2" rx="1.2" fill="#e53935"/><text x="9" y="16.8" font-size="4.6" font-weight="700" text-anchor="middle" fill="#fff" font-family="Arial">PDF</text>',
  ppt: '<path d="M6 2.5h8l5 5V21a.6.6 0 01-.6.6H6.6A.6.6 0 016 21z" fill="#fff" stroke="#d24726" stroke-width="1.5"/><rect x="2.5" y="12" width="13" height="6.2" rx="1.2" fill="#d24726"/><text x="9" y="16.8" font-size="4.6" font-weight="700" text-anchor="middle" fill="#fff" font-family="Arial">PPT</text>',
  loop: '<path d="M6.3 8.2A6.8 6.8 0 0118 9" fill="none" stroke="#7b4fd6" stroke-width="2.4" stroke-linecap="round"/><path d="M17.7 15.8A6.8 6.8 0 016 15" fill="none" stroke="#19b9a4" stroke-width="2.4" stroke-linecap="round"/><path d="M19 4.6V9.4h-4.8" fill="none" stroke="#7b4fd6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19.4v-4.8h4.8" fill="none" stroke="#19b9a4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="#19a79a" stroke-width="1.6"/><path d="M3 4h18v5H3z" fill="#c9f3ee"/><path d="M3 9h18M3 14.5h18M9 4v16M15 4v16" stroke="#19a79a" stroke-width="1.3"/>',
  tasks: '<path d="M3.8 6.5l2 2 3.2-3.6M3.8 13l2 2 3.2-3.6" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7h8.5M12 13.5h8.5M12 19.5h8.5" stroke="#5b5fc7" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="17.2" width="4.6" height="4.6" rx="1" fill="none" stroke="#777" stroke-width="1.4"/>',
  para: '<rect x="3" y="3" width="18" height="18" rx="3" fill="#f1edff"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#7b4fd6" stroke-width="1.8" stroke-linecap="round"/>',
  smile: '<circle cx="12" cy="12" r="9" fill="#FFD54F" stroke="#f0a500" stroke-width="1.5"/><circle cx="9" cy="10" r="1.3" fill="#3a2a00"/><circle cx="15" cy="10" r="1.3" fill="#3a2a00"/><path d="M8 14.3a4.6 4.6 0 008 0" fill="none" stroke="#3a2a00" stroke-width="1.6" stroke-linecap="round"/>',
  home: '<path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 01-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 014 19.5z" fill="#ececfb" stroke="#5b5fc7" stroke-width="1.8" stroke-linejoin="round"/>',
  boards: '<rect x="3" y="3" width="8" height="8" rx="2" fill="#c4b5ff" stroke="#5b5fc7" stroke-width="1.4"/><rect x="13" y="3" width="8" height="8" rx="2" fill="#fff" stroke="#5b5fc7" stroke-width="1.4"/><rect x="3" y="13" width="8" height="8" rx="2" fill="#fff" stroke="#5b5fc7" stroke-width="1.4"/><rect x="13" y="13" width="8" height="8" rx="2" fill="#fff" stroke="#5b5fc7" stroke-width="1.4"/>',
  share: '<circle cx="17.5" cy="5.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="6.5" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="17.5" cy="18.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8.8 10.7l6.4-3.9M8.8 13.3l6.4 3.9" stroke="currentColor" stroke-width="1.9"/>',
  palette: '<path d="M12 3a9 9 0 000 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7H17a4 4 0 004-4C21 6.6 17 3 12 3z" fill="#fff6e0" stroke="#6d4c41" stroke-width="1.5"/><circle cx="7.5" cy="11" r="1.6" fill="#e53935"/><circle cx="10" cy="7" r="1.6" fill="#fdd835"/><circle cx="14.6" cy="7" r="1.6" fill="#43a047"/><circle cx="17.4" cy="10.6" r="1.6" fill="#1e88e5"/>',
  more: '<circle cx="5.5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18.5" cy="12" r="1.8" fill="currentColor"/>',
  zoomIn: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  zoomOut: '<path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" fill="none" stroke="#e53935" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="#e8e9ff" stroke="#5b5fc7" stroke-width="1.7"/><path d="M16 8V5.2a1.2 1.2 0 00-1.2-1.2H5.2A1.2 1.2 0 004 5.2v9.6A1.2 1.2 0 005.2 16H8" fill="none" stroke="#5b5fc7" stroke-width="1.7"/>',
  layers: '<path d="M12 3.5l9 5-9 5-9-5z" fill="#c4b5ff" stroke="#5b5fc7" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" fill="none" stroke="#5b5fc7" stroke-width="1.5" stroke-linejoin="round"/>',
  front: '<rect x="3" y="3" width="11" height="11" rx="2" fill="#fff" stroke="#999" stroke-width="1.5"/><rect x="9" y="9" width="12" height="12" rx="2" fill="#5b5fc7"/>',
  back: '<rect x="9" y="9" width="12" height="12" rx="2" fill="#fff" stroke="#999" stroke-width="1.5"/><rect x="3" y="3" width="11" height="11" rx="2" fill="#5b5fc7"/>',
  align: '<path d="M4 3v18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="7" y="6" width="13" height="4.2" rx="1.2" fill="#a8d8ff" stroke="#1e88e5" stroke-width="1.3"/><rect x="7" y="13.8" width="8.5" height="4.2" rx="1.2" fill="#ffd08a" stroke="#fb8c00" stroke-width="1.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  magic: '<path d="M4 20L14.5 9.5" stroke="#5b5fc7" stroke-width="2.4" stroke-linecap="round"/><path d="M16 3v3M16 11v2.5M20.5 7.5H18M12.5 7.5H14M19.2 4.3l-1.3 1.3M19.2 10.7l-1.3-1.3" stroke="#f9a825" stroke-width="1.8" stroke-linecap="round"/>',
  inkText: '<text x="2" y="15" font-size="11" font-weight="700" fill="#7b4fd6" font-family="Georgia">Aa</text><path d="M3 20c3-3 5 1 8-1.5s4-.5 6-1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M15 11l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  grab: '<rect x="3" y="3" width="11" height="11" rx="2" fill="#e3f2fd" stroke="#1e88e5" stroke-width="1.4"/><path d="M5 11l3-3 2 2 2-2" fill="none" stroke="#43a047" stroke-width="1.4"/><path d="M12 21c2-4 4-6 9-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 12l3 2-2 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  sort: '<rect x="3" y="4" width="5" height="5" rx="1" fill="#FFE96B"/><rect x="3" y="11" width="5" height="5" rx="1" fill="#FFB8E0"/><rect x="10" y="4" width="5" height="5" rx="1" fill="#FFE96B"/><rect x="10" y="11" width="5" height="5" rx="1" fill="#FFB8E0"/><path d="M19 4v15M16.5 16.5L19 19l2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" fill="none" stroke="#1e88e5" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  hand2: '<path d="M9 11V5.5a1.5 1.5 0 013 0V11m0-1.5V4a1.5 1.5 0 013 0v7m0-4.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-.5a6 6 0 01-4.7-2.3L5 15.5a1.5 1.5 0 012.3-1.9L9 15.5" fill="none" stroke="#5b5fc7" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  dashed: '<path d="M4 20L20 4" stroke="currentColor" stroke-width="2.2" stroke-dasharray="3.5 3" stroke-linecap="round"/>',
  elbow: '<path d="M4 18h8V6h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M16.5 2.5L20 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  curve: '<path d="M4 19C4 8 20 16 20 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M16.5 7.2L20 4.5l2 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
};
function icon(name, arg) { const d = IC[name]; return `<svg viewBox="0 0 24 24" aria-hidden="true">${typeof d === 'function' ? d(arg) : (d || '')}</svg>`; }

/* ---------- toasts, modais ---------- */
function toast(msg, actions = [], ms = 3500) {
  const t = h('div', { class: 'toast' }, h('span', {}, msg));
  actions.forEach(([label, fn]) => t.append(h('button', { onclick: () => { fn(); t.remove(); } }, label)));
  $('#toasts').append(t);
  setTimeout(() => t.remove(), ms);
  return t;
}
function modal(title, body, buttons = [['OK', 'pri', () => true]]) {
  return new Promise(res => {
    const back = h('div', { class: 'modal-back' });
    if (typeof Sfx !== 'undefined') Sfx.play('open');
    const close = v => { back.remove(); res(v); };
    const foot = h('div', { class: 'm-foot' });
    buttons.forEach(([label, cls, fn]) => foot.append(h('button', { class: 'mbtn ' + (cls || ''), onclick: async () => { const v = fn ? await fn() : undefined; if (v !== false) close(v); } }, label)));
    const m = h('div', { class: 'modal', role: 'dialog' }, h('h2', {}, title), h('div', { class: 'm-body' }, body), foot);
    back.append(m);
    back.addEventListener('pointerdown', e => { if (e.target === back) close(undefined); });
    back.addEventListener('keydown', e => { if (e.key === 'Escape') close(undefined); if (e.key === 'Enter' && e.target.tagName === 'INPUT') foot.querySelector('.pri')?.click(); });
    $('#modal-root').append(back);
    setTimeout(() => (m.querySelector('input,textarea') || foot.querySelector('.pri'))?.focus(), 30);
  });
}
async function promptText(title, label, value = '', placeholder = '') {
  const inp = h('input', { class: 'field', value, placeholder });
  const r = await modal(title, [label ? h('p', {}, label) : null, inp], [['Cancelar', '', () => null], ['OK', 'pri', () => inp.value]]);
  return r == null ? null : r;
}

/* ---------- popover ---------- */
const Pop = {
  el: null, anchor: null,
  open(anchor, content, place = 'below') {
    const p = this.el || (this.el = $('#popover'));
    if (this.anchor === anchor && p.classList.contains('show')) { this.close(); return; }
    p.innerHTML = ''; p.append(content); p.classList.add('show'); this.anchor = anchor;
    const r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    let x = r.left + r.width / 2 - pw / 2, y = place === 'above' ? r.top - ph - 8 : r.bottom + 8;
    if (place === 'right') { x = r.right + 8; y = r.top; }
    if (y + ph > innerHeight - 8) y = r.top - ph - 8;
    if (y < 8) y = Math.min(r.bottom + 8, innerHeight - ph - 8);
    p.style.left = clamp(x, 8, innerWidth - pw - 8) + 'px'; p.style.top = Math.max(8, y) + 'px';
  },
  close() { if (this.el) { this.el.classList.remove('show'); this.el.innerHTML = ''; } this.anchor = null; }
};
document.addEventListener('pointerdown', e => { if (Pop.anchor && !e.target.closest('#popover') && !Pop.anchor.contains(e.target)) Pop.close(); }, true);
