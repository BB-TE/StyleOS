import { Check } from 'lucide-react'

export function MultiSelectGrid({ options, selected, onChange, getLabel, columns = 3 }) {
  const gridClass = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  }

  return (
    <div className={`grid gap-2 ${gridClass}`}>
      {options.map((id) => {
        const active = selected.includes(id)
        return (
          <button
            key={id}
            type="button"
            className={`focus-ring flex min-h-20 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
              active ? 'border-acid/65 bg-acid/[.08] text-ink' : 'border-white/10 bg-white/[.025] text-stone hover:border-white/20 hover:bg-white/[.05] hover:text-ink'
            }`}
            aria-pressed={active}
            onClick={() => toggle(id)}
          >
            <span>{getLabel(id)}</span>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${active ? 'border-acid bg-acid text-paper' : 'border-white/10'}`}>{active ? <Check size={14} aria-hidden="true" /> : <span className="text-stone">+</span>}</span>
          </button>
        )
      })}
    </div>
  )
}
