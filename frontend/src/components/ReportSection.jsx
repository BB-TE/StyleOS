export function ReportSection({ index, title, children, className = '' }) {
  return (
    <section className={`border-t border-white/10 py-10 sm:py-14 ${className}`}>
      <div className="grid gap-6 lg:grid-cols-[12rem_1fr] lg:gap-12">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[9px] tracking-[0.18em] text-acid">{index}</span>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">{title}</h2>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}
