// Service Worker básico para PWA
const CACHE_NAME = 'uati-nexus-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
];

// URLs que devem ser ignoradas pelo service worker (dev server do Vite)
const IGNORE_PATTERNS = [
  /^https?:\/\/localhost/,
  /^https?:\/\/127\.0\.0\.1/,
  /^https?:\/\/\[::1\]/,
  /\/@vite\/client/,
  /\/@react-refresh/,
  /\/@id\//,
  /\/@fs\//,
  /\/@vite\/dist/,
  /\.hot-update\./,
  /socket\.io/,
  /\/src\//,  // Ignorar arquivos do src durante desenvolvimento
  /\/node_modules\//,
  /vite\.svg/,
  /\.tsx?$/,
  /\.jsx?$/,
];

function shouldIgnoreRequest(url) {
  // Em desenvolvimento, ignorar todas as requisições que não sejam da API
  const isDevServer = IGNORE_PATTERNS.some(pattern => pattern.test(url));
  
  // Também ignorar se a URL contém porta comum de desenvolvimento (3000-9999)
  const hasDevPort = /:\d{4,5}\//.test(url) && !url.includes('/api/');
  
  return isDevServer || hasDevPort;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Service Worker: Failed to cache some resources:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignorar requisições do dev server do Vite - não interceptar essas requisições
  if (shouldIgnoreRequest(url)) {
    // Não chamar event.respondWith() permite que o navegador trate a requisição normalmente
    return;
  }

  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Apenas interceptar requisições em produção
  try {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(event.request)
            .then((response) => {
              // Não cachear respostas que não são válidas
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clonar a resposta para cachear
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache).catch((err) => {
                    console.warn('Service Worker: Failed to cache:', err);
                  });
                })
                .catch((err) => {
                  console.warn('Service Worker: Failed to open cache:', err);
                });

              return response;
            })
            .catch((error) => {
              console.warn('Service Worker: Fetch failed:', error);
              // Se falhar, deixar o navegador tratar normalmente
              // Não tentar fetch novamente para evitar loops
              throw error;
            });
        })
        .catch((error) => {
          console.warn('Service Worker: Cache match failed:', error);
          // Se tudo falhar, tentar fetch direto sem cache
          return fetch(event.request).catch((fetchError) => {
            console.error('Service Worker: All fetch attempts failed:', fetchError);
            // Retornar uma resposta de erro básica
            return new Response('Network error', { 
              status: 408,
              statusText: 'Request Timeout'
            });
          });
        })
    );
  } catch (error) {
    // Se houver erro ao configurar o respondWith, não fazer nada
    // O navegador tratará a requisição normalmente
    console.warn('Service Worker: Error setting up fetch handler:', error);
  }
});



