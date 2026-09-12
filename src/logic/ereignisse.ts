import { ermittleAlleEquipmentBedarfe } from '@/logic/showAuflösung'
import type { Anfrage, EquipmentKategorie, Techniker, Venue, Verleiher } from '@/types'

export interface EreignisEffekt {
  budgetDelta?: number
  scoreDelta?: number
  reputationDelta?: number
  /** Trifft einen zufällig gewählten, dieser Show zugewiesenen Techniker. */
  moralDeltaZufälligerTechniker?: number
}

export interface EreignisReaktion {
  label: string
  effekt: EreignisEffekt
}

export type EreignisPhase = 'aufbau' | 'show' | 'abbau'

export interface Ereignis {
  id: string
  phase: EreignisPhase
  beschreibung: string
  reaktionA: EreignisReaktion
  reaktionB: EreignisReaktion
}

export type ErmittelesErgebnis =
  | { typ: 'reaktion'; ereignis: Ereignis }
  | { typ: 'automatisch'; beschreibung: string; effekt: EreignisEffekt }

/** Wählt zufällig ein Element aus einem nicht-leeren Array. */
function zufälligesElement<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)]
}

function gewählteVerleiherEintraege(
  anfrage: Anfrage
): { kategorie: EquipmentKategorie; name: string }[] {
  return (
    Object.entries(anfrage.gewählteVerleiherProKategorie) as [
      EquipmentKategorie,
      string | null | undefined,
    ][]
  )
    .filter((eintrag): eintrag is [EquipmentKategorie, string] => !!eintrag[1])
    .map(([kategorie, name]) => ({ kategorie, name }))
}

// 1. Verleiher liefert zu spät
function prüfeVerleiherLieferverzögerung(
  anfrage: Anfrage,
  _techniker: Techniker[],
  verleiher: Verleiher[]
): { ereignis: Ereignis; chance: number } | null {
  const eintraege = gewählteVerleiherEintraege(anfrage)
  if (eintraege.length === 0) return null

  const { kategorie, name } = zufälligesElement(eintraege)
  const firma = verleiher.find((v) => v.name === name)
  if (!firma) return null

  const chance = (100 - firma.zuverlässigkeit) * 0.4

  return {
    chance,
    ereignis: {
      id: 'verleiher-lieferverzögerung',
      phase: 'aufbau',
      beschreibung: `Verleiher ${firma.name} meldet eine Lieferverzögerung beim ${kategorie}-Equipment.`,
      reaktionA: {
        label: 'Express-Lieferung buchen (+300€)',
        effekt: { budgetDelta: -300 },
      },
      reaktionB: {
        label: 'Improvisieren',
        effekt: { scoreDelta: -12 },
      },
    },
  }
}

// 2. Techniker meldet sich krank
function prüfeTechnikerKrank(
  anfrage: Anfrage,
  techniker: Techniker[]
): { ereignis: Ereignis; chance: number } | null {
  const zugewiesen = Object.values(anfrage.zugewieseneTechniker).filter(
    (n): n is string => !!n
  )
  if (zugewiesen.length === 0) return null

  const name = zufälligesElement(zugewiesen)
  const person = techniker.find((t) => t.name === name)
  if (!person) return null

  const chance = (100 - person.moral) * 0.3

  return {
    chance,
    ereignis: {
      id: 'techniker-krank',
      phase: 'aufbau',
      beschreibung: `${name} meldet sich krank.`,
      reaktionA: {
        label: 'Ersatz kurzfristig buchen (+200€)',
        effekt: { budgetDelta: -200 },
      },
      reaktionB: {
        label: 'Improvisieren',
        effekt: { scoreDelta: -15 },
      },
    },
  }
}

// 3. Rider-Änderung
function prüfeRiderÄnderung(anfrage: Anfrage): { ereignis: Ereignis; chance: number } {
  const chance = anfrage.genre === 'Metal/Rock' || anfrage.genre === 'Hip-Hop/Rap' ? 12 : 8

  return {
    chance,
    ereignis: {
      id: 'rider-änderung',
      phase: 'aufbau',
      beschreibung: `${anfrage.act} bringt kurzfristig eine Rider-Änderung mit zusätzlichen Anforderungen.`,
      reaktionA: {
        label: 'Zusatzwunsch erfüllen (+200€)',
        effekt: { budgetDelta: -200 },
      },
      reaktionB: {
        label: 'Ablehnen',
        effekt: { reputationDelta: -2 },
      },
    },
  }
}

