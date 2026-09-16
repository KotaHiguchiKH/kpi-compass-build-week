// 停止用: 旧AI Todoのキャッシュを消して自分自身を登録解除する
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll()).then((cs) => cs.forEach((c) => c.navigate(c.url)))
  );
});
