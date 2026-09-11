import { useAktuelleMinute } from '@/hooks/useAktuelleMinute'
import { cn } from '@/lib/utils'
import { ermittleTagesUhrzeit, useGame } from '@/state/GameContext'

/**
 * Die EINE immer sichtbare Tages-/Uhrzeit-Anzeige (fixed oben rechts). Zeigt
 * ausschließlich Tag + aktuelle Tageszeit der durchgehenden Tagesuhr, plus
 * einen gedämpften Nacht-Hinweis während eines Blackouts (Tageswechsel).
 * Keine Ablauf-/Phasen-Info mehr hier - die zeigt bei laufendem Ablauf das
 * separate `AblaufWidget` oben links.
 */
export function UhrAnzeige() {
  const { tagesUhr } = useGame()
  // Erzwingt jede Sekunde ein Re-Render, damit die von Date.now() abgeleitete
  // Tagesuhrzeit auch ohne laufenden Ablauf sichtbar weiterläuft.
  useAktuelleMinute()

  const { stunde, minute, istBlackout } = ermittleTagesUhrzeit(tagesUhr)
  const tagesUhrzeitText = `${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')} Uhr`

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
    </div>
  )
}
