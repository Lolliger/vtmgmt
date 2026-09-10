import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { anfragen, techniker, venue, verleiher } from '@/data/dummyData'
import type { Preisniveau, TechnikerStufe } from '@/types'

const stufeVariant: Record<
  TechnikerStufe,
  'default' | 'secondary' | 'outline'
> = {
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

const budgetFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function App() {
  return (
    <div className="min-h-svh bg-muted/30 px-4 py-8 sm:px-8">
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
                      {person.rolle}
                    </p>
                  </div>
                  <Badge variant={stufeVariant[person.stufe]}>
                    {person.stufe}
                  </Badge>
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
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <p className="font-medium">{firma.name}</p>
                  <Badge variant="outline">
                    {preisniveauLabel[firma.preisniveau]}
                  </Badge>
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
              {anfragen.map((anfrage) => (
                <div
                  key={`${anfrage.act}-${anfrage.termin}`}
                  className="flex flex-col gap-1 rounded-lg border border-border p-3"
                >
                  <p className="font-medium">{anfrage.act}</p>
                  <p className="text-sm text-muted-foreground">
                    {dateFormatter.format(new Date(anfrage.termin))} ·{' '}
                    {anfrage.erwarteteBesucherzahl.toLocaleString('de-DE')}{' '}
                    erwartete Besucher
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
