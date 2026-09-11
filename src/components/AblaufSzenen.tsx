import { cn } from '@/lib/utils'

const CASE_FARBEN = ['bg-amber-500', 'bg-emerald-500', 'bg-rose-500']

/**
 * Dezente Aufbau/Abbau-Animation: LKW und Halle als abstrakte Formen, dazwischen
 * wandern kleine "Cases" hin und her. Rein kosmetisch, keine Spiellogik.
 * `richtung="hin"` = Aufbau (LKW -> Halle), `richtung="zurück"` = Abbau (Halle -> LKW).
 * `compact` verkleinert die Szene für die Nutzung im kleinen AblaufWidget.
 */
export function TransportSzene({
  richtung,
  compact = false,
}: {
  richtung: 'hin' | 'zurück'
  compact?: boolean
}) {
  const animationsKlasse = richtung === 'hin' ? 'animate-case-rechts' : 'animate-case-links'

  return (
    <div
      className={cn(
        'relative flex items-center justify-between px-2',
        compact ? 'h-9' : 'h-16'
      )}
      aria-hidden="true"
    >
      {/* LKW */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'rounded-sm bg-slate-400 dark:bg-slate-500',
            compact ? 'h-3.5 w-6' : 'h-6 w-11'
          )}
        />
        <div
          className={cn(
            'absolute rounded-full bg-slate-700 dark:bg-slate-900',
            compact ? '-bottom-1 left-0.5 h-1.5 w-1.5' : '-bottom-1.5 left-1.5 h-2.5 w-2.5'
          )}
        />
        <div
          className={cn(
            'absolute rounded-full bg-slate-700 dark:bg-slate-900',
            compact ? '-bottom-1 right-0.5 h-1.5 w-1.5' : '-bottom-1.5 right-1.5 h-2.5 w-2.5'
          )}
        />
      </div>

      {/* Cases, die zwischen LKW und Halle hin- bzw. herwandern */}
      <div className={cn('relative mx-2 flex-1', compact ? 'h-2.5' : 'h-4')}>
        {CASE_FARBEN.map((farbe, i) => (
          <div
            key={i}
            className={cn(
              'absolute top-0 rounded-sm',
              compact ? 'h-2.5 w-3' : 'h-4 w-5',
              farbe,
              animationsKlasse
            )}
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
      </div>

      {/* Halle */}
      <div
        className={cn(
          'shrink-0 rounded-sm bg-muted ring-1 ring-foreground/10',
          compact ? 'h-6 w-9' : 'h-10 w-16'
        )}
      />
    </div>
  )
}

/**
 * Dezente Show-Animation: kleine Punkte ("Besucher") hüpfen unsynchronisiert.
 * Anzahl richtet sich nach der erwarteten Besucherzahl der aktiven Show.
 * `compact` verkleinert die Szene für die Nutzung im kleinen AblaufWidget.
 */
export function BesucherSzene({
  erwarteteBesucherzahl,
  compact = false,
}: {
  erwarteteBesucherzahl: number
  compact?: boolean
}) {
  const maxAnzahl = compact ? 8 : 12
  const anzahl = Math.min(maxAnzahl, Math.max(3, Math.round(erwarteteBesucherzahl / 100)))
  const punkte = Array.from({ length: anzahl })

  return (
    <div
      className={cn('flex items-end justify-center gap-1.5', compact ? 'h-9' : 'h-16')}
      aria-hidden="true"
    >
      {punkte.map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-primary/70 animate-besucher-huepfen',
            compact ? 'h-2 w-2' : 'h-3 w-3'
          )}
          style={{
            animationDelay: `${(i % 5) * 0.15}s`,
            animationDuration: `${0.8 + (i % 4) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}
