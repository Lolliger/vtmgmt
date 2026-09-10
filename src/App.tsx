import { AuflösungScreen } from '@/components/screens/AuflösungScreen'
import { Dashboard } from '@/components/screens/Dashboard'
import { StaffingScreen } from '@/components/screens/StaffingScreen'
import { GameProvider, useGame } from '@/state/GameContext'

function Screens() {
  const { view } = useGame()

  return (
    <div className="min-h-svh bg-muted/30 px-4 py-8 sm:px-8">
      {view === 'dashboard' && <Dashboard />}
      {view === 'staffing' && <StaffingScreen />}
      {view === 'auflösung' && <AuflösungScreen />}
    </div>
  )
}

function App() {
  return (
    <GameProvider>
      <Screens />
    </GameProvider>
  )
}

export default App
