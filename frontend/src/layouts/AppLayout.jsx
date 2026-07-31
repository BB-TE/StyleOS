import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/Header.jsx'
import { OnboardingGuide } from '../components/OnboardingGuide.jsx'
import { ScrollToTop } from '../components/ScrollToTop.jsx'
import { SupportCenter } from '../components/SupportCenter.jsx'

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
      <ScrollToTop />
      <OnboardingGuide />
      <Header />
      <div className={isHome ? 'bg-paper' : 'workspace-surface'}>
        <Outlet />
      </div>
      <SupportCenter />
    </div>
  )
}
