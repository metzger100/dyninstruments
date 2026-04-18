# Gauge Shared API

**Status:** ✅ Implemented | split gauge utility modules + `RadialToolkit` facade

## Overview

Shared gauge logic is split into focused core modules:

- `RadialAngleMath` for angle math and value/angle mapping
- `RadialTickMath` for major/minor tick angle generation
- `RadialCanvasPrimitives` for low-level canvas primitives
- `RadialFrameRenderer` for radial tick/label/frame drawing
- `RadialTextLayout` for text fitting/drawing
- `RadialValueMath` for numeric/range/geometry helpers
- `TextLayoutPrimitives` for binary-fit and inline draw primitives
- `TextLayoutComposite` for reusable multi-row text layouts
- `TextLayoutEngine` as text-layout facade (mode routing + cache + composed helpers)
- `ThemeResolver` for plugin-wide CSS theme token resolution
- `RadialToolkit` as composed facade
- `SemicircleRadialLayout` as shared responsive layout owner for Speed/Depth/Temperature/Voltage
- `SemicircleRadialTextLayout` as shared mode text helper for Speed/Depth/Temperature/Voltage
- `SemicircleRadialEngine` as shared render flow for Speed/Depth/Temperature/Voltage
- `FullCircleRadialLayout` as shared responsive layout owner for Compass/Wind dials
- `FullCircleRadialEngine` as shared render flow for Compass/Wind dials
- `FullCircleRadialTextLayout` as shared mode text helper for full-circle wrappers

## Responsive Ownership Contract

- `ResponsiveScaleProfile` owns the shared `minDim -> t -> textFillScale` compaction curve.
- `SemicircleRadialLayout` and `FullCircleRadialLayout` map that curve into family-specific insets, geometry, label metrics, slot bounds, and geometry scales.
- `SemicircleRadialEngine`, `SemicircleRadialTextLayout`, `FullCircleRadialEngine`, `FullCircleRadialTextLayout`, and wrapper callbacks consume layout-owned `responsive`, `textFillScale`, and `compactGeometryScale`.
- Wrapper widgets must not import `ResponsiveScaleProfile` or add widget-local user-visible responsive floors; compact policy stays in the layout owners.

## Module Registration

`config/components/registry-shared-foundation.js` and `config/components/registry-shared-engines.js` (assembled by `config/components.js`) register these shared modules:

```javascript
RadialAngleMath: { js: BASE + "shared/widget-kits/radial/RadialAngleMath.js", globalKey: "DyniRadialAngleMath" },
RadialTickMath: {
  js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
  globalKey: "DyniRadialTickMath",
  deps: ["RadialAngleMath"]
},
RadialCanvasPrimitives: {
  js: BASE + "shared/widget-kits/radial/RadialCanvasPrimitives.js",
  globalKey: "DyniRadialCanvasPrimitives",
  deps: ["RadialAngleMath"]
},
RadialFrameRenderer: {
  js: BASE + "shared/widget-kits/radial/RadialFrameRenderer.js",
  globalKey: "DyniRadialFrameRenderer",
  deps: ["RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives"]
},
RadialTextLayout: { js: BASE + "shared/widget-kits/radial/RadialTextLayout.js", globalKey: "DyniRadialTextLayout" },
RadialValueMath: { js: BASE + "shared/widget-kits/radial/RadialValueMath.js", globalKey: "DyniRadialValueMath", deps: ["RadialAngleMath"] },
TextLayoutPrimitives: {
  js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
  globalKey: "DyniTextLayoutPrimitives",
  deps: ["RadialTextLayout"]
},
TextLayoutComposite: {
  js: BASE + "shared/widget-kits/text/TextLayoutComposite.js",
  globalKey: "DyniTextLayoutComposite",
  deps: ["TextLayoutPrimitives"]
},
TextLayoutEngine: {
  js: BASE + "shared/widget-kits/text/TextLayoutEngine.js",
  globalKey: "DyniTextLayoutEngine",
  deps: ["RadialValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]
},
ThemeResolver: { js: BASE + "shared/theme/ThemeResolver.js", globalKey: "DyniThemeResolver" },
RadialToolkit: {
  js: BASE + "shared/widget-kits/radial/RadialToolkit.js",
  globalKey: "DyniRadialToolkit",
  deps: ["ThemeResolver", "RadialTextLayout", "RadialValueMath", "RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives", "RadialFrameRenderer"]
},
SemicircleRadialLayout: {
  js: BASE + "shared/widget-kits/radial/SemicircleRadialLayout.js",
  globalKey: "DyniSemicircleRadialLayout",
  deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
},
SemicircleRadialTextLayout: {
  js: BASE + "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
  globalKey: "DyniSemicircleRadialTextLayout"
},
SemicircleRadialEngine: {
  js: BASE + "shared/widget-kits/radial/SemicircleRadialEngine.js",
  globalKey: "DyniSemicircleRadialEngine",
  deps: ["RadialToolkit", "SemicircleRadialLayout", "SemicircleRadialTextLayout"]
},
FullCircleRadialLayout: {
  js: BASE + "shared/widget-kits/radial/FullCircleRadialLayout.js",
  globalKey: "DyniFullCircleRadialLayout",
  deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
},
FullCircleRadialEngine: {
  js: BASE + "shared/widget-kits/radial/FullCircleRadialEngine.js",
  globalKey: "DyniFullCircleRadialEngine",
  deps: ["RadialToolkit", "CanvasLayerCache", "FullCircleRadialLayout"]
},
FullCircleRadialTextLayout: {
  js: BASE + "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
  globalKey: "DyniFullCircleRadialTextLayout"
}
```

