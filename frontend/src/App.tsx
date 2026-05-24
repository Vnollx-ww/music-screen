import { useMobileMode } from './hooks/useMobileMode'
import DashboardPage from './pages/DashboardPage'
import MobileHomePage from './pages/MobileHomePage'
import MobileSubmitPage from './pages/MobileSubmitPage'
import MobileVotePage from './pages/MobileVotePage'
import MusicCreationPage from './pages/MusicCreationPage'

function App() {
  const mobileMode = useMobileMode()

  if (mobileMode === 'home') return <MobileHomePage />
  if (mobileMode === 'vote') return <MobileVotePage />
  if (mobileMode === 'mobile') return <MobileSubmitPage />
  if (mobileMode === 'create') return <MusicCreationPage />

  return <DashboardPage />
}

export default App
