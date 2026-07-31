import { LockKeyhole } from 'lucide-react'
import { useI18n } from '../hooks/useI18n.js'

export function PrivacyNote() {
  const { t } = useI18n()

  return (
    <section className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="soft-panel grid gap-8 p-7 lg:grid-cols-[0.42fr_1fr] lg:gap-12 lg:p-12">
        <div className="flex items-start gap-3 text-stone">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-acid/30 text-acid"><LockKeyhole size={16} strokeWidth={1.5} aria-hidden="true" /></span>
          <p className="signal-label mt-3">{t('home.privacy.eyebrow')}</p>
        </div>
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl tracking-[-0.035em] sm:text-5xl">{t('home.privacy.title')}</h2>
          <p className="mt-6 text-base leading-7 text-stone">{t('home.privacy.description')}</p>
          <p className="mt-4 text-sm leading-6 text-stone">{t('home.privacy.future')}</p>
        </div>
      </div>
    </section>
  )
}
