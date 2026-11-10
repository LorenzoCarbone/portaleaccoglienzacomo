<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-6 sm:p-8 text-white shadow-md">
      <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Strumenti Avanzati</span>
      <h2 class="text-2xl sm:text-3xl font-bold leading-tight mt-2">Importazione Codice</h2>
      <p class="text-brand-100 text-sm mt-1">Incolla qui lo snippet di codice per creare o aggiornare automaticamente la lista dei servizi.</p>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow space-y-4">
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <h3 class="font-bold text-amber-900 text-sm">Attenzione</h3>
          <p class="text-xs text-amber-800 mt-1">L'esecuzione di codice in quest'area ha accesso diretto al database. Usa solo script verificati.</p>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Codice JavaScript AI</label>
        <textarea
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          rows="10"
          placeholder="// Incolla qui il codice di aggiornamento preparato dall'AI..."
          class="w-full bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm p-4 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-inner"
        ></textarea>
      </div>
      <div class="flex justify-end pt-2">
        <button
          @click="$emit('execute')"
          class="bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold py-3 px-6 rounded-2xl text-sm shadow-md transition flex items-center gap-2"
        >
          <i class="fa-solid fa-play"></i>
          <span>Esegui Snippet</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String
})

defineEmits(['update:modelValue', 'execute'])
</script>
