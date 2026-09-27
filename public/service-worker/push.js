console.debug("[SW-LOADED]: push.js")

// Listen to the backend push event
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const { title, body, icon, ...rest } = data;
  
      event.waitUntil(
        self.registration.showNotification(title, {
          body: body,
          icon: icon || '/icon-192.png',
          ...rest,
        })
      );
    } catch {
      event.waitUntil(
        self.registration.showNotification("Tesh Push", {
          body: String(event.data.text()),
          icon: '/icon-192.png',
        })
      );

    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Open the app or a specific URL
  event.waitUntil(
    clients.openWindow(self.location.origin)
  );
});
