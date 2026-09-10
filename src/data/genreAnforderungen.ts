import type {
  EquipmentKategorie,
  Genre,
  TechnikerRolle,
  TechnikerStufe,
} from '@/types'

export type Schwierigkeit = 'niedrig' | 'mittel' | 'hoch'

export interface RollenAnforderung {
  schwierigkeit: Schwierigkeit
  minStufe: TechnikerStufe
  equipmentBedarf?: Partial<Record<EquipmentKategorie, number>>
}

export const GENRE_ANFORDERUNGEN: Record<
  Genre,
  { rollen: Partial<Record<TechnikerRolle, RollenAnforderung>> }
> = {
  'Metal/Rock': {
    rollen: {
      FOH: { schwierigkeit: 'hoch', minStufe: 'Senior', equipmentBedarf: { PA: 5 } },
      Monitor: {
        schwierigkeit: 'hoch',
        minStufe: 'Senior',
        equipmentBedarf: { IEM: 10 },
      },
      Licht: {
        schwierigkeit: 'mittel',
        minStufe: 'Techniker',
        equipmentBedarf: { Licht: 4 },
      },
      Rigging: {
        schwierigkeit: 'mittel',
        minStufe: 'Techniker',
        equipmentBedarf: { Rigging: 3 },
      },
    },
  },
  'Pop/Electronic': {
    rollen: {
      FOH: {
        schwierigkeit: 'mittel',
        minStufe: 'Techniker',
        equipmentBedarf: { PA: 6 },
      },
      Monitor: {
        schwierigkeit: 'mittel',
        minStufe: 'Techniker',
        equipmentBedarf: { IEM: 6 },
      },
      Licht: {
        schwierigkeit: 'hoch',
        minStufe: 'Senior',
        equipmentBedarf: { Licht: 8 },
      },
      Rigging: {
        schwierigkeit: 'niedrig',
        minStufe: 'Trainee',
        equipmentBedarf: { Rigging: 1 },
      },
    },
  },
  Akustik: {
    rollen: {
      FOH: {
        schwierigkeit: 'niedrig',
        minStufe: 'Trainee',
        equipmentBedarf: { PA: 2 },
      },
      Monitor: {
        schwierigkeit: 'niedrig',
        minStufe: 'Trainee',
        equipmentBedarf: { IEM: 2 },
      },
      Licht: {
        schwierigkeit: 'niedrig',
        minStufe: 'Trainee',
        equipmentBedarf: { Licht: 2 },
      },
    },
  },
  'Hip-Hop/Rap': {
    rollen: {
      FOH: { schwierigkeit: 'hoch', minStufe: 'Senior', equipmentBedarf: { PA: 7 } },
      Monitor: {
        schwierigkeit: 'mittel',
        minStufe: 'Techniker',
        equipmentBedarf: { IEM: 5 },
      },
      Licht: {
        schwierigkeit: 'mittel',
        minStufe: 'Techniker',
        equipmentBedarf: { Licht: 4 },
      },
      Rigging: {
        schwierigkeit: 'niedrig',
        minStufe: 'Trainee',
        equipmentBedarf: { Rigging: 1 },
      },
    },
  },
}

/** Rangfolge der Stufen, niedrig → hoch. Höherer Wert = höhere Stufe. */
export const STUFE_RANG: Record<TechnikerStufe, number> = {
  Trainee: 0,
  Techniker: 1,
  Senior: 2,
  Abteilungsleitung: 3,
  'stellv. technische Leitung': 4,
}

/** Prüft, ob eine Techniker-Stufe eine geforderte Mindeststufe erfüllt. */
export function erfülltMindeststufe(
  stufe: TechnikerStufe,
  minStufe: TechnikerStufe
): boolean {
  return STUFE_RANG[stufe] >= STUFE_RANG[minStufe]
}
