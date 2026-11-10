import { ref, computed } from 'vue'
import { supabase, IMAGE_BUCKET } from '../lib/supabase'
import organizations from '../config/organizations.json'
import languages from '../config/languages.json'

const dbServices = ref([])
const isLoading = ref(true)
const activeTab = ref('services')
const selectedCategory = ref('all')
const searchQuery = ref('')

const expandedServiceIds = ref(new Set())
const expandedHoursIds = ref(new Set())

const activeModalService = ref(null)
const activeShareService = ref(null)
const shareLang = ref('it')
const isCopied = ref(false)

const selectedServices = ref(new Set())
const isDeleting = ref(false)

const editingService = ref(null)
const savingServiceId = ref(false)
const uploadingImage = ref(false)
const imageUploadError = ref('')

const editForm = ref({
  id: null,
  organization_id: '',
  address: '',
  phone: '',
  email: '',
  hoursList: [{ day: 1, open: '', close: '' }],
  status: 'active',
  noticeTemplate: 'none',
  noticeParams: {},
  customNotice: { it: '' },
  temp_info: { it: '' },
  category: 'showers',
  image: '',
  name: { it: '' },
  description: { it: '' },
  tags: []
})

const selectedNewLangService = ref('')
const selectedNewLangName = ref('')
const selectedNewLangDesc = ref('')
const selectedNewLangTemp = ref('')

