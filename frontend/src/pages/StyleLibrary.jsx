import { ArrowUpRight, Bookmark, Check, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { localize, styleCatalog } from '../data/styleCatalog.js'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'
import { getStyleLibrary } from '../utils/apiClient.js'
import { isHistorySaved, removeHistory, saveHistory } from '../utils/storage.js'

function InfoBlock({ label, children, accent = false }) {
  return <section className={`rounded-2xl border p-5 ${accent ? 'border-acid/25 bg-acid/[.045]' : 'border-white/10 bg-white/[.025]'}`}><p className={`signal-label ${accent ? 'text-acid' : ''}`}>{label}</p><div className="mt-4 text-sm leading-7 text-stone">{children}</div></section>
}

export function StyleLibrary() {
  const { language, t } = useI18n()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('local')
  const [favorites, setFavorites] = useState(() => new Set(styleCatalog.filter((style) => isHistorySaved(`favorite-${style.id}`)).map((style) => style.id)))

  useEffect(() => {
    track('style_library_opened')
    getStyleLibrary().then((response) => setMode(response.mode))
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return styleCatalog
    return styleCatalog.filter((style) => [style.name, style.chineseName, ...style.keywords, ...localize(style.scenes, language)].join(' ').toLowerCase().includes(normalized))
  }, [language, query])

  const toggleFavorite = (style) => {
    const id = `favorite-${style.id}`
    if (favorites.has(style.id)) removeHistory(id)
    else saveHistory('favorite', `${style.name} / ${style.chineseName}`, style, { id, favorite: true })
    setFavorites((current) => { const next = new Set(current); if (next.has(style.id)) next.delete(style.id); else next.add(style.id); return next })
  }

  return (
    <main className="mx-auto max-w-[96rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-12">
      <header className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1fr_.65fr] lg:items-end">
        <div><p className="signal-label text-acid">03 / STYLE TAXONOMY</p><h1 className="mt-6 max-w-4xl font-display text-5xl leading-[.95] tracking-[-.055em] sm:text-7xl">{t('pages.styles.title')}</h1><p className="mt-7 max-w-2xl text-base leading-7 text-stone">{t('pages.styles.description')}</p></div>
        <div><div className="flex items-center justify-between"><span className="signal-label">{t('tools.library.styles')}</span><span className={`rounded-full border px-3 py-1.5 font-mono text-[8px] uppercase tracking-wider ${mode === 'api' ? 'border-acid/25 text-acid' : 'border-white/10 text-stone'}`}>{mode === 'api' ? t('tools.common.apiMode') : t('tools.common.localMode')}</span></div><label className="mt-5 flex h-14 items-center gap-3 rounded-full border border-white/12 bg-white/[.03] px-5"><Search size={16} className="text-stone" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone/55" placeholder={t('tools.library.search')} />{query ? <button type="button" onClick={() => setQuery('')}><X size={15} /></button> : null}</label></div>
      </header>

      {filtered.length ? <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((style, index) => (
          <article key={style.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-surface transition-all hover:-translate-y-1 hover:border-white/20">
            <button type="button" className="relative block h-48 w-full overflow-hidden text-left system-grid" onClick={() => setSelected(style)}>
              <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 62% 38%, ${style.tone}70, transparent 34%)` }} />
              <div className="absolute left-[38%] top-[22%] h-[64%] w-[22%] -rotate-6 rounded-[48%_48%_12%_12%] bg-gradient-to-br from-white/25 to-black/90" />
              <div className="absolute left-[55%] top-[30%] h-[56%] w-[23%] rotate-6 rounded-[48%_48%_12%_12%] bg-gradient-to-bl from-white/15 to-black/90" />
              <span className="absolute left-5 top-5 font-mono text-[8px] tracking-[.16em] text-acid">0{index + 1} / 08</span>
            </button>
            <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-2xl tracking-[-.03em]">{style.name}</h2><p className="mt-1 text-xs text-stone">{style.chineseName}</p></div><button type="button" onClick={() => toggleFavorite(style)} className={`flex h-9 w-9 items-center justify-center rounded-full border ${favorites.has(style.id) ? 'border-acid bg-acid text-paper' : 'border-white/10 text-stone'}`} aria-label={t('tools.common.favorite')}><Bookmark size={14} fill={favorites.has(style.id) ? 'currentColor' : 'none'} /></button></div><p className="mt-5 line-clamp-3 text-xs leading-6 text-stone">{localize(style.definition, language)}</p><button type="button" onClick={() => setSelected(style)} className="button-copy mt-6 inline-flex items-center gap-2 text-acid">{t('tools.library.open')} <ArrowUpRight size={14} /></button></div>
          </article>
        ))}
      </section> : <div className="soft-panel mt-8 p-12 text-center text-stone">{t('tools.library.noResult')}</div>}

      {selected ? <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
        <aside className="h-full w-full max-w-3xl overflow-y-auto border-l border-white/10 bg-paper p-6 sm:p-10">
          <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-8"><div><p className="signal-label text-acid">STYLE PROFILE / {selected.id.toUpperCase()}</p><h2 className="mt-5 font-display text-5xl tracking-[-.05em]">{selected.name}</h2><p className="mt-2 text-stone">{selected.chineseName}</p></div><button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10"><X size={17} /></button></div>
          <p className="py-8 text-lg leading-8 text-stone">{localize(selected.definition, language)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBlock label={t('tools.library.colors')}><div className="flex flex-wrap gap-2">{selected.colors.map((color) => <span key={color} className="rounded-full border border-white/10 px-3 py-1 text-xs">{color}</span>)}</div></InfoBlock>
            <InfoBlock label={t('tools.library.silhouettes')}><ul>{localize(selected.silhouettes, language).map((item) => <li key={item}>— {item}</li>)}</ul></InfoBlock>
            <InfoBlock label={t('tools.library.items')}><ul>{localize(selected.items, language).map((item) => <li key={item}>— {item}</li>)}</ul></InfoBlock>
            <InfoBlock label={t('tools.library.scenes')}><div className="flex flex-wrap gap-2">{localize(selected.scenes, language).map((item) => <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs">{item}</span>)}</div></InfoBlock>
            <InfoBlock label={t('tools.library.risk')} accent>{localize(selected.risk, language)}</InfoBlock>
            <InfoBlock label={t('tools.library.positive')}><span className="text-ink">✓</span> {localize(selected.positive, language)}</InfoBlock>
            <InfoBlock label={t('tools.library.negative')}><span className="text-danger">×</span> {localize(selected.negative, language)}</InfoBlock>
            <InfoBlock label={t('tools.library.beginner')} accent><ol className="space-y-2">{localize(selected.beginner, language).map((item, index) => <li key={item} className="flex gap-3"><span className="font-mono text-[9px] text-acid">0{index + 1}</span>{item}</li>)}</ol></InfoBlock>
          </div>
          <button type="button" onClick={() => toggleFavorite(selected)} className="acid-button mt-6 h-12 w-full gap-3 text-[10px] uppercase tracking-[.14em]">{favorites.has(selected.id) ? <Check size={15} /> : <Bookmark size={15} />}{favorites.has(selected.id) ? t('tools.common.saved') : t('tools.common.favorite')}</button>
        </aside>
      </div> : null}
    </main>
  )
}
