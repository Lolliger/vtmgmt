import type {
  Anfrage,
  Bewerbung,
  EquipmentAntrag,
  EquipmentItem,
  EquipmentKategorie,
  Kuendigungsantrag,
  Techniker,
  Venue,
  Verleiher,
} from '@/types'

/**
 * Baut die einzelnen Equipment-Items einer Kategorie aus einer Namensliste.
 */
function baueEquipmentItems(kategorie: EquipmentKategorie, namen: string[]): EquipmentItem[] {
  return namen.map((name, i) => ({
    id: `${kategorie.toLowerCase()}-${i + 1}`,
    kategorie,
    name,
  }))
}

export const equipmentBestand: EquipmentItem[] = [
  ...baueEquipmentItems('PA', [
    'L-Acoustics K2 (Links)',
    'L-Acoustics K2 (Rechts)',
    'L-Acoustics KS28 #1',
    'L-Acoustics KS28 #2',
    'L-Acoustics LA12X (Verstärker)',
    'L-Acoustics X12 (Bühnenmonitor)',
  ]),
  ...baueEquipmentItems('Licht', [
    'Clay Paky Sharpy #1',
    'Clay Paky Sharpy #2',
    'Clay Paky Sharpy Wash',
    'Clay Paky Mythos',
    'ETC Source Four PAR',
  ]),
  ...baueEquipmentItems('Rigging', [
    '3-Punkt-Traverse, 4m',
    '4-Punkt-Traverse, 6m',
    '2-Punkt-Traverse, 3m',
  ]),
  ...baueEquipmentItems('IEM', [
    'Shure PSM1000 IEM-Set 1',
    'Shure PSM1000 IEM-Set 2',
    'Shure PSM1000 IEM-Set 3',
    'Shure PSM1000 IEM-Set 4',
    'Sennheiser EW IEM G4 Set 1',
    'Sennheiser EW IEM G4 Set 2',
    'Sennheiser EW IEM G4 Set 3',
    'Sennheiser EW IEM G4 Set 4',
  ]),
  ...baueEquipmentItems('Processing', [
    'Allen & Heath dLive S5000 (FOH-Digitalpult)',
    'Allen & Heath DM48 #1',
    'Allen & Heath DM48 #2',
    'Klotz Multicore 24-Kanal',
    'Klotz Multicore 32-Kanal',
    'Neutrik Patchbay',
  ]),
]

export const venue: Venue = {
  name: 'Halle 9',
  budget: 48200,
  reputation: 62,
  equipmentBestand,
}

export const equipmentAntraege: EquipmentAntrag[] = [
  {
    id: 'antrag-1',
    kategorie: 'PA',
    anzahl: 2,
    anschaffungskosten: 3200,
    beschreibung: '2x L-Acoustics KS28 für mehr Bass bei größeren Shows',
    produktname: 'L-Acoustics KS28',
  },
  {
    id: 'antrag-2',
    kategorie: 'Rigging',
    anzahl: 1,
    anschaffungskosten: 900,
    beschreibung: '1x zusätzliche 4-Punkt-Traverse, 6m',
    produktname: '4-Punkt-Traverse, 6m',
  },
  {
    id: 'antrag-3',
    kategorie: 'IEM',
    anzahl: 3,
    anschaffungskosten: 1500,
    beschreibung: '3x Sennheiser EW IEM G4 Sets (aktuelle sind veraltet)',
    produktname: 'Sennheiser EW IEM G4 Set',
  },
]

export const bewerbungen: Bewerbung[] = [
  {
    id: 'bewerbung-1',
    name: 'Anna Schuster',
    rolle: 'FOH',
    stufe: 'Trainee',
    erfahrung: 5,
    gehaltsforderung: 400,
    bewerbungsschreiben:
      'Ich habe gerade meine Ausbildung im Bereich Veranstaltungstechnik abgeschlossen und möchte als Trainee im Bereich FOH erste praktische Erfahrung in einer echten Venue sammeln. Ich bin lernbereit und flexibel einsetzbar.',
  },
  {
    id: 'bewerbung-2',
    name: 'Paul Krüger',
    rolle: 'Licht',
    stufe: 'Techniker',
    erfahrung: 30,
    gehaltsforderung: 650,
    bewerbungsschreiben:
      'Seit Jahren arbeite ich als Licht auf Konzerten und Festivals und möchte den nächsten Schritt als Techniker gehen. Ich bringe Erfahrung im Umgang mit anspruchsvollen Produktionen mit und freue mich auf die Zusammenarbeit mit eurem Team.',
  },
  {
    id: 'bewerbung-3',
    name: 'Lea Winter',
    rolle: 'Monitor',
    stufe: 'Senior',
    erfahrung: 55,
    gehaltsforderung: 950,
    bewerbungsschreiben:
      'Mit über sechs Jahren Erfahrung im Bereich Monitor auf großen Bühnen bewerbe ich mich um die Position als Senior in eurem Haus. Ich lege großen Wert auf sauberes Arbeiten unter Zeitdruck und ein gutes Verhältnis zu Acts und Kolleginnen.',
  },
]

