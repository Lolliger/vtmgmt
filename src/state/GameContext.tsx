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

export const SPIELSTAND_KEY = 'venue-manager-spielstand-v1'

interface GespeicherterSpielstand {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  shows: Anfrage[]
  woche: number
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
 * Lädt den gespeicherten Spielstand aus localStorage. Navigations-State
 * (view/activeShowAct/letzteAuflösung) wird bewusst NICHT wiederhergestellt,
 * sondern immer frisch gesetzt.
 * Gibt bei fehlendem Eintrag, Parse-Fehler oder fehlenden Feldern null zurück.
 */
export function ladeGespeichertenSpielstand(): GameState | null {
  try {
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

    case 'ASSIGN_TECHNIKER':
      return {
        ...state,
        shows: updateShow(state.shows, action.act, (show) => ({
          ...show,
          zugewieseneTechniker: {
            ...show.zugewieseneTechniker,
            [action.rolle]: action.name,
          },
        })),
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
  speichern: () => void
  activeShow: Anfrage | null
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
    return {
      ...state,
      activeShow,
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
      speichern: () => {
        try {
          const spielstand: GespeicherterSpielstand = {
            venue: state.venue,
            techniker: state.techniker,
            verleiher: state.verleiher,
            shows: state.shows,
            woche: state.woche,
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
