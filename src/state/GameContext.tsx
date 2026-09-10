import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { anfragen, techniker, venue, verleiher } from '@/data/dummyData'
import type { Anfrage, Ergebnis, Techniker, TechnikerRolle, Venue, Verleiher } from '@/types'

export type View = 'dashboard' | 'staffing' | 'auflösung'

export interface AuflösungsAnzeige {
  ergebnis: {
    staffingScore: number
    verleiherScore: number
    zufallsfaktor: number
    gesamtpunktzahl: number
    kategorie: Ergebnis
    begründung: string
  }
  auswirkungen: string[]
}

interface GameState {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  shows: Anfrage[]
  view: View
  activeShowAct: string | null
  letzteAuflösung: AuflösungsAnzeige | null
}

type GameAction =
  | { type: 'ANNEHMEN'; act: string }
  | { type: 'ABLEHNEN'; act: string }
  | { type: 'OPEN_STAFFING'; act: string }
  | { type: 'ASSIGN_TECHNIKER'; act: string; rolle: TechnikerRolle; name: string | null }
  | { type: 'ASSIGN_VERLEIHER'; act: string; name: string | null }
  | { type: 'RESOLVE_SHOW'; act: string }
  | { type: 'BACK_TO_DASHBOARD' }

const initialState: GameState = {
  venue,
  techniker,
  verleiher,
  shows: anfragen,
  view: 'dashboard',
  activeShowAct: null,
  letzteAuflösung: null,
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
          gewählterVerleiher: action.name,
        })),
      }

    case 'RESOLVE_SHOW': {
      const show = state.shows.find((s) => s.act === action.act)
      if (!show) return state

      // TODO (Schritt 3): echte Berechnung über logic/showAuflösung.ts statt Platzhalter.
      const platzhalterErgebnis: AuflösungsAnzeige = {
        ergebnis: {
          staffingScore: 0,
          verleiherScore: 0,
          zufallsfaktor: 0,
          gesamtpunktzahl: 0,
          kategorie: 'mittel',
          begründung: 'Auflösung wird berechnet (folgt in Schritt 3).',
        },
        auswirkungen: [],
      }

      return {
        ...state,
        shows: updateShow(state.shows, action.act, (s) => ({
          ...s,
          status: 'aufgelöst',
          ergebnis: platzhalterErgebnis.ergebnis.kategorie,
        })),
        view: 'auflösung',
        letzteAuflösung: platzhalterErgebnis,
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
  assignVerleiher: (act: string, name: string | null) => void
  resolveShow: (act: string) => void
  backToDashboard: () => void
  activeShow: Anfrage | null
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

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
      assignVerleiher: (act, name) => dispatch({ type: 'ASSIGN_VERLEIHER', act, name }),
      resolveShow: (act) => dispatch({ type: 'RESOLVE_SHOW', act }),
      backToDashboard: () => dispatch({ type: 'BACK_TO_DASHBOARD' }),
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
