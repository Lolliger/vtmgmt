import { useEffect, useState } from 'react'
import type { AblaufStatus } from '@/state/GameContext'

/**
 * Rein für die Anzeige: liefert die seit Ablauf-Start vergangenen Sekunden,
 * eingefroren während einer Pause (Soundcheck/Ereignis-Reaktion). Löst KEINE
 * Game-Logik aus (kein Dispatch) - dient nur dazu, Komponenten wie
 * `UhrAnzeige` und `AblaufScreen` einmal pro Sekunde neu rendern zu lassen,
 * damit Uhrzeit/Fortschrittsbalken sichtbar weiterlaufen.
 */
export function useVergangeneSekunden(ablaufStatus: AblaufStatus | null): number {
  // Wird nicht gelesen - dient nur als Trigger für ein Re-Render jede Sekunde.
  const [, erzwingeRender] = useState(0)
  const ablaufAktiv = ablaufStatus !== null

  useEffect(() => {
    if (!ablaufAktiv) return
    const interval = setInterval(() => erzwingeRender((n) => n + 1), 1000)
    return () => clearInterval(interval)
    // Bewusst nur an-/abgeschaltet, nicht bei jeder Statusänderung neu gestartet -
    // sonst würde das Intervall bei jedem Phasenwechsel (Soundcheck/Ereignis) verworfen.
  }, [ablaufAktiv])

  if (!ablaufStatus) return 0

  return ablaufStatus.pausiertSeit !== null
    ? (ablaufStatus.pausiertSeit - ablaufStatus.startZeitpunkt) / 1000
    : (Date.now() - ablaufStatus.startZeitpunkt) / 1000
}
