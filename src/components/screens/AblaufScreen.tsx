import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useVergangeneSekunden } from '@/hooks/useVergangeneSekunden'
import {
  ermittleFlavorText,
  ermittlePhase,
  PHASE_LABEL,
  phasenFortschritt,
} from '@/lib/ablaufAnzeige'
import { cn } from '@/lib/utils'
import { vorschauScores } from '@/logic/showAuflösung'
import { useGame } from '@/state/GameContext'
import type { Anfrage, Techniker, Venue, Verleiher } from '@/types'

const PHASE_BALKEN_FARBE: Record<'aufbau' | 'show' | 'abbau', string> = {
  aufbau: 'bg-sky-500',
  show: 'bg-primary',
  abbau: 'bg-violet-500',
}

function scoreStatus(score: number) {
  if (score >= 80) {
    return {
      text: 'text-emerald-700 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      track: 'bg-emerald-500/15',
    }
  }
  if (score >= 50) {
    return {
      text: 'text-amber-700 dark:text-amber-400',
      bar: 'bg-amber-500',
      track: 'bg-amber-500/15',
    }
  }
  return { text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', track: 'bg-red-500/15' }
}

/** Score-Fortschrittsbalken im Stil von MoralAnzeige, für die Soundcheck-Vorschau. */
function ScoreBalken({ label, score }: { label: string; score: number }) {
  const status = scoreStatus(score)
  const breite = Math.min(100, Math.max(0, score))

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn('text-sm font-medium', status.text)}>{score} / 100</span>
      </div>
      <div
        className={cn('h-1.5 w-full overflow-hidden rounded-full', status.track)}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${score} von 100`}
      >
        <div
          className={cn('h-full rounded-full transition-all', status.bar)}
          style={{ width: `${breite}%` }}
        />
      </div>
    </div>
  )
}

const CASE_FARBEN = ['bg-amber-500', 'bg-emerald-500', 'bg-rose-500']

/**
 * Dezente Aufbau/Abbau-Animation: LKW und Halle als abstrakte Formen, dazwischen
 * wandern kleine "Cases" hin und her. Rein kosmetisch, keine Spiellogik.
 * `richtung="hin"` = Aufbau (LKW -> Halle), `richtung="zurück"` = Abbau (Halle -> LKW).
 */
function TransportSzene({ richtung }: { richtung: 'hin' | 'zurück' }) {
  const animationsKlasse = richtung === 'hin' ? 'animate-case-rechts' : 'animate-case-links'

  return (
    <div className="relative flex h-16 items-center justify-between px-2" aria-hidden="true">
      {/* LKW */}
      <div className="relative shrink-0">
        <div className="h-6 w-11 rounded-sm bg-slate-400 dark:bg-slate-500" />
        <div className="absolute -bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 dark:bg-slate-900" />
        <div className="absolute -bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 dark:bg-slate-900" />
      </div>

      {/* Cases, die zwischen LKW und Halle hin- bzw. herwandern */}
      <div className="relative h-4 flex-1 mx-3">
        {CASE_FARBEN.map((farbe, i) => (
          <div
            key={i}
            className={cn('absolute top-0 h-4 w-5 rounded-sm', farbe, animationsKlasse)}
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
      </div>

      {/* Halle */}
      <div className="h-10 w-16 shrink-0 rounded-sm bg-muted ring-1 ring-foreground/10" />
    </div>
  )
}

/**
 * Dezente Show-Animation: kleine Punkte ("Besucher") hüpfen unsynchronisiert.
 * Anzahl richtet sich nach der erwarteten Besucherzahl der aktiven Show.
 */
function BesucherSzene({ erwarteteBesucherzahl }: { erwarteteBesucherzahl: number }) {
  const anzahl = Math.min(12, Math.max(3, Math.round(erwarteteBesucherzahl / 100)))
  const punkte = Array.from({ length: anzahl })

  return (
    <div className="flex h-16 items-end justify-center gap-2" aria-hidden="true">
      {punkte.map((_, i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full bg-primary/70 animate-besucher-huepfen"
          style={{
            animationDelay: `${(i % 5) * 0.15}s`,
            animationDuration: `${0.8 + (i % 4) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

function SoundcheckKarte({
  activeShow,
  techniker,
  verleiher,
  venue,
  onBestätigen,
  onAbbrechen,
}: {
  activeShow: Anfrage
  techniker: Techniker[]
  verleiher: Verleiher[]
  venue: Venue
  onBestätigen: () => void
  onAbbrechen: () => void
}) {
  const { staffingScore, equipmentScore } = vorschauScores(
    activeShow,
    techniker,
    verleiher,
    venue
  )

  return (
    <Card className="ring-1 ring-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-xl">Soundcheck</CardTitle>
        <CardDescription>Letzte Kontrolle vor der Show – so steht ihr aktuell da</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ScoreBalken label="Staffing" score={staffingScore} />
        <ScoreBalken label="Equipment" score={equipmentScore} />

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={onBestätigen}>
            Bereit für die Show
          </Button>
          <Button className="flex-1" variant="outline" onClick={onAbbrechen}>
            Zurück zum Staffing
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AblaufScreen() {
  const {
    activeShow,
    ablaufStatus,
    techniker,
    verleiher,
    venue,
    soundcheckBestätigen,
    soundcheckAbbrechen,
    backToDashboard,
  } = useGame()
  const vergangeneSekunden = useVergangeneSekunden(ablaufStatus)

  if (!activeShow || !ablaufStatus) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">Kein Ablauf aktiv.</p>
        <Button variant="outline" onClick={backToDashboard}>
          Zurück zum Dashboard
        </Button>
      </div>
    )
  }

  const phase = ermittlePhase(ablaufStatus, vergangeneSekunden)
  const fortschritt = phasenFortschritt(ablaufStatus, vergangeneSekunden)
  const flavorText = ermittleFlavorText(phase, fortschritt)
  const zeigeSoundcheckKarte = ablaufStatus.pausierGrund === 'soundcheck'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardDescription>{activeShow.act} – Ablauf</CardDescription>
          <CardTitle className="text-2xl">{PHASE_LABEL[phase]}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {phase === 'soundcheck' ? (
            <p className="text-sm text-muted-foreground">
              {zeigeSoundcheckKarte
                ? 'Der Aufbau ist abgeschlossen – prüft den Stand, bevor es losgeht.'
                : 'Aufbau abgeschlossen, Soundcheck steht bevor...'}
            </p>
          ) : (
            <>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
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
              {flavorText && <p className="text-sm text-muted-foreground">{flavorText}</p>}

              {phase === 'aufbau' && <TransportSzene richtung="hin" />}
              {phase === 'show' && (
                <BesucherSzene erwarteteBesucherzahl={activeShow.erwarteteBesucherzahl} />
              )}
              {phase === 'abbau' && <TransportSzene richtung="zurück" />}
            </>
          )}
        </CardContent>
      </Card>

      {zeigeSoundcheckKarte && (
        <SoundcheckKarte
          activeShow={activeShow}
          techniker={techniker}
          verleiher={verleiher}
          venue={venue}
          onBestätigen={soundcheckBestätigen}
          onAbbrechen={soundcheckAbbrechen}
        />
      )}
    </div>
  )
}