export const kuendigungsantraege: Kuendigungsantrag[] = [
  {
    id: 'kuendigung-1',
    technikerName: 'Tom Adler',
    grund: 'Unzufrieden mit dem Gehalt',
  },
]

export const techniker: Techniker[] = [
  {
    name: 'Jonas Weber',
    rolle: 'FOH',
    stufe: 'Senior',
    erfahrung: 65,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 36,
    moral: 70,
    gehalt: 900,
  },
  {
    name: 'Lukas Brandt',
    rolle: 'FOH',
    stufe: 'Techniker',
    erfahrung: 35,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 10,
    moral: 70,
    gehalt: 650,
  },
  {
    name: 'Sophie Lang',
    rolle: 'Monitor',
    stufe: 'Senior',
    erfahrung: 60,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 34,
    moral: 70,
    gehalt: 900,
  },
  {
    name: 'Ben Hoffmann',
    rolle: 'Monitor',
    stufe: 'Trainee',
    erfahrung: 15,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 8,
    moral: 70,
    gehalt: 400,
  },
  {
    name: 'Mira Keller',
    rolle: 'Licht',
    stufe: 'Techniker',
    erfahrung: 40,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 15,
    moral: 70,
    gehalt: 650,
  },
  {
    name: 'Nina Vogel',
    rolle: 'Licht',
    stufe: 'Senior',
    erfahrung: 70,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 38,
    moral: 70,
    gehalt: 900,
  },
  {
    name: 'Tom Adler',
    rolle: 'Rigging',
    stufe: 'Trainee',
    erfahrung: 10,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 5,
    moral: 70,
    gehalt: 400,
  },
  {
    name: 'Felix Bauer',
    rolle: 'Rigging',
    stufe: 'Abteilungsleitung',
    erfahrung: 85,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 12,
    moral: 70,
    gehalt: 1200,
  },
  {
    name: 'Katja Richter',
    rolle: 'FOH',
    stufe: 'stellv. technische Leitung',
    erfahrung: 90,
    verfügbar: true,
    wochenstunden: 40,
    verplanteStunden: 20,
    moral: 70,
    gehalt: 1500,
  },
]

export const verleiher: Verleiher[] = [
  {
    name: 'Nordlicht Rental',
    preisniveau: 'premium',
    zuverlässigkeit: 90,
    beziehung: 60,
    verleihkostenPauschale: 2500,
  },
  {
    name: 'MediaTech Rhein',
    preisniveau: 'mittel',
    zuverlässigkeit: 75,
    beziehung: 55,
    verleihkostenPauschale: 1500,
  },
  {
    name: 'StageTech Süd',
    preisniveau: 'günstig',
    zuverlässigkeit: 55,
    beziehung: 50,
    verleihkostenPauschale: 800,
  },
]

export const anfragen: Anfrage[] = [
  {
    act: 'Kollektiv Nova',
    erwarteteBesucherzahl: 850,
    genre: 'Pop/Electronic',
    gage: 4200,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
  {
    act: 'Stahlfront',
    erwarteteBesucherzahl: 600,
    genre: 'Metal/Rock',
    gage: 5200,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
  {
    act: 'Mona & die Feingeister',
    erwarteteBesucherzahl: 250,
    genre: 'Akustik',
    gage: 1800,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
  {
    act: 'Bassrepublik',
    erwarteteBesucherzahl: 900,
    genre: 'Hip-Hop/Rap',
    gage: 4800,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
  {
    act: 'Sonnenkreis Trio',
    erwarteteBesucherzahl: 180,
    genre: 'Akustik',
    gage: 1400,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
  {
    act: 'Nordklang Festival Showcase',
    erwarteteBesucherzahl: 1400,
    genre: 'Pop/Electronic',
    gage: 7500,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
  {
    act: 'Riot Parade',
    erwarteteBesucherzahl: 750,
    genre: 'Metal/Rock',
    gage: 5800,
    status: 'offen',
    zugewieseneTechniker: { FOH: null, Monitor: null, Licht: null, Rigging: null },
    gewählteVerleiherProKategorie: {},
    ergebnis: null,
    überstundenProRolle: {},
  },
]
