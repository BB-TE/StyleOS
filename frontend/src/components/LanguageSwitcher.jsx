import { useI18n } from '../hooks/useI18n.js'

export function LanguageSwitcher({ dark = false }) {
  const { language, setLanguage, t } = useI18n()
  const baseClass = dark ? 'border-white/20 text-white/55' : 'border-white/10 text-stone'
  const activeClass = dark ? 'bg-acid text-paper' : 'bg-white/10 text-ink'

  return (
    <div
      className={`inline-flex h-9 items-center rounded-full border p-0.5 ${baseClass}`}
      role="group"
      aria-label={t('language.label')}
    >
      <button
        type="button"
        className={`focus-ring${dark ? '-dark' : ''} h-7 rounded-full px-2 text-[10px] transition-colors ${
          language === 'zh' ? activeClass : ''
        }`}
        aria-pressed={language === 'zh'}
        onClick={() => setLanguage('zh')}
      >
        {t('language.chinese')}
      </button>
      <button
        type="button"
        className={`focus-ring${dark ? '-dark' : ''} h-7 rounded-full px-2 text-[10px] transition-colors ${
          language === 'en' ? activeClass : ''
        }`}
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        {t('language.english')}
      </button>
    </div>
  )
}
