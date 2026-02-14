# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Implemented | 4 files (pre-refactoring)

## Overview

Four nearly identical N-shaped semicircle gauge renderers. They share many duplicated local functions. Only value formatting, sector strategy, default ranges, and prop names differ. All visual style, proportions, layout logic, and drawing code are identical across gauges.

## File Locations

| Module | File | globalKey |
|---|---|---|
| SpeedGauge | `modules/SpeedGauge/SpeedGauge.js` | `DyniSpeedGauge` |
| DepthGauge | `modules/DepthGauge/DepthGauge.js` | `DyniDepthGauge` |
| TemperatureGauge | `modules/TemperatureGauge/TemperatureGauge.js` | `DyniTemperatureGauge` |
| VoltageGauge | `modules/VoltageGauge/VoltageGauge.js` | `DyniVoltageGauge` |

No CSS files. All rendering via Canvas 2D.

## Module Registration

All depend on InstrumentComponents. Registered in MODULES (plugin.js):

```javascript
SpeedGauge:       { js: BASE + "modules/SpeedGauge/SpeedGauge.js",       globalKey: "DyniSpeedGauge",       deps: ["InstrumentComponents"] },
DepthGauge:       { js: BASE + "modules/DepthGauge/DepthGauge.js",       globalKey: "DyniDepthGauge",       deps: ["InstrumentComponents"] },
TemperatureGauge: { js: BASE + "modules/TemperatureGauge/TemperatureGauge.js", globalKey: "DyniTemperatureGauge", deps: ["InstrumentComponents"] },
VoltageGauge:     { js: BASE + "modules/VoltageGauge/VoltageGauge.js",   globalKey: "DyniVoltageGauge",     deps: ["InstrumentComponents"] },
```

## Exports

All four return the same structure:

```javascript
return {
  id: "SpeedGauge",          // varies per gauge
  version: "0.4.0",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction           // no-op: returns {}; ClusterHost handles translation
};
```

## Cluster Membership

Gauges are graphic kinds within their respective clusters:

| Gauge | Cluster | Graphic Kinds | Numeric Kinds (same cluster) |
|---|---|---|---|
| SpeedGauge | `speed` | `sogGraphic`, `stwGraphic` | `sog`, `stw` |
| DepthGauge | `environment` | `depthGraphic` | `depth`, `temp`, `pressure` |
| TemperatureGauge | `environment` | `tempGraphic` | (shares cluster with Depth) |
| VoltageGauge | `vessel` | `voltageGraphic` | `voltage` |

## Shared Architecture (Identical Across All 4)

### renderCanvas Flow

1. `Helpers.setupCanvas(canvas)` → `{ ctx, W, H }`
2. Resolve `family`, `color` from CSS
3. Compute `pad`, `gap`, `availW`, `availH`
4. Determine layout `mode` from aspect ratio (`high` / `normal` / `flat`)
5. Read props: `caption`, `unit`, raw value
6. Convert raw → display via gauge-specific `display*FromRaw()` → `{ num, text }`
7. Compute gauge geometry: `R`, `cx`, `cy`, `rOuter`, `ringW`, `needleDepth`
8. Compute pointer angle: `aNow = startDeg + span × ((value - min) / range)`
9. Compute sector angles via `sectorAngles(from, to, minV, maxV, arc)`
10. **Draw:** arc ring → sectors → pointer → ticks → labels → text (mode-dependent) → disconnect overlay

### IC Usage

Only `drawPointerAtRim` is delegated to InstrumentComponents. All other drawing uses local duplicated functions:

```javascript
const drawPointerAtRim = (IC && typeof IC.drawPointerAtRim === 'function')
  ? function(ctx, cx, cy, rOuter, angleDeg, opts) { return IC.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts); }
  : drawPointerAtRimFallback;
```

### Duplicated Local Functions (22 per gauge)

**Math/utility:** `setFont`, `clamp`, `isFiniteN`, `deg2rad`, `toCanvasAngleRad`, `almostInt`, `extractNumberText`, `niceTickSteps`

**Drawing primitives:** `drawArcRing`, `drawAnnularSector`, `drawTicksFromAngles`, `drawLabelsForMajorValues`, `buildValueTickAngles`, `sectorAngles`

