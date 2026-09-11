import { ermittlePhase, formatSpielUhrzeit, PHASE_LABEL } from '@/lib/ablaufAnzeige'
import { useTick } from '@/hooks/useTick'
import { useVergangeneSekunden } from '@/hooks/useVergangeneSekunden'
import { cn } from '@/lib/utils'
import { ermittleTagesUhrzeit, SEKUNDEN_PRO_SPIELSTUNDE, useGame } from '@/state/GameContext'

/**
 * Immer sichtbare Tages-/Uhrzeit-Anzeige (fixed oben rechts). Zeigt Tag +
 * Uhrzeit der durchgehenden Tagesuhr, unabhängig davon, ob gerade eine Show
 * im Ablauf ist. Läuft ein Ablauf (ablaufStatus !== null), wird zusätzlich
 * die bestehende Phasen-Info (Aufbau/Soundcheck/Show/Abbau) angezeigt.
 * Während eines Blackouts (Tageswechsel) erscheint stattdessen ein kurzer,
 * gedämpfter Nacht-Hinweis.
 */
export function UhrAnzeige() {
  const { ablaufStatus, tagesUhr } = useGame()
  // Erzwingt jede Sekunde ein Re-Render, damit die von Date.now() abgeleitete
  // Tagesuhrzeit auch ohne laufenden Ablauf sichtbar weiterläuft.
  useTick()
  const vergangeneSekunden = useVergangeneSekunden(ablaufStatus)

  const { stunde, minute, istBlackout } = ermittleTagesUhrzeit(tagesUhr)
  const tagesUhrzeitText = `${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')} Uhr`

  const phase = ablaufStatus ? ermittlePhase(ablaufStatus, vergangeneSekunden) : null
  const ablaufUhrzeit = ablaufStatus
    ? formatSpielUhrzeit(vergangeneSekunden, SEKUNDEN_PRO_SPIELSTUNDE)
    : null

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex flex-col items-end gap-0.5 rounded-xl px-3 py-2 text-right ring-1 shadow-lg transition-colors',
        istBlackout
          ? 'bg-indigo-950 text-indigo-100 ring-indigo-900/60'
          : 'bg-card ring-foreground/10'
      )}
    >
      {istBlackout ? (
        <span className="text-sm leading-none font-semibold">
          🌙 Nacht... Tag {tagesUhr.tag} endet
        </span>
      ) : (
        <>
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Tag {tagesUhr.tag}
          </span>
          <span className="text-lg leading-none font-semibold tabular-nums">
            {tagesUhrzeitText}
          </span>
        </>
      )}

      {phase && ablaufUhrzeit && !istBlackout && (
        <div className="mt-1 flex flex-col items-end gap-0.5 border-t border-foreground/10 pt-1">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {PHASE_LABEL[phase]}
          </span>
          <span className="text-sm leading-none font-semibold tabular-nums">{ablaufUhrzeit}</span>
        </div>
      )}
    </div>
  )
}
