# Gauge Shared API Reference

**Status:** ✅ Implemented | Per-module API reference split out of `gauge-shared-api.md`

## Overview

This document holds the detailed per-module API reference for the shared gauge toolkit modules introduced in
[gauge-shared-api.md](gauge-shared-api.md). It was split out to keep both files under the repository's 400-line
documentation limit; read `gauge-shared-api.md` first for the facade overview, module registration, and responsive
ownership contract, then use this file for exact function/field signatures.

## Key Details

- Covers the low-level `RadialAngleMath` and `RadialTickMath` function tables, the generic `CanvasTextFitting` /
  `CanvasTextLayout` signatures, `ValueMath` / `RadialValueMath` API surfaces, `TextLayoutEngine` helper groups, and the
  full `spec` field contracts for `SemicircleRadialEngine` and `FullCircleRadialEngine`.
- `SemicircleRadialLayout.computeLayout(...)` and `FullCircleRadialLayout.computeLayout(...)` are the sole owners of
  their family's layout-derived geometry (`geom`, `labels`, mode boxes/slots, `responsive`/`textFillScale`).
- Sector shape for both families is `{ a0: number, a1: number, color: "#rrggbb" }`; `color` must come from
  wrapper-selected theme tokens.

## Angle API (`RadialAngleMath`)

| Function                       | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `mod`                          | Positive modulo helper used by angle/tick normalization |
| `degToRad`, `radToDeg`         | Degree/radian conversion                                |
| `norm360`, `norm180`           | Angle normalization                                     |
| `degToCanvasRad`               | Convert logical degree to canvas radians                |
| `valueToAngle`, `angleToValue` | Linear value/angle mapping                              |
| `valueRangeToAngleRange`       | Convert value range to angle range                      |

## Tick API (`RadialTickMath`)

| Function          | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `computeSweep`    | Sweep direction/intensity for start/end         |
| `isBeyondEnd`     | Shared boundary check for iterative sweep loops |
| `buildTickAngles` | Build major/minor angle arrays                  |

## Canvas Text Helper API

`CanvasTextFitting.create()` and `CanvasTextLayout.create()` return shared text helpers: `setFont`, `measureTextWidth`,
`fitTextPx`, `fitSingleTextPx`, `measureValueUnitFit`, `drawCaptionMax`, `drawValueUnitWithFit`, `fitInlineCapValUnit`,
`drawInlineCapValUnit`, `drawThreeRowsBlock`.

`RadialTextFitting` and `RadialTextLayout` delegate to these generic modules and must not grow new generic behavior.

Key signatures:

