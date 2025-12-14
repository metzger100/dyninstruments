# dyninstruments – Modern Instrument Widgets for AvNav

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that provides a modern, highly legible instrument panel with cluster-based widgets and canvas-based gauges (e.g. WindDial, CompassGauge, SpeedGauge, DepthGauge, TemperatureGauge).
The goal is **maximum readability at the helm** with **minimal configuration overhead**.

> ⚠️ **Status**: Work in progress / pre-release. APIs, widget names, and editor options may still change.

---

## Features

### 🧱 Cluster widgets (one widget per topic)

* The plugin groups related values into thematic clusters:

  * `courseHeading`, `speed`, `position`, `distance`, `environment`, `wind`, `time`, `nav`, `anchor`, `vessel`
* In the editor you typically select only a `kind` (e.g. `COG`, `HDT`, `SOG`, `STW`, `tempGraphic`) instead of creating separate widgets for every single value.

### 🔍 Maximum readability (auto layout & scaling)

* Caption / value / unit are auto-scaled to be as large as possible.
* Layout adapts to the available aspect ratio (flat / normal / high).
* The number is always the primary focus; labels stay present but unobtrusive.

### 🎯 Canvas-based gauges (graphics where it matters)

* **WindDial** – compact wind dial for AWA/AWS and TWA/TWS with optional layline sectors.
* **CompassGauge** – compass gauge for HDT/HDM (graphic kinds).
* **SpeedGauge** – semicircle speedometer with warning/alarm sectors (fixed arc; “to” values are derived).
* **DepthGauge** – semicircle depth gauge with shallow-side warning/alarm sectors.
* **TemperatureGauge** – semicircle temperature gauge with optional high-end warning/alarm sectors.

### ⚙️ Editor options (sane defaults, per-kind settings)

* **Per cluster widget**

  * `kind` selection (what to show)
  * per-kind `caption_*` and `unit_*` overrides
  * shared layout options like `captionUnitScale`
* **Angle formatting**

  * `leadingZero` for headings/angles where applicable (e.g., `005°`)
* **Gauges**

  * range (`minValue`, `maxValue`) and tick steps
  * optional sectors controlled via **enable toggles**

    * **SpeedGauge**: `speedWarningEnabled`, `speedAlarmEnabled` (default enabled)
    * **DepthGauge**: `depthWarningEnabled`, `depthAlarmEnabled` (default enabled)
    * **TemperatureGauge**: `tempWarningEnabled`, `tempAlarmEnabled` (default disabled)
    * **WindDial**: `windLayEnabled` + `layMin`/`layMax` (default enabled)
* **SignalK paths**

  * `KEY` fields in the editor allow overriding SignalK sources (e.g., pressure, temperature, voltage)
  * `environment` supports selecting a temperature path that applies to both numeric and graphic kinds.

### 🎨 Integrates cleanly with AvNav

* Styling is scoped to plugin widgets (no impact on AvNav’s standard instruments).
* Respects AvNav day/night theming (colors/fonts resolved from CSS / computed styles).

---

## Requirements

* **AvNav** server installation (Raspberry Pi, Linux, Windows Desktop).
* **No support for the pure Android app** (AvNav plugins are currently not loaded there).
* Browser requirements:

  * Canvas 2D
  * ES6+ JavaScript support

---

## Installation

### 1) Download ZIP

1. Download the latest `dyninstruments` ZIP from the GitHub Releases page.
2. Unzip it. It must contain a folder `dyninstruments/` with at least:

   * `plugin.js`
   * `plugin.css`
   * `modules/…` (JS modules and assets)

### 2) Copy into AvNav plugin directory

**Raspberry Pi (default setup):**

```bash
cd /home/pi/avnav/data/plugins
unzip /path/to/dyninstruments.zip
# result: /home/pi/avnav/data/plugins/dyninstruments/
```

**Other Linux setups (example):**

```bash
cd /home/<user>/avnav/plugins
unzip /path/to/dyninstruments.zip
# result: /home/<user>/avnav/plugins/dyninstruments/
```

Then **restart the AvNav server** (via AvNav UI or system service).

