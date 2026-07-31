export function StyleDNABars({ items, getLabel }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={item.id}>
          <div className="mb-3 flex items-end justify-between gap-4 text-sm">
            <span><span className="mr-3 font-mono text-[8px] text-acid">0{index + 1}</span>{getLabel(item.id)}</span>
            <span className="font-display text-2xl">{item.score}<i className="ml-1 font-sans text-[9px] not-italic text-stone">%</i></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-acid" style={{ width: `${item.score * 2.5}%` }} /></div>
        </div>
      ))}
    </div>
  )
}
