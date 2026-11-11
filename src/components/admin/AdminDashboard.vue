<template>
  <main class="p-4 sm:p-6 space-y-6 animate-fadeIn max-w-4xl mx-auto">
    <div class="flex gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto no-scrollbar mb-4">
      <button
        @click="adminSection = 'services'; $emit('cancel-all')"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap"
        :class="adminSection === 'services' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'"
      >
        <i class="fa-solid fa-layer-group"></i>
        <span>Servizi</span>
      </button>

      <button
        @click="adminSection = 'news'; $emit('cancel-all')"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap"
        :class="adminSection === 'news' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-slate-100'"
      >
        <i class="fa-solid fa-bell"></i>
        <span>Notizie & Allerta</span>
      </button>

      <button
        @click="adminSection = 'tags'; $emit('cancel-all')"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap"
        :class="adminSection === 'tags' ? 'bg-indigo-500 text-white shadow' : 'text-slate-500 hover:bg-slate-100'"
      >
        <i class="fa-solid fa-tags"></i>
        <span>Smart Tags</span>
      </button>

      <button
        @click="adminSection = 'import'; $emit('cancel-all')"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap"
        :class="adminSection === 'import' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'"
      >
        <i class="fa-solid fa-code"></i>
        <span>Importa Dati</span>
      </button>
    </div>

    <!-- Section: Services -->
    <AdminServices
      v-if="adminSection === 'services'"
      :services="services"
      :categories="categories"
      :organizations="organizations"
      :db-tags="dbTags"
      :templates="templates"
      :days-of-week="daysOfWeek"
      :editing-service="editingService"
      :edit-form="editForm"
      :selected-services="selectedServices"
      :is-all-selected="isAllSelected"
      :is-deleting="isDeleting"
      :saving-service-id="savingServiceId"
      :uploading-image="uploadingImage"
      :image-upload-error="imageUploadError"
      :languages="languages"
      :is-r-t-l="isRTL"
      :t="t"
      :translate-field="translateField"
      :get-category-icon="getCategoryIcon"
      :generate-template-text="generateTemplateText"
      @start-creating="$emit('service-start-creating')"
      @start-editing="$emit('service-start-editing', $event)"
      @cancel="$emit('service-cancel')"
      @save="$emit('service-save')"
      @select-all="$emit('service-select-all', $event)"
      @toggle-select="$emit('service-toggle-select', $event)"
      @delete-selected="$emit('service-delete-selected')"
      @delete-single="$emit('service-delete-single', $event)"
      @upload-image="$emit('service-upload-image', $event)"
      @paste-image="$emit('service-paste-image', $event)"
    />

    <!-- Section: News -->
    <AdminNews
      v-if="adminSection === 'news'"
      :global-news="globalNews"
      :is-loading="isLoadingNews"
      :editing-news="editingNews"
      :news-form="newsForm"
      :saving-news-id="savingNewsId"
      :services="services"
      :templates="templates"
      :languages="languages"
      :available-langs-for-news="availableLangsForNews"
      :active-news-langs="activeNewsLangs"
      :is-r-t-l="isRTL"
      :t="t"
      :translate-field="translateField"
      :format-news-date="formatNewsDate"
      :get-news-type-style="getNewsTypeStyle"
      :is-urgency="isUrgency"
      :set-news-urgency="setNewsUrgency"
      :generate-template-text="generateTemplateText"
      @start-creating="$emit('news-start-creating')"
      @start-editing="$emit('news-start-editing', $event)"
      @cancel="$emit('news-cancel')"
      @save="$emit('news-save')"
      @delete="$emit('news-delete', $event)"
      @add-lang="$emit('news-add-lang', $event)"
      @delete-lang="$emit('news-delete-lang', $event)"
    />

    <!-- Section: Tags -->
    <AdminTags
      v-if="adminSection === 'tags'"
      :db-tags="dbTags"
      :is-loading="isLoadingTags"
      :editing-tag="editingTag"
      :tag-form="tagForm"
      :saving-tag="savingTag"
      :is-editing-existing-tag="isEditingExistingTag"
      :available-langs="availableLangsForTag"
      :languages="languages"
      @start-creating="$emit('tag-start-creating')"
      @start-editing="$emit('tag-start-editing', $event)"
      @cancel="$emit('tag-cancel')"
      @save="$emit('tag-save')"
      @delete="$emit('tag-delete', $event)"
      @add-lang="$emit('tag-add-lang', $event)"
    />

    <!-- Section: Import -->
    <AdminImport
      v-if="adminSection === 'import'"
      :model-value="importCode"
      @update:model-value="$emit('update:importCode', $event)"
      @execute="$emit('execute-import')"
    />
  </main>
</template>

<script setup>
import { ref } from 'vue'
import AdminServices from './AdminServices.vue'
import AdminNews from './AdminNews.vue'
import AdminTags from './AdminTags.vue'
import AdminImport from './AdminImport.vue'

const adminSection = ref('services')

defineProps({
  // Services
  services: Array,
  categories: Array,
  organizations: Array,
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
  // News
  globalNews: Array,
  isLoadingNews: Boolean,
  editingNews: Object,
  newsForm: Object,
  savingNewsId: Boolean,
  availableLangsForNews: Object,
  activeNewsLangs: Array,
  // Tags
  dbTags: Array,
  isLoadingTags: Boolean,
  editingTag: Object,
  tagForm: Object,
  savingTag: Boolean,
  isEditingExistingTag: Boolean,
  availableLangsForTag: Object,
  // Import
  importCode: String,
  // Shared
  languages: Object,
  isRTL: Boolean,
  t: Function,
  translateField: Function,
  getCategoryIcon: Function,
  formatNewsDate: Function,
  getNewsTypeStyle: Function,
  isUrgency: Function,
  setNewsUrgency: Function,
  generateTemplateText: Function
})

defineEmits([
  'cancel-all',
  'service-start-creating',
  'service-start-editing',
  'service-cancel',
  'service-save',
  'service-select-all',
  'service-toggle-select',
  'service-delete-selected',
  'service-delete-single',
  'service-upload-image',
  'service-paste-image',
  'news-start-creating',
  'news-start-editing',
  'news-cancel',
  'news-save',
  'news-delete',
  'news-add-lang',
  'news-delete-lang',
  'tag-start-creating',
  'tag-start-editing',
  'tag-cancel',
  'tag-save',
  'tag-delete',
  'tag-add-lang',
  'update:importCode',
  'execute-import'
])
</script>
