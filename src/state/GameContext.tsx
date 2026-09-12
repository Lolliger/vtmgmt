import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import {
  anfragen,
  bewerbungen,
  equipmentAntraege,
  kuendigungsantraege,
  techniker,
  venue,
  verleiher,
} from '@/data/dummyData'
import {
  ermittleEreignisFürPhase,
  type Ereignis,
  type EreignisEffekt,
  type EreignisPhase,
} from '@/logic/ereignisse'
import {
  generiereZufälligeBewerbung,
  generiereZufälligenEquipmentAntrag,
} from '@/data/pools'
import {
  berechneAuflösung,
  berechneAuswirkungen,
  geschätzteShowStunden,
  type AuflösungsErgebnis,
} from '@/logic/showAuflösung'
import type {
  Anfrage,
  Bewerbung,
  EquipmentAntrag,
  EquipmentItem,
  EquipmentKategorie,
  Kuendigungsantrag,
  Techniker,
  TechnikerRolle,
  Venue,
  Verleiher,
} from '@/types'

export { geschätzteShowStunden }

export type View = 'dashboard' | 'staffing' | 'auflösung'

const GUT_SCHWELLE = 80
const MITTEL_SCHWELLE = 50

/** Tempo der simulierten Spieluhr: 1 Spielstunde = 30 Echtsekunden. */
export const SEKUNDEN_PRO_SPIELSTUNDE = 30
/** Äquivalent in Spielminuten: 1 Spielminute = 0,5 Echtsekunden. */
export const SEKUNDEN_PRO_SPIELMINUTE = SEKUNDEN_PRO_SPIELSTUNDE / 60

/** Tagesbeginn 9:00 Uhr, als Minuten seit Mitternacht. */
export const TAGESBEGINN_MINUTE = 9 * 60
/** Tagesende 21:30 Uhr, als Minuten seit Mitternacht. */
export const TAGESENDE_MINUTE = 21 * 60 + 30

/** Fester Ablauf-Zeitplan (Minuten seit Mitternacht bzw. Dauer in Minuten). */
/** Exportiert, da die Anzeige (AblaufWidget) daraus den Aufbau-Fortschritt berechnet. */
export const AUFBAU_DAUER_MINUTEN = 120
const SOUNDCHECK_FIXE_MINUTE = 18 * 60 + 30
const SHOW_START_FIXE_MINUTE = 19 * 60
const SHOW_DAUER_MINUTEN = 90
const ABBAU_DAUER_MINUTEN = 60

