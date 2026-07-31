export function StepProgress({ current, total, label, title }) {
  const progress = ((current + 1) / total) * 100

  return (
    <div className="soft-panel px-5 py-5 sm:px-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-acid">
            {label} {current + 1} / {total}
          </p>
          <h2 className="mt-2 font-display text-xl sm:text-2xl">{title}</h2>
        </div>
        <span className="font-display text-2xl text-ink">{Math.round(progress)}%</span>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-acid transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
