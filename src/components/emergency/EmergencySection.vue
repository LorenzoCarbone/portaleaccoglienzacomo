<template>
  <main class="p-4 sm:p-6 space-y-6 animate-fadeIn max-w-4xl mx-auto">
    <div class="bg-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-md">
      <h2 class="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
        <i class="fa-solid fa-phone-volume animate-bounce"></i>
        <span>{{ t('emergency_title') }}</span>
      </h2>
      <p class="text-red-100 text-sm sm:text-base">{{ t('emergency_sub') }}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <a
        href="tel:112"
        class="bg-white p-6 rounded-3xl border-2 border-red-500/30 hover:border-red-500 card-shadow flex items-center justify-between group transition"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-3xl font-bold group-hover:scale-110 transition">
            112
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-lg">{{ t('em_112_title') }}</h4>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">{{ t('em_112_desc') }}</p>
          </div>
        </div>
        <div class="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md text-lg">
          <i class="fa-solid fa-phone"></i>
        </div>
      </a>

      <a
        href="tel:118"
        class="bg-white p-6 rounded-3xl border border-slate-200 hover:border-slate-300 card-shadow flex items-center justify-between group transition"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl font-bold group-hover:scale-110 transition">
            118
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-lg">{{ t('em_118_title') }}</h4>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">{{ t('em_118_desc') }}</p>
          </div>
        </div>
        <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md text-lg">
          <i class="fa-solid fa-truck-medical"></i>
        </div>
      </a>
    </div>

    <div class="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
      <h3 class="font-bold text-slate-800 text-base uppercase tracking-wider text-brand-700">
        {{ t('em_street_unit_title') }}
      </h3>
      <p class="text-sm text-slate-600 leading-relaxed">{{ t('em_street_unit_desc') }}</p>
      <div class="pt-2 flex flex-wrap gap-3">
        <a
          href="tel:+390310000000"
          class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-5 py-3 rounded-xl text-sm flex items-center gap-2.5 transition"
        >
          <i class="fa-solid fa-phone text-brand-600 text-base"></i>
          <span>{{ t('call_coordination') }}</span>
        </a>
      </div>
    </div>
  </main>
</template>

<script setup>
defineProps({
  t: Function
})
</script>
