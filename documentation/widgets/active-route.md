# ActiveRouteTextWidget Module

**Status:** ✅ Implemented | `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js`

## Overview

Responsive text renderer for AvNav active-route summary data.

It renders:

- route name
- remaining route distance
- route ETA
- next-course tile only while approaching

This is a dedicated renderer, not a `PositionCoordinateWidget` variant, because it owns a different row/grid contract across aspect ratios.

Layout ownership:

- `shared/widget-kits/nav/ActiveRouteLayout.js` owns responsive insets, content rects, and mode-specific rectangle splitting
- `shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the shared `minDim -> t` compact curve consumed by `ActiveRouteLayout`
- `ActiveRouteLayout.computeMetricTileSpacing(rect, responsive)` owns metric-tile padding and caption-band compaction for `TextTileLayout`
- `ActiveRouteTextWidget` keeps parsing, formatting, fit-cache keys, accent fill, and draw orchestration only

## Module Registration

```javascript
ActiveRouteTextWidget: {
  js: BASE + "widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js",
  css: undefined,
  globalKey: "DyniActiveRouteTextWidget",
  deps: ["ThemeResolver", "TextLayoutEngine", "RadialTextLayout", "TextTileLayout", "ActiveRouteLayout"]
}
```

Used by `ClusterWidget` via `NavMapper` for `kind: "activeRoute"`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `routeName` | string | `""` | Active route name, rendered without caption/unit |
| `display.remain` | number | — | Remaining route distance |
| `display.eta` | Date-like | — | Route ETA |
| `display.nextCourse` | number | — | Next route course, shown only while approaching |
| `display.isApproaching` | boolean | `false` | Enables approach accent + `NEXT` tile |
| `disconnect` | boolean | `false` | Forces placeholder metric values and `NO DATA` overlay |
| `captions.remain` | string | `"RTE"` | Caption for remaining-distance tile |
| `units.remain` | string | `"nm"` | Unit for remaining-distance tile and formatter input |
| `captions.eta` | string | `"ETA"` | Caption for ETA tile |
| `units.eta` | string | `""` | ETA unit text (normally empty) |
| `captions.nextCourse` | string | `"NEXT"` | Caption for next-course tile |
| `units.nextCourse` | string | `"°"` | Unit text for next-course tile |
| `ratioThresholdNormal` | number | `1.2` | Ratio below this -> `high` |
| `ratioThresholdFlat` | number | `3.8` | Ratio above this -> `flat` |
| `default` | string | `"---"` | Placeholder for missing values |

## Layout Modes

Mode selection uses `ratio = W / H`.

```text
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

### high

- top route-name band
- 2 full-width metric rows: `RTE`, `ETA`
- 3 full-width metric rows when approaching: `RTE`, `ETA`, `NEXT`

### normal

- taller top route-name band
- non-approach: one two-column metric row `RTE | ETA`
- approach: top row `RTE | ETA`, bottom row `NEXT` spanning full width

### flat

- left route-name panel (`~38%`)
- right metric panel
- non-approach: `RTE | ETA`
- approach: `RTE | ETA | NEXT`
- compact wide tiles reduce the route-name share via `ActiveRouteLayout` while increasing text fill through the shared profile
- compact metric tiles also consume layout-owned `padX` / `captionHeightPx` values instead of widget-local spacing floors

## Formatting Contract

- `remain` -> `formatDistance(remain, remainUnit)`
- `eta` -> `formatTime(eta)`
- `nextCourse` -> `formatDirection(nextCourse)`
- `routeName` is fitted single-line text with ellipsis trimming

When `disconnect` is true:

- metric values render with `default`
- approach layout still keeps the `NEXT` tile when `isApproaching === true`
- `TextLayoutEngine.drawDisconnectOverlay(...)` draws the shared `NO DATA` overlay

## Visual State

- text color comes from `Helpers.resolveTextColor(canvas)`
- primary values use `theme.font.weight`
- captions/units use `theme.font.labelWeight`
- route name uses `theme.font.weight` in `normal` mode and `theme.font.labelWeight` in `high`/`flat`
- approach state adds a low-alpha fill using `theme.colors.warning`
- compact tiles increase fitted route-name and metric text fill via `ActiveRouteLayout.responsive.textFillScale`
- no new CSS defaults or theme tokens are introduced

## Related

- [position-coordinates.md](position-coordinates.md)
- [xte-display.md](xte-display.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
