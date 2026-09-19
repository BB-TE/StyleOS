import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sceneOptions, styleOptions } from '../data/analysisOptions.js'
import { mergeSetupMemory, upsertMemoryEvidence } from '../domain/memoryEngine.js'
import { seedMemoryFromProfile } from '../domain/memoryModel.js'
import { getMemory, saveMemory } from '../domain/productStore.js'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'

const DRAFT_KEY = 'styleos.v2.setupDraft'
const initialForm = { styles: [], dislikedElements: '', scenes: [], monthlyBudget: '1200', expressionGoal: '', successfulItem: '', failureReason: '' }
const inputClass = 'focus-ring mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[.035] px-4 text-sm outline-none placeholder:text-stone/55 focus:border-acid/45'
const textareaClass = 'focus-ring mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm outline-none placeholder:text-stone/55 focus:border-acid/45'

function loadDraft() { try { return { ...initialForm, ...JSON.parse(localStorage.getItem(DRAFT_KEY)) } } catch { return initialForm } }

export function Analysis() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(loadDraft)
  const [error, setError] = useState('')
  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)) }, [form])
  useEffect(() => { track('analysis_step_enter', { version: 2, step: step + 1 }) }, [step])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggle = (key, value) => update(key, form[key].includes(value) ? form[key].filter((item) => item !== value) : [...form[key], value])
  const valid = step === 0 ? form.styles.length > 0 : step === 1 ? form.scenes.length > 0 && Number(form.monthlyBudget) > 0 : Boolean(form.successfulItem.trim() || form.failureReason.trim())
  const next = () => { if (!valid) { setError(t(step === 2 ? 'memoryV2.setup.experienceRequired' : 'memoryV2.setup.required')); return } setError(''); track('analysis_step_complete', { version: 2, step: step + 1 }); if (step < 2) { setStep(step + 1); return } let setupMemory = seedMemoryFromProfile({ styles: form.styles, scenes: form.scenes, monthlyBudget: form.monthlyBudget, expressionGoal: form.expressionGoal, dislikedElements: form.dislikedElements }); if (form.successfulItem.trim()) setupMemory = upsertMemoryEvidence(setupMemory, { domain: 'wardrobe', kind: 'successfulItem', value: form.successfulItem.trim(), label: form.successfulItem.trim(), confidence: .58, sources: ['user_statement'], confirmed: true }); if (form.failureReason.trim()) setupMemory = upsertMemoryEvidence(setupMemory, { domain: 'risk', kind: 'returnReason', value: form.failureReason.trim(), label: form.failureReason.trim(), confidence: .62, sources: ['user_statement'], confirmed: true }); const memory = mergeSetupMemory(getMemory(), setupMemory); saveMemory(memory); localStorage.removeItem(DRAFT_KEY); track('memory_setup_completed', { records: memory.records.length }); navigate('/today') }

  const titles = [t('memoryV2.setup.stepOne'), t('memoryV2.setup.stepTwo'), t('memoryV2.setup.stepThree')]
  return <main className="mx-auto max-w-[86rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-12">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7"><div><p className="signal-label text-acid">SETUP / {step + 1} OF 3</p><h1 className="mt-5 font-display text-4xl tracking-[-.045em] sm:text-5xl">{titles[step]}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-stone">{t('memoryV2.setup.intro')}</p></div><span className="font-display text-3xl">{Math.round((step + 1) / 3 * 100)}%</span></header>
    <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-acid transition-all" style={{ width: `${(step + 1) / 3 * 100}%` }} /></div>
    <section className="soft-panel mt-6 min-h-[30rem] p-6 sm:p-9">
      {step === 0 ? <div><p className="signal-label">{t('memoryV2.setup.favoriteStyles')}</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{styleOptions.map((style) => <button key={style} type="button" onClick={() => toggle('styles', style)} className={`focus-ring flex min-h-16 items-center justify-between rounded-2xl border px-4 text-left text-sm ${form.styles.includes(style) ? 'border-acid bg-acid/[.09] text-acid' : 'border-white/10 bg-white/[.02] text-stone'}`}><span>{t(`analysisForm.styles.${style}`)}</span>{form.styles.includes(style) ? <Check size={14} /> : <span>+</span>}</button>)}</div><label className="mt-7 block"><span className="signal-label">{t('memoryV2.setup.disliked')}</span><textarea className={textareaClass} value={form.dislikedElements} onChange={(event) => update('dislikedElements', event.target.value)} placeholder={t('analysisForm.dislikedPlaceholder')} /></label></div> : null}
      {step === 1 ? <div><p className="signal-label">{t('memoryV2.setup.scenes')}</p><div className="mt-4 flex flex-wrap gap-2">{sceneOptions.map((scene) => <button key={scene} type="button" onClick={() => toggle('scenes', scene)} className={`rounded-full border px-4 py-2 text-xs ${form.scenes.includes(scene) ? 'border-acid bg-acid text-paper' : 'border-white/10 text-stone'}`}>{t(`analysisForm.scenes.${scene}`)}</button>)}</div><div className="mt-8 grid gap-5 sm:grid-cols-2"><label><span className="signal-label">{t('memoryV2.setup.budget')}</span><input type="number" min="1" className={inputClass} value={form.monthlyBudget} onChange={(event) => update('monthlyBudget', event.target.value)} /></label><label><span className="signal-label">{t('memoryV2.setup.goal')}</span><input className={inputClass} value={form.expressionGoal} onChange={(event) => update('expressionGoal', event.target.value)} placeholder={t('analysisForm.expressionPlaceholder')} /></label></div></div> : null}
      {step === 2 ? <div className="grid gap-6 sm:grid-cols-2"><label className="rounded-3xl border border-acid/20 bg-acid/[.04] p-5"><span className="signal-label text-acid">{t('memoryV2.setup.success')}</span><textarea className={textareaClass} value={form.successfulItem} onChange={(event) => update('successfulItem', event.target.value)} placeholder={t('memoryV2.setup.successPlaceholder')} /></label><label className="rounded-3xl border border-danger/20 bg-danger/[.035] p-5"><span className="signal-label text-danger">{t('memoryV2.setup.failure')}</span><textarea className={textareaClass} value={form.failureReason} onChange={(event) => update('failureReason', event.target.value)} placeholder={t('memoryV2.setup.failurePlaceholder')} /></label></div> : null}
      {error ? <p className="mt-5 rounded-2xl border border-danger/25 bg-danger/[.05] p-3 text-sm text-danger">{error}</p> : null}
    </section>
    <div className="mt-6 flex items-center justify-between"><button type="button" disabled={step === 0} onClick={() => { setStep(Math.max(0, step - 1)); setError('') }} className="button-copy focus-ring inline-flex h-11 items-center gap-2 rounded-full px-3 text-stone disabled:opacity-20"><ArrowLeft size={14} />{t('memoryV2.setup.previous')}</button><button type="button" onClick={next} className="acid-button h-12 gap-6 px-6">{step === 2 ? <Sparkles size={14} /> : null}{step === 2 ? t('memoryV2.setup.complete') : t('memoryV2.setup.next')}{step < 2 ? <ArrowRight size={14} /> : null}</button></div>
  </main>
}
