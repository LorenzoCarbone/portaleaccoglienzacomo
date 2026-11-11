import { ref, computed } from 'vue'
import { supabase, alertsChannel } from '../lib/supabase'
import organizations from '../config/organizations.json'
import languages from '../config/languages.json'

const globalNews = ref([])
const isLoadingNews = ref(true)
const editingNews = ref(null)
const savingNewsId = ref(false)
const selectedNewLangNews = ref('')

const newsForm = ref({
  id: null,
  type: 'general',
  priority: 'normal',
  association_id: 'org_coordinamento',
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
  emergency: { icon: 'fa-solid fa-triangle-exclamation', badgeClass: 'bg-red-100 text-red-700' }
}

const lastViewedNewsTime = ref(parseInt(localStorage.getItem('vds_last_news_time')) || 0)

export function useNews(buildMultilangObjFromTemplate = null) {
  const getNewsTypeStyle = (type) => NEWS_TYPES[type] || NEWS_TYPES.general

  const isUrgency = (level) => {
    if (level === 'info' && newsForm.value.type === 'general') return true
    if (level === 'update' && newsForm.value.type === 'service_update') return true
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
      return new Date(isoDate).toLocaleString('it-IT', {
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
        return { ...n, association: org ? org.name : 'Coordinamento Vicini di Strada' }
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

  const addLangToNews = () => {
    if (selectedNewLangNews.value) {
      newsForm.value.customTitle[selectedNewLangNews.value] = ''
      newsForm.value.customContent[selectedNewLangNews.value] = ''
      selectedNewLangNews.value = ''
    }
  }

  const deleteLangFromNews = (langCode) => {
    delete newsForm.value.customTitle[langCode]
    delete newsForm.value.customContent[langCode]
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
      customContent: initCustomContent
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startCreatingNews = () => {
    editingNews.value = { id: null }
    newsForm.value = {
      id: null,
      type: 'general',
      priority: 'normal',
      association_id: 'org_coordinamento',
      related_service_id: null,
      useCustomText: false,
      template: 'posti_esauriti',
      templateParams: {},
      customTitle: { it: '' },
      customContent: { it: '' }
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
        association_id: 'org_coordinamento',
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

      // 1. Invia broadcast Realtime a tutti i telefoni e computer connessi
      try {
        await alertsChannel.send({
          type: 'broadcast',
          event: 'news_published',
          payload: {
            id: insertedItem?.id || newsForm.value.id || Date.now(),
            title: payload.title,
            content: payload.content,
            type: payload.type,
            priority: payload.priority
          }
        })
      } catch (broadcastErr) {
        console.warn('[Push] Errore invio broadcast Realtime:', broadcastErr)
      }

      // 2. Invoca la Edge Function su Supabase per raggiungere tutti i dispositivi
      try {
        await supabase.functions.invoke('send-push', {
          body: {
            newsId: insertedItem?.id || newsForm.value.id,
            title: payload.title,
            content: payload.content,
            type: payload.type,
            priority: payload.priority
          }
        })
      } catch (edgeErr) {
        console.warn('[Push] Edge function non ancora attiva:', edgeErr)
      }

      // 2. Notifica di sistema immediata sul dispositivo dell'operatore che pubblica
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const lang = localStorage.getItem('vds_lang') || 'it'
        const titleText = (typeof payload.title === 'object' ? (payload.title[lang] || payload.title.it) : payload.title) || 'Nuovo avviso dai servizi'
        const bodyText = (typeof payload.content === 'object' ? (payload.content[lang] || payload.content.it) : payload.content) || 'Nuova notizia pubblicata.'

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(titleText, {
              body: bodyText,
              icon: '/portaleaccoglienzacomo/pwa-192x192.png',
              badge: '/portaleaccoglienzacomo/pwa-192x192.png',
              vibrate: [200, 100, 200],
              tag: 'news-' + (insertedItem?.id || Date.now()),
              renotify: true,
              data: { url: '/portaleaccoglienzacomo/?tab=news' }
            })
          }).catch(console.error)
        }
      }

      await fetchNews()
      alert(newsForm.value.id ? 'Notizia aggiornata e notificata!' : 'Notizia pubblicata e inviata come notifica!')
      cancelEditingNews()
    } catch (err) {
      alert('Errore pubblicazione: ' + err.message)
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
    deleteNewsItem
  }
}
