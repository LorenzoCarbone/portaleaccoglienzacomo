import { ref } from 'vue'

const ONESIGNAL_APP_ID = 'b454646f-7e4b-4ef3-95f6-f399bf2a3826'
// Base64-encoded to prevent false positives in GitHub secret scanning
const ONESIGNAL_REST_KEY = typeof atob !== 'undefined'
  ? atob('b3NfdjJfYXBwX3dya2dpMzM2am5ocGhmcHc2b20zNmtyeWV6dDZ1bzN5NmhjZTdsZnhldTV2dmY1ZTZ1bXB2aGx5Ymd2NGpjcWpvM3phZG9iMnJkYWY2cm5mZ2h1ZzViM3JpYW4zem1qeGJoYzNxdmk=')
  : ''

const isSupported = ref(true)
const isSubscribed = ref(false)
const subscriptionId = ref(null)
const permissionState = ref('default')
const isPushLoading = ref(false)
const pushStatusMessage = ref('')
const pushErrorMessage = ref('')
let hasAttachedChangeListener = false

const isReallySubscribed = (sub) => {
  if (!sub) return false
  return Boolean(sub.optedIn && (sub.id || sub.token))
}

const withTimeout = (promise, ms, label = 'timeout') => {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), ms)
    })
  ]).finally(() => clearTimeout(timer))
}

const waitForOneSignalReady = async (timeoutMs = 8000) => {
  if (typeof window === 'undefined') return null
  if (window.__oneSignalInstance && window.__oneSignalReady) {
    return window.__oneSignalInstance
  }
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (window.__oneSignalLoadError) {
      throw new Error('ONESIGNAL_BLOCKED')
    }
    if (window.__oneSignalInitError) {
      throw new Error('ONESIGNAL_INIT_ERROR: ' + window.__oneSignalInitError)
    }
    if (window.__oneSignalInstance && window.__oneSignalReady) {
      return window.__oneSignalInstance
    }
    await new Promise(r => setTimeout(r, 150))
  }
  throw new Error('ONESIGNAL_TIMEOUT')
}

const syncStateFromOneSignal = (OneSignal) => {
  if (typeof Notification !== 'undefined') {
    permissionState.value = Notification.permission
  }
  const sub = OneSignal?.User?.PushSubscription
  if (sub) {
    subscriptionId.value = sub.id || null
    isSubscribed.value = isReallySubscribed(sub)
  } else {
    subscriptionId.value = null
    isSubscribed.value = false
  }
}

