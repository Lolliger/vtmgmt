import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { anfragen, techniker, venue, verleiher } from '@/data/dummyData'
import type { Anfrage, Techniker, Venue, Verleiher } from '@/types'

interface GameState {
  venue: Venue
  techniker: Techniker[]
  verleiher: Verleiher[]
  shows: Anfrage[]
}

type GameAction = { type: 'ANNEHMEN'; act: string } | { type: 'ABLEHNEN'; act: string }

const initialState: GameState = {
  venue,
  techniker,
  verleiher,
  shows: anfragen,
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

    default:
      return state
  }
}

interface GameContextValue extends GameState {
  annehmen: (act: string) => void
  ablehnen: (act: string) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      annehmen: (act) => dispatch({ type: 'ANNEHMEN', act }),
      ablehnen: (act) => dispatch({ type: 'ABLEHNEN', act }),
    }),
    [state]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame muss innerhalb von GameProvider verwendet werden')
  }
  return context
}
