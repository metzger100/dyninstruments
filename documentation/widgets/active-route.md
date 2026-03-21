# ActiveRoute HTML Renderer

**Status:** ✅ Implemented | `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`

## Overview

`activeRoute` is the canonical native HTML kind (`surface: "html"`) used as the reference implementation for future HTML-only widgets.

Route tuple:

- `cluster: "nav"`
- `kind: "activeRoute"`
- `renderer: "ActiveRouteTextHtmlWidget"`

Domain ownership:

- `cluster/viewmodels/ActiveRouteViewModel.js` normalizes route payload (`routeName`, `disconnect`, `display`, `captions`, `units`)
- `ActiveRouteTextHtmlWidget` consumes normalized payload and renders escaped HTML markup plus handler names

## Key Details

- Shared layout owner: `shared/widget-kits/nav/ActiveRouteLayout.js`
- Shared fit owner: `shared/widget-kits/nav/ActiveRouteHtmlFit.js`
- Shared compact curve owner: `shared/widget-kits/layout/ResponsiveScaleProfile.js`
- HTML lifecycle owner: `cluster/rendering/HtmlSurfaceController.js`
- Host click action bridge: `hostActions.routeEditor.openActiveRoute()` via named handler `activeRouteOpen`

## Module Registration

```javascript
ActiveRouteTextHtmlWidget: {
  js: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
  css: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css",
  globalKey: "DyniActiveRouteTextHtmlWidget",
  deps: ["ActiveRouteHtmlFit"]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `routeName` | string | `""` | Route name text |
| `display.remain` | number | — | Remaining route distance |
| `display.eta` | Date-like | — | ETA input for `formatTime` |
| `display.nextCourse` | number | — | Next-course input for `formatDirection` |
| `display.isApproaching` | boolean | `false` | Enables `NEXT` tile |
| `disconnect` | boolean | `false` | Forces placeholder metric values |
| `captions.remain` | string | `"RTE"` | Remaining-distance caption |
| `units.remain` | string | `"nm"` | Remaining-distance unit |
| `captions.eta` | string | `"ETA"` | ETA caption |
| `units.eta` | string | `""` | ETA unit |
| `captions.nextCourse` | string | `"NEXT"` | Next-course caption |
| `units.nextCourse` | string | `"°"` | Next-course unit |
| `ratioThresholdNormal` | number | `1.2` | Ratio below this -> `high` |
| `ratioThresholdFlat` | number | `3.8` | Ratio above this -> `flat` |
| `default` | string | `"---"` | Placeholder for missing/invalid values |

## Visual Contract

### CSS State Classes

| Class | Source | Meaning |
|---|---|---|
| `dyni-active-route-html` | renderer wrapper | Base widget block |
| `dyni-active-route-mode-high` | `resolveMode` | Tall mode |
| `dyni-active-route-mode-normal` | `resolveMode` | Balanced mode |
| `dyni-active-route-mode-flat` | `resolveMode` | Wide mode |
| `dyni-active-route-approaching` | `display.isApproaching === true` | Enables `NEXT` tile and mode-specific grids |
| `dyni-active-route-disconnect` | `disconnect === true` | Placeholder-only metric values |
| `dyni-active-route-open-dispatch` | capability + non-editing | Active click capture/open dispatch |
| `dyni-active-route-open-passive` | fallback state | No click capture, host remains owner |

### Element Class Contract

| Selector | Purpose |
|---|---|
| `.dyni-active-route-route-name` | Route name band/panel |
| `.dyni-active-route-metrics` | Metric grid container |
| `.dyni-active-route-metric.dyni-active-route-metric-remain` | Remaining distance tile |
| `.dyni-active-route-metric.dyni-active-route-metric-eta` | ETA tile |
| `.dyni-active-route-metric.dyni-active-route-metric-next` | Next course tile (approach only) |
| `.dyni-active-route-metric-caption` | Caption line |
| `.dyni-active-route-metric-value` | Primary value text |
| `.dyni-active-route-metric-unit` | Unit text |
| `.dyni-active-route-open-hotspot` | Full-surface click overlay (`onclick="activeRouteOpen"`) |

### Layering and Click Ownership

| Layer | Selector | z-index | Contract |
|---|---|---|---|
| Base content | `.dyni-active-route-route-name`, `.dyni-active-route-metrics` | `1` | Visible text/metrics |
| Interaction overlay | `.dyni-active-route-open-hotspot` | `2` | Full-widget dispatch target |

Dispatch mode (`dyni-active-route-open-dispatch`):

- wrapper adds `onclick="catchAll"`
- hotspot exists and uses `onclick="activeRouteOpen"`

Passive mode (`dyni-active-route-open-passive`) and editing mode:

- no `catchAll` wrapper attribute
- no hotspot element
- no click dispatch by renderer

## Layout Modes

Mode selection (`resolveMode`) uses measured shell ratio:

```text
ratio = shellWidth / shellHeight
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

If shell size is unavailable/invalid, renderer falls back to `normal`.

Mode matrix:

