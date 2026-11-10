<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">{{ t('categories_title') }}</h3>
      <button
        v-if="selectedCategory !== 'all'"
        @click="$emit('select-category', 'all')"
        class="text-xs font-semibold text-brand-600 hover:underline"
      >
        {{ t('show_all') }}
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
      <button
        @click="$emit('select-category', 'all')"
        class="p-3.5 rounded-2xl border transition text-center flex flex-col items-center justify-center gap-1.5 min-h-[85px]"
        :class="selectedCategory === 'all' ? 'bg-brand-600 border-brand-600 text-white font-bold shadow-md scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50/50'"
      >
        <span class="text-2xl">🌍</span>
        <span class="text-xs leading-tight">{{ t('cat_all') }}</span>
      </button>

      <template v-for="cat in categories" :key="cat.id">
        <button
          v-if="getServiceCount(cat.id) > 0"
          @click="$emit('select-category', cat.id)"
          class="p-3.5 rounded-2xl border transition text-center flex flex-col items-center justify-center gap-1.5 min-h-[85px] relative overflow-hidden"
          :class="selectedCategory === cat.id ? 'bg-brand-600 border-brand-600 text-white font-bold shadow-md scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50/50'"
        >
          <span class="text-2xl">{{ cat.icon }}</span>
          <span class="text-xs leading-tight">{{ t(cat.labelKey) }}</span>
          <span
            class="absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            :class="selectedCategory === cat.id ? 'bg-white text-brand-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ getServiceCount(cat.id) }}
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: Array,
  selectedCategory: String,
  getServiceCount: Function,
  t: Function
})

defineEmits(['select-category'])
</script>
