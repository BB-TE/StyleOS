import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Check,
  Database,
  Layers3,
  ListChecks,
  LoaderCircle,
  Shirt,
  ShoppingBag,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductImageUpload } from '../components/ProductImageUpload.jsx'
import { sceneOptions } from '../data/analysisOptions.js'
import { routeById } from '../data/routes.js'
import { getMemory, getWardrobe, saveDecision } from '../domain/productStore.js'
import { useI18n } from '../hooks/useI18n.js'
import { analyzePurchaseV2 } from '../utils/apiClient.js'
import { track } from '../utils/analytics.js'
import { colorOptions } from '../utils/localEngines.js'

const categories = ['tops', 'bottoms', 'outerwear', 'shoes', 'accessories']
const fits = ['slim', 'regular', 'relaxed', 'oversized', 'straight', 'wide']
const dimensionKeys = ['styleFit', 'fitConfidence', 'wardrobeCompatibility', 'useFrequency', 'budgetFit', 'duplicateRisk', 'idleRisk']
const initialForm = { name: '', category: 'outerwear', price: '', color: 'charcoal', fit: 'regular', fabric: '', styleKeywords: '', scenes: [], reason: '' }
const inputClass = 'focus-ring mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[.035] px-4 text-sm outline-none placeholder:text-stone/55 focus:border-acid/45'

function normalizePurchaseResult(value) {
  if (!value || typeof value !== 'object') return null
  const verdict = ['buy', 'caution', 'skip'].includes(value.verdict) ? value.verdict : 'caution'
  const dimensions = Object.fromEntries(dimensionKeys.map((key) => [key, Math.max(0, Math.min(100, Number(value.dimensions?.[key]) || 0))]))
  return {
    ...value,
    verdict,
    totalScore: Math.max(0, Math.min(100, Number(value.totalScore) || 0)),
    dimensions,
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
    reasons: Array.isArray(value.reasons) ? value.reasons : [],
    gates: Array.isArray(value.gates) ? value.gates : [],
    missing: Array.isArray(value.missing) ? value.missing : [],
    similarItems: Array.isArray(value.similarItems) ? value.similarItems : [],
    compatibleItems: Array.isArray(value.compatibleItems) ? value.compatibleItems : [],
    outfitPlans: Array.isArray(value.outfitPlans) ? value.outfitPlans : [],
    usagePlan: {
      expectedWearsPerMonth: Number(value.usagePlan?.expectedWearsPerMonth) || 0,
      costPerWear12m: Number(value.usagePlan?.costPerWear12m) || 0,
      budgetShare: Number(value.usagePlan?.budgetShare) || 0,
      completeOutfitCount: Number(value.usagePlan?.completeOutfitCount ?? value.usagePlan?.verifiedOutfitCount) || 0,
      draftOutfitCount: Number(value.usagePlan?.draftOutfitCount) || 0,
    },
    nextActions: Array.isArray(value.nextActions) ? value.nextActions : [],
    whatChanges: Array.isArray(value.whatChanges) && value.whatChanges.length ? value.whatChanges : ['nameThreeOutfits'],
    memorySnapshot: value.memorySnapshot && typeof value.memorySnapshot === 'object'
      ? value.memorySnapshot
      : { recordCount: 0, wardrobeCount: 0, monthlyBudget: 0 },
  }
}

function reasonValue(reason, t) {
  if (!Number.isFinite(Number(reason?.value)) || Number(reason.value) === 0) return ''
  if (reason.code === 'duplicateEvidence' || reason.code === 'wardrobeStillThin') return `${reason.value} ${t('memoryV2.purchase.units.items')}`
  if (['budgetPressure', 'fitHistoryConflict', 'styleEvidenceStrong', 'sceneEvidenceStrong'].includes(reason.code)) return `${reason.value} / 100`
  return ''
}

function Dimension({ label, value, risk = false }) {
  const barValue = risk ? 100 - value : value
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs"><span className="text-stone">{label}</span><span>{value}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><i className={`block h-full rounded-full ${risk && value > 55 ? 'bg-danger' : 'bg-acid'}`} style={{ width: `${barValue}%` }} /></div>
    </div>
  )
}

