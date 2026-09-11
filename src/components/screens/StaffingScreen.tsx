import { ArrowLeft } from 'lucide-react'
import { MoralAnzeige } from '@/components/MoralAnzeige'
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
import { budgetFormatter, dateFormatter } from '@/lib/format'
import type { Schwierigkeit } from '@/data/genreAnforderungen'
import {
  benötigteRollen,
  ermittleAlleEquipmentBedarfe,
  geschätzteShowStunden,
} from '@/logic/showAuflösung'
import { useGame } from '@/state/GameContext'
import type { Preisniveau } from '@/types'

const schwierigkeitVariant: Record<Schwierigkeit, 'outline' | 'secondary' | 'default'> = {
  niedrig: 'outline',
  mittel: 'secondary',
  hoch: 'default',
}

const preisniveauLabel: Record<Preisniveau, string> = {
  günstig: '€ günstig',
  mittel: '€€ mittel',
  premium: '€€€ premium',
}

export function StaffingScreen() {
  const {
    venue,
    activeShow,
    techniker,
    verleiher,
    assignTechniker,
    assignVerleiher,
    toggleÜberstunden,
    resolveShow,
    backToDashboard,
  } = useGame()

  if (!activeShow) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">Keine Show ausgewählt.</p>
        <Button variant="outline" onClick={backToDashboard}>
          Zurück zum Dashboard
        </Button>
      </div>
    )
  }

  const rollen = benötigteRollen(activeShow.genre)
  const benötigteStunden = geschätzteShowStunden(activeShow)

  const equipmentBedarfe = ermittleAlleEquipmentBedarfe(activeShow.genre, venue.equipmentBestand)

  const alleRollenBesetzt = rollen.every(([rolle]) => !!activeShow.zugewieseneTechniker[rolle])
  const alleLückenGedeckt = equipmentBedarfe
    .filter((eintrag) => eintrag.lücke > 0)
    .every((eintrag) => !!activeShow.gewählteVerleiherProKategorie[eintrag.kategorie])
  const kannDurchführen = alleRollenBesetzt && alleLückenGedeckt

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={backToDashboard} className="w-fit">
        <ArrowLeft />
        Zurück zum Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{activeShow.act}</CardTitle>
          <CardDescription>
            {dateFormatter.format(new Date(activeShow.termin))} ·{' '}
            {activeShow.erwarteteBesucherzahl.toLocaleString('de-DE')} erwartete Besucher ·{' '}
            {budgetFormatter.format(activeShow.gage)} Gage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">{activeShow.genre}</Badge>
        </CardContent>
      </Card>

      {rollen.map(([rolle, anforderung]) => {
        const kandidaten = techniker.filter((t) => t.rolle === rolle && t.verfügbar)
        const zugewiesen = activeShow.zugewieseneTechniker[rolle]

        return (
          <Card key={rolle}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{rolle}</CardTitle>
                <Badge variant={schwierigkeitVariant[anforderung.schwierigkeit]}>
                  {anforderung.schwierigkeit} · min. {anforderung.minStufe}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {kandidaten.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Keine verfügbaren Techniker für {rolle}.
                </p>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {kandidaten.map((person) => {
                  const istAusgewählt = zugewiesen === person.name
                  const freieStunden = person.wochenstunden - person.verplanteStunden
                  const brauchtÜberstunden = freieStunden < benötigteStunden
                  const überstundenAktiv = activeShow.überstundenProRolle[rolle] === true

                  const handleAuswahl = () =>
                    assignTechniker(activeShow.act, rolle, istAusgewählt ? null : person.name)

                  return (
                    <div
                      key={person.name}
                      role="button"
                      tabIndex={0}
                      onClick={handleAuswahl}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleAuswahl()
                        }
                      }}
                      className={cn(
                        'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        istAusgewählt
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{person.name}</p>
                        <div className="flex items-center gap-1">
                          {brauchtÜberstunden && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            >
                              Überstunden nötig
                            </Badge>
                          )}
                          <Badge variant="outline">verfügbar</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {person.stufe} · Erfahrung {person.erfahrung}
                        </p>
                        <MoralAnzeige moral={person.moral} compact />
                      </div>
                      <p
                        className={cn(
                          'text-xs',
                          freieStunden < 0
                            ? 'font-medium text-red-600 dark:text-red-400'
                            : brauchtÜberstunden
                              ? 'font-medium text-amber-700 dark:text-amber-400'
                              : 'text-muted-foreground'
                        )}
                      >
                        {freieStunden}h frei / {benötigteStunden}h benötigt
                      </p>

                      {istAusgewählt && brauchtÜberstunden && (
                        <label
                          className="mt-1 flex items-center gap-2 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={überstundenAktiv}
                            onChange={(e) =>
                              toggleÜberstunden(activeShow.act, rolle, e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                          Überstunden einsetzen
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {equipmentBedarfe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
            <CardDescription>
              Bedarf dieser Show je Kategorie – bei Lücken ist ein Verleiher zu wählen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {equipmentBedarfe.map((eintrag) => {
              const hatLücke = eintrag.lücke > 0
              const gewählterName = activeShow.gewählteVerleiherProKategorie[eintrag.kategorie]

              return (
                <div key={eintrag.kategorie} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{eintrag.kategorie}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Bedarf {eintrag.bedarf} · aus Bestand gedeckt {eintrag.gedeckt}
                      </span>
                      {hatLücke ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        >
                          Lücke {eintrag.lücke}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        >
                          aus Eigenbestand gedeckt
                        </Badge>
                      )}
                    </div>
                  </div>

                  {hatLücke && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {verleiher.map((firma) => {
                        const istAusgewählt = gewählterName === firma.name
                        return (
                          <button
                            key={firma.name}
                            type="button"
                            onClick={() =>
                              assignVerleiher(
                                activeShow.act,
                                eintrag.kategorie,
                                istAusgewählt ? null : firma.name
                              )
                            }
                            className={cn(
                              'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                              istAusgewählt
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{firma.name}</p>
                              <Badge variant="outline">{preisniveauLabel[firma.preisniveau]}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Zuverlässigkeit {firma.zuverlässigkeit} · Beziehung {firma.beziehung}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pauschale: {budgetFormatter.format(firma.verleihkostenPauschale)}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button disabled={!kannDurchführen} onClick={() => resolveShow(activeShow.act)}>
          Show durchführen
        </Button>
      </div>
    </div>
  )
}
