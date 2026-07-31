import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n.js'

export function PageShell({ route, index, children, action }) {
  const { t } = useI18n()

  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-[96rem] px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12 lg:pb-24">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="soft-panel system-grid min-h-[38rem] p-7 sm:p-10 lg:p-14">
          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-acid">
            <span>{index}</span>
            <span className="h-px w-10 bg-acid/50" aria-hidden="true" />
            <span>{t(`${route.copyKey}.eyebrow`)}</span>
          </div>
          <h1 className="mt-10 max-w-5xl font-display text-4xl leading-[.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            {t(`${route.copyKey}.title`)}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-7 text-stone sm:text-lg">
            {t(`${route.copyKey}.description`)}
          </p>
          {children}
        </section>

        <aside className="soft-panel flex min-h-72 flex-col p-6">
          <div className="flex items-center justify-between"><p className="signal-label">{t('common.v1Workspace')}</p><span className="h-2 w-2 rounded-full bg-acid shadow-[0_0_15px_rgba(215,255,69,.6)]" /></div>
          <div className="my-8 grid grid-cols-5 gap-1" aria-hidden="true">{[35,62,48,79,91,56,82,67,42,73].map((value, i) => <span key={i} className="flex h-8 items-end rounded-sm bg-white/[.025]"><i className="block w-full bg-acid/45" style={{ height: `${value}%` }} /></span>)}</div>
          <p className="text-sm leading-6 text-stone">
            {t('common.routeReady')}
          </p>
          {action ? (
            <Link
              to={action.path}
              className="acid-button focus-ring mt-auto h-11 gap-5 px-5"
            >
              {t(`${action.copyKey}.label`)}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </aside>
      </div>
    </main>
  )
}
