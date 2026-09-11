import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { vorschauScores } from '@/logic/showAuflösung'
import { useGame } from '@/state/GameContext'

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

/**
 * Soundcheck-Gate als Pop-up (früher Teil des Vollbild-AblaufScreen). Offen,
 * sobald `ablaufStatus.pausierGrund === 'soundcheck'` - unabhängig von `view`,
 * damit Dashboard/Staffing im Hintergrund sichtbar bleiben. Die betroffene
 * Show wird über `ablaufStatus.act` nachgeschlagen (nicht `activeShowAct`),
 * da der Spieler parallel eine andere Show staffen kann. Kann nur über einen
 * der beiden Buttons geschlossen werden - ein Schließversuch daneben
 * (Escape/Klick außerhalb) wird ignoriert.
 */
export function SoundcheckDialog() {
  const { ablaufStatus, shows, techniker, verleiher, venue, soundcheckBestätigen, soundcheckAbbrechen } =
    useGame()

  const offen = ablaufStatus?.pausierGrund === 'soundcheck'
  const show = ablaufStatus ? shows.find((s) => s.act === ablaufStatus.act) : undefined

  if (!offen || !show) return null

  const { staffingScore, equipmentScore } = vorschauScores(show, techniker, verleiher, venue)

  return (
    <Dialog open={offen} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Soundcheck</DialogTitle>
          <DialogDescription>
            {show.act} – letzte Kontrolle vor der Show: so steht ihr aktuell da.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ScoreBalken label="Staffing" score={staffingScore} />
          <ScoreBalken label="Equipment" score={equipmentScore} />
        </div>

        <DialogFooter className="sm:justify-stretch">
          <Button className="flex-1" variant="outline" onClick={soundcheckAbbrechen}>
            Zurück zum Staffing
          </Button>
          <Button className="flex-1" onClick={soundcheckBestätigen}>
            Bereit für die Show
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
