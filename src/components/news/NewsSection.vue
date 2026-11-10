<template>
  <main class="p-4 sm:p-6 space-y-6 animate-fadeIn max-w-4xl mx-auto">
    <div class="bg-gradient-to-r from-amber-500 to-warm-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-3xl">📢</span>
        <h2 class="text-2xl sm:text-3xl font-bold">{{ t('news_page_title') }}</h2>
      </div>
      <p class="text-white/90 text-sm sm:text-base max-w-xl">{{ t('news_page_sub') }}</p>
    </div>

    <div v-if="isLoading" class="text-center py-16">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-amber-500 mb-4 inline-block"></i>
      <p class="text-sm text-slate-500 font-medium">Caricamento notizie in corso...</p>
    </div>

    <div v-else-if="newsList.length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <span class="text-6xl block mb-4">📭</span>
      <h4 class="font-bold text-slate-700 text-lg mb-1">Nessuna notizia al momento</h4>
      <p class="text-sm text-slate-500 max-w-sm mx-auto">Gli aggiornamenti dalle unità di strada e dalle associazioni compariranno qui.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="news in newsList"
        :key="news.id"
        class="bg-white rounded-3xl border border-slate-200 p-6 card-shadow relative overflow-hidden"
        :class="{'border-red-200 ring-1 ring-red-100': news.type === 'emergency'}"
      >
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex items-center flex-wrap gap-2">
            <span
              class="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
              :class="getNewsTypeStyle(news.type).badgeClass"
            >
              <i :class="getNewsTypeStyle(news.type).icon"></i>
            </span>
            <span
              class="px-3 py-1 rounded-full text-xs font-bold"
              :class="news.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
            >
              {{ news.priority === 'high' ? t('priority_urgent') : t('priority_info') }}
            </span>
            <span class="text-xs font-bold text-slate-400">{{ news.association }}</span>
          </div>
          <span class="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <i class="fa-regular fa-clock text-[10px]"></i>{{ formatNewsDate(news.created_at) }}
          </span>
        </div>

        <h4 class="font-bold text-slate-800 text-lg mb-2">{{ translateField(news, 'title') }}</h4>
        <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{{ translateField(news, 'content') }}</p>

        <div
          v-if="news.related_service_id"
          class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2"
        >
          <span class="text-xs text-slate-500 font-medium">
            {{ t('related_service') }}: <strong class="text-slate-700">{{ getServiceName(news.related_service_id) }}</strong>
          </span>
          <button
            @click="$emit('go-to-service', news.related_service_id)"
            class="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1.5"
          >
            <span>{{ t('go_to_card') }}</span>
            <i class="fa-solid fa-arrow-right text-[10px]" :class="{'rtl-flip': isRTL}"></i>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
defineProps({
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
</script>
