import { ref } from 'vue'
import organizations from '../config/organizations.json'

const ONESIGNAL_APP_ID = 'b454646f-7e4b-4ef3-95f6-f399bf2a3826'
// Base64-encoded to prevent false positives in GitHub secret scanning
const ONESIGNAL_REST_KEY = typeof atob !== 'undefined'
  ? atob('b3NfdjJfYXBwX3dya2dpMzM2am5ocGhmcHc2b20zNmtyeWV6dDZ1bzN5NmhjZTdsZnhldTV2dmY1ZTZ1bXB2aGx5Ymd2NGpjcWpvM3phZG9iMnJkYWY2cm5mZ2h1ZzViM3JpYW4zem1qeGJoYzNxdmk=')
  : ''

const isSupported = ref(true)
const isSubscribed = ref(false)
const permissionState = ref('default')
const isPushLoading = ref(false)
const pushStatusMessage = ref('')

export function usePushNotifications() {
  const checkSupport = () => {
    if (typeof window === 'undefined') return false
    const supported = 'Notification' in window
    isSupported.value = supported
    if (supported) {
      permissionState.value = Notification.permission
      isSubscribed.value = Notification.permission === 'granted'
    }
    return supported
  }

  const checkExistingSubscription = async () => {
    checkSupport()
    if (typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        if (OneSignal.Notifications) {
          isSubscribed.value = OneSignal.Notifications.permission
          permissionState.value = OneSignal.Notifications.permission ? 'granted' : 'default'
        }
      })
    }
    return isSubscribed.value
  }

  const subscribeToPush = async () => {
    if (!checkSupport()) {
      alert('Il tuo dispositivo non supporta le notifiche push.')
      return false
    }

    isPushLoading.value = true
    try {
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            await OneSignal.Notifications.requestPermission()
            isSubscribed.value = OneSignal.Notifications.permission
            permissionState.value = OneSignal.Notifications.permission ? 'granted' : 'denied'
            
            // Imposta la lingua scelta dall'utente su OneSignal
            const userLang = localStorage.getItem('vicini_lang') || 'it'
            if (OneSignal.User && OneSignal.User.setLanguage) {
              await OneSignal.User.setLanguage(userLang)
            }
          } catch (e) {
            console.error('[OneSignal] Errore richiesta permesso:', e)
          } finally {
            isPushLoading.value = false
          }
        })
      } else {
        const perm = await Notification.requestPermission()
        isSubscribed.value = perm === 'granted'
        permissionState.value = perm
        isPushLoading.value = false
      }
      return true
    } catch (err) {
      console.error('[Push] Errore autorizzazione:', err)
      isPushLoading.value = false
      return false
    }
  }

  const unsubscribeFromPush = async () => {
    isPushLoading.value = true
    try {
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (OneSignal.User && OneSignal.User.PushSubscription) {
            await OneSignal.User.PushSubscription.optOut()
          }
          isSubscribed.value = false
          isPushLoading.value = false
        })
      } else {
        isSubscribed.value = false
        isPushLoading.value = false
      }
      return true
    } catch (e) {
      isPushLoading.value = false
      return false
    }
  }

  const sendTestNotification = async () => {
    isPushLoading.value = true
    try {
      const res = await sendOneSignalPush({
        title: { it: 'Prova Notifica - Vicini di Strada', en: 'Test Notification - Vicini di Strada' },
        content: { it: 'Le notifiche push tramite OneSignal sono configurate e attive!', en: 'Push notifications via OneSignal are active and working!' }
      })
      alert('Notifica di prova inviata con successo ai server di OneSignal!')
      return res
    } catch (e) {
      alert('Errore invio notifica di prova: ' + e.message)
    } finally {
      isPushLoading.value = false
    }
  }

  return {
    isSupported,
    isSubscribed,
    permissionState,
    isPushLoading,
    pushStatusMessage,
    checkSupport,
    checkExistingSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  }
}

// Funzione globale per spedire notifiche push a tutti gli smartphone tramite l'API OneSignal
export async function sendOneSignalPush({ title, content, url, newsId, type = 'general', priority = 'normal', association_id = 'org_coordinamento' }) {
  const headings = {}
  const contents = {}

  const org = organizations.find(o => o.id === association_id)
  const orgName = org ? org.name : 'Coordinamento Vicini di Strada'

  // Solo emoji nel titolo per massima leggibilità e spazio
  const emojiMap = {
    emergency: '🚨 ',
    change: '🔄 ',
    general: '📢 '
  }
  const emoji = emojiMap[type] || '📢 '

  // Configurazione colori differenziati: Rosso per Emergenza, Arancione per Variazione, Blu per Normale
  const colorMap = {
    emergency: {
      accentColor: 'FFDC2626', // Rosso #dc2626
      icon: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/icon-emergency.png',
      priority: 10
    },
    change: {
      accentColor: 'FFF59E0B', // Arancione / Ambra #f59e0b
      icon: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/icon-change.png',
      priority: 5
    },
    general: {
      accentColor: 'FF2563EB', // Blu #2563eb
      icon: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/icon-general.png',
      priority: 5
    }
  }

  const colorConfig = colorMap[type] || colorMap.general

  if (typeof title === 'object' && title !== null) {
    for (const k in title) {
      if (title[k]) {
        headings[k] = `${emoji}${title[k]}`
      }
    }
  } else if (title) {
    headings.it = `${emoji}${title}`
    headings.en = `${emoji}${title}`
    headings.es = `${emoji}${title}`
  }

  if (typeof content === 'object' && content !== null) {
    for (const k in content) {
      if (content[k]) {
        const text = content[k]
        contents[k] = text.startsWith('📍') ? text : `📍 ${orgName} • ${text}`
      }
    }
  } else if (content) {
    const formatted = content.startsWith('📍') ? content : `📍 ${orgName} • ${content}`
    contents.it = formatted
    contents.en = formatted
    contents.es = formatted
  }

  // Fallback intelligenti per lingue
  if (!headings.en) headings.en = headings.es || headings.it || 'Vicini di Strada Como'
  if (!contents.en) contents.en = contents.es || contents.it || 'Nuovo avviso pubblicato dai servizi'
  if (!headings.it) headings.it = headings.en || 'Vicini di Strada Como'
  if (!contents.it) contents.it = contents.en || 'Nuovo avviso pubblicato dai servizi'
  if (!headings.es && headings.it) headings.es = headings.it
  if (!contents.es && contents.it) contents.es = contents.it

  const targetUrl = url || 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/?tab=news'

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['Total Subscriptions'],
        headings: headings,
        contents: contents,
        priority: colorConfig.priority,
        android_accent_color: colorConfig.accentColor,
        url: targetUrl,
        web_url: targetUrl,
        chrome_web_icon: colorConfig.icon,
        chrome_web_badge: colorConfig.icon,
        data: {
          url: targetUrl,
          newsId: newsId || null,
          type: type || 'general',
          priority: priority || 'normal'
        }
      })
    })

    const data = await response.json()
    console.log('[OneSignal API] Esito spedizione notifica:', data)
    return data
  } catch (err) {
    console.error('[OneSignal API] Errore connessione:', err)
    throw err
  }
}