## Access Pattern

```javascript
const gaugeUtils = Helpers.getModule("RadialToolkit") && Helpers.getModule("RadialToolkit").create(def, Helpers);
const renderer = Helpers.getModule("SemicircleRadialEngine") && Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
const fullCircle = Helpers.getModule("FullCircleRadialEngine") && Helpers.getModule("FullCircleRadialEngine").create(def, Helpers);
```

## RadialToolkit (Facade)

`RadialToolkit.create(def, Helpers)` returns:

| Field | Type | Description |
|---|---|---|
| `theme` | object | `ThemeResolver` API (`resolveForRoot(rootEl)`) |
| `text` | object | `RadialTextLayout` API |
| `value` | object | `RadialValueMath` API |
| `angle` | object | `RadialAngleMath` API |
| `tick` | object | `RadialTickMath` API |
| `draw` | object | merged API from `RadialCanvasPrimitives` + `RadialFrameRenderer` |

Color-token flow:
- Resolve once per render path with `theme.resolveForRoot(Helpers.requirePluginRoot(canvas))`.
- Pass resolved token object down to sector builders and draw helpers where needed.

## Draw API (`RadialToolkit.draw`)

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
| `drawLabels` | Draw labels on arc/circle (`opts.weight` numeric font weight) |
| `drawDialFrame` | Convenience ring + ticks + labels |

`draw.drawPointerAtRim(..., opts)` consumes scalar style inputs (`opts.fillStyle` or `opts.color`) plus shape factors (`opts.widthFactor`, `opts.lengthFactor`).
`draw.drawLabels(..., opts)` consumes numeric font weight via `opts.weight`.

## Angle API (`RadialAngleMath`)

| Function | Purpose |
|---|---|
| `mod` | Positive modulo helper used by angle/tick normalization |
| `degToRad`, `radToDeg` | Degree/radian conversion |
| `norm360`, `norm180` | Angle normalization |
| `degToCanvasRad` | Convert logical degree to canvas radians |
| `valueToAngle`, `angleToValue` | Linear value/angle mapping |
| `valueRangeToAngleRange` | Convert value range to angle range |

## Tick API (`RadialTickMath`)

| Function | Purpose |
|---|---|
| `computeSweep` | Sweep direction/intensity for start/end |
| `isBeyondEnd` | Shared boundary check for iterative sweep loops |
| `buildTickAngles` | Build major/minor angle arrays |

## RadialTextLayout API

`RadialTextLayout.create()` returns shared text helpers:
`setFont`, `measureTextWidth`, `fitTextPx`, `fitSingleTextPx`, `measureValueUnitFit`, `drawCaptionMax`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawInlineCapValUnit`, `drawThreeRowsBlock`.

Key signatures:

- `setFont(ctx, px, weight, family)`
- `measureTextWidth(ctx, text)`
- `fitTextPx(ctx, text, maxW, maxH, family, weight)`
- `fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, weight)`
- Composite helpers (`measureValueUnitFit`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawInlineCapValUnit`, `drawThreeRowsBlock`) accept both `valueWeight` and `labelWeight` numeric arguments.

## RadialValueMath API

