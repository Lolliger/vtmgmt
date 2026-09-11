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
 * Baut die einzelnen Equipment-Items einer Kategorie aus parallelen Namens-
 * und Zustands-Listen. Zustände sind feste Werte (kein Math.random()), damit
 * Dummy-Daten deterministisch bleiben.
 */
function baueEquipmentItems(
  kategorie: EquipmentKategorie,
  namen: string[],
  zustände: number[]
): EquipmentItem[] {
  return namen.map((name, i) => ({
    id: `${kategorie.toLowerCase()}-${i + 1}`,
    kategorie,
    name,
    zustand: zustände[i],
  }))
}

export const equipmentBestand: EquipmentItem[] = [
  ...baueEquipmentItems(
    'PA',
    [
      'PA-Stack Links',
      'PA-Stack Rechts',
      'Subwoofer 1',
      'Subwoofer 2',
      'Subwoofer 3',
      'Subwoofer 4',
    ],
    [92, 90, 78, 78, 65, 60]
  ),
  ...baueEquipmentItems(
    'Licht',
    ['Moving Head 1', 'Moving Head 2', 'Moving Head 3', 'PAR-Scheinwerfer 1', 'PAR-Scheinwerfer 2'],
    [85, 82, 70, 95, 88]
  ),
  ...baueEquipmentItems('Rigging', ['Traverse 1', 'Traverse 2', 'Traverse 3'], [90, 75, 68]),
  ...baueEquipmentItems(
    'IEM',
    [
      'IEM-Set 1',
      'IEM-Set 2',
      'IEM-Set 3',
      'IEM-Set 4',
      'IEM-Set 5',
      'IEM-Set 6',
      'IEM-Set 7',
      'IEM-Set 8',
    ],
    [88, 88, 80, 80, 72, 72, 60, 55]
  ),
  ...baueEquipmentItems(
    'Signal',
    ['Stagebox', 'Mischpult-Patch', 'Multicore 1', 'Multicore 2', 'Multicore 3', 'Multicore 4'],
    [95, 90, 80, 80, 70, 62]
  ),
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
    beschreibung: '2 zusätzliche PA-Subwoofer für größere Shows',
  },
  {
    id: 'antrag-2',
    kategorie: 'Rigging',
    anzahl: 1,
    anschaffungskosten: 900,
    beschreibung: '1 Ersatz-Rigging-Traverse',
  },
  {
    id: 'antrag-3',
    kategorie: 'IEM',
    anzahl: 3,
    anschaffungskosten: 1500,
    beschreibung: '3 neue IEM-Sets (aktuelle sind veraltet)',
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
  },
  {
    id: 'bewerbung-2',
    name: 'Paul Krüger',
    rolle: 'Licht',
    stufe: 'Techniker',
    erfahrung: 30,
    gehaltsforderung: 650,
  },
  {
    id: 'bewerbung-3',
    name: 'Lea Winter',
    rolle: 'Monitor',
    stufe: 'Senior',
    erfahrung: 55,
    gehaltsforderung: 950,
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
    termin: '2026-10-17',
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
    termin: '2026-10-24',
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
    termin: '2026-10-19',
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
    termin: '2026-10-26',
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
    termin: '2026-10-21',
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
    termin: '2026-10-31',
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
    termin: '2026-10-28',
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