export function PurchaseIntelligence() {
  const { language, t } = useI18n()
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [decisionSaved, setDecisionSaved] = useState(null)
  const [productImage, setProductImage] = useState(null)
  const [productPreview, setProductPreview] = useState('')

  useEffect(() => {
    if (!productImage) {
      setProductPreview('')
      return undefined
    }
    const url = URL.createObjectURL(productImage)
    setProductPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [productImage])

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setResult(null)
    setDecisionSaved(null)
  }
  const toggleScene = (scene) => update('scenes', form.scenes.includes(scene) ? form.scenes.filter((item) => item !== scene) : [...form.scenes, scene])

  const analyze = async () => {
    if (!form.name.trim() || Number(form.price) <= 0 || !form.category || !form.fit || !form.color || !form.reason.trim()) {
      setError(t('memoryV2.purchase.required'))
      return
    }
    setError('')
    setProcessing(true)
    try {
      const memory = getMemory()
      const wardrobe = getWardrobe()
      const response = await analyzePurchaseV2({ ...form, price: Number(form.price) }, memory, wardrobe)
      const analysis = normalizePurchaseResult(response.data)
      if (!analysis) throw new Error('invalid_purchase_result')
      setResult({ ...analysis, mode: response.mode })
      setDecisionSaved(null)
      track('purchase_analyzed', {
        verdict: analysis.verdict,
        score: analysis.totalScore,
        mode: response.mode,
        memoryRecords: analysis.memorySnapshot.recordCount,
        wardrobeItems: analysis.memorySnapshot.wardrobeCount,
        completeOutfits: analysis.usagePlan.completeOutfitCount,
      })
    } catch {
      setResult(null)
      setError(t('memoryV2.purchase.analysisFailed'))
    } finally {
      setProcessing(false)
    }
  }

  const decide = (status) => {
    const decision = saveDecision(decisionSaved
      ? { ...decisionSaved, status }
      : { product: { ...form, price: Number(form.price) }, result, status })
    setDecisionSaved(decision)
    track('decision_created', { id: decision.id, verdict: result.verdict, status })
  }
  const selectProductImage = (file) => {
    setProductImage(file)
    track('product_image_selected', { type: file.type, size: file.size, storage: 'memory-only' })
  }
  const removeProductImage = () => {
    setProductImage(null)
    track('product_image_removed')
  }
  const verdictColor = result?.verdict === 'buy' ? 'text-acid' : result?.verdict === 'skip' ? 'text-danger' : 'text-[#e8bd68]'

  return (
    <main className="mx-auto max-w-[96rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-12">
      <header className="border-b border-white/10 pb-10">
        <p className="signal-label text-acid">02 / {t('memoryV2.purchase.eyebrow')}</p>
        <h1 className="mt-6 max-w-5xl font-display text-5xl leading-[.95] tracking-[-.055em] sm:text-7xl">{t('pages.purchase.title')}</h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-stone">{t('pages.purchase.description')}</p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[.78fr_1.22fr]">
        <section className="soft-panel h-fit p-6 sm:p-8 lg:sticky lg:top-24">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl">{t('memoryV2.purchase.product')}</h2><ShoppingBag size={17} className="text-acid" /></div>
          <div className="mt-7 border-b border-white/10 pb-7">
            <div className="flex items-center justify-between gap-3"><span className="signal-label">{t('productImage.title')}</span><span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[.12em] text-stone">{t('productImage.optional')}</span></div>
            <ProductImageUpload file={productImage} onSelect={selectProductImage} onRemove={removeProductImage} />
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field label={t('memoryV2.purchase.name')} wide><input className={inputClass} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder={t('tools.purchase.namePlaceholder')} /></Field>
            <Field label={t('memoryV2.purchase.category')}><select className={inputClass} value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.map((item) => <option key={item} value={item}>{t(`memoryV2.wardrobe.categories.${item}`)}</option>)}</select></Field>
            <Field label={t('memoryV2.purchase.price')}><input type="number" min="0" className={inputClass} value={form.price} onChange={(event) => update('price', event.target.value)} /></Field>
            <Field label={t('memoryV2.purchase.color')}><select className={inputClass} value={form.color} onChange={(event) => update('color', event.target.value)}>{colorOptions.map((item) => <option key={item.id} value={item.id}>{language === 'zh' ? item.zh : item.en}</option>)}</select></Field>
            <Field label={t('memoryV2.purchase.fit')}><select className={inputClass} value={form.fit} onChange={(event) => update('fit', event.target.value)}>{fits.map((item) => <option key={item}>{t(`memoryV2.purchase.fitLabels.${item}`)}</option>)}</select></Field>
            <Field label={t('memoryV2.purchase.fabric')}><input className={inputClass} value={form.fabric} onChange={(event) => update('fabric', event.target.value)} placeholder={t('memoryV2.purchase.fabricPlaceholder')} /></Field>
            <Field label={t('memoryV2.purchase.keywords')}><input className={inputClass} value={form.styleKeywords} onChange={(event) => update('styleKeywords', event.target.value)} placeholder={t('memoryV2.purchase.keywordsPlaceholder')} /></Field>
          </div>
          <div className="mt-5">
            <span className="signal-label">{t('memoryV2.purchase.scenes')}</span>
            <div className="mt-3 flex flex-wrap gap-2">{sceneOptions.map((scene) => <button key={scene} type="button" onClick={() => toggleScene(scene)} className={`rounded-full border px-3 py-2 text-xs ${form.scenes.includes(scene) ? 'border-acid bg-acid text-paper' : 'border-white/10 text-stone'}`}>{t(`analysisForm.scenes.${scene}`)}</button>)}</div>
          </div>
          <label className="mt-5 block"><span className="signal-label">{t('memoryV2.purchase.reason')}</span><textarea value={form.reason} onChange={(event) => update('reason', event.target.value)} className="focus-ring mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm outline-none placeholder:text-stone/55 focus:border-acid/45" placeholder={t('tools.purchase.reasonPlaceholder')} /></label>
          {error ? <p className="mt-4 rounded-2xl border border-danger/25 bg-danger/[.05] p-3 text-sm text-danger">{error}</p> : null}
          <button type="button" disabled={processing} onClick={analyze} className="acid-button mt-7 h-12 w-full gap-4 disabled:opacity-60">{processing ? <LoaderCircle className="animate-spin" size={15} /> : <Brain size={15} />}{processing ? t('memoryV2.purchase.reading') : t('memoryV2.purchase.analyze')}</button>
        </section>

        <section className="soft-panel min-h-[42rem] p-6 sm:p-8">
          {!result ? (
            <div className="flex min-h-[36rem] flex-col items-center justify-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full border border-acid/20 bg-acid/[.04] text-acid"><Database size={26} /></span><h2 className="mt-7 font-display text-3xl">{t('memoryV2.purchase.memoryUsed')}</h2><p className="mt-4 max-w-md text-sm leading-7 text-stone">{t('memoryV2.purchase.memoryReadIntro')}</p></div>
          ) : (
            <>
              <div className="grid gap-6 border-b border-white/10 pb-7 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                {productPreview ? <img src={productPreview} alt="" className="h-28 w-24 rounded-2xl border border-white/10 object-cover" /> : <span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[.025] text-stone"><Shirt size={24} /></span>}
                <div><div className="flex flex-wrap items-center gap-3"><p className="signal-label">{t('memoryV2.purchase.result')}</p><span className={`rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider ${result.mode === 'api' ? 'border-acid/25 text-acid' : 'border-white/10 text-stone'}`}>{t(result.mode === 'api' ? 'tools.common.apiMode' : 'tools.common.localMode')}</span></div><h2 className={`mt-3 font-display text-5xl tracking-[-.05em] ${verdictColor}`}>{t(`memoryV2.purchase.verdicts.${result.verdict}`)}</h2>{result.reasons[0] ? <p className="mt-3 max-w-xl text-sm leading-6 text-stone">{t(`memoryV2.purchase.reasonCodes.${result.reasons[0].code}`)}</p> : null}</div>
                <div className="rounded-2xl border border-white/10 px-5 py-4 text-left sm:text-right"><span className="font-mono text-[8px] uppercase tracking-wider text-stone">{t('memoryV2.purchase.scoreLabel')}</span><p className="mt-1 font-display text-3xl">{result.totalScore}<i className="text-xs not-italic text-stone"> / 100</i></p></div>
              </div>

              <section className="mt-7 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
                <Panel title={t('memoryV2.purchase.reasons')} icon={<Brain size={14} />}>{result.reasons.length ? result.reasons.map((reason) => <div key={reason.code} className="border-b border-white/10 py-3 text-xs leading-5 text-stone last:border-0"><p className="text-ink">{t(`memoryV2.purchase.reasonCodes.${reason.code}`)}</p>{reason.itemNames?.length ? <p className="mt-1 text-[10px] text-acid">{reason.itemNames.join(' · ')}</p> : reasonValue(reason, t) ? <p className="mt-1 font-mono text-[9px] text-acid">{reasonValue(reason, t)}</p> : null}</div>) : <p className="py-3 text-xs text-stone">—</p>}</Panel>
                <Panel title={t('memoryV2.purchase.actionsTitle')} icon={<ListChecks size={14} />}><p className="pt-3 text-xs leading-5 text-stone">{t('memoryV2.purchase.actionsIntro')}</p><ol className="mt-2">{result.nextActions.map((action, index) => <li key={action.code} className="flex gap-3 border-b border-white/10 py-3 text-xs leading-5 last:border-0"><span className="font-mono text-[9px] text-acid">0{index + 1}</span><span>{t(`memoryV2.purchase.actionCodes.${action.code}`)}{action.itemName ? <strong className="mt-1 block font-normal text-acid">{action.itemName}</strong> : null}</span></li>)}</ol></Panel>
              </section>

              <section className="mt-7 rounded-3xl border border-white/10 bg-black/10 p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-3 text-acid"><Layers3 size={15} /><p className="signal-label text-acid">{t('memoryV2.purchase.outfitsTitle')}</p></div><p className="mt-3 max-w-2xl text-xs leading-5 text-stone">{t('memoryV2.purchase.outfitsIntro')}</p></div><span className="font-display text-3xl">{result.usagePlan.completeOutfitCount}<i className="ml-1 text-xs not-italic text-stone">/ {result.outfitPlans.length}</i></span></div>
                {result.outfitPlans.length ? <div className="mt-5 grid gap-3 xl:grid-cols-3">{result.outfitPlans.map((plan) => <OutfitPlan key={plan.id} plan={plan} product={form} language={language} t={t} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-center"><p className="text-sm text-stone">{t('memoryV2.purchase.noCompatible')}</p><Link to={routeById.wardrobe.path} className="mt-4 inline-flex items-center gap-2 text-xs text-acid">{t('memoryV2.purchase.addWardrobeCta')}<ArrowRight size={13} /></Link></div>}
              </section>

              <section className="mt-7">
                <div className="flex items-center gap-3 text-acid"><WalletCards size={15} /><p className="signal-label text-acid">{t('memoryV2.purchase.usageTitle')}</p></div>
                <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4"><Metric label={t('memoryV2.purchase.expectedWears')} value={`${result.usagePlan.expectedWearsPerMonth} ${t('memoryV2.purchase.wearsUnit')}`} /><Metric label={t('memoryV2.purchase.costPerWear')} value={`¥${result.usagePlan.costPerWear12m}`} /><Metric label={t('memoryV2.purchase.budgetShare')} value={`${result.usagePlan.budgetShare}%`} /><Metric label={t('memoryV2.purchase.verifiedOutfits')} value={result.usagePlan.completeOutfitCount} /></div>
              </section>

              <details className="mt-7 rounded-3xl border border-white/10 bg-white/[.015] p-5 open:bg-white/[.025]">
                <summary className="focus-ring cursor-pointer list-none text-sm text-stone">{t('memoryV2.purchase.detailsTitle')}</summary>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">{Object.entries(result.dimensions).map(([key, value]) => <Dimension key={key} label={t(`memoryV2.purchase.dimensions.${key}`)} value={value} risk={key === 'duplicateRisk' || key === 'idleRisk'} />)}</div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Panel title={t('memoryV2.purchase.memoryUsed')} icon={<Brain size={14} />}>{result.evidence.map((item) => <div key={item.code} className="flex items-center justify-between border-b border-white/10 py-3 text-xs last:border-0"><span>{t(`memoryV2.purchase.evidenceCodes.${item.code}`)}</span><span className="text-stone">{item.count} · {Math.round(item.confidence * 100)}%</span></div>)}</Panel>
                  <Panel title={t('memoryV2.purchase.gates')} icon={<AlertTriangle size={14} />}>{result.gates.length ? result.gates.map((gate) => <div key={gate.code} className="border-b border-white/10 py-3 text-xs leading-5 text-danger last:border-0">{t(`memoryV2.purchase.gateCodes.${gate.code}`)}{gate.value ? ` · ${gate.value}` : ''}</div>) : <p className="py-3 text-xs text-stone">—</p>}</Panel>
                  <Panel title={t('memoryV2.purchase.uncertainty')} icon={<Database size={14} />}>{result.missing.length ? <div className="flex flex-wrap gap-2 pt-3">{result.missing.map((item) => <span key={item} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-stone">{t(`memoryV2.purchase.missingCodes.${item}`)}</span>)}</div> : <p className="py-3 text-xs text-acid">✓</p>}</Panel>
                  <Panel title={t('memoryV2.purchase.changes')} icon={<ArrowRight size={14} />}>{result.whatChanges.map((item, index) => <div key={item} className="flex gap-3 border-b border-white/10 py-3 text-xs leading-5 text-stone last:border-0"><span className="font-mono text-[8px] text-acid">0{index + 1}</span>{t(`memoryV2.purchase.changeCodes.${item}`)}</div>)}</Panel>
                </div>
                <div className="mt-3 rounded-3xl border border-white/10 bg-white/[.02] p-5"><p className="signal-label text-acid">{t('memoryV2.purchase.similar')}</p>{result.similarItems.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{result.similarItems.map((item) => <div key={item.id} className="flex justify-between rounded-2xl border border-white/10 p-4 text-xs"><span>{item.name}</span><span className="text-danger">{item.score}%</span></div>)}</div> : <p className="mt-4 text-xs text-stone">{t('memoryV2.purchase.noSimilar')}</p>}</div>
              </details>

              <div className="mt-5 grid grid-cols-3 gap-2"><DecisionAction onClick={() => decide('purchased')} active label={t('memoryV2.decisions.actions.purchased')} /><DecisionAction onClick={() => decide('passed')} label={t('memoryV2.decisions.actions.passed')} /><DecisionAction onClick={() => decide('watching')} label={t('memoryV2.decisions.actions.watching')} /></div>
              {decisionSaved ? <Link to={routeById.history.path} className="button-copy mt-4 flex h-11 items-center justify-center gap-3 rounded-full border border-acid/30 text-acid"><Check size={14} />{t('memoryV2.purchase.saved')}<ArrowRight size={14} /></Link> : null}
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function OutfitPlan({ plan, product, language, t }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[8px] uppercase tracking-[.12em] text-stone">{t(`analysisForm.scenes.${plan.scene}`)}</p><p className={`mt-2 text-xs ${plan.ready ? 'text-acid' : 'text-[#e8bd68]'}`}>{t(plan.ready ? 'memoryV2.purchase.outfitReady' : 'memoryV2.purchase.outfitDraft')}</p></div><span className="font-display text-2xl">{plan.confidence}<i className="text-[9px] not-italic text-stone">%</i></span></div>
      <div className="mt-4 space-y-2"><OutfitPiece item={product} language={language} t={t} candidate />{plan.items.map((item) => <OutfitPiece key={item.id} item={item} language={language} t={t} />)}</div>
      {plan.missingCategories.length ? <div className="mt-4 border-t border-white/10 pt-3"><span className="text-[9px] text-stone">{t('memoryV2.purchase.missingPieces')}</span><div className="mt-2 flex flex-wrap gap-1.5">{plan.missingCategories.map((category) => <span key={category} className="rounded-full border border-danger/20 px-2 py-1 text-[8px] text-danger">{t(`memoryV2.wardrobe.categories.${category}`)}</span>)}</div></div> : null}
    </article>
  )
}

function OutfitPiece({ item, language, t, candidate = false }) {
  const color = colorOptions.find((entry) => entry.id === item.color) || colorOptions[0]
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-2.5 ${candidate ? 'border-acid/25 bg-acid/[.045]' : 'border-white/10'}`}>
      <span className="h-8 w-8 shrink-0 rounded-lg border border-white/15" style={{ background: color.hex }} />
      <div className="min-w-0"><p className="truncate text-xs">{item.name}</p><p className="mt-1 text-[8px] text-stone">{candidate ? t('memoryV2.purchase.candidateItem') : t(`memoryV2.wardrobe.categories.${item.category}`)} · {language === 'zh' ? color.zh : color.en}</p></div>
    </div>
  )
}

function Metric({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] leading-4 text-stone">{label}</p><p className="mt-3 font-display text-2xl">{value}</p></div>
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'sm:col-span-2' : ''}><span className="signal-label">{label}</span>{children}</label>
}

function Panel({ title, icon, children }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[.02] p-5"><div className="flex items-center gap-3 text-acid">{icon}<p className="signal-label text-acid">{title}</p></div><div className="mt-2">{children}</div></section>
}

function DecisionAction({ label, onClick, active = false }) {
  return <button type="button" onClick={onClick} className={`button-copy min-h-12 rounded-2xl border px-2 ${active ? 'border-acid bg-acid text-paper' : 'border-white/10 text-stone hover:border-white/25'}`}>{label}</button>
}
