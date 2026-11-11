import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { registerSW } from 'virtual:pwa-register'

// Registrazione Service Worker con aggiornamento automatico immediato
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Nuova versione rilevata. Ricaricamento per aggiornare...')
    window.location.reload()
  },
  onOfflineReady() {
    console.log('[PWA] Applicazione pronta per l\'utilizzo offline.')
  }
})

createApp(App).mount('#app')
