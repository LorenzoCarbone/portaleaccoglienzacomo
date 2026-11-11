import { ref, computed } from 'vue'
import languages from '../config/languages.json'
import daysOfWeek from '../config/daysOfWeek.json'

import it from '../locales/it.json'
import en from '../locales/en.json'
import fr from '../locales/fr.json'
import es from '../locales/es.json'
import ar from '../locales/ar.json'
import ur from '../locales/ur.json'
import hi from '../locales/hi.json'
import sw from '../locales/sw.json'
import tr from '../locales/tr.json'

const locales = { it, en, fr, es, ar, ur, hi, sw, tr }

const currentLangCode = ref(localStorage.getItem('vicini_lang') || 'it')

export function useI18n() {
  const currentLang = computed(() => languages[currentLangCode.value] || languages.it)
  const isRTL = computed(() => Boolean(currentLang.value?.rtl))

  const selectLanguage = (code) => {
    if (languages[code]) {
      currentLangCode.value = code
      localStorage.setItem('vicini_lang', code)
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (OneSignal.User && OneSignal.User.setLanguage) {
            try {
              await OneSignal.User.setLanguage(code)
            } catch (e) {}
          }
        })
      }
    }
  }

  const t = (key, params = {}) => {
    let text = locales[currentLangCode.value]?.[key] || locales.en?.[key] || locales.it?.[key] || key
    if (typeof text === 'string' && Object.keys(params).length > 0) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v)
      }
    }
    return text
  }

  const extractText = (field, lang = null) => {
    if (!field) return ''
    if (typeof field === 'string') return field
    const targetLang = lang || currentLangCode.value
    return field[targetLang] || field.en || field.it || Object.values(field)[0] || ''
  }

  const translateField = (obj, fieldName) => {
    if (!obj) return ''
    const field = fieldName ? obj[fieldName] : obj
    return extractText(field, currentLangCode.value)
  }

  const formatHours = (hoursArray, langCode = null) => {
    const code = langCode || currentLangCode.value || 'it'
    if (!hoursArray || !hoursArray.length) {
      return locales[code]?.hours_not_available || locales.it?.hours_not_available || 'Orari non inseriti'
    }
    return hoursArray.map(h => {
      const dayObj = daysOfWeek.find(d => d.id === h.day)
      const dayName = dayObj ? (dayObj.label[code] || dayObj.label.en || dayObj.label.it || '') : ''
      return `${dayName}: ${h.open} - ${h.close}`
    }).join('\n')
  }

  const generateTemplateText = (templateId, params, langCode, isTitle = false) => {
    if (!templateId || templateId === 'none' || templateId === 'custom') return ''
    const prefix = isTitle ? 'tpl_title_' : 'tpl_desc_'
    const targetLang = langCode || currentLangCode.value

    let text = locales[targetLang]?.[prefix + templateId] || locales.en?.[prefix + templateId] || locales.it?.[prefix + templateId] || ''

    if (params) {
      for (const key in params) {
        let val = params[key] || `[${key}]`
        if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const d = new Date(val)
          val = d.toLocaleDateString(targetLang === 'en' ? 'en-GB' : 'it-IT')
        }
        text = text.replace(new RegExp(`{${key}}`, 'g'), val)
      }
    }
    return text
  }

  const buildMultilangObjFromTemplate = (templateId, params, isTitle = false) => {
    const result = {}
    if (!templateId || templateId === 'none' || templateId === 'custom') return result
    for (const langCode in languages) {
      result[langCode] = generateTemplateText(templateId, params, langCode, isTitle)
    }
    return result
  }

  return {
    locales,
    languages,
    currentLangCode,
    currentLang,
    isRTL,
    selectLanguage,
    t,
    extractText,
    translateField,
    formatHours,
    daysOfWeek,
    generateTemplateText,
    buildMultilangObjFromTemplate
  }
}
