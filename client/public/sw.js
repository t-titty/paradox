/* PARADOX service worker — minimal, push-only.
 *
 * Responsibilities:
 *   - On push event: parse the payload and show a notification.
 *   - On notification click: focus an existing paradox tab or open one.
 *
 * No offline / asset caching yet. Kept intentionally small so updates
 * propagate quickly — bump VERSION if you ever add cached assets.
 */

const VERSION = "1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "PARADOX";
  const body = payload.body || "";
  const url = payload.url || "/";

  const options = {
    body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: "paradox-phase",
    renotify: true,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // If a PARADOX tab is already open, focus it and navigate.
      for (const client of all) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin) {
            await client.focus();
            if (client.url !== self.location.origin + target) {
              await client.navigate(target).catch(() => {});
            }
            return;
          }
        } catch {
          /* bad URL, skip */
        }
      }
      // No open tab — open a new one.
      await self.clients.openWindow(target);
    })(),
  );
});

// Version exported for debugging; unused at runtime.
self.PARADOX_SW_VERSION = VERSION;
