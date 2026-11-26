import { ref, computed } from 'vue'
import { supabase, alertsChannel } from '../lib/supabase'
import organizations from '../config/organizations.json'
import languages from '../config/languages.json'
import { sendOneSignalPush } from './usePushNotifications'

const globalNews = ref([])
const isLoadingNews = ref(true)
const editingNews = ref(null)
const savingNewsId = ref(false)
const selectedNewLangNews = ref('')

const newsForm = ref({
  id: null,
  type: 'general',
  priority: 'normal',
  association_id: '',
  related_service_id: null,
  useCustomText: false,
  template: 'posti_esauriti',
  templateParams: {},
  customTitle: { it: '' },
  customContent: { it: '' }
})

const NEWS_TYPES = {
  general: { icon: 'fa-solid fa-circle-info', badgeClass: 'bg-blue-100 text-blue-700' },
  service_update: { icon: 'fa-solid fa-arrows-rotate', badgeClass: 'bg-amber-100 text-amber-700' },
  change: { icon: 'fa-solid fa-arrows-rotate', badgeClass: 'bg-amber-100 text-amber-700' },
  emergency: { icon: 'fa-solid fa-triangle-exclamation', badgeClass: 'bg-red-100 text-red-700' }
}

const lastViewedNewsTime = ref(parseInt(localStorage.getItem('vds_last_news_time')) || 0)

