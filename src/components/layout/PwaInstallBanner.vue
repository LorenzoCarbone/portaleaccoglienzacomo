<template>
  <div
    v-if="showBanner && !isInstalled"
    class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-brand-900 text-white p-4 rounded-2xl border border-brand-700/80 flex items-center justify-between gap-3 shadow-2xl animate-fadeIn"
  >
    <div
      class="flex items-center gap-3 cursor-pointer min-w-0"
      @click="$emit('open-modal')"
      title="Clicca per maggiori dettagli"
    >
      <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl backdrop-blur-sm text-emerald-300 shrink-0">
        <i class="fa-solid fa-hands-holding-circle"></i>
      </div>
      <div class="min-w-0">
        <h4 class="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
          <span>Installa l'App</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-brand-300"></i>
        </h4>
        <p class="text-xs text-brand-200 mt-0.5 truncate">
          {{ isIOS ? "Tocca qui per le istruzioni iPhone" : "Accesso rapido ai servizi anche offline" }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <button
        v-if="!isIOS && deferredPrompt"
        @click="$emit('install')"
        class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow transition active:scale-95"
      >
        Installa
      </button>
      <button
        v-else
        @click="$emit('open-modal')"
        class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl shadow transition active:scale-95"
      >
        Info
      </button>
      <button
        @click="dismissBanner"
        class="w-7 h-7 rounded-full bg-brand-800 hover:bg-brand-700 text-brand-300 hover:text-white flex items-center justify-center text-xs transition"
        title="Chiudi avviso"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  isInstalled: Boolean,
  isIOS: Boolean,
  deferredPrompt: Object
})

defineEmits(['open-modal', 'install'])

const showBanner = ref(false)

onMounted(() => {
  // Se non è già installata e non è stata chiusa in precedenza in questa sessione
  if (!props.isInstalled && !sessionStorage.getItem('pwa_banner_dismissed')) {
    // Mostra il banner dopo 2 secondi
    setTimeout(() => {
      if (!props.isInstalled) {
        showBanner.value = true
      }
    }, 2000)
  }
})

watch(() => props.isInstalled, (newVal) => {
  if (newVal) {
    showBanner.value = false
  }
})

const dismissBanner = () => {
  showBanner.value = false
  sessionStorage.setItem('pwa_banner_dismissed', 'true')
}
</script>
