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

