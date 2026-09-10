import type { Anfrage, Techniker, Venue, Verleiher } from '@/types'

export const venue: Venue = {
  name: 'Halle 9',
  budget: 48200,
  reputation: 62,
}

export const techniker: Techniker[] = [
  { name: 'Jonas Weber', rolle: 'FOH', stufe: 'Senior' },
  { name: 'Mira Keller', rolle: 'Licht', stufe: 'Techniker' },
  { name: 'Tom Adler', rolle: 'Rigging', stufe: 'Trainee' },
]

export const verleiher: Verleiher[] = [
  { name: 'Nordlicht Rental', preisniveau: 'premium' },
  { name: 'StageTech Süd', preisniveau: 'günstig' },
]

export const anfragen: Anfrage[] = [
  {
    act: 'Kollektiv Nova',
    termin: '2026-10-17',
    erwarteteBesucherzahl: 850,
  },
]
