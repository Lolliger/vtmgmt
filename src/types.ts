export type EquipmentKategorie = 'PA' | 'Licht' | 'Rigging' | 'IEM'

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
  gewählterVerleiher: string | null
  ergebnis: Ergebnis | null
}
