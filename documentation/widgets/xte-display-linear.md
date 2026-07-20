# XteDisplayLinearWidget Module

**Status:** ✅ Implemented | `widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js`

## Overview

Responsive canvas-dom XTE widget that replaces the highway perspective with a horizontal linear gauge bar and keeps the
same four nav metrics (`COG`, `XTE`, `DST`, `BRG`) plus optional waypoint name rendering.

State-screen ownership and metric formatting match the existing XTE family: disconnected/no-target overlays are rendered
first, then gauge + metrics in `data` state.

## Module Registration

```javascript
XteDisplayLinearWidget: {
  js: BASE + "widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js",
  css: undefined,
  globalKey: "DyniXteDisplayLinearWidget",
  deps: [
    "GaugeToolkit",
    "CanvasLayerCache",
    "LinearCanvasPrimitives",
    "LinearGaugeMath",
    "GeometryScale",
    "XteLinearLayout",
    "TextTileLayout",
    "SpringEasing",
    "PlaceholderNormalize",
    "StableDigits",
    "UnitAwareFormatter",
    "StateScreenLabels",
    "StateScreenPrecedence",
    "StateScreenCanvasOverlay"
  ]
}
```

## Props

The mapper passes nested payload objects.

| Prop path                     | Type    | Default | Description                                     |
| ----------------------------- | ------- | ------- | ----------------------------------------------- |
| `display.xte`                 | number  | —       | Cross-track error                               |
| `display.cog`                 | number  | —       | Course over ground                              |
| `display.dtw`                 | number  | —       | Distance to waypoint                            |
| `display.btw`                 | number  | —       | Bearing to waypoint                             |
| `display.wpName`              | string  | `""`    | Waypoint name                                   |
| `display.disconnect`          | boolean | `false` | Renders `disconnected` state-screen             |
| `captions.xte`                | string  | `"XTE"` | XTE caption                                     |
| `captions.track`              | string  | `"COG"` | Track caption                                   |
| `captions.dtw`                | string  | `"DST"` | Distance caption                                |
| `captions.brg`                | string  | `"BRG"` | Bearing caption                                 |
| `units.xte`                   | string  | `"nm"`  | XTE unit display label                          |
| `units.track`                 | string  | `"°"`   | Heading unit display label                      |
| `units.dtw`                   | string  | `"nm"`  | Distance unit display label                     |
| `units.brg`                   | string  | `"°"`   | Bearing unit display label                      |
| `formatUnits.xte`             | string  | `"nm"`  | Formatter token for XTE                         |
| `formatUnits.dtw`             | string  | `"nm"`  | Formatter token for distance                    |
| `xteScale`                    | number  | `1`     | Symmetric gauge bounds (`-xteScale..+xteScale`) |
| `layout.leadingZero`          | boolean | `true`  | Zero-pad COG/BRG                                |
| `layout.showWpName`           | boolean | `false` | Show waypoint header when space allows          |
| `layout.hideTextualMetrics`   | boolean | `false` | Gauge-only mode (metrics + name hidden)         |
| `layout.easing`               | boolean | `true`  | Spring easing toggle for pointer motion         |
| `layout.ratioThresholdNormal` | number  | `0.85`  | Ratio below -> `high`                           |
| `layout.ratioThresholdFlat`   | number  | `2.3`   | Ratio above -> `flat`                           |
| `layout.tickMajor`            | number  | `1.0`   | Major tick step                                 |
| `layout.tickMinor`            | number  | `0.25`  | Minor tick step                                 |
| `layout.showEndLabels`        | boolean | `true`  | Show only min/max labels                        |
| `stableDigits`                | boolean | `false` | Enables XTE stable-digit normalization          |

## State-Screen Contract

- `disconnected`: when `display.disconnect === true`, label `GPS Lost`
- `noTarget`: when `display.wpName` is empty/blank, label `No Waypoint`
- `data`: otherwise render gauge + optional text metrics

State screens render through `StateScreenCanvasOverlay` on a cleared canvas before any gauge draw work.

## Theme Token Usage

Resolved theme tokens are read once per frame via `const theme = toolkit.theme.resolveForRoot(rootEl)`.

| Visual element                         | Token / source                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Track/ticks/labels + metric text color | `theme.surface.fg`                                                                          |
| In-range pointer color                 | `theme.colors.pointer`                                                                      |
| Overflow/clamped pointer color         | `theme.colors.alarm`                                                                        |
| Track/tick geometry factors            | `theme.linear.track.*`, `theme.linear.ticks.*`                                              |
| Pointer geometry factors               | `theme.linear.pointer.*`                                                                    |
| End-label spacing/font                 | `theme.linear.labels.*`                                                                     |
| Stroke/pointer weights                 | `theme.strokeWeight`, `theme.pointerDepthWeight`, `theme.pointerSideWeight`                 |
| Font family/weights                    | `theme.font.family`, `theme.font.familyMono`, `theme.font.weight`, `theme.font.labelWeight` |
| Caption/unit opacity                   | `theme.opacity.caption`, `theme.opacity.unit`                                               |

## Layout Modes

Mode selection uses `ratio = W / H` with mapper-driven thresholds:

```text
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

Mode geometry is owned by `XteLinearLayout`:

- `flat`: gauge bar at left (share-based, baseline `58%`), optional header + 2x2 metric grid at right
- `normal`: gauge bar top (baseline `64%`), 4-column row below (`COG | XTE | DST | BRG`)
- `high`: top strip (`COG | BRG`), middle gauge bar, bottom strip (`XTE | DST`)

When `hideTextualMetrics === true`, layout returns gauge-focused rectangles (no metric rects, no name rect).

## Gauge Geometry and Overflow

- Gauge is horizontal with symmetric range bounds `[-xteScale, +xteScale]`.
- Static elements use `LinearCanvasPrimitives` and `LinearGaugeMath.buildTicks(...)`.
- Tick labels are end-only (first/last major tick) and use `LinearGaugeMath.formatTickLabel(...)`.
- Pointer is custom and upward-pointing from below the track:
  - `tipY = trackY + floor(trackThickness / 2) + 1`
  - triangle base is drawn below `tipY` using geometry-scaled side/depth
- Overflow rule: if `abs(xte) > xteScale`, pointer position clamps to the gauge edge and uses alarm color.
- With easing enabled, pointer position is spring-resolved per frame through `SpringEasing`.

## Caching

`CanvasLayerCache` owns two static layers: `back` (track) and `front` (ticks + end labels), composited via `blitLayer()`
with the live pointer drawn between them (`back` → pointer → `front`), matching the shared gauge z-order.

Static cache key fields:

- `mode`
- `gaugeBar`
- `geom`
- `ticks`
- `showEndLabels`
- `xteScale`
- `color`
- `strokeWeight`
- `pointerDepthWeight`
- `pointerSideWeight`

Dynamic values are not cached (pointer position/color, live metrics, waypoint name).

## hideTextualMetrics Behavior

- `true`: render only gauge + pointer (state-screen behavior unchanged)
- `false`: render gauge + metrics + optional waypoint name

Metric formatting ownership:

- `UnitAwareFormatter` handles XTE/DST unit conversion and heading formatting
- `StableDigits` optionally applies two-pass padded/plain XTE text selection with `L/R` suffix slot reservation
- `PlaceholderNormalize` controls missing-value placeholder output at render boundaries

## Related

- [xte-display.md](xte-display.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../shared/responsive-scale-profile.md](../shared/responsive-scale-profile.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
