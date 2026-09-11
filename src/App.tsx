import { useState } from 'react'
import { AuflösungScreen } from '@/components/screens/AuflösungScreen'
import { Dashboard } from '@/components/screens/Dashboard'
import { StaffingScreen } from '@/components/screens/StaffingScreen'
import { StartScreen } from '@/components/screens/StartScreen'
import {
  GameProvider,
  hatGespeichertenSpielstand,
  ladeGespeichertenSpielstand,
  loescheGespeichertenSpielstand,
  useGame,
  type GameState,
} from '@/state/GameContext'

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
  const [gestartet, setGestartet] = useState<GameState | 'neu' | null>(() =>
    hatGespeichertenSpielstand() ? null : 'neu'
  )

  if (gestartet === null) {
    return (
      <StartScreen
        onFortsetzen={() => {
          const geladen = ladeGespeichertenSpielstand()
          setGestartet(geladen ?? 'neu')
        }}
        onNeuesSpiel={() => {
          loescheGespeichertenSpielstand()
          setGestartet('neu')
        }}
      />
    )
  }

  if (gestartet === 'neu') {
    return (
      <GameProvider>
        <Screens />
      </GameProvider>
    )
  }

  return (
    <GameProvider initialState={gestartet}>
      <Screens />
    </GameProvider>
  )
}

export default App
