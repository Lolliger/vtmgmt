import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StartScreenProps {
  onFortsetzen: () => void
  onNeuesSpiel: () => void
}

export function StartScreen({ onFortsetzen, onNeuesSpiel }: StartScreenProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8 sm:px-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Venue Manager</CardTitle>
          <CardDescription>Es wurde ein gespeicherter Spielstand gefunden.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={onFortsetzen}>Fortsetzen</Button>
          <Button variant="outline" onClick={onNeuesSpiel}>
            Neues Spiel starten
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