**Text layout:** `fitTextPx`, `measureValueUnitFit`, `drawCaptionMax`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawThreeRowsBlock`

**Overlay:** `drawDisconnectOverlay`

**Dead code:** `drawPointerAtRimFallback` — never executes (IC is always loaded via deps)

All use positional parameters (not IC's opts-object pattern). See [gauge-shared-api.md](../gauges/gauge-shared-api.md#duplicated-functions-in-semicircle-gauges) for comparison.

## Gauge-Specific Differences

### Value Formatting

Each gauge has a `display*FromRaw()` function returning `{ num, text }`. `num` drives the pointer, `text` is displayed.

| Gauge | Function | AvNav Formatter | Input | Conversion |
|---|---|---|---|---|
| SpeedGauge | `displaySpeedFromRaw(raw, unit)` | `formatSpeed(n, unit)` | m/s | → kn (or selected unit) |
| DepthGauge | `displayDepthFromRaw(raw, decimals)` | `formatDecimal(n, 3, 1, true)` | m | Direct (display unit = m) |
| TemperatureGauge | `displayTempFromRaw(raw, decimals)` | `formatTemperature(n, "celsius")` | Kelvin | → °C (heuristic fallback if >200) |
| VoltageGauge | `displayVoltageFromRaw(raw)` | `formatDecimal(n, 3, 1, true)` | V | Direct |

**Pattern:** Call avnav formatter → extract numeric with regex (`extractNumberText`) → return `{ num, text }`. Fallback: `Number(raw).toFixed(1)`.

### Sector Strategy

| Gauge | Strategy | Sector Placement | Default Enabled |
|---|---|---|---|
| SpeedGauge | **High-end** | Warning: `warningFrom → alarmFrom`, Alarm: `alarmFrom → maxValue` | Both on |
| TemperatureGauge | **High-end** | Same logic as SpeedGauge | Both **off** |
| DepthGauge | **Low-end** | Alarm: `minValue → alarmFrom`, Warning: `alarmFrom → warningFrom` | Both on |
| VoltageGauge | **Low-end** | Same logic as DepthGauge | Both on |

**High-end** (danger at top): sectors grow from a threshold toward `maxValue`.
**Low-end** (danger at bottom): sectors grow from `minValue` toward a threshold.

Low-end gauges additionally handle a `warnOnly` case: if alarm is disabled but warning is enabled, the warning sector covers `minValue → warningFrom`.

### Default Ranges

| Gauge | minValue | maxValue | Unit | Use Case |
|---|---|---|---|---|
| SpeedGauge | 0 | 30 | kn | Boat speed |
| DepthGauge | 0 | 30 | m | Water depth |
| TemperatureGauge | 0 | 35 | °C | Water temperature |
| VoltageGauge | 10 | 15 | V | 12V lead-acid battery |

### Default Sector Thresholds

| Gauge | warningFrom | alarmFrom |
|---|---|---|
| SpeedGauge | 20 | 25 |
| DepthGauge | 5.0 | 2.0 |
| TemperatureGauge | 28 | 32 |
| VoltageGauge | 12.2 | 11.6 |

## Props (Received from ClusterHost)

ClusterHost maps prefixed editableParameters to generic prop names. Each gauge reads:

| Prop | Type | Description |
|---|---|---|
| `value` | any | Raw store value (fallback: `props.speed` / `props.depth` / `props.temp` / `props.voltage`) |
| `caption` | string | Display caption |
| `unit` | string | Display unit |
| `minValue` | number | Range minimum (display units) |
| `maxValue` | number | Range maximum (display units) |
| `tickMajor` | number | Major tick interval (display units) |
| `tickMinor` | number | Minor tick interval (display units) |
| `showEndLabels` | boolean | Show min/max value labels |
| `warningFrom` | number or undefined | Warning threshold (undefined = disabled) |
| `alarmFrom` | number or undefined | Alarm threshold (undefined = disabled) |
| `captionUnitScale` | number | Caption/unit size relative to value (default 0.8) |
| `{gauge}RatioThresholdNormal` | number | Layout mode threshold (default 1.1) |
| `{gauge}RatioThresholdFlat` | number | Layout mode threshold (default 3.5) |

**Note:** Layout threshold props are gauge-prefixed (`speedRatio...`, `depthRatio...`, `tempRatio...`, `voltageRatio...`). This is the only prop that is not mapped to a generic name by ClusterHost.

### editableParameter → Gauge Prop Mapping (per Cluster)

**Speed cluster** — direct names (no prefix for range/ticks/sectors):
`minValue` → `minValue`, `maxValue` → `maxValue`, `tickMajor` → `tickMajor`, `warningFrom` → `warningFrom`

**Environment cluster** — prefixed:
`depthMinValue` → `minValue`, `depthMaxValue` → `maxValue`, `depthTickMajor` → `tickMajor`, `depthAlarmFrom` → `alarmFrom`, `depthWarningFrom` → `warningFrom`
`tempMinValue` → `minValue`, `tempMaxValue` → `maxValue`, etc.

**Vessel cluster** — prefixed:
`voltageMinValue` → `minValue`, `voltageMaxValue` → `maxValue`, `voltageTickMajor` → `tickMajor`, `voltageAlarmFrom` → `alarmFrom`, `voltageWarningFrom` → `warningFrom`

Enabled/disabled toggles (`speedWarningEnabled`, `depthAlarmEnabled`, etc.) gate whether threshold values are passed or `undefined`.

## Raw Value Prop Fallback

Each gauge checks for a fallback prop name if `props.value` is undefined:

| Gauge | Primary | Fallback |
|---|---|---|
| SpeedGauge | `props.value` | `props.speed` |
| DepthGauge | `props.value` | `props.depth` |
| TemperatureGauge | `props.value` | `props.temp` |
| VoltageGauge | `props.value` | `props.voltage` |

ClusterHost always sets `value`, so the fallback is effectively dead code.

## Phase 1 Refactoring Target

The duplicated functions will be consolidated into GaugeUtils (refactored InstrumentComponents). After refactoring, each gauge should be a compact module containing only:

1. `display*FromRaw()` — gauge-specific value formatting
2. `renderCanvas()` — calling GaugeUtils for all drawing/layout
3. Sector logic selection (high-end vs. low-end strategy)

See [guides/add-new-gauge.md](../guides/add-new-gauge.md) for the target structure.

## Related

- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Visual spec: proportions, colors, layout modes
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — InstrumentComponents API + duplication details
- [../architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost dispatch per cluster
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — Target gauge structure (post-Phase 1)
