import type { Anfrage, Techniker, Venue, Verleiher } from '@/types'

export const venue: Venue = {
  name: 'Halle 9',
  budget: 48200,
  reputation: 62,
  equipmentBestand: { PA: 6, Licht: 5, Rigging: 3, IEM: 8 },
}

export const techniker: Techniker[] = [
  { name: 'Jonas Weber', rolle: 'FOH', stufe: 'Senior', erfahrung: 65, verfügbar: true },
  { name: 'Lukas Brandt', rolle: 'FOH', stufe: 'Techniker', erfahrung: 35, verfügbar: true },
  { name: 'Sophie Lang', rolle: 'Monitor', stufe: 'Senior', erfahrung: 60, verfügbar: true },
  { name: 'Ben Hoffmann', rolle: 'Monitor', stufe: 'Trainee', erfahrung: 15, verfügbar: true },
  { name: 'Mira Keller', rolle: 'Licht', stufe: 'Techniker', erfahrung: 40, verfügbar: true },
  { name: 'Nina Vogel', rolle: 'Licht', stufe: 'Senior', erfahrung: 70, verfügbar: true },
  { name: 'Tom Adler', rolle: 'Rigging', stufe: 'Trainee', erfahrung: 10, verfügbar: true },
  {
    name: 'Felix Bauer',
    rolle: 'Rigging',
    stufe: 'Abteilungsleitung',
    erfahrung: 85,
    verfügbar: true,
  },
  {
    name: 'Katja Richter',
    rolle: 'FOH',
    stufe: 'stellv. technische Leitung',
    erfahrung: 90,
    verfügbar: true,
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
    gewählterVerleiher: null,
    ergebnis: null,
  },
]
