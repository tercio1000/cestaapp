// Cesta App — Service Worker
// Versão 1.0.0

const CACHE_NOME = 'cesta-app-v1';
const ARQUIVOS_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/img/favicon.svg',
  '/img/logo.svg',
  '/img/logo-horizontal.svg',
  '/img/pwa/icon-192.png',
  '/img/pwa/icon-512.png',
  '/img/pwa/apple-touch-icon.png'
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NOME).then((cache) => {
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NOME)
          .map((nome) => caches.delete(nome))
      );
    })
  );
  self.clients.claim();
});

// Estratégia de fetch: cache primeiro, rede depois
self.addEventListener('fetch', (event) => {
  // Só processa requisições GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((resposta) => {
      // Se tem no cache, retorna
      if (resposta) return resposta;

      // Senão, busca da rede e salva no cache
      return fetch(event.request).then((respostaRede) => {
        // Só faz cache de respostas válidas
        if (!respostaRede || respostaRede.status !== 200) {
          return respostaRede;
        }

        const respostaClone = respostaRede.clone();
        caches.open(CACHE_NOME).then((cache) => {
          cache.put(event.request, respostaClone);
        });

        return respostaRede;
      }).catch(() => {
        // Se falhar (offline), retorna o index pra SPA
        return caches.match('/index.html');
      });
    })
  );
});
