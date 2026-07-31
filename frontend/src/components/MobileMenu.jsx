import { AnimatePresence, motion } from 'framer-motion'
import { CircleHelp, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n.js'
import { routes } from '../data/routes.js'
import { openStyleOSGuide } from '../utils/guideEvents.js'

export function MobileMenu({ open, onClose }) {
  const location = useLocation()
  const { t } = useI18n()

  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 bg-paper text-ink lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={t('navigation.mobile')}
        >
          <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
            <span className="text-sm font-semibold tracking-[-0.04em]">{t('common.brand')} <i className="ml-2 font-mono text-[8px] not-italic tracking-[.18em] text-acid">MOBILE / NAV</i></span>
            <button
              type="button"
              className="focus-ring-dark inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20"
              aria-label={t('navigation.close')}
              onClick={onClose}
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <nav className="flex h-[calc(100vh-4.5rem)] flex-col overflow-y-auto px-5 py-8" aria-label={t('navigation.mobile')}>
            <div className="space-y-1">
              {routes.map((item, index) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className="focus-ring-dark group flex items-baseline gap-4 border-b border-white/10 py-4"
                >
                  <span className="w-6 text-[10px] text-white/45">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-3xl transition-colors group-hover:text-acid">{t(`${item.copyKey}.label`)}</span>
                </Link>
              ))}
            </div>
            <button type="button" onClick={() => { onClose(); openStyleOSGuide() }} className="button-copy focus-ring-dark mt-6 flex min-h-12 items-center justify-center gap-3 rounded-full border border-acid/30 text-acid">
              <CircleHelp size={15} /> {t('onboarding.open')}
            </button>
            <p className="mt-auto pt-10 text-xs leading-5 text-white/50">
              {t('navigation.mobileNote')}
            </p>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
