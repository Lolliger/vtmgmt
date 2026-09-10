import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RollenAnforderungenListe } from '@/components/RollenAnforderungenListe'
import { budgetFormatter, dateFormatter } from '@/lib/format'
import { useGame } from '@/state/GameContext'
import type { Preisniveau, TechnikerStufe } from '@/types'

const stufeVariant: Record<TechnikerStufe, 'default' | 'secondary' | 'outline'> = {
  Trainee: 'outline',
  Techniker: 'secondary',
  Senior: 'default',
  Abteilungsleitung: 'default',
  'stellv. technische Leitung': 'default',
}

const preisniveauLabel: Record<Preisniveau, string> = {
  günstig: '€ günstig',
  mittel: '€€ mittel',
  premium: '€€€ premium',
}

export function Dashboard() {
  const { venue, techniker, verleiher, shows, annehmen, ablehnen } = useGame()

  const offeneAnfragen = shows.filter((s) => s.status === 'offen')
  const anstehendeShows = shows.filter((s) => s.status === 'angenommen')

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{venue.name}</CardTitle>
          <CardDescription>Venue-Übersicht</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-2xl font-semibold">
                {budgetFormatter.format(venue.budget)}
              </p>
            </div>
            <Separator orientation="vertical" className="h-auto" />
            <div>
              <p className="text-sm text-muted-foreground">Reputation</p>
              <p className="text-2xl font-semibold">{venue.reputation} / 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {anstehendeShows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Anstehende Shows</CardTitle>
            <CardDescription>Angenommen, noch nicht besetzt/durchgeführt</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {anstehendeShows.map((show) => (
              <div
                key={show.act}
                className="flex flex-col gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{show.act}</p>
                  <Badge variant="outline">{show.genre}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {dateFormatter.format(new Date(show.termin))} ·{' '}
                  {show.erwarteteBesucherzahl.toLocaleString('de-DE')} erwartete Besucher ·{' '}
                  {budgetFormatter.format(show.gage)} Gage
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>Techniker im Überblick</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {techniker.map((person) => (
              <div
                key={person.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {person.rolle} · Erfahrung {person.erfahrung}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={stufeVariant[person.stufe]}>{person.stufe}</Badge>
                  {!person.verfügbar && (
                    <span className="text-xs text-muted-foreground">verplant</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verleiher</CardTitle>
            <CardDescription>Bekannte Partner</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {verleiher.map((firma) => (
              <div
                key={firma.name}
                className="flex flex-col gap-1 rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{firma.name}</p>
                  <Badge variant="outline">{preisniveauLabel[firma.preisniveau]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Zuverlässigkeit {firma.zuverlässigkeit} · Beziehung {firma.beziehung}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anfragen-Inbox</CardTitle>
            <CardDescription>Neue Show-Anfragen</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {offeneAnfragen.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Keine offenen Anfragen.
              </p>
            )}
            {offeneAnfragen.map((anfrage) => (
              <div
                key={anfrage.act}
                className="flex flex-col gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{anfrage.act}</p>
                  <Badge variant="outline">{anfrage.genre}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {dateFormatter.format(new Date(anfrage.termin))} ·{' '}
                  {anfrage.erwarteteBesucherzahl.toLocaleString('de-DE')} erwartete
                  Besucher
                </p>
                <p className="text-sm font-medium">
                  Gage: {budgetFormatter.format(anfrage.gage)}
                </p>
                <RollenAnforderungenListe genre={anfrage.genre} />
                <div className="mt-1 flex gap-2">
                  <Button size="sm" onClick={() => annehmen(anfrage.act)}>
                    Annehmen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ablehnen(anfrage.act)}
                  >
                    Ablehnen
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
