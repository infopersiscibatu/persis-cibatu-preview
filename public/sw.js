/* Service worker: menerima push dan menampilkan notifikasi di layar HP. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (peristiwa) => peristiwa.waitUntil(self.clients.claim()));

self.addEventListener("push", (peristiwa) => {
  let data = {};
  try {
    data = peristiwa.data ? peristiwa.data.json() : {};
  } catch {
    data = { title: "PC PERSIS Cibatu", body: peristiwa.data ? peristiwa.data.text() : "" };
  }

  const judul = data.title || "PC PERSIS Cibatu";
  const opsi = {
    body: data.body || "",
    icon: data.ikon || "/logo-persis.png",
    badge: "/favicon.png",
    tag: data.tag || "persis-cibatu",
    lang: "id",
    /* Tampilan banner sistem ditentukan peramban dan pengaturan perangkat. */
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: data.url || "/" },
  };

  peristiwa.waitUntil(Promise.all([
    self.registration.showNotification(judul, opsi),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((daftar) => {
      for (const klien of daftar) {
        if (klien.visibilityState === "visible" && new URL(klien.url).origin === self.location.origin) {
          klien.postMessage({ type: "PERSIS_PUSH", payload: { title: judul, body: opsi.body, url: opsi.data.url } });
        }
      }
    }),
  ]));
});

self.addEventListener("notificationclick", (peristiwa) => {
  peristiwa.notification.close();
  const tujuan = (peristiwa.notification.data && peristiwa.notification.data.url) || "/";
  const alamat = new URL(tujuan, self.location.origin).href;

  peristiwa.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((daftar) => {
      for (const klien of daftar) {
        if (klien.url.startsWith(self.location.origin)) {
          klien.navigate(alamat);
          return klien.focus();
        }
      }
      return self.clients.openWindow(alamat);
    }),
  );
});
