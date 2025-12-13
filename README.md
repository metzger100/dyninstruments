# dyninstruments – Modern Instrument Widgets for AvNav

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that provides a modern, highly legible instrument panel with cluster-based widgets and canvas-based graphics (e.g., CompassGauge, WindDial).
The goal is: **maximum readability at the helm**, with minimal configuration overhead.

> ⚠️ **Status**: Work in progress / pre-release. APIs and widget names may still change.

---

## Features

* 🧱 **Cluster widgets**

  * Thematic clusters like `courseHeading`, `speed`, `position`, `wind`, `nav`, `anchor`, `vessel`.
  * Per cluster, you only select a `kind` in the editor (e.g., `COG`, `HDT`, `SOG`, `STW`) instead of needing a separate widget for every value.

* 🔍 **Optimized readability**

  * Caption, value, and unit are automatically sized as large as possible.
  * Layout adapts to the available space (flat, normal, tall).
  * Focus on the number; the label is only as prominent as necessary.

* 🎯 **Canvas-based specialized instruments**

  * **WindDial** – circular wind indicator with a clearly visible pointer.
  * **CompassGauge** – 360° compass display with a clearly highlighted course marker.

* ⚙️ **Editor options**

  * Per cluster widget:

    * `kind` (which value from the cluster to display)
    * `caption` (label)
    * `unit` (unit, optionally overrideable)
    * additional options like `leadingZero` for headings/angles, depending on the instrument.

* 🎨 **Integrates with AvNav**

  * Styles are scoped to these widgets (no impact on AvNav’s standard instruments).
  * Respects AvNav day/night theming.

---

## Requirements

* **AvNav** as a server installation (Raspberry Pi, Linux, Windows desktop).
* **No support for the standalone Android app** (AvNav plugins are currently not loaded there).
* A **browser** with:

  * Canvas 2D
  * ES6+ (modern JavaScript support)

---

## Installation

### 1. Download the ZIP

1. Download the current `dyninstruments` release as a ZIP from the GitHub Releases page.
2. Extract the archive — it must contain a `dyninstruments/` directory with at least:

   * `plugin.js`
   * `plugin.css`
   * additional JS modules (`*.js`) and assets in subfolders

### 2. Install into AvNav

On a **Raspberry Pi** with the standard setup:

```bash
cd /home/pi/avnav/data/plugins
unzip /path/to/dyninstruments.zip
# Result: /home/pi/avnav/data/plugins/dyninstruments/
```

On **another Linux system**:

```bash
cd /home/<user>/avnav/plugins
unzip /path/to/dyninstruments.zip
# Result: /home/<user>/avnav/plugins/dyninstruments/
```

Then **restart the AvNav server** (via the AvNav web UI or as a system service).

---

## Usage

### Widgets in the layout editor

1. Open AvNav in your browser.
2. In edit mode, switch to the **instrument layout** you want to modify.
3. In the widget list, you will find new entries with the prefix:

   ```text
   dyninstruments_…
   ```

   Examples (depending on the current development state):

   * `dyninstruments_courseHeading`
   * `dyninstruments_speed`
   * `dyninstruments_position`
   * `dyninstruments_wind`
   * `dyninstruments_nav`
   * `dyninstruments_anchor`
   * `dyninstruments_vessel`

---

## Architecture (quick overview)

`dyninstruments` is based on a modular structure:

* **ClusterHost**

  * Handles data sources, formatters, and the translation between `kind` and internal data keys.

* **ThreeElements**

  * Canvas renderer for classic **Caption / Value / Unit** displays.
  * Responsible for auto-scaling and layout based on widget aspect ratio.

* **“Core” files**

  * Reusable building blocks, e.g., 360° scales, ticks, and gauge pointers (used by Compass, WindDial, etc.).

Modules are loaded as UMD modules by `plugin.js` and integrated via the AvNav API (e.g., `renderCanvas`, `registerWidget`, …).

---

## Roadmap

Planned / in-progress instruments:

* More canvas gauges:

  * `radGauge_Speed`
  * `radGauge_Temperature`
  * `radGauge_Voltage`
  * `radGauge_Wind`

* Wind instruments:

  * `WindTrend` (visualization, e.g., history/trends)

* Navigation and status widgets:

  * `XteCanvas`
  * `RouteStatus`, `RouteList`
  * `TimeStatus`, `LargeTime` variants

* AIS & map:

  * `AisTarget` (table with CPA/TCPA)
  * `MapControls`, `MapOverlay`

* System/attitude:

  * `SignalKAttitude` (roll/pitch)
  * alarm/status widgets

Actual implementation may differ from this list; see GitHub issues and commits for the current state.
