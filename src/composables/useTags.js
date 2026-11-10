import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import languages from '../config/languages.json'

const dbTags = ref([])
const isLoadingTags = ref(true)
const editingTag = ref(null)
const tagForm = ref({ id: '', translations: { it: '' } })
const savingTag = ref(false)
const isEditingExistingTag = ref(false)
const selectedNewLangTag = ref('')

export function useTags(searchQuery = ref(''), currentLangCode = ref('it')) {
  const fetchTags = async () => {
    if (!supabase) {
      isLoadingTags.value = false
      return
    }
    isLoadingTags.value = true
    try {
      const { data, error } = await supabase.from('tags').select('*').order('id', { ascending: true })
      if (error) throw error
      if (data) dbTags.value = data
    } catch (error) {
      console.error(error.message)
    } finally {
      isLoadingTags.value = false
    }
  }

  const searchSuggestions = computed(() => {
    const q = searchQuery.value?.toLowerCase()?.trim() || ''
    if (q.length < 2) return []
    const lang = currentLangCode.value
    const matches = []

    dbTags.value.forEach(tag => {
      const translationString = tag.translations?.[lang] || tag.translations?.it || ''
      const words = translationString.split(',').map(w => w.trim().toLowerCase())
      const matchedWord = words.find(w => w.startsWith(q))

      if (matchedWord) {
        const formattedWord = matchedWord.charAt(0).toUpperCase() + matchedWord.slice(1)
        matches.push({ id: tag.id, text: formattedWord })
      }
    })

    const uniqueMatches = []
    const seen = new Set()
    for (const m of matches) {
      if (!seen.has(m.text)) {
        seen.add(m.text)
        uniqueMatches.push(m)
      }
    }

    if (uniqueMatches.length === 1 && uniqueMatches[0].text.toLowerCase() === q) {
      return []
    }

    return uniqueMatches.slice(0, 5)
  })

  const startCreatingTag = () => {
    editingTag.value = { id: '' }
    isEditingExistingTag.value = false
    tagForm.value = { id: '', translations: { it: '' } }
  }

  const startEditingTag = (tag) => {
    editingTag.value = tag
    isEditingExistingTag.value = true
    tagForm.value = { id: tag.id, translations: JSON.parse(JSON.stringify(tag.translations || {})) }
  }

  const cancelEditingTag = () => {
    editingTag.value = null
    tagForm.value = { id: '', translations: { it: '' } }
  }

  const availableLangsForTag = computed(() => {
    const available = {}
    for (const code in languages) {
      if (code !== 'it' && tagForm.value.translations && tagForm.value.translations[code] === undefined) {
        available[code] = languages[code]
      }
    }
    return available
  })

  const addLangToTag = () => {
    if (selectedNewLangTag.value) {
      tagForm.value.translations[selectedNewLangTag.value] = ''
      selectedNewLangTag.value = ''
    }
  }

  const saveTagChanges = async () => {
    if (!supabase || !tagForm.value.id.trim()) return
    savingTag.value = true
    try {
      const formattedId = tagForm.value.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      const payload = { id: formattedId, translations: tagForm.value.translations }
      const { error } = await supabase.from('tags').upsert(payload).select()
      if (error) throw error
      await fetchTags()
      alert('Tag salvato con successo!')
      cancelEditingTag()
    } catch (err) {
      alert('Errore salvataggio tag: ' + err.message)
    } finally {
      savingTag.value = false
    }
  }

  const deleteTagItem = async (tagId) => {
    if (!supabase) return
    const conf = confirm(`Eliminare il tag "${tagId}"? Verrà rimosso dai servizi a cui è assegnato.`)
    if (!conf) return
    try {
      const { error } = await supabase.from('tags').delete().eq('id', tagId)
      if (error) throw error
      await fetchTags()
    } catch (err) {
      alert('Errore: ' + err.message)
    }
  }

  return {
    dbTags,
    isLoadingTags,
    editingTag,
    tagForm,
    savingTag,
    isEditingExistingTag,
    selectedNewLangTag,
    fetchTags,
    searchSuggestions,
    startCreatingTag,
    startEditingTag,
    cancelEditingTag,
    availableLangsForTag,
    addLangToTag,
    saveTagChanges,
    deleteTagItem
  }
}
