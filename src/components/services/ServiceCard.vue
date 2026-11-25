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

      <div class="p-5 space-y-3.5">
        <!-- Indirizzo -->
        <div class="flex items-center gap-2.5 text-slate-800 text-sm bg-brand-50/70 p-3 rounded-xl border border-brand-100">
          <i class="fa-solid fa-location-dot text-brand-600 text-base shrink-0"></i>
          <span class="font-bold tracking-wide text-brand-900 leading-tight">{{ service.address }}</span>
        </div>

        <!-- Info / Orari Temporanei -->
        <div v-if="hasTempInfo(service)" class="bg-amber-100 border border-amber-300 rounded-xl p-3 text-sm text-amber-900 shadow-sm flex items-start gap-2.5">
          <i class="fa-solid fa-clock-rotate-left mt-[3px] shrink-0 text-amber-600"></i>
          <div>
            <span class="font-bold text-[10px] uppercase tracking-wider block text-amber-700 mb-0.5">{{ t('temp_info_label') }}</span>
            <span class="font-semibold whitespace-pre-line leading-snug">{{ translateField(service, 'temp_info') }}</span>
          </div>
        </div>

        <!-- Descrizione -->
        <div>
          <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line" v-html="translateField(service, 'description')"></p>
        </div>

        <!-- SEZIONE 1: MODALITÀ DI ACCESSO (Sempre visibile e ben differenziata) -->
        <div
          v-if="accessDisplay"
          class="rounded-2xl p-3 border flex items-start gap-2.5 transition"
          :class="accessDisplay.boxClass"
        >
          <div
            class="w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-xs"
            :class="accessDisplay.iconClass"
          >
            <i :class="accessDisplay.icon"></i>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] uppercase tracking-wider font-bold block leading-none mb-1 opacity-75">
              {{ t('access_label') }}
            </span>
            <span class="text-xs sm:text-[13px] font-bold block leading-snug">
              {{ accessDisplay.title }}
            </span>
            <p v-if="accessDisplay.note" class="text-xs leading-relaxed mt-0.5 opacity-90">
              {{ accessDisplay.note }}
            </p>
          </div>
        </div>

        <!-- SEZIONE 2: ORARI DI APERTURA (Separati dall'accesso, con riepilogo e tabella chiara) -->
        <!-- Caso A: Servizio Continuativo H24, Orario personalizzato/periodico o Solo su Appuntamento -->
        <div
          v-if="parsedHours.mode === 'continuous' || (parsedHours.mode === 'custom' && customHoursDisplay) || (parsedHours.mode === 'appointment' && scheduleRows.length === 0)"
          class="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
        >
          <div class="flex items-center gap-2 font-bold text-slate-700 shrink-0">
            <i class="fa-regular fa-clock text-brand-600 text-sm"></i>
            <span>{{ t('hours_label') }}</span>
          </div>
          <span
            class="px-2.5 py-1 rounded-xl text-[11px] font-bold border text-right leading-snug"
            :class="parsedHours.mode === 'continuous' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 rounded-full' : (parsedHours.mode === 'custom' ? 'bg-brand-50 text-brand-800 border-brand-200' : 'bg-amber-50 text-amber-800 border-amber-200 shrink-0 rounded-full')"
          >
            {{ parsedHours.mode === 'continuous' ? t('hours_continuous') : (parsedHours.mode === 'custom' ? customHoursDisplay : t('hours_by_appointment')) }}
          </span>
        </div>

        <!-- Caso B: Fasce orarie settimanali strutturate (Accordion con tabella 2 colonne) -->
        <div
          v-else-if="scheduleRows.length > 0"
          class="rounded-2xl border border-slate-200/80 bg-slate-50/80 text-xs overflow-hidden"
        >
          <button
            type="button"
            @click="$emit('toggle-hours', service.id)"
            class="w-full flex items-center justify-between gap-2 px-3.5 py-3 hover:bg-slate-100/80 transition font-bold text-slate-700 cursor-pointer"
          >
            <div class="flex items-center gap-2 min-w-0">
              <i class="fa-regular fa-clock text-brand-600 text-sm shrink-0"></i>
              <span class="truncate">{{ t('hours_label') }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-xs">
                {{ scheduleSummary }}
              </span>
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform" :class="{'rotate-180': isHoursExpanded}"></i>
            </div>
          </button>

          <div v-show="isHoursExpanded" class="border-t border-slate-200/70 bg-white divide-y divide-slate-100">
            <div
              v-for="row in scheduleRows"
              :key="row.dayId"
              class="px-3.5 py-2 flex items-center justify-between gap-2"
              :class="row.isToday ? 'bg-brand-50/70' : ''"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <span
                  class="text-xs truncate"
                  :class="row.isToday ? 'font-bold text-brand-900' : 'font-medium text-slate-600'"
                >
                  {{ row.dayName }}
                </span>
                <span
                  v-if="row.isToday"
                  class="px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold uppercase tracking-wider shrink-0"
                >
                  {{ t('hours_today') }}
                </span>
              </div>
              <div class="flex flex-wrap justify-end gap-1 shrink-0">
                <span
                  v-for="(slot, idx) in row.slots"
                  :key="idx"
                  class="px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums"
                  :class="row.isToday ? 'bg-brand-100 text-brand-900' : 'bg-slate-100 text-slate-700'"
                >
                  {{ slot }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Caso C: Nessun orario inserito -->
        <div
          v-else
          class="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-slate-500"
        >
          <div class="flex items-center gap-2 font-semibold text-slate-600">
            <i class="fa-regular fa-clock text-slate-400 text-sm"></i>
            <span>{{ t('hours_label') }}</span>
          </div>
          <span class="text-[11px] text-slate-500 text-right">{{ formatHours(service.hours, currentLangCode) }}</span>
        </div>

        <!-- Avviso in tempo reale sulla scheda -->
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
        class="w-full h-full bg-slate-100 hover:bg-slate-200 text-brand-600 sm:text-slate-800 sm:font-semibold py-3 px-1.5 rounded-2xl flex flex-col xl:flex-row items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200/80 shadow-sm sm:shadow-none hover:shadow cursor-pointer"
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
        class="w-full h-full bg-slate-100 hover:bg-slate-200 text-brand-600 sm:text-slate-800 sm:font-semibold py-3 px-1.5 rounded-2xl flex flex-col xl:flex-row items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200/80 shadow-sm sm:shadow-none hover:shadow cursor-pointer"
      >
        <i class="fa-solid fa-share-nodes text-xl sm:text-lg sm:text-brand-600 shrink-0"></i>
        <span class="text-[11px] sm:text-xs font-medium sm:font-semibold leading-tight truncate">{{ t('btn_share') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { parseServiceHoursData, getStructuredScheduleRows } from '../../composables/useI18n'

const props = defineProps({
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

const parsedHours = computed(() => parseServiceHoursData(props.service?.hours))

const customHoursDisplay = computed(() => {
  const ct = parsedHours.value.customText
  if (!ct) return ''
  if (typeof ct === 'string') return ct.trim()
  const lang = props.currentLangCode || 'it'
  return (ct[lang] || ct.en || ct.it || Object.values(ct)[0] || '').trim()
})

const scheduleRows = computed(() => {
  return getStructuredScheduleRows(props.service?.hours, props.currentLangCode || 'it')
})

const scheduleSummary = computed(() => {
  const rows = scheduleRows.value
  if (rows.length === 7) return props.t('hours_everyday')
  if (rows.length <= 3) {
    return rows.map(r => r.dayName.slice(0, 3)).join(', ')
  }
  return `${rows.length}/7`
})

const ACCESS_STYLES = {
  free: {
    key: 'access_free',
    icon: 'fa-solid fa-door-open',
    boxClass: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950',
    iconClass: 'bg-emerald-100 text-emerald-700'
  },
  porta_aperta: {
    key: 'access_porta_aperta',
    icon: 'fa-solid fa-key',
    boxClass: 'bg-sky-50/80 border-sky-200/80 text-sky-950',
    iconClass: 'bg-sky-100 text-sky-700'
  },
  servizi_sociali: {
    key: 'access_servizi_sociali',
    icon: 'fa-solid fa-clipboard-check',
    boxClass: 'bg-indigo-50/80 border-indigo-200/80 text-indigo-950',
    iconClass: 'bg-indigo-100 text-indigo-700'
  },
  tessera: {
    key: 'access_tessera',
    icon: 'fa-solid fa-id-card',
    boxClass: 'bg-teal-50/80 border-teal-200/80 text-teal-950',
    iconClass: 'bg-teal-100 text-teal-700'
  },
  appointment: {
    key: 'access_appointment',
    icon: 'fa-solid fa-calendar-check',
    boxClass: 'bg-amber-50/80 border-amber-200/80 text-amber-950',
    iconClass: 'bg-amber-100 text-amber-700'
  },
  custom: {
    key: 'access_custom',
    icon: 'fa-solid fa-circle-info',
    boxClass: 'bg-slate-50 border-slate-200 text-slate-800',
    iconClass: 'bg-slate-200/70 text-slate-700'
  }
}

const accessDisplay = computed(() => {
  const acc = parsedHours.value.access
  if (!acc) return null

  const style = ACCESS_STYLES[acc.type] || ACCESS_STYLES.custom
  let note = ''
  if (acc.note) {
    if (typeof acc.note === 'string') {
      note = acc.note.trim()
    } else if (typeof acc.note === 'object') {
      const lang = props.currentLangCode || 'it'
      note = (acc.note[lang] || acc.note.en || acc.note.it || Object.values(acc.note)[0] || '').trim()
    }
  }

  if (!acc.type && !note) return null

  return {
    title: acc.type ? props.t(style.key) : props.t('access_label'),
    note,
    icon: style.icon,
    boxClass: style.boxClass,
    iconClass: style.iconClass
  }
})
</script>
