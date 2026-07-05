import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      return listFiles(path.join(directory, entry.name), relativePath);
    }
    return relativePath;
  }));

  return files.flat();
}

const precacheFiles = (await listFiles(distDirectory))
  .filter((file) => file !== 'sw.js' && !file.startsWith('.'))
  .sort();

const cacheHash = createHash('sha256');
for (const file of precacheFiles) {
  cacheHash.update(file);
  cacheHash.update(await readFile(path.join(distDirectory, file)));
}

const cacheName = `froggy-urban-splash-${cacheHash.digest('hex').slice(0, 12)}`;
const precacheUrls = precacheFiles.map((file) => `./${file}`);

const serviceWorker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const APP_SHELL_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(
        PRECACHE_URLS.map((url) => new URL(url, self.registration.scope).href),
      ))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name.startsWith('froggy-urban-splash-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok && networkResponse.type === 'basic') {
        const runtimeCache = await caches.open(CACHE_NAME);
        await runtimeCache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      if (request.mode === 'navigate') {
        const appShell = await caches.match(APP_SHELL_URL);
        if (appShell) {
          return appShell;
        }
      }
      throw error;
    }
  })());
});
`;

await writeFile(path.join(distDirectory, 'sw.js'), serviceWorker);

console.log(`Generated ${cacheName} with ${precacheFiles.length} offline assets.`);
