/**
 * Service Worker registration.
 *
 * We register only in production so the dev server keeps serving fresh code
 * without cache headaches. The SW lives at /sw.js (root scope) and is shipped
 * via the public/ folder unchanged.
 *
 * Update strategy:
 *  - The SW calls skipWaiting() on install + clients.claim() on activate, so
 *    a new version takes over as soon as the user reloads. No "shift-refresh
 *    twice" required.
 *  - Hashed asset filenames mean we almost never need to bust the static
 *    cache; bumping CACHE_VERSION in sw.js only matters when the caching
 *    strategy itself changes.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  // Defer to load + idle so the SW spin-up never competes with first paint.
  const schedule = () => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    const run = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // ignore registration errors (private mode, file:// preview, etc.)
        });
    };
    if (typeof ric === 'function') {
      ric(run, { timeout: 3000 });
    } else {
      setTimeout(run, 0);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}