export function useServices(i18nHelpers = {}) {
  const {
    translateField = (obj, field) => obj?.[field]?.it || '',
    extractText = (f, l) => (typeof f === 'string' ? f : f?.[l] || f?.it || ''),
    formatHours = () => '',
    t = (k) => k,
    buildMultilangObjFromTemplate = null
  } = i18nHelpers

  const services = computed(() => {
    return dbServices.value.map(item => {
      const org = organizations.find(o => o.id === item.org_id)
      return {
        ...item,
        name: item.name || {},
        description: item.description || {},
        organization: item.organization || org?.name || 'Ente Sconosciuto',
        org_id: item.org_id,
        hours: item.hours || [],
        tags: item.tags || []
      }
    })
  })

  const filteredServices = computed(() => {
    return services.value.filter(s => {
      const matchesCategory = selectedCategory.value === 'all' || s.category === selectedCategory.value
      if (!searchQuery.value.trim()) return matchesCategory
      const q = searchQuery.value.toLowerCase().trim()

      const nameStr = Object.values(s.name || {}).join(' ').toLowerCase()
      const descStr = Object.values(s.description || {}).join(' ').toLowerCase()
      const orgStr = (s.organization || '').toLowerCase()
      const addrStr = (s.address || '').toLowerCase()

      return matchesCategory && (nameStr.includes(q) || descStr.includes(q) || orgStr.includes(q) || addrStr.includes(q))
    })
  })

  const getServiceCount = (catId) => services.value.filter(s => s.category === catId).length

  const getServiceName = (serviceId) => {
    const s = services.value.find(item => item.id === serviceId)
    return s ? translateField(s, 'name') : ''
  }

  const isServiceExpanded = (serviceId) => expandedServiceIds.value.has(serviceId)
  const toggleServiceExpanded = (serviceId) => {
    const next = new Set(expandedServiceIds.value)
    if (next.has(serviceId)) next.delete(serviceId)
    else next.add(serviceId)
    expandedServiceIds.value = next
  }

  const isHoursExpanded = (serviceId) => expandedHoursIds.value.has(serviceId)
  const toggleHoursExpanded = (serviceId) => {
    const next = new Set(expandedHoursIds.value)
    if (next.has(serviceId)) next.delete(serviceId)
    else next.add(serviceId)
    expandedHoursIds.value = next
  }

  const needsExpansion = (service) => {
    let text = translateField(service, 'description')
    if (!text) return false
    text = text.trim()
    return text.length > 160 || (text.match(/\n/g) || []).length >= 3
  }

  const hasTempInfo = (service) => {
    const text = translateField(service, 'temp_info')
    return Boolean(text && text.trim() !== '')
  }

  const getNavigationUrl = (address) => {
    const query = encodeURIComponent(`${address}, Como, Italy`)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  const openContactModal = (service) => {
    activeModalService.value = service
  }

  const goToService = (serviceId) => {
    const s = services.value.find(item => item.id === serviceId)
    if (s) {
      selectedCategory.value = s.category
      activeTab.value = 'services'
      setTimeout(() => openContactModal(s), 200)
    }
  }

  const openShareModal = (service, currentLangCode = 'it') => {
    activeShareService.value = service
    shareLang.value = currentLangCode
    isCopied.value = false
  }

  const generateShareText = (service, langCode) => {
    const name = extractText(service.name, langCode) || extractText(service.name, 'it')
    const org = service.organization
    const address = service.address || ''
    const phone = service.phone || ''
    const email = service.email || ''
    const mapLink = address ? getNavigationUrl(address) : ''
    const hours = formatHours(service.hours, langCode)

    let message = `*${t('share_text_intro')}*\n`
    message += `*${name}* (${org})\n\n`

    if (address) message += `${t('share_text_address')} ${address}\n`
    message += `${t('share_text_hours')}\n${hours}\n\n`

    if (phone) message += `${t('share_text_phone')} ${phone}\n`
    if (email) message += `${t('share_text_email')} ${email}\n`
    if (mapLink) message += `\n${t('share_text_map')}\n${mapLink}`

    return message
  }

  const executeShare = async (method) => {
    if (!activeShareService.value) return
    const text = generateShareText(activeShareService.value, shareLang.value)
    const encodedText = encodeURIComponent(text)

    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    } else if (method === 'telegram') {
      window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank')
    } else if (method === 'email') {
      const subjectName = extractText(activeShareService.value.name, shareLang.value) || ''
      const subject = encodeURIComponent('Info: ' + subjectName)
      window.location.href = `mailto:?subject=${subject}&body=${encodedText}`
    } else if (method === 'copy') {
      try {
        await navigator.clipboard.writeText(text)
        isCopied.value = true
        setTimeout(() => (isCopied.value = false), 2000)
      } catch (e) {
        alert('Impossibile copiare il testo negli appunti.')
      }
    }
  }

  const fetchServices = async () => {
    if (!supabase) {
      isLoading.value = false
      return
    }
    isLoading.value = true
    try {
      const { data, error } = await supabase.from('services').select('*').order('category', { ascending: true })
      if (error) throw error
      if (data) dbServices.value = data
    } catch (error) {
      console.error(error.message)
    } finally {
      isLoading.value = false
    }
  }

  const toggleServiceSelection = (id, event) => {
    if (event) event.stopPropagation()
    const next = new Set(selectedServices.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedServices.value = next
  }

  const selectAllServices = (event) => {
    if (event.target.checked) {
      const allIds = services.value.map(s => s.id)
      selectedServices.value = new Set(allIds)
    } else {
      selectedServices.value = new Set()
    }
  }

  const isAllSelected = computed(() => {
    return services.value.length > 0 && selectedServices.value.size === services.value.length
  })

  const deleteSelectedServices = async () => {
    if (selectedServices.value.size === 0 || !supabase) return
    const confirmed = confirm(`Sei sicuro di voler eliminare ${selectedServices.value.size} servizi? Questa azione è irreversibile.`)
    if (!confirmed) return

    isDeleting.value = true
    try {
      const ids = Array.from(selectedServices.value)
      const { data, error } = await supabase.from('services').delete().in('id', ids).select()
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Il database ha bloccato l'operazione. Verifica le policy RLS (DELETE) su Supabase.")
      }

      dbServices.value = dbServices.value.filter(s => !ids.includes(s.id))
      selectedServices.value = new Set()
      alert('Servizi eliminati con successo!')
    } catch (err) {
      alert("Errore durante l'eliminazione: " + err.message)
    } finally {
      isDeleting.value = false
    }
  }

  const deleteSingleService = async (service, event) => {
    if (event) event.stopPropagation()
    if (!supabase) return
    const confirmed = confirm(`Sei sicuro di voler eliminare il servizio "${translateField(service, 'name')}"?`)
    if (!confirmed) return

    isDeleting.value = true
    try {
      const { data, error } = await supabase.from('services').delete().eq('id', service.id).select()
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Il database ha bloccato l'operazione. Verifica le policy RLS (DELETE) su Supabase.")
      }

      dbServices.value = dbServices.value.filter(s => s.id !== service.id)
      const next = new Set(selectedServices.value)
      next.delete(service.id)
      selectedServices.value = next
    } catch (err) {
      alert("Errore durante l'eliminazione: " + err.message)
    } finally {
      isDeleting.value = false
    }
  }

  const startEditing = (service) => {
    editingService.value = service
    let initNoticeTpl = 'none'
    let initCustomNotice = { it: '' }

    if (service.latestUpdate && service.latestUpdate.text) {
      initNoticeTpl = 'custom'
      initCustomNotice = JSON.parse(JSON.stringify(service.latestUpdate.text))
      if (typeof initCustomNotice === 'string') initCustomNotice = { it: initCustomNotice }
      if (!initCustomNotice.it) initCustomNotice.it = ''
    }

    let initTempInfo = service.temp_info ? JSON.parse(JSON.stringify(service.temp_info)) : { it: '' }
    if (typeof initTempInfo === 'string') initTempInfo = { it: initTempInfo }
    if (!initTempInfo.it) initTempInfo.it = ''

    let dbHoursList = Array.isArray(service.hours) && service.hours.length > 0 ? [...service.hours] : [{ day: 1, open: '', close: '' }]

    let initName = service.name ? JSON.parse(JSON.stringify(service.name)) : { it: '' }
    if (typeof initName === 'string') initName = { it: initName }
    if (!initName.it) initName.it = ''

    let initDesc = service.description ? JSON.parse(JSON.stringify(service.description)) : { it: '' }
    if (typeof initDesc === 'string') initDesc = { it: initDesc }
    if (!initDesc.it) initDesc.it = ''

    editForm.value = {
      id: service.id,
      organization_id: service.org_id,
      address: service.address || '',
      phone: service.phone || '',
      email: service.email || '',
      hoursList: dbHoursList,
      status: service.status || 'active',
      noticeTemplate: initNoticeTpl,
      noticeParams: {},
      customNotice: initCustomNotice,
      temp_info: initTempInfo,
      category: service.category || 'showers',
      image: service.image || '',
      name: initName,
      description: initDesc,
      tags: Array.isArray(service.tags) ? [...service.tags] : []
    }
    imageUploadError.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startCreating = () => {
    editingService.value = { id: null }
    editForm.value = {
      id: null,
      organization_id: '',
      address: '',
      phone: '',
      email: '',
      hoursList: [{ day: 1, open: '', close: '' }],
      status: 'active',
      noticeTemplate: 'none',
      noticeParams: {},
      customNotice: { it: '' },
      temp_info: { it: '' },
      category: 'showers',
      image: '',
      name: { it: '' },
      description: { it: '' },
      tags: []
    }
    imageUploadError.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditing = () => {
    editingService.value = null
    editForm.value = { id: null }
    imageUploadError.value = ''
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files && event.target.files[0]
    if (!file || !supabase) return
    if (!file.type.startsWith('image/')) {
      imageUploadError.value = 'File non valido.'
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      imageUploadError.value = 'Supera 15MB.'
      return
    }

    uploadingImage.value = true
    imageUploadError.value = ''
    try {
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`
      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(uniqueName, file)
      if (error) throw error
      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(uniqueName)
      editForm.value.image = data.publicUrl
    } catch (err) {
      imageUploadError.value = 'Errore upload: ' + err.message
    } finally {
      uploadingImage.value = false
      if (event.target.value) event.target.value = ''
    }
  }

  const handlePaste = async (event) => {
    const items = (event.clipboardData || event.originalEvent?.clipboardData)?.items
    if (!items) return
    for (let index in items) {
      const item = items[index]
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        const fileObj = { target: { files: [blob] } }
        await handleImageUpload(fileObj)
      }
    }
  }

  const saveServiceChanges = async () => {
    if (!supabase || !editingService.value) return
    savingServiceId.value = true
    try {
      const validHours = editForm.value.hoursList.filter(h => h.open && h.close)

      const payload = {
        id: editForm.value.id,
        status: editForm.value.status,
        address: String(editForm.value.address || '').trim(),
        phone: String(editForm.value.phone || '').trim(),
        email: String(editForm.value.email || '').trim(),
        org_id: editForm.value.organization_id,
        category: editForm.value.category,
        image: String(editForm.value.image || '').trim(),
        hours: validHours,
        temp_info: JSON.parse(JSON.stringify(editForm.value.temp_info)),
        name: JSON.parse(JSON.stringify(editForm.value.name)),
        description: JSON.parse(JSON.stringify(editForm.value.description)),
        tags: editForm.value.tags
      }

      if (editForm.value.noticeTemplate === 'custom') {
        payload.latestUpdate = {
          date: new Date().toLocaleDateString('it-IT'),
          text: JSON.parse(JSON.stringify(editForm.value.customNotice))
        }
      } else if (editForm.value.noticeTemplate !== 'none' && buildMultilangObjFromTemplate) {
        payload.latestUpdate = {
          date: new Date().toLocaleDateString('it-IT'),
          text: buildMultilangObjFromTemplate(editForm.value.noticeTemplate, editForm.value.noticeParams, false)
        }
      } else if (editForm.value.status === 'active') {
        payload.latestUpdate = null
      }

      if (editForm.value.id) {
        const { error } = await supabase.from('services').update(payload).eq('id', editForm.value.id).select()
        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert([payload]).select()
        if (error) throw error
      }

      await fetchServices()
      alert(editForm.value.id ? 'Modifiche salvate con successo online!' : 'Nuovo servizio registrato e pubblicato!')
      cancelEditing()
    } catch (err) {
      alert('Errore salvataggio: ' + err.message)
    } finally {
      savingServiceId.value = false
    }
  }

  return {
    dbServices,
    services,
    isLoading,
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
    fetchServices,
    selectedNewLangService,
    selectedNewLangName,
    selectedNewLangDesc,
    selectedNewLangTemp
  }
}
