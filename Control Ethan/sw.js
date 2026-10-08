/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Service Worker PWA para Caché Offline y Alta Velocidad en iOS
 */

const CACHE_NAME = 'control-ethan-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/auth.js',
  './js/bcv.js',
  './js/sheets.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Las llamadas a Google Apps Script y APIs externas no se interceptan por caché estático
  if (event.request.url.includes('script.google.com') || event.request.url.includes('dolarapi.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retornar de caché y actualizar en fondo
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
