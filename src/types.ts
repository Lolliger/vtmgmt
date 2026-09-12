export type EquipmentKategorie = 'PA' | 'Licht' | 'Rigging' | 'IEM' | 'Signal'

export interface EquipmentItem {
  id: string
  kategorie: EquipmentKategorie
  name: string
}

export interface Venue {
  name: string
  budget: number
  reputation: number
  equipmentBestand: EquipmentItem[]
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

/** Antrag auf Anschaffung von zusätzlichem Equipment - vom Spieler zu bewilligen/abzulehnen. */
export interface EquipmentAntrag {
  id: string
  kategorie: EquipmentKategorie
  anzahl: number
  anschaffungskosten: number
  beschreibung: string
  produktname: string
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

/** Bewerbung eines potenziellen neuen Technikers - vom Spieler anzunehmen/abzulehnen. */
export interface Bewerbung {
  id: string
  name: string
  rolle: TechnikerRolle
  stufe: TechnikerStufe
  erfahrung: number
  gehaltsforderung: number
  /** Fertig personalisierter Bewerbungstext (keine Platzhalter mehr). */
  bewerbungsschreiben: string
}

/** Kündigungsantrag eines bestehenden Technikers - vom Spieler zu akzeptieren/abzulehnen. */
export interface Kuendigungsantrag {
  id: string
  technikerName: string
  grund: string
}
