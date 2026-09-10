import {
  GENRE_ANFORDERUNGEN,
  erfülltMindeststufe,
  type RollenAnforderung,
} from '@/data/genreAnforderungen'
import type {
  Anfrage,
  EquipmentKategorie,
  Ergebnis,
  Genre,
  Techniker,
  TechnikerRolle,
  Venue,
  Verleiher,
} from '@/types'

const GUT_SCHWELLE = 80

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

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

export interface AuflösungsErgebnis {
  staffingScore: number
  verleiherScore: number
  zufallsfaktor: number
  gesamtpunktzahl: number
  kategorie: Ergebnis
  begründung: string
}

function ermittleBegründung(params: {
  staffingScore: number
  verleiherScore: number
  zufallsfaktor: number
  schwächsteRolle: TechnikerRolle | null
  verleiherName: string | null
}): string {
  const { staffingScore, verleiherScore, zufallsfaktor, schwächsteRolle, verleiherName } =
    params

  const staffingIstSchwach = staffingScore < GUT_SCHWELLE
  const verleiherIstSchwach = verleiherScore < GUT_SCHWELLE

  if (staffingIstSchwach && (staffingScore <= verleiherScore || !verleiherIstSchwach)) {
    return schwächsteRolle
      ? `Techniker ${schwächsteRolle} war für diese Show-Größe zu unerfahren.`
      : 'Das Team war für diese Show-Größe zu unerfahren.'
  }

  if (verleiherIstSchwach) {
    return verleiherName
      ? `Verleiher ${verleiherName} hat nicht zuverlässig geliefert.`
      : 'Ein Verleihpartner hat nicht zuverlässig geliefert.'
  }

  if (zufallsfaktor <= -5) {
    return 'Trotz guter Vorbereitung lief am Showtag etwas schief.'
  }

  return 'Show lief rund, Team hat sauber gearbeitet.'
}

/** Berechnet die Show-Auflösung anhand der gewichteten Punktesumme. */
export function berechneAuflösung(
  anfrage: Anfrage,
  techniker: Techniker[],
  verleiher: Verleiher[]
): AuflösungsErgebnis {
  const rollenEintraege = benötigteRollen(anfrage.genre)

  let summe = 0
  let schwächsteRolle: TechnikerRolle | null = null
  let schwächsterWert = Infinity

  for (const [rolle, anforderung] of rollenEintraege) {
    const zugewiesenerName = anfrage.zugewieseneTechniker[rolle]
    let punkte: number
    if (!zugewiesenerName) {
      punkte = 0
    } else {
      const person = techniker.find((t) => t.name === zugewiesenerName)
      punkte =
        person && erfülltMindeststufe(person.stufe, anforderung.minStufe) ? 100 : 50
    }
    summe += punkte
    if (punkte < schwächsterWert) {
      schwächsterWert = punkte
      schwächsteRolle = rolle
    }
  }

  const staffingScore = rollenEintraege.length > 0 ? summe / rollenEintraege.length : 100

  let verleiherScore = 100
  let verleiherName: string | null = null
  if (anfrage.gewählterVerleiher) {
    const firma = verleiher.find((v) => v.name === anfrage.gewählterVerleiher)
    if (firma) {
      verleiherScore = firma.zuverlässigkeit
      verleiherName = firma.name
    }
  }

  const zufallsfaktor = Math.round(Math.random() * 20 - 10)

  const gesamt = clamp(staffingScore * 0.6 + verleiherScore * 0.4 + zufallsfaktor, 0, 100)

  const kategorie: Ergebnis = gesamt >= 80 ? 'gut' : gesamt >= 50 ? 'mittel' : 'problematisch'

  const begründung = ermittleBegründung({
    staffingScore,
    verleiherScore,
    zufallsfaktor,
    schwächsteRolle,
    verleiherName,
  })

  return {
    staffingScore: Math.round(staffingScore),
    verleiherScore: Math.round(verleiherScore),
    zufallsfaktor,
    gesamtpunktzahl: Math.round(gesamt),
    kategorie,
    begründung,
  }
}

export interface AuswirkungenErgebnis {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  auswirkungen: string[]
}

/** Wendet die Auswirkungen einer Show-Auflösung auf Venue/Techniker/Verleiher an. */
export function berechneAuswirkungen(
  anfrage: Anfrage,
  ergebnis: AuflösungsErgebnis,
  venue: Venue,
  techniker: Techniker[],
  verleiher: Verleiher[]
): AuswirkungenErgebnis {
  const auswirkungen: string[] = []

  const reputationDelta =
    ergebnis.kategorie === 'gut' ? 5 : ergebnis.kategorie === 'mittel' ? 1 : -5
  const neueReputation = clamp(venue.reputation + reputationDelta, 0, 100)
  auswirkungen.push(`Reputation ${formatDelta(reputationDelta)}`)

  const verleihFirma = anfrage.gewählterVerleiher
    ? (verleiher.find((v) => v.name === anfrage.gewählterVerleiher) ?? null)
    : null

  let budgetDelta = anfrage.gage
  auswirkungen.push(`Budget +${formatCurrency(anfrage.gage)} (Gage)`)
  if (verleihFirma) {
    budgetDelta -= verleihFirma.verleihkostenPauschale
    auswirkungen.push(
      `Budget -${formatCurrency(verleihFirma.verleihkostenPauschale)} (Verleih ${verleihFirma.name})`
    )
  }
  const neuesBudget = venue.budget + budgetDelta

  const erfahrungDelta =
    ergebnis.kategorie === 'gut' ? 8 : ergebnis.kategorie === 'mittel' ? 4 : 2
  const eingesetzteNamen = new Set(
    Object.values(anfrage.zugewieseneTechniker).filter((n): n is string => !!n)
  )
  const neueTechniker = techniker.map((t) => {
    if (!eingesetzteNamen.has(t.name)) return t
    const neu = clamp(t.erfahrung + erfahrungDelta, 0, 100)
    auswirkungen.push(`${t.name}: Erfahrung +${erfahrungDelta}`)
    return { ...t, erfahrung: neu }
  })

  let neueVerleiher = verleiher
  if (verleihFirma) {
    const beziehungDelta =
      ergebnis.verleiherScore >= 80 ? 5 : ergebnis.verleiherScore >= 50 ? 0 : -8
    neueVerleiher = verleiher.map((v) => {
      if (v.name !== verleihFirma.name) return v
      const neu = clamp(v.beziehung + beziehungDelta, 0, 100)
      return { ...v, beziehung: neu }
    })
    auswirkungen.push(`${verleihFirma.name}: Beziehung ${formatDelta(beziehungDelta)}`)
  }

  return {
    venue: { ...venue, reputation: neueReputation, budget: neuesBudget },
    techniker: neueTechniker,
    verleiher: neueVerleiher,
    auswirkungen,
  }
}
