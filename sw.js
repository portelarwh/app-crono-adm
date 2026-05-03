'use strict';

const CACHE_NAME = 'crono-adm-lean-office-v5.2.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './operator-whatsapp-share-fix.js',
  './operator-pwa-update.js',
  './admin-events.js',
  './admin-events-click-fix.js',
  './flow-efficiency.js',
  './handoffs.js',
  './handoffs-calculation-fix.js',
  './admin-pareto.js',
  './executive-summary.js',
  './executive-pdf.js',
  './current-vs-ideal.js',
  './timer-top-layout.js',
  './handoffs-render-fix.js',
  './reset-cleanup.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function shouldUseNetworkFirst(request){
  if(request.mode === 'navigate') return true;
  const url = new URL(request.url);
  return /\.(html|js|css|json)$/i.test(url.pathname) || url.pathname.endsWith('/');
}

async function networkFirst(request){
  const cache = await caches.open(CACHE_NAME);
  try{
    const fresh = await fetch(request, { cache: 'no-store' });
    if(fresh && fresh.ok){
      cache.put(request, fresh.clone());
    }
    return fresh;
  }catch(error){
    const cached = await caches.match(request);
    if(cached) return cached;
    throw error;
  }
}

async function cacheFirst(request){
  const cached = await caches.match(request);
  if(cached) return cached;
  const response = await fetch(request);
  if(response && response.ok){
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    shouldUseNetworkFirst(event.request)
      ? networkFirst(event.request)
      : cacheFirst(event.request)
  );
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if(event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});
