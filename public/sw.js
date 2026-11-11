// Offline reading for the public site. Hand-written (no Workbox) because the policy is three rules:
// 1. Public pages: network first, the last copy when offline, else /offline.
// 2. Build assets and fonts: cache first (their URLs are content-hashed or versioned).
// 3. Everything else, and anything private (/me, /login, /api), is never touched.
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
// The offline page and its scripts, kept apart so trimming never breaks it. Refreshed when VERSION changes.
const SHELL = `shell-${VERSION}`;
const OFFLINE = "/offline";
// shortcut: oldest-first trimming by insertion order, not by last use; good enough for a reading cache.
const MAX_PAGES = 60;
const MAX_ASSETS = 200;

const PRIVATE = /^\/(me|login|api)(\/|$)/;

// The offline page and the scripts it needs: without them it would not hydrate, and the list of
// saved pages it builds on the device would never appear.
async function precache() {
  const response = await fetch(OFFLINE);
  const html = await response.clone().text();
  const shell = await caches.open(SHELL);
  await shell.put(OFFLINE, response);
  await shell.addAll(Array.from(new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [])));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS, SHELL].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function page(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
      void trim(PAGES, MAX_PAGES);
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreVary: true })) ?? (await caches.match(OFFLINE)) ?? Response.error();
  }
}

async function asset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS);
    await cache.put(request, response.clone());
    void trim(ASSETS, MAX_ASSETS);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && PRIVATE.test(url.pathname)) return;
  if (request.mode === "navigate" && sameOrigin) {
    event.respondWith(page(request));
  } else if (
    (sameOrigin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/"))) ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com"
  ) {
    event.respondWith(asset(request));
  }
});
