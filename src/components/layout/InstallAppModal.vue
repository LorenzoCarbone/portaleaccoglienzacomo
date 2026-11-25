<template>
  <div
    v-if="isOpen"
    @click.self="$emit('close')"
    class="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
  >
    <div
      class="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 transform transition-transform text-slate-800"
    >
      <!-- Header modale -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-900 text-emerald-400 flex items-center justify-center text-2xl font-bold shadow-md shadow-brand-900/20">
            <i class="fa-solid fa-hands-holding-circle"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-base leading-tight">Vicini di Strada</h3>
            <p class="text-xs text-slate-500 font-medium">{{ t('header_subtitle') }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- CASO 1: L'APP È GIÀ SUL TELEFONO O INSTALLATA -->
      <div v-if="isInstalled || hasDownloaded" class="space-y-4 py-2">
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
          <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <h4 class="font-bold text-emerald-950 text-base">
              {{ t('pwa_modal_installed_title') }}
            </h4>
            <p class="text-xs text-emerald-800 mt-1 leading-relaxed">
              {{ t('pwa_modal_installed_sub') }}
            </p>
          </div>
        </div>

        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <p class="font-medium text-slate-700 flex items-center gap-2">
            <i :class="isMobileDevice ? 'fa-solid fa-mobile-screen-button' : 'fa-solid fa-desktop'" class="text-brand-600 text-sm"></i>
            <span>{{ t('pwa_modal_how_to_open') }}</span>
          </p>
          <p class="leading-relaxed" v-if="isMobileDevice">
            {{ t('pwa_modal_open_mobile') }}
          </p>
          <p class="leading-relaxed" v-else>
            {{ t('pwa_modal_open_pc') }}
          </p>
          <p class="leading-relaxed text-slate-500">
            {{ t('pwa_modal_offline_note') }}
          </p>
        </div>

        <button
          @click="$emit('close')"
          class="w-full bg-brand-800 hover:bg-brand-900 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow"
        >
          {{ t('pwa_modal_btn_ok') }}
        </button>

        <div class="text-center pt-1">
          <button
            @click="$emit('force-reinstall')"
            class="text-xs text-slate-400 hover:text-brand-600 underline font-medium transition"
          >
            {{ isMobileDevice ? t('pwa_modal_reinstall_mobile') : t('pwa_modal_reinstall_pc') }}
          </button>
        </div>
      </div>

      <!-- CASO 2: L'APP NON È ANCORA INSTALLATA -->
      <div v-else class="space-y-4 py-1">
        <p class="text-xs text-slate-600 leading-relaxed">
          {{ t('pwa_modal_intro') }}
        </p>

        <!-- Android / Desktop con prompt nativo disponibile -->
        <div v-if="!isIOS && deferredPrompt">
          <button
            @click="handleInstallClick"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
          >
            <i class="fa-solid fa-download"></i>
            <span>{{ t('pwa_modal_btn_install_now') }}</span>
          </button>
        </div>

        <!-- Istruzioni per iPhone / iPad (iOS Safari) -->
        <div v-else-if="isIOS" class="bg-brand-50/70 border border-brand-200/80 rounded-2xl p-4 space-y-3">
          <div class="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-wider">
            <i class="fa-brands fa-apple text-base text-brand-700"></i>
            <span>{{ t('pwa_modal_ios_title') }}</span>
          </div>

          <ol class="space-y-2.5 text-xs text-slate-700">
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <span>{{ t('pwa_modal_ios_step1') }}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <span>{{ t('pwa_modal_ios_step2') }}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <span>{{ t('pwa_modal_ios_step3') }}</span>
            </li>
          </ol>
        </div>

        <!-- Android senza prompt automatico o Browser PC -->
        <div v-else class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600">
          <p class="font-bold text-slate-800 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-info text-brand-600"></i>
            <span>{{ t('pwa_modal_browser_title') }}</span>
          </p>
          <p class="leading-relaxed">
            {{ t('pwa_modal_browser_desc') }}
          </p>
        </div>

        <div class="pt-1">
          <button
            @click="$emit('close')"
            class="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  isInstalled: Boolean,
  hasDownloaded: Boolean,
  isIOS: Boolean,
  deferredPrompt: Object,
  isMobileDevice: {
    type: Boolean,
    default: true
  },
  t: {
    type: Function,
    default: (k) => k
  }
})

const emit = defineEmits(['close', 'install', 'force-reinstall'])

const handleInstallClick = () => {
  emit('install')
}
</script>
