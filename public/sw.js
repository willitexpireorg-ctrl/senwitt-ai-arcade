const CACHE_NAME = 'senwitt-v4';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

/** In-memory reminder prefs (SW may be killed; page is source of truth). */
let reminderPrefs = { time: null, enabled: false, lastNotifyDay: null };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'SENWITT', body: event.data ? event.data.text() : undefined };
  }

  const title = typeof payload.title === 'string' ? payload.title : "Today's set is ready";
  const options = {
    body: typeof payload.body === 'string' ? payload.body : 'A few minutes keeps your thinking sharp.',
    icon: '/favicon.svg',
    tag: 'senwitt-push',
    data: { url: typeof payload.url === 'string' ? payload.url : '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SCHEDULE_DAILY_REMINDER') {
    reminderPrefs = {
      time: typeof data.time === 'string' ? data.time : null,
      enabled: Boolean(data.enabled),
      lastNotifyDay: reminderPrefs.lastNotifyDay,
    };
    return;
  }

  if (data.type === 'REMINDER_ACK') {
    const day = typeof data.day === 'string' ? data.day : null;
    if (day) reminderPrefs.lastNotifyDay = day;
    return;
  }

  if (data.type === 'SHOW_REMINDER') {
    const day = typeof data.day === 'string' ? data.day : null;
    // Timestamp / day tagging — skip if we already showed for this day from SW.
    if (day && reminderPrefs.lastNotifyDay === day) return;
    if (day) reminderPrefs.lastNotifyDay = day;

    const title = typeof data.title === 'string' ? data.title : "Today's set is ready";
    const options = data.options && typeof data.options === 'object'
      ? data.options
      : {
          body: 'A few minutes keeps your thinking sharp.',
          tag: day ? `senwitt-daily-${day}` : 'senwitt-daily',
          data: { url: '/' },
        };

    // Fallback when the page could not call registration.showNotification itself.
    event.waitUntil(
      self.registration.showNotification(title, options).catch(() => undefined),
    );
  }
});
