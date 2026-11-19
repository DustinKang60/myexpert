// My Expert — service worker
// 에셋을 고치면 CACHE 버전을 반드시 올린다. 안 올리면 기기가 옛 코드를 계속 쓴다.
var CACHE = 'myexpert-v8';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).catch(function () {}));
});

// 주의: dustinkang60.github.io 의 앱들은 저장 공간(Cache Storage)을 함께 쓴다.
// 자기 이름으로 시작하는 캐시만 지워야 한다 — 전부 지우면 다른 앱의 오프라인 저장분이 날아가
// 그 앱이 해외·오프라인에서 아예 안 열린다.
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('myexpert-') === 0 && k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  // Claude API는 절대 캐시하지 않는다.
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
