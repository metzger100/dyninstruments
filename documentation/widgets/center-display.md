# CenterDisplayTextWidget Module

**Status:** ✅ Implemented | `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`

## Overview

Responsive center-position renderer used by `ClusterWidget` via `NavMapper` for `kind: "centerDisplay"`.

It keeps core data parity with AvNav `CenterDisplay` while using a readability-first canvas layout:

- internal center caption + always-visible stacked coordinates
- waypoint and boat relation rows always present
- optional measure row when a first measure point is available
- adaptive geometry derived from measured text and available canvas space; no fixed pixel layout floors
- compact tiles linearly tighten mode-specific panel shares and increase fitted text fill from `minDim <= 80` to `minDim >= 180`
- compact tiles also increase fitted text fill linearly so captions, coordinates, and relation values occupy more of each row without changing the normal-mode panel split
- core visibility semantics handled in nav-cluster `updateFunction`: visible only when `!lockPosition || editing`

This is a dedicated renderer, not a `PositionCoordinateWidget` variant, because it owns a different top-panel + relation-row contract across aspect ratios.

## Key Details

- `CenterDisplayLayout` is the current canonical responsive baseline and the Phase 1 reference consumer of `ResponsiveScaleProfile`.
- `shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the shared `minDim -> t` compaction curve plus named scale outputs.
- `CenterDisplayLayout` keeps nav-owned geometry, panel bounds, and row splitting; it no longer owns a private responsive-profile implementation.

## Responsive Baseline Contract

Shared baseline formulas from `shared/widget-kits/layout/ResponsiveScaleProfile.js`, consumed by `CenterDisplayLayout`:

```text
minDim = max(1, min(W, H))
t = clamp((minDim - 80) / 100, 0, 1)
textFillScale = lerp(1.18, 1, t)
normalCaptionShareScale = lerp(0.78, 1, t)
flatCenterShareScale = lerp(0.84, 1, t)
stackedCaptionScale = lerp(0.76, 1, t)
highCenterWeightScale = lerp(0.88, 1, t)
```

Local geometry inputs remain ratio-derived and stay nav-owned:

```text
padX = max(1, floor(minDim * 0.03))
innerY = max(1, floor(minDim * 0.02))
gap = max(1, floor(minDim * 0.03))
```

Contract notes:

- compact widgets use the same base `minDim -> t` curve as larger widgets; only the named scale outputs change
- smaller tiles reduce panel shares/caption bands while increasing fitted text fill
- the ratio-mode thresholds still choose `high` / `normal` / `flat`; the compact profile only adjusts layout density within the chosen mode
- mappers, renderer props, theme tokens, and `plugin.css` do not own this compaction policy

## Module Registration

```javascript
CenterDisplayTextWidget: {
  js: BASE + "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
  css: undefined,
  globalKey: "DyniCenterDisplayTextWidget",
  deps: [
    "ThemeResolver",
    "TextLayoutEngine",
    "RadialTextLayout",
    "TextTileLayout",
    "CenterDisplayLayout",
    "CenterDisplayMath"
  ]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `display.position` | `{lat, lon}` or `[lon, lat]` | — | Center position shown as two stacked coordinate lines |
| `display.marker.course` | number | — | Course from center to active waypoint |
| `display.marker.distance` | number | — | Distance from center to active waypoint |
| `display.boat.course` | number | — | Course from boat to center |
| `display.boat.distance` | number | — | Distance from boat to center |
| `display.measure.activeMeasure` | object | — | AvNav measure object; renderer reads `getPointAtIndex(0)` only |
| `display.measure.useRhumbLine` | boolean | `false` | Selects rhumb-line vs great-circle measure math |
| `captions.position` | string | `"CENTER"` | Center-panel caption |
| `captions.marker` | string | `"WP"` | Waypoint row label |
| `captions.boat` | string | `"BOAT"` | Boat row label |
| `captions.measure` | string | `"MEAS"` | Measure row label |
| `units.marker` | string | `"nm"` | Waypoint distance unit for `formatDistance` |
| `units.boat` | string | `"nm"` | Boat distance unit for `formatDistance` |
| `units.measure` | string | `"nm"` | Measure distance unit for `formatDistance` |
| `ratioThresholdNormal` | number | `1.1` | Ratio below this -> `high` |
| `ratioThresholdFlat` | number | `2.4` | Ratio above this -> `flat` |
| `default` | string | `"---"` | Placeholder for missing coordinates or relation values |

## Layout Modes

Mode selection uses `ratio = W / H`.

```text
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

### high

- full-width center panel at the top
- center caption above the two stacked coordinate lines
- relation rows stacked below using full widget width
- smaller tiles linearly shrink caption band and center weighting while large tiles keep the current spacing

### normal

- full-width top band
- center caption in a measured left column
- two coordinate lines stacked in a right column
- relation rows stacked below using full widget width
- the balanced two-coordinate-row rhythm is preserved while smaller tiles linearly reduce caption-column share

### flat

- left center-position panel sized from measured coordinate demand
- right panel with vertically stacked relation rows
- smaller wide tiles linearly reduce center-panel share and stacked caption height so coordinates and relation values can grow

## Formatting Contract

- center coordinates -> `formatLonLatsDecimal(value, axis)`
- relation courses -> `formatDirection(course)`
- relation distances -> `formatDistance(distance, unit)`
- relation rows render as adaptive single-line groups: `label | course / distance`, tightening separators when width is constrained

Measure row behavior:

- renderer reads `activeMeasure.getPointAtIndex(0)` only
- if that point or the center position is invalid, the measure row is omitted
- great-circle vs rhumb-line computation is plugin-owned in `CenterDisplayMath`; no core `NavCompute` import is used

## Visual State

- text color comes from `Helpers.resolveTextColor(canvas)`
- coordinate/value groups use `theme.font.weight`
- captions/row labels use `theme.font.labelWeight`
- compact layouts also raise fitted line-height ceilings linearly, making smaller widgets read denser while larger widgets retain the existing text rhythm
- no icon sprites, no new theme tokens, no CSS defaults beyond normal dyninstruments widget styling

## Related

- [active-route.md](active-route.md)
- [position-coordinates.md](position-coordinates.md)
- [../shared/responsive-scale-profile.md](../shared/responsive-scale-profile.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
