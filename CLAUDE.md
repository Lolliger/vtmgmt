# Venue Manager – Spielkonzept

## Grundidee
Management-/Tycoon-Spiel im Browser (später als Tauri-Desktop-App gepackt).
Der Spieler übernimmt die technische Leitung einer Veranstaltungsvenue –
nicht als Planer (kein CAD/Layout-Tool), sondern als Ressourcen- und
Beziehungsmanager: Personal, Equipment, Verleiher, Anfragen.

Vergleichbar mit: Game Dev Tycoon / Two Point Hospital / Football Manager,
nur mit Veranstaltungstechnik statt Spieleentwicklung/Krankenhaus/Fußball.

## Tech-Stack
- Vite + React + TypeScript
- Tailwind CSS (v4, CSS-first @theme) + shadcn/ui
- State: React State/Context zunächst, kein Backend nötig
- Speicherstand: localStorage (Web-Phase) → später Tauri File-System-API
- Verpackung am Ende: Tauri (kein Electron) → schlanke .exe
- Entwicklung/Testen: im Browser (schnellste Iteration)

## Kern-Loop (pro Spielrunde = 1 Woche)
1. **Anfragen-Inbox**: 1–3 neue Show-Anfragen kommen rein
2. **Annehmen/Ablehnen**: Kapazität, Termin, Attraktivität prüfen
3. **Staffing**: Techniker den angenommenen Shows zuteilen (FOH, Monitor,
   Licht, Rigging)
4. **Equipment-Lücken schließen**: eigenes Inventar reicht nicht →
   Verleiher anfragen (Preis/Qualität/Zuverlässigkeit-Tradeoff)
5. **Show-Auflösung**: kein Echtzeit-Minispiel, sondern berechneter
   Ergebnis-Screen basierend auf Entscheidungen + Zufallsfaktor
6. **Nachwehen**: Reputation, Verleiher-Beziehung, Techniker-Erfahrung/Moral
   aktualisieren
7. **Meta-Entscheidungen**: Equipment-Anträge bewilligen, Techniker
   einstellen/befördern/entlassen, Verleiher-Konditionen verhandeln, Budget

## Entities

### Venue
- Name, Kapazität, aktuelles Level/Ausbaustufe
- Budget (laufende Einnahmen/Ausgaben)
- Reputation (Skala, beeinflusst Qualität/Menge neuer Anfragen)

### Techniker
- Name
- Rolle/Spezialisierung: FOH, Monitor, Licht, Rigging (evtl. Mehrfach-Skills)
- Erfahrung (steigt durch Einsätze, abhängig von Show-Schwierigkeit)
- Hierarchie-Stufe: Trainee → Techniker → Senior/Spezialist →
  Abteilungsleitung → stellv. technische Leitung
- Gehalt (laufender Kostenfaktor, steigt mit Stufe)
- Moral/Zustand (sinkt durch Überlastung, steigt durch faire Behandlung/
  verdiente Beförderungen)
- Verfügbarkeit (verplant/frei pro Woche)
- Beförderungs-Trigger: gesammelte Erfahrung + konstant gute Ergebnisse +
  Betriebszugehörigkeit → Spieler entscheidet, ob befördert wird
  (Kosten: höheres Gehalt; bei Ablehnung trotz Verdienst: Moralverlust,
  Kündigungsrisiko)
- Senior-Techniker-Mechanik: können Trainees "mitziehen"
  (schnellerer Erfahrungsgewinn für Juniors im selben Einsatz)

### Equipment
- Kategorie (PA, Licht, Rigging, Signal/Patch, IEM, etc.)
- Menge/Bestand im Eigentum der Venue
- Zustand/Abnutzung (optional für V1, später ausbaufähig)
- Anschaffungskosten

### Verleiher
- Name
- Preisniveau
- Zuverlässigkeit (Risiko für Verspätung/Ausfall)
- Beziehungsstatus (verbessert sich durch gute Zusammenarbeit, verschlechtert
  sich durch Absagen/Probleme) → beeinflusst Konditionen/Verfügbarkeit

### Show/Anfrage
- Act/Genre (leitet grobe Anforderungen ab: SPL, Monitoring-Bedarf, etc.)
- Termin, erwartete Besucherzahl
- Sonderwünsche (Streaming, Übersetzung, eigenes Rider, Pyro-Genehmigung...)
- Gage/Ertrag für die Venue
- Risiko-Einstufung

## Spannungsfelder (was den Loop interessant macht)
- Zu viele Shows gleichzeitig → Personal/Equipment überlastet → höheres
  Pannenrisiko
- Billige Verleiher sparen Geld, aber unzuverlässig → Risiko am Showtag
- Techniker viel einsetzen → mehr Erfahrung, aber Burnout-Risiko;
  zu wenig einsetzen → Langeweile/Kündigung
- Gute Reputation zieht größere, aber anspruchsvollere Anfragen an

## Scope Version 1 (bewusst klein halten)
- 1 Venue, ~5 Techniker, ~3 Verleiher
- Anfragen kommen zufällig (einfache Generierung)
- Manuelles Staffing
- Show-Ergebnis: gut/mittel/Fail, beeinflusst Reputation
- Hierarchie/Beförderung: einfache Stufen, manuelle Entscheidung
- NICHT in V1: Equipment-Abnutzung, komplexe Verleiher-Verhandlung,
  mehrere Venues, Zufallsereignisse (Technikerausfall etc.) – kommt später

## Screens (grobe UI-Struktur)
- Dashboard (Woche, Finanzen, Reputation, anstehende Shows)
- Anfragen-Inbox
- Show-Planung/Staffing
- Team-Übersicht
- Equipment-Inventar
- Verleiher-Liste
- Show-Ergebnis-Screen

## Entwicklungsprinzipien für Claude Code
- Vertical Slices: erst eine Anfrage komplett spielbar machen (auch mit
  Dummy-Daten), dann verbreitern – nicht Layer für Layer
- Nach jedem funktionierenden Schritt committen
- Vor größeren Architekturentscheidungen nachfragen
- UI: Tailwind + shadcn/ui nutzen, keine generischen Bootstrap-Defaults
