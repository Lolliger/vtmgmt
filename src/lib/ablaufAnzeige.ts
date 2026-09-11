import { AUFBAU_DAUER_MINUTEN, type AblaufStatus } from '@/state/GameContext'

/**
 * Rein kosmetische Phasen-Ableitung für die Anzeige (Widget, Fortschrittsbalken,
 * Flavor-Text). Trifft keine Spiel-Entscheidungen - die eigentliche
 * Phasenlogik (wann pausiert/aufgelöst wird) lebt in GameContext/tickAblauf.
 * Der Soundcheck-Gate-Zustand (ablaufStatus.pausierGrund === 'soundcheck') hat
 * hier bewusst KEINE eigene Phase mehr - er wird über einen eigenen Dialog
 * (SoundcheckDialog) angezeigt, während das Widget im Hintergrund einfach die
 * zuletzt erreichte Phase (aufbau/wartezeit) weiterzeigt.
 */
export type AblaufPhase = 'aufbau' | 'wartezeit' | 'show' | 'abbau'

export const PHASE_LABEL: Record<AblaufPhase, string> = {
  aufbau: 'Aufbau',
  wartezeit: 'Wartezeit',
  show: 'Show',
  abbau: 'Abbau',
}

/** Leitet aus Status + aktueller Spielminute (seit Mitternacht) die aktuelle Phase für die Anzeige ab. */
export function ermittlePhase(status: AblaufStatus, aktuelleMinute: number): AblaufPhase {
  if (aktuelleMinute < status.aufbauEndeMinute) return 'aufbau'
  if (aktuelleMinute < status.showStartMinute) return 'wartezeit'
  if (aktuelleMinute < status.showEndeMinute) return 'show'
  return 'abbau'
}

/** Fortschritt (0-100) der aktuellen Phase innerhalb ihres Zeitfensters. */
export function phasenFortschritt(status: AblaufStatus, aktuelleMinute: number): number {
  const phase = ermittlePhase(status, aktuelleMinute)

  let start: number
  let ende: number
  if (phase === 'aufbau') {
    start = status.aufbauEndeMinute - AUFBAU_DAUER_MINUTEN
    ende = status.aufbauEndeMinute
  } else if (phase === 'wartezeit') {
    start = status.aufbauEndeMinute
    ende = status.showStartMinute
  } else if (phase === 'show') {
    start = status.showStartMinute
    ende = status.showEndeMinute
  } else {
    start = status.showEndeMinute
    ende = status.abbauEndeMinute
  }

  const dauer = ende - start
  if (dauer <= 0) return 100
  return Math.min(100, Math.max(0, ((aktuelleMinute - start) / dauer) * 100))
}

/** Rotierender Flavor-Text je nach Fortschritt innerhalb der Phase - rein kosmetisch. */
export function ermittleFlavorText(phase: AblaufPhase, fortschritt: number): string | null {
  if (phase === 'aufbau') {
    if (fortschritt < 33) return 'Equipment wird angeliefert...'
    if (fortschritt < 66) return 'Bühne wird aufgebaut...'
    return 'Letzte Vorbereitungen laufen...'
  }
  if (phase === 'wartezeit') {
    return 'Bereit, wartet auf den Abend...'
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
