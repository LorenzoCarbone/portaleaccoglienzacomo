// sw-push.js - Web Push Notification handler per Vicini di Strada Como
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Vicini di Strada Como',
    body: 'Nuova comunicazione importante dai servizi di Como.',
    url: '/portaleaccoglienzacomo/?tab=news'
  }

  if (event.data) {
    try {
      const json = event.data.json()
      payload = { ...payload, ...json }
    } catch (e) {
      payload.body = event.data.text()
    }
  }

  const title = payload.title || 'Vicini di Strada Como'
  const options = {
    body: payload.body || 'Nuovo avviso pubblicato dai servizi',
    icon: '/portaleaccoglienzacomo/pwa-192x192.png',
    badge: '/portaleaccoglienzacomo/pwa-192x192.png',
    vibrate: [150, 80, 150],
    tag: payload.tag || 'vds-news-alert',
    renotify: true,
    data: {
      url: payload.url || '/portaleaccoglienzacomo/?tab=news',
      newsId: payload.newsId || null
    },
    actions: [
      { action: 'open', title: 'Leggi Notizia' },
      { action: 'dismiss', title: 'Chiudi' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/portaleaccoglienzacomo/?tab=news'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta dell'app, portala in primo piano
      for (const client of clientList) {
        if (client.url.includes('/portaleaccoglienzacomo/') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl)
          }
          return client.focus()
        }
      }
      // Altrimenti apri una nuova finestra
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
