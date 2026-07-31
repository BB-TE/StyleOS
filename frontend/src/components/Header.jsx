import { CircleHelp, Menu, ScanLine } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n.js'
import { primaryNavigation, routeById } from '../data/routes.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { MobileMenu } from './MobileMenu.jsx'
import { openStyleOSGuide } from '../utils/guideEvents.js'

const navClassName = ({ isActive }) =>
  `nav-link ${isActive ? 'nav-link-active' : ''}`

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const { t } = useI18n()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[96rem] items-center px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="focus-ring flex shrink-0 items-center gap-3 text-sm font-semibold tracking-[-0.04em]"
            aria-label={t('navigation.home')}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-acid/45 text-acid"><ScanLine size={14} /></span>
            <span>{t('common.brand')}</span>
            <span className="hidden font-mono text-[8px] font-normal tracking-[0.16em] text-stone sm:inline">AESTHETIC OS / 01</span>
          </Link>

          <nav className="ml-10 hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.035] p-1 lg:flex" aria-label={t('navigation.primary')}>
            {primaryNavigation.map((item) => (
              <NavLink key={item.id} to={item.path} className={navClassName}>
                {t(`${item.copyKey}.label`)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openStyleOSGuide}
              className="button-copy focus-ring hidden h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-stone hover:border-white/25 hover:text-ink sm:inline-flex"
              aria-label={t('onboarding.open')}
            >
              <CircleHelp size={14} />
              <span className="hidden xl:inline">{t('onboarding.open')}</span>
            </button>
            <LanguageSwitcher />
            <Link
              to={routeById.purchase.path}
              className="acid-button focus-ring hidden h-10 px-5 text-[10px] uppercase tracking-[0.14em] lg:inline-flex"
            >
              {t(`${routeById.purchase.copyKey}.label`)}
            </Link>
          </div>

          <button
            type="button"
            className="focus-ring ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 lg:hidden"
            aria-label={t('navigation.open')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
