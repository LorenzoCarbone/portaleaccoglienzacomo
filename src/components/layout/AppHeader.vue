<template>
  <header class="bg-brand-900 text-white shadow-lg sticky top-0 z-50">
    <div class="max-w-[1600px] w-full mx-auto px-2 sm:px-4 lg:px-8 py-3 flex items-center justify-between gap-2 border-b border-brand-700/50">
      <div class="flex items-center space-x-3" :class="{'space-x-reverse': isRTL}">
        <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl backdrop-blur-sm text-brand-100">
          <i class="fa-solid fa-hands-holding-circle"></i>
        </div>
        <div>
          <h1 class="font-bold text-lg leading-tight tracking-wide">VICINI DI STRADA</h1>
          <p class="text-xs text-brand-200 font-medium">Coordinamento Servizi Como</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="$emit('open-admin')"
          class="flex items-center justify-center w-10 h-10 bg-brand-800 hover:bg-brand-700 rounded-xl text-brand-100 transition shadow-inner border border-brand-700"
          :class="{'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-500/20': user}"
          :title="user ? 'Area Operatori (Accesso Effettuato)' : 'Accesso Area Operatori'"
        >
          <i class="fa-solid text-sm sm:text-base transition-transform active:scale-95" :class="user ? 'fa-user-shield' : 'fa-lock'"></i>
        </button>

        <div class="relative">
          <button
            @click="showLangMenu = !showLangMenu"
            class="flex items-center gap-2 bg-brand-800 hover:bg-brand-700 px-3 py-2 rounded-xl text-sm font-medium transition shadow-inner border border-brand-700"
          >
            <span class="text-lg flag-emoji">{{ currentLang.flag }}</span>
            <span class="hidden sm:inline">{{ currentLang.name }}</span>
            <i class="fa-solid fa-chevron-down text-xs ml-1 opacity-75 transition-transform duration-200" :class="{'rotate-180': showLangMenu}"></i>
          </button>

          <div
            v-if="showLangMenu"
            class="absolute mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 max-h-80 overflow-y-auto no-scrollbar text-slate-800 origin-top-right right-0 rtl:left-0 rtl:right-auto rtl:origin-top-left"
          >
            <div class="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Seleziona Lingua / Language</div>
            <button
              v-for="(lang, code) in languages"
              :key="code"
              @click="handleSelectLanguage(code)"
              class="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-brand-50 transition"
              :class="{'bg-brand-50/60 font-semibold text-brand-700': currentLangCode === code, 'flex-row-reverse': isRTL}"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl flag-emoji">{{ lang.flag }}</span>
                <span class="text-sm">{{ lang.name }}</span>
              </div>
              <span class="text-xs text-slate-400 font-light">{{ code.toUpperCase() }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="bg-brand-900/90 w-full rounded-b-2xl sm:rounded-b-3xl">
      <div class="max-w-[1600px] w-full mx-auto flex px-2 sm:px-4 lg:px-8 pt-2 gap-1 overflow-x-auto no-scrollbar">
        <button
          @click="$emit('update:activeTab', 'services')"
          class="flex-1 py-2.5 px-3 rounded-t-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap transition"
          :class="activeTab === 'services' ? 'bg-slate-50 text-brand-900 font-bold shadow' : 'text-brand-100 hover:bg-brand-800'"
        >
          <i class="fa-solid fa-layer-group"></i>
          <span>{{ t('tab_services') }}</span>
        </button>

        <button
          @click="$emit('update:activeTab', 'news')"
          class="flex-1 py-2.5 px-3 rounded-t-xl font-medium text-xs sm:text-sm flex items-center justify-center whitespace-nowrap transition"
          :class="activeTab === 'news' ? 'bg-slate-50 text-brand-900 font-bold shadow' : 'text-brand-100 hover:bg-brand-800'"
        >
          <div class="flex items-start">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-bell"></i>
              <span>{{ t('tab_news') }}</span>
            </div>
            <span v-if="hasUnreadNews" class="w-2 h-2 rounded-full bg-warm-500 animate-pulse ms-1.5 mt-0.5"></span>
          </div>
        </button>

        <button
          @click="$emit('update:activeTab', 'emergency')"
          class="flex-1 py-2.5 px-3 rounded-t-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap transition"
          :class="activeTab === 'emergency' ? 'bg-slate-50 text-brand-900 font-bold shadow' : 'text-brand-100 hover:bg-brand-800'"
        >
          <i class="fa-solid fa-triangle-exclamation text-warm-500"></i>
          <span>{{ t('tab_emergency') }}</span>
        </button>

        <button
          v-if="user"
          @click="$emit('update:activeTab', 'admin_dashboard')"
          class="flex-1 py-2.5 px-3 rounded-t-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap transition bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50"
          :class="activeTab === 'admin_dashboard' ? '!bg-emerald-600 !text-white font-bold shadow' : ''"
        >
          <i class="fa-solid fa-list-check"></i>
          <span class="hidden md:inline">Gestione</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Backdrop for language menu -->
  <div v-if="showLangMenu" @click="showLangMenu = false" class="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"></div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  user: Object,
  activeTab: String,
  currentLang: Object,
  currentLangCode: String,
  languages: Object,
  isRTL: Boolean,
  hasUnreadNews: Boolean,
  t: Function
})

const emit = defineEmits(['open-admin', 'select-language', 'update:activeTab'])

const showLangMenu = ref(false)

const handleSelectLanguage = (code) => {
  emit('select-language', code)
  showLangMenu.value = false
}
</script>
