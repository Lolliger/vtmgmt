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
    <div className="min-h-svh bg-muted/30 px-4 pt-28 pb-8 sm:px-8">
      {/*
       * pt-28 statt eines normalen py-8: UhrAnzeige (fixed top-4 right-4) ist
       * immer sichtbar und recht kompakt (gemessen: ~97-98px hoch inkl.
       * top-4-Versatz) - pt-28 (112px) deckt das mit ca. 14px Puffer ab, ohne
       * im Normalfall (kein Ablauf aktiv) unnötig viel Weißraum zu erzeugen.
       * Das AblaufWidget (fixed top-4 left-4) ist während eines laufenden
       * Show-Ablaufs deutlich höher (gemessen bis ~240px, je nach Verlauf/
       * Mini-Entscheidung) und kann dadurch mit dem oberen Rand der ersten
       * Dashboard-Card überlappen - bewusster Trade-off: seltener Fall (nur
       * während eines laufenden Ablaufs), klar besser als ständig 208px
       * verschwendeter Weißraum im Normalfall.
       */}
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
