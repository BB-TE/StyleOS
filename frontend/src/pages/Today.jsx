import { ArrowRight, Brain, Clock3, PackageOpen, Plus, ShoppingBag, Sparkles, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogById } from '../data/styleCatalog.js'
import { routeById } from '../data/routes.js'
import { summarizeMemory } from '../domain/memoryEngine.js'
import { getDecisions, getMemory, getWardrobe, migrateLegacyData } from '../domain/productStore.js'
import { useI18n } from '../hooks/useI18n.js'

function MetricCard({ icon: Icon, label, value, hint, accent = false }) {
  return <article className={`rounded-3xl border p-5 ${accent ? 'border-acid/25 bg-acid/[.055]' : 'border-white/10 bg-surface'}`}><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-full border ${accent ? 'border-acid/30 text-acid' : 'border-white/10 text-stone'}`}><Icon size={17} /></span><span className="font-display text-3xl">{value}</span></div><p className="mt-7 text-sm font-medium">{label}</p><p className="mt-2 text-xs leading-5 text-stone">{hint}</p></article>
}

export function Today() {
  const { language, t } = useI18n()
  const [state, setState] = useState(() => migrateLegacyData())
  useEffect(() => { const refresh = () => setState({ memory: getMemory(), wardrobe: getWardrobe(), decisions: getDecisions() }); window.addEventListener('styleos:v2-change', refresh); return () => window.removeEventListener('styleos:v2-change', refresh) }, [])
  const summary = useMemo(() => summarizeMemory(state.memory), [state.memory])
  const pending = state.decisions.filter((decision) => decision.status === 'purchased' && !decision.outcome)
  const activeItems = state.wardrobe.filter((item) => item.wearFrequency === 'weekly' && item.status === 'active')
  const idleItems = state.wardrobe.filter((item) => item.status === 'idle' || item.wearFrequency === 'unused')
  const categoryCounts = state.wardrobe.reduce((counts, item) => ({ ...counts, [item.category]: (counts[item.category] || 0) + 1 }), {})
  const repeated = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]

  return <main className="mx-auto max-w-[96rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-12">
    <header className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="signal-label text-acid">01 / PERSONAL DECISION WORKSPACE</p><h1 className="mt-6 max-w-5xl font-display text-5xl leading-[.95] tracking-[-.055em] sm:text-7xl">{t('pages.today.title')}</h1><p className="mt-7 max-w-2xl text-base leading-7 text-stone">{t('pages.today.description')}</p></div>{!state.memory.profile.setupCompleted ? <Link to={routeById.analysis.path} className="focus-ring inline-flex h-11 items-center justify-center gap-3 rounded-full border border-white/12 px-5 text-[9px] uppercase tracking-[.13em] hover:border-acid/35"><Sparkles size={14} className="text-acid" />{t('memoryV2.common.setup')}</Link> : null}</header>

    <section className="mt-6 grid gap-4 lg:grid-cols-[1.18fr_.82fr]">
      <Link to={routeById.purchase.path} className="scan-surface group relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-acid/25 bg-acid/[.055] p-7 sm:p-10"><div className="absolute -right-16 -top-20 h-80 w-80 rounded-full border border-acid/20 bg-[radial-gradient(circle,rgba(215,255,69,.2),transparent_66%)]" /><div className="relative z-[2] flex h-full flex-col"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-acid text-paper"><ShoppingBag size={19} /></span><p className="signal-label mt-10 text-acid">PRIMARY ACTION / BUY CHECK</p><h2 className="mt-5 max-w-2xl font-display text-4xl leading-[1] tracking-[-.045em] sm:text-5xl">{t('memoryV2.today.start')}</h2><p className="mt-5 max-w-xl text-sm leading-7 text-stone">{t('memoryV2.today.startBody')}</p><span className="mt-auto inline-flex items-center gap-3 pt-12 text-[10px] uppercase tracking-[.14em] text-acid">{t('memoryV2.common.buyCheck')}<ArrowRight className="transition-transform group-hover:translate-x-1" size={15} /></span></div></Link>
      <div className="grid grid-cols-2 gap-3"><MetricCard icon={Brain} label={t('memoryV2.today.memory')} value={`${summary.confidence}%`} hint={`${summary.recordCount} ${t('memoryV2.common.records')}`} accent /><MetricCard icon={PackageOpen} label={t('memoryV2.today.wardrobe')} value={state.wardrobe.length} hint={`${activeItems.length} ${t('memoryV2.today.active')}`} /><MetricCard icon={Clock3} label={t('memoryV2.today.pending')} value={pending.length} hint={pending.length ? pending[0].product.name : t('memoryV2.today.emptyDecision')} /><MetricCard icon={WalletCards} label={t('memoryV2.today.budget')} value={`¥${state.memory.profile.monthlyBudget}`} hint={language === 'zh' ? '用于每次购买压力判断' : 'Used in every budget check'} /></div>
    </section>

    <section className="mt-4 grid gap-4 lg:grid-cols-3">
      <div className="soft-panel p-6"><div className="flex items-center justify-between"><p className="signal-label text-acid">{t('memoryV2.today.changes')}</p><Link to={routeById.report.path}><ArrowRight size={14} /></Link></div>{summary.strongestStyles.length ? <div className="mt-6 space-y-4">{summary.strongestStyles.slice(0, 4).map((record) => <div key={record.id}><div className="flex justify-between text-xs"><span>{catalogById[record.value]?.name || record.label}</span><span className="text-stone">{Math.round(record.confidence * 100)}%</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-acid" style={{ width: `${record.confidence * 100}%` }} /></div></div>)}</div> : <p className="mt-8 text-sm leading-6 text-stone">{t('memoryV2.today.emptyMemory')}</p>}</div>
      <div className="soft-panel p-6"><div className="flex items-center justify-between"><p className="signal-label text-acid">{t('memoryV2.today.gaps')}</p><Link to={routeById.wardrobe.path}><Plus size={14} /></Link></div><div className="mt-6 space-y-3"><div className="flex justify-between rounded-2xl border border-white/10 p-4 text-sm"><span className="text-stone">{t('memoryV2.today.duplicate')}</span><strong>{repeated ? `${t(`memoryV2.wardrobe.categories.${repeated[0]}`)} · ${repeated[1]}` : '—'}</strong></div><div className="flex justify-between rounded-2xl border border-white/10 p-4 text-sm"><span className="text-stone">{t('memoryV2.today.idle')}</span><strong>{idleItems.length}</strong></div><div className="flex justify-between rounded-2xl border border-white/10 p-4 text-sm"><span className="text-stone">{t('memoryV2.today.active')}</span><strong>{activeItems.length}</strong></div></div></div>
      <div className="soft-panel p-6"><div className="flex items-center justify-between"><p className="signal-label text-acid">{t('memoryV2.today.recent')}</p><Link to={routeById.history.path}><ArrowRight size={14} /></Link></div>{state.decisions.length ? <div className="mt-6 space-y-3">{state.decisions.slice(0, 3).map((decision) => <article key={decision.id} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between gap-3"><span className="text-sm">{decision.product.name}</span><span className={`font-mono text-[8px] uppercase ${decision.result.verdict === 'buy' ? 'text-acid' : decision.result.verdict === 'skip' ? 'text-danger' : 'text-[#e8bd68]'}`}>{t(`memoryV2.purchase.verdicts.${decision.result.verdict}`)}</span></div><p className="mt-2 text-[10px] text-stone">{decision.status} · {new Date(decision.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en')}</p></article>)}</div> : <p className="mt-8 text-sm leading-6 text-stone">{t('memoryV2.today.emptyDecision')}</p>}</div>
    </section>
  </main>
}
