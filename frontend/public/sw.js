self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'Thông báo mới',
      body: event.data?.text() || '',
    };
  }

  const title = data.title || 'Thông báo mới';

  const options = {
    body: data.body || 'Bạn có một thông báo mới.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  // Chỉ điều hướng đến đường dẫn nội bộ của ứng dụng
  const safeUrl = new URL(targetUrl, self.location.origin);

  if (safeUrl.origin !== self.location.origin) {
    return;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.navigate(safeUrl.href).then(() => client.focus());
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(safeUrl.href);
      }
    })
  );
});