`RadialValueMath.create(def, Helpers)` returns shared numeric helpers:
`isFiniteNumber`, `extractNumberText`, `clamp`, `almostInt`, `isApprox`, `computePad`, `computeGap`, `computeMode`, `resolveSemicircleTickSteps`, `resolveStandardSemicircleTickSteps`, `resolveTemperatureSemicircleTickSteps`, `resolveVoltageSemicircleTickSteps`, `normalizeRange`, `valueToAngle`, `angleToValue`, `buildValueTickAngles`, `sectorAngles`, `buildHighEndSectors`, `buildLowEndSectors`, `formatAngle180`, `formatDirection360`, `formatMajorLabel`, `computeSemicircleGeometry`.

### Semicircle Tick-Step Resolvers

`RadialValueMath` exposes shared preset-driven tick-step helpers used by semicircle wrappers:

- `resolveSemicircleTickSteps(range, profileName)` where `profileName` is one of `standard`, `temperature`, `voltage` (unknown profiles fall back to `standard`)
- `resolveStandardSemicircleTickSteps(range)`
- `resolveTemperatureSemicircleTickSteps(range)`
- `resolveVoltageSemicircleTickSteps(range)`

All resolvers return `{ major, minor }` and preserve explicit profile defaults for invalid/non-positive ranges.

### `computeSemicircleGeometry(W, H, pad, overrides?)`

Computes centered semicircle geometry metrics:

- Returns: `{ availW, availH, R, gaugeLeft, gaugeTop, cx, cy, rOuter, ringW, needleDepth }`
- Backward compatible: existing 3-argument calls are unchanged

Optional `overrides` fields:

| Field | Type | Default | Behavior |
|---|---|---|---|
| `ringWidthFactor` | number | `0.12` | Computes `ringW = max(6, floor(R * ringWidthFactor))` |
| `needleDepthFactor` | number | derived | If provided: `needleDepth = max(8, floor(ringW * needleDepthFactor))`; if omitted, default pointer depth is decoupled from ring thickness via `max(8, floor(R * 0.11))` |

## TextLayoutEngine API

`TextLayoutEngine.create(def, Helpers)` returns:

- Cache/mode helpers: `createFitCache`, `clearFitCache`, `makeFitCacheKey`, `readFitCache`, `writeFitCache`, `resolveFitCache`, `computeModeLayout`, `computeInsets`
- Primitive text helpers: `setFont`, `fitSingleLineBinary`, `fitMultiRowBinary`, `fitValueUnitRow`, `fitInlineTriplet`, `drawInlineTriplet`
- Composite block helpers: `fitThreeRowBlock`, `drawThreeRowBlock`, `fitValueUnitCaptionRows`, `drawValueUnitCaptionRows`, `fitTwoRowsWithHeader`, `drawTwoRowsWithHeader`

## SemicircleRadialEngine API

`SemicircleRadialEngine.create(def, Helpers).createRenderer(spec)` returns `renderCanvas(canvas, props)`.

Responsive ownership for the semicircle family:

- `SemicircleRadialLayout` owns mode selection, compact insets, gauge geometry, label metrics, and mode boxes
- `SemicircleRadialTextLayout` owns fit caching and mode-routed text draw for `flat` / `high` / `normal`
- `SemicircleRadialEngine` orchestrates theme resolve, sectors, pointer, ticks, labels, and delegated text draw

## SemicircleRadialLayout API

`SemicircleRadialLayout.create(def, Helpers)` returns:

- `computeMode(W, H, thresholdNormal, thresholdFlat)`
- `computeInsets(W, H)` -> `{ pad, gap, responsive }`
- `computeLayout({ W, H, theme, mode, insets, responsive })`

`computeLayout(...)` returns layout-owned geometry:

- `geom` (`R`, `cx`, `cy`, `rOuter`, `ringW`, `needleDepth`, placement)
- `labels` (`radiusOffset`, `fontPx`)
- `flat` boxes (`box`, `topBox`, `bottomBox`)
- `high.bandBox`
- `normal` bounds (`rSafe`, `yBottom`, `mhMax`, `mhMin`)
- `responsive`, `textFillScale`, `compactGeometryScale`

## SemicircleRadialTextLayout API

`SemicircleRadialTextLayout.create(def, Helpers)` returns:

- `createFitCache()`
- `drawModeText(state, display, fitCache)`

`drawModeText(...)` expects layout-owned state from `SemicircleRadialEngine` and routes to the correct flat/high/normal text path while reusing per-mode fit-cache entries.

