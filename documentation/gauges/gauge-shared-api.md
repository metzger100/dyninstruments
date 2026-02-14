# Gauge Shared API

**Status:** ✅ Implemented | split gauge utility modules + `GaugeUtils` facade

## Overview

Shared gauge logic is split into focused core modules:

- `GaugeAngleUtils` for angle math and value/angle mapping
- `GaugeTickUtils` for major/minor tick angle generation
- `GaugePrimitiveDrawUtils` for low-level canvas primitives
- `GaugeDialDrawUtils` for radial tick/label/frame drawing
- `GaugeTextUtils` for text fitting/drawing and disconnect overlay
- `GaugeValueUtils` for numeric/range/geometry helpers
- `GaugeUtils` as composed facade
- `SemicircleGaugeRenderer` as shared render flow for Speed/Depth/Temperature/Voltage

## Module Registration

`config/modules.js` registers these shared modules:

```javascript
GaugeAngleUtils: { js: BASE + "modules/Cores/GaugeAngleUtils.js", globalKey: "DyniGaugeAngleUtils" },
GaugeTickUtils: { js: BASE + "modules/Cores/GaugeTickUtils.js", globalKey: "DyniGaugeTickUtils" },
GaugePrimitiveDrawUtils: {
  js: BASE + "modules/Cores/GaugePrimitiveDrawUtils.js",
  globalKey: "DyniGaugePrimitiveDrawUtils",
  deps: ["GaugeAngleUtils"]
},
GaugeDialDrawUtils: {
  js: BASE + "modules/Cores/GaugeDialDrawUtils.js",
  globalKey: "DyniGaugeDialDrawUtils",
  deps: ["GaugeAngleUtils", "GaugeTickUtils", "GaugePrimitiveDrawUtils"]
},
GaugeTextUtils: { js: BASE + "modules/Cores/GaugeTextUtils.js", globalKey: "DyniGaugeTextUtils" },
GaugeValueUtils: { js: BASE + "modules/Cores/GaugeValueUtils.js", globalKey: "DyniGaugeValueUtils", deps: ["GaugeAngleUtils"] },
GaugeUtils: {
  js: BASE + "modules/Cores/GaugeUtils.js",
  globalKey: "DyniGaugeUtils",
  deps: ["GaugeTextUtils", "GaugeValueUtils", "GaugeAngleUtils", "GaugeTickUtils", "GaugePrimitiveDrawUtils", "GaugeDialDrawUtils"]
},
SemicircleGaugeRenderer: {
  js: BASE + "modules/Cores/SemicircleGaugeRenderer.js",
  globalKey: "DyniSemicircleGaugeRenderer",
  deps: ["GaugeUtils"]
}
```

## Access Pattern

```javascript
const gaugeUtils = Helpers.getModule("GaugeUtils") && Helpers.getModule("GaugeUtils").create(def, Helpers);
const renderer = Helpers.getModule("SemicircleGaugeRenderer") && Helpers.getModule("SemicircleGaugeRenderer").create(def, Helpers);
```

## GaugeUtils (Facade)

`GaugeUtils.create(def, Helpers)` returns:

| Field | Type | Description |
|---|---|---|
| `text` | object | `GaugeTextUtils` API |
| `value` | object | `GaugeValueUtils` API |
| `angle` | object | `GaugeAngleUtils` API |
| `tick` | object | `GaugeTickUtils` API |
| `draw` | object | merged API from `GaugePrimitiveDrawUtils` + `GaugeDialDrawUtils` |

## Draw API (`GaugeUtils.draw`)

| Function | Purpose |
|---|---|
| `drawRing` | Draw full circular ring |
| `drawArcRing` | Draw stroked arc segment |
| `drawAnnularSector` | Draw filled annular sector |
| `drawArrow` | Draw line arrow |
| `drawPointerAtRim` | Draw triangular pointer at rim |
| `drawRimMarker` | Draw short radial marker at rim |
| `drawTicksFromAngles` | Draw major/minor ticks from angle lists |
| `drawTicks` | Build and draw ticks from step config |
| `drawLabels` | Draw labels on arc/circle |
| `drawDialFrame` | Convenience ring + ticks + labels |

## Angle API (`GaugeAngleUtils`)

| Function | Purpose |
|---|---|
| `degToRad`, `radToDeg` | Degree/radian conversion |
| `norm360`, `norm180` | Angle normalization |
| `degToCanvasRad` | Convert logical degree to canvas radians |
| `valueToAngle`, `angleToValue` | Linear value/angle mapping |
| `valueRangeToAngleRange` | Convert value range to angle range |

## Tick API (`GaugeTickUtils`)

| Function | Purpose |
|---|---|
| `computeSweep` | Sweep direction/intensity for start/end |
| `buildTickAngles` | Build major/minor angle arrays |

## GaugeTextUtils API

`GaugeTextUtils.create()` returns shared text helpers:
`setFont`, `fitTextPx`, `measureValueUnitFit`, `drawCaptionMax`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawInlineCapValUnit`, `drawThreeRowsBlock`, `drawDisconnectOverlay`.

## GaugeValueUtils API

`GaugeValueUtils.create(def, Helpers)` returns shared numeric helpers:
`isFiniteNumber`, `clamp`, `almostInt`, `isApprox`, `computePad`, `computeGap`, `computeMode`, `normalizeRange`, `valueToAngle`, `angleToValue`, `buildValueTickAngles`, `sectorAngles`, `formatMajorLabel`, `computeSemicircleGeometry`.

## SemicircleGaugeRenderer API

`SemicircleGaugeRenderer.create(def, Helpers).createRenderer(spec)` returns `renderCanvas(canvas, props)`.

### `spec` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `rawValueKey` | string | yes | Fallback key when `props.value` is undefined |
| `unitDefault` | string | yes | Default unit text |
| `rangeDefaults` | `{min,max}` | yes | Default value range |
| `ratioProps` | `{normal,flat}` | yes | Prop names for layout thresholds |
| `ratioDefaults` | `{normal,flat}` | yes | Default layout thresholds |
| `tickSteps` | `(range) => {major,minor}` | yes | Gauge-specific tick strategy |
| `formatDisplay` | `(raw, props, unit, Helpers) => {num,text}` | yes | Gauge-specific value formatter |
| `buildSectors` | `(props, minV, maxV, arc, valueUtils) => Sector[]` | yes | Gauge-specific warning/alarm sectors |
| `arc` | `{startDeg,endDeg}` | no | Optional override (default `270..450`) |

### Sector shape

```javascript
{ a0: number, a1: number, color: "#rrggbb" }
```

## Related

- [../modules/semicircle-gauges.md](../modules/semicircle-gauges.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../architecture/module-system.md](../architecture/module-system.md)
