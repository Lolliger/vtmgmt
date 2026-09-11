import { useEffect, useState } from 'react'

/**
 * Reiner Re-Render-Trigger: zählt jede Sekunde hoch, damit Komponenten, die
 * von Date.now() abgeleitete Werte anzeigen (z.B. die Tagesuhr), von selbst
 * weiterlaufen. Löst KEINE Game-Logik aus (kein Dispatch) - analog zu
 * `useVergangeneSekunden`, nur ohne Abhängigkeit von einem laufenden Ablauf.
 */
export function useTick(intervalMs = 1000): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  return tick
}