const BLACKOUT_DAUER_MS = 3000

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta}`
}

/** Uhrzeit-Grenze 19:30 Uhr, als Minuten seit Mitternacht - siehe Aufbau-Malus. */
const AUFBAU_MALUS_GRENZE_MINUTE = 19 * 60 + 30
const AUFBAU_MALUS_SCORE_DELTA = -15

/** Maximale Anzahl an Einträgen im Ablauf-Verlauf (siehe AblaufStatus.verlauf). */
const VERLAUF_MAX_EINTRÄGE = 6

/**
 * Fügt einen neuen Verlaufs-Eintrag vorne an (neueste zuerst) und kappt auf
 * VERLAUF_MAX_EINTRÄGE - ältere Einträge fallen dabei automatisch raus.
 */
function fügeVerlaufEintragHinzu(verlauf: string[], eintrag: string): string[] {
  return [eintrag, ...verlauf].slice(0, VERLAUF_MAX_EINTRÄGE)
}

/** Ein während des Ablaufs gesammeltes Ereignis samt Effekt, bis zur finalen Auflösung. */
export interface GesammeltesEreignis {
  effekt: EreignisEffekt
  beschreibung: string
  phase: EreignisPhase
}

/**
 * Laufzeit-Status eines aktiven Show-Ablaufs (Aufbau → Soundcheck-Gate → Show →
 * Abbau → Auflösung). Wird NICHT persistiert - beim Laden/Neustart immer null.
 * Nutzt KEINE eigene Zeitbasis mehr, sondern feste Minuten-Marken (Minuten seit
 * Mitternacht), die gegen die gemeinsame tagesUhr geprüft werden (siehe
 * ermittleAktuelleMinute). Pausenzustand (Soundcheck/Ereignis) lebt zentral in
 * tagesUhr.pausiertSeit - hier steht nur noch der Grund.
 */
export interface AblaufStatus {
  act: string
  /** Ende des (festen, 2h) Aufbaus. */
  aufbauEndeMinute: number
  /** Fixe Soundcheck-Zeit (18:30), sofern der Aufbau nicht später endet. */
  soundcheckMinute: number
  /** Fixer Show-Start (19:00), sofern der Soundcheck nicht später liegt. */
  showStartMinute: number
  /** Show-Ende (Start + 1,5h fest). */
  showEndeMinute: number
  /** Abbau-Ende (Show-Ende + 1h fest). */
  abbauEndeMinute: number
  pausierGrund: 'soundcheck' | 'ereignis' | null
  /** Zufälliger Zeitpunkt (Minute seit Mitternacht) für den Ereignis-Check je Phase. */
  ereignisZeitpunkte: { aufbau: number; show: number; abbau: number }
  ereignisGeprüft: { aufbau: boolean; show: boolean; abbau: boolean }
  soundcheckBestätigt: boolean
  gesammelteEreignisse: GesammeltesEreignis[]
  /** Phase, zu der ein aktuell aktives Reaktions-Ereignis (aktivesEreignis) gehört. */
  aktuellePhaseFürEreignis: EreignisPhase | null
  /** Chronologischer Verlauf kurzer Status-Meldungen, neueste zuerst, max. VERLAUF_MAX_EINTRÄGE. */
  verlauf: string[]
  /** true, sobald EINE der beiden Mini-Entscheidungen (Briefing/Pause) genutzt wurde - nur einmal pro Ablauf möglich. */
  miniEntscheidungGenutzt: boolean
}

export interface AuflösungsAnzeige {
  ergebnis: AuflösungsErgebnis
  auswirkungen: string[]
}

/**
 * Durchgehende Tag/Nacht-Uhr - die EINZIGE Zeitquelle im Spiel. Ein Spieltag
 * beginnt um 9:00 Uhr (TAGESBEGINN_MINUTE) und dauert bis 21:30 Uhr
 * (TAGESENDE_MINUTE), gefolgt von einem kurzen Blackout, bevor der nächste Tag
 * wieder um 9:00 Uhr beginnt. Läuft eine Show gerade im Ablauf (ablaufStatus
 * !== null), wenn 21:30 erreicht würde, PAUSIERT der Tageswechsel, bis die Show
 * fertig ist (siehe tickAblauf()). pausiertSeit friert die Uhr während eines
 * Soundcheck- oder Ereignis-Gates ein (ersetzt das frühere pausiertSeit auf
 * AblaufStatus).
 */
export interface TagesUhr {
  /** Beginnt bei 1. */
  tag: number
  /** Date.now() ms, wann der aktuelle Tag um 9:00 begonnen hat. */
  tagStartZeitpunkt: number
  /** Date.now() ms, seit dem die Uhr pausiert ist (Soundcheck/Ereignis aussteht), sonst null. */
  pausiertSeit: number | null
  /** Date.now() ms, bis wann der Blackout dauert. null = kein Blackout aktiv. */
  blackoutBis: number | null
  /** Zeitraffer-Faktor - 1 = normal, 2 = doppelte Geschwindigkeit. Default 1. */
  tempo: 1 | 2
}

function baueNeueTagesUhr(): TagesUhr {
  return { tag: 1, tagStartZeitpunkt: Date.now(), pausiertSeit: null, blackoutBis: null, tempo: 1 }
}

/**
 * Leitet aus tagesUhr die aktuelle Spielzeit als Minute seit Mitternacht ab.
 * Ist die Uhr pausiert (pausiertSeit !== null), wird der eingefrorene Zeitpunkt
 * statt Date.now() verwendet - die Minute bleibt dann konstant, bis die Pause
 * aufgelöst wird (siehe SOUNDCHECK_BESTÄTIGEN/EREIGNIS_REAGIEREN/SOUNDCHECK_ABBRECHEN).
 * tempo (1x/2x) beschleunigt den Fortschritt zusätzlich - siehe TEMPO_SETZEN für den
 * nahtlosen Übergang zwischen den Tempo-Stufen ohne Zeitsprung.
 * Einzige Stelle im Code, die Echtzeit in Spielzeit umrechnet.
 */
export function ermittleAktuelleMinute(tagesUhr: TagesUhr): number {
  const referenzZeitpunkt = tagesUhr.pausiertSeit ?? Date.now()
  const vergangeneSekunden = (referenzZeitpunkt - tagesUhr.tagStartZeitpunkt) / 1000
  return TAGESBEGINN_MINUTE + (vergangeneSekunden / SEKUNDEN_PRO_SPIELMINUTE) * tagesUhr.tempo
}

/**
 * Leitet aus tagesUhr die aktuelle Uhrzeit-of-day (Stunde/Minute) ab, sowie ob
 * gerade Blackout (Nacht/Schlafen) aktiv ist. Rein für die Anzeige - trifft
 * keine Spiel-Entscheidungen. Wird auf [TAGESBEGINN_MINUTE, TAGESENDE_MINUTE]
 * geclampt, damit die Anzeige bei einem über 21:30 hinaus laufenden Ablauf
 * nicht "überläuft".
 */
export function ermittleTagesUhrzeit(tagesUhr: TagesUhr): {
  stunde: number
  minute: number
  istBlackout: boolean
} {
  if (tagesUhr.blackoutBis !== null) {
    return {
      stunde: Math.floor(TAGESENDE_MINUTE / 60),
      minute: TAGESENDE_MINUTE % 60,
      istBlackout: true,
    }
  }

  const minutenImTag = clamp(ermittleAktuelleMinute(tagesUhr), TAGESBEGINN_MINUTE, TAGESENDE_MINUTE)
  return {
    stunde: Math.floor(minutenImTag / 60),
    minute: Math.floor(minutenImTag % 60),
    istBlackout: false,
  }
}

/** Leitet die Wochenzahl (beginnt bei 1) rein aus dem aktuellen Tag ab. Tag 1-7 = Woche 1, Tag 8-14 = Woche 2, usw. */
export function ermittleWoche(tag: number): number {
  return Math.floor((tag - 1) / 7) + 1
}

export interface GameState {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  shows: Anfrage[]
  view: View
  activeShowAct: string | null
  letzteAuflösung: AuflösungsAnzeige | null
  /** Anzahl aufeinanderfolgender Wochen, in denen das Budget nach Gehaltsabzug negativ war. */
  minusWochenInFolge: number
  /** true, wenn der Spieler eine Zwangsentlassung durchführen muss (siehe ENTLASSEN). */
  zwangsentlassungAusstehend: boolean
  /** Aktuell zur Reaktion anstehendes Zufallsereignis, sonst null. */
  aktivesEreignis: Ereignis | null
  /** Laufzeit-Status des aktiven Show-Ablaufs (Aufbau/Show/Abbau), sonst null. Nicht persistiert. */
  ablaufStatus: AblaufStatus | null
  /** Die EINE Zeitquelle des Spiels - wird persistiert. */
  tagesUhr: TagesUhr
  /** Offene Anträge auf zusätzliches Equipment - vom Spieler zu bewilligen/abzulehnen. */
  equipmentAntraege: EquipmentAntrag[]
  /** Offene Bewerbungen neuer Techniker-Kandidaten - vom Spieler anzunehmen/abzulehnen. */
  bewerbungen: Bewerbung[]
  /** Offene Kündigungsanträge bestehender Techniker - vom Spieler zu akzeptieren/abzulehnen. */
  kuendigungsantraege: Kuendigungsantrag[]
}

type GameAction =
  | { type: 'ANNEHMEN'; act: string }
  | { type: 'ABLEHNEN'; act: string }
  | { type: 'OPEN_STAFFING'; act: string }
  | { type: 'ASSIGN_TECHNIKER'; act: string; rolle: TechnikerRolle; name: string | null }
  | {
      type: 'ASSIGN_VERLEIHER'
      act: string
      kategorie: EquipmentKategorie
      name: string | null
    }
  | { type: 'TOGGLE_ÜBERSTUNDEN'; act: string; rolle: TechnikerRolle; aktiv: boolean }
  | { type: 'BACK_TO_DASHBOARD' }
  | { type: 'ENTLASSEN'; name: string }
  | {
      type: 'ABLAUF_STARTEN'
      act: string
      aufbauEndeMinute: number
      soundcheckMinute: number
      showStartMinute: number
      showEndeMinute: number
      abbauEndeMinute: number
      ereignisZeitpunkte: { aufbau: number; show: number; abbau: number }
    }
  | { type: 'SOUNDCHECK_BESTÄTIGEN' }
  | { type: 'SOUNDCHECK_ABBRECHEN' }
  | { type: 'EREIGNIS_REAGIEREN'; reaktion: 'A' | 'B' }
  | { type: 'TICK' }
  | { type: 'TEMPO_SETZEN'; tempo: 1 | 2 }
  | { type: 'MINI_ENTSCHEIDUNG_BRIEFING' }
  | { type: 'MINI_ENTSCHEIDUNG_PAUSE' }
  | { type: 'EQUIPMENT_ANTRAG_BEWILLIGEN'; id: string }
  | { type: 'EQUIPMENT_ANTRAG_ABLEHNEN'; id: string }
  | { type: 'BEWERBUNG_ANNEHMEN'; id: string }
  | { type: 'BEWERBUNG_ABLEHNEN'; id: string }
  | { type: 'KUENDIGUNG_AKZEPTIEREN'; id: string }
  | { type: 'KUENDIGUNG_ABLEHNEN'; id: string }

export const SPIELSTAND_KEY = 'venue-manager-spielstand-v1'

/**
 * Version des Spielstand-Schemas (Struktur der in localStorage gespeicherten Daten).
 * Bei inkompatiblen Änderungen am gespeicherten Format hochzählen - siehe
 * pruefeSpielstandKompatibilitaet().
 */
export const SPIELSTAND_SCHEMA_VERSION = 1

interface GespeicherterSpielstand {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  shows: Anfrage[]
  minusWochenInFolge: number
  zwangsentlassungAusstehend: boolean
  tagesUhr: TagesUhr
  schemaVersion: number
  equipmentAntraege: EquipmentAntrag[]
  bewerbungen: Bewerbung[]
  kuendigungsantraege: Kuendigungsantrag[]
}

function istGültigeTagesUhr(value: unknown): value is TagesUhr {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.tag === 'number' &&
    typeof v.tagStartZeitpunkt === 'number' &&
    (v.blackoutBis === null || typeof v.blackoutBis === 'number') &&
    (v.pausiertSeit === undefined || v.pausiertSeit === null || typeof v.pausiertSeit === 'number')
  )
}

/**
 * Normalisiert eine geladene tagesUhr: pausiertSeit fehlt bei älteren
 * Spielständen (kein Schema-Bruch, einfach als "nicht pausiert" annehmen).
 * War die Uhr beim Speichern mitten in einer Pause (Soundcheck/Ereignis),
 * kann diese nach dem Laden nicht fortgesetzt werden, da ablaufStatus nicht
 * persistiert wird - die Zeit wird stattdessen einfach fortgesetzt, statt für
 * immer eingefroren zu bleiben.
 * tempo fehlt bei Spielständen aus der Zeit vor dem Zeitraffer - kein
 * Schema-Bruch, einfach mit Default 1 auffüllen.
 */
function normalisiereGeladeneTagesUhr(tagesUhr: TagesUhr): TagesUhr {
  const tempo: 1 | 2 = tagesUhr.tempo === 2 ? 2 : 1
  if (tagesUhr.pausiertSeit === null || tagesUhr.pausiertSeit === undefined) {
    return { ...tagesUhr, pausiertSeit: null, tempo }
  }
  return {
    ...tagesUhr,
    tagStartZeitpunkt: tagesUhr.tagStartZeitpunkt + (Date.now() - tagesUhr.pausiertSeit),
    pausiertSeit: null,
    tempo,
  }
}

function istGespeicherterSpielstand(value: unknown): value is GespeicherterSpielstand {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    v.venue !== undefined &&
    Array.isArray(v.techniker) &&
    Array.isArray(v.verleiher) &&
    Array.isArray(v.shows)
  )
}

/**
 * Baut einen frischen Spielstand aus den Dummy-Ausgangsdaten (neues Spiel).
 */
export function baueNeuenSpielstand(): GameState {
  return {
    venue,
    techniker,
    verleiher,
    shows: anfragen,
    view: 'dashboard',
    activeShowAct: null,
    letzteAuflösung: null,
    minusWochenInFolge: 0,
    zwangsentlassungAusstehend: false,
    aktivesEreignis: null,
    ablaufStatus: null,
    tagesUhr: baueNeueTagesUhr(),
    equipmentAntraege,
    bewerbungen,
    kuendigungsantraege,
  }
}

/**
 * Prüft, ob unter SPIELSTAND_KEY ein Spielstand in localStorage liegt.
 * Gibt false zurück (statt zu crashen), wenn localStorage nicht verfügbar ist.
 */
export function hatGespeichertenSpielstand(): boolean {
  try {
    return localStorage.getItem(SPIELSTAND_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Prüft die Schema-Kompatibilität des gespeicherten Spielstands, ohne ihn
 * vollständig zu laden.
 * - 'kein-spielstand': kein Eintrag unter SPIELSTAND_KEY vorhanden.
 * - 'inkompatibel': Eintrag vorhanden, aber schemaVersion fehlt, weicht ab,
 *   oder das JSON lässt sich nicht parsen.
 * - 'kompatibel': Eintrag vorhanden und schemaVersion stimmt überein.
 * Crasht nie - alle Fehlerfälle laufen über try/catch.
 */
export function pruefeSpielstandKompatibilitaet(): 'kompatibel' | 'inkompatibel' | 'kein-spielstand' {
  try {
    const roh = localStorage.getItem(SPIELSTAND_KEY)
    if (roh === null) return 'kein-spielstand'

    const geparst: unknown = JSON.parse(roh)
    if (!geparst || typeof geparst !== 'object') return 'inkompatibel'

    const schemaVersion = (geparst as Record<string, unknown>).schemaVersion
    if (schemaVersion !== SPIELSTAND_SCHEMA_VERSION) return 'inkompatibel'

    return 'kompatibel'
  } catch {
    return 'inkompatibel'
  }
}

/**
 * Lädt den gespeicherten Spielstand aus localStorage. Navigations-State
 * (view/activeShowAct/letzteAuflösung) wird bewusst NICHT wiederhergestellt,
 * sondern immer frisch gesetzt. Das frühere eigenständige `woche`-Feld wird,
 * falls im alten Spielstand vorhanden, stillschweigend ignoriert (woche wird
 * jetzt immer aus tagesUhr.tag abgeleitet, siehe ermittleWoche()).
 * Gibt bei fehlendem Eintrag, inkompatiblem Schema, Parse-Fehler oder
 * fehlenden Feldern null zurück.
 */
export function ladeGespeichertenSpielstand(): GameState | null {
  try {
    const kompatibilitaet = pruefeSpielstandKompatibilitaet()
    if (kompatibilitaet === 'kein-spielstand') return null
    if (kompatibilitaet === 'inkompatibel') {
      console.warn('Spielstand inkompatibel, altes Format')
      return null
    }

    const roh = localStorage.getItem(SPIELSTAND_KEY)
    if (roh === null) return null

    const geparst: unknown = JSON.parse(roh)
    if (!istGespeicherterSpielstand(geparst)) {
      console.warn('Gespeicherter Spielstand hat unerwartetes Format, wird ignoriert.')
      return null
    }

    return {
      venue: geparst.venue,
      techniker: geparst.techniker,
      verleiher: geparst.verleiher,
      shows: geparst.shows,
      view: 'dashboard',
      activeShowAct: null,
      letzteAuflösung: null,
      aktivesEreignis: null,
      ablaufStatus: null,
      // Fehlen bei älteren Spielständen ohne diese Felder - mit Default auffüllen.
      minusWochenInFolge:
        typeof geparst.minusWochenInFolge === 'number' ? geparst.minusWochenInFolge : 0,
      zwangsentlassungAusstehend:
        typeof geparst.zwangsentlassungAusstehend === 'boolean'
          ? geparst.zwangsentlassungAusstehend
          : false,
      // Fehlt bei Spielständen aus der Zeit vor der Tages-Uhr - kein Schema-Bruch,
      // einfach mit einem frischen Tag starten.
      tagesUhr: istGültigeTagesUhr(geparst.tagesUhr)
        ? normalisiereGeladeneTagesUhr(geparst.tagesUhr)
        : baueNeueTagesUhr(),
      // Fehlen bei älteren Spielständen ohne diese Listen - mit leerem Array auffüllen.
      equipmentAntraege: Array.isArray(geparst.equipmentAntraege) ? geparst.equipmentAntraege : [],
      bewerbungen: Array.isArray(geparst.bewerbungen) ? geparst.bewerbungen : [],
      kuendigungsantraege: Array.isArray(geparst.kuendigungsantraege)
        ? geparst.kuendigungsantraege
        : [],
    }
  } catch (error) {
    console.warn('Gespeicherter Spielstand konnte nicht geladen werden:', error)
    return null
  }
}

/**
 * Entfernt den gespeicherten Spielstand aus localStorage.
 */
export function loescheGespeichertenSpielstand(): void {
  try {
    localStorage.removeItem(SPIELSTAND_KEY)
  } catch {
    // localStorage nicht verfügbar - nichts zu tun
  }
}

function updateShow(
  shows: Anfrage[],
  act: string,
  updater: (show: Anfrage) => Anfrage
): Anfrage[] {
  return shows.map((show) => (show.act === act ? updater(show) : show))
}

/**
 * Führt die eigentliche Show-Auflösung durch (Berechnung + Auswirkungen) und
 * verrechnet die Effekte aller während des Ablaufs (Aufbau/Show/Abbau)
 * aufgetretenen Zufallsereignisse. Wird aufgerufen, nachdem alle drei Phasen
 * durchlaufen wurden (siehe TICK). Ohne Ereignisse (leeres Array, Default) ist
 * das Ergebnis identisch zur reinen Basis-Auflösung.
 */
function führeShowAuflösungDurch(
  state: GameState,
  act: string,
  ereignisse: GesammeltesEreignis[] = []
): GameState {
  const show = state.shows.find((s) => s.act === act)
  if (!show) return state

  const rohErgebnis = berechneAuflösung(show, state.techniker, state.verleiher, state.venue)

  const scoreDeltaSumme = ereignisse.reduce((summe, e) => summe + (e.effekt.scoreDelta ?? 0), 0)
  let ergebnis = rohErgebnis
  if (scoreDeltaSumme !== 0) {
    const neueGesamtpunktzahl = clamp(rohErgebnis.gesamtpunktzahl + scoreDeltaSumme, 0, 100)
    const neueKategorie =
      neueGesamtpunktzahl >= GUT_SCHWELLE
        ? 'gut'
        : neueGesamtpunktzahl >= MITTEL_SCHWELLE
          ? 'mittel'
          : 'problematisch'
    ergebnis = { ...rohErgebnis, gesamtpunktzahl: neueGesamtpunktzahl, kategorie: neueKategorie }
  }

  const {
    venue: venueNachAuswirkungen,
    techniker: technikerNachAuswirkungen,
    verleiher: neueVerleiher,
    auswirkungen: basisAuswirkungen,
  } = berechneAuswirkungen(show, ergebnis, state.venue, state.techniker, state.verleiher)

  // Ereignis-Beschreibungen zuerst, in chronologischer Reihenfolge (aufbau→show→abbau,
  // da gesammelteEreignisse in dieser Reihenfolge befüllt wird), dann die Basis-Auswirkungen.
  const auswirkungen = [
    ...ereignisse.map((e) => `Ereignis (${e.phase}): ${e.beschreibung}`),
    ...basisAuswirkungen,
  ]

  let neuesVenue = venueNachAuswirkungen
  let neueTechniker = technikerNachAuswirkungen

  for (const eintrag of ereignisse) {
    const { effekt } = eintrag
    if (effekt.budgetDelta !== undefined) {
      neuesVenue = { ...neuesVenue, budget: neuesVenue.budget + effekt.budgetDelta }
      auswirkungen.push(`Budget ${formatDelta(effekt.budgetDelta)}€ (Ereignis)`)
    }
    if (effekt.reputationDelta !== undefined) {
      neuesVenue = {
        ...neuesVenue,
        reputation: clamp(neuesVenue.reputation + effekt.reputationDelta, 0, 100),
      }
      auswirkungen.push(`Reputation ${formatDelta(effekt.reputationDelta)} (Ereignis)`)
    }
    if (effekt.moralDeltaZufälligerTechniker !== undefined) {
      const zugewiesen = Object.values(show.zugewieseneTechniker).filter(
        (n): n is string => !!n
      )
      if (zugewiesen.length > 0) {
        const name = zugewiesen[Math.floor(Math.random() * zugewiesen.length)]
        const delta = effekt.moralDeltaZufälligerTechniker
        neueTechniker = neueTechniker.map((t) =>
          t.name === name ? { ...t, moral: clamp(t.moral + delta, 0, 100) } : t
        )
        auswirkungen.push(`${name}: Moral ${formatDelta(delta)} (Ereignis)`)
      }
    }
  }

  // Verlauf-Eintrag für die finale Auflösung - wird direkt danach vom Aufrufer (TICK)
  // durch ablaufStatus: null ersetzt, hier trotzdem korrekt gesetzt, falls
  // führeShowAuflösungDurch künftig auch von anderer Stelle ohne sofortiges
  // Zurücksetzen aufgerufen wird.
  const ablaufStatus = state.ablaufStatus
    ? {
        ...state.ablaufStatus,
        verlauf: fügeVerlaufEintragHinzu(
          state.ablaufStatus.verlauf,
          `Show beendet, Ergebnis: ${ergebnis.kategorie}`
        ),
      }
    : state.ablaufStatus

  return {
    ...state,
    ablaufStatus,
    venue: neuesVenue,
    techniker: neueTechniker,
    verleiher: neueVerleiher,
    shows: updateShow(state.shows, act, (s) => ({
      ...s,
      status: 'aufgelöst',
      ergebnis: ergebnis.kategorie,
    })),
    view: 'auflösung',
    // activeShowAct MUSS hier auf die aufgelöste Show gesetzt werden: während des
    // Ablaufs kann activeShowAct längst auf eine andere Show zeigen (Spieler hat
    // parallel eine zweite Anfrage gestafft, siehe AblaufWidget-Kommentar oben),
    // ohne diesen Reset würde AuflösungScreen (das activeShow aus activeShowAct
    // ableitet) die falsche oder gar keine Show finden -> "Keine Auflösung verfügbar".
    activeShowAct: act,
    letzteAuflösung: { ergebnis, auswirkungen },
    aktivesEreignis: null,
  }
}

/**
 * Wendet den Wochenabschluss an (Gehaltsabzug, Wochenstunden-Reset,
 * Minus-Wochen-Zähler, Reputationsverlust/Zwangsentlassungs-Flag bei
 * anhaltend negativem Budget). Wird NICHT mehr manuell per Button ausgelöst,
 * sondern automatisch beim Blackout-Ende, sobald der neue Tag einen neuen
 * 7-Tage-Block beginnt (siehe TICK, Tag 8/15/22/...).
 */
function wendeWochenabschlussAn(state: GameState): GameState {
  const gehaltssumme = state.techniker.reduce((summe, t) => summe + t.gehalt, 0)
  const neuesBudget = state.venue.budget - gehaltssumme

  const minusWochenInFolge = neuesBudget < 0 ? state.minusWochenInFolge + 1 : 0

  // Reputationsverlust nur genau beim Erreichen der zweiten Minus-Woche in Folge,
  // nicht bei jeder weiteren Woche danach.
  const reputation =
    minusWochenInFolge === 2 ? Math.max(0, state.venue.reputation - 5) : state.venue.reputation

  // Bleibt true, bis eine Entlassung erfolgt (siehe ENTLASSEN) - wird hier also nicht
  // zurückgesetzt, falls bereits ausstehend.
  const zwangsentlassungAusstehend =
    state.zwangsentlassungAusstehend || minusWochenInFolge >= 3

  return {
    ...state,
    techniker: state.techniker.map((t) => ({ ...t, verplanteStunden: 0 })),
    venue: { ...state.venue, budget: neuesBudget, reputation },
    minusWochenInFolge,
    zwangsentlassungAusstehend,
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ANNEHMEN':
      return {
        ...state,
        shows: updateShow(state.shows, action.act, (show) => ({
          ...show,
          status: 'angenommen',
        })),
      }

    case 'ABLEHNEN':
      return {
        ...state,
        shows: updateShow(state.shows, action.act, (show) => ({
          ...show,
          status: 'abgelehnt',
        })),
      }

    case 'OPEN_STAFFING':
      return { ...state, view: 'staffing', activeShowAct: action.act }

    case 'ASSIGN_TECHNIKER': {
      const show = state.shows.find((s) => s.act === action.act)
      if (!show) return state

      const alterName = show.zugewieseneTechniker[action.rolle]
      const neuerName = action.name
      const stunden = geschätzteShowStunden(show)

      let neueTechniker = state.techniker
      if (alterName && alterName !== neuerName) {
        neueTechniker = neueTechniker.map((t) =>
          t.name === alterName
            ? { ...t, verplanteStunden: Math.max(0, t.verplanteStunden - stunden) }
            : t
        )
      }
      if (neuerName && neuerName !== alterName) {
        neueTechniker = neueTechniker.map((t) =>
          t.name === neuerName
            ? { ...t, verplanteStunden: t.verplanteStunden + stunden }
            : t
        )
      }

      return {
        ...state,
        techniker: neueTechniker,
        shows: updateShow(state.shows, action.act, (s) => ({
          ...s,
          zugewieseneTechniker: {
            ...s.zugewieseneTechniker,
            [action.rolle]: neuerName,
          },
        })),
      }
    }

    case 'ASSIGN_VERLEIHER':
      return {
        ...state,
        shows: updateShow(state.shows, action.act, (show) => ({
          ...show,
          gewählteVerleiherProKategorie: {
            ...show.gewählteVerleiherProKategorie,
            [action.kategorie]: action.name,
          },
        })),
      }

    case 'TOGGLE_ÜBERSTUNDEN':
      return {
        ...state,
        shows: updateShow(state.shows, action.act, (show) => ({
          ...show,
          überstundenProRolle: {
            ...show.überstundenProRolle,
            [action.rolle]: action.aktiv,
          },
        })),
      }

    case 'ABLAUF_STARTEN': {
      // Schutz gegen zwei parallele Abläufe: läuft bereits ein Ablauf für eine ANDERE
      // Show, wird dieser Start ignoriert - sonst würde ablaufStatus (ein einzelnes
      // Objekt, keine Liste) überschrieben und die zuerst gestartete Show bliebe für
      // immer unaufgelöst in 'angenommen' hängen. Neustart derselben Show (gleicher
      // act) bleibt weiterhin erlaubt (Feature, siehe StaffingScreen-Bestätigungsdialog).
      if (state.ablaufStatus && state.ablaufStatus.act !== action.act) return state

      // Aufbau-Malus: steht bereits beim Start fest, ob der (feste) Aufbau über
      // 19:30 Uhr hinausläuft - dann direkt als Ereignis vorbelegen, statt erst
      // bei der finalen Auflösung zu prüfen.
      const gesammelteEreignisse: GesammeltesEreignis[] =
        action.aufbauEndeMinute > AUFBAU_MALUS_GRENZE_MINUTE
          ? [
              {
                effekt: { scoreDelta: AUFBAU_MALUS_SCORE_DELTA },
                beschreibung: 'Aufbau war nicht rechtzeitig vor 19:30 fertig',
                phase: 'aufbau',
              },
            ]
          : []

      return {
        ...state,
        activeShowAct: action.act,
        // Bewusst NICHT mehr view: 'ablauf' - der Spieler bleibt auf dem Dashboard
        // und kann dort weiterarbeiten (z.B. eine zweite Show staffen), während
        // der Ablauf im Hintergrund läuft (siehe TICK).
        view: 'dashboard',
        ablaufStatus: {
          act: action.act,
          aufbauEndeMinute: action.aufbauEndeMinute,
          soundcheckMinute: action.soundcheckMinute,
          showStartMinute: action.showStartMinute,
          showEndeMinute: action.showEndeMinute,
          abbauEndeMinute: action.abbauEndeMinute,
          pausierGrund: null,
          ereignisZeitpunkte: action.ereignisZeitpunkte,
          ereignisGeprüft: { aufbau: false, show: false, abbau: false },
          soundcheckBestätigt: false,
          gesammelteEreignisse,
          aktuellePhaseFürEreignis: null,
          verlauf: ['Aufbau gestartet'],
          miniEntscheidungGenutzt: false,
        },
      }
    }

    case 'SOUNDCHECK_BESTÄTIGEN': {
      if (!state.ablaufStatus || state.tagesUhr.pausiertSeit === null) return state
      return {
        ...state,
        ablaufStatus: {
          ...state.ablaufStatus,
          soundcheckBestätigt: true,
          pausierGrund: null,
          verlauf: fügeVerlaufEintragHinzu(
            state.ablaufStatus.verlauf,
            'Soundcheck bestanden, Show kann beginnen'
          ),
        },
        tagesUhr: {
          ...state.tagesUhr,
          tagStartZeitpunkt:
            state.tagesUhr.tagStartZeitpunkt + (Date.now() - state.tagesUhr.pausiertSeit),
          pausiertSeit: null,
        },
      }
    }

    case 'SOUNDCHECK_ABBRECHEN': {
      // Zeit fortsetzen (Pause auflösen), BEVOR ablaufStatus gelöscht wird - sonst
      // bliebe die tagesUhr für immer eingefroren.
      const tagesUhr =
        state.tagesUhr.pausiertSeit !== null
          ? {
              ...state.tagesUhr,
              tagStartZeitpunkt:
                state.tagesUhr.tagStartZeitpunkt + (Date.now() - state.tagesUhr.pausiertSeit),
              pausiertSeit: null,
            }
          : state.tagesUhr
      return { ...state, ablaufStatus: null, view: 'staffing', tagesUhr }
    }

    case 'EREIGNIS_REAGIEREN': {
      const ereignis = state.aktivesEreignis
      if (!ereignis) return state
      if (!state.ablaufStatus || state.tagesUhr.pausiertSeit === null) return state

      const reaktion = action.reaktion === 'A' ? ereignis.reaktionA : ereignis.reaktionB
      const phase = state.ablaufStatus.aktuellePhaseFürEreignis ?? 'aufbau'

      return {
        ...state,
        aktivesEreignis: null,
        ablaufStatus: {
          ...state.ablaufStatus,
          pausierGrund: null,
          aktuellePhaseFürEreignis: null,
          gesammelteEreignisse: [
            ...state.ablaufStatus.gesammelteEreignisse,
            { effekt: reaktion.effekt, beschreibung: ereignis.beschreibung, phase },
          ],
          verlauf: fügeVerlaufEintragHinzu(state.ablaufStatus.verlauf, ereignis.beschreibung),
        },
        tagesUhr: {
          ...state.tagesUhr,
          tagStartZeitpunkt:
            state.tagesUhr.tagStartZeitpunkt + (Date.now() - state.tagesUhr.pausiertSeit),
          pausiertSeit: null,
        },
      }
    }

    case 'TICK': {
      const { tagesUhr, ablaufStatus } = state

      // 1. Blackout läuft - erst beenden (neuer Tag beginnt), wenn die Dauer um ist.
      if (tagesUhr.blackoutBis !== null) {
        if (Date.now() < tagesUhr.blackoutBis) return state

        const neuerTag = tagesUhr.tag + 1

        // Tägliche Generierung: neue Bewerbung und Equipment-Anträge, jeweils
        // nur bis zu einer Obergrenze, damit die Listen nicht unbegrenzt
        // wachsen, falls der Spieler nicht hinterherkommt.
        const BEWERBUNGEN_OBERGRENZE = 5
        const EQUIPMENT_ANTRAEGE_OBERGRENZE = 8

        const neueBewerbungen =
          state.bewerbungen.length < BEWERBUNGEN_OBERGRENZE
            ? [...state.bewerbungen, generiereZufälligeBewerbung()]
            : state.bewerbungen

        const freieEquipmentAntragSlots = Math.max(
          0,
          EQUIPMENT_ANTRAEGE_OBERGRENZE - state.equipmentAntraege.length
        )
        const anzahlNeueEquipmentAntraege = Math.min(2, freieEquipmentAntragSlots)
        const neueEquipmentAntraege = [
          ...state.equipmentAntraege,
          ...Array.from({ length: anzahlNeueEquipmentAntraege }, () =>
            generiereZufälligenEquipmentAntrag()
          ),
        ]

        const neuerState: GameState = {
          ...state,
          bewerbungen: neueBewerbungen,
          equipmentAntraege: neueEquipmentAntraege,
          tagesUhr: {
            tag: neuerTag,
            tagStartZeitpunkt: Date.now(),
            pausiertSeit: null,
            blackoutBis: null,
            tempo: tagesUhr.tempo,
          },
        }
        // Automatischer Wochenabschluss: der Übergang VON Tag 7 zu Tag 8 markiert
        // das Ende von Woche 1, usw. - nicht beim allerersten Tag (Spielstart).
        if (neuerTag !== 1 && (neuerTag - 1) % 7 === 0) {
          return wendeWochenabschlussAn(neuerState)
        }
        return neuerState
      }

      // 2. Soundcheck oder Ereignis offen - alles eingefroren, nichts tun.
      if (tagesUhr.pausiertSeit !== null) return state

      const aktuelleMinute = ermittleAktuelleMinute(tagesUhr)

      // 3. Tagesende erreicht und kein Ablauf aktiv -> Blackout starten.
      if (aktuelleMinute >= TAGESENDE_MINUTE && ablaufStatus === null) {
        return {
          ...state,
          tagesUhr: { ...tagesUhr, blackoutBis: Date.now() + BLACKOUT_DAUER_MS },
        }
      }

      if (ablaufStatus === null) return state

      // 4. Soundcheck-Gate: Aufbau vorbei, aber noch nicht bestätigt -> pausieren.
      if (!ablaufStatus.soundcheckBestätigt && aktuelleMinute >= ablaufStatus.soundcheckMinute) {
        return {
          ...state,
          ablaufStatus: {
            ...ablaufStatus,
            pausierGrund: 'soundcheck',
            verlauf: fügeVerlaufEintragHinzu(ablaufStatus.verlauf, 'Soundcheck erreicht'),
          },
          tagesUhr: { ...tagesUhr, pausiertSeit: Date.now() },
        }
      }

      // 5. Aktuelle Phase ermitteln (show/abbau erst nach bestätigtem Soundcheck erreichbar,
      // was durch das Gate in Schritt 4 sichergestellt ist).
      let phase: EreignisPhase | 'wartezeit' | 'fertig'
      if (aktuelleMinute < ablaufStatus.aufbauEndeMinute) {
        phase = 'aufbau'
      } else if (aktuelleMinute < ablaufStatus.showStartMinute) {
        // Wartezeit zwischen Aufbau-Ende und Show-Start (z.B. wenn der Aufbau früh
        // am Tag fertig ist) - keine Ereignis-Prüfung nötig.
        phase = 'wartezeit'
      } else if (aktuelleMinute < ablaufStatus.showEndeMinute) {
        phase = 'show'
      } else if (aktuelleMinute < ablaufStatus.abbauEndeMinute) {
        phase = 'abbau'
      } else {
        phase = 'fertig'
      }

      if (phase === 'aufbau' || phase === 'show' || phase === 'abbau') {
        const ereignisZeitpunkt = ablaufStatus.ereignisZeitpunkte[phase]
        const bereitsGeprüft = ablaufStatus.ereignisGeprüft[phase]
        if (aktuelleMinute >= ereignisZeitpunkt && !bereitsGeprüft) {
          const show = state.shows.find((s) => s.act === ablaufStatus.act)
          if (!show) return state

          const ergebnis = ermittleEreignisFürPhase(
            phase,
            show,
            state.techniker,
            state.verleiher,
            state.venue
          )

          if (!ergebnis) {
            return {
              ...state,
              ablaufStatus: {
                ...ablaufStatus,
                ereignisGeprüft: { ...ablaufStatus.ereignisGeprüft, [phase]: true },
              },
            }
          }

          if (ergebnis.typ === 'automatisch') {
            return {
              ...state,
              ablaufStatus: {
                ...ablaufStatus,
                ereignisGeprüft: { ...ablaufStatus.ereignisGeprüft, [phase]: true },
                gesammelteEreignisse: [
                  ...ablaufStatus.gesammelteEreignisse,
                  { effekt: ergebnis.effekt, beschreibung: ergebnis.beschreibung, phase },
                ],
                verlauf: fügeVerlaufEintragHinzu(ablaufStatus.verlauf, ergebnis.beschreibung),
              },
            }
          }

          return {
            ...state,
            aktivesEreignis: ergebnis.ereignis,
            ablaufStatus: {
              ...ablaufStatus,
              ereignisGeprüft: { ...ablaufStatus.ereignisGeprüft, [phase]: true },
              pausierGrund: 'ereignis',
              aktuellePhaseFürEreignis: phase,
            },
            tagesUhr: { ...tagesUhr, pausiertSeit: Date.now() },
          }
        }
      }

      if (phase === 'fertig') {
        const neuerState = führeShowAuflösungDurch(
          state,
          ablaufStatus.act,
          ablaufStatus.gesammelteEreignisse
        )
        return { ...neuerState, ablaufStatus: null }
      }

      return state
    }

    case 'TEMPO_SETZEN': {
      // Nahtloser Übergang: die aktuell angezeigte Minute (mit ALTEM Tempo berechnet)
      // muss mit dem NEUEN Tempo sofort wieder herauskommen - dafür tagStartZeitpunkt
      // passend zurückrechnen, statt nur tempo zu setzen (das würde einen Zeitsprung
      // verursachen).
      const aktuelleMinuteVorher = ermittleAktuelleMinute(state.tagesUhr)
      const tagStartZeitpunktNeu =
        Date.now() -
        ((aktuelleMinuteVorher - TAGESBEGINN_MINUTE) * 1000 * SEKUNDEN_PRO_SPIELMINUTE) /
          action.tempo

      return {
        ...state,
        tagesUhr: {
          ...state.tagesUhr,
          tagStartZeitpunkt: tagStartZeitpunktNeu,
          tempo: action.tempo,
        },
      }
    }

    case 'MINI_ENTSCHEIDUNG_BRIEFING': {
      // Defensive: nur sinnvoll während eines laufenden Ablaufs, und nur einmal
      // pro Ablauf (Briefing ODER Pause, nicht beides).
      if (!state.ablaufStatus || state.ablaufStatus.miniEntscheidungGenutzt) return state

      const show = state.shows.find((s) => s.act === state.ablaufStatus?.act)
      if (!show) return state

      const zugewieseneNamen = Object.values(show.zugewieseneTechniker).filter(
        (n): n is string => !!n
      )

      return {
        ...state,
        techniker: state.techniker.map((t) =>
          zugewieseneNamen.includes(t.name) ? { ...t, moral: clamp(t.moral + 2, 0, 100) } : t
        ),
        ablaufStatus: {
          ...state.ablaufStatus,
          miniEntscheidungGenutzt: true,
          verlauf: fügeVerlaufEintragHinzu(
            state.ablaufStatus.verlauf,
            'Team briefen: +2 Moral für das Team'
          ),
        },
      }
    }

    case 'MINI_ENTSCHEIDUNG_PAUSE': {
      // Defensive: nur sinnvoll während eines laufenden Ablaufs, nur einmal pro
      // Ablauf, und nur bei ausreichendem Budget.
      if (!state.ablaufStatus || state.ablaufStatus.miniEntscheidungGenutzt) return state
      if (state.venue.budget < 50) return state

      const show = state.shows.find((s) => s.act === state.ablaufStatus?.act)
      if (!show) return state

      const zugewieseneNamen = Object.values(show.zugewieseneTechniker).filter(
        (n): n is string => !!n
      )

      return {
        ...state,
        venue: { ...state.venue, budget: state.venue.budget - 50 },
        techniker: state.techniker.map((t) =>
          zugewieseneNamen.includes(t.name) ? { ...t, moral: clamp(t.moral + 5, 0, 100) } : t
        ),
        ablaufStatus: {
          ...state.ablaufStatus,
          miniEntscheidungGenutzt: true,
          verlauf: fügeVerlaufEintragHinzu(
            state.ablaufStatus.verlauf,
            'Pause spendiert (-50€): +5 Moral für das Team'
          ),
        },
      }
    }

    case 'BACK_TO_DASHBOARD':
      return {
        ...state,
        view: 'dashboard',
        activeShowAct: null,
        letzteAuflösung: null,
        aktivesEreignis: null,
      }

    case 'ENTLASSEN': {
      // Nur relevant, wenn tatsächlich eine Zwangsentlassung aussteht (siehe
      // wendeWochenabschlussAn). Ohne ausstehende Krise bleibt der Techniker-Bestand
      // unverändert, statt versehentlich freiwillige Entlassungen zuzulassen.
      if (!state.zwangsentlassungAusstehend) return state

      return {
        ...state,
        techniker: state.techniker.filter((t) => t.name !== action.name),
        minusWochenInFolge: 0,
        zwangsentlassungAusstehend: false,
      }
    }

    case 'EQUIPMENT_ANTRAG_BEWILLIGEN': {
      const antrag = state.equipmentAntraege.find((a) => a.id === action.id)
      if (!antrag) return state

      const vorhandeneAnzahl = state.venue.equipmentBestand.filter(
        (item) => item.kategorie === antrag.kategorie && item.name.startsWith(antrag.produktname)
      ).length
      const gesamtAnzahlNachBewilligung = vorhandeneAnzahl + antrag.anzahl

      const neueItems: EquipmentItem[] = Array.from({ length: antrag.anzahl }, (_, i) => ({
        id: `${antrag.kategorie.toLowerCase()}-neu-${Date.now()}-${i}`,
        kategorie: antrag.kategorie,
        name:
          gesamtAnzahlNachBewilligung > 1
            ? `${antrag.produktname} #${vorhandeneAnzahl + i + 1}`
            : antrag.produktname,
      }))

      return {
        ...state,
        venue: {
          ...state.venue,
          budget: state.venue.budget - antrag.anschaffungskosten,
          equipmentBestand: [...state.venue.equipmentBestand, ...neueItems],
        },
        equipmentAntraege: state.equipmentAntraege.filter((a) => a.id !== action.id),
      }
    }

    case 'EQUIPMENT_ANTRAG_ABLEHNEN':
      return {
        ...state,
        equipmentAntraege: state.equipmentAntraege.filter((a) => a.id !== action.id),
      }

    case 'BEWERBUNG_ANNEHMEN': {
      const bewerbung = state.bewerbungen.find((b) => b.id === action.id)
      if (!bewerbung) return state

      const neuerTechniker: Techniker = {
        name: bewerbung.name,
        rolle: bewerbung.rolle,
        stufe: bewerbung.stufe,
        erfahrung: bewerbung.erfahrung,
        verfügbar: true,
        wochenstunden: 40,
        verplanteStunden: 0,
        moral: 70,
        gehalt: bewerbung.gehaltsforderung,
      }

      return {
        ...state,
        techniker: [...state.techniker, neuerTechniker],
        bewerbungen: state.bewerbungen.filter((b) => b.id !== action.id),
      }
    }

    case 'BEWERBUNG_ABLEHNEN':
      return {
        ...state,
        bewerbungen: state.bewerbungen.filter((b) => b.id !== action.id),
      }

    case 'KUENDIGUNG_AKZEPTIEREN': {
      const antrag = state.kuendigungsantraege.find((k) => k.id === action.id)
      if (!antrag) return state

      return {
        ...state,
        techniker: state.techniker.filter((t) => t.name !== antrag.technikerName),
        kuendigungsantraege: state.kuendigungsantraege.filter((k) => k.id !== action.id),
      }
    }

    case 'KUENDIGUNG_ABLEHNEN':
      // Techniker bleibt unverändert - der Spieler hat sich entschieden, ihn zu halten.
      return {
        ...state,
        kuendigungsantraege: state.kuendigungsantraege.filter((k) => k.id !== action.id),
      }

    default:
      return state
  }
}

