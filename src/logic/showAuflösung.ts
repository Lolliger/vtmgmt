import {
  GENRE_ANFORDERUNGEN,
  STUFE_RANG,
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

/**
 * Schätzt die Gesamtdauer einer Show in Stunden (Aufbau + Show + Abbau).
 * Basis: 9h (4h Aufbau + 3h Show + 2h Abbau), +1h je angefangene 500
 * Besucher über 500.
 */
export function geschätzteShowStunden(anfrage: Anfrage): number {
  return 9 + Math.ceil(Math.max(0, anfrage.erwarteteBesucherzahl - 500) / 500)
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

export interface EquipmentBedarfEintrag {
  kategorie: EquipmentKategorie
  bedarf: number
  bestand: number
  gedeckt: number
  lücke: number
}

/**
 * Liefert alle für ein Genre relevanten Equipment-Kategorien mit summiertem Bedarf
 * über alle benötigten Rollen dieses Genres (Bedarfe mehrerer Rollen in derselben
 * Kategorie werden addiert).
 */
export function ermittleAlleEquipmentBedarfe(
  genre: Genre,
  equipmentBestand: Record<EquipmentKategorie, number>
): EquipmentBedarfEintrag[] {
  const bedarfProKategorie = new Map<EquipmentKategorie, number>()

  for (const [, anforderung] of benötigteRollen(genre)) {
    if (!anforderung.equipmentBedarf) continue
    for (const [kategorie, bedarf] of Object.entries(anforderung.equipmentBedarf) as [
      EquipmentKategorie,
      number,
    ][]) {
      if (bedarf === undefined) continue
      bedarfProKategorie.set(kategorie, (bedarfProKategorie.get(kategorie) ?? 0) + bedarf)
    }
  }

  return Array.from(bedarfProKategorie.entries()).map(([kategorie, bedarf]) => {
    const bestand = equipmentBestand[kategorie]
    return {
      kategorie,
      bedarf,
      bestand,
      gedeckt: Math.min(bedarf, bestand),
      lücke: Math.max(0, bedarf - bestand),
    }
  })
}

/** Gewichtung der Equipment-Kategorien für den Equipment-Score. */
export const EQUIPMENT_KATEGORIE_GEWICHT: Record<EquipmentKategorie, number> = {
  PA: 1.5,
  Signal: 1.5,
  Rigging: 1.25,
  Licht: 1.0,
  IEM: 1.0,
}

export interface AuflösungsErgebnis {
  staffingScore: number
  equipmentScore: number
  zufallsfaktor: number
  gesamtpunktzahl: number
  kategorie: Ergebnis
  begründung: string
}

function ermittleBegründung(params: {
  staffingScore: number
  equipmentScore: number
  zufallsfaktor: number
  schwächsteRolle: TechnikerRolle | null
  schwächsteEquipmentKategorie: EquipmentKategorie | null
  schwächsterVerleiherName: string | null
}): string {
  const {
    staffingScore,
    equipmentScore,
    zufallsfaktor,
    schwächsteRolle,
    schwächsteEquipmentKategorie,
    schwächsterVerleiherName,
  } = params

  const staffingIstSchwach = staffingScore < GUT_SCHWELLE
  const equipmentIstSchwach = equipmentScore < GUT_SCHWELLE

  if (staffingIstSchwach && (staffingScore <= equipmentScore || !equipmentIstSchwach)) {
    return schwächsteRolle
      ? `Techniker ${schwächsteRolle} war für diese Show-Größe zu unerfahren.`
      : 'Das Team war für diese Show-Größe zu unerfahren.'
  }

  if (equipmentIstSchwach) {
    return schwächsteEquipmentKategorie && schwächsterVerleiherName
      ? `Verleiher ${schwächsterVerleiherName} hat beim ${schwächsteEquipmentKategorie}-Equipment nicht zuverlässig geliefert.`
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
  verleiher: Verleiher[],
  venue: Venue
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
      if (!person) {
        punkte = 0
      } else {
        const delta = STUFE_RANG[person.stufe] - STUFE_RANG[anforderung.minStufe]
        if (delta <= -3) punkte = 0
        else if (delta === -2) punkte = 15
        else if (delta === -1) punkte = 45
        else if (delta === 0) punkte = 80
        else if (delta === 1) punkte = 90
        else punkte = 100
      }
    }
    summe += punkte
    if (punkte < schwächsterWert) {
      schwächsterWert = punkte
      schwächsteRolle = rolle
    }
  }

  const staffingScore = rollenEintraege.length > 0 ? summe / rollenEintraege.length : 100

  const equipmentBedarfe = ermittleAlleEquipmentBedarfe(anfrage.genre, venue.equipmentBestand)

  let gewichteteSumme = 0
  let gewichtSumme = 0
  let schwächsteEquipmentKategorie: EquipmentKategorie | null = null
  let schwächsterVerleiherName: string | null = null
  let schwächsterEquipmentScore = Infinity

  for (const eintrag of equipmentBedarfe) {
    const gewicht = EQUIPMENT_KATEGORIE_GEWICHT[eintrag.kategorie]
    let score: number
    let verleiherName: string | null = null

    if (eintrag.lücke <= 0) {
      score = 100
    } else {
      const gewählterName = anfrage.gewählteVerleiherProKategorie[eintrag.kategorie]
      const firma = gewählterName ? verleiher.find((v) => v.name === gewählterName) : undefined
      if (firma) {
        score = firma.zuverlässigkeit
        verleiherName = firma.name
      } else {
        score = 0
      }

      if (score < schwächsterEquipmentScore) {
        schwächsterEquipmentScore = score
        schwächsteEquipmentKategorie = eintrag.kategorie
        schwächsterVerleiherName = verleiherName
      }
    }

    gewichteteSumme += gewicht * score
    gewichtSumme += gewicht
  }

  const equipmentScore = gewichtSumme > 0 ? gewichteteSumme / gewichtSumme : 100

  const zufallsfaktor = Math.round(Math.random() * 30 - 15)

  const gesamt = clamp(staffingScore * 0.6 + equipmentScore * 0.4 + zufallsfaktor, 0, 100)

  const kategorie: Ergebnis = gesamt >= 80 ? 'gut' : gesamt >= 50 ? 'mittel' : 'problematisch'

  const begründung = ermittleBegründung({
    staffingScore,
    equipmentScore,
    zufallsfaktor,
    schwächsteRolle,
    schwächsteEquipmentKategorie,
    schwächsterVerleiherName,
  })

  return {
    staffingScore: Math.round(staffingScore),
    equipmentScore: Math.round(equipmentScore),
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

  // Pro genutzter Verleiher-Kategorie: Verleiher + Einzel-Score ermitteln
  // (Einzel-Score = Zuverlässigkeit der Firma, für die Beziehungs-Anpassung).
  const genutzteVerleiherEintraege: { firma: Verleiher; score: number }[] = []
  for (const [, name] of Object.entries(anfrage.gewählteVerleiherProKategorie) as [
    EquipmentKategorie,
    string | null,
  ][]) {
    if (!name) continue
    const firma = verleiher.find((v) => v.name === name)
    if (!firma) continue
    genutzteVerleiherEintraege.push({ firma, score: firma.zuverlässigkeit })
  }

  let budgetDelta = anfrage.gage
  auswirkungen.push(`Budget +${formatCurrency(anfrage.gage)} (Gage)`)
  for (const { firma } of genutzteVerleiherEintraege) {
    budgetDelta -= firma.verleihkostenPauschale
    auswirkungen.push(
      `Budget -${formatCurrency(firma.verleihkostenPauschale)} (Verleih ${firma.name})`
    )
  }
  const erfahrungDelta =
    ergebnis.kategorie === 'gut' ? 8 : ergebnis.kategorie === 'mittel' ? 4 : 2
  const eingesetzteNamen = new Set(
    Object.values(anfrage.zugewieseneTechniker).filter((n): n is string => !!n)
  )

  // Überstunden: pro Rolle mit aktiviertem Überstunden-Flag und zugewiesenem
  // Techniker zusätzlich Budget-Zuschlag und Moralverlust. Beeinflusst NICHT
  // den staffingScore/die Ergebnis-Kategorie dieser Show.
  const ÜBERSTUNDEN_BUDGET_ZUSCHLAG = 150
  const ÜBERSTUNDEN_MORAL_VERLUST = 15
  const namenInÜberstunden = new Set(
    (Object.entries(anfrage.überstundenProRolle) as [TechnikerRolle, boolean | undefined][])
      .filter(([rolle, aktiv]) => aktiv && anfrage.zugewieseneTechniker[rolle])
      .map(([rolle]) => anfrage.zugewieseneTechniker[rolle] as string)
  )

  for (const name of namenInÜberstunden) {
    budgetDelta -= ÜBERSTUNDEN_BUDGET_ZUSCHLAG
    auswirkungen.push(`Budget -${formatCurrency(ÜBERSTUNDEN_BUDGET_ZUSCHLAG)} (Überstunden ${name})`)
  }
  const neuesBudgetMitÜberstunden = venue.budget + budgetDelta

  const neueTechniker = techniker.map((t) => {
    const eingesetzt = eingesetzteNamen.has(t.name)
    const inÜberstunden = namenInÜberstunden.has(t.name)
    if (!eingesetzt && !inÜberstunden) return t

    let neu = t
    if (eingesetzt) {
      const neueErfahrung = clamp(t.erfahrung + erfahrungDelta, 0, 100)
      auswirkungen.push(`${t.name}: Erfahrung +${erfahrungDelta}`)
      neu = { ...neu, erfahrung: neueErfahrung }
    }
    if (inÜberstunden) {
      const neueMoral = clamp(t.moral - ÜBERSTUNDEN_MORAL_VERLUST, 0, 100)
      auswirkungen.push(`${t.name}: Moral -${ÜBERSTUNDEN_MORAL_VERLUST}`)
      neu = { ...neu, moral: neueMoral }
    }
    return neu
  })

  let neueVerleiher = verleiher
  if (genutzteVerleiherEintraege.length > 0) {
    const beziehungDeltaProFirma = new Map<string, number>()
    for (const { firma, score } of genutzteVerleiherEintraege) {
      const delta = score >= 80 ? 5 : score >= 50 ? 0 : -8
      beziehungDeltaProFirma.set(firma.name, delta)
    }
    neueVerleiher = verleiher.map((v) => {
      const delta = beziehungDeltaProFirma.get(v.name)
      if (delta === undefined) return v
      const neu = clamp(v.beziehung + delta, 0, 100)
      auswirkungen.push(`${v.name}: Beziehung ${formatDelta(delta)}`)
      return { ...v, beziehung: neu }
    })
  }

  return {
    venue: { ...venue, reputation: neueReputation, budget: neuesBudgetMitÜberstunden },
    techniker: neueTechniker,
    verleiher: neueVerleiher,
    auswirkungen,
  }
}
