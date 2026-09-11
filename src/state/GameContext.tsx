import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { anfragen, techniker, venue, verleiher } from '@/data/dummyData'
import {
  ermittleEreignisFürPhase,
  type Ereignis,
  type EreignisEffekt,
  type EreignisPhase,
} from '@/logic/ereignisse'
import {
  berechneAuflösung,
  berechneAuswirkungen,
  geschätzteShowStunden,
  phasenStunden,
  type AuflösungsErgebnis,
} from '@/logic/showAuflösung'
import type {
  Anfrage,
  EquipmentKategorie,
  Techniker,
  TechnikerRolle,
  Venue,
  Verleiher,
} from '@/types'

export { geschätzteShowStunden, phasenStunden }

export type View = 'dashboard' | 'staffing' | 'ablauf' | 'ereignis' | 'auflösung'

const GUT_SCHWELLE = 80
const MITTEL_SCHWELLE = 50

/** Tempo der simulierten Show-Uhr: 1 Spielminute = 0,5 Echtsekunden. */
export const SEKUNDEN_PRO_SPIELSTUNDE = 30

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta}`
}

/** Ein während des Ablaufs gesammeltes Ereignis samt Effekt, bis zur finalen Auflösung. */
export interface GesammeltesEreignis {
  effekt: EreignisEffekt
  beschreibung: string
  phase: EreignisPhase
}

/**
 * Laufzeit-Status eines aktiven Show-Ablaufs (Aufbau → Soundcheck-Gate → Show →
 * Abbau → Auflösung). Wird NICHT persistiert (wie aktivesEreignis) - beim Laden/
 * Neustart immer null. Die Uhr läuft rein zeitbasiert (Date.now()), unabhängig
 * von der aktuell angezeigten View.
 */
export interface AblaufStatus {
  act: string
  /** Date.now() ms bei Start; wird bei Pausen um die Pausendauer nach vorne verschoben. */
  startZeitpunkt: number
  /** Date.now() ms, seit dem pausiert ist (Reaktion/Soundcheck aussteht), sonst null. */
  pausiertSeit: number | null
  pausierGrund: 'soundcheck' | 'ereignis' | null
  /** Kumulierte Sekunden seit Start, an denen die jeweilige Phase endet. */
  aufbauEndeSekunde: number
  showEndeSekunde: number
  abbauEndeSekunde: number
  /** Zufälliger Zeitpunkt (Sekunden seit Start) für den Ereignis-Check je Phase. */
  ereignisZeitpunkte: { aufbau: number; show: number; abbau: number }
  ereignisGeprüft: { aufbau: boolean; show: boolean; abbau: boolean }
  soundcheckBestätigt: boolean
  gesammelteEreignisse: GesammeltesEreignis[]
  /** Phase, zu der ein aktuell aktives Reaktions-Ereignis (aktivesEreignis) gehört. */
  aktuellePhaseFürEreignis: EreignisPhase | null
}

export interface AuflösungsAnzeige {
  ergebnis: AuflösungsErgebnis
  auswirkungen: string[]
}

/**
 * Durchgehende Tag/Nacht-Uhr, die UNABHÄNGIG vom ablaufStatus einer einzelnen
 * Show das ganze Spiel über läuft. Ein Spieltag beginnt um 9:00 Uhr und
 * dauert 360 Echtsekunden (12 Spielstunden * SEKUNDEN_PRO_SPIELSTUNDE) bis
 * 21:00 Uhr, gefolgt von einem kurzen Blackout, bevor der nächste Tag wieder
 * um 9:00 Uhr beginnt. Läuft eine Show gerade im Ablauf (ablaufStatus !==
 * null), wenn 21:00 erreicht würde, PAUSIERT der Tageswechsel, bis die Show
 * fertig ist (siehe tickTag()).
 */
export interface TagesUhr {
  /** Beginnt bei 1. */
  tag: number
  /** Date.now() ms, wann der aktuelle Tag um 9:00 begonnen hat. */
  tagStartZeitpunkt: number
  /** Date.now() ms, bis wann der Blackout dauert. null = kein Blackout aktiv. */
  blackoutBis: number | null
}

const TAG_START_STUNDE = 9
const TAG_ENDE_SEKUNDEN = 360
const BLACKOUT_DAUER_MS = 3000

function baueNeueTagesUhr(): TagesUhr {
  return { tag: 1, tagStartZeitpunkt: Date.now(), blackoutBis: null }
}

/**
 * Leitet aus tagesUhr die aktuelle Uhrzeit-of-day (9:00 + vergangene
 * Spielstunden) ab, sowie ob gerade Blackout (Nacht/Schlafen) aktiv ist.
 * Rein für die Anzeige - trifft keine Spiel-Entscheidungen.
 */
export function ermittleTagesUhrzeit(tagesUhr: TagesUhr): {
  stunde: number
  minute: number
  istBlackout: boolean
} {
  if (tagesUhr.blackoutBis !== null) {
    return { stunde: TAG_START_STUNDE + TAG_ENDE_SEKUNDEN / SEKUNDEN_PRO_SPIELSTUNDE, minute: 0, istBlackout: true }
  }

  const vergangeneSekundenHeute = (Date.now() - tagesUhr.tagStartZeitpunkt) / 1000
  const stundenSeitTagStart = Math.min(
    vergangeneSekundenHeute / SEKUNDEN_PRO_SPIELSTUNDE,
    TAG_ENDE_SEKUNDEN / SEKUNDEN_PRO_SPIELSTUNDE
  )
  const gesamtMinuten = TAG_START_STUNDE * 60 + stundenSeitTagStart * 60
  const stunde = Math.floor(gesamtMinuten / 60)
  const minute = Math.floor(gesamtMinuten % 60)
  return { stunde, minute, istBlackout: false }
}

export interface GameState {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  shows: Anfrage[]
  woche: number
  view: View
  activeShowAct: string | null
  letzteAuflösung: AuflösungsAnzeige | null
  /** Anzahl aufeinanderfolgender Wochen, in denen das Budget nach Gehaltsabzug negativ war. */
  minusWochenInFolge: number
  /** true, wenn der Spieler eine Zwangsentlassung durchführen muss (siehe ENTLASSEN). */
  zwangsentlassungAusstehend: boolean
  /** Aktuell zur Reaktion anstehendes Zufallsereignis (view === 'ereignis'), sonst null. */
  aktivesEreignis: Ereignis | null
  /** Laufzeit-Status des aktiven Show-Ablaufs (Aufbau/Show/Abbau), sonst null. Nicht persistiert. */
  ablaufStatus: AblaufStatus | null
  /** Durchgehende Tag/Nacht-Uhr, unabhängig von ablaufStatus. Echter Spielfortschritt - wird persistiert. */
  tagesUhr: TagesUhr
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
  | { type: 'WOCHE_ABSCHLIESSEN' }
  | { type: 'ENTLASSEN'; name: string }
  | {
      type: 'ABLAUF_STARTEN'
      act: string
      aufbauEndeSekunde: number
      showEndeSekunde: number
      abbauEndeSekunde: number
      ereignisZeitpunkte: { aufbau: number; show: number; abbau: number }
    }
  | { type: 'SOUNDCHECK_ERREICHT' }
  | { type: 'SOUNDCHECK_BESTÄTIGEN' }
  | { type: 'SOUNDCHECK_ABBRECHEN' }
  | { type: 'EREIGNIS_GEPRÜFT'; phase: EreignisPhase }
  | {
      type: 'EREIGNIS_AUTOMATISCH_ANGEWENDET'
      phase: EreignisPhase
      beschreibung: string
      effekt: EreignisEffekt
    }
  | { type: 'EREIGNIS_AUFGETRETEN'; ereignis: Ereignis; phase: EreignisPhase }
  | { type: 'EREIGNIS_REAGIEREN'; reaktion: 'A' | 'B' }
  | { type: 'ABLAUF_ABSCHLIESSEN' }
  | { type: 'TICK_TAG' }

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
  woche: number
  minusWochenInFolge: number
  zwangsentlassungAusstehend: boolean
  tagesUhr: TagesUhr
  schemaVersion: number
}

function istGültigeTagesUhr(value: unknown): value is TagesUhr {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.tag === 'number' &&
    typeof v.tagStartZeitpunkt === 'number' &&
    (v.blackoutBis === null || typeof v.blackoutBis === 'number')
  )
}

function istGespeicherterSpielstand(value: unknown): value is GespeicherterSpielstand {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    v.venue !== undefined &&
    Array.isArray(v.techniker) &&
    Array.isArray(v.verleiher) &&
    Array.isArray(v.shows) &&
    typeof v.woche === 'number'
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
    woche: 1,
    view: 'dashboard',
    activeShowAct: null,
    letzteAuflösung: null,
    minusWochenInFolge: 0,
    zwangsentlassungAusstehend: false,
    aktivesEreignis: null,
    ablaufStatus: null,
    tagesUhr: baueNeueTagesUhr(),
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
 * sondern immer frisch gesetzt.
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
      woche: geparst.woche,
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
      tagesUhr: istGültigeTagesUhr(geparst.tagesUhr) ? geparst.tagesUhr : baueNeueTagesUhr(),
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
 * aufgetretenen Zufallsereignisse. Wird von ABLAUF_ABSCHLIESSEN aufgerufen,
 * nachdem alle drei Phasen durchlaufen wurden. Ohne Ereignisse (leeres Array,
 * Default) ist das Ergebnis identisch zur reinen Basis-Auflösung.
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

  return {
    ...state,
    venue: neuesVenue,
    techniker: neueTechniker,
    verleiher: neueVerleiher,
    shows: updateShow(state.shows, act, (s) => ({
      ...s,
      status: 'aufgelöst',
      ergebnis: ergebnis.kategorie,
    })),
    view: 'auflösung',
    letzteAuflösung: { ergebnis, auswirkungen },
    aktivesEreignis: null,
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

    case 'ABLAUF_STARTEN':
      return {
        ...state,
        activeShowAct: action.act,
        view: 'ablauf',
        ablaufStatus: {
          act: action.act,
          startZeitpunkt: Date.now(),
          pausiertSeit: null,
          pausierGrund: null,
          aufbauEndeSekunde: action.aufbauEndeSekunde,
          showEndeSekunde: action.showEndeSekunde,
          abbauEndeSekunde: action.abbauEndeSekunde,
          ereignisZeitpunkte: action.ereignisZeitpunkte,
          ereignisGeprüft: { aufbau: false, show: false, abbau: false },
          soundcheckBestätigt: false,
          gesammelteEreignisse: [],
          aktuellePhaseFürEreignis: null,
        },
      }

    case 'SOUNDCHECK_ERREICHT': {
      if (!state.ablaufStatus) return state
      return {
        ...state,
        ablaufStatus: {
          ...state.ablaufStatus,
          pausiertSeit: Date.now(),
          pausierGrund: 'soundcheck',
        },
      }
    }

    case 'SOUNDCHECK_BESTÄTIGEN': {
      if (!state.ablaufStatus || state.ablaufStatus.pausiertSeit === null) return state
      return {
        ...state,
        ablaufStatus: {
          ...state.ablaufStatus,
          soundcheckBestätigt: true,
          startZeitpunkt:
            state.ablaufStatus.startZeitpunkt + (Date.now() - state.ablaufStatus.pausiertSeit),
          pausiertSeit: null,
          pausierGrund: null,
        },
      }
    }

    case 'SOUNDCHECK_ABBRECHEN':
      return { ...state, ablaufStatus: null, view: 'staffing' }

    case 'EREIGNIS_GEPRÜFT': {
      if (!state.ablaufStatus) return state
      return {
        ...state,
        ablaufStatus: {
          ...state.ablaufStatus,
          ereignisGeprüft: { ...state.ablaufStatus.ereignisGeprüft, [action.phase]: true },
        },
      }
    }

    case 'EREIGNIS_AUTOMATISCH_ANGEWENDET': {
      if (!state.ablaufStatus) return state
      return {
        ...state,
        ablaufStatus: {
          ...state.ablaufStatus,
          ereignisGeprüft: { ...state.ablaufStatus.ereignisGeprüft, [action.phase]: true },
          gesammelteEreignisse: [
            ...state.ablaufStatus.gesammelteEreignisse,
            { effekt: action.effekt, beschreibung: action.beschreibung, phase: action.phase },
          ],
        },
      }
    }

    case 'EREIGNIS_AUFGETRETEN': {
      if (!state.ablaufStatus) return state
      return {
        ...state,
        aktivesEreignis: action.ereignis,
        view: 'ereignis',
        ablaufStatus: {
          ...state.ablaufStatus,
          ereignisGeprüft: { ...state.ablaufStatus.ereignisGeprüft, [action.phase]: true },
          pausiertSeit: Date.now(),
          pausierGrund: 'ereignis',
          aktuellePhaseFürEreignis: action.phase,
        },
      }
    }

    case 'EREIGNIS_REAGIEREN': {
      const ereignis = state.aktivesEreignis
      if (!ereignis) return state
      if (!state.ablaufStatus || state.ablaufStatus.pausiertSeit === null) return state

      const reaktion = action.reaktion === 'A' ? ereignis.reaktionA : ereignis.reaktionB
      const phase = state.ablaufStatus.aktuellePhaseFürEreignis ?? 'aufbau'

      return {
        ...state,
        aktivesEreignis: null,
        view: 'ablauf',
        ablaufStatus: {
          ...state.ablaufStatus,
          startZeitpunkt:
            state.ablaufStatus.startZeitpunkt + (Date.now() - state.ablaufStatus.pausiertSeit),
          pausiertSeit: null,
          pausierGrund: null,
          aktuellePhaseFürEreignis: null,
          gesammelteEreignisse: [
            ...state.ablaufStatus.gesammelteEreignisse,
            { effekt: reaktion.effekt, beschreibung: ereignis.beschreibung, phase },
          ],
        },
      }
    }

    case 'TICK_TAG': {
      const { tagesUhr } = state

      if (tagesUhr.blackoutBis !== null) {
        // Blackout läuft - erst beenden (neuer Tag beginnt), wenn die Dauer um ist.
        if (Date.now() >= tagesUhr.blackoutBis) {
          return {
            ...state,
            tagesUhr: { tag: tagesUhr.tag + 1, tagStartZeitpunkt: Date.now(), blackoutBis: null },
          }
        }
        return state
      }

      const vergangeneSekundenHeute = (Date.now() - tagesUhr.tagStartZeitpunkt) / 1000
      if (vergangeneSekundenHeute >= TAG_ENDE_SEKUNDEN) {
        // 21:00 erreicht - Blackout nur starten, wenn gerade keine Show im Ablauf ist.
        // Läuft eine Show noch, wird hier einfach nichts getan und beim nächsten Tick
        // erneut geprüft, bis die Show fertig ist (kein Tageswechsel mitten in der Show).
        if (state.ablaufStatus === null) {
          return {
            ...state,
            tagesUhr: { ...tagesUhr, blackoutBis: Date.now() + BLACKOUT_DAUER_MS },
          }
        }
      }
      return state
    }

    case 'ABLAUF_ABSCHLIESSEN': {
      if (!state.ablaufStatus) return state
      const neuerState = führeShowAuflösungDurch(
        state,
        state.ablaufStatus.act,
        state.ablaufStatus.gesammelteEreignisse
      )
      return { ...neuerState, ablaufStatus: null }
    }

    case 'BACK_TO_DASHBOARD':
      return {
        ...state,
        view: 'dashboard',
        activeShowAct: null,
        letzteAuflösung: null,
        aktivesEreignis: null,
      }

    case 'WOCHE_ABSCHLIESSEN': {
      const gehaltssumme = state.techniker.reduce((summe, t) => summe + t.gehalt, 0)
      const neuesBudget = state.venue.budget - gehaltssumme

      const minusWochenInFolge = neuesBudget < 0 ? state.minusWochenInFolge + 1 : 0

      // Reputationsverlust nur genau beim Erreichen der zweiten Minus-Woche in Folge,
      // nicht bei jeder weiteren Woche danach.
      const reputation =
        minusWochenInFolge === 2
          ? Math.max(0, state.venue.reputation - 5)
          : state.venue.reputation

      // Bleibt true, bis eine Entlassung erfolgt (siehe ENTLASSEN) - wird hier also nicht
      // zurückgesetzt, falls bereits ausstehend.
      const zwangsentlassungAusstehend =
        state.zwangsentlassungAusstehend || minusWochenInFolge >= 3

      return {
        ...state,
        woche: state.woche + 1,
        techniker: state.techniker.map((t) => ({ ...t, verplanteStunden: 0 })),
        venue: { ...state.venue, budget: neuesBudget, reputation },
        minusWochenInFolge,
        zwangsentlassungAusstehend,
      }
    }

    case 'ENTLASSEN': {
      // Nur relevant, wenn tatsächlich eine Zwangsentlassung aussteht (siehe
      // WOCHE_ABSCHLIESSEN). Ohne ausstehende Krise bleibt der Techniker-Bestand
      // unverändert, statt versehentlich freiwillige Entlassungen zuzulassen.
      if (!state.zwangsentlassungAusstehend) return state

      return {
        ...state,
        techniker: state.techniker.filter((t) => t.name !== action.name),
        minusWochenInFolge: 0,
        zwangsentlassungAusstehend: false,
      }
    }

    default:
      return state
  }
}

interface GameContextValue extends GameState {
  annehmen: (act: string) => void
  ablehnen: (act: string) => void
  openStaffing: (act: string) => void
  assignTechniker: (act: string, rolle: TechnikerRolle, name: string | null) => void
  assignVerleiher: (act: string, kategorie: EquipmentKategorie, name: string | null) => void
  toggleÜberstunden: (act: string, rolle: TechnikerRolle, aktiv: boolean) => void
  resolveShow: (act: string) => void
  /** Fortschritts-Tick der Show-Uhr; von einem globalen Interval regelmäßig aufzurufen. */
  tickAblauf: () => void
  soundcheckBestätigen: () => void
  soundcheckAbbrechen: () => void
  ereignisReagieren: (reaktion: 'A' | 'B') => void
  backToDashboard: () => void
  wocheAbschliessen: () => void
  entlassen: (name: string) => void
  speichern: () => void
  activeShow: Anfrage | null
  /** Summe der wöchentlichen Gehälter aller aktuellen Techniker (Abzug bei nächstem wocheAbschliessen()). */
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

        const { aufbau, show: showStunden, abbau } = phasenStunden(show)
        const aufbauSek = aufbau * SEKUNDEN_PRO_SPIELSTUNDE
        const showSek = showStunden * SEKUNDEN_PRO_SPIELSTUNDE
        const abbauSek = abbau * SEKUNDEN_PRO_SPIELSTUNDE

        const aufbauEndeSekunde = aufbauSek
        const showEndeSekunde = aufbauSek + showSek
        const abbauEndeSekunde = aufbauSek + showSek + abbauSek

        const ereignisZeitpunkte = {
          aufbau: aufbauSek * (0.2 + Math.random() * 0.6),
          show: aufbauSek + showSek * (0.2 + Math.random() * 0.6),
          abbau: aufbauSek + showSek + abbauSek * (0.2 + Math.random() * 0.6),
        }

        dispatch({
          type: 'ABLAUF_STARTEN',
          act,
          aufbauEndeSekunde,
          showEndeSekunde,
          abbauEndeSekunde,
          ereignisZeitpunkte,
        })
      },
      tickAblauf: () => {
        // Tages-Uhr läuft unabhängig vom Show-Ablauf immer mit - deshalb VOR dem
        // early return unten, das nur die show-bezogene Ablauf-Logik betrifft.
        dispatch({ type: 'TICK_TAG' })

        const status = state.ablaufStatus
        if (!status || status.pausiertSeit !== null) return

        const vergangeneSekunden = (Date.now() - status.startZeitpunkt) / 1000

        // Soundcheck-Gate: Aufbau vorbei, aber noch nicht bestätigt -> pausieren.
        if (
          vergangeneSekunden >= status.aufbauEndeSekunde &&
          !status.soundcheckBestätigt &&
          status.pausierGrund === null
        ) {
          dispatch({ type: 'SOUNDCHECK_ERREICHT' })
          return
        }

        // Aktuelle Phase ermitteln (show/abbau erst nach bestätigtem Soundcheck erreichbar).
        let phase: EreignisPhase | 'fertig'
        if (vergangeneSekunden < status.aufbauEndeSekunde) {
          phase = 'aufbau'
        } else if (!status.soundcheckBestätigt) {
          // Aufbau fertig, wartet auf Soundcheck-Bestätigung - nichts weiter zu tun.
          return
        } else if (vergangeneSekunden < status.showEndeSekunde) {
          phase = 'show'
        } else if (vergangeneSekunden < status.abbauEndeSekunde) {
          phase = 'abbau'
        } else {
          phase = 'fertig'
        }

        if (phase !== 'fertig') {
          const ereignisZeitpunkt = status.ereignisZeitpunkte[phase]
          const bereitsGeprüft = status.ereignisGeprüft[phase]
          if (vergangeneSekunden >= ereignisZeitpunkt && !bereitsGeprüft) {
            const show = state.shows.find((s) => s.act === status.act)
            if (!show) return

            const ergebnis = ermittleEreignisFürPhase(
              phase,
              show,
              state.techniker,
              state.verleiher,
              state.venue
            )

            if (!ergebnis) {
              dispatch({ type: 'EREIGNIS_GEPRÜFT', phase })
            } else if (ergebnis.typ === 'automatisch') {
              dispatch({
                type: 'EREIGNIS_AUTOMATISCH_ANGEWENDET',
                phase,
                beschreibung: ergebnis.beschreibung,
                effekt: ergebnis.effekt,
              })
            } else {
              dispatch({ type: 'EREIGNIS_AUFGETRETEN', ereignis: ergebnis.ereignis, phase })
            }
            return
          }
        }

        if (phase === 'fertig' && status.pausierGrund === null) {
          dispatch({ type: 'ABLAUF_ABSCHLIESSEN' })
        }
      },
      soundcheckBestätigen: () => dispatch({ type: 'SOUNDCHECK_BESTÄTIGEN' }),
      soundcheckAbbrechen: () => dispatch({ type: 'SOUNDCHECK_ABBRECHEN' }),
      ereignisReagieren: (reaktion) => dispatch({ type: 'EREIGNIS_REAGIEREN', reaktion }),
      backToDashboard: () => dispatch({ type: 'BACK_TO_DASHBOARD' }),
      wocheAbschliessen: () => dispatch({ type: 'WOCHE_ABSCHLIESSEN' }),
      entlassen: (name) => dispatch({ type: 'ENTLASSEN', name }),
      speichern: () => {
        try {
          const spielstand: GespeicherterSpielstand = {
            venue: state.venue,
            techniker: state.techniker,
            verleiher: state.verleiher,
            shows: state.shows,
            woche: state.woche,
            minusWochenInFolge: state.minusWochenInFolge,
            zwangsentlassungAusstehend: state.zwangsentlassungAusstehend,
            tagesUhr: state.tagesUhr,
            schemaVersion: SPIELSTAND_SCHEMA_VERSION,
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
