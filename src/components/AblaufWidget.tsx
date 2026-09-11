import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAktuelleMinute } from '@/hooks/useAktuelleMinute'
import { BesucherSzene, TransportSzene } from '@/components/AblaufSzenen'
import { ermittleFlavorText, ermittlePhase, PHASE_LABEL, phasenFortschritt } from '@/lib/ablaufAnzeige'
import { cn } from '@/lib/utils'
import { useGame } from '@/state/GameContext'

const PHASE_BALKEN_FARBE: Record<'aufbau' | 'wartezeit' | 'show' | 'abbau', string> = {
  aufbau: 'bg-sky-500',
  wartezeit: 'bg-muted-foreground/40',
  show: 'bg-primary',
  abbau: 'bg-violet-500',
}

/**
 * Kompaktes, immer sichtbares Status-Widget (fixed oben links) für einen
 * gerade laufenden Show-Ablauf (Aufbau/Show/Abbau, dazwischen Wartezeit).
 * Ersetzt den früheren Vollbild-`AblaufScreen` - Dashboard/Staffing bleiben
 * währenddessen normal bedienbar. Zeigt nur, sobald `ablaufStatus !== null`.
 * Die betroffene Show wird bewusst über `ablaufStatus.act` nachgeschlagen
 * (nicht über `activeShowAct`), da der Spieler parallel eine andere Show
 * staffen kann.
 */
export function AblaufWidget() {
  const { ablaufStatus, shows } = useGame()
  const aktuelleMinute = useAktuelleMinute()

  if (!ablaufStatus) return null

  const show = shows.find((s) => s.act === ablaufStatus.act)
  if (!show) return null

  const phase = ermittlePhase(ablaufStatus, aktuelleMinute)
  const fortschritt = phasenFortschritt(ablaufStatus, aktuelleMinute)
  const flavorText = ermittleFlavorText(phase, fortschritt)

  return (
    <Card className="fixed top-4 left-4 z-40 w-[220px] gap-3 py-3 shadow-lg sm:w-[250px]">
      <CardHeader className="gap-0.5 px-3">
        <CardDescription className="text-xs">{show.act}</CardDescription>
        <CardTitle className="text-base">{PHASE_LABEL[phase]}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(fortschritt)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fortschritt ${PHASE_LABEL[phase]}: ${Math.round(fortschritt)}%`}
        >
          <div
            className={cn('h-full rounded-full transition-all', PHASE_BALKEN_FARBE[phase])}
            style={{ width: `${fortschritt}%` }}
          />
        </div>
        {flavorText && <p className="text-xs text-muted-foreground">{flavorText}</p>}

        {phase === 'aufbau' && <TransportSzene richtung="hin" compact />}
        {phase === 'show' && (
          <BesucherSzene erwarteteBesucherzahl={show.erwarteteBesucherzahl} compact />
        )}
        {phase === 'abbau' && <TransportSzene richtung="zurück" compact />}
      </CardContent>
    </Card>
  )
}
