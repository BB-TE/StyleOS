import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FeatureCard({ index, icon: Icon, title, description, path, action }) {
  return (
    <Link
      to={path}
      className="focus-ring group flex h-full min-h-72 flex-col rounded-3xl border border-white/10 bg-surface/70 p-6 transition-all hover:-translate-y-1 hover:border-acid/35 hover:bg-muted sm:p-7"
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] tracking-[0.18em] text-stone">{index}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-acid"><Icon size={17} strokeWidth={1.5} aria-hidden="true" /></span>
      </div>
      <div className="mt-auto pt-12">
        <h3 className="font-display text-2xl tracking-[-0.02em]">{title}</h3>
        <p className="mt-4 text-sm leading-6 text-stone">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em]">
          {action}
          <ArrowUpRight className="text-acid transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
