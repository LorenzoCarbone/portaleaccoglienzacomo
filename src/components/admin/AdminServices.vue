<template>
  <div>
    <!-- Lista Servizi -->
    <div v-if="!editingService" class="space-y-6">
      <div class="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Pannello Operatori</span>
          <h2 class="text-2xl sm:text-3xl font-bold leading-tight">Gestione Servizi Como</h2>
          <p class="text-emerald-100 text-sm mt-1">Aggiorna lo stato, gli orari o i contatti dei servizi mappati.</p>
        </div>
        <button
          @click="$emit('start-creating')"
          class="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 transition active:scale-95 shrink-0"
        >
          <i class="fa-solid fa-plus"></i>
          <span>Nuovo Servizio</span>
        </button>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden card-shadow divide-y divide-slate-100">
        <div class="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="$emit('select-all', $event)"
              class="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            >
            <span>Servizi ({{ services.length }})</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="selectedServices.size > 0"
              @click="$emit('delete-selected')"
              class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition normal-case font-bold"
              :disabled="isDeleting"
            >
              <i class="fa-solid" :class="isDeleting ? 'fa-circle-notch fa-spin' : 'fa-trash'"></i>
              <span class="hidden sm:inline">Elimina ({{ selectedServices.size }})</span>
              <span class="sm:hidden">({{ selectedServices.size }})</span>
            </button>
            <span v-else>Stato Attuale</span>
          </div>
        </div>

        <div
          v-for="service in services"
          :key="service.id"
          @click="$emit('start-editing', service)"
          class="p-4 sm:p-5 hover:bg-brand-50/60 transition cursor-pointer flex items-center justify-between gap-4 group active:bg-brand-100/50"
        >
          <div class="flex items-center gap-3.5 overflow-hidden flex-1">
            <div class="shrink-0" @click.stop>
              <input
                type="checkbox"
                :checked="selectedServices.has(service.id)"
                @change="$emit('toggle-select', service.id, $event)"
                class="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              >
            </div>
            <div class="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-brand-100 text-slate-700 group-hover:text-brand-700 flex items-center justify-center text-2xl shrink-0 transition shadow-sm">
              <span>{{ getCategoryIcon(service.category) }}</span>
            </div>
            <div class="overflow-hidden">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{{ service.organization }}</span>
              <h4 class="font-bold text-slate-800 text-sm sm:text-base group-hover:text-brand-700 transition truncate">{{ translateField(service, 'name') }}</h4>
              <p class="text-xs text-slate-500 truncate mt-0.5">
                <i class="fa-solid fa-location-dot text-slate-400 mr-1"></i>{{ service.address }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <span
              class="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm flex items-center gap-1.5"
              :class="[
                service.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : service.status === 'notice' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-red-100 text-red-800 border border-red-300'
              ]"
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="service.status === 'active' ? 'bg-emerald-500' : (service.status === 'notice' ? 'bg-amber-500' : 'bg-red-500')"
              ></span>
              <span class="hidden sm:inline">{{ service.status === 'active' ? 'Regolare' : (service.status === 'notice' ? 'Variazione' : 'Sospeso') }}</span>
            </span>
            <button
              @click.stop="$emit('delete-single', service, $event)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
              title="Elimina"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
            <button
              class="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-600 text-slate-400 group-hover:text-white flex items-center justify-center text-xs transition"
              title="Modifica"
            >
              <i class="fa-solid fa-chevron-right" :class="{'rtl-flip': isRTL}"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modifica / Creazione Servizio -->
    <div v-else class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 card-shadow sticky top-20 z-30">
        <button
          @click="$emit('cancel')"
          class="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-bold text-xs sm:text-sm bg-slate-100 hover:bg-brand-50 px-3.5 py-2 rounded-xl transition active:scale-95"
        >
          <i class="fa-solid fa-arrow-left" :class="{'rtl-flip': isRTL}"></i>
          <span>Indietro</span>
        </button>
        <div class="text-right overflow-hidden pr-2">
          <span class="text-[10px] uppercase font-bold text-brand-600 tracking-wider block truncate">
            {{ editForm.id ? 'Modifica In Corso:' : 'Nuovo Servizio' }}
          </span>
          <span class="font-bold text-slate-800 text-xs sm:text-sm truncate block">
            {{ translateField(editingService, 'name') || 'Compila la scheda' }}
          </span>
        </div>
      </div>

      <!-- Sezione Nome e Descrizione -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm shadow-sm">
            <i class="fa-solid fa-language"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-base">Nome e Descrizione</h3>
            <p class="text-xs text-slate-500">Gestisci i testi del servizio in più lingue.</p>
          </div>
        </div>

        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
            <h4 class="text-sm font-bold uppercase text-slate-700">1. Nome Servizio</h4>
            <div class="flex items-center gap-2">
              <select v-model="selectedNewLangName" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none">
                <option value="">Aggiungi lingua...</option>
                <option v-for="(l, code) in availableLangsForName" :key="code" :value="code">{{ l.name }}</option>
              </select>
              <button
                @click="handleAddLangName"
                type="button"
                class="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
          <div v-for="(text, lang) in editForm.name" :key="'name_' + lang" class="relative">
            <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
              <span class="flag-emoji text-sm">{{ languages[lang]?.flag }}</span> {{ languages[lang]?.name }} <span v-if="lang === 'it'">(Predefinito)</span>
            </label>
            <input
              v-model="editForm.name[lang]"
              type="text"
              class="w-full text-sm py-2 px-3 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
            >
            <button
              v-if="lang !== 'it'"
              @click="delete editForm.name[lang]"
              type="button"
              class="absolute top-6 right-2 text-red-500 hover:text-red-700 p-1.5 bg-white rounded-md shadow-sm"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
            <h4 class="text-sm font-bold uppercase text-slate-700">2. Descrizione Servizio</h4>
            <div class="flex items-center gap-2">
              <select v-model="selectedNewLangDesc" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none">
                <option value="">Aggiungi lingua...</option>
                <option v-for="(l, code) in availableLangsForDesc" :key="code" :value="code">{{ l.name }}</option>
              </select>
              <button
                @click="handleAddLangDesc"
                type="button"
                class="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
          <div v-for="(text, lang) in editForm.description" :key="'desc_' + lang" class="relative">
            <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
              <span class="flag-emoji text-sm">{{ languages[lang]?.flag }}</span> {{ languages[lang]?.name }} <span v-if="lang === 'it'">(Predefinito)</span>
            </label>
            <textarea
              v-model="editForm.description[lang]"
              rows="3"
              class="w-full text-sm py-2 px-3 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
            ></textarea>
            <button
              v-if="lang !== 'it'"
              @click="delete editForm.description[lang]"
              type="button"
              class="absolute top-6 right-2 text-red-500 hover:text-red-700 p-1.5 bg-white rounded-md shadow-sm"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Categoria & Ente -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Categoria Servizio</label>
            <select v-model="editForm.category" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ t(cat.labelKey) }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Ente Gestore</label>
            <select v-model="editForm.organization_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500">
              <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>
        </div>

        <!-- Sezione Tags -->
        <div class="border-t border-slate-100 pt-4 mt-4">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Tag & Parole Chiave (Ricerca Smart)</label>
          <p class="text-[10px] text-slate-500 mb-2">Seleziona le etichette per aiutare gli utenti a trovare questo servizio cercando parole specifiche.</p>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="tag in dbTags"
              :key="tag.id"
              class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition"
              :title="tag.translations?.it"
            >
              <input type="checkbox" :value="tag.id" v-model="editForm.tags" class="text-brand-600 focus:ring-brand-500 rounded border-slate-300">
              <span class="text-xs font-bold text-slate-700 uppercase">{{ tag.id.replace('tag_', '').replaceAll('_', ' ') }}</span>
            </label>
            <p v-if="dbTags.length === 0" class="text-xs text-red-500">Nessun tag configurato. Creali nella sezione "Smart Tags".</p>
          </div>
        </div>
      </div>

      <!-- Sezione Stato e Avviso -->
      <div class="bg-white rounded-3xl border-2 border-brand-500/20 p-5 sm:p-6 card-shadow space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div class="w-8 h-8 rounded-xl bg-warm-500 text-white flex items-center justify-center text-sm shadow-sm">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-base">Visibilità e Stato Apertura</h3>
            <p class="text-xs text-slate-500">Controlla come il servizio appare in mappa.</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Stato Accessibilità:</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="editForm.status = 'active'"
              type="button"
              class="py-3 px-2 rounded-xl text-xs font-bold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition active:scale-95"
              :class="editForm.status === 'active' ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
            >
              <span class="w-2.5 h-2.5 rounded-full" :class="editForm.status === 'active' ? 'bg-white' : 'bg-emerald-500'"></span>
              <span>Regolare</span>
            </button>
            <button
              @click="editForm.status = 'notice'"
              type="button"
              class="py-3 px-2 rounded-xl text-xs font-bold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition active:scale-95"
              :class="editForm.status === 'notice' ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
            >
              <span class="w-2.5 h-2.5 rounded-full" :class="editForm.status === 'notice' ? 'bg-white' : 'bg-amber-500'"></span>
              <span>Variazione</span>
            </button>
            <button
              @click="editForm.status = 'suspended'"
              type="button"
              class="py-3 px-2 rounded-xl text-xs font-bold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition active:scale-95"
              :class="editForm.status === 'suspended' ? 'bg-red-600 border-red-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
            >
              <span class="w-2.5 h-2.5 rounded-full" :class="editForm.status === 'suspended' ? 'bg-white' : 'bg-red-600'"></span>
              <span>Sospeso</span>
            </button>
          </div>
        </div>

        <div class="mt-4 border-t border-slate-100 pt-4">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Avviso rapido in scheda:</label>
          <select
            v-model="editForm.noticeTemplate"
            @change="editForm.noticeParams = {}"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-brand-500 transition"
          >
            <option value="none">Nessun avviso in scheda</option>
            <option value="custom">-- TESTO LIBERO (Inserimento Manuale) --</option>
            <optgroup label="Avvisi Ordinari">
              <option v-for="tpl in templates.filter(t => t.category === 'ordinary')" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
            </optgroup>
            <optgroup label="Variazioni e Straordinari">
              <option v-for="tpl in templates.filter(t => t.category === 'extraordinary')" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
            </optgroup>
            <optgroup label="Emergenze">
              <option v-for="tpl in templates.filter(t => t.category === 'emergency')" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
            </optgroup>
          </select>

          <div
            v-if="selectedNoticeTemplate && editForm.noticeTemplate !== 'custom' && selectedNoticeTemplate.params.length > 0"
            class="mt-3 space-y-3 p-4 bg-brand-50 border border-brand-100 rounded-xl"
          >
            <div v-for="param in selectedNoticeTemplate.params" :key="param.id" class="w-full">
              <label class="block text-xs font-bold text-brand-700 mb-1 capitalize">{{ param.label }}</label>
              <input
                v-model="editForm.noticeParams[param.id]"
                :type="param.type"
                class="w-full text-sm py-2 px-3 rounded-lg border border-brand-200 text-slate-800 focus:ring-2 focus:ring-brand-500 shadow-sm"
              >
            </div>
          </div>

          <div v-if="editForm.noticeTemplate === 'custom'" class="mt-3 p-4 bg-brand-50 border border-brand-100 rounded-xl space-y-4">
            <div class="flex items-center justify-between border-b border-brand-200 pb-2">
              <h4 class="text-xs font-bold uppercase text-brand-800">Testo Avviso Libero</h4>
              <div class="flex items-center gap-2">
                <select v-model="selectedNewLangService" class="text-xs border border-brand-200 rounded-lg px-2 py-1 bg-white outline-none">
                  <option value="">Aggiungi lingua...</option>
                  <option v-for="(l, code) in availableLangsForServiceCustom" :key="code" :value="code">{{ l.name }}</option>
                </select>
                <button
                  @click="handleAddLangNotice"
                  type="button"
                  class="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition"
                >
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div v-for="(text, lang) in editForm.customNotice" :key="'notice_' + lang" class="relative">
              <label class="block text-[10px] font-bold text-brand-700 mb-1 uppercase flex items-center gap-1">
                <span class="flag-emoji">{{ languages[lang]?.flag }}</span> {{ languages[lang]?.name }} <span v-if="lang === 'it'">(Predefinito)</span>
              </label>
              <textarea
                v-model="editForm.customNotice[lang]"
                rows="2"
                class="w-full text-sm py-2 px-3 rounded-lg border border-brand-200 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
              ></textarea>
              <button
                v-if="lang !== 'it'"
                @click="delete editForm.customNotice[lang]"
                type="button"
                class="absolute top-6 right-2 text-red-500 hover:text-red-700 p-1.5 bg-white rounded-md shadow-sm"
              >
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>

          <div
            v-if="editForm.noticeTemplate !== 'none' && editForm.noticeTemplate !== 'custom'"
            class="mt-2 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700"
          >
            <span class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Anteprima Avviso (IT)</span>
            <strong>{{ generateTemplateText(editForm.noticeTemplate, editForm.noticeParams, 'it') }}</strong>
          </div>
        </div>
      </div>

      <!-- Sezione Orari -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm shadow-sm">
            <i class="fa-regular fa-clock"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-base">Orari e Operatività</h3>
            <p class="text-xs text-slate-500">Imposta i giorni e le fasce orarie in cui il servizio è attivo.</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Costruttore Orari</label>
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div v-for="(slot, index) in editForm.hoursList" :key="index" class="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <select v-model="slot.day" class="flex-1 sm:w-1/3 bg-white px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                  <option v-for="d in daysOfWeek" :key="d.id" :value="d.id">{{ d.label.it }}</option>
                </select>
                <div class="flex items-center gap-1 w-full sm:w-auto">
                  <input v-model="slot.open" type="time" class="w-full sm:w-28 bg-white px-2 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                  <span class="text-slate-400 font-bold">-</span>
                  <input v-model="slot.close" type="time" class="w-full sm:w-28 bg-white px-2 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                </div>
                <button
                  @click="editForm.hoursList.splice(index, 1)"
                  type="button"
                  class="w-full sm:w-10 h-10 rounded-lg bg-white border border-slate-300 text-red-500 hover:bg-red-50 flex items-center justify-center transition shrink-0"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
              <button
                @click="editForm.hoursList.push({ day: 1, open: '09:00', close: '12:00' })"
                type="button"
                class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-2 py-1 transition mt-2"
              >
                <i class="fa-solid fa-plus-circle"></i> Aggiungi fascia oraria
              </button>
            </div>
          </div>

          <!-- Modulo Info Temporanee -->
          <div class="border-t border-slate-100 pt-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-amber-600">Info / Orari Temporanei</label>
              <div class="flex items-center gap-2">
                <select v-model="selectedNewLangTemp" class="text-xs border border-amber-200 rounded-lg px-2 py-1 bg-white outline-none">
                  <option value="">Aggiungi lingua...</option>
                  <option v-for="(l, code) in availableLangsForTemp" :key="code" :value="code">{{ l.name }}</option>
                </select>
                <button
                  @click="handleAddLangTemp"
                  type="button"
                  class="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition"
                >
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
            <p class="text-[11px] text-slate-500 mb-3">Usa questo campo per indicare chiusure feriali prolungate, orari estivi o note temporanee.</p>

            <div class="space-y-3">
              <div v-for="(text, lang) in editForm.temp_info" :key="'temp_' + lang" class="relative">
                <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                  <span class="flag-emoji">{{ languages[lang]?.flag }}</span> {{ languages[lang]?.name }}
                </label>
                <textarea
                  v-model="editForm.temp_info[lang]"
                  rows="2"
                  placeholder="Es: Chiuso per ferie dal 10 al 20 Agosto."
                  class="w-full text-sm py-2 px-3 rounded-lg border border-amber-200 bg-amber-50 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                ></textarea>
                <button
                  v-if="lang !== 'it'"
                  @click="delete editForm.temp_info[lang]"
                  type="button"
                  class="absolute top-6 right-2 text-red-500 hover:text-red-700 p-1.5 bg-white rounded-md shadow-sm"
                >
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sezione Luogo e Contatti -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 card-shadow space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm shadow-sm">
            <i class="fa-solid fa-map-location-dot"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-base">Luogo e Contatti</h3>
            <p class="text-xs text-slate-500">Dove si trova e come contattare il servizio.</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Indirizzo (senza 'Como')</label>
          <div class="relative">
            <input
              v-model="editForm.address"
              type="text"
              required
              placeholder="Es. Camerlata, via..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-brand-500 transition"
            >
            <i class="fa-solid fa-location-dot absolute top-3 left-3.5 text-slate-400 text-xs"></i>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Telefono</label>
            <div class="relative">
              <input
                v-model="editForm.phone"
                type="tel"
                placeholder="Es. +39 031 123456"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition"
              >
              <i class="fa-solid fa-phone absolute top-3 left-3.5 text-slate-400 text-xs"></i>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email Contatto</label>
            <div class="relative">
              <input
                v-model="editForm.email"
                type="email"
                placeholder="Es. info@vicinidistrada.it"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition"
              >
              <i class="fa-solid fa-envelope absolute top-3 left-3.5 text-slate-400 text-xs"></i>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Immagine Copertina</label>
          <div class="flex items-start gap-4">
            <div
              tabindex="0"
              @paste="$emit('paste-image', $event)"
              class="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 hover:border-brand-400 overflow-hidden shrink-0 flex items-center justify-center focus:ring-2 focus:ring-brand-500 cursor-pointer focus:outline-none transition-colors"
              title="Clicca qui e premi CTRL+V per incollare un'immagine"
            >
              <img v-if="editForm.image" :src="editForm.image" alt="Anteprima" class="w-full h-full object-cover">
              <div v-else class="text-center">
                <i class="fa-solid fa-image text-slate-300 text-2xl mb-1"></i>
                <span class="block text-[8px] font-bold text-slate-400">CTRL+V</span>
              </div>
            </div>
            <div class="flex-1 space-y-2 min-w-0">
              <input
                v-model="editForm.image"
                type="url"
                placeholder="Incolla link immagine o caricala"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-brand-500 transition"
              >
              <div class="flex items-center gap-2">
                <label
                  class="flex-1 cursor-pointer bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition"
                  :class="{'opacity-60 pointer-events-none': uploadingImage}"
                >
                  <i v-if="uploadingImage" class="fa-solid fa-circle-notch fa-spin"></i>
                  <i v-else class="fa-solid fa-upload"></i>
                  <span>{{ uploadingImage ? 'Caricamento...' : 'Carica file' }}</span>
                  <input type="file" accept="image/*" class="hidden" @change="$emit('upload-image', $event)" :disabled="uploadingImage">
                </label>
                <button
                  v-if="editForm.image"
                  @click="editForm.image = ''"
                  type="button"
                  class="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
                >
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
              <p v-if="imageUploadError" class="text-[11px] text-red-600 font-medium">{{ imageUploadError }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra di Salvataggio Sticky -->
      <div class="bg-slate-900 text-white p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-40">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-cloud text-brand-400 text-lg"></i>
          <span class="text-xs sm:text-sm font-medium">Modifiche pronte per il cloud</span>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            @click="$emit('cancel')"
            type="button"
            :disabled="savingServiceId"
            class="flex-1 sm:flex-initial py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            @click="$emit('save')"
            :disabled="savingServiceId"
            type="button"
            class="flex-1 sm:flex-initial bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm shadow-lg shadow-brand-500/30 transition flex items-center justify-center gap-2"
          >
            <i v-if="savingServiceId" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-check"></i>
            <span>{{ savingServiceId ? 'Salvataggio...' : 'Salva Modifiche Online' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  services: Array,
  categories: Array,
  organizations: Array,
  dbTags: Array,
  templates: Array,
  daysOfWeek: Array,
  editingService: Object,
  editForm: Object,
  selectedServices: Object,
  isAllSelected: Boolean,
  isDeleting: Boolean,
  savingServiceId: Boolean,
  uploadingImage: Boolean,
  imageUploadError: String,
  languages: Object,
  isRTL: Boolean,
  t: Function,
  translateField: Function,
  getCategoryIcon: Function,
  generateTemplateText: Function
})

const emit = defineEmits([
  'start-creating',
  'start-editing',
  'cancel',
  'save',
  'select-all',
  'toggle-select',
  'delete-selected',
  'delete-single',
  'upload-image',
  'paste-image'
])

const selectedNewLangName = ref('')
const selectedNewLangDesc = ref('')
const selectedNewLangTemp = ref('')
const selectedNewLangService = ref('')

const selectedNoticeTemplate = computed(() => {
  return props.templates?.find(t => t.id === props.editForm.noticeTemplate)
})

const availableLangsForName = computed(() => {
  const available = {}
  for (const code in props.languages) {
    if (code !== 'it' && props.editForm.name && props.editForm.name[code] === undefined) {
      available[code] = props.languages[code]
    }
  }
  return available
})

const availableLangsForDesc = computed(() => {
  const available = {}
  for (const code in props.languages) {
    if (code !== 'it' && props.editForm.description && props.editForm.description[code] === undefined) {
      available[code] = props.languages[code]
    }
  }
  return available
})

const availableLangsForTemp = computed(() => {
  const available = {}
  for (const code in props.languages) {
    if (code !== 'it' && props.editForm.temp_info && props.editForm.temp_info[code] === undefined) {
      available[code] = props.languages[code]
    }
  }
  return available
})

const availableLangsForServiceCustom = computed(() => {
  const available = {}
  for (const code in props.languages) {
    if (code !== 'it' && props.editForm.customNotice && props.editForm.customNotice[code] === undefined) {
      available[code] = props.languages[code]
    }
  }
  return available
})

const handleAddLangName = () => {
  if (selectedNewLangName.value) {
    props.editForm.name[selectedNewLangName.value] = ''
    selectedNewLangName.value = ''
  }
}

const handleAddLangDesc = () => {
  if (selectedNewLangDesc.value) {
    props.editForm.description[selectedNewLangDesc.value] = ''
    selectedNewLangDesc.value = ''
  }
}

const handleAddLangTemp = () => {
  if (selectedNewLangTemp.value) {
    props.editForm.temp_info[selectedNewLangTemp.value] = ''
    selectedNewLangTemp.value = ''
  }
}

const handleAddLangNotice = () => {
  if (selectedNewLangService.value) {
    props.editForm.customNotice[selectedNewLangService.value] = ''
    selectedNewLangService.value = ''
  }
}
</script>
