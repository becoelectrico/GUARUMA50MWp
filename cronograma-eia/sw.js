// Service worker · Cronograma Licencia Ambiental (módulo de la Plataforma Guaruma)
// Sube VERSION cada vez que publiques cambios.
const VERSION = 'guaruma-eia-v1.4.0';
const SHELL = ['./', './index.html', './manifest.json', '../icons/logo.png', '../icons/icon-192.png', '../icons/icon-512.png'];
const CDN = ['https://cdn.jsdelivr.net/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('guaruma-eia-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/login\.microsoftonline\.com|graph\.microsoft\.com|sharepoint\.com|onedrive|office\.(com|net)/i.test(url.host)) return;
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = CDN.some((p) => req.url.startsWith(p));
  if (!sameOrigin && !isCdn) return;
  if (sameOrigin && (req.mode === 'navigate' || url.pathname.endsWith('/cronograma-eia/') || url.pathname.endsWith('/cronograma-eia/index.html'))) {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
