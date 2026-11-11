<template>
  <div
    v-if="isOpen"
    @click.self="$emit('close')"
    class="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
  >
    <div
      class="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 transform transition-transform text-slate-800"
    >
      <!-- Header con Icona Campana -->
      <div class="flex items-start justify-between">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-brand-700 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-600/30">
          <i class="fa-solid fa-bell animate-pulse"></i>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          title="Chiudi"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Titolo e Descrizione -->
      <div class="space-y-1.5">
        <h3 class="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">
          Vuoi attivare le notifiche?
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Rimani aggiornato sui servizi per la grave marginalità a Como direttamente sul tuo telefono.
        </p>
      </div>

      <!-- Vantaggi -->
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
        <div class="flex items-center gap-2.5">
          <span class="text-base">❄️</span>
          <span><strong>Piano Freddo:</strong> avvisi su posti letto e aperture straordinarie.</span>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-base">🍲</span>
          <span><strong>Mense e pasti:</strong> variazioni di orario o distribuzioni speciali.</span>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-base">🌐</span>
          <span><strong>Nella tua lingua:</strong> ricevi gli avvisi tradotti nella lingua scelta.</span>
        </div>
      </div>

      <!-- Pulsanti di azione -->
      <div class="space-y-2 pt-1">
        <button
          @click="$emit('accept')"
          class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
        >
          <i class="fa-solid fa-bell"></i>
          <span>Attiva Notifiche</span>
        </button>
        <button
          @click="$emit('dismiss')"
          class="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          Più tardi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean
})

defineEmits(['close', 'accept', 'dismiss'])
</script>
