<template>
  <div :dir="isRTL ? 'rtl' : 'ltr'" class="pb-24 w-full bg-slate-50 text-slate-800 min-h-screen">
    <!-- Header Globale -->
    <AppHeader
      :user="user"
      :active-tab="activeTab"
      :current-lang="currentLang"
      :current-lang-code="currentLangCode"
      :languages="languages"
      :is-r-t-l="isRTL"
      :has-unread-news="hasUnreadNews"
      :is-installed="isInstalled"
      :t="t"
      @open-admin="openAdminModal = true"
      @open-app-modal="handleDownloadClick"
      @download-click="handleDownloadClick"
      @select-language="selectLanguage"
      @update:active-tab="handleTabChange"
    />

    <!-- Tab 1: Esplora Servizi -->
    <main v-if="activeTab === 'services'" class="max-w-[1600px] w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-6 animate-fadeIn">
      <!-- Search & Banner -->
      <SearchBar
        v-model="searchQuery"
        :suggestions="searchSuggestions"
        :is-r-t-l="isRTL"
        :t="t"
        @select-suggestion="searchQuery = $event"
      />

      <!-- Filtro Categorie con scorrimento automatico elegante -->
      <CategoryFilter
        :categories="categories"
        :selected-category="selectedCategory"
        :get-service-count="getServiceCount"
        :t="t"
        @select-category="handleCategorySelect"
      />

      <!-- Loading State -->
      <div v-if="isLoadingServices" class="text-center py-16">
        <i class="fa-solid fa-circle-notch fa-spin text-4xl text-brand-600 mb-4 inline-block"></i>
        <p class="text-sm text-slate-500 font-medium">Caricamento servizi di Como in corso...</p>
      </div>

      <!-- Services Grid / Empty State -->
      <div v-else id="services-list" class="space-y-4 pt-2 scroll-mt-28">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-400 px-1">
          <span>{{ filteredServices.length }} {{ t('services_found') }}</span>
          <span v-if="selectedCategory !== 'all'" class="bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full font-bold">
            {{ t(getCategoryLabelKey(selectedCategory)) }}
          </span>
        </div>

        <div v-if="filteredServices.length === 0" class="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <span class="text-6xl block mb-4">🔍</span>
          <h4 class="font-bold text-slate-700 text-lg mb-1">{{ t('no_results_title') }}</h4>
          <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6">{{ t('no_results_sub') }}</p>
          <button
            @click="handleCategorySelect('all'); searchQuery = ''"
            class="bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow hover:bg-brand-700 transition"
          >
            {{ t('reset_filters') }}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ServiceCard
            v-for="service in filteredServices"
            :key="service.id"
            :service="service"
            :is-hours-expanded="isHoursExpanded(service.id)"
            :current-lang-code="currentLangCode"
            :is-r-t-l="isRTL"
            :t="t"
            :translate-field="translateField"
            :format-hours="formatHours"
            :get-category-icon="getCategoryIcon"
            :get-category-label-key="getCategoryLabelKey"
            :has-temp-info="hasTempInfo"
            :get-navigation-url="getNavigationUrl"
            @toggle-hours="toggleHoursExpanded"
            @open-contact="openContactModal"
            @open-share="openShareModal(service, currentLangCode)"
          />
        </div>
      </div>
    </main>

    <!-- Tab 2: Notizie & Allerta -->
    <NewsSection
      v-if="activeTab === 'news'"
      :news-list="globalNews"
      :is-loading="isLoadingNews"
      :is-r-t-l="isRTL"
      :t="t"
      :translate-field="translateField"
      :format-news-date="formatNewsDate"
      :get-news-type-style="getNewsTypeStyle"
      :get-service-name="getServiceName"
      @go-to-service="goToService"
    />

    <!-- Tab 3: Emergenze -->
    <EmergencySection
      v-if="activeTab === 'emergency'"
      :t="t"
    />

    <!-- Tab 4: Dashboard Operatori -->
    <AdminDashboard
      v-if="activeTab === 'admin_dashboard' && user"
      :services="services"
      :categories="categories"
      :organizations="organizations"
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
      :global-news="globalNews"
      :is-loading-news="isLoadingNews"
      :editing-news="editingNews"
      :news-form="newsForm"
      :saving-news-id="savingNewsId"
      :available-langs-for-news="availableLangsForNews"
      :active-news-langs="activeNewsLangs"
      :db-tags="dbTags"
      :is-loading-tags="isLoadingTags"
      :editing-tag="editingTag"
      :tag-form="tagForm"
      :saving-tag="savingTag"
      :is-editing-existing-tag="isEditingExistingTag"
      :available-langs-for-tag="availableLangsForTag"
      :import-code="importCode"
      :languages="languages"
      :is-r-t-l="isRTL"
      :t="t"
      :translate-field="translateField"
      :get-category-icon="getCategoryIcon"
      :format-news-date="formatNewsDate"
      :get-news-type-style="getNewsTypeStyle"
      :is-urgency="isUrgency"
      :set-news-urgency="setNewsUrgency"
      :generate-template-text="generateTemplateText"
      @cancel-all="cancelAllEditing"
      @service-start-creating="startCreating"
      @service-start-editing="startEditing"
      @service-cancel="cancelEditing"
      @service-save="saveServiceChanges"
      @service-select-all="selectAllServices"
      @service-toggle-select="toggleServiceSelection"
      @service-delete-selected="deleteSelectedServices"
      @service-delete-single="deleteSingleService"
      @service-upload-image="handleImageUpload"
      @service-paste-image="handlePaste"
      @news-start-creating="startCreatingNews"
      @news-start-editing="startEditingNews"
      @news-cancel="cancelEditingNews"
      @news-save="saveNewsChanges"
      @news-delete="deleteNewsItem"
      @news-add-lang="addLangToNews"
      @news-delete-lang="deleteLangFromNews"
      @tag-start-creating="startCreatingTag"
      @tag-start-editing="startEditingTag"
      @tag-cancel="cancelEditingTag"
      @tag-save="saveTagChanges"
      @tag-delete="deleteTagItem"
      @tag-add-lang="addLangToTag"
      @update:import-code="importCode = $event"
      @execute-import="executeImportCode"
    />

    <!-- Modale Contatti -->
    <ContactModal
      :service="activeModalService"
      :is-r-t-l="isRTL"
      :t="t"
      :translate-field="translateField"
      :get-navigation-url="getNavigationUrl"
      @close="activeModalService = null"
    />

    <!-- Modale Condivisione -->
    <ShareModal
      :service="activeShareService"
      v-model:share-lang="shareLang"
      :languages="languages"
      :is-copied="isCopied"
      :is-r-t-l="isRTL"
      :t="t"
      :translate-field="translateField"
      @close="activeShareService = null"
      @share="executeShare"
    />

    <!-- Modale Accesso Operatori -->
    <AdminModal
      :is-open="openAdminModal"
      :user="user"
      :auth-form="authForm"
      :auth-loading="authLoading"
      :auth-error="authError"
      :is-r-t-l="isRTL"
      @close="openAdminModal = false"
      @login="onLoginSubmit"
      @logout="handleLogout"
      @open-dashboard="activeTab = 'admin_dashboard'; openAdminModal = false; cancelAllEditing()"
    />

    <!-- Modale Esplicito Installazione App -->
    <InstallAppModal
      :is-open="openAppModal"
      :is-installed="isInstalled"
      :is-i-o-s="isIOS"
      :deferred-prompt="deferredPrompt"
      @close="openAppModal = false"
      @install="installPwa"
    />

    <!-- Banner Flottante Installazione PWA -->
    <PwaInstallBanner
      :is-installed="isInstalled"
      :is-i-o-s="isIOS"
      :deferred-prompt="deferredPrompt"
      @open-modal="openAppModal = true"
      @install="installPwa"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Configurations
