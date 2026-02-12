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

## Roadmap (subject to change)

There are planned structural changes before adding the remaining AvNav widgets. Backward compatibility is **not** a goal yet (pre-release).

### Complete the Documentation for AI

There is documentation missing for existing code like the already existing widgets

### Refactor existing Files to reduce duplications and make it more friendly for AI 

plugin.js is to long. Split the different jobs and configs up in smaller modules.

Refactor the existing gauge elements to use the a new GaugeUtils which shall replace InstrumentComponents. SpeedGauge/DepthGauge/TemperatureGauge/VoltageGauge share identical functions.

Remove dead Fallbacks.

Fixing naming schemes.

### Cluster refactor (foundation)

1. **Move `LargeTime` into an existing cluster (likely `vessel`)**
   - `dyninstruments_LargeTime` becomes a `kind` (e.g. `clock`) inside `dyninstruments_Vessel`.

2. **Merge `distance` into existing clusters**
   - Waypoint/route distances move into `nav` (`dst`, `rteDistance`).
   - Anchor distances stay in `anchor` (`distance`, `watch`).
   - The standalone `distance` cluster/widget will be removed.

3. **Merge `position` into an existing cluster (likely `nav`)**
   - Boat/WP positions become `kinds` inside `dyninstruments_Nav`.
   - A “more dynamic” position widget will be built on top of this (switchable sources, consistent formatting).

### Assign missing AvNav widgets to target clusters

After the refactor, the missing core widgets will be integrated as `kinds` into clusters (and new clusters will be introduced if it improves UX), e.g.:

- `vessel`: `datetime`, `timeStatus`, `signalKPitch`, `signalKRoll`
- `nav`: `activeRoute`, `routePoints`, `xteDisplay`, `editRoute`
- new clusters (planned): `ais` (e.g. `aisTarget`), `map` (e.g. `zoom`, `centerDisplay`)
- `default`: likely a dedicated “utility/default” widget rather than a cluster kind

### Implementation order (practical milestones)

1. **Quick wins (text/ThreeElements-based)**: `DateTime`, `TimeStatus`, `signalKPitch`, `signalKRoll`
2. **High-impact canvas visuals**: `XteDisplay`, `ActiveRoute`
3. **Lists & controls (interaction-heavy)**: `RoutePoints`, `EditRoute`, `Zoom`, `CenterDisplay`
4. **AIS**: `AisTarget` (requires more data/logic + responsive layout)

### Additional non-core widgets (planned)

- **OBP60-style instruments**: graphical Roll/Pitch, Clock, Rudder, Keel
- **C-net 2000 multi instruments**: history graphs, interactive regatta clock (if feasible), anchor “nav plot” (boat track inside anchor circle)
- **Wind**: a “4-corner” wind graphic showing `TWA/TWS/AWA/AWS` simultaneously

The actual implementation may differ. Check issues/commits for the current state.

