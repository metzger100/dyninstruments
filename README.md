# dyninstruments – Modern Instrument Widgets for AvNav

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that provides a modern, highly legible instrument panel with cluster-based widgets and canvas-based graphics (e.g. CompassGauge, WindDial).  
The goal is: **maximum readability at the helm**, minimal configuration overhead.

> ⚠️ **Status**: Work in progress / pre-release. APIs and widget names might still change.

---

## Features

- 🧱 **Cluster-Widgets statt Widget-Flut**
  - Thematische Cluster wie `courseHeading`, `speed`, `position`, `wind`, `nav`, `anchor`, `vessel`.
  - Pro Cluster wählst du im Editor nur noch ein `kind` (z. B. `COG`, `HDT`, `SOG`, `STW`), statt für jeden Wert ein eigenes Widget zu haben.

- 🔍 **Optimierte Lesbarkeit**
  - Caption, Value, Unit werden automatisch so groß wie möglich gesetzt.
  - Layout passt sich der verfügbaren Fläche an (sehr flach, normal, hoch).
  - Fokus auf der Zahl, Beschriftung nur so präsent wie nötig.

- 🎯 **Canvas-basierte Spezial-Instrumente**
  - **WindDial** – runder Windanzeiger mit gut sichtbarem Zeiger.
  - **CompassGauge** – 360°-Kompassanzeige mit deutlich hervorgehobener Kursmarke.
  - Interne Cores (`PolarCore`, `RadialGaugeCore`, `ListCore`, `MiniHistory`) sorgen für wiederverwendbare Zeichenlogik.

- ⚙️ **Sinnvolle Editor-Optionen**
  - Pro Cluster-Widget:
    - `kind` (welcher Wert aus dem Cluster angezeigt wird)
    - `caption` (Beschriftung)
    - `unit` (Einheit, optional überschreibbar)
    - weitere Optionen wie `leadingZero` für Heading/Winkel, je nach Instrument.
  - Kein Zoo an Einstellungen – nur das, was im Cockpit wirklich hilft.

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

2. Wechsle auf das **Instrumenten-Layout**, das du anpassen möchtest.

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

### Editor-Optionen (Cluster-Widgets)

Am Beispiel `dyninstruments_courseHeading`:

* **kind**

  * Mögliche Werte (Beispiele): `COG`, `HDT`, `HDM`, `BRG`.
  * Bestimmt, welcher Kurs-Wert im Cluster angezeigt wird.
* **caption**

  * Textbeschriftung (z. B. `COG`, `HDT`, `BRG` oder ein Klartext wie `Heading`).
* **unit**

  * Optional, Standard ist meist `°` oder was der Formatter liefert.
* **leadingZero** (falls verfügbar)

  * Anzeige mit führender Null (z. B. `005°` statt `5°`).

Analog funktioniert es bei anderen Clustern:

* `dyninstruments_speed`: `kind` = `SOG` oder `STW`.
* `dyninstruments_wind`: `kind` z. B. `TWA`, `AWA`, `TWS`, `AWS`.
* `dyninstruments_nav`: `kind` z. B. `eta`, `rteEta`, `dst`, `rteDistance`, `vmg`, `clock`.
* `dyninstruments_anchor`: z. B. Anker-Distanz oder Anker-Wache.
* `dyninstruments_vessel`: Boots- und WP-Position, später evtl. Attitude/Systemwerte.

### Spezielle Canvas-Instrumente

* **CompassGauge**

  * Wird typischerweise im Cluster `courseHeading` verwendet.
  * Stellt einen 360°-Kompass mit hervorgehobener Kursmarke dar.
* **WindDial**

  * Visualisiert wahre/scheinbare Windrichtung in einem runden Dial, inkl. klarer Zeigerfarbe.
* Beide respektieren:

  * Caption/Value/Unit-Zeile über bzw. um die Gauge.
  * Responsive Verhalten – nutzen den verfügbaren Platz bestmöglich.

---

## Architektur (Kurzüberblick)

`dyninstruments` basiert auf einer modularen Struktur:

* **ClusterHost**

  * Kümmert sich um Datenquellen, Formatter und die Übersetzung zwischen `kind` und internem Daten-Key.
* **ThreeElements**

  * Canvas-Renderer für klassische Anzeigen mit **Caption / Value / Unit**.
  * Verantwortlich für Auto-Scaling und Layout abhängig vom Widget-Seitenverhältnis.
* **PolarCore / RadialGaugeCore**

  * Wiederverwendbare Bausteine für 360°-Skalen, Ticks und Gauge-Zeiger (z. B. Compass, WindDial).
* **ListCore / MiniHistory** (geplant/teilweise umgesetzt)

  * Basis für tabellenartige Widgets (z. B. AIS-Listen) und kleine Trendverläufe.

Die Module werden von `plugin.js` als UMD-Module geladen und über die AvNav-API (`renderCanvas`, `registerWidget`, …) eingebunden.

---

## Roadmap

Geplante bzw. im Aufbau befindliche Instrumente:

* Weitere Canvas-Gauges:

  * `radGauge_Speed`
  * `radGauge_Temperature`
  * `radGauge_Voltage`
* Wind-Instrumente:

  * `WindDial` (Dial)
  * `WindGraphics` (graphische Darstellung, z. B. History/Trends)
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

---

## Known Limitations

* **Android-App**: Das Plugin wird dort (Stand jetzt) nicht geladen.
* **Anpassbarkeit per CSS**:

  * Canvas-Widgets lassen sich naturgemäß weniger granular per CSS verändern als reine DOM-Widgets.
  * Ziel ist, dass das Standard-Design „out of the box“ gut nutzbar ist.

---

## Development

1. Repository klonen:

   ```bash
   git clone https://github.com/<user>/dyninstruments.git
   cd dyninstruments
   ```

2. Für schnelle Tests:

   * Das Verzeichnis `dyninstruments/` direkt in das AvNav-Plugin-Verzeichnis kopieren.
   * AvNav neu starten.
   * Browser-Dev-Tools verwenden (Konsole, Network, Canvas-Profiling).

3. Code-Basis:

   * Plain JavaScript (ES6+, UMD-Module).
   * Keine zwingende Build-Pipeline nötig – die Plugindateien werden direkt vom AvNav-Server ausgeliefert.

Pull Requests, Bug Reports und UX-Feedback sind ausdrücklich willkommen. 🙂
