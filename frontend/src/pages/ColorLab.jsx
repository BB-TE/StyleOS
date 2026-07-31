import { ArrowRight, Check, Save, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { styleCatalog } from '../data/styleCatalog.js'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'
import { analyzeColor } from '../utils/apiClient.js'
import { analyzeColorLocal, colorOptions } from '../utils/localEngines.js'
import { saveHistory } from '../utils/storage.js'

const modes = ['basic', 'mono', 'contrast', 'bold', 'seasonal']
const parts = [
  ['topColor', 'top'],
  ['bottomColor', 'bottom'],
  ['outerColor', 'outer'],
  ['shoesColor', 'shoes'],
]

function PartButton({ label, color, active, onClick, language }) {
  return <button type="button" onClick={onClick} className={`focus-ring flex min-h-[4.75rem] items-center gap-3 rounded-2xl border p-3 text-left transition-all ${active ? 'border-acid bg-acid/[.09] shadow-[0_0_0_1px_rgba(215,255,69,.15)]' : 'border-white/12 bg-white/[.025] hover:border-white/25'}`}>
    <span className="h-10 w-10 shrink-0 rounded-full border-2 border-white/20 shadow-[0_0_0_3px_rgba(0,0,0,.3)]" style={{ backgroundColor: color.hex }} />
    <span className="min-w-0"><strong className={`block text-sm font-medium ${active ? 'text-acid' : 'text-ink'}`}>{label}</strong><small className="mt-1 block truncate text-[10px] text-stone">{language === 'zh' ? color.zh : color.en}</small></span>
    {active ? <Check className="ml-auto shrink-0 text-acid" size={15} /> : null}
  </button>
}

function ColorMatrix({ value, onChange, language }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {colorOptions.map((color) => {
      const active = color.id === value
      return <button key={color.id} type="button" onClick={() => onChange(color.id)} aria-pressed={active} className={`focus-ring flex min-h-[4.5rem] items-center gap-3 rounded-2xl border p-3 text-left transition-all ${active ? 'border-acid bg-acid/[.1]' : 'border-white/10 bg-paper/45 hover:border-white/25 hover:bg-white/[.04]'}`}>
        <span className="relative h-9 w-9 shrink-0 rounded-full border-2 border-white/20 shadow-[0_0_0_2px_rgba(0,0,0,.45)]" style={{ backgroundColor: color.hex }}>{active ? <Check className={`absolute inset-0 m-auto ${['ivory','oatmeal','sky','acid'].includes(color.id) ? 'text-black' : 'text-white'}`} size={15} strokeWidth={3} /> : null}</span>
        <span className="min-w-0"><strong className="block truncate text-xs font-medium text-ink">{language === 'zh' ? color.zh : color.en}</strong><small className="mt-1 block font-mono text-[7px] uppercase tracking-wider text-stone">{color.hex}</small></span>
      </button>
    })}
  </div>
}

function Score({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-end justify-between"><span className="text-xs text-stone">{label}</span><strong className="font-display text-3xl font-normal">{value}</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-acid" style={{ width: `${value}%` }} /></div></div>
}

export function ColorLab() {
  const { language, t } = useI18n()
  const [form, setForm] = useState({ topColor: 'ivory', bottomColor: 'charcoal', outerColor: 'moss', shoesColor: 'black', styleId: 'cleanFit', mode: 'basic' })
  const [activePart, setActivePart] = useState('topColor')
  const [result, setResult] = useState(() => analyzeColorLocal(form))
  const [mode, setMode] = useState('local')
  const [saved, setSaved] = useState(false)
  const colors = useMemo(() => Object.fromEntries(colorOptions.map((color) => [color.id, color])), [])
  const update = (key, value) => { const next = { ...form, [key]: value }; setForm(next); setResult(analyzeColorLocal(next)); setSaved(false) }
  const run = async () => { const response = await analyzeColor(form); setResult(response.data); setMode(response.mode); track('color_analyzed', { styleId: form.styleId, riskLevel: response.data.riskLevel }) }
  const save = () => { saveHistory('color', `${t('tools.color.saveTitle')} · ${result.harmonyScore}`, { form, result }); setSaved(true) }
  const riskLabel = t(`tools.common.${result.riskLevel}`)

  return <main className="mx-auto max-w-[96rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-12">
    <header className="border-b border-white/10 pb-12"><p className="signal-label text-acid">04 / COLOR DECISION LAB</p><h1 className="mt-6 max-w-5xl font-display text-5xl leading-[.95] tracking-[-.055em] sm:text-7xl">{t('pages.colorLab.title')}</h1><p className="mt-7 max-w-2xl text-base leading-7 text-stone">{t('pages.colorLab.description')}</p></header>
    <div className="mt-6 grid gap-4 lg:grid-cols-[.92fr_1.08fr]">
      <section className="soft-panel p-6 sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">{t('tools.color.setup')}</h2><span className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[8px] text-stone">{mode === 'api' ? t('tools.common.apiMode') : t('tools.common.localMode')}</span></div>
        <div className="mt-8"><div className="mb-3 flex items-end justify-between gap-4"><span className="signal-label">01 / {language === 'zh' ? '选择穿搭部位' : 'Choose garment area'}</span><span className="text-[10px] text-stone">{language === 'zh' ? '先选部位，再选颜色' : 'Choose area, then color'}</span></div><div className="grid gap-2 sm:grid-cols-2">{parts.map(([key, labelKey]) => <PartButton key={key} label={t(`tools.color.${labelKey}`)} color={colors[form[key]]} active={activePart === key} onClick={() => setActivePart(key)} language={language} />)}</div></div>

        <div className="mt-7 rounded-3xl border border-white/12 bg-white/[.02] p-4"><div className="mb-4 flex items-center justify-between gap-3"><span className="signal-label text-acid">02 / {t(`tools.color.${parts.find(([key]) => key === activePart)?.[1]}`)}</span><span className="rounded-full border border-acid/25 bg-acid/[.06] px-3 py-1 text-[9px] text-acid">{language === 'zh' ? colors[form[activePart]].zh : colors[form[activePart]].en}</span></div><ColorMatrix value={form[activePart]} onChange={(value) => update(activePart, value)} language={language} /></div>

        <div className="mt-7"><span className="signal-label">03 / {t('tools.color.style')}</span><div className="mt-3 grid grid-cols-2 gap-2">{styleCatalog.map((style) => <button key={style.id} type="button" onClick={() => update('styleId', style.id)} className={`focus-ring min-h-[3.75rem] rounded-2xl border px-3 py-2 text-left transition-colors ${form.styleId === style.id ? 'border-acid bg-acid/[.09]' : 'border-white/10 bg-white/[.02] hover:border-white/25'}`}><strong className={`block text-xs ${form.styleId === style.id ? 'text-acid' : 'text-ink'}`}>{style.name}</strong><small className="mt-1 block text-[9px] text-stone">{style.chineseName}</small></button>)}</div></div>
        <div className="mt-7"><span className="signal-label">04 / {t('tools.color.mode')}</span><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{modes.map((item) => <button key={item} type="button" onClick={() => update('mode', item)} className={`focus-ring min-h-12 rounded-2xl border px-3 py-2 text-xs ${form.mode === item ? 'border-acid bg-acid text-paper' : 'border-white/10 bg-white/[.02] text-ink hover:border-white/25'}`}>{t(`tools.color.modes.${item}`)}</button>)}</div></div>
        <button type="button" onClick={run} className="acid-button mt-8 h-12 w-full gap-4 text-[10px] uppercase tracking-[.14em]"><Sparkles size={15} />{t('tools.color.analyze')}</button>
      </section>

      <section className="grid gap-4">
        <div className="soft-panel system-grid p-6 sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">{t('tools.color.preview')}</h2><span className={`rounded-full border px-3 py-1.5 font-mono text-[8px] uppercase ${result.riskLevel === 'high' ? 'border-danger/30 text-danger' : 'border-acid/25 text-acid'}`}>{riskLabel}</span></div>
          <div className="mt-7 grid h-72 grid-cols-[60fr_30fr_10fr] gap-2 overflow-hidden rounded-3xl border border-white/10 bg-paper p-2"><div className="flex flex-col gap-2"><div className="flex-[42] rounded-2xl" style={{ backgroundColor: colors[form.outerColor].hex }} /><div className="flex-[58] rounded-2xl" style={{ backgroundColor: colors[form.bottomColor].hex }} /></div><div className="rounded-2xl" style={{ backgroundColor: colors[form.topColor].hex }} /><div className="rounded-2xl" style={{ backgroundColor: colors[form.shoesColor].hex }} /></div>
          <div className="mt-4 flex justify-between font-mono text-[8px] uppercase tracking-[.12em] text-stone"><span>60 / BASE</span><span>30 / SUPPORT</span><span>10 / ACCENT</span></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3"><Score label={t('tools.color.harmony')} value={result.harmonyScore} /><Score label={t('tools.color.contrast')} value={result.contrastScore} /><Score label={t('tools.color.wearability')} value={result.wearability} /></div>
        <div className="soft-panel grid gap-6 p-6 sm:grid-cols-[.35fr_.65fr]"><div><p className="signal-label text-acid">{t('tools.color.ratio')}</p><p className="mt-4 font-display text-4xl">{result.ratioAdvice}</p></div><div><p className="signal-label">{t('tools.color.suggestions')}</p><ul className="mt-4 space-y-3">{result.suggestions.map((suggestion, index) => <li key={suggestion} className="flex gap-3 text-sm leading-6 text-stone"><span className="font-mono text-[8px] text-acid">0{index + 1}</span>{suggestion}</li>)}</ul></div></div>
        <button type="button" onClick={save} className="button-copy focus-ring flex h-12 items-center justify-center gap-3 rounded-full border border-white/12 hover:border-acid/35">{saved ? <Check size={15} className="text-acid" /> : <Save size={15} />}{saved ? t('tools.common.saved') : t('tools.common.save')}<ArrowRight size={14} /></button>
      </section>
    </div>
  </main>
}
