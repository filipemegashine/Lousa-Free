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

/* ---------- ícones (24x24): traço arredondado 2px em currentColor + preenchimentos chapados da paleta ---------- */
const IC = (() => {
const KN = 'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const K = KN + ' stroke-width="2"';
const G = '#58cc02', GD = '#46a302', B = '#1cb0f6', BD = '#1899d6', Y = '#ffc800', YD = '#e5a400', R = '#ff4b4b', RD = '#d33131', P = '#ce82ff', PD = '#a568cc', O = '#ff9600', PK = '#ff86d0';
return {
  select: `<path d="M6 3.8l12.4 7.1-5.5 1.4-2.6 5.4z" fill="currentColor" ${K}/>`,
  hand: `<path d="M8.5 12.5V6.3a1.6 1.6 0 013.2 0V11m0-.5V4.6a1.6 1.6 0 013.2 0V11m0-.8V6.3a1.6 1.6 0 013.2 0v8.2a6.5 6.5 0 01-6.5 6.5h-.6a6.4 6.4 0 01-5-2.4l-2.7-3.4a1.7 1.7 0 012.6-2.1l1.8 1.9" fill="none" ${K}/>`,
  pen: c => `<path d="M15.3 4.2a2.3 2.3 0 013.3 0l1.2 1.2a2.3 2.3 0 010 3.3L9.3 19.2l-5 1.3 1.3-5z" fill="${c}" ${K}/><path d="M13.6 5.9l4.5 4.5" ${K}/><path d="M5.6 15.5l2.9 2.9" ${K}/>`,
  highlighter: c => `<path d="M14.6 3.6a2 2 0 012.8 0l2.9 2.9a2 2 0 010 2.8l-7.1 7.1-5.7-5.7z" fill="${c}" ${K}/><path d="M7.5 10.7l5.7 5.7-2.1 2.1H8.3l-2.8-2.8V12.9z" fill="currentColor" ${K}/><path d="M3 21h8" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  eraser: `<path d="M13.4 4.3a2 2 0 012.8 0l3.5 3.5a2 2 0 010 2.8l-7.8 7.8H7.8l-3.5-3.5a2 2 0 010-2.8z" fill="${PK}" ${K}/><path d="M9 8.7l6.3 6.3" ${K}/><path d="M12 18.4h8" ${K}/>`,
  arrowNone: `<path d="M4 18c3.5-7 6.5-2 9.5-6S17 5 20 6" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`,
  arrowEnd: `<path d="M4 19c3.5-7 6.5-2 9.5-6s3-5.5 5.8-7.3" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><path d="M14.5 4.8h5v5" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  arrowBoth: `<path d="M5 19c3.5-7 6.5-2 9-6s3-5.5 5-7" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><path d="M14.5 4.8h5v5M4.5 14v5h5" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  shapeInk: `<path d="M3 21c1.2-2.4 2.5-3.8 4-4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="1 3" stroke-linecap="round"/><circle cx="9" cy="8.5" r="5" fill="${Y}" stroke="${YD}" stroke-width="2"/><path d="M13.5 20.5l4-7.5 4 7.5z" fill="${B}" stroke="${BD}" stroke-width="2" stroke-linejoin="round"/>`,
  undo: `<path d="M9 14L4 9l5-5" fill="none" ${KN} stroke-width="2.4"/><path d="M4 9h10a6 6 0 010 12h-3" fill="none" ${KN} stroke-width="2.4"/>`,
  redo: `<path d="M15 14l5-5-5-5" fill="none" ${KN} stroke-width="2.4"/><path d="M20 9H10a6 6 0 000 12h3" fill="none" ${KN} stroke-width="2.4"/>`,
  plus: `<path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  note: `<path d="M5 3.5h14A1.5 1.5 0 0120.5 5v10.5L15.5 20.5H5A1.5 1.5 0 013.5 19V5A1.5 1.5 0 015 3.5z" fill="${Y}"/><path d="M20.5 15.5h-3.5a1.5 1.5 0 00-1.5 1.5v3.5z" fill="${YD}"/><path d="M7.5 8.5h9M7.5 12h6" stroke="#9a6b00" stroke-width="2" stroke-linecap="round"/>`,
  grid: `<rect x="3" y="3" width="8" height="8" rx="2.2" fill="${Y}"/><rect x="13" y="3" width="8" height="8" rx="2.2" fill="${PK}"/><rect x="3" y="13" width="8" height="8" rx="2.2" fill="${B}"/><rect x="13" y="13" width="8" height="8" rx="2.2" fill="${G}"/>`,
  text: `<path d="M5 7.5V5h14v2.5M12 5v14.5M9 19.5h6" fill="none" stroke="${P}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  shapes: `<rect x="3" y="10" width="10" height="10.5" rx="2.4" fill="${B}"/><circle cx="15.5" cy="8.5" r="5.5" fill="${O}"/><path d="M13 13.6a5.5 5.5 0 01-3-1.1V10h3z" fill="${BD}" opacity=".0"/>`,
  line: `<path d="M5 19L18.5 5.5" stroke="${G}" stroke-width="2.8" stroke-linecap="round"/><path d="M11.5 5H19v7.5" fill="none" stroke="${G}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  image: `<rect x="2.5" y="4" width="19" height="16" rx="3.5" fill="${B}"/><circle cx="8.5" cy="9.5" r="2.2" fill="${Y}"/><path d="M2.5 17l5.5-5.5 4 4 3-3 6.5 6.5V16.5A3.5 3.5 0 0118 20H6a3.5 3.5 0 01-3.5-3.5z" fill="${G}"/>`,
  video: `<rect x="2.5" y="5" width="19" height="14" rx="4" fill="${R}"/><path d="M10 9.2v5.6c0 .5.5.8.9.5l4.4-2.8a.6.6 0 000-1l-4.4-2.8c-.4-.3-.9 0-.9.5z" fill="#fff"/>`,
  link: `<path d="M10.5 13.5a4 4 0 005.7 0l2.8-2.8a4 4 0 00-5.7-5.7l-1.2 1.2" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><path d="M13.5 10.5a4 4 0 00-5.7 0L5 13.3a4 4 0 005.7 5.7l1.2-1.2" fill="none" stroke="${G}" stroke-width="2.6" stroke-linecap="round"/>`,
  pdf: `<path d="M6.5 2.5h7.5l5 5V20a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20V4a1.5 1.5 0 011.5-1.5z" fill="#f1f7fb"/><path d="M14 2.5V7a.5.5 0 00.5.5H19" fill="#c9d4da"/><rect x="2.5" y="11.5" width="13" height="7" rx="2" fill="${R}"/><text x="9" y="16.6" font-size="4.8" font-weight="900" text-anchor="middle" fill="#fff" font-family="Nunito,Arial">PDF</text>`,
  ppt: `<path d="M6.5 2.5h7.5l5 5V20a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20V4a1.5 1.5 0 011.5-1.5z" fill="#f1f7fb"/><rect x="2.5" y="11.5" width="13" height="7" rx="2" fill="${O}"/><text x="9" y="16.6" font-size="4.8" font-weight="900" text-anchor="middle" fill="#fff" font-family="Nunito,Arial">PPT</text>`,
  loop: `<path d="M5.8 9A7 7 0 0118.2 8" fill="none" stroke="${P}" stroke-width="2.8" stroke-linecap="round"/><path d="M18.2 15A7 7 0 015.8 16" fill="none" stroke="${G}" stroke-width="2.8" stroke-linecap="round"/><path d="M19 3.8V8.6h-4.8" fill="none" stroke="${P}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 20.2v-4.8h4.8" fill="none" stroke="${G}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  table: `<rect x="3" y="4" width="18" height="16" rx="3" fill="${G}"/><path d="M3 9.3h18" stroke="${GD}" stroke-width="2"/><path d="M3 14.7h18M9 9.3V20M15 9.3V20" stroke="#fff" stroke-width="1.6" opacity=".85"/>`,
  tasks: `<rect x="3" y="3.5" width="6" height="6" rx="1.8" fill="${G}"/><path d="M4.6 6.6l1.3 1.3 2-2.4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="14.5" width="6" height="6" rx="1.8" fill="none" ${K}/><path d="M12.5 6.5H21M12.5 17.5H21" ${K}/>`,
  para: `<rect x="3" y="3" width="18" height="18" rx="4" fill="${P}"/><path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  smile: `<circle cx="12" cy="12" r="9.5" fill="${Y}"/><circle cx="9" cy="10" r="1.5" fill="#4b3200"/><circle cx="15" cy="10" r="1.5" fill="#4b3200"/><path d="M8 14.2a4.8 4.8 0 008 0" fill="none" stroke="#4b3200" stroke-width="2" stroke-linecap="round"/>`,
  home: `<path d="M3.5 10.8L12 3.5l8.5 7.3V19a2 2 0 01-2 2H15v-5.5a1 1 0 00-1-1h-4a1 1 0 00-1 1V21H5.5a2 2 0 01-2-2z" fill="${B}" stroke="${B}" stroke-width="1.6" stroke-linejoin="round"/>`,
  boards: `<rect x="3" y="3" width="8" height="8" rx="2.2" fill="${B}"/><rect x="13" y="3" width="8" height="8" rx="2.2" fill="none" ${K}/><rect x="3" y="13" width="8" height="8" rx="2.2" fill="none" ${K}/><rect x="13" y="13" width="8" height="8" rx="2.2" fill="none" ${K}/>`,
  share: `<circle cx="17.5" cy="5.5" r="2.8" fill="currentColor"/><circle cx="6.5" cy="12" r="2.8" fill="currentColor"/><circle cx="17.5" cy="18.5" r="2.8" fill="currentColor"/><path d="M9 10.6l6-3.6M9 13.4l6 3.6" ${K}/>`,
  palette: `<path d="M12 3a9 9 0 000 18c1.3 0 2-.9 2-1.9 0-1.4-1.1-1.6-1.1-2.7 0-1 .9-1.8 2-1.8H17a4 4 0 004-4C21 6.6 17 3 12 3z" fill="#f1f7fb"/><circle cx="7.5" cy="11" r="1.7" fill="${R}"/><circle cx="9.8" cy="7" r="1.7" fill="${Y}"/><circle cx="14.4" cy="6.8" r="1.7" fill="${G}"/><circle cx="17.4" cy="10.5" r="1.7" fill="${B}"/>`,
  more: `<circle cx="5.5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18.5" cy="12" r="2" fill="currentColor"/>`,
  zoomIn: `<path d="M12 5v14M5 12h14" ${KN} stroke-width="2.6"/>`,
  zoomOut: `<path d="M5 12h14" ${KN} stroke-width="2.6"/>`,
  fit: `<path d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4" fill="none" ${KN} stroke-width="2.4"/>`,
  trash: `<path d="M6 7.5h12l-1 11.5a2 2 0 01-2 1.8H9a2 2 0 01-2-1.8z" fill="${R}"/><path d="M4 7h16M9.5 7V5a1 1 0 011-1h3a1 1 0 011 1v2" fill="none" stroke="${R}" stroke-width="2.2" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  copy: `<rect x="8.5" y="8.5" width="12" height="12" rx="2.8" fill="${B}"/><path d="M15.5 8.5V6a2.5 2.5 0 00-2.5-2.5H6A2.5 2.5 0 003.5 6v7A2.5 2.5 0 006 15.5h2.5" fill="none" ${K}/>`,
  layers: `<path d="M12 3.5l9 5-9 5-9-5z" fill="${P}" stroke="${P}" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" fill="none" ${K}/>`,
  front: `<rect x="3" y="3" width="11" height="11" rx="2.5" fill="none" ${K}/><rect x="10" y="10" width="11" height="11" rx="2.5" fill="${B}"/>`,
  back: `<rect x="10" y="10" width="11" height="11" rx="2.5" fill="none" ${K}/><rect x="3" y="3" width="11" height="11" rx="2.5" fill="${B}"/>`,
  align: `<path d="M4 3v18" ${KN} stroke-width="2.4"/><rect x="7.5" y="5.5" width="13" height="5" rx="2" fill="${B}"/><rect x="7.5" y="13.5" width="8.5" height="5" rx="2" fill="${O}"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18" ${KN} stroke-width="2.6"/>`,
  magic: `<path d="M4 20L14 10" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M16.5 2.8l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" fill="${Y}"/><path d="M20 10.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="${Y}"/><path d="M10 3.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="${B}"/>`,
  inkText: `<text x="2" y="13.5" font-size="11" font-weight="900" fill="${P}" font-family="Nunito,Arial">Aa</text><path d="M3 20c2.5-2.2 4.5.8 7-1.2s3.5-.6 5.5-1.3" fill="none" ${K}/><path d="M15.5 10.5l5-5" ${KN} stroke-width="2.4"/>`,
  grab: `<rect x="3" y="3" width="11" height="11" rx="2.5" fill="${B}"/><path d="M3 11l3.5-3.5 2.5 2.5 2.5-2.5L14 10" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 21c2.2-4.2 4.6-6 9-6.8" fill="none" ${KN} stroke-width="2.4"/><path d="M17.2 12l3 2.2-2 3.1" fill="none" ${K}/>`,
  sort: `<rect x="3" y="4" width="5.5" height="5.5" rx="1.6" fill="${Y}"/><rect x="3" y="12" width="5.5" height="5.5" rx="1.6" fill="${PK}"/><rect x="10.5" y="4" width="5.5" height="5.5" rx="1.6" fill="${Y}"/><rect x="10.5" y="12" width="5.5" height="5.5" rx="1.6" fill="${PK}"/><path d="M20 4v15.5M17.5 17l2.5 2.5 2.5-2.5" fill="none" ${K}/>`,
  open: `<path d="M14 4h6v6M20 4l-8.5 8.5" fill="none" stroke="${B}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 14v4.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 014 18.5v-11A1.5 1.5 0 015.5 6H10" fill="none" ${K}/>`,
  hand2: `<path d="M9 11V5.8a1.5 1.5 0 013 0V11m0-1.5V4.3a1.5 1.5 0 013 0V11m0-4.3a1.5 1.5 0 013 0v8.3a6 6 0 01-6 6h-.5a6 6 0 01-4.7-2.3L5 15.5a1.5 1.5 0 012.3-1.9L9 15.5" fill="none" stroke="${B}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  dashed: `<path d="M4.5 19.5L19.5 4.5" ${KN} stroke-width="2.6" stroke-dasharray="3.5 3.5"/>`,
  elbow: `<path d="M4 18h8V6h7" fill="none" ${KN} stroke-width="2.4"/><path d="M16 2.8L19.3 6 16 9.2" fill="none" ${KN} stroke-width="2.4"/>`,
  curve: `<path d="M4 19C4 8 20 16 20 5" fill="none" ${KN} stroke-width="2.4"/><path d="M16.6 7.5L20 4.6l2 3.8" fill="none" ${KN} stroke-width="2.2"/>`
};
})();

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