### `spec` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `rawValueKey` | string | yes | Fallback key when `props.value` is undefined |
| `unitDefault` | string | yes | Default unit text |
| `rangeDefaults` | `{min,max}` | no | Engine-level safety fallback for missing range props; config-backed wrappers should omit it |
| `ratioProps` | `{normal,flat}` | yes | Prop names for layout thresholds |
| `ratioDefaults` | `{normal,flat}` | no | Engine-level safety fallback for missing threshold props; config-backed wrappers should omit it |
| `tickSteps` | `(range) => {major,minor}` | yes | Gauge-specific tick strategy (wrappers should delegate to shared `RadialValueMath` resolver methods) |
| `formatDisplay` | `(raw, props, unit, Helpers) => {num,text}` | yes | Gauge-specific value formatter |
| `buildSectors` | `(props, minV, maxV, arc, valueUtils, theme) => Sector[]` | yes | Gauge-specific warning/alarm sectors (wrappers typically pass `theme.colors.warning/alarm` into shared builders) |
| `arc` | `{startDeg,endDeg}` | no | Optional override (default `270..450`) |

Config-backed plugin wrappers should pass `rangeProps` / `ratioProps` and trust the editable/default pipeline to populate live min/max and threshold values. `rangeDefaults` and `ratioDefaults` remain available only for non-config consumers.

### Sector shape

```javascript
{ a0: number, a1: number, color: "#rrggbb" }
```

`color` should come from wrapper-selected tokens (typically `theme.colors.warning`/`theme.colors.alarm`).

## FullCircleRadialEngine API

`FullCircleRadialEngine.create(def, Helpers).createRenderer(spec)` returns `renderCanvas(canvas, props)`.

Responsive ownership for the full-circle family:

- `FullCircleRadialLayout` owns mode selection, compact insets, dial geometry, label metrics, slot bounds, and normal-mode safe-radius limits.
- `FullCircleRadialTextLayout` consumes layout-owned state plus `textFillScale` for mode-routed text drawing.
- `FullCircleRadialEngine` orchestrates theme resolve, static-layer caching, shared draw helpers, and delegated widget callbacks.

## FullCircleRadialLayout API

`FullCircleRadialLayout.create(def, Helpers)` returns:

- `computeMode(W, H, thresholdNormal, thresholdFlat)`
- `computeInsets(W, H)` -> `{ pad, gap, responsive }`
- `computeLayout({ W, H, theme, mode, insets, responsive, layoutConfig? })`

`computeLayout(...)` returns layout-owned state:

- `geom` (`R`, `cx`, `cy`, `rOuter`, `ringW`, `needleDepth`, `fixedPointerDepth`, `markerLen`, `markerWidth`, strips)
- `labels` (`radiusOffset`, `fontPx`, `spriteRadius`)
- `slots` (`leftTop`, `leftBottom`, `rightTop`, `rightBottom`, `top`, `bottom`)
- `normal` (`safeRadius`, `compactCenterHeight`, `dualCompactWidth`, `dualCompactInset`, `dualCompactHeight`)
- `responsive`, `textFillScale`, `compactGeometryScale`

### `spec` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `ratioProps` | `{normal,flat}` | no | Prop names for mode thresholds |
| `ratioDefaults` | `{normal,flat}` | no | Engine-level safety fallback for missing threshold props; config-backed wrappers should omit it |
| `cacheLayers` | `string[]` | no | Layer names for `CanvasLayerCache` |
| `layout` | object | no | Shared slot factors (`highTopFactor`, `highBottomFactor`) |
| `buildStaticKey` | `(state, props) => any` | no | Widget static-key payload |
| `rebuildLayer` | `(layerCtx, layerName, state, props, api) => void` | no | Static-layer rebuild callback |
| `drawFrame` | `(state, props, api) => void` | no | Per-frame dynamic draw callback |
| `drawMode` | `{flat?,high?,normal?}` | no | Mode-specific text/layout callback map |

### Callback API helpers

- `drawFullCircleRing(targetCtx?, opts?)`
- `drawFullCircleTicks(targetCtx?, opts?)`
- `drawFixedPointer(targetCtx?, angleDeg, opts?)`
- `drawCachedLayer(layerName?, opts?)` (`rotationDeg` supported)
- `getCacheMeta(key)` / `setCacheMeta(key, value)`

## FullCircleRadialTextLayout API

`FullCircleRadialTextLayout.create(def, Helpers)` returns:

- `drawSingleModeText(state, mode, display, opts?)`
- `drawDualModeText(state, mode, left, right, opts?)`

## Related

- [../widgets/semicircle-gauges.md](../widgets/semicircle-gauges.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../architecture/component-system.md](../architecture/component-system.md)
