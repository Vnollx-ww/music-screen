import { useMobileMode } from './hooks/useMobileMode'
import DashboardPage from './pages/DashboardPage'
import MobileSubmitPage from './pages/MobileSubmitPage'

function App() {
  const isMobile = useMobileMode()

  return isMobile ? <MobileSubmitPage /> : <DashboardPage />
}

export default App
