/* eslint-disable */
/**
 * AIPanel Service Worker.
 *
 * Strategy summary:
 *  - HTML            : stale-while-revalidate (cached HTML for instant boot, background updates)
 *  - Hashed assets   : cache-first, immutable
 *  - Public statics  : cache-first (favicon.svg, logo)
 *  - Google Fonts    : SWR for CSS, cache-first for font files
 *  - /api/bookmarks  : stale-while-revalidate (offline fallback + instant boot)
 *  - Other /api/*    : network-only (auth, mutations, fetch-meta)
 *  - External favicons: cache-first with 7-day TTL
 *
 * Versioning: bump CACHE_VERSION to invalidate everything (e.g. when the
 * caching strategy itself changes). Hashed asset filenames already invalidate
 * themselves, so day-to-day deploys do not require a bump.
 */

const CACHE_VERSION = 'v3';
const CACHE = {
  html: `aipanel-html-${CACHE_VERSION}`,
  static: `aipanel-static-${CACHE_VERSION}`,
  fonts: `aipanel-fonts-${CACHE_VERSION}`,
  api: `aipanel-api-${CACHE_VERSION}`,
  favicons: `aipanel-favicons-${CACHE_VERSION}`
};

const ALL_CACHE_NAMES = Object.values(CACHE);
const FAVICON_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// -----------------------------
// install / activate
// -----------------------------

self.addEventListener('install', (event) => {
  // Activate the new SW immediately on next page load.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop any cache that doesn't match the current version.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('aipanel-') && !ALL_CACHE_NAMES.includes(key))
          .map((key) => caches.delete(key))
      );
      // Take control of already-open tabs.
      await self.clients.claim();
    })()
  );
});

// Allow the page to force-update.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// -----------------------------
// helpers
// -----------------------------

function isSameOrigin(url) {
  return new URL(url, self.location.href).origin === self.location.origin;
}

function isHashedAsset(pathname) {
  // Vite emits /assets/<name>-<hash>.<ext>
  return /^\/assets\/.+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|webp|gif)$/.test(pathname);
}

function isHtmlRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isApiBookmarksRead(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  return url.pathname === '/api/bookmarks';
}

function isOtherApi(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isGoogleFontCss(url) {
  return url.hostname === 'fonts.googleapis.com';
}

function isGoogleFontFile(url) {
  return url.hostname === 'fonts.gstatic.com';
}

function isFaviconRequest(request) {
  // Cross-origin GET for a small image. The app fetches `<origin>/favicon.ico`
  // for each bookmark, and those add up fast.
  if (request.method !== 'GET') return false;
  if (request.destination !== 'image') return false;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) return false;
  // Heuristic: favicons. We also catch generic image GETs to other origins
  // (the app doesn't serve other images), so this is broad on purpose.
  return true;
}

// -----------------------------
// strategies
// -----------------------------

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      // Only cache successful responses. Critically, do NOT cache 401 / 5xx —
      // we don't want an auth failure to poison the next stale-read.
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  // If we have a cached copy, serve it and let the network update in the
  // background. Otherwise wait for the network.
  if (cached) {
    network.catch(() => {});
    return cached;
  }
  const fresh = await network;
  return fresh || cached || Response.error();
}

async function networkFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function networkOnlyAndUpdate(cacheName, request) {
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    const cacheKey = new Request(request.url, {
      method: 'GET',
      headers: request.headers,
      credentials: request.credentials,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy
    });
    cache.put(cacheKey, response.clone()).catch(() => {});
  }
  return response;
}

async function cacheFirstWithTtl(cacheName, request, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get('x-sw-cached-at');
    const cachedAt = dateHeader ? Number(dateHeader) : 0;
    // Opaque responses have no readable headers, so x-sw-cached-at will be
    // missing. In that case we trust the cache (cross-origin favicons rarely
    // change) and return it.
    if (!cachedAt || Date.now() - cachedAt < ttlMs) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (!response) return response;

    // Opaque responses (status=0) cannot be reconstructed with `new Response`
    // because the Response constructor rejects status 0. Cache them as-is.
    if (response.type === 'opaque') {
      cache.put(request, response.clone()).catch(() => {});
      return response;
    }

    if (response.ok) {
      // Stamp the response so we can enforce a TTL on next visit.
      const headers = new Headers(response.headers);
      headers.set('x-sw-cached-at', String(Date.now()));
      const body = await response.clone().blob();
      const wrapped = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      cache.put(request, wrapped).catch(() => {});
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

// -----------------------------
// router
// -----------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never touch non-GET (mutations should always hit the network).
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML / SPA navigation
  if (isHtmlRequest(request) && isSameOrigin(request.url)) {
    event.respondWith(staleWhileRevalidate(CACHE.html, request));
    return;
  }

  // Hashed Vite assets — content-addressed, safe to cache forever
  if (isSameOrigin(request.url) && isHashedAsset(url.pathname)) {
    event.respondWith(cacheFirst(CACHE.static, request));
    return;
  }

  // Public statics (app icons, manifest, logo)
  if (
    isSameOrigin(request.url) &&
    /^(\/site\.webmanifest|\/apple-touch-icon\.png|\/favicon(?:\.svg|-16\.png|-32\.png)|\/aipanel-logo\.svg|\/icons\/icon-(?:192|512|1024)\.png)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(CACHE.static, request));
    return;
  }

  // Google Fonts
  if (isGoogleFontCss(url)) {
    event.respondWith(staleWhileRevalidate(CACHE.fonts, request));
    return;
  }
  if (isGoogleFontFile(url)) {
    event.respondWith(cacheFirst(CACHE.fonts, request));
    return;
  }

  // Bookmarks read — the core SWR path that makes offline / second-visit fast
  if (isApiBookmarksRead(request)) {
    // Mutations re-fetch with cache: 'no-store' so the UI receives the canonical
    // post-write snapshot instead of the stale SWR copy. Also refresh the SW cache
    // with that canonical response for subsequent boots.
    if (request.cache === 'no-store' || request.cache === 'reload') {
      event.respondWith(networkOnlyAndUpdate(CACHE.api, request));
      return;
    }
    event.respondWith(staleWhileRevalidate(CACHE.api, request));
    return;
  }

  // Everything else under /api/ goes straight to the network (auth, mutations, fetch-meta).
  if (isOtherApi(request)) return;

  // Cross-origin favicons / images
  if (isFaviconRequest(request)) {
    event.respondWith(cacheFirstWithTtl(CACHE.favicons, request, FAVICON_TTL_MS));
    return;
  }

  // Everything else: default browser behaviour (no SW interception).
});
