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
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold">
            <i class="fa-solid fa-share-nodes"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-lg leading-tight">{{ t('share_title') }}</h3>
            <p class="text-xs text-slate-500 truncate max-w-[200px]">{{ translateField(service, 'name') }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center shrink-0"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {{ t('share_lang_label') }}
          </label>
          <select
            :value="shareLang"
            @input="$emit('update:shareLang', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option v-for="(lang, code) in languages" :key="code" :value="code">
              {{ lang.flag }} {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            @click="$emit('share', 'whatsapp')"
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-bold transition active:scale-95"
          >
            <i class="fa-brands fa-whatsapp text-2xl"></i>
            <span class="text-xs">WhatsApp</span>
          </button>

          <button
            @click="$emit('share', 'telegram')"
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] font-bold transition active:scale-95"
          >
            <i class="fa-brands fa-telegram text-2xl"></i>
            <span class="text-xs">Telegram</span>
          </button>

          <button
            @click="$emit('share', 'email')"
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold transition active:scale-95"
          >
            <i class="fa-solid fa-envelope text-2xl"></i>
            <span class="text-xs">Email</span>
          </button>

          <button
            @click="$emit('share', 'copy')"
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border font-bold transition active:scale-95"
            :class="isCopied ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'"
          >
            <i class="fa-solid text-2xl" :class="isCopied ? 'fa-check' : 'fa-copy'"></i>
            <span class="text-xs">{{ isCopied ? t('copied_success') : t('btn_copy') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  service: Object,
  shareLang: String,
  languages: Object,
  isCopied: Boolean,
  isRTL: Boolean,
  t: Function,
  translateField: Function
})

defineEmits(['close', 'share', 'update:shareLang'])
</script>
