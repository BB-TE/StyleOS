import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout.jsx'
import { DataSyncProvider } from './contexts/DataSyncProvider.jsx'

const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })))
const Analysis = lazyNamed(() => import('./pages/Analysis.jsx'), 'Analysis')
const ColorLab = lazyNamed(() => import('./pages/ColorLab.jsx'), 'ColorLab')
const History = lazyNamed(() => import('./pages/History.jsx'), 'History')
const Home = lazyNamed(() => import('./pages/Home.jsx'), 'Home')
const NotFound = lazyNamed(() => import('./pages/NotFound.jsx'), 'NotFound')
const PurchaseIntelligence = lazyNamed(() => import('./pages/PurchaseIntelligence.jsx'), 'PurchaseIntelligence')
const Report = lazyNamed(() => import('./pages/Report.jsx'), 'Report')
const SampleReport = lazyNamed(() => import('./pages/SampleReport.jsx'), 'SampleReport')
const StyleLibrary = lazyNamed(() => import('./pages/StyleLibrary.jsx'), 'StyleLibrary')
const Today = lazyNamed(() => import('./pages/Today.jsx'), 'Today')
const Wardrobe = lazyNamed(() => import('./pages/Wardrobe.jsx'), 'Wardrobe')

function App() {
  return (
    <DataSyncProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper"><span className="h-8 w-8 animate-spin rounded-full border border-white/15 border-t-acid" /></div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="today" element={<Today />} />
            <Route path="setup" element={<Analysis />} />
            <Route path="memory" element={<Report />} />
            <Route path="wardrobe" element={<Wardrobe />} />
            <Route path="styles" element={<StyleLibrary />} />
            <Route path="color-lab" element={<ColorLab />} />
            <Route path="purchase" element={<PurchaseIntelligence />} />
            <Route path="decisions" element={<History />} />
            <Route path="sample-report" element={<SampleReport />} />
            <Route path="analysis" element={<Navigate to="/setup" replace />} />
            <Route path="report" element={<Navigate to="/memory" replace />} />
            <Route path="history" element={<Navigate to="/decisions" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </DataSyncProvider>
  )
}

export default App
