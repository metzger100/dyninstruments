# Full-Circle Dial Style Guide

**Status:** ✅ Implemented | CompassRadialWidget + WindRadialWidget

## Overview

Visual specification for full-circle dial widgets. Constants and formulas are implementation-derived from `FullCircleRadialLayout`, `FullCircleRadialEngine`, `FullCircleRadialTextLayout`, widget modules, and shared `CanvasLayerCache`.

## Key Details

- Shared renderer/caching backbone: `FullCircleRadialEngine.createRenderer(spec)` + `CanvasLayerCache.createLayerCache({ layers })`.
- Shared responsive owner: `FullCircleRadialLayout.computeMode()` / `computeInsets()` / `computeLayout()`.
- Angle conversion uses `RadialAngleMath.degToCanvasRad()` defaults: `zeroDegAt="north"`, clockwise positive.
- Geometry and mode slots are computed once per frame in engine state and reused by widget callbacks.
- Theme/token sources come from `ThemeResolver` via `RadialToolkit.theme.resolveForRoot(Helpers.requirePluginRoot(canvas))`.

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
| `pad` | `ResponsiveScaleProfile.computeInsetPx(responsive, 0.04, 1)` | `FullCircleRadialLayout.computeInsets()` |
| `gap` | `ResponsiveScaleProfile.computeInsetPx(responsive, 0.03, 1)` | `FullCircleRadialLayout.computeInsets()` |
| `textFillScale` | `lerp(1.18, 1, t)` | `ResponsiveScaleProfile.computeProfile()` |
| `compactGeometryScale` | `max(0.5, 1 - max(0, textFillScale - 1))` | `FullCircleRadialLayout.computeLayout()` |
| `D` | `2 * R`, centered inside padded content rect | `FullCircleRadialLayout.computeLayout()` |
| `R` | `max(1, floor(min(contentRect.w, contentRect.h) / 2))` | `FullCircleRadialLayout.computeLayout()` |
| `cx` | `contentRect.x + floor(contentRect.w / 2)` | `FullCircleRadialLayout.computeLayout()` |
| `cy` | `contentRect.y + floor(contentRect.h / 2)` | `FullCircleRadialLayout.computeLayout()` |
| `ringW` | `max(1, floor(R * theme.radial.ring.widthFactor * compactGeometryScale))` | `FullCircleRadialLayout.computeLayout()` |
| `needleDepth` | `max(1, floor(R * 0.11 * compactGeometryScale))` | `FullCircleRadialLayout.computeLayout()` |
| `fixedPointerDepth` | `max(needleDepth, floor(ringW * 0.6))` | `FullCircleRadialLayout.computeLayout()` |
| `markerLen` | `max(1, floor(ringW * 0.75))` | `FullCircleRadialLayout.computeLayout()` |
| `markerWidth` | `max(1, floor(ringW * 0.20))` | `FullCircleRadialLayout.computeLayout()` |
| `labelInsetVal` | `max(1, floor(ringW * theme.radial.labels.insetFactor))` | `FullCircleRadialLayout.computeLayout()` |
| `labelPx` | `max(1, floor(R * max(theme.radial.labels.fontFactor, 0.18) * compactGeometryScale))` | `FullCircleRadialLayout.computeLayout()` |
| `labelRadius` | `max(0, R - max(1, floor(ringW * 2.2)))` | `FullCircleRadialLayout.computeLayout()` |
| `leftStrip` | `max(0, floor((contentRect.w - 2*R) / 2))` | `FullCircleRadialLayout.computeLayout()` |
| `rightStrip` | `leftStrip` | `computeGeometry()` |
| `topStrip` | `max(0, floor((contentRect.h - 2*R) / 2))` | `FullCircleRadialLayout.computeLayout()` |
| `bottomStrip` | `topStrip` | `computeGeometry()` |

Tick lengths are token-defined pixel values that the engine scales with `compactGeometryScale` before drawing:
- Major: `max(1, round(theme.radial.ticks.majorLen * compactGeometryScale))`
- Minor: `max(1, round(theme.radial.ticks.minorLen * compactGeometryScale))`
- The engine applies a soft cap of `labelInset - 2` on compact dials to keep inward ticks out of the label lane.

## Colors

