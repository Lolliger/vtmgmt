export type EquipmentKategorie = 'PA' | 'Licht' | 'Rigging' | 'IEM' | 'Signal'

export interface Venue {
  name: string
  budget: number
  reputation: number
  equipmentBestand: Record<EquipmentKategorie, number>
}

export type TechnikerRolle = 'FOH' | 'Monitor' | 'Licht' | 'Rigging'

export type TechnikerStufe =
  | 'Trainee'
  | 'Techniker'
  | 'Senior'
  | 'Abteilungsleitung'
  | 'stellv. technische Leitung'

export interface Techniker {
  name: string
  rolle: TechnikerRolle
  stufe: TechnikerStufe
  erfahrung: number
  verfügbar: boolean
  /** Wöchentliche Stunden-Kapazität. */
  wochenstunden: number
  /** Bereits verplante Stunden diese Woche, unabhängig von der aktuell betrachteten Show. */
  verplanteStunden: number
  /** Moral/Zustand, Skala 0-100. */
  moral: number
  /** Wöchentliches Gehalt in Euro, abhängig von Stufe. */
  gehalt: number
}

export type Preisniveau = 'günstig' | 'mittel' | 'premium'

export interface Verleiher {
  name: string
  preisniveau: Preisniveau
  zuverlässigkeit: number
  beziehung: number
  verleihkostenPauschale: number
}

export type Genre = 'Metal/Rock' | 'Pop/Electronic' | 'Akustik' | 'Hip-Hop/Rap'

export type AnfrageStatus = 'offen' | 'angenommen' | 'abgelehnt' | 'aufgelöst'

export type Ergebnis = 'gut' | 'mittel' | 'problematisch'

export interface Anfrage {
  act: string
  termin: string
  erwarteteBesucherzahl: number
  genre: Genre
  gage: number
  status: AnfrageStatus
  zugewieseneTechniker: Record<TechnikerRolle, string | null>
  gewählteVerleiherProKategorie: Partial<Record<EquipmentKategorie, string | null>>
  ergebnis: Ergebnis | null
  /** Hält fest, für welche zugewiesene Rolle der Techniker in Überstunden arbeitet. */
  überstundenProRolle: Partial<Record<TechnikerRolle, boolean>>
}
