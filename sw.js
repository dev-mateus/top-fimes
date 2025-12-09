/**
 * Service Worker para cache de assets estáticos e últimos resultados
 * Melhora Performance, Offline support e Best Practices
 */

const CACHE_NAME = 'top-fimes-v1';
const ASSETS_TO_CACHE = [
  '.',
  'index.html',
  'styles/styles.css',
  'scripts/main.js',
  'scripts/config.js',
  'scripts/api.js',
  'scripts/ui.js',
  'scripts/modal.js',
  'scripts/utils.js',
  'assets/placeholder.svg'
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened', CACHE_NAME);
        return cache.addAll(ASSETS_TO_CACHE)
          .catch((err) => {
            console.warn('Service Worker: Erro ao cachear assets:', err);
            // Continua mesmo se alguns assets falharem
            return Promise.all(
              ASSETS_TO_CACHE.map(url =>
                cache.add(url).catch(() => {
                  console.warn(`Failed to cache: ${url}`);
                })
              )
            );
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora requisições de API do OMDb (deixa sempre fetch para dados frescos)
  if (url.origin === 'https://www.omdbapi.com') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone a resposta antes de cacheá-la
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Tenta cache se fetch falhar
          return caches.match(request);
        })
    );
    return;
  }

  // Para assets estáticos: cache first, então network
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone e cache
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // Fallback para placeholder se imagem falhar
              if (url.pathname.match(/\.(svg|png|jpg|jpeg|webp)$/)) {
                return caches.match('assets/placeholder.svg');
              }
              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
    return;
  }

  // Para HTML: network first, então cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => {
              return response || new Response(
                '<!DOCTYPE html><html><body><h1>Offline</h1><p>Não há conexão e página não está em cache.</p></body></html>',
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
        })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Message event para atualização manual
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        console.log('Service Worker: Cache limpo');
      });
  }
});
