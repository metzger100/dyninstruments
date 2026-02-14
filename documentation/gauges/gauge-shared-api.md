# Gauge Shared API

**Status:** ✅ Implemented | `InstrumentComponents` + `GaugeUtils` split modules

## Overview

Shared gauge logic is now split into focused core modules:

- `InstrumentComponents` for low-level polar/canvas drawing
- `GaugeTextUtils` for text fitting/drawing and disconnect overlay
- `GaugeValueUtils` for range/angle/ticks/sectors/semicircle geometry
- `GaugeUtils` as a facade combining the three APIs
- `SemicircleGaugeRenderer` for the complete shared render flow of Speed/Depth/Temperature/Voltage

This removes the duplicated helper functions from the four semicircle gauges.

## Module Registration

`plugin.js` registers the shared modules in `MODULES`:

```javascript
InstrumentComponents: { js: BASE + "modules/Cores/InstrumentComponents.js", globalKey: "DyniInstrumentComponents" },
GaugeTextUtils: { js: BASE + "modules/Cores/GaugeTextUtils.js", globalKey: "DyniGaugeTextUtils" },
GaugeValueUtils: { js: BASE + "modules/Cores/GaugeValueUtils.js", globalKey: "DyniGaugeValueUtils", deps: ["InstrumentComponents"] },
GaugeUtils: { js: BASE + "modules/Cores/GaugeUtils.js", globalKey: "DyniGaugeUtils", deps: ["InstrumentComponents","GaugeTextUtils","GaugeValueUtils"] },
SemicircleGaugeRenderer: { js: BASE + "modules/Cores/SemicircleGaugeRenderer.js", globalKey: "DyniSemicircleGaugeRenderer", deps: ["GaugeUtils"] }
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
| `available` | boolean | `true` when all shared modules are resolved |
| `text` | object | `GaugeTextUtils` API |
| `value` | object | `GaugeValueUtils` API |
| `IC` | object | `InstrumentComponents` API |

## GaugeTextUtils API

`GaugeTextUtils.create()` returns these methods:

| Function | Signature | Purpose |
|---|---|---|
| `setFont` | `(ctx, px, bold, family)` | Shared font assignment helper |
| `fitTextPx` | `(ctx, text, maxW, maxH, family, bold)` | Largest font size fitting width/height |
| `measureValueUnitFit` | `(ctx, family, value, unit, w, h, secScale)` | Fit value+unit on one line |
| `drawCaptionMax` | `(ctx, family, x, y, w, h, caption, capMaxPx, align)` | Draw caption with optional max size |
| `drawValueUnitWithFit` | `(ctx, family, x, y, w, h, value, unit, fit, align)` | Render measured value+unit pair |
| `fitInlineCapValUnit` | `(ctx, family, caption, value, unit, maxW, maxH, secScale)` | Fit inline caption-value-unit row |
| `drawInlineCapValUnit` | `(ctx, family, x, y, w, h, caption, value, unit, fit)` | Draw inline row centered in box |
| `drawThreeRowsBlock` | `(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes)` | Draw caption/value/unit stacked block |
| `drawDisconnectOverlay` | `(ctx, W, H, family, color, label)` | Shared “NO DATA” overlay |

## GaugeValueUtils API

`GaugeValueUtils.create(def, Helpers)` returns:

| Function | Signature | Purpose |
|---|---|---|
| `isFiniteNumber` | `(n)` | Numeric finite check |
| `clamp` | `(value, lo, hi)` | Clamp helper |
| `almostInt` | `(value, eps)` | Integer proximity check |
| `isApprox` | `(a, b, eps)` | Floating-point comparison |
| `computePad` | `(W, H)` | Shared outer padding (`max(6, min(W,H)*0.04)`) |
| `computeGap` | `(W, H)` | Shared spacing gap (`max(6, min(W,H)*0.03)`) |
| `computeMode` | `(ratio, thresholdNormal, thresholdFlat)` | Returns `high`, `normal`, or `flat` |
| `normalizeRange` | `(minRaw, maxRaw, defaultMin, defaultMax)` | Safe value range normalization |
| `valueToAngle` | `(value, minV, maxV, arc, doClamp)` | Value→angle mapping (delegates to IC when available) |
| `angleToValue` | `(angleDeg, minV, maxV, arc, doClamp)` | Angle→value mapping |
| `buildValueTickAngles` | `(minV, maxV, majorStep, minorStep, arc)` | Build major/minor tick angles |
| `sectorAngles` | `(from, to, minV, maxV, arc)` | Value range to sector angle pair |
| `formatMajorLabel` | `(value)` | Tick label formatting |
| `computeSemicircleGeometry` | `(W, H, pad)` | Radius/center/ring metrics for N-shape gauges |

## SemicircleGaugeRenderer API

`SemicircleGaugeRenderer.create(def, Helpers).createRenderer(spec)` returns a `renderCanvas(canvas, props)` function.

### `spec` Fields

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

### Sector Shape

```javascript
{ a0: number, a1: number, color: "#rrggbb" }
```

## InstrumentComponents

`InstrumentComponents` remains unchanged and is still the shared source for:

- Polar angle math (`valueToAngle`, `angleToValue`, `degToCanvasRad`, ...)
- Arc/tick/label drawing (`drawArcRing`, `drawAnnularSector`, `drawTicksFromAngles`, `drawLabels`)
- Pointer and marker primitives (`drawPointerAtRim`, `drawRimMarker`)

## Related

- [modules/semicircle-gauges.md](../modules/semicircle-gauges.md)
- [guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [architecture/module-system.md](../architecture/module-system.md)
