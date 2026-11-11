<template>
  <div
    v-if="showBanner && !isInstalled"
    class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-brand-900 text-white p-4 rounded-2xl shadow-2xl border border-brand-700/80 flex items-center justify-between gap-3 animate-fadeIn"
  >
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-2xl backdrop-blur-sm text-brand-100 shrink-0">
        <i class="fa-solid fa-hands-holding-circle"></i>
      </div>
      <div class="min-w-0">
        <h4 class="font-bold text-sm leading-tight text-white">Installa l'App</h4>
        <p class="text-xs text-brand-200 mt-0.5">
          {{ isIOS ? "Tocca Condividi > 'Aggiungi a schermata Home'" : "Accedi ai servizi anche offline" }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <button
        v-if="!isIOS && deferredPrompt"
        @click="installPwa"
        class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow transition active:scale-95"
      >
        Installa
      </button>
      <button
        @click="dismissBanner"
        class="w-8 h-8 rounded-full bg-brand-800 hover:bg-brand-700 text-brand-300 hover:text-white flex items-center justify-center text-xs transition"
        title="Chiudi"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showBanner = ref(false)
const isInstalled = ref(false)
const isIOS = ref(false)
const deferredPrompt = ref(null)

onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isInstalled.value = true
    return
  }

  const userAgent = window.navigator.userAgent.toLowerCase()
  isIOS.value = /iphone|ipad|ipod/.test(userAgent)

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showBanner.value = true
  })

  if (isIOS.value && !localStorage.getItem('pwa_ios_dismissed')) {
    setTimeout(() => {
      showBanner.value = true
    }, 1500)
  }

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    showBanner.value = false
    deferredPrompt.value = null
  })
})

const installPwa = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    isInstalled.value = true
  }
  deferredPrompt.value = null
  showBanner.value = false
}

const dismissBanner = () => {
  showBanner.value = false
  if (isIOS.value) {
    localStorage.setItem('pwa_ios_dismissed', 'true')
  }
}
</script>
