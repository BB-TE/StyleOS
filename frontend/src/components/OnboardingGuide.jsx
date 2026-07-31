import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Database, RefreshCcw, ShieldCheck, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'
import { OPEN_GUIDE_EVENT } from '../utils/guideEvents.js'

const ONBOARDING_KEY = 'styleos.v2.onboardingCompleted'
const PRIVACY_KEY = 'styleos.v2.privacyAcknowledgement'

function hasCompletedOnboarding() {
  try { return localStorage.getItem(ONBOARDING_KEY) === 'true' } catch { return false }
}

function hasPrivacyAcknowledgement() {
  try { return Boolean(localStorage.getItem(PRIVACY_KEY)) } catch { return false }
}

export function OnboardingGuide() {
  const { t } = useI18n()
  const [open, setOpen] = useState(() => !hasCompletedOnboarding())
  const [step, setStep] = useState(0)
  const [acknowledged, setAcknowledged] = useState(() => hasPrivacyAcknowledgement())

  useEffect(() => {
    const showGuide = () => {
      setStep(0)
      setAcknowledged(hasPrivacyAcknowledgement())
      setOpen(true)
      track('tutorial_opened', { source: 'header' })
    }
    window.addEventListener(OPEN_GUIDE_EVENT, showGuide)
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, showGuide)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const next = () => {
    setStep(1)
    track('tutorial_step_complete', { step: 'how_it_works' })
  }

  const finish = () => {
    if (!acknowledged) return
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true')
      localStorage.setItem(PRIVACY_KEY, JSON.stringify({ version: 1, acknowledgedAt: new Date().toISOString(), scope: 'local-v1' }))
    } catch { /* The guide can still close if browser storage is unavailable. */ }
    track('privacy_acknowledged', { version: 1, scope: 'local-v1' })
    track('tutorial_completed', { version: 1 })
    setOpen(false)
  }

  const steps = [
    { icon: Database, title: t('onboarding.flow.memoryTitle'), body: t('onboarding.flow.memoryBody') },
    { icon: ShoppingBag, title: t('onboarding.flow.checkTitle'), body: t('onboarding.flow.checkBody') },
    { icon: RefreshCcw, title: t('onboarding.flow.feedbackTitle'), body: t('onboarding.flow.feedbackBody') },
  ]

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="styleos-guide-title">
          <motion.section className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#101210] text-ink shadow-2xl sm:rounded-[2rem]" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
            <button type="button" onClick={() => setOpen(false)} className="focus-ring absolute right-5 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-stone hover:text-ink" aria-label={t('onboarding.close')}><X size={17} /></button>

            <div className="grid min-h-[36rem] lg:grid-cols-[.72fr_1.28fr]">
              <aside className="relative overflow-hidden border-b border-white/10 bg-acid p-7 text-paper lg:border-b-0 lg:border-r lg:p-10">
                <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full border border-paper/20" />
                <div className="absolute -bottom-6 -right-2 h-40 w-40 rounded-full border border-paper/20" />
                <p className="font-mono text-[9px] uppercase tracking-[.18em]">STYLEOS / FIRST RUN</p>
                <h2 id="styleos-guide-title" className="mt-8 max-w-xs font-display text-4xl leading-[.95] tracking-[-.05em] sm:text-5xl">{step === 0 ? t('onboarding.welcomeTitle') : t('onboarding.privacyTitle')}</h2>
                <p className="mt-6 max-w-sm text-sm leading-6 text-paper/70">{step === 0 ? t('onboarding.welcomeBody') : t('onboarding.privacyIntro')}</p>
                <div className="mt-10 flex gap-2">
                  {[0, 1].map((item) => <span key={item} className={`h-1 rounded-full transition-all ${step === item ? 'w-12 bg-paper' : 'w-5 bg-paper/30'}`} />)}
                </div>
              </aside>

              <div className="flex flex-col p-6 pt-20 sm:p-9 sm:pt-20 lg:p-10 lg:pt-20">
                {step === 0 ? (
                  <div>
                    <p className="signal-label text-acid">01 / {t('onboarding.howLabel')}</p>
                    <div className="mt-7 grid gap-3">
                      {steps.map(({ icon: Icon, title, body }, index) => (
                        <article key={title} className="grid grid-cols-[2.8rem_1fr] gap-4 rounded-3xl border border-white/10 bg-white/[.025] p-5">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-acid/25 text-acid"><Icon size={17} /></span>
                          <div><p className="font-display text-xl"><span className="mr-2 font-mono text-[9px] text-stone">0{index + 1}</span>{title}</p><p className="mt-2 text-xs leading-6 text-stone">{body}</p></div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="signal-label text-acid">02 / {t('onboarding.privacyLabel')}</p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      {['local', 'control', 'future'].map((item) => (
                        <article key={item} className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
                          <ShieldCheck size={17} className="text-acid" />
                          <h3 className="mt-5 font-display text-xl">{t(`onboarding.privacy.${item}Title`)}</h3>
                          <p className="mt-3 text-xs leading-6 text-stone">{t(`onboarding.privacy.${item}Body`)}</p>
                        </article>
                      ))}
                    </div>
                    <label className={`mt-5 flex cursor-pointer gap-3 rounded-2xl border p-4 text-xs leading-6 transition-colors ${acknowledged ? 'border-acid/35 bg-acid/[.04]' : 'border-white/10 bg-white/[.02]'}`}>
                      <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#d9ff43]" />
                      <span>{t('onboarding.acknowledge')}</span>
                    </label>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
                  {step === 1 ? <button type="button" onClick={() => setStep(0)} className="button-copy focus-ring inline-flex h-11 items-center gap-3 rounded-full border border-white/10 px-5 text-stone"><ArrowLeft size={14} />{t('onboarding.back')}</button> : <button type="button" onClick={() => setOpen(false)} className="button-copy focus-ring h-11 rounded-full px-2 text-stone hover:text-ink">{t('onboarding.later')}</button>}
                  {step === 0 ? <button type="button" onClick={next} className="acid-button h-11 gap-4 px-6 text-[9px] uppercase tracking-[.12em]">{t('onboarding.next')}<ArrowRight size={14} /></button> : <button type="button" disabled={!acknowledged} onClick={finish} className="acid-button h-11 gap-4 px-6 text-[9px] uppercase tracking-[.12em] disabled:cursor-not-allowed disabled:opacity-35"><Check size={14} />{t('onboarding.start')}</button>}
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
