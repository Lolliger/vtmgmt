import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useGame } from '@/state/GameContext'

export function EreignisScreen() {
  const { activeShow, aktivesEreignis, ereignisReagieren } = useGame()

  if (!aktivesEreignis) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">Kein Ereignis aktiv.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className="ring-1 ring-amber-500/40 bg-amber-500/5">
        <CardHeader>
          {activeShow && <CardDescription>{activeShow.act} – Zufallsereignis</CardDescription>}
          <div className="flex items-center gap-3">
            <TriangleAlert className="size-8 shrink-0 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-2xl">Zwischenfall</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{aktivesEreignis.beschreibung}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wie reagierst du?</CardTitle>
          <CardDescription>Deine Entscheidung wirkt sich auf die Show-Auflösung aus</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={() => ereignisReagieren('A')}>
            {aktivesEreignis.reaktionA.label}
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => ereignisReagieren('B')}
          >
            {aktivesEreignis.reaktionB.label}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
