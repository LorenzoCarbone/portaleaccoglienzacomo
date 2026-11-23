<template>
  <main class="px-3.5 py-4 sm:p-6 space-y-4 sm:space-y-6 animate-fadeIn max-w-4xl mx-auto">
    <!-- Hero Sezione Notizie -->
    <div class="bg-gradient-to-r from-amber-500 to-warm-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-md">
      <div class="flex items-center gap-2.5 sm:gap-3 mb-1.5">
        <span class="text-2xl sm:text-3xl leading-none">📢</span>
        <h2 class="text-xl sm:text-3xl font-bold leading-tight">{{ t('news_page_title') }}</h2>
      </div>
      <p class="text-white/90 text-xs sm:text-base leading-relaxed max-w-xl">{{ t('news_page_sub') }}</p>
    </div>

    <!-- Banner Notifiche Push per Notizie Urgenti -->
    <div
      v-if="isSupported"
      class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border card-shadow space-y-3.5"
      :class="!isSubscribed && permissionState === 'denied' ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'"
    >
      <!-- Caso 1: Notifiche bloccate sul telefono -> Guida guidata in 2 passi su misura per il dispositivo -->
      <template v-if="!isSubscribed && permissionState === 'denied'">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0 shadow-xs">
            <i class="fa-solid fa-bell-slash"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-slate-900 text-sm sm:text-base leading-snug">
              Notifiche disattivate sul dispositivo
            </h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Il tuo dispositivo sta bloccando le notifiche per questa app. Puoi sbloccarle in autonomia in 2 passaggi:
            </p>
          </div>
        </div>

        <!-- Istruzioni semplici specifiche per dispositivo -->
        <div class="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-700">
          <!-- Android (sia App/Scorciatoia che Browser) -->
          <template v-if="deviceContext === 'android_pwa' || deviceContext === 'android_browser'">
            <div v-if="browserName && browserName !== 'Chrome'" class="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 font-semibold leading-relaxed">
              Stai usando <strong>{{ browserName }}</strong>, che spesso blocca le notifiche dei siti. Per riceverle senza problemi ti consigliamo di aprire l'app da <strong>Google Chrome</strong>.
            </div>
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p class="leading-relaxed">
                Apri <strong>{{ browserName || 'Chrome' }}</strong> → tocca i <strong>3 puntini (⋮)</strong> in alto a destra → <strong>Impostazioni</strong> → <strong>Impostazioni sito</strong> → <strong>Notifiche</strong>.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p class="leading-relaxed">
                Cerca <strong>lorenzocarbone.github.io</strong> nella lista dei siti bloccati, tocca <strong>Consenti</strong>, poi torna qui e premi il tasto sotto.
              </p>
            </div>
          </template>

          <!-- iPhone / iPad -->
          <template v-else-if="deviceContext === 'ios_pwa' || deviceContext === 'ios_browser'">
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p class="leading-relaxed">
                Apri <strong>Impostazioni</strong> di iPhone → <strong>Notifiche</strong> → <strong>Vicini di Strada</strong>.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p class="leading-relaxed">
                Attiva <strong>Consenti notifiche</strong> e torna su questa schermata.
              </p>
            </div>
          </template>

          <!-- Computer / Desktop -->
          <template v-else>
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p class="leading-relaxed">
                Clicca l'icona delle <strong>impostazioni / lucchetto</strong> in alto a sinistra nella barra dell'indirizzo del browser.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p class="leading-relaxed">
                Imposta <strong>Notifiche → Consenti</strong> e premi il pulsante qui sotto.
              </p>
            </div>
          </template>
        </div>

        <p v-if="pushErrorMessage" class="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 leading-relaxed flex items-start gap-1.5">
          <i class="fa-solid fa-circle-info shrink-0 mt-0.5 text-red-500"></i>
          <span>{{ pushErrorMessage }}</span>
        </p>

        <button
          @click="recheckPermissionAndSubscribe"
          :disabled="isPushLoading"
          class="w-full justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <i :class="isPushLoading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rotate-right'"></i>
          <span>{{ isPushLoading ? 'Verifica in corso...' : 'Ho sbloccato, attiva ora' }}</span>
        </button>
      </template>

      <!-- Caso 2: iPhone Safari fuori dalla schermata Home -->
      <template v-else-if="!isSubscribed && deviceContext === 'ios_browser'">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0">
            <i class="fa-regular fa-bell"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-slate-900 text-sm sm:text-base leading-snug">
              Attiva le notifiche su iPhone
            </h4>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Su iPhone Apple richiede di aggiungere prima l'app alla Home:
            </p>
            <div class="mt-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-700">
              <p><strong>1.</strong> Tocca <strong>Condividi</strong> (<i class="fa-solid fa-arrow-up-from-bracket text-brand-600"></i>) in basso su Safari → <strong>Aggiungi alla schermata Home</strong>.</p>
              <p><strong>2.</strong> Apri l'app dalla nuova icona e premi <strong>Attiva Notifiche</strong>.</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Caso 3: Stato normale (Da attivare con 1 tap oppure Già attive) -->
      <div v-else class="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div class="flex items-start sm:items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0 transition shadow-sm"
            :class="isSubscribed ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-100 text-amber-700'"
          >
            <i :class="isSubscribed ? 'fa-solid fa-bell' : 'fa-regular fa-bell'"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                {{ isSubscribed ? 'Notifiche attive' : 'Ricevi avvisi e allerte' }}
              </h4>
              <span
                v-if="isSubscribed"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shrink-0 whitespace-nowrap"
              >
                <i class="fa-solid fa-check text-[10px] text-emerald-600"></i>
                <span>Attive</span>
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              {{ isSubscribed ? 'Riceverai una notifica sul dispositivo per emergenze e variazioni orari.' : 'Attiva le notifiche per non perdere cambi orari e allerte urgenti a Como.' }}
            </p>
            <p v-if="pushStatusMessage" class="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check shrink-0"></i>
              <span>{{ pushStatusMessage }}</span>
            </p>
            <p v-if="pushErrorMessage" class="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-2.5 py-2 mt-2 leading-relaxed flex items-start gap-1.5">
              <i class="fa-solid fa-triangle-exclamation shrink-0 mt-0.5 text-red-600"></i>
              <span>{{ pushErrorMessage }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t border-slate-100 md:border-t-0">
          <template v-if="!isSubscribed">
            <button
              @click="subscribeToPush"
              :disabled="isPushLoading"
              class="w-full md:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <i :class="isPushLoading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-bell'"></i>
              <span>{{ isPushLoading ? 'Attivazione...' : 'Attiva Notifiche' }}</span>
            </button>
          </template>
          <template v-else>
            <button
              @click="sendTestNotification()"
              :disabled="isPushLoading"
              class="flex-1 md:flex-none justify-center px-3.5 py-2.5 md:py-2 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 border border-slate-200 cursor-pointer disabled:opacity-60"
              title="Invia subito una notifica di prova"
            >
              <i class="fa-solid fa-paper-plane text-[11px] text-emerald-600"></i>
              <span>Prova notifica</span>
            </button>
            <button
              @click="unsubscribeFromPush"
              :disabled="isPushLoading"
              class="px-3 py-2.5 md:py-2 rounded-xl font-semibold text-xs text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 transition border border-slate-200 hover:border-red-200 cursor-pointer shrink-0"
              title="Disattiva notifiche"
            >
              <i class="fa-solid fa-bell-slash"></i>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Stato Caricamento -->
    <div v-if="isLoading" class="text-center py-14">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-amber-500 mb-3 inline-block"></i>
      <p class="text-sm text-slate-500 font-medium">Caricamento notizie in corso...</p>
    </div>

    <!-- Stato Vuoto -->
    <div v-else-if="newsList.length === 0" class="text-center py-14 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-6 shadow-sm">
      <span class="text-5xl block mb-3">📭</span>
      <h4 class="font-bold text-slate-700 text-base sm:text-lg mb-1">Nessuna notizia al momento</h4>
      <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Gli aggiornamenti dalle unità di strada e dai servizi compariranno qui.</p>
    </div>

    <!-- Lista Schede Avvisi (Mobile-first ordinata) -->
    <div v-else class="space-y-3.5 sm:space-y-4">
      <article
        v-for="news in newsList"
        :key="news.id"
        class="bg-white rounded-2xl sm:rounded-3xl border card-shadow overflow-hidden transition"
        :class="getCardBorderClass(news.type)"
      >
        <!-- Barra superiore colorata per riconoscimento immediato della tipologia -->
        <div class="h-1.5 w-full" :class="getTopBarClass(news.type)"></div>

        <div class="p-4 sm:p-6">
          <!-- Riga 1: Tipologia compatta a sinistra + Data/ora a destra (sempre allineate) -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border shrink-0"
              :class="getTypeBadgeClass(news.type)"
            >
              <i :class="getNewsTypeStyle(news.type).icon" class="text-[11px]"></i>
              <span>{{ getTypeLabel(news.type) }}</span>
            </span>

            <time class="text-[11px] sm:text-xs text-slate-400 font-medium inline-flex items-center gap-1 shrink-0">
              <i class="fa-regular fa-clock text-[10px]"></i>
              <span>{{ formatNewsDate(news.created_at) }}</span>
            </time>
          </div>

          <!-- Riga 2: Titolo -->
          <h3 class="font-bold text-slate-900 text-base sm:text-lg leading-snug mb-2 break-words">
            {{ translateField(news, 'title') }}
          </h3>

          <!-- Riga 3: Corpo del messaggio -->
          <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
            {{ translateField(news, 'content') }}
          </p>

          <!-- Riga 4: Scheda servizio collegata (unica, pulita e facile da toccare su mobile) -->
          <button
            v-if="news.related_service_id"
            type="button"
            @click="$emit('go-to-service', news.related_service_id)"
            class="w-full mt-4 p-3 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-brand-50/70 border border-slate-200/80 hover:border-brand-200 transition flex items-center justify-between gap-3 text-left group active:scale-[0.99] cursor-pointer"
          >
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-slate-200 text-brand-600 flex items-center justify-center shrink-0 shadow-xs">
                <i class="fa-solid fa-location-dot text-xs sm:text-sm"></i>
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 block leading-none mb-1">
                  {{ t('related_service') }}
                </span>
                <span class="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-brand-800 block leading-tight line-clamp-2">
                  {{ getServiceName(news.related_service_id) }}
                </span>
              </div>
            </div>

            <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-white border border-slate-200 group-hover:border-brand-300 group-hover:bg-brand-600 group-hover:text-white text-brand-700 text-[11px] sm:text-xs font-bold shrink-0 transition shadow-xs">
              <span class="hidden sm:inline">{{ t('go_to_card') }}</span>
              <i class="fa-solid fa-arrow-right text-[10px]" :class="{'rtl-flip': isRTL}"></i>
            </span>
          </button>
        </div>
      </article>
    </div>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePushNotifications } from '../../composables/usePushNotifications'

