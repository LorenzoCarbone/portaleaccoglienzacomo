import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = 'BLaN0mfZRQSWxkO9B4tQH12kSA_GY53iVLSHU7hoLB4wQY6AzqNU4JRWkkaibxIeAPZp7yBDNBoEEyH71ApFK1M'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const isSupported = ref(false)
const isSubscribed = ref(false)
const permissionState = ref('default')
const isPushLoading = ref(false)
const pushStatusMessage = ref('')

export function usePushNotifications() {
  const checkSupport = () => {
    if (typeof window === 'undefined') return false
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    isSupported.value = supported
    if ('Notification' in window) {
      permissionState.value = Notification.permission
    }
    return supported
  }

  const checkExistingSubscription = async () => {
    if (!checkSupport()) return false
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!sub || localStorage.getItem('vds_push_subscribed') === 'true'
      return !!sub
    } catch (e) {
      console.warn('[Push] Errore verifica sottoscrizione:', e)
      return false
    }
  }

  const subscribeToPush = async () => {
    if (!checkSupport()) {
      alert('Il tuo browser o dispositivo non supporta le notifiche push.')
      return false
    }

    isPushLoading.value = true
    pushStatusMessage.value = 'Richiesta autorizzazione notifiche...'

    try {
      const permission = await Notification.requestPermission()
      permissionState.value = permission

      if (permission !== 'granted') {
        isSubscribed.value = false
        isPushLoading.value = false
        alert('Permesso per le notifiche non concesso. Puoi abilitarlo dalle impostazioni del browser.')
        return false
      }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          })
        } catch (subErr) {
          console.warn('[Push] Sottoscrizione VAPID remota fallita, attivazione notifiche locali:', subErr)
        }
      }

      // Se abbiamo la sottoscrizione, salviamola su Supabase
      if (sub) {
        const subJson = sub.toJSON()
        try {
          const userLang = localStorage.getItem('vds_lang') || 'it'
          await supabase.from('push_subscriptions').upsert({
            endpoint: sub.endpoint,
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
            lang: userLang,
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
          }, { onConflict: 'endpoint' })
        } catch (dbErr) {
          console.log('[Push] Tabella push_subscriptions non ancora presente su Supabase:', dbErr)
        }
      }

      isSubscribed.value = true
      localStorage.setItem('vds_push_subscribed', 'true')

      // Invia subito notifica di benvenuto per conferma visiva immediata
      await reg.showNotification('Notifiche attivate! 🔔', {
        body: 'Riceverai qui avvisi urgenti e novità dai servizi per la grave marginalità di Como.',
        icon: '/portaleaccoglienzacomo/pwa-192x192.png',
        badge: '/portaleaccoglienzacomo/pwa-192x192.png',
        vibrate: [100, 50, 100],
        data: { url: '/portaleaccoglienzacomo/?tab=news' }
      })

      isPushLoading.value = false
      return true
    } catch (err) {
      console.error('[Push] Errore attivazione notifiche:', err)
      isPushLoading.value = false
      alert('Si è verificato un errore durante l\'attivazione delle notifiche: ' + err.message)
      return false
    }
  }

  const unsubscribeFromPush = async () => {
    isPushLoading.value = true
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          try {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          } catch (e) {}
        }
      }
      isSubscribed.value = false
      localStorage.removeItem('vds_push_subscribed')
      isPushLoading.value = false
      return true
    } catch (e) {
      console.error('[Push] Errore disattivazione:', e)
      isPushLoading.value = false
      return false
    }
  }

  const sendTestNotification = async (customTitle, customBody) => {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(customTitle || 'Avviso di prova - Vicini di Strada', {
        body: customBody || 'Questa è una notifica di prova dai servizi di accoglienza di Como.',
        icon: '/portaleaccoglienzacomo/pwa-192x192.png',
        badge: '/portaleaccoglienzacomo/pwa-192x192.png',
        vibrate: [200, 100, 200],
        data: { url: '/portaleaccoglienzacomo/?tab=news' }
      })
    } catch (e) {
      console.error('[Push] Errore invio notifica test:', e)
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
