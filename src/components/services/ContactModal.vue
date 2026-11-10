<template>
  <div
    v-if="service"
    @click.self="$emit('close')"
    class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
  >
    <div
      class="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 transform transition-transform"
      :class="{'text-right': isRTL}"
    >
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="text-xs font-bold text-brand-600 uppercase tracking-wider block">{{ service.organization }}</span>
          <h3 class="text-lg font-bold text-slate-800 mt-0.5">{{ translateField(service, 'name') }}</h3>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center shrink-0"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="space-y-3">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ t('choose_contact_method') }}</p>

        <a
          v-if="service.phone"
          :href="'tel:' + service.phone"
          class="flex items-center justify-between p-4 rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-semibold transition group"
        >
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg shadow-sm">
              <i class="fa-solid fa-phone"></i>
            </div>
            <div>
              <span class="text-xs text-brand-700 block font-normal">{{ t('call_now') }}</span>
              <span class="text-base font-bold">{{ service.phone }}</span>
            </div>
          </div>
          <i class="fa-solid fa-chevron-right text-brand-400 group-hover:translate-x-1 transition-transform" :class="{'rtl-flip': isRTL}"></i>
        </a>

        <a
          v-if="service.email"
          :href="'mailto:' + service.email"
          class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold transition group"
        >
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center text-lg shadow-sm">
              <i class="fa-solid fa-envelope"></i>
            </div>
            <div>
              <span class="text-xs text-slate-500 block font-normal">{{ t('send_email') }}</span>
              <span class="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">{{ service.email }}</span>
            </div>
          </div>
          <i class="fa-solid fa-chevron-right text-slate-400 group-hover:translate-x-1 transition-transform" :class="{'rtl-flip': isRTL}"></i>
        </a>

        <a
          :href="getNavigationUrl(service.address)"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold transition group"
        >
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
              <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
              <span class="text-xs text-emerald-700 block font-normal">{{ t('open_maps') }}</span>
              <span class="text-sm font-bold">{{ service.address }}</span>
            </div>
          </div>
          <i class="fa-solid fa-arrow-up-right-from-square text-emerald-500"></i>
        </a>
      </div>

      <button
        @click="$emit('close')"
        class="w-full py-3 text-center text-xs font-bold text-slate-400 hover:text-slate-600"
      >
        {{ t('close') }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  service: Object,
  isRTL: Boolean,
  t: Function,
  translateField: Function,
  getNavigationUrl: Function
})

defineEmits(['close'])
</script>
