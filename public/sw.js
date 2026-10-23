const CACHE_NAME = 'vservicerdc-v2';
const PUBLIC_API_CACHE = 'vservicerdc-public-api-v1';
const MAX_RUNTIME_ENTRIES = 100;
const ACTION_DB = 'vservice-offline-actions';
const ACTION_STORE = 'actions';

function openActionDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ACTION_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(ACTION_STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addAction(action) {
  const db = await openActionDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ACTION_STORE, 'readwrite');
    tx.objectStore(ACTION_STORE).put(action);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getActions() {
  const db = await openActionDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(ACTION_STORE).objectStore(ACTION_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function removeAction(id) {
  const db = await openActionDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ACTION_STORE, 'readwrite');
    tx.objectStore(ACTION_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function syncActions() {
  const actions = await getActions();
  for (const action of actions) {
    try {
      const response = await fetch(action.endpoint, { method: action.method, headers: action.headers, body: JSON.stringify(action.body) });
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) await removeAction(action.id);
    } catch { /* Réessai au prochain événement sync. */ }
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'vservice-sync') event.waitUntil(syncActions());
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['/offline.html', '/manifest.json', '/logo.svg']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => ![CACHE_NAME, PUBLIC_API_CACHE].includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    const url = new URL(request.url);
    const queueable = url.origin === self.location.origin && ['/api/marketplace', '/api/reviews', '/api/auth/me/profile', '/api/realisations'].includes(url.pathname);
    if (!queueable) return;
    event.respondWith((async () => {
      try {
        const response = await fetch(request.clone());
        return response;
      } catch {
        const body = await request.clone().json().catch(() => ({}));
        const headers = {};
        request.headers.forEach((value, key) => { headers[key] = value; });
        await addAction({ id: body.idempotencyKey || `${Date.now()}-${Math.random()}`, endpoint: url.pathname + url.search, method: request.method, headers, body, state: 'pending', createdAt: new Date().toISOString() });
        try { await self.registration.sync.register('vservice-sync'); } catch { /* fallback on next launch */ }
        return new Response(JSON.stringify({ queued: true, message: 'Action enregistrée hors connexion.' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    const isProviderSearch = url.pathname === '/api/providers' && !url.searchParams.has('userId');
    const isPublicProfile = url.pathname.startsWith('/api/public/') && url.pathname !== '/api/public/me';
    if (
      !isProviderSearch
      && !isPublicProfile
    ) return;

    event.respondWith(
      caches.open(PUBLIC_API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const refresh = fetch(request).then(async (response) => {
          if (response.ok) {
            await cache.put(request, response.clone());
            const entries = await cache.keys();
            if (entries.length > MAX_RUNTIME_ENTRIES) {
              await cache.delete(entries[0]);
            }
          }
          return response;
        });

        if (cached) {
          event.waitUntil(refresh.catch(() => undefined));
          return cached;
        }

        try {
          return await refresh;
        } catch {
          return new Response(JSON.stringify({ error: 'Données indisponibles hors ligne' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
        }
      })
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const isNavigation = request.mode === 'navigate';

      if (isNavigation) {
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch {
          return cached || cache.match('/offline.html');
        }
      }

      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
          const entries = await cache.keys();
          if (entries.length > MAX_RUNTIME_ENTRIES) {
            await cache.delete(entries[0]);
          }
        }
        return response;
      } catch {
        return new Response('', { status: 503, statusText: 'Hors ligne' });
      }
    })()
  );
});