// 4. Defekt am Eigenbestand-Equipment
function prüfeEigenbestandDefekt(
  anfrage: Anfrage,
  venue: Venue
): { ereignis: Ereignis; chance: number } | null {
  const bedarfe = ermittleAlleEquipmentBedarfe(anfrage.genre, venue.equipmentBestand)
  const vollständigGedeckt = bedarfe.filter((b) => b.bedarf > 0 && b.lücke === 0)
  if (vollständigGedeckt.length === 0) return null

  const eintrag = zufälligesElement(vollständigGedeckt)
  const chance = Math.min(24, 6 * vollständigGedeckt.length)

  return {
    chance,
    ereignis: {
      id: 'eigenbestand-defekt',
      phase: 'aufbau',
      beschreibung: `Defekt am hauseigenen ${eintrag.kategorie}-Equipment.`,
      reaktionA: {
        label: 'Sofort-Reparatur (150€)',
        effekt: { budgetDelta: -150 },
      },
      reaktionB: {
        label: 'Weiterlaufen lassen',
        effekt: { scoreDelta: -10 },
      },
    },
  }
}

// 5. Verleiher schickt unerfahrenes Ersatzpersonal
function prüfeUnerfahrenesErsatzpersonal(
  anfrage: Anfrage,
  verleiher: Verleiher[]
): { ereignis: Ereignis; chance: number } | null {
  const eintraege = gewählteVerleiherEintraege(anfrage)
  if (eintraege.length === 0) return null

  const { kategorie, name } = zufälligesElement(eintraege)
  const firma = verleiher.find((v) => v.name === name)
  if (!firma) return null

  const chance = (100 - firma.zuverlässigkeit) * 0.25

  return {
    chance,
    ereignis: {
      id: 'unerfahrenes-ersatzpersonal',
      phase: 'aufbau',
      beschreibung: `${firma.name} schickt kurzfristig unerfahrenes Ersatzpersonal für das ${kategorie}-Equipment.`,
      reaktionA: {
        label: 'Nachbessern lassen (100€)',
        effekt: { budgetDelta: -100 },
      },
      reaktionB: {
        label: 'Akzeptieren',
        effekt: { scoreDelta: -8 },
      },
    },
  }
}

// 6. Kurzfristige Terminverschiebung durch den Act
function prüfeTerminverschiebung(anfrage: Anfrage): { ereignis: Ereignis; chance: number } {
  return {
    chance: 5,
    ereignis: {
      id: 'terminverschiebung',
      phase: 'aufbau',
      beschreibung: `${anfrage.act} bittet kurzfristig um eine Terminverschiebung.`,
      reaktionA: {
        label: 'Flexibel bleiben, Team umdisponieren',
        effekt: { moralDeltaZufälligerTechniker: -5 },
      },
      reaktionB: {
        label: 'Ablehnen',
        effekt: { reputationDelta: -3 },
      },
    },
  }
}

// 7. Act ist unkompliziert/professionell (automatisch)
function prüfeActUnkompliziert(
  anfrage: Anfrage
): { ergebnis: { typ: 'automatisch'; beschreibung: string; effekt: EreignisEffekt }; chance: number } {
  return {
    chance: 10,
    ergebnis: {
      typ: 'automatisch',
      beschreibung: `${anfrage.act} ist unkompliziert und professionell - das gibt einen kleinen Bonus.`,
      effekt: { scoreDelta: 5 },
    },
  }
}

// 8. Publikumsandrang über Erwarten (automatisch)
function prüfePublikumsandrang(
  anfrage: Anfrage,
  venue: Venue
): { ergebnis: { typ: 'automatisch'; beschreibung: string; effekt: EreignisEffekt }; chance: number } {
  return {
    chance: venue.reputation * 0.15,
    ergebnis: {
      typ: 'automatisch',
      beschreibung: 'Mehr Publikum als erwartet strömt in die Halle.',
      effekt: { budgetDelta: Math.round(anfrage.gage * 0.1) },
    },
  }
}

// 9. Parkplatzproblem beim Aufbau
function prüfeParkplatzproblem(): { ereignis: Ereignis; chance: number } {
  return {
    chance: 10,
    ereignis: {
      id: 'parkplatzproblem',
      phase: 'aufbau',
      beschreibung: 'Der Lieferwagen des Verleihers findet keinen Parkplatz - der Aufbau verzögert sich.',
      reaktionA: {
        label: 'Zusätzliche Arbeitskraft engagieren (+100€)',
        effekt: { budgetDelta: -100 },
      },
      reaktionB: {
        label: 'Selbst mit anpacken',
        effekt: { moralDeltaZufälligerTechniker: -5 },
      },
    },
  }
}