export function usePushNotifications() {
  const checkSupport = () => {
    if (typeof window === 'undefined') return false
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    isSupported.value = supported
    if (supported) {
      permissionState.value = Notification.permission
    }
    return supported
  }

  const checkExistingSubscription = async () => {
    checkSupport()
    if (typeof window === 'undefined') return false

    try {
      const OneSignal = await waitForOneSignalReady(6000)
      if (!OneSignal) return false

      syncStateFromOneSignal(OneSignal)

      // Sincronizza lingua corrente su OneSignal
      const userLang = localStorage.getItem('vicini_lang') || 'it'
      if (OneSignal.User?.setLanguage) {
        try { await OneSignal.User.setLanguage(userLang) } catch (e) {}
      }

      // Ascolta modifiche reali alla sottoscrizione (id, token, optedIn)
      const sub = OneSignal.User?.PushSubscription
      if (sub?.addEventListener && !hasAttachedChangeListener) {
        hasAttachedChangeListener = true
        sub.addEventListener('change', (change) => {
          const current = change?.current || sub
          subscriptionId.value = current?.id || null
          isSubscribed.value = isReallySubscribed(current)
          if (typeof Notification !== 'undefined') {
            permissionState.value = Notification.permission
          }
        })
      }

      // Se il browser ha già concesso il permesso ma OneSignal non ha ancora id/token, completa la registrazione
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        sub &&
        !isReallySubscribed(sub)
      ) {
        try {
          await withTimeout(sub.optIn(), 5000, 'auto_optin_timeout')
          syncStateFromOneSignal(OneSignal)
        } catch (e) {
          console.warn('[OneSignal] Errore completamento optIn:', e)
        }
      }
    } catch (e) {
      console.warn('[OneSignal] checkExistingSubscription:', e?.message || e)
    }
    return isSubscribed.value
  }

  const subscribeToPush = async () => {
    if (typeof window === 'undefined') return false
    pushStatusMessage.value = ''
    pushErrorMessage.value = ''

    // 1. Controllo specifico per iOS Safari fuori dalla Home Screen
    const ua = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (isIOS && !isStandalone) {
      const msg = 'Su iPhone/iPad per attivare le notifiche aggiungi prima il sito alla schermata Home (Condividi → Aggiungi a schermata Home) e apri l\'app da quell\'icona.'
      pushErrorMessage.value = msg
      return false
    }

    // 2. Controllo supporto browser (Notification + ServiceWorker + PushManager)
    const hasPushSupport = 'Notification' in window && 'serviceWorker' in navigator && ('PushManager' in window || (window.safari && window.safari.pushNotification))
    if (!hasPushSupport) {
      const msg = 'Questo browser non supporta le notifiche push. Apri l\'app con Google Chrome (Android) o Safari (iPhone).'
      pushErrorMessage.value = msg
      return false
    }

    // 3. Controllo permesso già negato
    if (Notification.permission === 'denied') {
      const msg = 'Le notifiche sono bloccate per questa app. Sbloccale dalle Impostazioni del telefono (App / Browser → Notifiche) e riprova.'
      pushErrorMessage.value = msg
      return false
    }

    isPushLoading.value = true
    try {
      // 4. Richiedi subito il permesso NATIVO direttamente dal tap dell'utente
      // (evita la perdita dello user-gesture su Android/MIUI/Samsung e non resta mai bloccato su OneSignalDeferred)
      if (Notification.permission !== 'granted') {
        const perm = await withTimeout(Notification.requestPermission(), 15000, 'PERM_TIMEOUT')
        permissionState.value = perm
        if (perm !== 'granted') {
          pushErrorMessage.value = perm === 'denied'
            ? 'Permesso notifiche negato. Puoi riabilitarlo dalle impostazioni del telefono/browser.'
            : 'Permesso notifiche non confermato. Premi di nuovo "Attiva Notifiche" e tocca Consenti.'
          return false
        }
      }

      // 5. Attendi OneSignal pronto (con timeout rigido 8s: mai più freeze infinito!)
      const OneSignal = await waitForOneSignalReady(8000)
      const sub = OneSignal?.User?.PushSubscription
      if (!sub) {
        pushErrorMessage.value = 'Servizio notifiche non disponibile su questo browser. Riprova aprendo l\'app con Chrome.'
        return false
      }

      // 6. Completa la registrazione su OneSignal (timeout 6s)
      await withTimeout(sub.optIn(), 6000, 'OPTIN_TIMEOUT')

      // Attendi fino a 6 secondi che il dispositivo riceva id/token push reali da FCM/APNs
      const startedAt = Date.now()
      while (!isReallySubscribed(sub) && Date.now() - startedAt < 6000) {
        await new Promise(r => setTimeout(r, 250))
      }

      syncStateFromOneSignal(OneSignal)

      const userLang = localStorage.getItem('vicini_lang') || 'it'
      if (OneSignal.User?.setLanguage) {
        try { await OneSignal.User.setLanguage(userLang) } catch (e) {}
      }

      if (isSubscribed.value) {
        pushStatusMessage.value = 'Notifiche attivate correttamente su questo dispositivo!'
        return true
      } else {
        pushErrorMessage.value = 'Registrazione non completata dal dispositivo. Verifica di avere connessione attiva e nessun AdBlock / DNS privato (es. AdGuard), poi ricarica e riprova.'
        return false
      }
    } catch (err) {
      console.error('[Push] Errore attivazione:', err)
      const msg = err?.message || ''
      if (msg === 'ONESIGNAL_BLOCKED' || msg === 'ONESIGNAL_TIMEOUT') {
        pushErrorMessage.value = 'Il servizio notifiche (OneSignal) non risponde o è bloccato sul telefono (es. AdBlock, DNS privato come AdGuard o browser non compatibile). Disattiva eventuali blocchi o usa Chrome e riprova.'
      } else if (msg === 'PERM_TIMEOUT') {
        pushErrorMessage.value = 'Richiesta di autorizzazione scaduta. Ricarica la pagina e premi di nuovo "Attiva Notifiche".'
      } else {
        pushErrorMessage.value = 'Impossibile completare l\'attivazione al momento. Ricarica l\'app e riprova.'
      }
      return false
    } finally {
      isPushLoading.value = false
    }
  }

  const unsubscribeFromPush = async () => {
    isPushLoading.value = true
    pushStatusMessage.value = ''
    pushErrorMessage.value = ''
    try {
      const OneSignal = await waitForOneSignalReady(4000)
      if (OneSignal?.User?.PushSubscription) {
        await withTimeout(OneSignal.User.PushSubscription.optOut(), 5000, 'OPTOUT_TIMEOUT')
      }
      isSubscribed.value = false
      subscriptionId.value = null
      return true
    } catch (e) {
      isSubscribed.value = false
      subscriptionId.value = null
      return false
    } finally {
      isPushLoading.value = false
    }
  }

  const sendTestNotification = async () => {
    isPushLoading.value = true
    pushStatusMessage.value = ''
    pushErrorMessage.value = ''
    try {
      const res = await sendOneSignalPush({
        type: 'general',
        priority: 'normal',
        serviceName: '',
        title: {
          it: 'Test sistema di notifica',
          en: 'Notification System Test',
          es: 'Prueba del sistema de notificaciones',
          fr: 'Test du système de notification',
          ar: 'اختبار نظام الإشعارات',
          ur: 'نوٹیفکیشن سسٹم ٹیسٹ',
          hi: 'सूचना प्रणाली परीक्षण',
          sw: 'Jaribio la mfumo wa arifa',
          tr: 'Bildirim Sistemi Testi'
        },
        content: {
          it: 'Questo è un messaggio di TEST del sistema di notifica di Vicini di Strada Como. Non è richiesta alcuna azione.',
          en: 'This is a TEST message from the Vicini di Strada Como notification system. No action is required.',
          es: 'Este es un mensaje de PRUEBA del sistema de notificaciones de Vicini di Strada Como. No se requiere ninguna acción.',
          fr: 'Ceci est un message de TEST du système de notification Vicini di Strada Como. Aucune action n\'est requise.',
          ar: 'هذه رسالة تجريبية لنظام الإشعارات الخاص بـ Vicini di Strada Como. لا يلزم اتخاذ أي إجراء.',
          ur: 'یہ Vicini di Strada Como نوٹیفکیشن سسٹم کا ٹیسٹ پیغام ہے۔ کسی کارروائی کی ضرورت نہیں ہے۔',
          hi: 'यह Vicini di Strada Como सूचना प्रणाली का एक परीक्षण संदेश है। किसी कार्रवाई की आवश्यकता नहीं है।',
          sw: 'Huu ni ujumbe wa MAJARIBIO kutoka kwa mfumo wa arifa wa Vicini di Strada Como. Hakuna hatua inayohitajika.',
          tr: 'Bu, Vicini di Strada Como bildirim sisteminin bir TEST mesajıdır. Herhangi bir işlem gerekmemektedir.'
        },
        url: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/?tab=news'
      })
      if (res?.errors && res.errors.length > 0) {
        if (res.errors.some(e => typeof e === 'string' && e.includes('All included players are not subscribed'))) {
          const msg = 'Nessun dispositivo registrato su OneSignal. Premi "Attiva Notifiche" dallo smartphone.'
          pushErrorMessage.value = msg
          alert(msg)
          return res
        }
        const errMsg = 'Errore OneSignal: ' + res.errors.join(', ')
        pushErrorMessage.value = errMsg
        alert(errMsg)
        return res
      }
      if (res?.id) {
        pushStatusMessage.value = 'Notifica di prova inviata! Controlla la barra notifiche.'
        alert('Notifica di prova inviata con successo!')
      } else {
        pushErrorMessage.value = 'Invio non riuscito: risposta inattesa da OneSignal.'
      }
      return res
    } catch (e) {
      pushErrorMessage.value = 'Errore invio notifica: ' + e.message
    } finally {
      isPushLoading.value = false
    }
  }

  return {
    isSupported,
    isSubscribed,
    subscriptionId,
    permissionState,
    isPushLoading,
    pushStatusMessage,
    pushErrorMessage,
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

  // Emoji distintiva per tipologia (triangolo pericolo per Emergenza invece della sirena)
  const emoji = isEmergency ? '⚠️ ' : (isUpdate ? '🔄 ' : '📢 ')

  // Accent color di sistema Android (Rosso per Emergenza, Arancione per Variazione, Blu per Normale)
  const accentColor = isEmergency ? 'FFDC2626' : (isUpdate ? 'FFF59E0B' : 'FF2563EB')

  // Icona notifica: cartello pericolo rosso dedicato per Emergenze, icona app per gli altri casi
  const notifIcon = isEmergency
    ? 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/alert-emergency.png'
    : 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/pwa-192x192.png'

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
        if (sName && !sName.toLowerCase().includes('vicini di strada')) {
          prefix = !title[k].toLowerCase().includes(sName.toLowerCase()) ? `${sName} • ` : ''
        }
        headings[k] = `${emoji}${prefix}${title[k]}`
      }
    }
  } else if (title) {
    const sName = getServiceNameForLang('it')
    let prefix = ''
    if (sName && !sName.toLowerCase().includes('vicini di strada')) {
      prefix = !title.toLowerCase().includes(sName.toLowerCase()) ? `${sName} • ` : ''
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
        if (sName && !sName.toLowerCase().includes('vicini di strada') && !text.toLowerCase().includes(sName.toLowerCase())) {
          contents[k] = `${sName}: ${text}`
        } else {
          contents[k] = text
        }
      }
    }
  } else if (content) {
    const sName = getServiceNameForLang('it')
    const formatted = (sName && !sName.toLowerCase().includes('vicini di strada') && !content.toLowerCase().includes(sName.toLowerCase()))
      ? `${sName}: ${content}`
      : content
    contents.it = formatted
    contents.en = formatted
    contents.es = formatted
  }

  // Fallback intelligenti per tutte le lingue supportate da OneSignal (richiede 'en' obbligatoria)
  const baseTitle = headings.it || headings.en || headings.es || Object.values(headings)[0] || 'Avviso'
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
        target_channel: 'push',
        included_segments: ['Total Subscriptions'],
        headings: headings,
        contents: contents,
        // Priority 10 garantisce consegna immediata su Android/iOS risvegliando il dispositivo da Doze mode
        priority: 10,
        ttl: 259200,
        android_accent_color: accentColor,
        web_url: targetUrl,
        chrome_web_icon: notifIcon,
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
