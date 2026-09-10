import { Dashboard } from '@/components/screens/Dashboard'
import { GameProvider } from '@/state/GameContext'

function App() {
  return (
    <GameProvider>
      <div className="min-h-svh bg-muted/30 px-4 py-8 sm:px-8">
        <Dashboard />
      </div>
    </GameProvider>
  )
}

export default App