---

## Usage

### Add widgets in the layout editor

1. Open AvNav in your browser.
2. Enter edit mode and open the instrument layout you want to modify.
3. In the widget list you’ll find new widgets prefixed with:

```text
dyninstruments_…
```

Current widgets (depending on your build):

* `dyninstruments_CourseHeading`
* `dyninstruments_Speed`
* `dyninstruments_Position`
* `dyninstruments_Distance`
* `dyninstruments_Environment`
* `dyninstruments_Wind`
* `dyninstruments_LargeTime`
* `dyninstruments_Nav`
* `dyninstruments_Anchor`
* `dyninstruments_Vessel`

### Typical workflow

* Add one cluster widget (e.g. `dyninstruments_Wind`)
* Choose a `kind` (e.g. numeric `angleTrue` or graphic `angleTrueGraphic`)
* Optionally adjust captions/units and enable/disable gauge sectors

---

## Architecture (short overview)

`dyninstruments` is modular and loaded dynamically by `plugin.js` as UMD modules.

* **plugin.js**

  * loads JS/CSS modules (with dependency resolution)
  * provides `Helpers` for canvas setup, text color/font resolution, and formatter application
  * registers widgets via `avnav.api.registerWidget`
  * builds default values from `editableParameters`

* **ClusterHost**

  * the central “router” that translates `cluster + kind` into renderer props
  * delegates rendering to:

    * **ThreeElements** for numeric text layouts
    * gauge modules (WindDial, CompassGauge, SpeedGauge, DepthGauge, TemperatureGauge) for graphics

* **InstrumentComponents (core)**

  * reusable drawing primitives (ticks, rings, pointers, sectors, labels)
  * shared by the gauge modules

---

## Configuration notes

### Per-kind captions/units

Each cluster defines editor fields like:

* `caption_<kind>` (e.g. `caption_hdtGraphic`)
* `unit_<kind>` (e.g. `unit_sogGraphic`)

This avoids hardcoding captions/units inside renderers.

### Sector toggles

Some gauges expose enable toggles so you can hide warning/alarm ranges completely:

* SpeedGauge: defaults enabled
* DepthGauge: defaults enabled
* TemperatureGauge: defaults disabled
* WindDial layline sectors: defaults enabled

---

## Roadmap (subject to change)

There will also be changes in the clusters planned:
- Move LargeTime to a existing cluster like Vessel
- Merge Distance into existing clusters
- Merge Position into a existing cluster like Nav
- Redo the Postion Widget to be more dynamic

The actual implementation may differ. Check issues/commits for the current state.

