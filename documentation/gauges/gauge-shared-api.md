# Gauge Shared API

**Status:** ✅ Implemented | split gauge utility modules + `GaugeToolkit` facade

## Overview

Shared gauge logic is split into focused core modules:

- `GaugeAngleMath` for angle math and value/angle mapping
- `GaugeTickMath` for major/minor tick angle generation
- `GaugeCanvasPrimitives` for low-level canvas primitives
- `GaugeDialRenderer` for radial tick/label/frame drawing
- `GaugeTextLayout` for text fitting/drawing and disconnect overlay
- `GaugeValueMath` for numeric/range/geometry helpers
- `ThemeResolver` for plugin-wide CSS theme token resolution
- `GaugeToolkit` as composed facade
- `SemicircleGaugeEngine` as shared render flow for Speed/Depth/Temperature/Voltage

## Module Registration

`config/components.js` registers these shared modules:

```javascript
GaugeAngleMath: { js: BASE + "shared/widget-kits/gauge/GaugeAngleMath.js", globalKey: "DyniGaugeAngleMath" },
GaugeTickMath: {
  js: BASE + "shared/widget-kits/gauge/GaugeTickMath.js",
  globalKey: "DyniGaugeTickMath",
  deps: ["GaugeAngleMath"]
},
GaugeCanvasPrimitives: {
  js: BASE + "shared/widget-kits/gauge/GaugeCanvasPrimitives.js",
  globalKey: "DyniGaugeCanvasPrimitives",
  deps: ["GaugeAngleMath"]
},
GaugeDialRenderer: {
  js: BASE + "shared/widget-kits/gauge/GaugeDialRenderer.js",
  globalKey: "DyniGaugeDialRenderer",
  deps: ["GaugeAngleMath", "GaugeTickMath", "GaugeCanvasPrimitives"]
},
GaugeTextLayout: { js: BASE + "shared/widget-kits/gauge/GaugeTextLayout.js", globalKey: "DyniGaugeTextLayout" },
GaugeValueMath: { js: BASE + "shared/widget-kits/gauge/GaugeValueMath.js", globalKey: "DyniGaugeValueMath", deps: ["GaugeAngleMath"] },
ThemeResolver: { js: BASE + "shared/theme/ThemeResolver.js", globalKey: "DyniThemeResolver" },
GaugeToolkit: {
  js: BASE + "shared/widget-kits/gauge/GaugeToolkit.js",
  globalKey: "DyniGaugeToolkit",
  deps: ["ThemeResolver", "GaugeTextLayout", "GaugeValueMath", "GaugeAngleMath", "GaugeTickMath", "GaugeCanvasPrimitives", "GaugeDialRenderer"]
},
SemicircleGaugeEngine: {
  js: BASE + "shared/widget-kits/gauge/SemicircleGaugeEngine.js",
  globalKey: "DyniSemicircleGaugeEngine",
  deps: ["GaugeToolkit"]
}
```

## Access Pattern

```javascript
const gaugeUtils = Helpers.getModule("GaugeToolkit") && Helpers.getModule("GaugeToolkit").create(def, Helpers);
const renderer = Helpers.getModule("SemicircleGaugeEngine") && Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);
```

## GaugeToolkit (Facade)

`GaugeToolkit.create(def, Helpers)` returns:

| Field | Type | Description |
|---|---|---|
| `theme` | object | `ThemeResolver` API (`resolve(canvas)`) |
| `text` | object | `GaugeTextLayout` API |
| `value` | object | `GaugeValueMath` API |
| `angle` | object | `GaugeAngleMath` API |
| `tick` | object | `GaugeTickMath` API |
| `draw` | object | merged API from `GaugeCanvasPrimitives` + `GaugeDialRenderer` |

Color-token flow:
- Resolve once per render path with `theme.resolve(canvas)`.
- Pass resolved token object down to sector builders and draw helpers where needed.

## Draw API (`GaugeToolkit.draw`)

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

`draw.drawPointerAtRim(..., opts)` requires `opts.theme.colors.pointer`. Explicit `opts.color`/`opts.fillStyle` overrides are not supported.

## Angle API (`GaugeAngleMath`)

| Function | Purpose |
|---|---|
| `mod` | Positive modulo helper used by angle/tick normalization |
| `degToRad`, `radToDeg` | Degree/radian conversion |
| `norm360`, `norm180` | Angle normalization |
| `degToCanvasRad` | Convert logical degree to canvas radians |
| `valueToAngle`, `angleToValue` | Linear value/angle mapping |
| `valueRangeToAngleRange` | Convert value range to angle range |

## Tick API (`GaugeTickMath`)

| Function | Purpose |
|---|---|
| `computeSweep` | Sweep direction/intensity for start/end |
| `isBeyondEnd` | Shared boundary check for iterative sweep loops |
| `buildTickAngles` | Build major/minor angle arrays |

## GaugeTextLayout API

`GaugeTextLayout.create()` returns shared text helpers:
`setFont`, `fitTextPx`, `fitSingleTextPx`, `measureValueUnitFit`, `drawCaptionMax`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawInlineCapValUnit`, `drawThreeRowsBlock`, `drawDisconnectOverlay`.

## GaugeValueMath API

`GaugeValueMath.create(def, Helpers)` returns shared numeric helpers:
`isFiniteNumber`, `extractNumberText`, `clamp`, `almostInt`, `isApprox`, `computePad`, `computeGap`, `computeMode`, `normalizeRange`, `valueToAngle`, `angleToValue`, `buildValueTickAngles`, `sectorAngles`, `buildHighEndSectors`, `buildLowEndSectors`, `formatAngle180`, `formatDirection360`, `formatMajorLabel`, `computeSemicircleGeometry`.

## SemicircleGaugeEngine API

`SemicircleGaugeEngine.create(def, Helpers).createRenderer(spec)` returns `renderCanvas(canvas, props)`.

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
| `buildSectors` | `(props, minV, maxV, arc, valueUtils, theme) => Sector[]` | yes | Gauge-specific warning/alarm sectors (must use `theme.colors.warning/alarm`) |
| `arc` | `{startDeg,endDeg}` | no | Optional override (default `270..450`) |

### Sector shape

```javascript
{ a0: number, a1: number, color: "#rrggbb" }
```

`color` should come from `theme.colors.warning`/`theme.colors.alarm`. Explicit warning/alarm color overrides are not supported.

## Related

- [../widgets/semicircle-gauges.md](../widgets/semicircle-gauges.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../architecture/component-system.md](../architecture/component-system.md)