| Element | Theme token | CSS variable | Default |
|---|---|---|---|
| Pointer fill | `theme.colors.pointer` | `--dyni-pointer` | `#ff2b2b` |
| Layline starboard | `theme.colors.laylineStb` | `--dyni-layline-stb` | `#82b683` |
| Layline port | `theme.colors.laylinePort` | `--dyni-layline-port` | `#ff7a76` |
| Ring stroke | resolved text color | `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas)).surface.fg` | runtime CSS-derived |
| Tick stroke | resolved text color | `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas)).surface.fg` | runtime CSS-derived |
| Label text | resolved text color | `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas)).surface.fg` | runtime CSS-derived |

Ring stroke width: `theme.radial.ring.arcLineWidth` (default `1`).

## Pointer Variants

| Variant | Widget | Angle input | Depth | Common options |
|---|---|---|---|---|
| Lubber pointer (fixed) | `CompassRadialWidget` | fixed `0°` | `fixedPointerDepth` | `variant="long"`, `fillStyle=theme.colors.pointer` |
| Value pointer (dynamic) | `WindRadialWidget` | `display.angle` | `needleDepth` | `variant="long"`, `fillStyle=theme.colors.pointer` |

Shared pointer shape controls:
- `theme.radial.pointer.widthFactor` (`--dyni-radial-pointer-width`, default `1`)
- `theme.radial.pointer.lengthFactor` (`--dyni-radial-pointer-length`, default `2`)
- Both factors scale from the same unscaled `needleDepth`; width is the full rendered pointer width.

## Tick Rendering

| Widget | Tick range | Major/Minor | Label range | Label formatter/filter |
|---|---|---|---|---|
| Compass | `0..360` | `30 / 10` | Cardinal sprites (`N/NE/E/SE/S/SW/W/NW`) | Upright sprite labels; face rotates by `-heading` |
| Wind | `-180..180` | `30 / 10`, `includeEnd=true` | numeric labels `-180..180` step `30` | `String(deg)`; filter excludes `-180`, `180` |

Label typography:
- Weight: `theme.font.labelWeight`
- Family: `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas)).font.family`
- Font size: `labelPx = max(1, floor(R * max(theme.radial.labels.fontFactor, 0.18) * compactGeometryScale))`

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

High-mode slot factors (`FullCircleRadialLayout.computeLayout()`):
- Engine defaults: `highTopFactor=0.85`, `highBottomFactor=0.85`
- Compass override: `highTopFactor=0.9`, `highBottomFactor=0.9`

Text fit contract for full-circle dials:
- Caption, value, and unit rendering is fail-safe: text must remain inside mode-owned slots/boxes in `flat`, `normal`, and `high`.
- `normal` mode candidate scoring considers caption/value/unit legibility together (single and dual layouts), not value-only scoring.
- `flat` side-slot rows use final draw-time clamping to prevent side-strip overflow from long labels/units.
- In very compact sizes, text may scale down strongly to keep the dial geometry unobstructed.

Normal-mode layout tokens (`theme.radial.fullCircle.normal.*`):

| Token | Default | Clamp range |
|---|---|---|
| `innerMarginFactor` | `0.03` | `0..0.25` |
| `minHeightFactor` | `0.45` | `0.25..0.95` |
| `dualGapFactor` | `0.05` | `0..0.25` |

Normal-mode fit search is bounded by `layout.normal.safeRadius`; token overrides only reshape the search within those layout-owned bounds.

## Background Cache Rules

Static cache key is built in `FullCircleRadialEngine` and passed to `CanvasLayerCache.ensureLayer(canvas, key, rebuildFn)`.
Baseline cache scope/key/invalidation rules are defined in [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md).

Included in static key:
- Buffer/draw sizes: `canvas.width`, `canvas.height`, `W`, `H`, `dpr`
- Geometry: `cx`, `cy`, `rOuter`, `ringW`, `labelInsetVal`, `labelPx`
- Static style factors: ring/tick widths and lengths, pointer width/length factors, ring line width
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
- Marker dimensions: `len=markerLen`, `width=markerWidth`

## Canvas State-Screens

Full-circle dials resolve state-screens before layer rebuild/draw callbacks:

- `disconnected` candidate: `p.disconnect === true`
- fallback candidate: `data`

When `kind !== "data"`, the engine clears the canvas and draws the shared `StateScreenCanvasOverlay` label (`GPS Lost` for `disconnected`). The legacy `drawDisconnect` guard path no longer exists.

## Related

- [full-circle-dial-engine.md](full-circle-dial-engine.md)
- [gauge-style-guide.md](gauge-style-guide.md)
- [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
- [../widgets/wind-dial.md](../widgets/wind-dial.md)
