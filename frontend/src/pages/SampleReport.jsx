import { ArrowRight, Check, Save, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { routeById } from '../data/routes.js'
import { useI18n } from '../hooks/useI18n.js'
import { saveHistory } from '../utils/storage.js'

const sample = {
  id: 'sample-student-22', personaKey: 'consideredBuilder',
  styleDNA: [{ id: 'Clean Fit', score: 34 }, { id: 'Minimal Japanese', score: 27 }, { id: 'Quiet Luxury', score: 21 }, { id: 'Korean Minimal', score: 11 }, { id: 'Old Money', score: 7 }],
  colors: [{ name: 'Charcoal', hex: '#30332f' }, { name: 'Ivory', hex: '#e7e2d7' }, { name: 'Oatmeal', hex: '#bcae91' }, { name: 'Mist gray', hex: '#9da39b' }, { name: 'Deep navy', hex: '#1f2d3b' }],
  priorities: ['一件有结构感、能覆盖面试与日常的短外套', '两件贴近面部的高质感基础上衣', '一条能连接针织、衬衫和外套的直筒长裤'],
  outfits: [
    { scene: '上课', formula: '燕麦针织＋炭灰直筒裤＋轻量运动鞋', note: '保持松弛，但让裤线提供秩序。' },
    { scene: '日常出街', formula: '冷白上衣＋短箱型外套＋深色长裤', note: '用一件短外套减少学生气。' },
    { scene: '面试', formula: '细针织＋轻结构外套＋海军蓝长裤', note: '不使用全套正装，保留年龄感。' },
  ],
}

export function SampleReport() {
  const { t } = useI18n()
  const [saved, setSaved] = useState(false)
  const save = () => { saveHistory('report', 'Sample · 克制的松弛感构建者', sample, { id: sample.id }); setSaved(true) }
  return <main className="mx-auto max-w-[96rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-12">
    <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-surface"><div className="flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-9"><p className="signal-label text-acid">07 / SAMPLE REPORT</p><span className="font-mono text-[8px] text-stone">PROFILE / STUDENT-22</span></div><div className="system-grid grid lg:grid-cols-[1.12fr_.88fr]"><div className="p-7 sm:p-10 lg:border-r lg:border-white/10 lg:p-14"><div className="flex items-center gap-3 text-acid"><Sparkles size={15} /><span className="signal-label text-acid">STYLE PERSONA</span></div><h1 className="mt-8 font-display text-5xl leading-[.92] tracking-[-.055em] sm:text-7xl">克制的<br /><span className="text-acid">松弛感构建者</span></h1></div><div className="flex flex-col justify-end border-t border-white/10 p-7 lg:border-t-0 lg:p-12"><p className="signal-label">{t('tools.sample.profile')}</p><div className="mt-6 space-y-3 text-sm leading-6 text-stone"><p>{t('tools.sample.age')}</p><p>{t('tools.sample.budget')}</p><p>{t('tools.sample.preferences')}</p><p>{t('tools.sample.goals')}</p></div></div></div></header>

    <section className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className="soft-panel p-6 sm:p-8"><p className="signal-label text-acid">TOP 5 / STYLE DNA</p><div className="mt-7 space-y-5">{sample.styleDNA.map((item, index) => <div key={item.id}><div className="mb-2 flex justify-between text-sm"><span><i className="mr-3 font-mono text-[8px] not-italic text-acid">0{index + 1}</i>{item.id}</span><span className="font-display text-2xl">{item.score}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-acid" style={{ width: `${item.score * 2.7}%` }} /></div></div>)}</div></div>
      <div className="soft-panel p-6 sm:p-8"><p className="signal-label text-acid">{t('tools.sample.palette')}</p><div className="mt-7 grid grid-cols-5 gap-2">{sample.colors.map((color) => <div key={color.name}><span className="block aspect-[2/3] rounded-2xl border border-white/10" style={{ backgroundColor: color.hex }} /><span className="mt-2 block text-[9px] text-stone">{color.name}</span></div>)}</div><p className="mt-7 text-sm leading-7 text-stone">以炭灰和海军蓝建立稳定底色，用象牙白靠近面部，燕麦色只承担柔和过渡；不建议大面积使用高饱和色。</p></div>
    </section>

    <section className="mt-4 grid gap-4 lg:grid-cols-[.85fr_1.15fr]"><div className="soft-panel p-6 sm:p-8"><p className="signal-label text-acid">{t('tools.sample.priorities')}</p><ol className="mt-6 space-y-4">{sample.priorities.map((item, index) => <li key={item} className="flex gap-4 rounded-2xl border border-white/10 p-4 text-sm leading-6"><span className="font-mono text-[8px] text-acid">0{index + 1}</span>{item}</li>)}</ol><div className="mt-6 rounded-2xl border border-acid/20 bg-acid/[.04] p-5"><p className="signal-label text-acid">BUDGET / 50 · 30 · 20</p><p className="mt-4 text-sm leading-7 text-stone">50% 补基础结构，30% 升级材质，20% 留给风格实验。月预算不足时，不拆散购买优先级。</p></div></div><div className="soft-panel p-6 sm:p-8"><p className="signal-label text-acid">{t('tools.sample.outfits')}</p><div className="mt-6 space-y-3">{sample.outfits.map((outfit, index) => <article key={outfit.scene} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex justify-between"><span className="text-xs text-acid">{outfit.scene}</span><span className="font-mono text-[8px] text-stone">0{index + 1}</span></div><h3 className="mt-4 font-display text-xl">{outfit.formula}</h3><p className="mt-3 text-xs leading-6 text-stone">{outfit.note}</p></article>)}</div></div></section>

    <div className="mt-5 flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="signal-label">NEXT / BUILD YOUR OWN</p><p className="mt-3 text-sm text-stone">示例用于理解报告结构，实际结果会根据你的偏好、场景、预算和购买习惯变化。</p></div><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={save} className="button-copy focus-ring inline-flex h-12 items-center justify-center gap-3 rounded-full border border-white/12 px-5">{saved ? <Check size={15} className="text-acid" /> : <Save size={15} />}{saved ? t('tools.common.saved') : t('tools.sample.save')}</button><Link to={routeById.analysis.path} className="acid-button h-12 gap-5 px-6">{t('tools.sample.start')}<ArrowRight size={15} /></Link></div></div>
  </main>
}
