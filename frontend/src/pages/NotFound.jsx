import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n.js'

export function NotFound() {
  const { t } = useI18n()

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-[96rem] items-center px-5 py-16 sm:px-8 lg:px-12">
      <div className="soft-panel system-grid w-full p-8 sm:p-12">
        <p className="signal-label text-acid">{t('notFound.eyebrow')}</p>
        <h1 className="mt-7 font-display text-5xl tracking-[-0.04em] sm:text-7xl">{t('notFound.title')}</h1>
        <Link
          to="/"
          className="acid-button focus-ring mt-8 h-11 gap-3 px-5 text-[10px] uppercase tracking-[0.14em]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {t('notFound.back')}
        </Link>
      </div>
    </main>
  )
}
