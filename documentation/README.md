# dyninstruments — Modern Instrument Widgets for AvNav

**Status:** ✅ Functional | Pre-refactoring

## Stack

- **Runtime:** Browser ES6+ JavaScript, Canvas 2D
- **Module System:** UMD (no bundler, loaded via `<script>` at runtime)
- **Host App:** AvNav (marine navigation software)
- **API:** `avnav.api.registerWidget()` — see [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **Styling:** CSS scoped to `.dyniplugin` / `[data-dyni]`, CSS variables for theming

## Architecture

```
plugin.js (entry point)
├── Helpers object (setupCanvas, resolveTextColor, applyFormatter, ...)
├── MODULES{} registry (module IDs → JS/CSS paths + dependencies)
├── CLUSTERS[] (widget definitions with editableParameters)
├── loadModule() — async UMD loader with dependency resolution
└── registerInstrument() — registers widgets with avnav.api

modules/
├── Cores/InstrumentComponents.js  — Drawing primitives for full-circle dials
├── ThreeElements/              — Caption/Value/Unit numeric renderer
├── ClusterHost/                — Dispatcher: kind → renderer routing
├── WindDial/                   — Full-circle wind compass
├── CompassGauge/               — Full-circle heading compass
├── SpeedGauge/                 — Semicircle speedometer
├── DepthGauge/                 — Semicircle depth meter
├── TemperatureGauge/           — Semicircle thermometer
└── VoltageGauge/               — Semicircle voltmeter
```

## Widget Types

**Numeric (ThreeElements):** Caption/Value/Unit with responsive 3-row, 2-row, or 1-row layout.

**Semicircle Gauges:** N-shaped arc (270°→450°) with ticks, labels, warning/alarm sectors, pointer. Used by SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge.

**Full-Circle Dials:** 360° compass/wind dial. Used by WindDial, CompassGauge. Leverages InstrumentComponents for polar drawing.

**ClusterHost:** Meta-module that dispatches to the appropriate renderer based on the selected `kind`. Each registered widget uses ClusterHost.

## Cluster Widgets (10 total)

| Widget Name | Cluster | Kinds (selection) |
|---|---|---|
| dyninstruments_CourseHeading | courseHeading | cog, hdt, hdm, brg, hdtGraphic, hdmGraphic |
| dyninstruments_Speed | speed | sog, stw, sogGraphic, stwGraphic |
| dyninstruments_Position | position | boat, wp |
| dyninstruments_Distance | distance | dst, route, anchor, watch |
| dyninstruments_Environment | environment | depth, depthGraphic, temp, tempGraphic, pressure |
| dyninstruments_Wind | wind | angleTrue, angleApparent, angleTrueDirection, speedTrue, speedApparent, angleTrueGraphic, angleApparentGraphic |
| dyninstruments_LargeTime | time | (single) |
| dyninstruments_Nav | nav | eta, rteEta, dst, rteDistance, vmg, clock, positionBoat, positionWp |
| dyninstruments_Anchor | anchor | distance, watch, bearing |
| dyninstruments_Vessel | vessel | voltage, voltageGraphic |

## Data Flow

```
User selects "kind" in AvNav editor
  → updateFunction() adjusts storeKeys
  → AvNav reads SignalK values via storeKeys
  → translateFunction() picks renderer + transforms values
  → renderCanvas(canvas, props) draws on canvas
```

## Documentation Map

**AvNav API:** [plugin-lifecycle.md](avnav-api/plugin-lifecycle.md), [editable-parameters.md](avnav-api/editable-parameters.md), [formatters.md](avnav-api/formatters.md)

**Architecture:** [module-system.md](architecture/module-system.md), [cluster-system.md](architecture/cluster-system.md)

**Gauges:** [gauge-style-guide.md](gauges/gauge-style-guide.md), [gauge-shared-api.md](gauges/gauge-shared-api.md)

**Shared:** [helpers.md](shared/helpers.md), [css-theming.md](shared/css-theming.md)

**Guides:** [add-new-gauge.md](guides/add-new-gauge.md), [add-new-cluster.md](guides/add-new-cluster.md)

## Refactoring Phases

- ✅ Phase 0: Documentation system (this)
- ⏳ Phase 1: Extract GaugeUtils.js (eliminate ~1400 lines duplication)
- ❌ Phase 2: Split plugin.js into per-cluster config files
- ❌ Phase 3: Inline comments + file headers
- ❌ Phase 4: Remove dead code, naming cleanup

## Standards

- Files ≤300 lines
- File headers link to documentation
- UMD module pattern for all modules
- Update docs before/after code changes
- Token-efficient documentation format (see CLAUDE.md)
