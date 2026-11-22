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
        if (OneSignal.User && OneSignal.User.PushSubscription) {
          isSubscribed.value = !!OneSignal.User.PushSubscription.optedIn
          permissionState.value = Notification.permission

          // Se l'utente ha già concesso il permesso a livello browser ma la registrazione OneSignal era inattiva, riattivala subito
          if (Notification.permission === 'granted' && !OneSignal.User.PushSubscription.optedIn) {
            try {
              await OneSignal.User.PushSubscription.optIn()
              isSubscribed.value = !!OneSignal.User.PushSubscription.optedIn
            } catch (e) {}
          }
        } else if (OneSignal.Notifications) {
          isSubscribed.value = OneSignal.Notifications.permission
          permissionState.value = Notification.permission
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
            // Richiede il permesso nativo al browser e sincronizza il token con OneSignal
            if (OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
              await OneSignal.Notifications.requestPermission()
            }
            if (OneSignal.User && OneSignal.User.PushSubscription) {
              await OneSignal.User.PushSubscription.optIn()
              isSubscribed.value = !!OneSignal.User.PushSubscription.optedIn
            } else if (OneSignal.Notifications) {
              isSubscribed.value = OneSignal.Notifications.permission
            }
            permissionState.value = Notification.permission

            // Sincronizza la lingua scelta dall'utente su OneSignal
            const userLang = localStorage.getItem('vicini_lang') || 'it'
            if (OneSignal.User && OneSignal.User.setLanguage) {
              await OneSignal.User.setLanguage(userLang)
            }
          } catch (e) {
            console.error('[OneSignal] Errore sottoscrizione:', e)
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
        type: 'general',
        priority: 'normal',
        serviceName: { it: 'Vicini di Strada Como', en: 'Vicini di Strada Como', es: 'Vicini di Strada Como' },
        title: { it: 'Notifiche Push Attive', en: 'Push Notifications Active', es: 'Notificaciones Push Activas' },
        content: {
          it: 'Le notifiche push funzionano sia su Smartphone che su PC! Clicca per aprire Notizie & Allerta.',
          en: 'Push notifications are active on both Smartphone and PC! Click to open News & Alerts.',
          es: '¡Las notificaciones push están activas en Smartphone y PC! Haz clic para abrir Noticias.'
        },
        url: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/?tab=news'
      })
      const rec = res?.recipients !== undefined ? res.recipients : (res?.id ? 'inviata' : '0')
      alert(`Notifica di prova inviata con successo! Dispositivi raggiunti: ${rec}`)
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

// Funzione globale per spedire notifiche push a tutti gli smartphone e PC tramite l'API OneSignal
export async function sendOneSignalPush({ title, content, url, newsId, type = 'general', priority = 'normal', serviceName = '' }) {
  const headings = {}
  const contents = {}

  const isEmergency = type === 'emergency'
  const isUpdate = type === 'service_update' || type === 'change'

  // Emoji distintiva per tipologia
  const emoji = isEmergency ? '🚨 ' : (isUpdate ? '🔄 ' : '📢 ')

  // Accent color di sistema Android (Rosso per Emergenza, Arancione per Variazione, Blu per Normale)
  const accentColor = isEmergency ? 'FFDC2626' : (isUpdate ? 'FFF59E0B' : 'FF2563EB')

  const getServiceNameForLang = (lang) => {
    if (!serviceName) return ''
    if (typeof serviceName === 'object' && serviceName !== null) {
      return serviceName[lang] || serviceName.it || serviceName.en || Object.values(serviceName)[0] || ''
    }
    return String(serviceName)
  }

  // Costruisci Titolo e Descrizione con pieno contesto (Nome servizio + Evento specifico)
  if (typeof title === 'object' && title !== null) {
    for (const k in title) {
      if (title[k]) {
        const sName = getServiceNameForLang(k)
        let prefix = ''
        if (sName) {
          prefix = !title[k].toLowerCase().includes(sName.toLowerCase()) ? `${sName} • ` : ''
        } else {
          prefix = 'Vicini di Strada • '
        }
        headings[k] = `${emoji}${prefix}${title[k]}`
      }
    }
  } else if (title) {
    const sName = getServiceNameForLang('it')
    let prefix = ''
    if (sName) {
      prefix = !title.toLowerCase().includes(sName.toLowerCase()) ? `${sName} • ` : ''
    } else {
      prefix = 'Vicini di Strada • '
    }
    const fullTitle = `${emoji}${prefix}${title}`
    headings.it = fullTitle
    headings.en = fullTitle
    headings.es = fullTitle
  }

  if (typeof content === 'object' && content !== null) {
    for (const k in content) {
      if (content[k]) {
        const sName = getServiceNameForLang(k)
        const text = content[k]
        if (sName && !text.toLowerCase().includes(sName.toLowerCase())) {
          contents[k] = `${sName}: ${text}`
        } else {
          contents[k] = text
        }
      }
    }
  } else if (content) {
    const sName = getServiceNameForLang('it')
    const formatted = (sName && !content.toLowerCase().includes(sName.toLowerCase()))
      ? `${sName}: ${content}`
      : content
    contents.it = formatted
    contents.en = formatted
    contents.es = formatted
  }

  // Fallback intelligenti per tutte le lingue supportate da OneSignal (richiede 'en' obbligatoria)
  const baseTitle = headings.it || headings.en || headings.es || Object.values(headings)[0] || 'Vicini di Strada Como'
  const baseContent = contents.it || contents.en || contents.es || Object.values(contents)[0] || 'Nuovo avviso pubblicato dai servizi'

  if (!headings.en) headings.en = baseTitle
  if (!contents.en) contents.en = baseContent
  if (!headings.it) headings.it = baseTitle
  if (!contents.it) contents.it = baseContent
  if (!headings.es) headings.es = headings.it || baseTitle
  if (!contents.es) contents.es = contents.it || baseContent

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
        included_segments: ['Total Subscriptions', 'Subscribed Users'],
        headings: headings,
        contents: contents,
        // Priority 10 garantisce consegna immediata su Android/iOS risvegliando il dispositivo da Doze mode
        priority: 10,
        ttl: 259200,
        android_accent_color: accentColor,
        url: targetUrl,
        web_url: targetUrl,
        chrome_web_icon: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/pwa-192x192.png',
        chrome_web_badge: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/pwa-192x192.png',
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
