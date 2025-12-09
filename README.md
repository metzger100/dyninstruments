# dyninstruments – Modern Instrument Widgets for AvNav

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that provides a modern, highly legible instrument panel with cluster-based widgets and canvas-based graphics (e.g. CompassGauge, WindDial).  
The goal is: **maximum readability at the helm**, minimal configuration overhead.

> ⚠️ **Status**: Work in progress / pre-release. APIs and widget names might still change.

---

## Features

- 🧱 **Cluster-Widgets**
  - Thematische Cluster wie `courseHeading`, `speed`, `position`, `wind`, `nav`, `anchor`, `vessel`.
  - Pro Cluster wählst du im Editor nur noch ein `kind` (z. B. `COG`, `HDT`, `SOG`, `STW`), statt für jeden Wert ein eigenes Widget zu haben.

- 🔍 **Optimierte Lesbarkeit**
  - Caption, Value, Unit werden automatisch so groß wie möglich gesetzt.
  - Layout passt sich der verfügbaren Fläche an (flach, normal, hoch).
  - Fokus auf der Zahl, Beschriftung nur so präsent wie nötig.

- 🎯 **Canvas-basierte Spezial-Instrumente**
  - **WindDial** – runder Windanzeiger mit gut sichtbarem Zeiger.
  - **CompassGauge** – 360°-Kompassanzeige mit deutlich hervorgehobener Kursmarke.

- ⚙️ **Editor-Optionen**
  - Pro Cluster-Widget:
    - `kind` (welcher Wert aus dem Cluster angezeigt wird)
    - `caption` (Beschriftung)
    - `unit` (Einheit, optional überschreibbar)
    - weitere Optionen wie `leadingZero` für Heading/Winkel, je nach Instrument.

- 🎨 **Integriert sich in AvNav**
  - Styles sind auf die eigenen Widgets gescoped (kein Einfluss auf Standard-Instrumente).
  - Respektiert Day/Night-Theming von AvNav.

---

## Requirements

- **AvNav** als Server-Installation (Raspberry Pi, Linux, Windows Desktop).
- **Kein Support für die reine Android-App** (AvNav-Plugins werden dort aktuell nicht geladen).
- **Browser** mit:
  - Canvas 2D
  - ES6+ (aktueller JavaScript-Stand)

---

## Installation

### 1. ZIP herunterladen

1. Lade die aktuelle `dyninstruments`-Version als ZIP von der GitHub-Releases-Seite herunter.
2. Entpacke das Archiv – es muss ein Verzeichnis `dyninstruments/` enthalten, in dem sich mindestens folgende Dateien befinden:
   - `plugin.js`
   - `plugin.css`
   - weitere JS-Module (`*.js`) und Assets in Ordnern

### 2. In AvNav einspielen

Auf einem **Raspberry Pi** mit Standard-Setup:

```bash
cd /home/pi/avnav/data/plugins
unzip /pfad/zu/dyninstruments.zip
# Ergebnis: /home/pi/avnav/data/plugins/dyninstruments/
````

Auf einem **anderen Linux-System**:

```bash
cd /home/<user>/avnav/plugins
unzip /pfad/zu/dyninstruments.zip
# Ergebnis: /home/<user>/avnav/plugins/dyninstruments/
```

Danach den **AvNav-Server neu starten** (über die AvNav Web-Oberfläche oder per Systemdienst).

---

## Benutzung

### Widgets im Layout-Editor

1. Öffne AvNav im Browser.

2. Wechsle im Edit-Mode auf das **Instrumenten-Layout**, das du anpassen möchtest.

3. In der Widget-Liste findest du neue Einträge mit dem Präfix:

   ```text
   dyninstruments_…
   ```

   Beispiele (je nach Stand der Entwicklung):

   * `dyninstruments_courseHeading`
   * `dyninstruments_speed`
   * `dyninstruments_position`
   * `dyninstruments_wind`
   * `dyninstruments_nav`
   * `dyninstruments_anchor`
   * `dyninstruments_vessel`

---

## Architektur (Kurzüberblick)

`dyninstruments` basiert auf einer modularen Struktur:

* **ClusterHost**

  * Kümmert sich um Datenquellen, Formatter und die Übersetzung zwischen `kind` und internem Daten-Key.
* **ThreeElements**

  * Canvas-Renderer für klassische Anzeigen mit **Caption / Value / Unit**.
  * Verantwortlich für Auto-Scaling und Layout abhängig vom Widget-Seitenverhältnis.
* **"Core"-Files**

  * Wiederverwendbare Bausteine, beispielweise 360°-Skalen, Ticks und Gauge-Zeiger (z. B. Compass, WindDial).

Die Module werden von `plugin.js` als UMD-Module geladen und über die AvNav-API (`renderCanvas`, `registerWidget`, …) eingebunden.

---

## Roadmap

Geplante bzw. im Aufbau befindliche Instrumente:

* Weitere Canvas-Gauges:

  * `radGauge_Speed`
  * `radGauge_Temperature`
  * `radGauge_Voltage`
  * `radGauge_Wind`
* Wind-Instrumente:

  * `WindTrend` (graphische Darstellung, z. B. History/Trends)
* Navigations- und Status-Widgets:

  * `XteCanvas`
  * `RouteStatus`, `RouteList`
  * `TimeStatus`, `LargeTime`-Varianten
* AIS & Map:

  * `AisTarget` (Tabelle mit CPA/TCPA)
  * `MapControls`, `MapOverlay`
* System/Attitude:

  * `SignalKAttitude` (Roll/Pitch)
  * `Alarm`-/Status-Widgets

Die tatsächliche Implementierung kann von dieser Liste abweichen; siehe GitHub-Issues und Commits für den aktuellen Stand.
