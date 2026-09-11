import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGame } from '@/state/GameContext'

/**
 * Zufallsereignis als Pop-up (früher eigener Vollbild-Screen). Offen, sobald
 * `aktivesEreignis !== null` - unabhängig von `view`, damit Dashboard/Staffing
 * im Hintergrund sichtbar bleiben. Die betroffene Show wird über
 * `ablaufStatus.act` nachgeschlagen (nicht `activeShowAct`), da der Spieler
 * parallel eine andere Show staffen kann. Kann nur über eine der beiden
 * Reaktionen geschlossen werden - ein Schließversuch daneben (Escape/Klick
 * außerhalb) wird ignoriert.
 */
export function EreignisScreen() {
  const { aktivesEreignis, ablaufStatus, shows, ereignisReagieren } = useGame()

  const offen = aktivesEreignis !== null
  const show = ablaufStatus ? shows.find((s) => s.act === ablaufStatus.act) : undefined

  if (!offen) return null

  return (
    <Dialog open={offen} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <DialogTitle>Zwischenfall</DialogTitle>
          </div>
          {show && <DialogDescription>{show.act} – Zufallsereignis</DialogDescription>}
        </DialogHeader>

        <p className="text-sm">{aktivesEreignis?.beschreibung}</p>

        <DialogFooter className="sm:justify-stretch">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => ereignisReagieren('B')}
          >
            {aktivesEreignis?.reaktionB.label}
          </Button>
          <Button className="flex-1" onClick={() => ereignisReagieren('A')}>
            {aktivesEreignis?.reaktionA.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
