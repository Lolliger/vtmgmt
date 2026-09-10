import { Badge } from '@/components/ui/badge'
import {
  GENRE_ANFORDERUNGEN,
  type RollenAnforderung,
  type Schwierigkeit,
} from '@/data/genreAnforderungen'
import type { Genre, TechnikerRolle } from '@/types'

const schwierigkeitVariant: Record<Schwierigkeit, 'outline' | 'secondary' | 'default'> = {
  niedrig: 'outline',
  mittel: 'secondary',
  hoch: 'default',
}

export function RollenAnforderungenListe({ genre }: { genre: Genre }) {
  const rollen = Object.entries(GENRE_ANFORDERUNGEN[genre].rollen) as [
    TechnikerRolle,
    RollenAnforderung,
  ][]

  return (
    <ul className="flex flex-wrap gap-1.5">
      {rollen.map(([rolle, anforderung]) => (
        <li key={rolle}>
          <Badge variant={schwierigkeitVariant[anforderung.schwierigkeit]}>
            {rolle} · {anforderung.schwierigkeit}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
