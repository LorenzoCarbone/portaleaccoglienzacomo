<template>
  <div
    v-if="isOpen"
    @click.self="$emit('close')"
    class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
  >
    <div
      class="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 transform transition-transform text-left"
      :class="{'text-right': isRTL}"
    >
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-lg leading-tight">Area Operatori</h3>
            <p class="text-xs text-slate-400 font-medium">Gestione servizi Vicini di Strada</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Login Form -->
      <form v-if="!user" @submit.prevent="$emit('login')" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Operatore</label>
          <div class="relative">
            <input
              :value="authForm.email"
              @input="authForm.email = $event.target.value"
              type="email"
              required
              placeholder="operatore@vicinidistrada.it"
              class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            >
            <i class="fa-regular fa-envelope absolute top-4 right-4 text-slate-400"></i>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
          <div class="relative">
            <input
              :value="authForm.password"
              @input="authForm.password = $event.target.value"
              type="password"
              required
              placeholder="••••••••"
              class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            >
            <i class="fa-solid fa-key absolute top-4 right-4 text-slate-400"></i>
          </div>
        </div>

        <div v-if="authError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 font-medium">
          <i class="fa-solid fa-circle-exclamation text-red-500 text-base shrink-0"></i>
          <span>{{ authError }}</span>
        </div>

        <button
          type="submit"
          :disabled="authLoading"
          class="w-full bg-brand-600 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl text-sm sm:text-base shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
        >
          <i v-if="authLoading" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-right-to-bracket"></i>
          <span>{{ authLoading ? 'Verifica in corso...' : 'Accedi al Pannello' }}</span>
        </button>
      </form>

      <!-- Logged-in State -->
      <div v-else class="space-y-5 py-2">
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
            <i class="fa-solid fa-check"></i>
          </div>
          <div class="overflow-hidden">
            <span class="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Sessione Attiva</span>
            <h4 class="font-bold text-slate-800 truncate text-sm sm:text-base">{{ user.email }}</h4>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <button
            @click="$emit('open-dashboard')"
            class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99]"
          >
            <i class="fa-solid fa-list-check"></i>
            <span>Apri Gestione Servizi & Allerte</span>
          </button>
          <button
            @click="$emit('logout')"
            class="w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-200 active:scale-[0.99]"
          >
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Disconnetti da questo dispositivo</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  user: Object,
  authForm: Object,
  authLoading: Boolean,
  authError: String,
  isRTL: Boolean
})

defineEmits(['close', 'login', 'logout', 'open-dashboard'])
</script>
