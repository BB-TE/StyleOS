import {
  ArrowRight,
  BookOpen,
  Brain,
  CircleCheck,
  Database,
  FileText,
  Gauge,
  History as HistoryIcon,
  PackageOpen,
  Palette,
  ScanSearch,
  Settings2,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HomeHero } from '../components/HomeHero.jsx'
import { HomeScrollProgress } from '../components/HomeScrollProgress.jsx'
import { HomeSectionHeader } from '../components/HomeSectionHeader.jsx'
import { PrivacyNote } from '../components/PrivacyNote.jsx'
import { ScrollReveal } from '../components/ScrollReveal.jsx'
import { routeById } from '../data/routes.js'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'

const memorySignals = [
  ['taste', Sparkles],
  ['wardrobe', PackageOpen],
  ['budget', Gauge],
  ['outcomes', Database],
]

const supportingGroups = [
  {
    id: 'evidence',
    items: [
      ['analysis', Settings2, routeById.analysis],
      ['report', Brain, routeById.report],
      ['wardrobe', PackageOpen, routeById.wardrobe],
    ],
  },
  {
    id: 'assist',
    items: [
      ['today', Gauge, routeById.today],
      ['styles', BookOpen, routeById.styles],
      ['colorLab', Palette, routeById.colorLab],
    ],
  },
  {
    id: 'learn',
    items: [
      ['history', HistoryIcon, routeById.history],
      ['sampleReport', FileText, routeById.sampleReport],
    ],
  },
]

const coreSteps = [
  ['input', ScanSearch],
  ['read', Database],
  ['judge', Brain],
  ['answer', CircleCheck],
]