| AvNav Widget                 | dyninstruments            (Widget → Kind)                                    | Renderer/Modul                                                                  | Coverage                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| ActiveRoute                  | —                                                                            | —                                                                               | ❌ not covered yet                          |
| AisTarget                    | —                                                                            | —                                                                               | ❌ not covered yet                          |
| Alarm                        | —                                                                            | —                                                                               | ❌ not covered yet                          |
| AnchorBearing                | dyninstruments_Anchor → `bearing`                                            | `modules/ClusterHost/ClusterHost.js` → `modules/ThreeElements/ThreeElements.js` | ✅ covered                                  |
| AnchorDistance               | dyninstruments_Anchor → `distance`                                           | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| AnchorWatchDistance          | dyninstruments_Anchor → `watch`                                              | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| BRG                          | dyninstruments_CourseHeading → `brg`                                         | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| CenterDisplay                | —                                                                            | —                                                                               | ❌ not covered yet                          |
| COG                          | dyninstruments_CourseHeading → `cog`                                         | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| CombinedWidget               | —                                                                            | —                                                                               | ❌ not covered yet                          |
| DateTime                     | —                                                                            | —                                                                               | ❌ not covered yet                          |
| Default                      | —                                                                            | —                                                                               | ❌ not covered yet                          |
| DepthDisplay                 | dyninstruments_Environment → `depth`                                         | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| DST                          | dyninstruments_Distance → `dst`                                              | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| EditRoute                    | —                                                                            | —                                                                               | ❌ not covered yet                          |
| Empty                        | —                                                                            | —                                                                               | ❌ not covered yet                          |
| ETA                          | dyninstruments_Nav → `eta`                                                   | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| HDM                          | dyninstruments_CourseHeading → `hdm`                                         | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| HDT                          | dyninstruments_CourseHeading → `hdt`                                         | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| LargeTime                    | dyninstruments_LargeTime                                                     | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| linGauge_Compass             | —                                                                            | —                                                                               | ❌ not covered yet                          |
| linGauge_Compass180          | —                                                                            | —                                                                               | ❌ not covered yet                          |
| linGauge_Temperature         | —                                                                            | —                                                                               | ❌ not covered yet                          |
| linGauge_Voltage             | —                                                                            | —                                                                               | ❌ not covered yet                          |
| Position                     | dyninstruments_Position → `boat`                                             | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| radGauge_Compass             | dyninstruments_CourseHeading → `hdtGraphic`                                  | `modules/ClusterHost/ClusterHost.js` → `modules/CompassGauge/CompassGauge.js`   | ✅ covered                                  |
| radGauge_Speed               | dyninstruments_Speed → `sogGraphic`/`stwGraphic`                             | ClusterHost → `modules/SpeedGauge/SpeedGauge.js`                                | ✅ covered                                  |
| radGauge_Temperature         | dyninstruments_Environment → `tempGraphic`                                   | ClusterHost → `modules/TemperatureGauge/TemperatureGauge.js`                    | ✅ covered                                  |
| radGauge_Voltage             | dyninstruments_Vessel → `voltageGraphic`                                     | ClusterHost → `modules/VoltageGauge/VoltageGauge.js`                            | ✅ covered                                  |
| RadialGauge                  | —                                                                            | —                                                                               | ❌ not covered yet                          |
| RoutePoints                  | —                                                                            | —                                                                               | ❌ not covered yet                          |
| RteCombine                   | —                                                                            | —                                                                               | ❌ not covered yet                          |
| RteDistance                  | dyninstruments_Nav → `rteDistance`                                           | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| RteEta                       | dyninstruments_Nav → `rteEta`                                                | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| signalKCelsius               | dyninstruments_Environment → `temp`                                          | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| signalKPitch                 | —                                                                            | —                                                                               | ❌ not covered yet                          |
| signalKPressureHpa           | dyninstruments_Environment → `pressure`                                      | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| signalKRoll                  | —                                                                            | —                                                                               | ❌ not covered yet                          |
| SOG                          | dyninstruments_Speed → `sog`                                                 | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| STW                          | dyninstruments_Speed → `stw`                                                 | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| testPlugin_CourseWidget      | —                                                                            | —                                                                               | ❌ not covered yet                          |
| testPlugin_ServerWidget      | —                                                                            | —                                                                               | ❌ not covered yet                          |
| testPlugin_SimpleWidget      | —                                                                            | —                                                                               | ❌ not covered yet                          |
| TimeStatus                   | —                                                                            | —                                                                               | ❌ not covered yet                          |
| Undefined                    | —                                                                            | —                                                                               | ❌ not covered yet                          |
| VMG                          | dyninstruments_Nav → `vmg`                                                   | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| WaterTemp                    | dyninstruments_Environment → `temp`                                          | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| WindAngle                    | dyninstruments_Wind → `angleApparent`                                        | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| WindDisplay                  | dyninstruments_Wind → `angleApparentGraphic`                                 | ClusterHost → `modules/WindDial/WindDial.js`                                    | ✅ covered                                  |
| WindGraphics                 | dyninstruments_Wind → `angleApparentGraphic`/`angleTrueGraphic`              | ClusterHost → WindDial                                                          | ✅ covered                                  |
| WindSpeed                    | dyninstruments_Wind → `speedApparent`                                        | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| WpPosition                   | dyninstruments_Position → `wp`                                               | ClusterHost → ThreeElements                                                     | ✅ covered                                  |
| XteDisplay                   | —                                                                            | —                                                                               | ❌ not covered yet                          |
| Zoom                         | —                                                                            | —                                                                               | ❌ not covered yet                          |
