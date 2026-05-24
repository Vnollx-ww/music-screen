import { lazy, Suspense } from 'react'
import { useMobileMode } from './hooks/useMobileMode'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MobileHomePage = lazy(() => import('./pages/MobileHomePage'))
const MobileSubmitPage = lazy(() => import('./pages/MobileSubmitPage'))
const MobileVotePage = lazy(() => import('./pages/MobileVotePage'))
const MixInterfacePage = lazy(() => import('./pages/MixInterfacePage'))
const MusicCreationPage = lazy(() => import('./pages/MusicCreationPage'))
const IpadStandbyPage = lazy(() => import('./pages/IpadStandbyPage'))

function App() {
  const mobileMode = useMobileMode()

  let page = <DashboardPage />
  if (mobileMode === 'home') page = <MobileHomePage />
  if (mobileMode === 'vote') page = <MobileVotePage />
  if (mobileMode === 'mobile') page = <MobileSubmitPage />
  if (mobileMode === 'create') page = <MixInterfacePage />
  if (mobileMode === 'music-create') page = <MusicCreationPage />
  if (mobileMode === 'standby') page = <IpadStandbyPage />

  return <Suspense fallback={null}>{page}</Suspense>
}

export default App
