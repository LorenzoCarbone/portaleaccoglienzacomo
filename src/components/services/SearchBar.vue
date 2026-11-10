<template>
  <div class="bg-gradient-to-r from-brand-700 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative">
    <div class="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none z-0">
      <i class="fa-solid fa-map-location-dot absolute -bottom-6 -right-6 text-9xl text-white/10"></i>
    </div>

    <div class="relative z-10 max-w-2xl">
      <h2 class="text-2xl sm:text-3xl font-bold mb-2">{{ t('welcome_title') }}</h2>
      <p class="text-brand-100 text-sm sm:text-base mb-6">{{ t('welcome_sub') }}</p>

      <div class="relative">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          type="text"
          :placeholder="t('search_placeholder')"
          class="w-full bg-white/95 text-slate-800 placeholder-slate-400 pl-11 pr-10 py-3.5 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30 shadow-inner"
        >
        <i
          class="fa-solid fa-magnifying-glass absolute top-4 left-4 text-slate-400 text-lg"
          :class="{'right-4 left-auto': isRTL}"
        ></i>
        <button
          v-if="modelValue"
          @click="$emit('update:modelValue', '')"
          class="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1"
          :class="{'left-3.5 right-auto': isRTL}"
        >
          <i class="fa-solid fa-circle-xmark text-lg"></i>
        </button>

        <!-- Dropdown Suggerimenti Smart -->
        <div
          v-if="suggestions.length > 0"
          class="absolute top-full left-0 w-full bg-white rounded-2xl shadow-2xl mt-1 z-50 border border-slate-200/60 overflow-hidden py-1"
        >
          <button
            v-for="tag in suggestions"
            :key="tag.id"
            @click="$emit('select-suggestion', tag.text)"
            class="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-800 flex items-center gap-3 transition"
          >
            <i class="fa-solid fa-magnifying-glass text-slate-300 text-sm"></i>
            <span class="font-semibold text-sm">{{ tag.text }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  suggestions: {
    type: Array,
    default: () => []
  },
  isRTL: Boolean,
  t: Function
})

defineEmits(['update:modelValue', 'select-suggestion'])
</script>
