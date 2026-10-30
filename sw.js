// Service worker · Plataforma Guaruma 50 MW
// Sube VERSION cada vez que publiques cambios para que los equipos tomen la versión nueva.
const VERSION = 'guaruma-v1.11.0';
const SHELL = ['./', './index.html', './manifest.json', './icons/logo.png', './icons/icon-192.png', './icons/icon-512.png'];
const CDN = ['https://cdn.jsdelivr.net/', 'https://cdnjs.cloudflare.com/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Nunca cachear inicio de sesión ni Graph (datos y documentos siempre en vivo)
  if (/login\.microsoftonline\.com|graph\.microsoft\.com|sharepoint\.com|onedrive|office\.(com|net)/i.test(url.host)) return;
  const sameOrigin = url.origin === self.location.origin;
  // Los módulos en subcarpetas (p. ej. cronograma-eia/) tienen su propio service worker
  if (sameOrigin && (url.pathname.includes('/cronograma-eia/') || url.pathname.includes('/ruta-regulatoria/'))) return;
  const isCdn = CDN.some((p) => req.url.startsWith(p));
  if (!sameOrigin && !isCdn) return;
  if (sameOrigin && (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html'))) {
    // Página: primero la red (para tomar la versión nueva), si no hay red, la copia guardada
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Recursos: copia guardada y se actualiza en segundo plano
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
