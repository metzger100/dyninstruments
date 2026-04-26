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

Renderer now resolves canvas state-screens before highway drawing:

- `disconnected` when `p.display.disconnect === true` (label: `GPS Lost`)
- `noTarget` when `typeof p.display.wpName === "string" && p.display.wpName.trim() === ""` and textual metrics are visible (label: `No Waypoint`)
- `data` otherwise

In `data`, the static highway frame is always visible; the dynamic XTE overlay renders iff `xte` is finite. `cog`, `dtw`, and `btw` no longer gate the dynamic overlay and only affect their textual placeholder rows when textual metrics are visible.

The mapper now passes nested `display`, `captions`, `units`, `formatUnits`, and `layout` objects. Formatter tokens live in `formatUnits.*`; display labels live in `units.*`.

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
  deps: [
    "RadialToolkit",
    "CanvasLayerCache",
    "XteHighwayPrimitives",
    "XteHighwayLayout",
    "TextTileLayout",
    "PlaceholderNormalize",
    "StateScreenLabels",
    "StateScreenPrecedence",
    "StateScreenCanvasOverlay"
  ]
}
```

## Props

The mapper passes nested payload objects to the renderer.

| Prop path | Type | Default | Description |
|---|---|---|---|
| `display.xte` | number | — | Cross-track error |
| `display.cog` | number | — | Course over ground |
| `display.dtw` | number | — | Distance to waypoint |
| `display.btw` | number | — | Bearing to waypoint |
| `display.wpName` | string | `""` | Waypoint name |
| `display.disconnect` | boolean | `false` | Render `disconnected` state-screen and suppress normal highway/metric content |
| `captions.xte` | string | `"XTE"` | Caption for XTE field |
| `captions.track` | string | `"COG"` | Caption for track field |
| `captions.dtw` | string | `"DST"` | Caption for distance field |
| `captions.brg` | string | `"BRG"` | Caption for bearing field |
| `units.xte` | string | `"nm"` | XTE display label only |
| `units.track` | string | `"°"` | Track display label only |
| `units.dtw` | string | `"nm"` | Distance-to-waypoint display label only |
| `units.brg` | string | `"°"` | Bearing display label only |
| `formatUnits.xte` | string | `"nm"` | Formatter token for XTE distance conversion |
| `formatUnits.dtw` | string | `"nm"` | Formatter token for distance-to-waypoint conversion |
| `layout.leadingZero` | boolean | `true` | Heading zero-padding (e.g. `093`) |
| `layout.showWpName` | boolean | `false` | Enable waypoint name if space allows |
| `layout.hideTextualMetrics` | boolean | `false` | Hide live metric readouts and waypoint name while keeping the highway visible |
| `layout.easing` | boolean | `true` | Spring animation toggle for the XTE marker |
| `layout.xteRatioThresholdNormal` | number | `0.85` | Ratio below -> `high` |
| `layout.xteRatioThresholdFlat` | number | `2.3` | Ratio above -> `flat` |

## Guidance Data Contract

In `data` state, the widget always renders the static highway frame.

The moving XTE indicator renders only if `display.xte` is finite.

`formatUnits.xte` and `formatUnits.dtw` carry the formatter tokens. The matching `units.*` values are rendered as display text only.

When textual metrics are visible, the widget still shows placeholder text for missing non-XTE values.

## Theme Token Usage

Theme is resolved once per frame via `RadialToolkit.theme.resolveForRoot(Helpers.requirePluginRoot(canvas))`.

| Visual element | Token |
|---|---|
| Boat marker + active centerline | `theme.colors.pointer` |
| Out-of-scale clamp marker | `theme.colors.alarm` |
| Road edge + horizon strokes | `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas)).surface.fg` |
| Perspective bars + center seam markers | `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas)).surface.fg` |
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

When `hideTextualMetrics === true`, the layout switches to a graphics-only branch:

- no metric tiles
- no waypoint-name rect
- enlarged highway rect
- no waypoint-name fit work in the renderer

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

## Scale

XTE marker placement uses a mapper-resolved full-scale range:

- centerline = `0`
- left edge = `-xteScale`
- right edge = `+xteScale`
- marker uses a boat hull glyph that scales with highway geometry (not fixed pixels)

If `abs(xte) > xteScale`, marker position is clamped to the edge and overflow alarm cue is rendered.

Implementation note:
- `xteScale` comes from the selected `xteDisplayScale_<token>` field in the mapper, with a safe fallback of `1` when missing or invalid.
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

## Phase 6 Options

- `stableDigits` (default `false`) enables stable-digit normalization of XTE value text.
- XTE uses `sideSuffix` (`R`/`L`/empty) with `reserveSideSuffixSlot` so side alignment stays stable at zero crossing.
- The XTE metric uses two-pass selection: padded value first, fallback value when padded text clips.

## Related

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../shared/css-theming.md](../shared/css-theming.md)
- [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md)