const props = defineProps({
  newsList: Array,
  isLoading: Boolean,
  isRTL: Boolean,
  t: Function,
  translateField: Function,
  formatNewsDate: Function,
  getNewsTypeStyle: Function,
  getServiceName: Function
})

defineEmits(['go-to-service'])

const isEmergency = (type) => type === 'emergency'
const isUpdate = (type) => type === 'service_update' || type === 'change'

const getTopBarClass = (type) => {
  if (isEmergency(type)) return 'bg-red-500'
  if (isUpdate(type)) return 'bg-amber-500'
  return 'bg-blue-500'
}

const getCardBorderClass = (type) => {
  if (isEmergency(type)) return 'border-red-200 ring-1 ring-red-100/80'
  if (isUpdate(type)) return 'border-amber-200 ring-1 ring-amber-100/80'
  return 'border-slate-200'
}

const getTypeBadgeClass = (type) => {
  if (isEmergency(type)) return 'bg-red-50 text-red-700 border-red-200'
  if (isUpdate(type)) return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

const getTypeLabel = (type) => {
  if (isEmergency(type)) return props.t('type_emergency')
  if (isUpdate(type)) return props.t('type_update')
  return props.t('type_general')
}

const {
  isSupported,
  isSubscribed,
  permissionState,
  deviceContext,
  browserName,
  isPushLoading,
  pushStatusMessage,
  pushErrorMessage,
  checkExistingSubscription,
  subscribeToPush,
  recheckPermissionAndSubscribe,
  unsubscribeFromPush,
  sendTestNotification
} = usePushNotifications()

onMounted(() => {
  checkExistingSubscription()
})
</script>