import categories from './config/categories.json'
import organizations from './config/organizations.json'
import templates from './config/templates.json'
import daysOfWeek from './config/daysOfWeek.json'

// Composables
import { useI18n } from './composables/useI18n'
import { useAuth } from './composables/useAuth'
import { useTags } from './composables/useTags'
import { useNews } from './composables/useNews'
import { useServices } from './composables/useServices'
import { supabase } from './lib/supabase'

// Components
import AppHeader from './components/layout/AppHeader.vue'
import SearchBar from './components/services/SearchBar.vue'
import CategoryFilter from './components/services/CategoryFilter.vue'
import ServiceCard from './components/services/ServiceCard.vue'
import ContactModal from './components/services/ContactModal.vue'
import ShareModal from './components/services/ShareModal.vue'
import NewsSection from './components/news/NewsSection.vue'
import EmergencySection from './components/emergency/EmergencySection.vue'
import AdminModal from './components/admin/AdminModal.vue'
import AdminDashboard from './components/admin/AdminDashboard.vue'
import InstallAppModal from './components/layout/InstallAppModal.vue'
import PwaInstallBanner from './components/layout/PwaInstallBanner.vue'

// 1. i18n
const {
  languages,
  currentLangCode,
  currentLang,
  isRTL,
  selectLanguage,
  t,
  extractText,
  translateField,
  formatHours,
  generateTemplateText,
  buildMultilangObjFromTemplate
} = useI18n()