interface GameContextValue extends GameState {
  /** Aus tagesUhr.tag abgeleitet (siehe ermittleWoche) - immer konsistent mit dem aktuellen Tag. */
  woche: number
  annehmen: (act: string) => void
  ablehnen: (act: string) => void
  openStaffing: (act: string) => void
  assignTechniker: (act: string, rolle: TechnikerRolle, name: string | null) => void
  assignVerleiher: (act: string, kategorie: EquipmentKategorie, name: string | null) => void
  toggleÜberstunden: (act: string, rolle: TechnikerRolle, aktiv: boolean) => void
  resolveShow: (act: string) => void
  /** Fortschritts-Tick der Spieluhr; von einem globalen Interval regelmäßig aufzurufen. */
  tickAblauf: () => void
  soundcheckBestätigen: () => void
  soundcheckAbbrechen: () => void
  ereignisReagieren: (reaktion: 'A' | 'B') => void
  /** Setzt den Zeitraffer (1x/2x) - nahtlos ohne Zeitsprung, siehe TEMPO_SETZEN. */
  tempoSetzen: (tempo: 1 | 2) => void
  /** Mini-Entscheidung während Aufbau/Abbau: +2 Moral fürs Team, ohne Kosten. Nur einmal pro Ablauf nutzbar. */
  miniEntscheidungBriefing: () => void
  /** Mini-Entscheidung während Aufbau/Abbau: +5 Moral fürs Team für 50€. Nur einmal pro Ablauf nutzbar. */
  miniEntscheidungPause: () => void
  backToDashboard: () => void
  entlassen: (name: string) => void
  speichern: () => void
  equipmentAntragBewilligen: (id: string) => void
  equipmentAntragAblehnen: (id: string) => void
  bewerbungAnnehmen: (id: string) => void
  bewerbungAblehnen: (id: string) => void
  kuendigungAkzeptieren: (id: string) => void
  kuendigungAblehnen: (id: string) => void
  activeShow: Anfrage | null
  /** Summe der wöchentlichen Gehälter aller aktuellen Techniker (Abzug beim nächsten automatischen Wochenabschluss). */
  wochenGehaltssumme: number
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: GameState
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState ?? baueNeuenSpielstand())

  const value = useMemo<GameContextValue>(() => {
    const activeShow = state.shows.find((s) => s.act === state.activeShowAct) ?? null
    const wochenGehaltssumme = state.techniker.reduce((summe, t) => summe + t.gehalt, 0)
    return {
      ...state,
      woche: ermittleWoche(state.tagesUhr.tag),
      activeShow,
      wochenGehaltssumme,
      annehmen: (act) => dispatch({ type: 'ANNEHMEN', act }),
      ablehnen: (act) => dispatch({ type: 'ABLEHNEN', act }),
      openStaffing: (act) => dispatch({ type: 'OPEN_STAFFING', act }),
      assignTechniker: (act, rolle, name) =>
        dispatch({ type: 'ASSIGN_TECHNIKER', act, rolle, name }),
      assignVerleiher: (act, kategorie, name) =>
        dispatch({ type: 'ASSIGN_VERLEIHER', act, kategorie, name }),
      toggleÜberstunden: (act, rolle, aktiv) =>
        dispatch({ type: 'TOGGLE_ÜBERSTUNDEN', act, rolle, aktiv }),
      resolveShow: (act) => {
        const show = state.shows.find((s) => s.act === act)
        if (!show) return

        const aufbauStartMinute = ermittleAktuelleMinute(state.tagesUhr)
        const aufbauEndeMinute = aufbauStartMinute + AUFBAU_DAUER_MINUTEN
        const soundcheckMinute = Math.max(SOUNDCHECK_FIXE_MINUTE, aufbauEndeMinute)
        const showStartMinute = Math.max(SHOW_START_FIXE_MINUTE, soundcheckMinute)
        const showEndeMinute = showStartMinute + SHOW_DAUER_MINUTEN
        const abbauEndeMinute = showEndeMinute + ABBAU_DAUER_MINUTEN

        const ereignisZeitpunkte = {
          aufbau: aufbauStartMinute + (aufbauEndeMinute - aufbauStartMinute) * (0.2 + Math.random() * 0.6),
          show: showStartMinute + (showEndeMinute - showStartMinute) * (0.2 + Math.random() * 0.6),
          abbau: showEndeMinute + (abbauEndeMinute - showEndeMinute) * (0.2 + Math.random() * 0.6),
        }

        dispatch({
          type: 'ABLAUF_STARTEN',
          act,
          aufbauEndeMinute,
          soundcheckMinute,
          showStartMinute,
          showEndeMinute,
          abbauEndeMinute,
          ereignisZeitpunkte,
        })
      },
      tickAblauf: () => dispatch({ type: 'TICK' }),
      soundcheckBestätigen: () => dispatch({ type: 'SOUNDCHECK_BESTÄTIGEN' }),
      soundcheckAbbrechen: () => dispatch({ type: 'SOUNDCHECK_ABBRECHEN' }),
      ereignisReagieren: (reaktion) => dispatch({ type: 'EREIGNIS_REAGIEREN', reaktion }),
      tempoSetzen: (tempo) => dispatch({ type: 'TEMPO_SETZEN', tempo }),
      miniEntscheidungBriefing: () => dispatch({ type: 'MINI_ENTSCHEIDUNG_BRIEFING' }),
      miniEntscheidungPause: () => dispatch({ type: 'MINI_ENTSCHEIDUNG_PAUSE' }),
      backToDashboard: () => dispatch({ type: 'BACK_TO_DASHBOARD' }),
      entlassen: (name) => dispatch({ type: 'ENTLASSEN', name }),
      equipmentAntragBewilligen: (id) => dispatch({ type: 'EQUIPMENT_ANTRAG_BEWILLIGEN', id }),
      equipmentAntragAblehnen: (id) => dispatch({ type: 'EQUIPMENT_ANTRAG_ABLEHNEN', id }),
      bewerbungAnnehmen: (id) => dispatch({ type: 'BEWERBUNG_ANNEHMEN', id }),
      bewerbungAblehnen: (id) => dispatch({ type: 'BEWERBUNG_ABLEHNEN', id }),
      kuendigungAkzeptieren: (id) => dispatch({ type: 'KUENDIGUNG_AKZEPTIEREN', id }),
      kuendigungAblehnen: (id) => dispatch({ type: 'KUENDIGUNG_ABLEHNEN', id }),
      speichern: () => {
        try {
          const spielstand: GespeicherterSpielstand = {
            venue: state.venue,
            techniker: state.techniker,
            verleiher: state.verleiher,
            shows: state.shows,
            minusWochenInFolge: state.minusWochenInFolge,
            zwangsentlassungAusstehend: state.zwangsentlassungAusstehend,
            tagesUhr: state.tagesUhr,
            schemaVersion: SPIELSTAND_SCHEMA_VERSION,
            equipmentAntraege: state.equipmentAntraege,
            bewerbungen: state.bewerbungen,
            kuendigungsantraege: state.kuendigungsantraege,
          }
          localStorage.setItem(SPIELSTAND_KEY, JSON.stringify(spielstand))
        } catch (error) {
          console.error('Spielstand konnte nicht gespeichert werden:', error)
        }
      },
    }
  }, [state])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame muss innerhalb von GameProvider verwendet werden')
  }
  return context
}
