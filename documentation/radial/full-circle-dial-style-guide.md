# Full-Circle Dial Style Guide

**Status:** ✅ Implemented | CompassRadialWidget + WindRadialWidget

## Overview

Visual specification for full-circle dial widgets. Constants and formulas are implementation-derived from `FullCircleRadialEngine`, `FullCircleRadialTextLayout`, widget modules, and shared `CanvasLayerCache`.

## Key Details

- Shared renderer/caching backbone: `FullCircleRadialEngine.createRenderer(spec)` + `CanvasLayerCache.createLayerCache({ layers })`.
- Angle conversion uses `RadialAngleMath.degToCanvasRad()` defaults: `zeroDegAt="north"`, clockwise positive.
- Geometry and mode slots are computed once per frame in engine state and reused by widget callbacks.
- Theme/token sources come from `ThemeResolver` via `RadialToolkit.theme.resolve(canvas)`.

## Arc Configuration

- Full-circle dial defaults in engine tick helper: `startDeg=0`, `endDeg=360`.
- Compass face ticks: `0..360`, major every `30`, minor every `10`.
- Wind face ticks: `-180..180`, major every `30`, minor every `10`, `includeEnd=true`.
- Draw APIs accepting angle ranges:
  - `api.drawFullCircleTicks(..., { startDeg, endDeg, stepMajor, stepMinor, includeEnd })`
  - `draw.drawLabels(..., { startDeg, endDeg, step, includeEnd })`

## Proportions (Function of R)

| Element | Formula | Source |
|---|---|---|
| `pad` | `max(6, floor(min(W, H) * 0.04))` | `RadialValueMath.computePad()` |
| `gap` | `max(6, floor(min(W, H) * 0.03))` | `RadialValueMath.computeGap()` |
| `D` | `min(W - 2*pad, H - 2*pad)` | `computeGeometry()` |
| `R` | `max(14, floor(D / 2))` | `computeGeometry()` |
| `cx` | `floor(W / 2)` | `computeGeometry()` |
| `cy` | `floor(H / 2)` | `computeGeometry()` |
| `ringW` | `max(6, floor(R * theme.radial.ring.widthFactor))` | `computeGeometry()` |
| `needleDepth` | `max(8, floor(ringW * 0.9))` | `computeGeometry()` |
| `labelInsetVal` | `max(18, floor(ringW * theme.radial.labels.insetFactor))` | `computeGeometry()` |
| `labelPx` | `max(10, floor(R * theme.radial.labels.fontFactor))` | `computeGeometry()` |
| `leftStrip` | `max(0, floor((W - 2*pad - 2*R) / 2))` | `computeGeometry()` |
| `rightStrip` | `leftStrip` | `computeGeometry()` |
| `topStrip` | `max(0, floor((H - 2*pad - 2*R) / 2))` | `computeGeometry()` |
| `bottomStrip` | `topStrip` | `computeGeometry()` |

Tick lengths are token-defined pixel values (not `R`-scaled):
- Major: `theme.radial.ticks.majorLen` (default `9`)
- Minor: `theme.radial.ticks.minorLen` (default `5`)

## Colors

| Element | Theme token | CSS variable | Default |
|---|---|---|---|
| Pointer fill | `theme.colors.pointer` | `--dyni-pointer` | `#ff2b2b` |
| Layline starboard | `theme.colors.laylineStb` | `--dyni-layline-stb` | `#82b683` |
| Layline port | `theme.colors.laylinePort` | `--dyni-layline-port` | `#ff7a76` |
| Ring stroke | resolved text color | `Helpers.resolveTextColor(canvas)` | runtime CSS-derived |
| Tick stroke | resolved text color | `Helpers.resolveTextColor(canvas)` | runtime CSS-derived |
| Label text | resolved text color | `Helpers.resolveTextColor(canvas)` | runtime CSS-derived |

Ring stroke width: `theme.radial.ring.arcLineWidth` (default `1`).

## Pointer Variants

| Variant | Widget | Angle input | Depth | Common options |
|---|---|---|---|---|
| Lubber pointer (fixed) | `CompassRadialWidget` | fixed `0°` | `max(10, floor(ringW * 0.9))` | `variant="long"`, `fillStyle=theme.colors.pointer` |
| Value pointer (dynamic) | `WindRadialWidget` | `display.angle` | `max(8, floor(ringW * 0.9))` | `variant="long"`, `fillStyle=theme.colors.pointer` |

Shared pointer shape controls:
- `theme.radial.pointer.sideFactor` (`--dyni-radial-pointer-side`, default `0.25`)
- `theme.radial.pointer.lengthFactor` (`--dyni-radial-pointer-length`, default `2`)

## Tick Rendering

