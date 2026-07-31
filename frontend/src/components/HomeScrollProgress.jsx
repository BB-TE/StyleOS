import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'

export function HomeScrollProgress() {
  const { scrollYProgress } = useScroll()
  const reduceMotion = useReducedMotion()
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.24,
  })

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-50 h-[2px] bg-white/[.04]" aria-hidden="true">
      <motion.span
        className="block h-full origin-left bg-acid shadow-[0_0_18px_rgba(215,255,69,.45)]"
        style={{ scaleX: reduceMotion ? scrollYProgress : smoothProgress }}
      />
    </div>
  )
}
