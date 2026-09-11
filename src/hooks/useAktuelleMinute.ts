import { useTick } from '@/hooks/useTick'
import { ermittleAktuelleMinute, useGame } from '@/state/GameContext'

/**
 * Rein für die Anzeige: liefert die aktuelle Spielzeit als Minute seit
 * Mitternacht (siehe ermittleAktuelleMinute), einmal pro Sekunde neu
 * berechnet. Löst KEINE Game-Logik aus (kein Dispatch) - dient nur dazu,
 * Komponenten wie `UhrAnzeige` und `AblaufWidget` einmal pro Sekunde neu
 * rendern zu lassen, damit Uhrzeit/Fortschrittsbalken sichtbar weiterlaufen.
 */
export function useAktuelleMinute(): number {
  // Reiner Re-Render-Trigger, ein Interval für die ganze App (siehe useTick).
  useTick()
  const { tagesUhr } = useGame()
  return ermittleAktuelleMinute(tagesUhr)
}
