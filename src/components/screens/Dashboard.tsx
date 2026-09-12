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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoralAnzeige } from '@/components/MoralAnzeige'
import { RollenAnforderungenListe } from '@/components/RollenAnforderungenListe'
import { useAktuelleMinute } from '@/hooks/useAktuelleMinute'
import { budgetFormatter } from '@/lib/format'
import { ermittlePhase, PHASE_LABEL } from '@/lib/ablaufAnzeige'
import { useGame } from '@/state/GameContext'
import type { EquipmentKategorie, Preisniveau, TechnikerStufe } from '@/types'

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

const KATEGORIE_REIHENFOLGE: EquipmentKategorie[] = ['PA', 'Licht', 'Rigging', 'IEM', 'Signal']

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
    equipmentAntraege,
    equipmentAntragBewilligen,
    equipmentAntragAblehnen,
    bewerbungen,
    bewerbungAnnehmen,
    bewerbungAblehnen,
    kuendigungsantraege,
    kuendigungAkzeptieren,
    kuendigungAblehnen,
    ablaufStatus,
  } = useGame()
  const [gespeichertHinweis, setGespeichertHinweis] = useState(false)
  const [angezeigteBewerbungId, setAngezeigteBewerbungId] = useState<string | null>(null)
  const aktuelleMinute = useAktuelleMinute()

  const laufendeShow = ablaufStatus ? shows.find((s) => s.act === ablaufStatus.act) : null
  const laufendePhase =
    ablaufStatus && laufendeShow ? ermittlePhase(ablaufStatus, aktuelleMinute) : null

  const offeneAnfragen = shows.filter((s) => s.status === 'offen')
  const anstehendeShows = shows.filter((s) => s.status === 'angenommen')
  const equipmentNachKategorie = KATEGORIE_REIHENFOLGE.map((kategorie) => ({
    kategorie,
    items: venue.equipmentBestand.filter((item) => item.kategorie === kategorie),
  })).filter((gruppe) => gruppe.items.length > 0)

  const staffBadgeCount = bewerbungen.length + kuendigungsantraege.length
  const equipmentBadgeCount = equipmentAntraege.length
  const anfragenBadgeCount = offeneAnfragen.length

  const angezeigteBewerbung = bewerbungen.find((b) => b.id === angezeigteBewerbungId) ?? null

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
                  {show.erwarteteBesucherzahl.toLocaleString('de-DE')} erwartete Besucher ·{' '}
                  {budgetFormatter.format(show.gage)} Gage
                </p>
                <p className="text-sm text-primary underline-offset-4">Staffing öffnen →</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="anfragen">
        <TabsList>
          <TabsTrigger value="anfragen" className="gap-1.5">
            Anfragen
            {anfragenBadgeCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                {anfragenBadgeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5">
            Staff
            {staffBadgeCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                {staffBadgeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="equipment" className="gap-1.5">
            Equipment
            {equipmentBadgeCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                {equipmentBadgeCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anfragen" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Anfragen-Inbox</CardTitle>
              <CardDescription>Neue Show-Anfragen</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {offeneAnfragen.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine offenen Anfragen.</p>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                      {anfrage.erwarteteBesucherzahl.toLocaleString('de-DE')} erwartete Besucher
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Techniker im Überblick</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {techniker.map((person) => {
                const imEinsatzBeiLaufenderShow =
                  laufendeShow &&
                  Object.values(laufendeShow.zugewieseneTechniker).includes(person.name)

                return (
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
                      {!person.verfügbar && imEinsatzBeiLaufenderShow && (
                        <span className="text-xs font-medium text-primary">
                          im Einsatz: {laufendePhase ? PHASE_LABEL[laufendePhase] : 'Einsatz'} bei{' '}
                          {laufendeShow.act}
                        </span>
                      )}
                      {!person.verfügbar && !imEinsatzBeiLaufenderShow && (
                        <span className="text-xs text-muted-foreground">verplant</span>
                      )}
                    </div>
                  </div>
                )
              })}
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

          {bewerbungen.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bewerbungen</CardTitle>
                <CardDescription>Neue Techniker-Kandidat:innen</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {bewerbungen.map((bewerbung) => (
                  <div
                    key={bewerbung.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <button
                      type="button"
                      onClick={() => setAngezeigteBewerbungId(bewerbung.id)}
                      className="flex flex-wrap items-center gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <p className="font-medium underline-offset-4 hover:underline">
                        {bewerbung.name}
                      </p>
                      <Badge variant="outline">{bewerbung.rolle}</Badge>
                      <Badge variant={stufeVariant[bewerbung.stufe]}>{bewerbung.stufe}</Badge>
                    </button>
                    <p className="text-sm text-muted-foreground">
                      Erfahrung {bewerbung.erfahrung} ·{' '}
                      {budgetFormatter.format(bewerbung.gehaltsforderung)} / Woche
                    </p>
                    <button
                      type="button"
                      onClick={() => setAngezeigteBewerbungId(bewerbung.id)}
                      className="w-fit text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      Bewerbungsschreiben ansehen
                    </button>
                    <div className="mt-1 flex gap-2">
                      <Button size="sm" onClick={() => bewerbungAnnehmen(bewerbung.id)}>
                        Einstellen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bewerbungAblehnen(bewerbung.id)}
                      >
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {kuendigungsantraege.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kündigungsanträge</CardTitle>
                <CardDescription>Technikerin:innen wollen gehen</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {kuendigungsantraege.map((antrag) => (
                  <div
                    key={antrag.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <p className="font-medium">{antrag.technikerName}</p>
                    <p className="text-sm text-muted-foreground">{antrag.grund}</p>
                    <div className="mt-1 flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => kuendigungAkzeptieren(antrag.id)}
                      >
                        Akzeptieren
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => kuendigungAblehnen(antrag.id)}
                      >
                        Ablehnen/Halten
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="equipment" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment-Inventar</CardTitle>
              <CardDescription>
                {venue.equipmentBestand.length} Items gesamt · nach Kategorie sortiert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentNachKategorie.map(({ kategorie, items }) =>
                      items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-normal">{item.name}</TableCell>
                          <TableCell>
                            {index === 0 ? (
                              <Badge variant="outline">{kategorie}</Badge>
                            ) : (
                              <span className="text-muted-foreground">{kategorie}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {equipmentAntraege.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment-Anträge</CardTitle>
                <CardDescription>Anschaffungen zur Bewilligung</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {equipmentAntraege.map((antrag) => (
                  <div
                    key={antrag.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <p className="font-medium">{antrag.beschreibung}</p>
                    <p className="text-sm text-muted-foreground">
                      {antrag.anzahl}x {antrag.kategorie} ·{' '}
                      {budgetFormatter.format(antrag.anschaffungskosten)}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <Button size="sm" onClick={() => equipmentAntragBewilligen(antrag.id)}>
                        Bewilligen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => equipmentAntragAblehnen(antrag.id)}
                      >
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={angezeigteBewerbung !== null}
        onOpenChange={(open) => {
          if (!open) setAngezeigteBewerbungId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bewerbung von {angezeigteBewerbung?.name ?? ''}
            </DialogTitle>
            <DialogDescription asChild>
              <p className="whitespace-pre-wrap text-foreground">
                {angezeigteBewerbung?.bewerbungsschreiben}
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
