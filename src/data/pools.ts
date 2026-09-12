import type {
  Bewerbung,
  EquipmentAntrag,
  EquipmentKategorie,
  TechnikerRolle,
  TechnikerStufe,
} from '@/types'

/**
 * Zufallspools für die tägliche Generierung neuer Bewerbungen und
 * Equipment-Anträge (siehe GameContext, Tages-Transition in TICK).
 */

export const VORNAMEN: string[] = [
  'Anna',
  'Paul',
  'Lea',
  'Jonas',
  'Mira',
  'Felix',
  'Nina',
  'Tom',
  'Katja',
  'Ben',
  'Sophie',
  'Lukas',
  'Marie',
  'David',
  'Julia',
]

export const NACHNAMEN: string[] = [
  'Schuster',
  'Krüger',
  'Winter',
  'Weber',
  'Keller',
  'Bauer',
  'Vogel',
  'Adler',
  'Richter',
  'Hoffmann',
  'Lang',
  'Brandt',
  'Fischer',
  'Wolf',
  'Neumann',
]

export const EQUIPMENT_ANTRAG_VORLAGEN: {
  kategorie: EquipmentKategorie
  anzahl: number
  anschaffungskosten: number
  beschreibung: string
  produktname: string
}[] = [
  {
    kategorie: 'PA',
    anzahl: 2,
    anschaffungskosten: 2600,
    beschreibung: '2x L-Acoustics A15 Frontfill für gleichmäßigere Beschallung vorne',
    produktname: 'L-Acoustics A15 Frontfill',
  },
  {
    kategorie: 'PA',
    anzahl: 1,
    anschaffungskosten: 1800,
    beschreibung: '1x L-Acoustics X12 Bühnenmonitor als Ersatz für ein defektes Modell',
    produktname: 'L-Acoustics X12 Bühnenmonitor',
  },
  {
    kategorie: 'Licht',
    anzahl: 1,
    anschaffungskosten: 2200,
    beschreibung: '1x Clay Paky Sharpy Moving Head für mehr Effektlicht',
    produktname: 'Clay Paky Sharpy Moving Head',
  },
  {
    kategorie: 'Licht',
    anzahl: 2,
    anschaffungskosten: 1600,
    beschreibung: '2x Chauvet Rogue R2 Wash für flächigere Bühnenausleuchtung',
    produktname: 'Chauvet Rogue R2 Wash',
  },
  {
    kategorie: 'Rigging',
    anzahl: 1,
    anschaffungskosten: 700,
    beschreibung: '1x 2-Punkt-Traverse, 3m für kleinere Bühnenaufbauten',
    produktname: '2-Punkt-Traverse, 3m',
  },
  {
    kategorie: 'Rigging',
    anzahl: 1,
    anschaffungskosten: 1100,
    beschreibung: '1x 3-Punkt-Traverse, 4m als zusätzliche Reserve',
    produktname: '3-Punkt-Traverse, 4m',
  },
  {
    kategorie: 'IEM',
    anzahl: 4,
    anschaffungskosten: 2400,
    beschreibung: '4x Shure PSM1000 IEM-Set für mehr Monitoring-Kapazität',
    produktname: 'Shure PSM1000 IEM-Set',
  },
  {
    kategorie: 'IEM',
    anzahl: 2,
    anschaffungskosten: 1000,
    beschreibung: '2x Sennheiser EW IEM G4 Set als Ersatz für ältere Geräte',
    produktname: 'Sennheiser EW IEM G4 Set',
  },
  {
    kategorie: 'Signal',
    anzahl: 1,
    anschaffungskosten: 3500,
    beschreibung: '1x DiGiCo SD9 Stagebox für mehr Kanäle bei großen Produktionen',
    produktname: 'DiGiCo SD9 Stagebox',
  },
  {
    kategorie: 'Signal',
    anzahl: 2,
    anschaffungskosten: 900,
    beschreibung: '2x Klotz Multicore 32-Kanal für flexiblere Signalführung',
    produktname: 'Klotz Multicore 32-Kanal',
  },
]