// 2. Auth
const {
  user,
  authLoading,
  authError,
  authForm,
  openAdminModal,
  checkAuthSession,
  handleLogin,
  handleLogout
} = useAuth()

// 3. Services
const {
  dbServices,
  services,
  isLoading: isLoadingServices,
  activeTab,
  selectedCategory,
  searchQuery,
  filteredServices,
  getServiceCount,
  getServiceName,
  isServiceExpanded,
  toggleServiceExpanded,
  isHoursExpanded,
  toggleHoursExpanded,
  needsExpansion,
  hasTempInfo,
  getNavigationUrl,
  activeModalService,
  activeShareService,
  shareLang,
  isCopied,
  openContactModal,
  goToService,
  openShareModal,
  executeShare,
  selectedServices,
  isDeleting,
  toggleServiceSelection,
  selectAllServices,
  isAllSelected,
  deleteSelectedServices,
  deleteSingleService,
  editingService,
  editForm,
  savingServiceId,
  uploadingImage,
  imageUploadError,
  startEditing,
  startCreating,
  cancelEditing,
  handleImageUpload,
  handlePaste,
  saveServiceChanges,
  fetchServices
} = useServices({
  translateField,
  extractText,
  formatHours,
  t,
  buildMultilangObjFromTemplate
})

// 4. Tags
const {
  dbTags,
  isLoadingTags,
  editingTag,
  tagForm,
  savingTag,
  isEditingExistingTag,
  fetchTags,
  searchSuggestions,
  startCreatingTag,
  startEditingTag,
  cancelEditingTag,
  availableLangsForTag,
  addLangToTag,
  saveTagChanges,
  deleteTagItem
} = useTags(searchQuery, currentLangCode)

// 5. News
const {
  globalNews,
  isLoadingNews,
  editingNews,
  newsForm,
  savingNewsId,
  hasUnreadNews,
  markNewsAsRead,
  getNewsTypeStyle,
  isUrgency,
  setNewsUrgency,
  formatNewsDate,
  fetchNews,
  availableLangsForNews,
  activeNewsLangs,
  addLangToNews,
  deleteLangFromNews,
  startEditingNews,
  startCreatingNews,
  cancelEditingNews,
  saveNewsChanges,
  deleteNewsItem
} = useNews(buildMultilangObjFromTemplate)

// PWA State & Installation
const isInstalled = ref(false)
const isIOS = ref(false)
const deferredPrompt = ref(null)
const openAppModal = ref(false)

