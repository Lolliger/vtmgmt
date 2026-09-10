export interface Venue {
  name: string
  budget: number
  reputation: number
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
}

export type Preisniveau = 'günstig' | 'mittel' | 'premium'

export interface Verleiher {
  name: string
  preisniveau: Preisniveau
}

export interface Anfrage {
  act: string
  termin: string
  erwarteteBesucherzahl: number
}
