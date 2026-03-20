# XteDisplayWidget Module

**Status:** ✅ Implemented | `widgets/text/XteDisplayWidget/XteDisplayWidget.js`

## Overview

Graphic navigation widget with a 2.5D highway view for cross-track guidance and integrated text metrics:

- `XTE` (cross-track error + side `L/R`)
- `COG` (course over ground)
- `DST` (distance to waypoint)
- `BRG` (bearing to waypoint)
- waypoint name (optional, hidden first when space is constrained)

The highway frame follows the same solid-line visual language as the radial and linear instruments: foreground road rails, horizon line, clean perspective bars, and a pointer-colored live guidance overlay without translucent lane-surface shading.

Renderer keeps the highway frame visible when data is missing. Missing/disconnected metrics render with the configured placeholder (default `---`), and the moving XTE indicator is suppressed until the full guidance set is valid again.

Layout ownership:

- `shared/widget-kits/xte/XteHighwayLayout.js` owns responsive insets, mode selection, and highway/name/metric rectangles
- `shared/widget-kits/xte/XteHighwayLayout.js` also owns metric-tile padding and caption-band compaction for `TextTileLayout`
- `shared/widget-kits/xte/XteHighwayPrimitives.js` owns highway geometry drawing, dynamic marker drawing, and waypoint visibility heuristics
- `shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the shared compact curve consumed by `XteHighwayLayout`

## Module Registration

```javascript
XteDisplayWidget: {
  js: BASE + "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
  css: undefined,
  globalKey: "DyniXteDisplayWidget",
  deps: ["RadialToolkit", "CanvasLayerCache", "XteHighwayPrimitives", "XteHighwayLayout", "TextTileLayout"]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `xte` | number | — | Cross-track error |
| `cog` | number | — | Course over ground |
| `dtw` | number | — | Distance to waypoint |
| `btw` | number | — | Bearing to waypoint |
| `wpName` | string | `""` | Waypoint name |
| `disconnect` | boolean | `false` | Suppress live guidance and force placeholder metric values |
| `xteCaption` | string | `"XTE"` | Caption for XTE field |
| `trackCaption` | string | `"COG"` | Caption for track field |
| `dtwCaption` | string | `"DST"` | Caption for distance field |
| `btwCaption` | string | `"BRG"` | Caption for bearing field |
| `xteUnit` | string | `"nm"` | Unit passed to distance formatter |
| `trackUnit` | string | `"°"` | Unit text for `COG` metric row |
| `dtwUnit` | string | `"nm"` | Unit passed to distance formatter |
| `btwUnit` | string | `"°"` | Unit text for `BRG` metric row |
| `headingUnit` | string | `"°"` | Compatibility prop retained in mapper output; renderer uses `trackUnit` and `btwUnit` directly |
| `leadingZero` | boolean | `true` | Heading zero-padding (e.g. `093`) |
| `showWpName` | boolean | `false` | Enable waypoint name if space allows |
| `xteRatioThresholdNormal` | number | `0.85` | Ratio below -> `high` |
| `xteRatioThresholdFlat` | number | `2.3` | Ratio above -> `flat` |

## Guidance Data Contract

Widget always renders the static highway frame.

The moving XTE indicator renders only if all are valid:

- finite `xte`
- finite `cog`
- finite `dtw`
- finite `btw`
- `disconnect !== true`

Otherwise the widget shows placeholder text for missing/disconnected values and skips the dynamic highway indicator.

## Theme Token Usage

Theme is resolved once per frame via `RadialToolkit.theme.resolveForRoot(Helpers.resolveWidgetRoot(canvas) || canvas)`.

| Visual element | Token |
|---|---|
| Boat marker + active centerline | `theme.colors.pointer` |
| Out-of-scale clamp marker | `theme.colors.alarm` |
| Road edge + horizon strokes | `Helpers.resolveTextColor(canvas)` |
| Perspective bars + center seam markers | `Helpers.resolveTextColor(canvas)` |
| Highway stroke thickness | `theme.xte.lineWidthFactor` (fallback `1` when invalid or `<=0`) |
| Boat indicator size | `theme.xte.boatSizeFactor` (fallback `1` when invalid or `<=0`) |
| Value text weight | `theme.font.weight` |
| Label text weight | `theme.font.labelWeight` |

## Layout Modes

Mode selection uses `ratio = W / H`.

```text
ratio < xteRatioThresholdNormal -> high
ratio > xteRatioThresholdFlat -> flat
otherwise -> normal
```

When waypoint name display is disabled (or no waypoint name is available), the highway perspective starts higher in all modes to reduce unused whitespace above the road.
Compact widgets also reduce waypoint/header shares, increase text fill, and tighten metric-tile inner spacing through `XteHighwayLayout`.

### flat

- Highway uses left `58%` width
- Right panel contains optional name header + 2x2 metric grid
- If waypoint name is disabled, the header band is removed and metric rows grow to use the free space
- Grid order:
  - row 1: `COG`, `BRG`
  - row 2: `XTE`, `DST`

### normal

- Highway at top (`~64%`)
- Bottom band (`~36%`) with 4 equal columns
- Column order: `COG | XTE | DST | BRG`
- Waypoint name appears near horizon if space allows
- visibility now uses responsive adequacy heuristics rather than fixed pixel thresholds

### high

- Top strip (`~14%`): `COG`, `BRG`
- Middle (`~68%`): deeper-perspective highway
- Bottom strip (`~18%`): `XTE`, `DST` (equal-width two-column layout)
- Waypoint name remains optional and hides first in constrained sizes
- top strip and name area compact on smaller tall widgets through `XteHighwayLayout`

## Fixed Scale

XTE marker placement uses a fixed `1 nm` full-scale range:

- centerline = `0`
- left edge = `-1`
- right edge = `+1`
- marker uses a boat hull glyph that scales with highway geometry (not fixed pixels)

If `abs(xte) > 1`, marker position is clamped to the edge and overflow alarm cue is rendered.

Implementation note:
- normalization uses formatter-parsed XTE magnitude (`formatDistance` output), so raw store-unit differences (for example meters) do not distort marker placement.

## Caching

Uses `CanvasLayerCache` (`back` layer) for static highway drawing.

Static key includes:

- mode
- highway geometry
- resolved foreground colors used in static draw
- style inputs affecting static layer (`xte.lineWidthFactor`)

Dynamic elements are never cached:

- current XTE marker position
- active centerline overlay
- overflow alarm cue
- live metric text

## Related

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../shared/css-theming.md](../shared/css-theming.md)
- [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md)