- `setFont(ctx, px, weight, family)`
- `measureTextWidth(ctx, text)`
- `fitTextPx(ctx, text, maxW, maxH, family, weight)`
- `fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, weight)`
- Composite helpers (`measureValueUnitFit`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawInlineCapValUnit`,
  `drawThreeRowsBlock`) accept both `valueWeight` and `labelWeight` numeric arguments.

## ValueMath And RadialValueMath API

`ValueMath.create(def, componentContext)` returns shared numeric helpers: `isFiniteNumber`, `toFiniteNumber`,
`extractNumberText`, `trimText`, `clamp`, `clampPositive`, `almostInt`, `isApprox`, `computePad`, `computeGap`,
`computeMode`, `resolveTickSteps`, `resolveStandardTickSteps`, `resolveTemperatureTickSteps`, `resolveVoltageTickSteps`,
`normalizeRange`, `formatAngle180`, `formatDirection360`, and `formatMajorLabel`.

`RadialValueMath.create(def, componentContext)` composes `ValueMath` with radial value/angle helpers for direct radial
callers: `valueToAngle`, `angleToValue`, `buildValueTickAngles`, `sectorAngles`, `buildHighEndSectors`, and
`buildLowEndSectors`.

Internal Dyni modules should consume `ValueMath` directly (or `RadialToolkit.value` through engines) rather than
depending on `RadialValueMath`.

### Semicircle Tick-Step Resolvers

`ValueMath` exposes shared preset-driven tick-step helpers used by semicircle and linear wrappers:

- `resolveSemicircleTickSteps(range, profileName)` where `profileName` is one of `standard`, `temperature`, `voltage`
  (unknown profiles fall back to `standard`)
- `resolveStandardSemicircleTickSteps(range)`
- `resolveTemperatureSemicircleTickSteps(range)`
- `resolveVoltageSemicircleTickSteps(range)`

All resolvers return `{ major, minor }` and preserve explicit profile defaults for invalid/non-positive ranges.

Semicircle geometry is owned by `SemicircleRadialLayout.computeLayout(...)`; `RadialValueMath` no longer exports a
geometry helper.

## TextLayoutEngine API

`TextLayoutEngine.create(def, componentContext)` returns:

- Cache/mode helpers: `createFitCache`, `clearFitCache`, `makeFitCacheKey`, `readFitCache`, `writeFitCache`,
  `resolveFitCache`, `computeModeLayout`, `computeInsets`
- Primitive text helpers: `setFont`, `fitSingleLineBinary`, `fitMultiRowBinary`, `fitValueUnitRow`, `fitInlineTriplet`,
  `drawInlineTriplet`
- Composite block helpers: `fitThreeRowBlock`, `drawThreeRowBlock`, `fitValueUnitCaptionRows`,
  `drawValueUnitCaptionRows`, `fitTwoRowsWithHeader`, `drawTwoRowsWithHeader`

## SemicircleRadialEngine API

`SemicircleRadialEngine.create(def, componentContext).createRenderer(spec)` returns `renderCanvas(canvas, props)`.

Responsive ownership for the semicircle family:

- `SemicircleRadialLayout` owns mode selection, compact insets, gauge geometry, label metrics, and mode boxes
- `SemicircleRadialTextLayout` owns fit caching and mode-routed text draw for `flat` / `high` / `normal`
- `SemicircleRadialEngine` orchestrates theme resolve, sectors, pointer, ticks, labels, and delegated text draw

## SemicircleRadialLayout API

`SemicircleRadialLayout.create(def, componentContext)` returns:

- `computeMode(W, H, thresholdNormal, thresholdFlat)`
- `computeInsets(W, H)` -> `{ pad, gap, responsive }`
- `computeLayout({ W, H, theme, mode, insets, responsive })`

`computeLayout(...)` returns layout-owned geometry:

- `geom` (`R`, `cx`, `cy`, `rOuter`, `ringW`, `pointerDepth`, `pointerSide`, placement)
- `labels` (`radiusOffset`, `fontPx`)
- `flat` boxes (`box`, `topBox`, `bottomBox`)
- `high.bandBox`
- `normal` bounds (`rSafe`, `yBottom`, `mhMax`, `mhMin`)
- `responsive`, `textFillScale`, `compactGeometryScale`

## SemicircleRadialTextLayout API

`SemicircleRadialTextLayout.create(def, componentContext)` returns:

- `createFitCache()`
- `drawModeText(state, display, fitCache)`

`drawModeText(...)` expects layout-owned state from `SemicircleRadialEngine` and routes to the correct flat/high/normal
text path while reusing per-mode fit-cache entries.

### `spec` fields (Semicircle)

| Field           | Type                                                      | Required | Description                                                                                                       |
| --------------- | --------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `rawValueKey`   | string                                                    | yes      | Fallback key when `props.value` is undefined                                                                      |
| `unitDefault`   | string                                                    | yes      | Default unit text                                                                                                 |
| `rangeDefaults` | `{min,max}`                                               | no       | Engine-level safety fallback for missing range props; config-backed wrappers should omit it                       |
| `ratioProps`    | `{normal,flat}`                                           | yes      | Prop names for layout thresholds                                                                                  |
| `ratioDefaults` | `{normal,flat}`                                           | no       | Engine-level safety fallback for missing threshold props; config-backed wrappers should omit it                   |
| `tickSteps`     | `(range) => {major,minor}`                                | yes      | Gauge-specific tick strategy (wrappers should delegate to shared `ValueMath` resolver methods)                    |
| `formatDisplay` | `(raw, props, unit, Helpers) => {num,text}`               | yes      | Gauge-specific value formatter                                                                                    |
| `buildSectors`  | `(props, minV, maxV, arc, valueUtils, theme) => Sector[]` | yes      | Gauge-specific warning/alarm sectors (wrappers typically pass `tokens.colors.warning/alarm` into shared builders) |
| `arc`           | `{startDeg,endDeg}`                                       | no       | Optional override (default `270..450`)                                                                            |

Config-backed plugin wrappers should pass `rangeProps` / `ratioProps` and trust the editable/default pipeline to
populate live min/max and threshold values. `rangeDefaults` and `ratioDefaults` remain available only for non-config
consumers.

### Sector shape

```javascript
{ a0: number, a1: number, color: "#rrggbb" }
```

`color` should come from wrapper-selected tokens (typically `tokens.colors.warning`/`tokens.colors.alarm`).

## FullCircleRadialEngine API

`FullCircleRadialEngine.create(def, componentContext).createRenderer(spec)` returns `renderCanvas(canvas, props)`.

Responsive ownership for the full-circle family:

- `FullCircleRadialLayout` owns mode selection, compact insets, dial geometry, label metrics, slot bounds, and
  normal-mode safe-radius limits.
- `FullCircleRadialTextLayout` consumes layout-owned state plus `textFillScale` for mode-routed text drawing.
- `FullCircleRadialEngine` orchestrates theme resolve, static-layer caching, shared draw helpers, and delegated widget
  callbacks.

## FullCircleRadialLayout API

`FullCircleRadialLayout.create(def, componentContext)` returns:

- `computeMode(W, H, thresholdNormal, thresholdFlat)`
- `computeInsets(W, H)` -> `{ pad, gap, responsive }`
- `computeLayout({ W, H, theme, mode, insets, responsive, layoutConfig? })`

`computeLayout(...)` returns layout-owned state:

- `geom` (`R`, `cx`, `cy`, `rOuter`, `ringW`, `needleDepth`, `fixedPointerDepth`, `markerLen`, `markerWidth`, strips)
- `labels` (`radiusOffset`, `fontPx`, `spriteRadius`)
- `slots` (`leftTop`, `leftBottom`, `rightTop`, `rightBottom`, `top`, `bottom`)
- `normal` (`safeRadius`, `compactCenterHeight`, `dualCompactWidth`, `dualCompactInset`, `dualCompactHeight`)
- `responsive`, `textFillScale`, `compactGeometryScale`

### `spec` fields (Full-circle)

| Field            | Type                                               | Required | Description                                                                                     |
| ---------------- | -------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `ratioProps`     | `{normal,flat}`                                    | no       | Prop names for mode thresholds                                                                  |
| `ratioDefaults`  | `{normal,flat}`                                    | no       | Engine-level safety fallback for missing threshold props; config-backed wrappers should omit it |
| `cacheLayers`    | `string[]`                                         | no       | Layer names for `CanvasLayerCache`                                                              |
| `layout`         | object                                             | no       | Shared slot factors (`highTopFactor`, `highBottomFactor`)                                       |
| `buildStaticKey` | `(state, props) => any`                            | no       | Widget static-key payload                                                                       |
| `rebuildLayer`   | `(layerCtx, layerName, state, props, api) => void` | no       | Static-layer rebuild callback                                                                   |
| `drawFrame`      | `(state, props, api) => void`                      | no       | Per-frame dynamic draw callback                                                                 |
| `drawMode`       | `{flat?,high?,normal?}`                            | no       | Mode-specific text/layout callback map                                                          |

### Callback API helpers

- `drawFullCircleRing(targetCtx?, opts?)`
- `drawFullCircleTicks(targetCtx?, opts?)`
- `drawFixedPointer(targetCtx?, angleDeg, opts?)`
- `drawCachedLayer(layerName?, opts?)` (`rotationDeg` supported)
- `getCacheMeta(key)` / `setCacheMeta(key, value)`

## FullCircleRadialTextLayout API

`FullCircleRadialTextLayout.create(def, componentContext)` returns:

- `drawSingleModeText(state, mode, display, opts?)`
- `drawDualModeText(state, mode, left, right, opts?)`

## Related

- [gauge-shared-api.md](gauge-shared-api.md)
- [../widgets/semicircle-gauges.md](../widgets/semicircle-gauges.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
