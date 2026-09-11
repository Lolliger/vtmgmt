import { cn } from '@/lib/utils'

interface MoralAnzeigeProps {
  moral: number
  /** Kompakte Variante für enge Karten (z.B. Staffing-Kandidatenkarten). */
  compact?: boolean
}

const MORAL_SCHWELLE_KRITISCH = 30
const MORAL_SCHWELLE_NEUTRAL = 60

function moralStatus(moral: number) {
  if (moral < MORAL_SCHWELLE_KRITISCH) {
    return {
      label: 'kritisch',
      text: 'text-red-600 dark:text-red-400',
      bar: 'bg-red-500',
      track: 'bg-red-500/15',
    }
  }
  if (moral < MORAL_SCHWELLE_NEUTRAL) {
    return {
      label: 'neutral',
      text: 'text-amber-700 dark:text-amber-400',
      bar: 'bg-amber-500',
      track: 'bg-amber-500/15',
    }
  }
  return {
    label: 'gut',
    text: 'text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    track: 'bg-emerald-500/15',
  }
}

/** Zeigt die Moral eines Technikers als farbcodierten Wert + Fortschrittsbalken an. */
export function MoralAnzeige({ moral, compact = false }: MoralAnzeigeProps) {
  const status = moralStatus(moral)
  const breite = Math.min(100, Math.max(0, moral))

  return (
    <div className={cn('flex flex-col gap-1', compact ? 'w-16' : 'w-24')}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] text-muted-foreground">Moral</span>
        <span className={cn('text-[10px] font-medium', status.text)}>
          {moral} · {status.label}
        </span>
      </div>
      <div
        className={cn('h-1.5 w-full overflow-hidden rounded-full', status.track)}
        role="progressbar"
        aria-valuenow={moral}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Moral: ${moral} von 100, ${status.label}`}
      >
        <div
          className={cn('h-full rounded-full transition-all', status.bar)}
          style={{ width: `${breite}%` }}
        />
      </div>
    </div>
  )
}