// 10. Technischer Ausfall während der Show
function prüfeTechnischerAusfall(
  anfrage: Anfrage,
  venue: Venue
): { ereignis: Ereignis; chance: number } | null {
  const bedarfe = ermittleAlleEquipmentBedarfe(anfrage.genre, venue.equipmentBestand)
  const betroffen = bedarfe.some(
    (b) => (b.kategorie === 'PA' || b.kategorie === 'Processing') && b.bedarf > 0
  )
  if (!betroffen) return null

  return {
    chance: 12,
    ereignis: {
      id: 'technischer-ausfall-show',
      phase: 'show',
      beschreibung: 'Ein technischer Defekt unterbricht kurz den Sound.',
      reaktionA: {
        label: 'Ersatzgerät holen (100€)',
        effekt: { budgetDelta: -100 },
      },
      reaktionB: {
        label: 'Improvisieren',
        effekt: { scoreDelta: -15 },
      },
    },
  }
}

// 11. Sicherheitsvorfall während der Show
function prüfeSicherheitsvorfall(anfrage: Anfrage): { ereignis: Ereignis; chance: number } {
  return {
    chance: Math.min(15, Math.round(anfrage.erwarteteBesucherzahl / 100)),
    ereignis: {
      id: 'sicherheitsvorfall',
      phase: 'show',
      beschreibung: 'Gedränge vor der Bühne sorgt für einen kleinen Sicherheitsvorfall.',
      reaktionA: {
        label: 'Security nachfordern (150€)',
        effekt: { budgetDelta: -150 },
      },
      reaktionB: {
        label: 'Nichts tun',
        effekt: { scoreDelta: -20 },
      },
    },
  }
}

// 12. Zugabe-Wunsch des Publikums
function prüfeZugabeWunsch(anfrage: Anfrage): { ereignis: Ereignis; chance: number } {
  return {
    chance: 12,
    ereignis: {
      id: 'zugabe-wunsch',
      phase: 'show',
      beschreibung: 'Das Publikum fordert lautstark eine Zugabe.',
      reaktionA: {
        label: 'Zugabe spielen',
        effekt: {
          reputationDelta: 3,
          moralDeltaZufälligerTechniker: -5,
          budgetDelta: Math.round(anfrage.gage * 0.05),
        },
      },
      reaktionB: {
        label: 'Höflich ablehnen',
        effekt: {},
      },
    },
  }
}

// 13. Transportschaden beim Abbau
function prüfeTransportschaden(): { ereignis: Ereignis; chance: number } {
  return {
    chance: 10,
    ereignis: {
      id: 'transportschaden',
      phase: 'abbau',
      beschreibung: 'Beim Verladen wird ein Equipment-Teil beschädigt.',
      reaktionA: {
        label: 'Sofort reparieren (100€)',
        effekt: { budgetDelta: -100 },
      },
      reaktionB: {
        label: 'Auf später verschieben',
        effekt: { reputationDelta: -2 },
      },
    },
  }
}

// 14. Verlorenes Equipment beim Abbau
function prüfeVerlorenesEquipment(): { ereignis: Ereignis; chance: number } {
  return {
    chance: 8,
    ereignis: {
      id: 'verlorenes-equipment',
      phase: 'abbau',
      beschreibung: 'Ein kleines Equipment-Teil ist beim Abbau verschwunden.',
      reaktionA: {
        label: 'Ersatz kaufen (120€)',
        effekt: { budgetDelta: -120 },
      },
      reaktionB: {
        label: 'Verlust hinnehmen',
        effekt: { scoreDelta: -5 },
      },
    },
  }
}

// 15. Überstunden beim Abbau
function prüfeÜberstundenAbbau(): { ereignis: Ereignis; chance: number } {
  return {
    chance: 10,
    ereignis: {
      id: 'überstunden-abbau',
      phase: 'abbau',
      beschreibung: 'Der Abbau dauert länger als geplant.',
      reaktionA: {
        label: 'Zusätzliche Kraft engagieren (150€)',
        effekt: { budgetDelta: -150 },
      },
      reaktionB: {
        label: 'Team bleibt länger',
        effekt: { moralDeltaZufälligerTechniker: -5 },
      },
    },
  }
}

/**
 * Prüft alle für die gegebene Phase relevanten Zufallsereignisse einer Show
 * und liefert - falls mindestens eines ausgelöst wurde - zufällig genau eines
 * davon zurück (nie mehrere gleichzeitig). Reaktions-Ereignisse benötigen eine
 * Spielerentscheidung, automatische Ereignisse wenden ihren Effekt sofort an.
 * Ersetzt die frühere `ermittleEreignis` (die keine Phasen kannte).
 */
