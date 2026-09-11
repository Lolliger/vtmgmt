import { useEffect, useRef, useState } from 'react'
import { AblaufWidget } from '@/components/AblaufWidget'
import { SoundcheckDialog } from '@/components/SoundcheckDialog'
import { UhrAnzeige } from '@/components/UhrAnzeige'
import { AuflösungScreen } from '@/components/screens/AuflösungScreen'
import { Dashboard } from '@/components/screens/Dashboard'
import { EreignisScreen } from '@/components/screens/EreignisScreen'
import { StaffingScreen } from '@/components/screens/StaffingScreen'
import { StartScreen } from '@/components/screens/StartScreen'
import {
  GameProvider,
  ladeGespeichertenSpielstand,
  loescheGespeichertenSpielstand,
  pruefeSpielstandKompatibilitaet,
  useGame,
  type GameState,
} from '@/state/GameContext'

function Screens() {
  const { view, tickAblauf } = useGame()

  // tickAblauf ändert seine Referenz bei jedem State-Update (kommt aus einem
  // useMemo mit Dep [state]) - per Ref immer aktuell halten, damit das
  // Interval unten wirklich nur einmalig aufgesetzt wird und trotzdem nie
  // eine veraltete Closure aufruft.
  const tickAblaufRef = useRef(tickAblauf)
  tickAblaufRef.current = tickAblauf

  useEffect(() => {
    const interval = setInterval(() => {
      tickAblaufRef.current()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-svh bg-muted/30 px-4 py-8 sm:px-8">
      <UhrAnzeige />
      <AblaufWidget />
      {view === 'dashboard' && <Dashboard />}
      {view === 'staffing' && <StaffingScreen />}
      {view === 'auflösung' && <AuflösungScreen />}
      <SoundcheckDialog />
      <EreignisScreen />
    </div>
  )
}

function App() {
  const [kompatibilitaet] = useState(() => pruefeSpielstandKompatibilitaet())
  const [gestartet, setGestartet] = useState<GameState | 'neu' | null>(() =>
    kompatibilitaet === 'kein-spielstand' ? 'neu' : null
  )

  if (gestartet === null) {
    return (
      <StartScreen
        kompatibilitaet={kompatibilitaet === 'inkompatibel' ? 'inkompatibel' : 'kompatibel'}
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
