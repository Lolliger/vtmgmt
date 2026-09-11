import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StartScreenProps {
  kompatibilitaet: 'kompatibel' | 'inkompatibel'
  onFortsetzen: () => void
  onNeuesSpiel: () => void
}

export function StartScreen({ kompatibilitaet, onFortsetzen, onNeuesSpiel }: StartScreenProps) {
  const istInkompatibel = kompatibilitaet === 'inkompatibel'

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8 sm:px-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Venue Manager</CardTitle>
          <CardDescription>
            {istInkompatibel
              ? 'Es wurde ein gespeicherter Spielstand gefunden, der nicht mehr unterstützt wird.'
              : 'Es wurde ein gespeicherter Spielstand gefunden.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {istInkompatibel ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Gespeicherter Spielstand ist inkompatibel (altes Format)
            </p>
          ) : (
            <Button onClick={onFortsetzen}>Fortsetzen</Button>
          )}
          <Button variant="outline" onClick={onNeuesSpiel}>
            Neues Spiel starten
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