const installPwa = async () => {
  if (!deferredPrompt.value) return
  try {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      isInstalled.value = true
      localStorage.setItem('pwa_is_installed', 'true')
    }
  } catch (err) {
    console.error('PWA install error:', err)
  }
  deferredPrompt.value = null
  openAppModal.value = false
}

// Click sul pulsante "Scarica"
const handleDownloadClick = async () => {
  if (isInstalled.value) {
    // Se l'app è già installata, mostra la conferma
    openAppModal.value = true
    return
  }

  // Se abbiamo il prompt nativo (Android, Chrome, Edge):
  // SCARICA E INSTALLA SUBITO DIRETTAMENTE SENZA NESSUN PASSAGGIO O SCHERMATA INTERMEDIA!
  if (deferredPrompt.value) {
    await installPwa()
    return
  }

  // Altrimenti (iOS Safari o browser senza prompt automatico), apri la guida
  openAppModal.value = true
}

// Scorrimento fluido ed elegante al click della categoria
const scrollToServices = () => {
  nextTick(() => {
    setTimeout(() => {
      const el = document.getElementById('services-list')
      if (el) {
        const header = document.querySelector('header')
        const headerHeight = header ? header.offsetHeight : 64
        const rect = el.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const targetY = rect.top + scrollTop - headerHeight - 16

        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        })
      }
    }, 60)
  })
}

const handleCategorySelect = (catId) => {
  selectedCategory.value = catId
  scrollToServices()
}

// Import code state
const importCode = ref('')

const executeImportCode = async () => {
  if (!importCode.value.trim()) return
  const confirmed = confirm('Vuoi eseguire questo snippet nel database?')
  if (!confirmed) return
  try {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const executor = new AsyncFunction('supabase', 'dbServices', 'fixedOrganizations', 'fetchServices', 'dbTags', 'fetchTags', importCode.value)
    await executor(supabase, dbServices.value, organizations, fetchServices, dbTags.value, fetchTags)
    alert('Codice eseguito con successo e dati aggiornati!')
    importCode.value = ''
  } catch (e) {
    alert("Errore durante l'esecuzione:\n" + e.message)
  }
}

const cancelAllEditing = () => {
  cancelEditing()
  cancelEditingNews()
  cancelEditingTag()
}

const handleTabChange = (tab) => {
  activeTab.value = tab
  if (tab === 'news') {
    markNewsAsRead()
  }
  if (tab !== 'admin_dashboard') {
    cancelAllEditing()
  }
}

const onLoginSubmit = async () => {
  const success = await handleLogin()
  if (success) {
    activeTab.value = 'admin_dashboard'
    cancelAllEditing()
  }
}

const getCategoryIcon = (catId) => categories.find(c => c.id === catId)?.icon || '📍'
const getCategoryLabelKey = (catId) => categories.find(c => c.id === catId)?.labelKey || 'cat_all'

onMounted(() => {
  fetchTags()
  fetchServices()
  fetchNews()
  checkAuthSession()

  // Rileva se l'app è aperta come applicazione autonoma (standalone)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://')

  if (isStandalone) {
    isInstalled.value = true
  }

  // Rileva se il dispositivo è iOS (iPhone/iPad)
  const userAgent = window.navigator.userAgent.toLowerCase()
  isIOS.value = /iphone|ipad|ipod/.test(userAgent)

  // Ascolta l'evento di installazione su Android/Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    if (!isStandalone) {
      isInstalled.value = false
    }
  })

  // Evento app installata con successo
  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    deferredPrompt.value = null
    localStorage.setItem('pwa_is_installed', 'true')
  })

  // Controlla aggiornamenti del Service Worker quando la finestra torna attiva
  window.addEventListener('focus', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.update()
      }).catch(() => {})
    }
  })
})
</script>

<style>
html {
  font-size: 18px;
}
@media (min-width: 640px) {
  html {
    font-size: 16px;
  }
}
body {
  font-family: 'Inter', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
[dir="rtl"] {
  text-align: right;
}
[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}
.card-shadow {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08);
}
.flag-emoji {
  font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
}
</style>