export function useNews(buildMultilangObjFromTemplate = null, servicesRef = null) {
  const getNewsTypeStyle = (type) => NEWS_TYPES[type] || NEWS_TYPES.general

  const isUrgency = (level) => {
    if (level === 'info' && (newsForm.value.type === 'general' || !newsForm.value.type)) return true
    if (level === 'update' && (newsForm.value.type === 'service_update' || newsForm.value.type === 'change')) return true
    if (level === 'emergency' && newsForm.value.type === 'emergency') return true
    return false
  }

  const setNewsUrgency = (level) => {
    if (level === 'info') {
      newsForm.value.type = 'general'
      newsForm.value.priority = 'normal'
    } else if (level === 'update') {
      newsForm.value.type = 'service_update'
      newsForm.value.priority = 'normal'
    } else if (level === 'emergency') {
      newsForm.value.type = 'emergency'
      newsForm.value.priority = 'high'
    }
  }

  const formatNewsDate = (isoDate) => {
    if (!isoDate) return ''
    try {
      const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('vicini_lang')) || 'it'
      return new Date(isoDate).toLocaleString(lang, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return isoDate
    }
  }

  const hasUnreadNews = computed(() => {
    if (globalNews.value.length === 0) return false
    const latestNewsTime = new Date(globalNews.value[0].created_at).getTime()
    return latestNewsTime > lastViewedNewsTime.value
  })

  const markNewsAsRead = () => {
    if (globalNews.value.length > 0) {
      const latestNewsTime = new Date(globalNews.value[0].created_at).getTime()
      lastViewedNewsTime.value = latestNewsTime
      localStorage.setItem('vds_last_news_time', latestNewsTime.toString())
    }
  }

  const fetchNews = async () => {
    if (!supabase) {
      isLoadingNews.value = false
      return
    }
    isLoadingNews.value = true
    try {
      const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false })
      if (error) throw error

      globalNews.value = (data || []).map(n => {
        const org = organizations.find(o => o.id === n.association_id)
        const name = (org && org.id !== 'org_coordinamento') ? org.name : ''
        return { ...n, association: name }
      })
    } catch (error) {
      console.error(error.message)
    } finally {
      isLoadingNews.value = false
    }
  }

  const availableLangsForNews = computed(() => {
    const available = {}
    for (const code in languages) {
      if (code !== 'it' && newsForm.value.customTitle && newsForm.value.customTitle[code] === undefined) {
        available[code] = languages[code]
      }
    }
    return available
  })

  const activeNewsLangs = computed(() => {
    if (!newsForm.value.customTitle) return ['it']
    const langs = Object.keys(newsForm.value.customTitle)
    return ['it', ...langs.filter(l => l !== 'it')]
  })

  const addLangToNews = (langCode) => {
    const code = langCode || selectedNewLangNews.value
    if (code) {
      if (!newsForm.value.customTitle) newsForm.value.customTitle = { it: '' }
      if (!newsForm.value.customContent) newsForm.value.customContent = { it: '' }
      newsForm.value.customTitle = {
        ...newsForm.value.customTitle,
        [code]: ''
      }
      newsForm.value.customContent = {
        ...newsForm.value.customContent,
        [code]: ''
      }
      selectedNewLangNews.value = ''
    }
  }

  const deleteLangFromNews = (langCode) => {
    if (newsForm.value.customTitle) {
      const updatedTitles = { ...newsForm.value.customTitle }
      delete updatedTitles[langCode]
      newsForm.value.customTitle = updatedTitles
    }
    if (newsForm.value.customContent) {
      const updatedContents = { ...newsForm.value.customContent }
      delete updatedContents[langCode]
      newsForm.value.customContent = updatedContents
    }
  }

  const startEditingNews = (news) => {
    editingNews.value = news
    let initCustomTitle = news.title ? JSON.parse(JSON.stringify(news.title)) : { it: '' }
    let initCustomContent = news.content ? JSON.parse(JSON.stringify(news.content)) : { it: '' }

    if (typeof initCustomTitle === 'string') initCustomTitle = { it: initCustomTitle }
    if (typeof initCustomContent === 'string') initCustomContent = { it: initCustomContent }
    if (!initCustomTitle.it) initCustomTitle.it = ''
    if (!initCustomContent.it) initCustomContent.it = ''

    newsForm.value = {
      id: news.id,
      type: news.type || 'general',
      priority: news.priority || 'normal',
      association_id: news.association_id || 'org_coordinamento',
      related_service_id: news.related_service_id || null,
      useCustomText: !!news.id,
      template: 'posti_esauriti',
      templateParams: {},
      customTitle: initCustomTitle,
      customContent: initCustomContent,
      sendPushNotification: true
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startCreatingNews = () => {
    editingNews.value = { id: null }
    newsForm.value = {
      id: null,
      type: 'general',
      priority: 'normal',
      association_id: '',
      related_service_id: null,
      useCustomText: false,
      template: 'posti_esauriti',
      templateParams: {},
      customTitle: { it: '' },
      customContent: { it: '' },
      sendPushNotification: true
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditingNews = () => {
    editingNews.value = null
    newsForm.value = { id: null }
  }

  const saveNewsChanges = async () => {
    if (!supabase || !editingNews.value) return
    savingNewsId.value = true
    try {
      let finalTitle, finalContent
      if (newsForm.value.useCustomText) {
        finalTitle = JSON.parse(JSON.stringify(newsForm.value.customTitle))
        finalContent = JSON.parse(JSON.stringify(newsForm.value.customContent))
      } else if (buildMultilangObjFromTemplate) {
        finalTitle = buildMultilangObjFromTemplate(newsForm.value.template, newsForm.value.templateParams, true)
        finalContent = buildMultilangObjFromTemplate(newsForm.value.template, newsForm.value.templateParams, false)
      } else {
        finalTitle = newsForm.value.customTitle
        finalContent = newsForm.value.customContent
      }

      const payload = {
        type: newsForm.value.type,
        priority: newsForm.value.priority,
        association_id: newsForm.value.association_id || null,
        related_service_id: newsForm.value.related_service_id || null,
        title: finalTitle,
        content: finalContent
      }

      let insertedItem = null
      if (newsForm.value.id) {
        const { data, error } = await supabase.from('news').update(payload).eq('id', newsForm.value.id).select()
        if (error) throw error
        insertedItem = data?.[0]
      } else {
        const { data, error } = await supabase.from('news').insert([payload]).select()
        if (error) throw error
        insertedItem = data?.[0]
      }

      // Recupera il nome del servizio collegato (se presente)
      let serviceName = ''
      if (newsForm.value.related_service_id && servicesRef?.value) {
        const found = servicesRef.value.find(s => s.id === newsForm.value.related_service_id)
        if (found) {
          serviceName = found.name || ''
        }
      }

      // 1. Spedisci notifica push globale a tutti i telefoni tramite OneSignal se abilitato (default: attivo)
      let pushFeedback = ''
      if (newsForm.value.sendPushNotification !== false) {
        try {
          const pushRes = await sendOneSignalPush({
            title: payload.title,
            content: payload.content,
            type: payload.type,
            priority: payload.priority,
            association_id: payload.association_id,
            serviceName: serviceName,
            url: 'https://lorenzocarbone.github.io/portaleaccoglienzacomo/?tab=news',
            newsId: insertedItem?.id || newsForm.value.id
          })
          if (pushRes?.errors && pushRes.errors.length > 0) {
            if (pushRes.errors.some(e => typeof e === 'string' && e.includes('All included players are not subscribed'))) {
              pushFeedback = ' (Attenzione: nessun dispositivo è attualmente iscritto alle notifiche!)'
            } else {
              pushFeedback = ` (Errore invio notifica: ${pushRes.errors.join(', ')})`
            }
          } else if (pushRes?.id) {
            pushFeedback = ' (notifica push inviata!)'
          }
        } catch (pushErr) {
          console.warn('[OneSignal] Errore invio push:', pushErr)
        }
      }

      // 2. Invia broadcast Realtime di supporto per aggiornare le schede aperte
      try {
        await alertsChannel.send({
          type: 'broadcast',
          event: 'news_published',
          payload: {
            id: insertedItem?.id || newsForm.value.id || Date.now()
          }
        })
      } catch (broadcastErr) {
        console.warn('[Push] Errore invio broadcast Realtime:', broadcastErr)
      }

      await fetchNews()
      alert(newsForm.value.id ? `Notizia aggiornata!${pushFeedback}` : `Notizia pubblicata!${pushFeedback}`)
      cancelEditingNews()
    } catch (err) {
      alert('Errore pubblicazione: ' + err.message)
    } finally {
      savingNewsId.value = false
    }
  }

  const stripCodeFences = (raw = "") => {
    let s = String(raw || "").trim()
    if (s.startsWith("```")) {
      s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "").trim()
    }
    return s
  }

  const resolveRelatedServiceId = (rawRef) => {
    if (!rawRef) return null
    const list = servicesRef?.value || []
    const str = String(rawRef).trim()
    if (!str) return null
    const byId = list.find(s => s.id === str)
    if (byId) return byId.id
    const lower = str.toLowerCase()
    const byName = list.find(s => {
      const itName = (typeof s.name === "object" ? s.name?.it : s.name) || ""
      return itName.toLowerCase().includes(lower)
    })
    return byName ? byName.id : null
  }

  const normalizeAlertInput = (item = {}) => {
    const type = item.type || "general"
    const priority = item.priority || (type === "emergency" ? "high" : "normal")
    const related_service_id = resolveRelatedServiceId(item.related_service_id ?? item.service_id ?? item.service ?? null)
    const title = typeof item.title === "string" ? { it: item.title } : JSON.parse(JSON.stringify(item.title || { it: "" }))
    const content = typeof item.content === "string" ? { it: item.content } : JSON.parse(JSON.stringify(item.content || { it: "" }))
    if (!title.it) title.it = ""
    if (!content.it) content.it = ""
    return {
      id: item.id || null,
      type,
      priority,
      association_id: item.association_id || null,
      related_service_id,
      title,
      content,
      sendPushNotification: item.sendPushNotification !== false
    }
  }

  const publishNewsAlert = async (rawAlert) => {
    if (!supabase) throw new Error("Connessione Supabase non disponibile.")
    const alertItem = normalizeAlertInput(rawAlert)
    if (!alertItem.title.it && !Object.values(alertItem.title).some(Boolean)) {
      throw new Error("Titolo dell'avviso mancante nello snippet.")
    }
    const payload = {
      type: alertItem.type,
      priority: alertItem.priority,
      association_id: alertItem.association_id,
      related_service_id: alertItem.related_service_id,
      title: alertItem.title,
      content: alertItem.content
    }

    let insertedItem = null
    if (alertItem.id) {
      const { data, error } = await supabase.from("news").update(payload).eq("id", alertItem.id).select()
      if (error) throw error
      insertedItem = data?.[0]
    } else {
      const { data, error } = await supabase.from("news").insert([payload]).select()
      if (error) throw error
      insertedItem = data?.[0]
    }

    let serviceName = ""
    if (alertItem.related_service_id && servicesRef?.value) {
      const found = servicesRef.value.find(s => s.id === alertItem.related_service_id)
      if (found) serviceName = found.name || ""
    }

    let pushFeedback = ""
    if (alertItem.sendPushNotification !== false) {
      try {
        const pushRes = await sendOneSignalPush({
          title: payload.title,
          content: payload.content,
          type: payload.type,
          priority: payload.priority,
          association_id: payload.association_id,
          serviceName,
          url: "https://lorenzocarbone.github.io/portaleaccoglienzacomo/?tab=news",
          newsId: insertedItem?.id || alertItem.id
        })
        if (pushRes?.errors && pushRes.errors.length > 0) {
          if (pushRes.errors.some(e => typeof e === "string" && e.includes("All included players are not subscribed"))) {
            pushFeedback = " (Attenzione: nessun dispositivo attualmente iscritto alle notifiche)"
          } else {
            pushFeedback = ` (Errore invio notifica: ${pushRes.errors.join(", ")})`
          }
        } else if (pushRes?.id) {
          pushFeedback = " (notifica push inviata!)"
        }
      } catch (pushErr) {
        console.warn("[OneSignal] Errore invio push:", pushErr)
      }
    }

    try {
      await alertsChannel.send({
        type: "broadcast",
        event: "news_published",
        payload: { id: insertedItem?.id || alertItem.id || Date.now() }
      })
    } catch (e) {}

    await fetchNews()
    return { insertedItem, pushFeedback }
  }

  const parseAlertObjectFromSnippet = async (rawCode) => {
    const cleaned = stripCodeFences(rawCode)
    if (!cleaned) throw new Error("Incolla prima uno snippet valido.")
    if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
      const fn = new Function(`return (${cleaned});`)
      return fn()
    }
    let captured = null
    const dryPublish = async (obj) => { captured = obj; return obj }
    const varMatch = cleaned.match(/^(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/)
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const body = varMatch && !cleaned.includes("publishNews") ? `${cleaned}\nreturn ${varMatch[1]};` : cleaned
    const runner = new AsyncFunction("publishNews", "services", body)
    const ret = await runner(dryPublish, servicesRef?.value || [])
    return captured || ret
  }

  const loadNewsSnippetToEditor = async (rawCode) => {
    const parsed = await parseAlertObjectFromSnippet(rawCode)
    const target = Array.isArray(parsed) ? parsed[0] : parsed
    if (!target || typeof target !== "object") {
      throw new Error("Impossibile estrarre i dati dell'avviso dallo snippet.")
    }
    const norm = normalizeAlertInput(target)
    editingNews.value = { id: norm.id }
    newsForm.value = {
      id: norm.id,
      type: norm.type,
      priority: norm.priority,
      association_id: norm.association_id || "",
      related_service_id: norm.related_service_id,
      useCustomText: true,
      template: "posti_esauriti",
      templateParams: {},
      customTitle: norm.title,
      customContent: norm.content,
      sendPushNotification: norm.sendPushNotification
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    return norm
  }

  const executeNewsSnippet = async (rawCode) => {
    const cleaned = stripCodeFences(rawCode)
    if (!cleaned) return false
    const confirmed = confirm("Vuoi pubblicare subito questo avviso e inviare la relativa notifica push?")
    if (!confirmed) return false
    savingNewsId.value = true
    try {
      let feedbacks = []
      if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
        const parsed = new Function(`return (${cleaned});`)()
        const items = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of items) {
          const res = await publishNewsAlert(item)
          if (res.pushFeedback) feedbacks.push(res.pushFeedback)
        }
      } else {
        let calledPublish = false
        const wrappedPublish = async (item) => {
          calledPublish = true
          const res = await publishNewsAlert(item)
          if (res.pushFeedback) feedbacks.push(res.pushFeedback)
          return res
        }
        const varMatch = cleaned.match(/^(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/)
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        const body = varMatch && !cleaned.includes("publishNews") && !cleaned.includes("supabase") ? `${cleaned}\nreturn ${varMatch[1]};` : cleaned
        const executor = new AsyncFunction("publishNews", "supabase", "sendOneSignalPush", "services", "globalNews", "fetchNews", body)
        const ret = await executor(wrappedPublish, supabase, sendOneSignalPush, servicesRef?.value || [], globalNews.value, fetchNews)
        if (!calledPublish && ret && typeof ret === "object") {
          const items = Array.isArray(ret) ? ret : [ret]
          for (const item of items) {
            if (item?.title || item?.content) {
              const res = await publishNewsAlert(item)
              if (res.pushFeedback) feedbacks.push(res.pushFeedback)
            }
          }
        }
      }
      await fetchNews()
      alert("Avviso pubblicato con successo!" + (feedbacks[0] || ""))
      cancelEditingNews()
      return true
    } catch (err) {
      alert("Errore esecuzione snippet avviso:\n" + err.message)
      return false
    } finally {
      savingNewsId.value = false
    }
  }

  const deleteNewsItem = async (news) => {
    if (!supabase) return
    const confirmed = confirm('Eliminare definitivamente questa notizia?')
    if (!confirmed) return
    try {
      const { data, error } = await supabase.from('news').delete().eq('id', news.id).select()
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Il database ha bloccato l'operazione. Verifica le policy RLS (DELETE) su Supabase.")
      }
      globalNews.value = globalNews.value.filter(n => n.id !== news.id)
    } catch (err) {
      alert('Eliminazione non riuscita: ' + err.message)
    }
  }

  const deleteMultipleNews = async (ids) => {
    if (!supabase || !Array.isArray(ids) || ids.length === 0) return false
    const msg = ids.length === globalNews.value.length
      ? `Sei sicuro di voler svuotare l'intera sezione notizie eliminando tutti i ${ids.length} avvisi?`
      : `Sei sicuro di voler eliminare definitivamente ${ids.length} avvisi selezionati?`
    if (!confirm(msg)) return false

    try {
      const { data, error } = await supabase.from('news').delete().in('id', ids).select()
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Il database ha bloccato l'operazione. Verifica le policy RLS (DELETE) su Supabase.")
      }
      const deletedSet = new Set(ids)
      globalNews.value = globalNews.value.filter(n => !deletedSet.has(n.id))
      return true
    } catch (err) {
      alert('Eliminazione multipla non riuscita: ' + err.message)
      return false
    }
  }

  return {
    globalNews,
    isLoadingNews,
    editingNews,
    newsForm,
    savingNewsId,
    selectedNewLangNews,
    NEWS_TYPES,
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
    publishNewsAlert,
    loadNewsSnippetToEditor,
    executeNewsSnippet,
    deleteNewsItem,
    deleteMultipleNews
  }
}
