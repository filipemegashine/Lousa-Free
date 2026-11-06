/* Lousa Livre: permite usar offline e instalar no celular (requer https ou localhost).
   Estratégia "rede primeiro": sempre busca a versão mais nova e usa o cache só sem conexão. */
const CACHE = 'lousa-v5';
const SHELL = ['./', 'index.html', 'css/style.css', 'css/theme.css', 'css/pages.css', 'js/util.js', 'js/fx.js', 'js/store.js', 'js/ink.js', 'js/render.js', 'js/app.js', 'js/compat.js', 'js/ui.js', 'js/visuals.js', 'js/questions.js', 'js/enem.js', 'js/home.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith(
    fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
