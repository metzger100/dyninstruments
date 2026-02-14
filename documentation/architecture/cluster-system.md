# Cluster System

**Status:** ✅ Implemented | ClusterHost.js

## Overview

ClusterHost is a meta-module that dispatches rendering to the appropriate sub-renderer based on the user-selected `kind`. Every registered widget uses ClusterHost as its module.

## How It Works

1. User selects a `kind` in the AvNav editor (e.g. "sogGraphic")
2. AvNav calls `translateFunction(props)` on ClusterHost
3. ClusterHost checks `props.cluster` and `props.kind`
4. For graphic kinds → sets `{ renderer: "SpeedGauge", ...gaugeProps }`
5. For numeric kinds → sets `{ value, caption, unit, formatter, formatterParameters }`
6. `renderCanvas()` calls `pickRenderer(props)` which delegates to the correct sub-renderer

## Translate Dispatch

ClusterHost's `translateFunction` dispatches by cluster name, then by kind:

### courseHeading Cluster

| Kind | Renderer | Formatter | Notes |
|---|---|---|---|
| `cog` | ThreeElements | `formatDirection360` | Course over ground |
| `hdt` | ThreeElements | `formatDirection360` | Heading true |
| `hdm` | ThreeElements | `formatDirection360` | Heading magnetic |
| `brg` | ThreeElements | `formatDirection360` | Bearing to WP |
| `hdtGraphic` | CompassGauge | (internal) | Compass dial |
| `hdmGraphic` | CompassGauge | (internal) | Compass dial |

### speed Cluster

| Kind | Renderer | Formatter | Notes |
|---|---|---|---|
| `sog` | ThreeElements | `formatSpeed` | Speed over ground |
| `stw` | ThreeElements | `formatSpeed` | Speed through water |
| `sogGraphic` | SpeedGauge | (internal) | Speed gauge |
| `stwGraphic` | SpeedGauge | (internal) | Speed gauge |

### environment Cluster

| Kind | Renderer | Formatter | Notes |
|---|---|---|---|
| `depth` | ThreeElements | `formatDecimal` [3,1,true] | Depth numeric |
| `depthGraphic` | DepthGauge | (internal) | Depth gauge |
| `temp` | ThreeElements | `formatTemperature` ['celsius'] | Temp numeric |
| `tempGraphic` | TemperatureGauge | (internal) | Temp gauge |
| `pressure` | ThreeElements | `skPressure` ['hPa'] | Pressure numeric |

### wind Cluster

| Kind | Renderer | Formatter | Notes |
|---|---|---|---|
| `angleTrue` | ThreeElements | custom fn (±180) | TWA |
| `angleApparent` | ThreeElements | custom fn (±180) | AWA |
| `angleTrueDirection` | ThreeElements | custom fn (0-360) | TWD |
| `speedTrue` | ThreeElements | `formatSpeed` | TWS |
| `speedApparent` | ThreeElements | `formatSpeed` | AWS |
| `angleTrueGraphic` | WindDial | (internal) | Wind dial |
| `angleApparentGraphic` | WindDial | (internal) | Wind dial |

### Other Clusters (All Numeric/ThreeElements)

| Cluster | Kinds | Formatter |
|---|---|---|
| `position` | boat, wp | `formatLonLats` |
| `distance` | dst, route, anchor, watch | `formatDistance` |
| `time` | (single) | `formatTime` |
| `nav` | eta, rteEta, dst, rteDistance, vmg, clock, positionBoat, positionWp | Various |
| `anchor` | distance, watch, bearing | `formatDistance` / `formatDirection360` |
| `vessel` | voltage, voltageGraphic | `formatDecimal` / VoltageGauge |

## pickRenderer Function

```javascript
function pickRenderer(props) {
  if (props.renderer === 'WindDial')         return dialSpec;
  if (props.renderer === 'CompassGauge')     return compassSpec;
  if (props.renderer === 'SpeedGauge')       return speedGaugeSpec;
  if (props.renderer === 'DepthGauge')       return depthSpec;
  if (props.renderer === 'TemperatureGauge') return tempSpec;
  if (props.renderer === 'VoltageGauge')     return voltageSpec;
  return threeSpec;  // Default: ThreeElements (numeric display)
}
```

## Caption/Unit Resolution

Per-kind captions and units are stored as `caption_{kindName}` and `unit_{kindName}` in props. ClusterHost resolves them:

```javascript
const cap  = (k) => p['caption_' + k];
const unit = (k) => p['unit_' + k];
// Then: out(value, cap(effKind), unit(effKind), formatter, params)
```

## Numeric Output Helper

`out(v, cap, unit, formatter, formatterParameters)` builds the props object for ThreeElements:

| Param | Type | Description |
|---|---|---|
| `v` | any | Raw store value |
| `cap` | string | Caption from `p['caption_' + kind]` |
| `unit` | string | Unit from `p['unit_' + kind]` |
| `formatter` | string/fn | Formatter name or function |
| `formatterParameters` | array | Params passed to formatter |

Returns object with only defined fields set (undefined values are omitted).
Used by all numeric kind dispatch cases.

## Adding a New Renderer to ClusterHost

To add a new graphic renderer (e.g. BarometerGauge):

1. Load the module in ClusterHost deps: add to `MODULES.ClusterHost.deps`
2. In `create()`: `const baroMod = Helpers.getModule('BarometerGauge');` + create spec
3. In `translateFunction()`: add dispatch case for the cluster/kind
4. In `pickRenderer()`: add `if (props.renderer === 'BarometerGauge') return baroSpec;`
5. Include in `wantsHide` and `finalizeFunction` arrays

### Graphic Kind Props Mapping Example (DepthGauge)

editableParameter names → translateFunction output props:

| editableParameter | Gauge Prop | Notes |
|---|---|---|
| `depthMinValue` | `minValue` | `Number(p.depthMinValue)` |
| `depthMaxValue` | `maxValue` | `Number(p.depthMaxValue)` |
| `depthTickMajor` | `tickMajor` | |
| `depthTickMinor` | `tickMinor` | |
| `depthShowEndLabels` | `showEndLabels` | `!!p.depthShowEndLabels` |
| `depthWarningFrom` | `warningFrom` | Only if `depthWarningEnabled !== false` |
| `depthAlarmFrom` | `alarmFrom` | Only if `depthAlarmEnabled !== false` |
| `depthRatioThresholdNormal` | `depthRatioThresholdNormal` | Passed through 1:1 |
| `depthRatioThresholdFlat` | `depthRatioThresholdFlat` | Passed through 1:1 |
| `captionUnitScale` | `captionUnitScale` | Shared across all gauges |

Pattern: Gauge-prefixed editableParameter → generic prop name.
Enabled/disabled flags gate whether threshold values are passed or `undefined`.

## File Location

- **ClusterHost:** `modules/ClusterHost/ClusterHost.js`
- **Cluster definitions:** `config/clusters/*.js` (assembled in `config/instruments.js`)

## Related

- [module-system.md](module-system.md) — How modules and dependencies are loaded
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — translateFunction in render cycle