export function ermittleEreignisFürPhase(
  phase: EreignisPhase,
  anfrage: Anfrage,
  techniker: Techniker[],
  verleiher: Verleiher[],
  venue: Venue
): ErmittelesErgebnis | null {
  const kandidaten: { chance: number; ergebnis: ErmittelesErgebnis }[] = []

  if (phase === 'aufbau') {
    const verleiherVerzögerung = prüfeVerleiherLieferverzögerung(anfrage, techniker, verleiher)
    if (verleiherVerzögerung) {
      kandidaten.push({
        chance: verleiherVerzögerung.chance,
        ergebnis: { typ: 'reaktion', ereignis: verleiherVerzögerung.ereignis },
      })
    }

    const technikerKrank = prüfeTechnikerKrank(anfrage, techniker)
    if (technikerKrank) {
      kandidaten.push({
        chance: technikerKrank.chance,
        ergebnis: { typ: 'reaktion', ereignis: technikerKrank.ereignis },
      })
    }

    const riderÄnderung = prüfeRiderÄnderung(anfrage)
    kandidaten.push({
      chance: riderÄnderung.chance,
      ergebnis: { typ: 'reaktion', ereignis: riderÄnderung.ereignis },
    })

    const eigenbestandDefekt = prüfeEigenbestandDefekt(anfrage, venue)
    if (eigenbestandDefekt) {
      kandidaten.push({
        chance: eigenbestandDefekt.chance,
        ergebnis: { typ: 'reaktion', ereignis: eigenbestandDefekt.ereignis },
      })
    }

    const unerfahrenesPersonal = prüfeUnerfahrenesErsatzpersonal(anfrage, verleiher)
    if (unerfahrenesPersonal) {
      kandidaten.push({
        chance: unerfahrenesPersonal.chance,
        ergebnis: { typ: 'reaktion', ereignis: unerfahrenesPersonal.ereignis },
      })
    }

    const terminverschiebung = prüfeTerminverschiebung(anfrage)
    kandidaten.push({
      chance: terminverschiebung.chance,
      ergebnis: { typ: 'reaktion', ereignis: terminverschiebung.ereignis },
    })

    const parkplatzproblem = prüfeParkplatzproblem()
    kandidaten.push({
      chance: parkplatzproblem.chance,
      ergebnis: { typ: 'reaktion', ereignis: parkplatzproblem.ereignis },
    })
  } else if (phase === 'show') {
    const actUnkompliziert = prüfeActUnkompliziert(anfrage)
    kandidaten.push({ chance: actUnkompliziert.chance, ergebnis: actUnkompliziert.ergebnis })

    const publikumsandrang = prüfePublikumsandrang(anfrage, venue)
    kandidaten.push({ chance: publikumsandrang.chance, ergebnis: publikumsandrang.ergebnis })

    const technischerAusfall = prüfeTechnischerAusfall(anfrage, venue)
    if (technischerAusfall) {
      kandidaten.push({
        chance: technischerAusfall.chance,
        ergebnis: { typ: 'reaktion', ereignis: technischerAusfall.ereignis },
      })
    }

    const sicherheitsvorfall = prüfeSicherheitsvorfall(anfrage)
    kandidaten.push({
      chance: sicherheitsvorfall.chance,
      ergebnis: { typ: 'reaktion', ereignis: sicherheitsvorfall.ereignis },
    })

    const zugabeWunsch = prüfeZugabeWunsch(anfrage)
    kandidaten.push({
      chance: zugabeWunsch.chance,
      ergebnis: { typ: 'reaktion', ereignis: zugabeWunsch.ereignis },
    })
  } else {
    const transportschaden = prüfeTransportschaden()
    kandidaten.push({
      chance: transportschaden.chance,
      ergebnis: { typ: 'reaktion', ereignis: transportschaden.ereignis },
    })

    const verlorenesEquipment = prüfeVerlorenesEquipment()
    kandidaten.push({
      chance: verlorenesEquipment.chance,
      ergebnis: { typ: 'reaktion', ereignis: verlorenesEquipment.ereignis },
    })

    const überstundenAbbau = prüfeÜberstundenAbbau()
    kandidaten.push({
      chance: überstundenAbbau.chance,
      ergebnis: { typ: 'reaktion', ereignis: überstundenAbbau.ereignis },
    })
  }

  const ausgelöste: ErmittelesErgebnis[] = []
  for (const kandidat of kandidaten) {
    if (Math.random() * 100 < kandidat.chance) {
      ausgelöste.push(kandidat.ergebnis)
    }
  }

  if (ausgelöste.length === 0) return null

  return zufälligesElement(ausgelöste)
}
