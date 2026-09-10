import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useGame } from '@/state/GameContext'
import type { Ergebnis } from '@/types'

const kategorieConfig: Record<
  Ergebnis,
  { label: string; icon: typeof CircleCheck; className: string; badgeClassName: string }
> = {
  gut: {
    label: 'Gut gelaufen',
    icon: CircleCheck,
    className: 'ring-1 ring-emerald-500/40 bg-emerald-500/5',
    badgeClassName: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  mittel: {
    label: 'Mittelmäßig gelaufen',
    icon: TriangleAlert,
    className: 'ring-1 ring-amber-500/40 bg-amber-500/5',
    badgeClassName: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  problematisch: {
    label: 'Problematisch gelaufen',
    icon: CircleX,
    className: 'ring-1 ring-destructive/40 bg-destructive/5',
    badgeClassName: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
}

export function AuflösungScreen() {
  const { activeShow, letzteAuflösung, backToDashboard } = useGame()

  if (!activeShow || !letzteAuflösung) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">Keine Auflösung verfügbar.</p>
        <Button variant="outline" onClick={backToDashboard}>
          Zurück zum Dashboard
        </Button>
      </div>
    )
  }

  const { ergebnis, auswirkungen } = letzteAuflösung
  const config = kategorieConfig[ergebnis.kategorie]
  const Icon = config.icon

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className={cn(config.className)}>
        <CardHeader>
          <CardDescription>{activeShow.act} – Show-Auflösung</CardDescription>
          <div className="flex items-center gap-3">
            <Icon className="size-8 shrink-0" />
            <CardTitle className="text-2xl">{config.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">{ergebnis.begründung}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={config.badgeClassName}>
              Gesamtpunktzahl {ergebnis.gesamtpunktzahl} / 100
            </Badge>
            <Badge variant="outline">Staffing {ergebnis.staffingScore} / 100</Badge>
            <Badge variant="outline">Verleiher {ergebnis.verleiherScore} / 100</Badge>
            <Badge variant="outline">
              Zufall {ergebnis.zufallsfaktor >= 0 ? '+' : ''}
              {ergebnis.zufallsfaktor}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auswirkungen</CardTitle>
          <CardDescription>Was sich durch diese Show verändert hat</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {auswirkungen.map((eintrag) => (
              <li
                key={eintrag}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                {eintrag}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={backToDashboard}>Zurück zum Dashboard</Button>
      </div>
    </div>
  )
}
