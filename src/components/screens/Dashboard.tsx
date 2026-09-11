import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MoralAnzeige } from '@/components/MoralAnzeige'
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
  const {
    venue,
    woche,
    techniker,
    verleiher,
    shows,
    annehmen,
    ablehnen,
    openStaffing,
    speichern,
    wochenGehaltssumme,
    minusWochenInFolge,
    zwangsentlassungAusstehend,
    entlassen,
  } = useGame()
  const [gespeichertHinweis, setGespeichertHinweis] = useState(false)

  const offeneAnfragen = shows.filter((s) => s.status === 'offen')
  const anstehendeShows = shows.filter((s) => s.status === 'angenommen')

  function handleSpeichern() {
    speichern()
    setGespeichertHinweis(true)
    setTimeout(() => setGespeichertHinweis(false), 2000)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {zwangsentlassungAusstehend && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="size-5" />
              Zwangsentlassung erforderlich
            </CardTitle>
            <CardDescription className="text-destructive/90">
              Das Budget ist seit {minusWochenInFolge} Wochen im Minus – eine
              Entlassung ist unvermeidbar. Wähle eine:n Techniker:in aus, um
              die Personalkosten zu senken.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {techniker.map((person) => (
              <div
                key={person.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-background p-3"
              >
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {person.rolle} · {person.stufe} ·{' '}
                    {budgetFormatter.format(person.gehalt)} / Woche
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => entlassen(person.name)}
                >
                  Entlassen
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{venue.name}</CardTitle>
          <CardDescription>Venue-Übersicht · Woche {woche}</CardDescription>
          <CardAction className="flex items-center gap-2">
            {gespeichertHinweis && (
              <span className="text-sm text-muted-foreground">Gespeichert ✓</span>
            )}
            <span className="text-sm text-muted-foreground">
              Nächster Wochenabschluss: −{budgetFormatter.format(wochenGehaltssumme)} Gehälter
            </span>
            <Button size="sm" variant="outline" onClick={handleSpeichern}>
              Speichern
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Woche</p>
              <p className="text-2xl font-semibold">{woche}</p>
            </div>
            <Separator orientation="vertical" className="h-auto" />
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <div className="flex items-center gap-2">
                <p
                  className={
                    venue.budget < 0
                      ? 'text-2xl font-semibold text-destructive'
                      : 'text-2xl font-semibold'
                  }
                >
                  {budgetFormatter.format(venue.budget)}
                </p>
                {venue.budget < 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <TriangleAlert className="size-3.5" />
                    Budget im Minus
                  </Badge>
                )}
              </div>
              {venue.budget < 0 && minusWochenInFolge >= 1 && (
                <p className="text-xs text-destructive">
                  seit {minusWochenInFolge} Woche
                  {minusWochenInFolge === 1 ? '' : 'n'} im Minus
                </p>
              )}
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
              <button
                key={show.act}
                type="button"
                onClick={() => openStaffing(show.act)}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <p className="text-sm text-primary underline-offset-4">Staffing öffnen →</p>
              </button>
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
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {person.rolle} · Erfahrung {person.erfahrung}
                  </p>
                </div>
                <MoralAnzeige moral={person.moral} />
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
