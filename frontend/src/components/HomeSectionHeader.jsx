export function HomeSectionHeader({ eyebrow, title, description, invert = false }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.42fr_1fr] lg:gap-12">
      <p className={`signal-label ${invert ? 'text-white/50' : 'text-acid'}`}>
        {eyebrow}
      </p>
      <div>
        <h2 className="max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-6 max-w-2xl text-base leading-7 text-stone">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
