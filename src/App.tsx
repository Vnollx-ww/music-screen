import { useMobileMode } from './hooks/useMobileMode'
import DashboardPage from './pages/DashboardPage'
import MobileHomePage from './pages/MobileHomePage'
import MobileSubmitPage from './pages/MobileSubmitPage'
import MobileVotePage from './pages/MobileVotePage'

function App() {
  const mobileMode = useMobileMode()

  if (mobileMode === 'home') return <MobileHomePage />
  if (mobileMode === 'vote') return <MobileVotePage />
  if (mobileMode === 'mobile') return <MobileSubmitPage />

  return <DashboardPage />
}

export default App
