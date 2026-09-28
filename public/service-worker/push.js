console.debug("[SW-LOADED]: push-notification")

// Listen to the backend push event
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const { title, body, icon, data:payload, ...rest } = data;
      console.debug("received push", title, body)
      if (payload?.ringtone){
        playRingtone(payload.ringtone)
        console.debug("received ringtone", payload.ringtone)
      }
      event.waitUntil(
        self.registration.showNotification(title, {
          body: body,
          icon: icon || '/icon-192.png',
          ...rest,
        })
      );
    } catch {
      try {
        // for testing purposes only
        const body = String(event.data.text())
        event.waitUntil(
          self.registration.showNotification("Test Push", {
            body,
            icon: '/icon-192.png',
          })
        );
      } catch (error) {
        console.log(error)
      }
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const audio = window._CURRENT_AUDIO
  if (audio){
    audio.pause()
    audio.remove()
    window._CURRENT_AUDIO = null
  }
  // Open the app or a specific URL
  event.waitUntil(
    clients.openWindow(self.location.origin)
  );
});

function isSoundEnabled() {
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}


async function playRingtone(ring) {
  try {
    if (!isSoundEnabled()) return;
    const ringtone = ring || window._DEFAULT_RINGTONE
    const audio = new Audio(ringtone.dataUrl);
    window._CURRENT_AUDIO = audio
    await audio.play()
  } catch (error) {
    console.error(error)
  }
}