| Mode | Non-approach layout | Approach layout |
|---|---|---|
| `high` | name band + two stacked metric rows (`RTE`, `ETA`) | name band + three stacked rows (`RTE`, `ETA`, `NEXT`) |
| `normal` | name band + one two-column metric row (`RTE | ETA`) | name band + top row (`RTE | ETA`) + bottom full-width `NEXT` |
| `flat` | left name panel + two metric columns (`RTE | ETA`) | left name panel + three metric columns (`RTE | ETA | NEXT`) |

## Layout Constants (Owner: ActiveRouteLayout)

| Constant | Value | Purpose |
|---|---|---|
| `PAD_X_RATIO` | `0.04` | Horizontal inset ratio |
| `INNER_Y_RATIO` | `0.035` | Vertical inset ratio |
| `GAP_RATIO` | `0.04` | Base inter-panel/tile gap ratio |
| `NAME_PAD_X_RATIO` | `0.025` | Route-name inner horizontal padding |
| `METRIC_TILE_PAD_RATIO` | `0.04` | Tile inner horizontal spacing basis |
| `METRIC_TILE_CAPTION_RATIO` | `0.34` | Caption-band share for metric tiles |
| `NAME_PANEL_RATIO_FLAT` | `0.38` | Flat-mode default left name-panel share |
| `NAME_BAND_RATIO_HIGH` | `0.22` | High-mode default name-band share |
| `NAME_BAND_RATIO_NORMAL` | `0.34` | Normal-mode default name-band share |
| `NORMAL_APPROACH_TOP_RATIO` | `0.52` | Normal-approach top split before full-width `NEXT` |
| `FLAT_NAME_MIN_RATIO` / `FLAT_NAME_MAX_RATIO` | `0.24` / `0.46` | Flat name-share clamp window |
| `HIGH_NAME_MIN_RATIO` / `HIGH_NAME_MAX_RATIO` | `0.16` / `0.28` | High name-share clamp window |
| `NORMAL_NAME_MIN_RATIO` / `NORMAL_NAME_MAX_RATIO` | `0.24` / `0.40` | Normal name-share clamp window |
| `RESPONSIVE_SCALES.textFillScale` | `1.18` | Compact text ceiling multiplier basis |
| `RESPONSIVE_SCALES.flatNameShareScale` | `0.84` | Flat compact scaling |
| `RESPONSIVE_SCALES.highNameBandScale` | `0.88` | High compact scaling |
| `RESPONSIVE_SCALES.normalNameBandScale` | `0.90` | Normal compact scaling |

## Text-Fit Constants (Owner: ActiveRouteHtmlFit)

| Constant | Value | Purpose |
|---|---|---|
| `METRIC_SEC_SCALE` | `0.72` | Secondary text (`unit`) scale in metric tile fit |
| `ROUTE_NAME_MAX_PX_RATIO_FLAT` | `0.46` | Max route-name px share in flat mode |
| `ROUTE_NAME_MAX_PX_RATIO_HIGH` | `0.54` | Max route-name px share in high mode |
| `ROUTE_NAME_MAX_PX_RATIO_NORMAL` | `0.66` | Max route-name px share in normal mode |

Fit contract:

- fit output is inline style only (`font-size:<n>px;`) for route/value/unit spans
- route text is downscaled to fit; no ellipsis contract
- measurement context is host-context cached (`__dyniActiveRouteTextMeasureCtx`)

## Formatting and Fail-Closed Contract

Formatting:

- `remain` -> `formatDistance(remain, remainUnit)`
- `eta` -> `formatTime(eta)`
- `nextCourse` -> `formatDirection(nextCourse)`

Fail-closed behavior:

- required fields `display`, `captions`, `units`, and `default` are mandatory; missing fields throw
- all rendered text content is escaped (`&`, `<`, `>`, `"`, `'`)
- `disconnect === true` forces placeholder defaults for all metric values
- `NEXT` tile still renders during approach when disconnected (`default` value shown)

## Resize Signature Contract

`resizeSignature(props)` includes these fields (joined):

| Input | Description |
|---|---|
| `routeNameText.length` | route-name width sensitivity |
| `remainText.length` | remain tile value width sensitivity |
| `etaText.length` | ETA tile value width sensitivity |
| `nextCourseText.length` or `0` | approach-only width sensitivity |
| `mode` | layout mode class change |
| `isApproaching` flag (`0/1`) | tile count/layout split |
| `disconnect` flag (`0/1`) | placeholder/value string change |
| rounded shell width | geometry-driven fit updates |
| rounded shell height | geometry-driven fit updates |

## Visual Regression Checklist

Source tests: `tests/cluster/rendering/ActiveRouteTextHtmlWidget.test.js`, `tests/shared/nav/ActiveRouteLayout.test.js`.

- [ ] Dispatch mode emits `catchAll`, hotspot, and `activeRouteOpen` wiring
- [ ] Passive/editing modes remove capture/hotspot wiring
- [ ] `high`/`normal`/`flat` mode classes switch by shell ratio thresholds
- [ ] approach mode toggles `NEXT` tile and grid split
- [ ] disconnect mode uses placeholder output while keeping approach layout contract
- [ ] fit styles apply to route/value/unit text without ellipsis markers
- [ ] escaped HTML output prevents raw markup injection
- [ ] missing required props fail closed with explicit throw
- [ ] layout-owner rects remain inside content rect and preserve normal-approach split ordering

## Related

- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/responsive-scale-profile.md](../shared/responsive-scale-profile.md)
