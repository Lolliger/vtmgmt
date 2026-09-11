import type { AblaufStatus } from '@/state/GameContext'

/**
 * Rein kosmetische Phasen-Ableitung für die Anzeige (Uhr, Fortschrittsbalken,
 * Flavor-Text). Trifft keine Spiel-Entscheidungen - die eigentliche
 * Phasenlogik (wann pausiert/aufgelöst wird) lebt in GameContext/tickAblauf.
 */
export type AblaufPhase = 'aufbau' | 'soundcheck' | 'show' | 'abbau'

export const PHASE_LABEL: Record<AblaufPhase, string> = {
  aufbau: 'Aufbau',
  soundcheck: 'Soundcheck',
  show: 'Show',
  abbau: 'Abbau',
}

/** Leitet aus Status + vergangenen Sekunden die aktuelle Phase für die Anzeige ab. */
export function ermittlePhase(status: AblaufStatus, vergangeneSekunden: number): AblaufPhase {
  if (vergangeneSekunden < status.aufbauEndeSekunde) return 'aufbau'
  if (!status.soundcheckBestätigt) return 'soundcheck'
  if (vergangeneSekunden < status.showEndeSekunde) return 'show'
  return 'abbau'
}

/** Fortschritt (0-100) der aktuellen Phase innerhalb ihres Zeitfensters. */
export function phasenFortschritt(status: AblaufStatus, vergangeneSekunden: number): number {
  const phase = ermittlePhase(status, vergangeneSekunden)

  let start: number
  let ende: number
  if (phase === 'aufbau') {
    start = 0
    ende = status.aufbauEndeSekunde
  } else if (phase === 'soundcheck') {
    return 100
  } else if (phase === 'show') {
    start = status.aufbauEndeSekunde
    ende = status.showEndeSekunde
  } else {
    start = status.showEndeSekunde
    ende = status.abbauEndeSekunde
  }

  const dauer = ende - start
  if (dauer <= 0) return 100
  return Math.min(100, Math.max(0, ((vergangeneSekunden - start) / dauer) * 100))
}

/** Rotierender Flavor-Text je nach Fortschritt innerhalb der Phase - rein kosmetisch. */
export function ermittleFlavorText(phase: AblaufPhase, fortschritt: number): string | null {
  if (phase === 'aufbau') {
    if (fortschritt < 33) return 'Equipment wird angeliefert...'
    if (fortschritt < 66) return 'Bühne wird aufgebaut...'
    return 'Letzte Vorbereitungen laufen...'
  }
  if (phase === 'show') {
    if (fortschritt < 33) return 'Publikum strömt in die Halle...'
    if (fortschritt < 66) return 'Die Show läuft...'
    return 'Highlight-Momente auf der Bühne...'
  }
  if (phase === 'abbau') {
    return fortschritt < 50 ? 'Equipment wird abgebaut...' : 'Fahrzeuge werden beladen...'
  }
  return null
}

const START_STUNDE = 8

/**
 * Formatiert eine simulierte Spiel-Uhrzeit ("14:32 Uhr"), beginnend um 08:00
 * bei Ablauf-Start. `sekundenProSpielstunde` kommt aus GameContext
 * (SEKUNDEN_PRO_SPIELSTUNDE), damit die Anzeige nie vom echten Spieltempo
 * abweicht.
 */
export function formatSpielUhrzeit(
  vergangeneSekunden: number,
  sekundenProSpielstunde: number
): string {
  const stundenSeitStart = vergangeneSekunden / sekundenProSpielstunde
  const gesamtMinuten = START_STUNDE * 60 + stundenSeitStart * 60
  const minutenImTag = ((gesamtMinuten % 1440) + 1440) % 1440
  const stunde = Math.floor(minutenImTag / 60)
  const minute = Math.floor(minutenImTag % 60)
  return `${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')} Uhr`
}
