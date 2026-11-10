<template>
  <div>
    <!-- Lista Notizie -->
    <div v-if="!editingNews" class="space-y-6">
      <div class="bg-gradient-to-r from-amber-500 to-warm-600 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Pannello Allerta</span>
          <h2 class="text-2xl sm:text-3xl font-bold leading-tight">Gestione Notizie & Allerta</h2>
          <p class="text-white/90 text-sm mt-1">Pubblica aggiornamenti o allerte centralizzate visibili a tutti.</p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            @click="$emit('start-creating')"
            class="bg-white text-amber-700 hover:bg-amber-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 transition active:scale-95"
          >
            <i class="fa-solid fa-plus"></i>
            <span>Nuova Notizia</span>
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="text-center py-16">
        <i class="fa-solid fa-circle-notch fa-spin text-4xl text-amber-500 mb-4 inline-block"></i>
      </div>
      <div v-else-if="globalNews.length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <span class="text-6xl block mb-4">📭</span>
        <h4 class="font-bold text-slate-700 text-lg mb-1">Nessuna notizia pubblicata</h4>
      </div>
      <div v-else class="bg-white rounded-3xl border border-slate-200 overflow-hidden card-shadow divide-y divide-slate-100">
        <div class="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Notizie pubblicate ({{ globalNews.length }})</span>
          <span>Tipo</span>
        </div>
        <div
          v-for="news in globalNews"
          :key="news.id"
          class="p-4 sm:p-5 hover:bg-amber-50/50 transition flex items-center justify-between gap-4 group"
        >
          <div @click="$emit('start-editing', news)" class="flex items-center gap-3.5 overflow-hidden cursor-pointer flex-1">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
              :class="getNewsTypeStyle(news.type).badgeClass"
            >
              <i :class="getNewsTypeStyle(news.type).icon"></i>
            </div>
            <div class="overflow-hidden">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{{ formatNewsDate(news.created_at) }}</span>
              <h4 class="font-bold text-slate-800 text-sm sm:text-base group-hover:text-amber-700 transition truncate">
                {{ translateField(news, 'title') || '(senza titolo)' }}
              </h4>
              <p class="text-xs text-slate-500 truncate mt-0.5">{{ translateField(news, 'content') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm"
              :class="news.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100 text-blue-800 border border-blue-300'"
            >
              {{ news.priority === 'high' ? 'Urgente' : 'Info' }}
            </span>
            <button
              @click="$emit('start-editing', news)"
              title="Modifica"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-brand-600 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              @click="$emit('delete', news)"
              title="Elimina"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Notizie -->
    <div v-else class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 card-shadow sticky top-20 z-30">
        <button
          @click="$emit('cancel')"
          class="flex items-center gap-2 text-slate-600 hover:text-amber-600 font-bold text-xs sm:text-sm bg-slate-100 hover:bg-amber-50 px-3.5 py-2 rounded-xl transition active:scale-95"
        >
          <i class="fa-solid fa-arrow-left" :class="{'rtl-flip': isRTL}"></i>
          <span>Torna alla lista</span>
        </button>
        <div class="text-right overflow-hidden pr-2">
          <span class="text-[10px] uppercase font-bold text-amber-600 tracking-wider block truncate">Stato Operazione:</span>
          <span class="font-bold text-slate-800 text-xs sm:text-sm truncate block">
            {{ newsForm.id ? 'Modifica notizia' : 'Nuova notizia' }}
          </span>
        </div>
      </div>

      <!-- Urgenza -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
          <div class="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center text-sm shadow-sm">1</div>
          <h3 class="font-bold text-slate-800 text-base">Livello di Urgenza</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            @click="setNewsUrgency('info')"
            type="button"
            class="py-4 px-3 rounded-2xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition active:scale-95"
            :class="isUrgency('info') ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50'"
          >
            <i class="fa-solid fa-circle-info text-xl"></i>
            <span class="text-center leading-tight">Informativa<br><span class="text-[10px] font-normal opacity-80">Avvisi e Raccolte</span></span>
          </button>
          <button
            @click="setNewsUrgency('update')"
            type="button"
            class="py-4 px-3 rounded-2xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition active:scale-95"
            :class="isUrgency('update') ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50'"
          >
            <i class="fa-solid fa-arrows-rotate text-xl"></i>
            <span class="text-center leading-tight">Variazione<br><span class="text-[10px] font-normal opacity-80">Orari e Sedi</span></span>
          </button>
          <button
            @click="setNewsUrgency('emergency')"
            type="button"
            class="py-4 px-3 rounded-2xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition active:scale-95"
            :class="isUrgency('emergency') ? 'bg-red-600 border-red-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-red-50'"
          >
            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
            <span class="text-center leading-tight">Emergenza<br><span class="text-[10px] font-normal opacity-80">Chiusure urgenti</span></span>
          </button>
        </div>
      </div>

      <!-- Contenuto Messaggio -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
          <div class="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center text-sm shadow-sm">2</div>
          <h3 class="font-bold text-slate-800 text-base">Contenuto del Messaggio</h3>
        </div>

        <div class="flex bg-slate-100 p-1.5 rounded-2xl mb-5 w-full">
          <button
            @click="newsForm.useCustomText = false"
            type="button"
            class="flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2"
            :class="!newsForm.useCustomText ? 'bg-white text-brand-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fa-solid fa-language"></i>
            <span class="hidden sm:inline">Usa Modello Sicuro</span>
            <span class="sm:hidden">Modello</span>
          </button>
          <button
            @click="newsForm.useCustomText = true"
            type="button"
            class="flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2"
            :class="newsForm.useCustomText ? 'bg-white text-brand-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fa-solid fa-pen"></i>
            <span class="hidden sm:inline">Scrivi Testo Libero</span>
            <span class="sm:hidden">Libero</span>
          </button>
        </div>

        <!-- Modelli Preimpostati -->
        <div v-if="!newsForm.useCustomText" class="bg-brand-50 rounded-2xl p-4 border border-brand-100 animate-fadeIn">
          <label class="block text-sm font-bold uppercase text-brand-800 mb-2">Seleziona Modello di Avviso</label>
          <select
            v-model="newsForm.template"
            @change="newsForm.templateParams = {}"
            class="w-full bg-white border border-brand-200 rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
          >
            <optgroup label="Scenari Ricorrenti">
              <option v-for="tpl in templates.filter(t => t.category === 'recurring')" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
            </optgroup>
            <optgroup label="Variazioni ed Eventi">
              <option v-for="tpl in templates.filter(t => t.category === 'extraordinary' || t.category === 'ordinary')" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
            </optgroup>
            <optgroup label="Emergenze e Chiusure">
              <option v-for="tpl in templates.filter(t => t.category === 'emergency')" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
            </optgroup>
          </select>

          <div v-if="selectedNewsTemplate && selectedNewsTemplate.params.length > 0" class="space-y-3 mt-4 p-3 bg-white rounded-xl border border-brand-200">
            <p class="text-xs text-slate-500 mb-2 font-medium">Compila i dati per completare il modello:</p>
            <div v-for="param in selectedNewsTemplate.params" :key="param.id">
              <label class="block text-xs font-bold text-brand-700 mb-1 capitalize">{{ param.label }}</label>
              <input
                v-model="newsForm.templateParams[param.id]"
                :type="param.type"
                class="w-full text-sm py-2 px-3 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
              >
            </div>
          </div>

          <div v-if="newsForm.template" class="mt-4 p-4 bg-white rounded-xl border border-brand-100 shadow-sm text-sm">
            <div class="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
              <span class="text-lg flag-emoji">🇮🇹</span>
              <span class="text-[10px] uppercase font-bold text-slate-400">Anteprima Finale in Italiano</span>
            </div>
            <strong class="block text-slate-800 text-base mb-1">
              {{ generateTemplateText(newsForm.template, newsForm.templateParams, 'it', true) }}
            </strong>
            <p class="text-slate-600 leading-relaxed">
              {{ generateTemplateText(newsForm.template, newsForm.templateParams, 'it', false) }}
            </p>
            <p class="text-[10px] text-emerald-600 font-bold mt-3">
              <i class="fa-solid fa-check mr-1"></i>Traduzione automatica in tutte le lingue garantita.
            </p>
          </div>
        </div>

        <!-- Testo Libero Manuale -->
        <div v-else class="space-y-6 animate-fadeIn">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-100/50 p-3 rounded-xl border border-amber-200 gap-3">
            <div>
              <h4 class="text-sm font-bold uppercase text-amber-800">Gestione Lingue (Titolo e Testo)</h4>
              <p class="text-[10px] text-amber-700 font-medium">Aggiungi una lingua per tradurre l'annuncio. Se non tradotto, verrà mostrato in Italiano o Inglese.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <select v-model="selectedNewLang" class="text-xs border border-amber-300 rounded-lg px-2 py-1.5 bg-white outline-none">
                <option value="">Aggiungi lingua...</option>
                <option v-for="(l, code) in availableLangsForNews" :key="code" :value="code">{{ l.name }}</option>
              </select>
              <button
                @click="handleAddLang"
                type="button"
                class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <div v-for="lang in activeNewsLangs" :key="'lang_group_' + lang" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative">
            <div class="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
              <span class="flag-emoji text-lg">{{ languages[lang]?.flag }}</span>
              <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {{ languages[lang]?.name }} <span v-if="lang === 'it'" class="text-amber-600">(Predefinito)</span>
              </h5>
            </div>

            <button
              v-if="lang !== 'it'"
              @click="$emit('delete-lang', lang)"
              type="button"
              class="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1.5 bg-white rounded-md shadow-sm border border-red-100 transition"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Titolo</label>
              <input
                v-model="newsForm.customTitle[lang]"
                type="text"
                class="w-full text-sm py-2 px-3 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
              >
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Testo Messaggio</label>
              <textarea
                v-model="newsForm.customContent[lang]"
                rows="3"
                class="w-full text-sm py-2 px-3 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Servizio Collegato -->
        <div class="mt-4 pt-4 border-t border-slate-100">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Collega a un Servizio (Opzionale)</label>
          <select
            v-model="newsForm.related_service_id"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option :value="null">Nessun servizio collegato</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ translateField(s, 'name') }} ({{ s.organization }})</option>
          </select>
        </div>
      </div>

      <!-- Sticky Save Bar -->
      <div class="bg-slate-900 text-white p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-40">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-cloud-arrow-up text-amber-400 text-lg"></i>
          <span class="text-xs sm:text-sm font-medium">Tutto pronto per la pubblicazione</span>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            @click="$emit('cancel')"
            type="button"
            :disabled="savingNewsId"
            class="flex-1 sm:flex-initial py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            @click="$emit('save')"
            :disabled="savingNewsId"
            type="button"
            class="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2"
          >
            <i v-if="savingNewsId" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-check"></i>
            <span>{{ savingNewsId ? 'Pubblicazione...' : (newsForm.id ? 'Salva Modifiche' : 'Pubblica Notizia') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  globalNews: Array,
  isLoading: Boolean,
  editingNews: Object,
  newsForm: Object,
  savingNewsId: Boolean,
  services: Array,
  templates: Array,
  languages: Object,
  availableLangsForNews: Object,
  activeNewsLangs: Array,
  isRTL: Boolean,
  t: Function,
  translateField: Function,
  formatNewsDate: Function,
  getNewsTypeStyle: Function,
  isUrgency: Function,
  setNewsUrgency: Function,
  generateTemplateText: Function
})

const emit = defineEmits([
  'start-creating',
  'start-editing',
  'cancel',
  'save',
  'delete',
  'add-lang',
  'delete-lang'
])

const selectedNewLang = ref('')

const selectedNewsTemplate = computed(() => {
  return props.templates?.find(t => t.id === props.newsForm.template)
})

const handleAddLang = () => {
  if (selectedNewLang.value) {
    emit('add-lang', selectedNewLang.value)
    selectedNewLang.value = ''
  }
}
</script>