| AvNav Widget                 | dyninstruments                                                               | Coverage                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| ActiveRoute                  | —                                                                            | ❌ not covered yet                          |
| AisTarget                    | —                                                                            | ❌ not covered yet                          |
| Alarm                        | —                                                                            | ❌ not covered yet                          |
| AnchorBearing                | dyninstruments_Anchor → `bearing`                                            | ✅ covered                                  |
| AnchorDistance               | dyninstruments_Anchor → `distance`                                           | ✅ covered                                  |
| AnchorWatchDistance          | dyninstruments_Anchor → `watch`                                              | ✅ covered                                  |
| BRG                          | dyninstruments_CourseHeading → `brg`                                         | ✅ covered                                  |
| CenterDisplay                | —                                                                            | ❌ not covered yet                          |
| COG                          | dyninstruments_CourseHeading → `cog`                                         | ✅ covered                                  |
| CombinedWidget               | —                                                                            | ❌ not covered yet                          |
| DateTime                     | —                                                                            | ❌ not covered yet                          |
| Default                      | —                                                                            | ❌ not covered yet                          |
| DepthDisplay                 | dyninstruments_Environment → `depth`                                         | ✅ covered                                  |
| DST                          | dyninstruments_Distance → `dst`                                              | ✅ covered                                  |
| EditRoute                    | —                                                                            | ❌ not covered yet                          |
| ETA                          | dyninstruments_Nav → `eta`                                                   | ✅ covered                                  |
| HDM                          | dyninstruments_CourseHeading → `hdm`                                         | ✅ covered                                  |
| HDT                          | dyninstruments_CourseHeading → `hdt`                                         | ✅ covered                                  |
| LargeTime                    | dyninstruments_LargeTime                                                     | ✅ covered                                  |
| linGauge_Compass             | —                                                                            | ❌ not covered yet                          |
| linGauge_Compass180          | —                                                                            | ❌ not covered yet                          |
| linGauge_Temperature         | —                                                                            | ❌ not covered yet                          |
| linGauge_Voltage             | —                                                                            | ❌ not covered yet                          |
| Position                     | dyninstruments_Position → `boat`                                             | ✅ covered                                  |
| radGauge_Compass             | dyninstruments_CourseHeading → `hdtGraphic`                                  | ✅ covered                                  |
| radGauge_Speed               | dyninstruments_Speed → `sogGraphic`/`stwGraphic`                             | ✅ covered                                  |
| radGauge_Temperature         | dyninstruments_Environment → `tempGraphic`                                   | ✅ covered                                  |
| radGauge_Voltage             | dyninstruments_Vessel → `voltageGraphic`                                     | ✅ covered                                  |
| RadialGauge                  | —                                                                            | ❌ not covered yet                          |
| RoutePoints                  | —                                                                            | ❌ not covered yet                          |
| RteDistance                  | dyninstruments_Nav → `rteDistance`                                           | ✅ covered                                  |
| RteEta                       | dyninstruments_Nav → `rteEta`                                                | ✅ covered                                  |
| signalKCelsius               | dyninstruments_Environment → `temp`                                          | ✅ covered                                  |
| signalKPitch                 | —                                                                            | ❌ not covered yet                          |
| signalKPressureHpa           | dyninstruments_Environment → `pressure`                                      | ✅ covered                                  |
| signalKRoll                  | —                                                                            | ❌ not covered yet                          |
| SOG                          | dyninstruments_Speed → `sog`                                                 | ✅ covered                                  |
| STW                          | dyninstruments_Speed → `stw`                                                 | ✅ covered                                  |
| TimeStatus                   | —                                                                            | ❌ not covered yet                          |
| VMG                          | dyninstruments_Nav → `vmg`                                                   | ✅ covered                                  |
| WaterTemp                    | dyninstruments_Environment → `temp`                                          | ✅ covered                                  |
| WindAngle                    | dyninstruments_Wind → `angleApparent`                                        | ✅ covered                                  |
| WindDisplay                  | dyninstruments_Wind → `angleApparentGraphic`                                 | ✅ covered                                  |
| WindGraphics                 | dyninstruments_Wind → `angleApparentGraphic`/`angleTrueGraphic`              | ✅ covered                                  |
| WindSpeed                    | dyninstruments_Wind → `speedApparent`                                        | ✅ covered                                  |
| WpPosition                   | dyninstruments_Position → `wp`                                               | ✅ covered                                  |
| XteDisplay                   | —                                                                            | ❌ not covered yet                          |
| Zoom                         | —                                                                            | ❌ not covered yet                          |

---

## Development

1. **Clone AvNav and place dyninstruments into the runtime plugin folder**

* Clone AvNav:

  * `git clone https://github.com/wellenvogel/avnav.git avnav-master`
* Clone (or symlink) this plugin into AvNav’s runtime plugins directory so the server can load it:

  * `mkdir -p /avnav-master/run/avnavdata/plugins`
  * `git clone https://github.com/metzger100/dyninstruments`

2. **Install viewer dependencies and run the watcher**

* Go to the AvNav viewer directory:

  * `cd avnav-master/viewer`
* Install dependencies:

  * `npm install`

3. **Run the AvNav server against the debug viewer build**

Start the server so it serves:

* runtime data from `avnav-master/run/avnavdata`
* the viewer UI from `viewer/build/debug`
* your plugin from `run/avnavdata/plugins/dyninstruments`

A practical way is using a VS Code launch configuration that runs the viewer watcher and the Python server in parallel.

Use a launch file like this to start the avnav-server (make sure the paths are right):
```js
{
  "version": "0.2.0",
  "compounds": [
    {
      "name": "AVNav Dev (Viewer+Server)",
      "configurations": ["viewer:watch", "server:run"]
    }
  ],
  "configurations": [
    {
      "type": "node-terminal",
      "name": "viewer:watch",
      "request": "launch",
      "command": "npm run watch",
      "cwd": "~/avnav-master//viewer"
    },
    {
      "type": "python",
      "name": "server:run",
      "request": "launch",
      "program": "~/avnav-master//server/avnav_server.py",
      "args": ["-w", "~/avnav-master//run/avnavdata", "-o", "8080", "-u", "viewer=~/avnav-master//viewer/build/debug,user=~/avnav-master//run/avnavdata/user"],
      "console": "integratedTerminal",
      "justMyCode": false
    }
  ]
}
```