export function Home() {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  useEffect(() => { track('view_home') }, [])

  return (
    <main>
      <HomeScrollProgress />
      <HomeHero />

      <section id="core-feature" className="scroll-mt-24 border-b border-white/10 bg-paper">
        <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <HomeSectionHeader
            eyebrow={t('home.coreFeature.eyebrow')}
            title={t('home.coreFeature.title')}
            description={t('home.coreFeature.description')}
          />

          <div className="mt-14 overflow-hidden rounded-[2rem] border border-acid/25 bg-surface shadow-[0_32px_100px_rgba(0,0,0,.28)]">
            <div className="grid lg:grid-cols-[.82fr_1.18fr]">
              <ScrollReveal className="flex min-h-[34rem] flex-col border-b border-white/10 p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-12">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-acid px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[.13em] text-black">
                    {t('home.coreFeature.primaryBadge')}
                  </span>
                  <ShoppingBag className="text-acid" size={22} strokeWidth={1.4} />
                </div>
                <h3 className="mt-12 max-w-xl font-display text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl">
                  {t('home.coreFeature.cardTitle')}
                </h3>
                <p className="mt-6 max-w-xl text-base leading-7 text-stone">
                  {t('home.coreFeature.cardBody')}
                </p>
                <div className="mt-auto pt-12">
                  <Link
                    to={routeById.purchase.path}
                    onClick={() => track('click_start_purchase', { source: 'home_core' })}
                    className="acid-button focus-ring-dark group h-12 gap-8 px-6 text-[10px] uppercase tracking-[.14em]"
                  >
                    {t('home.coreFeature.action')}
                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={15} />
                  </Link>
                  <p className="mt-5 max-w-md font-mono text-[9px] leading-5 tracking-[.08em] text-stone/75">
                    {t('home.coreFeature.boundary')}
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid bg-paper/35 sm:grid-cols-2">
                {coreSteps.map(([key, Icon], index) => (
                  <motion.article
                    key={key}
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: .25 }}
                    transition={{ duration: .55, delay: index * .07 }}
                    className="min-h-64 border-b border-white/10 p-6 sm:p-8 sm:[&:nth-child(odd)]:border-r"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] tracking-[.17em] text-acid">0{index + 1}</span>
                      <Icon className="text-stone" size={17} strokeWidth={1.5} />
                    </div>
                    <h4 className="mt-12 font-display text-2xl tracking-[-.025em]">{t(`home.coreFeature.steps.${key}Title`)}</h4>
                    <p className="mt-4 text-sm leading-6 text-stone">{t(`home.coreFeature.steps.${key}Body`)}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="system-grid border-b border-white/10 bg-surface/30">
        <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
            <ScrollReveal>
              <p className="signal-label text-acid">{t('home.memory.eyebrow')}</p>
              <h2 className="mt-7 max-w-2xl font-display text-4xl leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-6xl">
                {t('home.memory.title')}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-stone">{t('home.memory.description')}</p>
            </ScrollReveal>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
              {memorySignals.map(([key, Icon], index) => (
                <ScrollReveal key={key} delay={(index % 2) * .07} className="bg-paper/90 p-6 sm:min-h-60 sm:p-8">
                  <div className="flex items-center justify-between">
                    <Icon className="text-acid" size={18} strokeWidth={1.5} />
                    <span className="font-mono text-[9px] tracking-[.16em] text-stone">MEMORY / 0{index + 1}</span>
                  </div>
                  <h3 className="mt-10 font-display text-2xl">{t(`home.memory.${key}Title`)}</h3>
                  <p className="mt-4 text-sm leading-6 text-stone">{t(`home.memory.${key}Body`)}</p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[96rem] scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <HomeSectionHeader
          eyebrow={t('home.features.eyebrow')}
          title={t('home.features.title')}
          description={t('home.features.description')}
        />

        <div className="mt-16 space-y-14">
          {supportingGroups.map((group, groupIndex) => (
            <section key={group.id} aria-labelledby={`feature-group-${group.id}`} className="grid gap-7 lg:grid-cols-[.3fr_1fr] lg:gap-12">
              <div>
                <p className="font-mono text-[9px] tracking-[.18em] text-acid">0{groupIndex + 1} / SUPPORT</p>
                <h3 id={`feature-group-${group.id}`} className="mt-4 font-display text-3xl tracking-[-.03em]">{t(`home.features.groups.${group.id}Title`)}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-stone">{t(`home.features.groups.${group.id}Body`)}</p>
              </div>
              <div className={`grid gap-3 ${group.items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                {group.items.map(([key, Icon, route], index) => (
                  <ScrollReveal key={key} delay={index * .06} className="h-full">
                    <Link
                      to={route.path}
                      className="focus-ring group flex h-full min-h-72 flex-col rounded-3xl border border-white/10 bg-surface/65 p-6 transition-all hover:-translate-y-1 hover:border-acid/35 hover:bg-muted sm:p-7"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[8px] uppercase tracking-[.13em] text-stone">
                          {t('home.features.supportBadge')}
                        </span>
                        <Icon className="text-acid" size={18} strokeWidth={1.5} />
                      </div>
                      <h4 className="mt-10 font-display text-2xl tracking-[-.025em]">{t(`${route.copyKey}.label`)}</h4>
                      <p className="mt-4 text-sm leading-6 text-stone">{t(`home.features.items.${key}Body`)}</p>
                      <div className="mt-6 border-t border-white/10 pt-5">
                        <p className="font-mono text-[8px] uppercase tracking-[.14em] text-stone/70">{t('home.features.whenLabel')}</p>
                        <p className="mt-2 text-xs leading-5 text-ink/85">{t(`home.features.items.${key}When`)}</p>
                      </div>
                      <span className="button-copy mt-auto inline-flex items-center gap-2 pt-8">
                        {t('home.features.open')}
                        <ArrowRight className="text-acid transition-transform group-hover:translate-x-1" size={14} />
                      </span>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-muted/40">
        <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <HomeSectionHeader eyebrow={t('home.process.eyebrow')} title={t('home.process.title')} description={t('home.process.description')} />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-4">
            {['setup', 'check', 'decide', 'feedback'].map((key, index) => (
              <motion.li
                key={key}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: .25 }}
                transition={{ duration: .55, delay: index * .07 }}
                className="min-h-64 bg-paper p-6 sm:p-8"
              >
                <span className="font-mono text-[9px] tracking-[.18em] text-acid">0{index + 1} / 04</span>
                <h3 className="mt-12 font-display text-2xl">{t(`home.process.${key}Title`)}</h3>
                <p className="mt-4 text-sm leading-6 text-stone">{t(`home.process.${key}Body`)}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <PrivacyNote />

      <section className="system-grid border-t border-white/10">
        <ScrollReveal className="mx-auto max-w-[96rem] px-5 py-24 text-center sm:px-8 sm:py-32 lg:px-12 lg:py-40">
          <p className="signal-label text-acid">{t('home.finalCta.eyebrow')}</p>
          <h2 className="mx-auto mt-8 max-w-5xl font-display text-4xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">{t('home.finalCta.title')}</h2>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-stone">{t('home.finalCta.description')}</p>
          <Link
            to={routeById.purchase.path}
            onClick={() => track('click_start_purchase', { source: 'home_footer' })}
            className="acid-button focus-ring-dark group mt-10 h-12 gap-10 px-7 text-[10px] uppercase tracking-[.14em]"
          >
            {t('home.finalCta.action')}
            <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
          </Link>
        </ScrollReveal>
      </section>

      <footer className="border-t border-white/10 bg-paper">
        <div className="mx-auto grid max-w-[96rem] gap-5 px-5 py-8 text-xs text-stone sm:px-8 md:grid-cols-3 lg:px-12">
          <span className="font-semibold tracking-[-.04em] text-ink">STYLE<span className="text-acid">OS</span></span>
          <span>{t('home.footer.tagline')}</span>
          <span className="md:text-right">{t('home.footer.boundary')} · {t('home.footer.local')}</span>
        </div>
      </footer>
    </main>
  )
}
