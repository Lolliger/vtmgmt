import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { anfragen, techniker, venue, verleiher } from '@/data/dummyData'
import {
  berechneAuflösung,
  berechneAuswirkungen,
  geschätzteShowStunden,
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

export { geschätzteShowStunden }

export type View = 'dashboard' | 'staffing' | 'auflösung'

export interface AuflösungsAnzeige {
  ergebnis: AuflösungsErgebnis
  auswirkungen: string[]
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
  | { type: 'RESOLVE_SHOW'; act: string }
  | { type: 'TOGGLE_ÜBERSTUNDEN'; act: string; rolle: TechnikerRolle; aktiv: boolean }
  | { type: 'BACK_TO_DASHBOARD' }
  | { type: 'WOCHE_ABSCHLIESSEN' }
  | { type: 'ENTLASSEN'; name: string }

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
  schemaVersion: number
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
      // Fehlen bei älteren Spielständen ohne diese Felder - mit Default auffüllen.
      minusWochenInFolge:
        typeof geparst.minusWochenInFolge === 'number' ? geparst.minusWochenInFolge : 0,
      zwangsentlassungAusstehend:
        typeof geparst.zwangsentlassungAusstehend === 'boolean'
          ? geparst.zwangsentlassungAusstehend
          : false,
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

    case 'RESOLVE_SHOW': {
      const show = state.shows.find((s) => s.act === action.act)
      if (!show) return state

      const ergebnis = berechneAuflösung(show, state.techniker, state.verleiher, state.venue)
      const {
        venue: neuesVenue,
        techniker: neueTechniker,
        verleiher: neueVerleiher,
        auswirkungen,
      } = berechneAuswirkungen(show, ergebnis, state.venue, state.techniker, state.verleiher)

      return {
        ...state,
        venue: neuesVenue,
        techniker: neueTechniker,
        verleiher: neueVerleiher,
        shows: updateShow(state.shows, action.act, (s) => ({
          ...s,
          status: 'aufgelöst',
          ergebnis: ergebnis.kategorie,
        })),
        view: 'auflösung',
        letzteAuflösung: { ergebnis, auswirkungen },
      }
    }

    case 'BACK_TO_DASHBOARD':
      return {
        ...state,
        view: 'dashboard',
        activeShowAct: null,
        letzteAuflösung: null,
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
      resolveShow: (act) => dispatch({ type: 'RESOLVE_SHOW', act }),
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
