import { GENRE_ANFORDERUNGEN, type RollenAnforderung } from '@/data/genreAnforderungen'
import type { EquipmentKategorie, Genre, TechnikerRolle } from '@/types'

/** Liefert die für ein Genre benötigten Rollen samt Anforderung. */
export function benötigteRollen(
  genre: Genre
): [TechnikerRolle, RollenAnforderung][] {
  return Object.entries(GENRE_ANFORDERUNGEN[genre].rollen) as [
    TechnikerRolle,
    RollenAnforderung,
  ][]
}

export interface EquipmentLücke {
  kategorie: EquipmentKategorie
  bedarf: number
  bestand: number
}

/** Prüft, ob eine Rolle für ein Genre eine Equipment-Lücke gegenüber dem Venue-Bestand hat. */
export function ermittleEquipmentLücke(
  rolle: TechnikerRolle,
  genre: Genre,
  equipmentBestand: Record<EquipmentKategorie, number>
): EquipmentLücke | null {
  const anforderung = GENRE_ANFORDERUNGEN[genre].rollen[rolle]
  if (!anforderung?.equipmentBedarf) return null
  for (const [kategorie, bedarf] of Object.entries(anforderung.equipmentBedarf) as [
    EquipmentKategorie,
    number,
  ][]) {
    const bestand = equipmentBestand[kategorie]
    if (bedarf !== undefined && bedarf > bestand) {
      return { kategorie, bedarf, bestand }
    }
  }
  return null
}

/** Prüft, ob die Show irgendeine Equipment-Lücke hat (Verleiher-Auswahl dann nötig). */
export function hatEquipmentLücke(
  genre: Genre,
  equipmentBestand: Record<EquipmentKategorie, number>
): boolean {
  return benötigteRollen(genre).some(
    ([rolle]) => ermittleEquipmentLücke(rolle, genre, equipmentBestand) !== null
  )
}
