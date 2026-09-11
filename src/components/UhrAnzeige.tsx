import { useAktuelleMinute } from '@/hooks/useAktuelleMinute'
import { cn } from '@/lib/utils'
import { ermittleTagesUhrzeit, useGame } from '@/state/GameContext'

const TEMPO_OPTIONEN: Array<1 | 2> = [1, 2]

/**
 * Die EINE immer sichtbare Tages-/Uhrzeit-Anzeige (fixed oben rechts). Zeigt
 * ausschließlich Tag + aktuelle Tageszeit der durchgehenden Tagesuhr, plus
 * einen gedämpften Nacht-Hinweis während eines Blackouts (Tageswechsel).
 * Keine Ablauf-/Phasen-Info mehr hier - die zeigt bei laufendem Ablauf das
 * separate `AblaufWidget` oben links.
 */
export function UhrAnzeige() {
  const { tagesUhr, tempoSetzen } = useGame()
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

      <div className="mt-1 flex items-center gap-0.5 rounded-md bg-foreground/5 p-0.5">
        {TEMPO_OPTIONEN.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => tempoSetzen(option)}
            aria-pressed={tagesUhr.tempo === option}
            className={cn(
              'rounded-sm px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              tagesUhr.tempo === option
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option}x
          </button>
        ))}
      </div>
    </div>
  )
}
