const BUILD = '{{BUILD_ID}}';
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `middle-school-study:static:${SCOPE.pathname}:`;
const CACHE = CACHE_PREFIX + BUILD;
const SHELL = new URL('{{SHELL_PATH}}', SCOPE).href;
const ACTIVATED = new URL('_study/activated-marker', SCOPE).href;
const PRECACHE = new Map(
  ({{PRECACHE}}).map(([path, digest]) => [new URL(path, SCOPE).href, digest])
);

async function verifiedAsset(url, expectedHash, signal) {
  const relativePath = new URL(url).pathname.slice(SCOPE.pathname.length);
  let response;
  try {
    response = await fetch(url, {
      cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal
    });
  } catch {
    throw new Error(`Unable to fetch ${relativePath}`);
  }
  if (!response.ok || response.url !== url) throw new Error(`Unable to fetch ${relativePath} (HTTP ${response.status})`);
  const bytes = await response.clone().arrayBuffer();
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const actual = Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== expectedHash) throw new Error(`Invalid release asset ${relativePath}`);
  return response;
}

async function installRelease() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    // Collect every validated response before writing a shell this worker can serve.
    const assets = await Promise.all(Array.from(PRECACHE, async ([url, digest]) => [
      url, await verifiedAsset(url, digest, controller.signal)
    ]));
    const cache = await caches.open(CACHE);
    await Promise.all(assets.map(([url, response]) => cache.put(url, response)));
  } catch (error) {
    controller.abort();
    await caches.delete(CACHE);
    const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const page of pages.filter((client) => isAppPage(new URL(client.url)))) {
      page.postMessage({ type: 'STUDY_INSTALL_ERROR', build: BUILD, reason: error.message });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(installRelease());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await (await caches.open(CACHE)).put(ACTIVATED, new Response(BUILD));
    const oldCaches = (await caches.keys()).filter((name) =>
      name !== CACHE && name.startsWith(CACHE_PREFIX) && /^[a-f0-9]{20}$/.test(name.slice(CACHE_PREFIX.length))
    );
    await Promise.all(oldCaches.map(async (name) => {
      const cache = await caches.open(name);
      // Another version may be installing in parallel. Only retire a previously active cache.
      if (await cache.match(ACTIVATED)) await caches.delete(name);
    }));
    await self.clients.claim();
  })());
});

function isAppPage(url) {
  return url.origin === SCOPE.origin &&
    (url.pathname === SCOPE.pathname || url.pathname === SCOPE.pathname + 'index.html');
}

self.addEventListener('message', (event) => {
  const sender = event.source;
  if (sender?.type !== 'window' || !isAppPage(new URL(sender.url))) return;
  if (event.data?.type === 'STUDY_BUILD') {
    event.ports[0]?.postMessage({ build: BUILD });
  }
  if (event.data?.type === 'STUDY_APPLY' && event.data.build === BUILD) {
    event.waitUntil(self.skipWaiting());
  }
});

async function navigate(request) {
  // Let Sites check access on every navigation, even when we have a cached shell.
  const response = await fetch(request, { cache: 'no-store' });
  if (!response.ok || response.redirected || !response.headers.get('Content-Type')?.includes('text/html')) return response;
  const html = await response.clone().text();
  const serverBuild = html.match(/<meta name="study-build" content="([a-f0-9]{20})">/)?.[1];
  if (!serverBuild || serverBuild === BUILD) return response;
  const cache = await caches.open(CACHE);
  const shell = await cache.match(SHELL);
  if (!shell) return response;
  const headers = new Headers(response.headers);
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
  headers.set('Cache-Control', 'no-store');
  return new Response(shell.body, { headers });
}

async function serveStatic(request) {
  const cache = await caches.open(CACHE);
  return (await cache.match(request.url)) ?? fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('Range')) return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || url.search) return;

  if (request.mode === 'navigate') {
    if (isAppPage(url)) event.respondWith(navigate(request));
    return;
  }

  if (url.href !== SHELL && PRECACHE.has(url.href)) {
    event.respondWith(serveStatic(request));
  }
});
