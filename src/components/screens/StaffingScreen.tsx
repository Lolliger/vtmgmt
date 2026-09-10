import { ArrowLeft } from 'lucide-react'
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
import { benötigteRollen, ermittleEquipmentLücke, type EquipmentLücke } from '@/logic/showAuflösung'
import { useGame } from '@/state/GameContext'
import type { Preisniveau, TechnikerRolle } from '@/types'

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

  const lücken = rollen
    .map(([rolle]) => ({
      rolle,
      lücke: ermittleEquipmentLücke(rolle, activeShow.genre, venue.equipmentBestand),
    }))
    .filter(
      (eintrag): eintrag is { rolle: TechnikerRolle; lücke: EquipmentLücke } =>
        eintrag.lücke !== null
    )

  const alleRollenBesetzt = rollen.every(([rolle]) => !!activeShow.zugewieseneTechniker[rolle])
  const verleiherNötig = lücken.length > 0
  const verleiherAusgewählt = !!activeShow.gewählterVerleiher
  const kannDurchführen = alleRollenBesetzt && (!verleiherNötig || verleiherAusgewählt)

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
        const rollenLücke = ermittleEquipmentLücke(rolle, activeShow.genre, venue.equipmentBestand)

        return (
          <Card key={rolle}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{rolle}</CardTitle>
                <Badge variant={schwierigkeitVariant[anforderung.schwierigkeit]}>
                  {anforderung.schwierigkeit} · min. {anforderung.minStufe}
                </Badge>
              </div>
              {rollenLücke && (
                <CardDescription className="text-amber-600 dark:text-amber-500">
                  Equipment-Lücke: {rollenLücke.kategorie} – Bedarf {rollenLücke.bedarf} /
                  Bestand {rollenLücke.bestand}
                </CardDescription>
              )}
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
                  return (
                    <button
                      key={person.name}
                      type="button"
                      onClick={() =>
                        assignTechniker(activeShow.act, rolle, istAusgewählt ? null : person.name)
                      }
                      className={cn(
                        'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        istAusgewählt
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{person.name}</p>
                        <Badge variant="outline">verfügbar</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {person.stufe} · Erfahrung {person.erfahrung}
                      </p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {verleiherNötig && (
        <Card>
          <CardHeader>
            <CardTitle>Verleiher wählen</CardTitle>
            <CardDescription>
              Equipment-Lücke bei {lücken.map((l) => l.rolle).join(', ')} – eigener Bestand
              reicht nicht aus.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {verleiher.map((firma) => {
              const istAusgewählt = activeShow.gewählterVerleiher === firma.name
              return (
                <button
                  key={firma.name}
                  type="button"
                  onClick={() => assignVerleiher(activeShow.act, istAusgewählt ? null : firma.name)}
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
