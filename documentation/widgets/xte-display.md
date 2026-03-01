# XteDisplayWidget Module

**Status:** ✅ Implemented | `widgets/text/XteDisplayWidget/XteDisplayWidget.js`

## Overview

Graphic navigation widget with a 2.5D highway view for cross-track guidance and integrated text metrics:

- `XTE` (cross-track error + side `L/R`)
- `COG` (course over ground)
- `DST` (distance to waypoint)
- `BRG` (bearing to waypoint)
- waypoint name (optional, hidden first when space is constrained)

Renderer is fail-closed: if required data is missing or disconnected, it draws `NO DATA`.

## Module Registration

```javascript
XteDisplayWidget: {
  js: BASE + "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
  css: undefined,
  globalKey: "DyniXteDisplayWidget",
  deps: ["GaugeToolkit", "CanvasLayerCache", "XteHighwayPrimitives"]
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
| `disconnect` | boolean | `false` | Draw fail-closed overlay |
| `xteCaption` | string | `"XTE"` | Caption for XTE field |
| `trackCaption` | string | `"COG"` | Caption for track field |
| `dtwCaption` | string | `"DST"` | Caption for distance field |
| `btwCaption` | string | `"BRG"` | Caption for bearing field |
| `xteUnit` | string | `"nm"` | Unit passed to distance formatter |
| `trackUnit` | string | `"°"` | Unit text for `COG` metric row |
| `dtwUnit` | string | `"nm"` | Unit passed to distance formatter |
| `btwUnit` | string | `"°"` | Unit text for `BRG` metric row |
| `headingUnit` | string | `"°"` | Fallback heading unit for `COG/BRG` when dedicated units are unset |
| `leadingZero` | boolean | `true` | Heading zero-padding (e.g. `093`) |
| `showWpName` | boolean | `false` | Enable waypoint name if space allows |
| `xteRatioThresholdNormal` | number | `0.85` | Ratio below -> `high` |
| `xteRatioThresholdFlat` | number | `2.3` | Ratio above -> `flat` |

## Required Data Contract

Widget renders the highway only if all are valid:

- finite `xte`
- finite `cog`
- finite `dtw`
- finite `btw`
- `disconnect !== true`

Otherwise `drawDisconnectOverlay(..., "NO DATA", ...)` is used.

## Theme Token Usage

Theme is resolved once per frame via `GaugeToolkit.theme.resolve(canvas)`.

| Visual element | Token |
|---|---|
| Boat marker + active centerline | `theme.colors.pointer` |
| Starboard cue/highlight | `theme.colors.laylineStb` |
| Port cue/highlight | `theme.colors.laylinePort` |
| Lane edge tint | `theme.colors.warning` |
| Out-of-scale clamp marker | `theme.colors.alarm` |
| Road edge + horizon strokes | `Helpers.resolveTextColor(canvas)` |
| Lane stripe strokes | `Helpers.resolveTextColor(canvas)` |
| Highway stroke thickness | `theme.xte.lineWidthFactor` (fallback `1` when invalid or `<=0`) |
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

### high

- Top strip (`~14%`): `COG`, `BRG`
- Middle (`~68%`): deeper-perspective highway
- Bottom strip (`~18%`): `XTE`, `DST` (equal-width two-column layout)
- Waypoint name remains optional and hides first in constrained sizes

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

- mode and canvas geometry
- highway geometry
- resolved theme token colors used in static draw
- style inputs affecting static layer (`family`, `labelWeight`, `xte.lineWidthFactor`)

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