export const BEWERBUNGSSCHREIBEN_VORLAGEN: string[] = [
  'Seit Jahren arbeite ich als {rolle} auf Konzerten und Festivals und möchte den nächsten Schritt als {stufe} gehen. Ich bringe Erfahrung im Umgang mit anspruchsvollen Produktionen mit und freue mich auf die Zusammenarbeit mit eurem Team.',
  'Ich habe meine Ausbildung im Bereich Veranstaltungstechnik abgeschlossen und suche als {stufe} im Bereich {rolle} eine Stelle, an der ich mich weiterentwickeln kann. Ich bin belastbar, lernbereit und flexibel einsetzbar.',
  'Mit mehrjähriger Erfahrung im Bereich {rolle} bewerbe ich mich um eine Position als {stufe} in eurem Haus. Mir ist sauberes, ruhiges Arbeiten auch unter Zeitdruck wichtig, ebenso wie ein gutes Verhältnis zu Acts und Kolleginnen.',
  'Nach mehreren Jahren als Freelancer im Bereich {rolle} möchte ich mich fest als {stufe} in einer Venue einbringen. Ich kenne die Abläufe rund um Auf- und Abbau, Soundcheck und Show gut und bin an einer langfristigen Zusammenarbeit interessiert.',
  'Ich bin {stufe} im Bereich {rolle} und auf der Suche nach einer neuen Herausforderung in einer etablierten Venue. Teamarbeit und ein offener Umgang mit Problemen während der Show sind mir besonders wichtig.',
]

/** Kombiniert einen zufälligen Vor- und Nachnamen. */
function zufälligerName(): string {
  const vorname = VORNAMEN[Math.floor(Math.random() * VORNAMEN.length)]
  const nachname = NACHNAMEN[Math.floor(Math.random() * NACHNAMEN.length)]
  return `${vorname} ${nachname}`
}

const TECHNIKER_ROLLEN: TechnikerRolle[] = ['FOH', 'Monitor', 'Licht', 'Rigging']

/**
 * Gewichtete Zufallsauswahl der Bewerber-Stufe. "stellv. technische Leitung"
 * ist bewusst ausgeschlossen - diese Stufe wird nur intern befördert, nie
 * beworben.
 */
function zufälligeBewerberStufe(): TechnikerStufe {
  const zufall = Math.random() * 100
  if (zufall < 50) return 'Trainee'
  if (zufall < 80) return 'Techniker'
  if (zufall < 95) return 'Senior'
  return 'Abteilungsleitung'
}

/** Ganzzahliger Zufallswert zwischen min und max (inklusive). */
function zufallZwischen(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

function erfahrungFürStufe(stufe: TechnikerStufe): number {
  switch (stufe) {
    case 'Trainee':
      return zufallZwischen(5, 20)
    case 'Techniker':
      return zufallZwischen(25, 45)
    case 'Senior':
      return zufallZwischen(55, 75)
    case 'Abteilungsleitung':
      return zufallZwischen(75, 90)
    case 'stellv. technische Leitung':
      return zufallZwischen(85, 95)
  }
}

function basisGehaltFürStufe(stufe: TechnikerStufe): number {
  switch (stufe) {
    case 'Trainee':
      return 400
    case 'Techniker':
      return 650
    case 'Senior':
      return 900
    case 'Abteilungsleitung':
      return 1200
    case 'stellv. technische Leitung':
      return 1500
  }
}

/** Erzeugt eine zufällige, plausible Bewerbung mit personalisiertem Anschreiben. */
export function generiereZufälligeBewerbung(): Bewerbung {
  const rolle = TECHNIKER_ROLLEN[Math.floor(Math.random() * TECHNIKER_ROLLEN.length)]
  const stufe = zufälligeBewerberStufe()
  const erfahrung = erfahrungFürStufe(stufe)
  const gehaltsforderung = basisGehaltFürStufe(stufe) + zufallZwischen(-50, 100)
  const vorlage =
    BEWERBUNGSSCHREIBEN_VORLAGEN[Math.floor(Math.random() * BEWERBUNGSSCHREIBEN_VORLAGEN.length)]
  const bewerbungsschreiben = vorlage.replaceAll('{rolle}', rolle).replaceAll('{stufe}', stufe)

  return {
    id: `bewerbung-${Date.now()}-${Math.random()}`,
    name: zufälligerName(),
    rolle,
    stufe,
    erfahrung,
    gehaltsforderung,
    bewerbungsschreiben,
  }
}

/** Erzeugt einen zufälligen Equipment-Antrag aus den Vorlagen. */
export function generiereZufälligenEquipmentAntrag(): EquipmentAntrag {
  const vorlage =
    EQUIPMENT_ANTRAG_VORLAGEN[Math.floor(Math.random() * EQUIPMENT_ANTRAG_VORLAGEN.length)]
  return {
    id: `equipment-antrag-${Date.now()}-${Math.random()}`,
    kategorie: vorlage.kategorie,
    anzahl: vorlage.anzahl,
    anschaffungskosten: vorlage.anschaffungskosten,
    beschreibung: vorlage.beschreibung,
    produktname: vorlage.produktname,
  }
}
