<template>
  <div class="bg-white rounded-3xl border border-slate-200/90 overflow-hidden card-shadow hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
    <div>
      <div class="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          v-if="service.image"
          :src="service.image"
          :alt="translateField(service, 'name')"
          class="w-full h-full object-cover"
        >
        <div v-else class="w-full h-full bg-slate-200 flex items-center justify-center text-4xl opacity-50">
          {{ getCategoryIcon(service.category) }}
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div
          class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow flex items-center gap-1.5"
          :class="{'right-3 left-auto': isRTL}"
        >
          <span>{{ getCategoryIcon(service.category) }}</span>
          <span>{{ t(getCategoryLabelKey(service.category)) }}</span>
        </div>
        <div
          class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow flex items-center gap-1.5 backdrop-blur-md"
          :class="[
            service.status === 'active' ? 'bg-emerald-500 text-white' : service.status === 'notice' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white',
            {'left-3 right-auto': isRTL}
          ]"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-white" :class="service.status === 'suspended' ? '' : 'animate-ping'"></span>
          <span>{{ service.status === 'active' ? t('status_active') : (service.status === 'notice' ? t('status_notice') : t('status_suspended')) }}</span>
        </div>
        <div class="absolute bottom-3 left-3 right-3 text-white">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-brand-200 block drop-shadow">{{ service.organization }}</span>
          <h4 class="text-lg font-bold leading-tight drop-shadow-md mt-0.5">{{ translateField(service, 'name') }}</h4>
        </div>
      </div>

      <div class="p-5 space-y-4">
        <div class="flex items-center gap-2.5 text-slate-800 text-sm bg-brand-50/70 p-3 rounded-xl border border-brand-100">
          <i class="fa-solid fa-location-dot text-brand-600 text-base shrink-0"></i>
          <span class="font-bold tracking-wide text-brand-900 leading-tight">{{ service.address }}</span>
        </div>

        <div v-if="hasTempInfo(service)" class="bg-amber-100 border border-amber-300 rounded-xl p-3 text-sm text-amber-900 shadow-sm flex items-start gap-2.5">
          <i class="fa-solid fa-clock-rotate-left mt-[3px] shrink-0 text-amber-600"></i>
          <div>
            <span class="font-bold text-[10px] uppercase tracking-wider block text-amber-700 mb-0.5">Info / Orari Temporanei</span>
            <span class="font-semibold whitespace-pre-line leading-snug">{{ translateField(service, 'temp_info') }}</span>
          </div>
        </div>

        <div>
          <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line" v-html="translateField(service, 'description')"></p>
        </div>

        <div class="bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 overflow-hidden">
          <button
            @click="$emit('toggle-hours', service.id)"
            class="w-full flex items-center justify-between p-3 bg-slate-100/50 hover:bg-slate-100 transition font-bold text-slate-700"
          >
            <div class="flex items-center gap-2">
              <i class="fa-regular fa-clock text-slate-400 text-sm"></i>
              <span>{{ t('hours_label') }}</span>
            </div>
            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform" :class="{'rotate-180': isHoursExpanded}"></i>
          </button>
          <div v-show="isHoursExpanded" class="p-3 border-t border-slate-100">
            <span class="whitespace-pre-line leading-relaxed block">{{ formatHours(service.hours, currentLangCode) }}</span>
          </div>
        </div>

        <div
          v-if="service.latestUpdate"
          class="rounded-2xl p-3.5 border text-xs flex items-start gap-2.5 transition"
          :class="service.status === 'suspended' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50 border-blue-200/80 text-blue-900'"
        >
          <i
            class="mt-0.5 text-sm shrink-0"
            :class="service.status === 'suspended' ? 'fa-solid fa-circle-exclamation text-red-600' : 'fa-solid fa-circle-info text-blue-600'"
          ></i>
          <div>
            <span
              class="font-bold block text-[11px] uppercase tracking-wider"
              :class="service.status === 'suspended' ? 'text-red-700' : 'text-blue-700'"
            >
              {{ service.status === 'suspended' ? t('service_suspended_label') : t('service_update_label') }}:
            </span>
            <p class="font-medium mt-1 leading-relaxed">{{ translateField(service.latestUpdate, 'text') }}</p>
            <span
              class="text-[10px] block mt-1.5 font-medium"
              :class="service.status === 'suspended' ? 'text-red-600/80' : 'text-blue-600/80'"
            >
              <i class="fa-regular fa-calendar text-[9px]"></i> {{ service.latestUpdate.date }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="p-5 pt-0 grid grid-cols-3 gap-2 sm:gap-3">
      <!-- Tasto Contatta -->
      <button
        @click="$emit('open-contact', service)"
        :title="t('btn_contact')"
        class="w-full h-full bg-slate-100 hover:bg-slate-200 text-brand-600 sm:text-slate-800 sm:font-semibold py-3 px-1.5 rounded-2xl flex flex-col xl:flex-row items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200/80 shadow-sm sm:shadow-none hover:shadow"
      >
        <i class="fa-solid fa-phone text-xl sm:text-lg sm:text-brand-600 shrink-0"></i>
        <span class="text-[11px] sm:text-xs font-medium sm:font-semibold leading-tight truncate">{{ t('btn_contact') }}</span>
      </button>

      <!-- Tasto GPS / Direzioni -->
      <a
        :href="getNavigationUrl(service.address)"
        target="_blank"
        rel="noopener noreferrer"
        :title="t('btn_directions')"
        class="w-full h-full bg-brand-600 hover:bg-brand-700 text-white sm:font-semibold py-3 px-1.5 rounded-2xl flex flex-col xl:flex-row items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-brand-500/30 hover:shadow-lg"
      >
        <i class="fa-solid fa-diamond-turn-right text-xl sm:text-lg shrink-0"></i>
        <span class="text-[11px] sm:text-xs font-medium sm:font-semibold leading-tight truncate">{{ t('btn_directions') }}</span>
      </a>

      <!-- Tasto Condividi -->
      <button
        @click="$emit('open-share', service)"
        :title="t('btn_share')"
        class="w-full h-full bg-slate-100 hover:bg-slate-200 text-brand-600 sm:text-slate-800 sm:font-semibold py-3 px-1.5 rounded-2xl flex flex-col xl:flex-row items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200/80 shadow-sm sm:shadow-none hover:shadow"
      >
        <i class="fa-solid fa-share-nodes text-xl sm:text-lg sm:text-brand-600 shrink-0"></i>
        <span class="text-[11px] sm:text-xs font-medium sm:font-semibold leading-tight truncate">{{ t('btn_share') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  service: Object,
  isHoursExpanded: Boolean,
  currentLangCode: String,
  isRTL: Boolean,
  t: Function,
  translateField: Function,
  formatHours: Function,
  getCategoryIcon: Function,
  getCategoryLabelKey: Function,
  hasTempInfo: Function,
  getNavigationUrl: Function
})

defineEmits(['toggle-hours', 'open-contact', 'open-share'])
</script>
