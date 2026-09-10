import { Badge } from '@/components/ui/badge'
import type { Schwierigkeit } from '@/data/genreAnforderungen'
import { benötigteRollen } from '@/logic/showAuflösung'
import type { Genre } from '@/types'

const schwierigkeitVariant: Record<Schwierigkeit, 'outline' | 'secondary' | 'default'> = {
  niedrig: 'outline',
  mittel: 'secondary',
  hoch: 'default',
}

export function RollenAnforderungenListe({ genre }: { genre: Genre }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {benötigteRollen(genre).map(([rolle, anforderung]) => (
        <li key={rolle}>
          <Badge variant={schwierigkeitVariant[anforderung.schwierigkeit]}>
            {rolle} · {anforderung.schwierigkeit}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
