// sw-push.js - Integrazione OneSignal SDK e gestione click notifiche
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // URL canonico di atterraggio sulla bacheca avvisi
  let targetUrl = 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/?tab=news';

  if (event.notification.data && event.notification.data.url) {
    const rawUrl = event.notification.data.url;
    if (rawUrl.startsWith('http')) {
      targetUrl = rawUrl;
    } else if (rawUrl.startsWith('/')) {
      targetUrl = 'https://lorenzocarbone.github.io' + rawUrl;
    } else {
      targetUrl = 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/' + rawUrl;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta del portale, portala in primo piano e naviga sulla bacheca
      for (const client of clientList) {
        if (client.url && client.url.includes('/portaleaccoglienzacomo/') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Altrimenti apri la pagina
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
