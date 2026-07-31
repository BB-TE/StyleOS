import { ArrowDown, ArrowRight, ShoppingBag } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { routeById } from '../data/routes.js'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'

const signals = [
  ['taste', 82],
  ['fit', 68],
  ['context', 91],
]

export function HomeHero() {
  const { t } = useI18n()
  const heroRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const visualOpacity = useTransform(scrollYProgress, [0, .85], [1, .3])

  return (
    <section ref={heroRef} className="system-grid scan-surface border-b border-white/10">
      <div className="relative z-[2] mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-[96rem] lg:grid-cols-[1.08fr_.92fr]">
        <div className="flex flex-col justify-center px-5 py-20 sm:px-8 lg:border-r lg:border-white/10 lg:px-12 lg:py-28 xl:px-16">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-acid" aria-hidden="true" />
            <p className="signal-label text-acid">{t('home.hero.badge')}</p>
          </div>
          <h1 className="mt-10 max-w-5xl font-display text-[3.35rem] leading-[.92] tracking-[-.065em] sm:text-7xl lg:text-[5.4rem] xl:text-[6.8rem]">
            {t('home.hero.titleLineOne')}
            <br />
            <span className="text-acid">{t('home.hero.titleLineTwo')}</span>
          </h1>
          <p className="mt-9 max-w-xl text-sm leading-7 text-stone sm:text-base">{t('home.hero.description')}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={routeById.purchase.path}
              onClick={() => track('click_start_purchase', { source: 'home_hero' })}
              className="acid-button focus-ring-dark group h-12 gap-8 px-6 text-[10px] uppercase tracking-[.15em]"
            >
              <ShoppingBag size={14} />
              {t('home.hero.primaryCta')}
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={15} />
            </Link>
            <button type="button" onClick={() => document.getElementById('core-feature')?.scrollIntoView({ behavior: 'smooth' })} className="button-copy focus-ring inline-flex h-12 items-center justify-center gap-3 rounded-full border border-white/15 px-5 text-stone transition-colors hover:border-white/30 hover:text-ink">
              {t('home.hero.allFeaturesCta')}
              <ArrowDown size={14} />
            </button>
          </div>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[.12em] text-stone/70">{t('home.hero.note')}</p>
        </div>

        <motion.div
          className="relative min-h-[36rem] overflow-hidden bg-surface/40 px-5 py-12 sm:px-8 lg:min-h-0 lg:px-10 lg:py-16"
          style={reduceMotion ? undefined : { y: visualY, opacity: visualOpacity }}
        >
          <div className="absolute left-1/2 top-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_43%_57%/56%_38%_62%_44%] border border-acid/25 bg-[radial-gradient(circle_at_35%_28%,rgba(215,255,69,.29),rgba(78,93,62,.15)_36%,rgba(11,13,11,.04)_68%)] shadow-[0_0_120px_rgba(215,255,69,.08)]" />

          <div className="soft-panel absolute left-6 top-7 w-[15rem] p-5 sm:left-10 sm:top-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="signal-label text-acid">{t('home.hero.previewLabel')}</span>
              <span className="h-2 w-2 rounded-full bg-acid shadow-[0_0_18px_rgba(215,255,69,.75)]" />
            </div>
            <p className="mt-5 font-display text-2xl">{t('home.hero.previewItem')}</p>
            <p className="mt-2 text-xs leading-5 text-stone">{t('home.hero.previewContext')}</p>
          </div>

          <div className="soft-panel absolute bottom-8 right-6 w-[17rem] p-5 sm:bottom-12 sm:right-10">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
              <div>
                <p className="signal-label">{t('home.hero.previewResultLabel')}</p>
                <p className="mt-2 font-display text-3xl text-acid">{t('home.hero.previewResult')}</p>
              </div>
              <span className="font-display text-4xl">74</span>
            </div>
            <div className="space-y-3 pt-4">
              {signals.map(([key, value], index) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between font-mono text-[7px] uppercase tracking-wider text-stone">
                    <span>0{index + 1} / {t(`home.hero.${key}`)}</span><span>{value}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-acid" style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <p className="absolute bottom-5 left-6 font-mono text-[8px] tracking-[.16em] text-stone sm:left-10">ONE CORE DECISION. A SYSTEM OF EVIDENCE.</p>
        </motion.div>
      </div>
    </section>
  )
}
