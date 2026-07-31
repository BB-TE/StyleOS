import { useCallback, useEffect, useMemo, useState } from 'react'
import { supportedLanguages, translate, translations } from '../data/i18n.js'
import { I18nContext } from './i18nContext.js'

const STORAGE_KEY = 'styleos.language'

function getInitialLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (supportedLanguages.includes(saved)) return saved
  } catch {
    // Browser storage can be unavailable in privacy-restricted contexts.
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const setLanguage = useCallback((nextLanguage) => {
    if (!supportedLanguages.includes(nextLanguage)) return
    setLanguageState(nextLanguage)
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage)
    } catch {
      // Keep the in-memory language even when storage is unavailable.
    }
  }, [])

  const t = useCallback((key) => translate(language, key), [language])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = translations[language].meta.title
    const description = document.querySelector('meta[name="description"]')
    description?.setAttribute('content', translations[language].meta.description)
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
