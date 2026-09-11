import { ermittlePhase, formatSpielUhrzeit, PHASE_LABEL } from '@/lib/ablaufAnzeige'
import { useVergangeneSekunden } from '@/hooks/useVergangeneSekunden'
import { SEKUNDEN_PRO_SPIELSTUNDE, useGame } from '@/state/GameContext'

/**
 * Kompakte, immer sichtbare Uhr/Phasen-Anzeige für einen laufenden
 * Show-Ablauf. Rendert nichts, solange kein Ablauf aktiv ist (ablaufStatus
 * === null) - z.B. auf Dashboard/Staffing außerhalb einer laufenden Show.
 */
export function UhrAnzeige() {
  const { ablaufStatus } = useGame()
  const vergangeneSekunden = useVergangeneSekunden(ablaufStatus)

  if (!ablaufStatus) return null

  const phase = ermittlePhase(ablaufStatus, vergangeneSekunden)
  const uhrzeit = formatSpielUhrzeit(vergangeneSekunden, SEKUNDEN_PRO_SPIELSTUNDE)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-0.5 rounded-xl bg-card px-3 py-2 text-right ring-1 ring-foreground/10 shadow-lg">
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {PHASE_LABEL[phase]}
      </span>
      <span className="text-lg leading-none font-semibold tabular-nums">{uhrzeit}</span>
    </div>
  )
}
