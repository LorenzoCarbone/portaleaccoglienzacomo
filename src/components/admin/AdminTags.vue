<template>
  <div>
    <div v-if="!editingTag" class="space-y-6">
      <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Motore di Ricerca</span>
          <h2 class="text-2xl sm:text-3xl font-bold leading-tight">Libreria Smart Tags</h2>
          <p class="text-indigo-100 text-sm mt-1">Crea parole chiave invisibili (es. "cibo") tradotte in più lingue per aiutare la ricerca.</p>
        </div>
        <button
          @click="$emit('start-creating')"
          class="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 transition active:scale-95 shrink-0"
        >
          <i class="fa-solid fa-plus"></i>
          <span>Nuovo Tag</span>
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-16">
        <i class="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500 mb-4 inline-block"></i>
      </div>
      <div v-else-if="dbTags.length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <span class="text-6xl block mb-4">🏷️</span>
        <h4 class="font-bold text-slate-700 text-lg mb-1">Nessun tag configurato</h4>
      </div>
      <div v-else class="bg-white rounded-3xl border border-slate-200 overflow-hidden card-shadow divide-y divide-slate-100">
        <div class="p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Libreria Tag ({{ dbTags.length }})
        </div>
        <div
          v-for="tag in dbTags"
          :key="tag.id"
          class="p-4 hover:bg-indigo-50/50 transition flex items-center justify-between gap-4 group"
        >
          <div @click="$emit('start-editing', tag)" class="flex items-center gap-3 overflow-hidden cursor-pointer flex-1">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-tag"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 uppercase">{{ tag.id.replace('tag_', '').replaceAll('_', ' ') }}</h4>
              <p class="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">{{ tag.translations?.it }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="$emit('start-editing', tag)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              @click="$emit('delete', tag.id)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tag Editor -->
    <div v-else class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 card-shadow sticky top-20 z-30">
        <button
          @click="$emit('cancel')"
          class="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold text-xs sm:text-sm bg-slate-100 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition"
        >
          <i class="fa-solid fa-arrow-left"></i>
          <span>Indietro</span>
        </button>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow space-y-5">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            ID Univoco Tag (Senza spazi, es: 'tag_cibo')
          </label>
          <input
            v-model="tagForm.id"
            :disabled="isEditingExistingTag"
            type="text"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 font-mono"
          >
        </div>

        <div class="border-t border-slate-100 pt-4">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Traduzioni (Ciò che gli utenti cercano)
            </label>
            <div class="flex items-center gap-2">
              <select v-model="selectedNewLang" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 outline-none">
                <option value="">Aggiungi lingua...</option>
                <option v-for="(l, code) in availableLangs" :key="code" :value="code">{{ l.name }}</option>
              </select>
              <button
                @click="handleAddLang"
                type="button"
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow transition"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div v-for="(text, lang) in tagForm.translations" :key="'tag_' + lang" class="relative">
              <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                <span class="flag-emoji text-sm">{{ languages[lang]?.flag }}</span> {{ languages[lang]?.name }}
              </label>
              <input
                v-model="tagForm.translations[lang]"
                type="text"
                placeholder="Es. cibo, food, nourriture..."
                class="w-full text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
              <button
                v-if="lang !== 'it'"
                @click="delete tagForm.translations[lang]"
                type="button"
                class="absolute top-6 right-2 text-red-500 hover:bg-red-50 p-1.5 rounded"
              >
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-slate-900 text-white p-4 rounded-3xl shadow-xl flex items-center justify-end gap-3 sticky bottom-4 z-40">
        <button
          @click="$emit('cancel')"
          :disabled="savingTag"
          class="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition"
        >
          Annulla
        </button>
        <button
          @click="$emit('save')"
          :disabled="savingTag"
          class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl text-sm transition flex items-center gap-2"
        >
          <i v-if="savingTag" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-check"></i>
          Salva Tag
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  dbTags: Array,
  isLoading: Boolean,
  editingTag: Object,
  tagForm: Object,
  savingTag: Boolean,
  isEditingExistingTag: Boolean,
  availableLangs: Object,
  languages: Object
})

const emit = defineEmits(['start-creating', 'start-editing', 'cancel', 'save', 'delete', 'add-lang'])

const selectedNewLang = ref('')

const handleAddLang = () => {
  if (selectedNewLang.value) {
    emit('add-lang', selectedNewLang.value)
    selectedNewLang.value = ''
  }
}
</script>