| Widget | Tick range | Major/Minor | Label range | Label formatter/filter |
|---|---|---|---|---|
| Compass | `0..360` | `30 / 10` | Cardinal sprites (`N/NE/E/SE/S/SW/W/NW`) | Upright sprite labels; face rotates by `-heading` |
| Wind | `-180..180` | `30 / 10`, `includeEnd=true` | numeric labels `-180..180` step `30` | `String(deg)`; filter excludes `-180`, `180` |

Label typography:
- Weight: `theme.font.labelWeight`
- Family: `Helpers.resolveFontFamily(canvas)`
- Font size: `labelPx = max(10, floor(R * theme.radial.labels.fontFactor))`

## Layout Modes

Mode selection:

```text
ratio = W / H
mode = computeMode(ratio, thresholdNormal, thresholdFlat)
```

Threshold props/defaults:

| Widget | thresholdNormal | thresholdFlat |
|---|---|---|
| Compass | `compassRadialRatioThresholdNormal` (`0.8`) | `compassRadialRatioThresholdFlat` (`2.2`) |
| Wind | `windRadialRatioThresholdNormal` (`0.7`) | `windRadialRatioThresholdFlat` (`2.0`) |

Mode text layout:

| Mode | Compass (single) | Wind (dual) |
|---|---|---|
| `flat` | left side strip: caption top, value+unit bottom | left and right strips: each caption top, value+unit bottom |
| `normal` | centered 3-row block inside dial | two centered inner columns (left/right) |
| `high` | inline row in top slot | top row for left value, bottom row for right value |

High-mode slot factors (`computeSlots`):
- Engine defaults: `highTopFactor=0.85`, `highBottomFactor=0.85`
- Compass override: `highTopFactor=0.9`, `highBottomFactor=0.9`

Normal-mode layout tokens (`theme.radial.fullCircle.normal.*`):

| Token | Default | Clamp range |
|---|---|---|
| `innerMarginFactor` | `0.03` | `0..0.25` |
| `minHeightFactor` | `0.45` | `0.25..0.95` |
| `dualGapFactor` | `0.05` | `0..0.25` |

## Background Cache Rules

Static cache key is built in `FullCircleRadialEngine` and passed to `CanvasLayerCache.ensureLayer(canvas, key, rebuildFn)`.
Baseline cache scope/key/invalidation rules are defined in [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md).

Included in static key:
- Buffer/draw sizes: `canvas.width`, `canvas.height`, `W`, `H`, `dpr`
- Geometry: `cx`, `cy`, `rOuter`, `ringW`, `labelInsetVal`, `labelPx`
- Static style factors: ring/tick widths and lengths, pointer side/length factors, ring line width
- Typography/style: `family`, `labelWeight`, resolved text color
- Widget static payload from `buildStaticKey(state, props)`

Widget payloads:
- Compass payload: `labelPx`, `labelRadius`, fixed label signature (`N|NE|E|SE|S|SW|W|NW`)
- Wind payload: `layEnabled`, `windRadialLayMin`, `windRadialLayMax`, `laylineStb`, `laylinePort`

Explicit non-key inputs:
- Compass: `heading` (draw transform `rotationDeg=-heading`), `markerCourse`, live caption/value/unit text, `disconnect`
- Wind: live `angle`, `speed`, captions/units/formatter output, pointer-only updates

Rebuild triggers (`CanvasLayerCache`):
- key changed
- `invalidate()` called
- layer missing/recreated
- layer buffer size changed

## Layline And Marker Conventions

Wind laylines (`WindRadialWidget`, back layer):
- Draw only when `layEnabled !== false` and `windRadialLayMax > windRadialLayMin`
- Starboard sector: `startDeg=windRadialLayMin`, `endDeg=windRadialLayMax`, `fillStyle=theme.colors.laylineStb`
- Port sector: `startDeg=-windRadialLayMax`, `endDeg=-windRadialLayMin`, `fillStyle=theme.colors.laylinePort`
- Sector thickness: `ringW`

Compass target marker (`CompassRadialWidget`, per-frame):
- Marker is compass-only (`markerCourse`); no wind marker primitive exists
- Draw when both `markerCourse` and `heading` are finite
- Marker angle relative to rotated card: `markerCourse - heading`
- Marker dimensions: `len=max(12, floor(ringW * 0.9))`, `width=max(3, floor(ringW * 0.4))`

## Disconnect Overlay

Shared behavior from `RadialTextLayout.drawDisconnectOverlay()`:
- Trigger: `props.disconnect === true` and `drawDisconnect !== false`
- Overlay: fill full canvas with `globalAlpha=0.20` and resolved text color
- Label: centered `NO DATA`
- Label font size: `max(12, floor(min(W, H) * 0.18))`
- Label typography: resolved font family + `theme.font.labelWeight`

## Related

- [full-circle-dial-engine.md](full-circle-dial-engine.md)
- [gauge-style-guide.md](gauge-style-guide.md)
- [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
- [../widgets/wind-dial.md](../widgets/wind-dial.md)
