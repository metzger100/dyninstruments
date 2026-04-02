# RoutePoints HTML Renderer

**Status:** ✅ Implemented | `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`

## Overview

`routePoints` is a native HTML kind (`surface: "html"`) in the nav cluster. It renders the editing-route waypoint list with mode-aware geometry, per-cell text fitting, and page-aware row activation.

Route tuple:

- `cluster: "nav"`
- `kind: "routePoints"`
- `renderer: "RoutePointsTextHtmlWidget"`

Ownership split:

- `cluster/viewmodels/RoutePointsViewModel.js`: route/point normalization and selection/domain flags
- `shared/widget-kits/nav/RoutePointsRenderModel.js`: renderer-facing model normalization and formatter composition
- `shared/widget-kits/nav/RoutePointsLayout.js`: structural geometry + vertical natural-height math
- `shared/widget-kits/nav/RoutePointsHtmlFit.js`: per-box text fit style output (`font-size:<n>px;`)
- `shared/widget-kits/nav/RoutePointsMarkup.js`: escaped HTML assembly + class/state + inline geometry application
- `shared/widget-kits/nav/RoutePointsDomEffects.js`: committed-DOM vertical detection + selected-row visibility pass
- `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`: shell orchestration (`renderHtml`, `namedHandlers`, `resizeSignature`, `initFunction`)

## Module Registration

```javascript
RoutePointsTextHtmlWidget: {
  js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js",
  css: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css",
  globalKey: "DyniRoutePointsTextHtmlWidget",
  deps: [
    "RoutePointsHtmlFit",
    "HtmlWidgetUtils",
    "RoutePointsRenderModel",
    "RoutePointsMarkup",
    "RoutePointsDomEffects"
  ]
}
```

Helper module registration:

- `RoutePointsLayout` and `RoutePointsHtmlFit` in `config/components/registry-shared-foundation.js`
- `RoutePointsRenderModel`, `RoutePointsMarkup`, and `RoutePointsDomEffects` in `config/components/registry-widgets.js`
- `RoutePointsViewModel` in `config/components/registry-cluster.js`

## Props

`NavMapper` routes `kind === "routePoints"` to grouped payload objects:

| Prop | Type | Default | Description |
|---|---|---|---|
| `domain.route` | object \| `null` | `null` | Normalized route (`{ name, points, sourceRoute }`) or missing-route sentinel |
| `domain.routeName` | string | `""` | Header route-name text |
| `domain.pointCount` | number | `0` | Waypoint count used in header/meta |
| `domain.selectedIndex` | number | `-1` | Active waypoint selection index |
| `domain.isActiveRoute` | boolean | `false` | Active-route state class toggle |
| `domain.showLatLon` | boolean | `false` | Row info mode toggle (`lat/lon` vs `course/distance`) |
| `domain.useRhumbLine` | boolean | `false` | Segment math mode for `computeCourseDistance` |
| `layout.ratioThresholdNormal` | number | `1.0` | Ratio below this resolves `high` mode |
| `layout.ratioThresholdFlat` | number | `3.5` | Ratio above this resolves `flat` mode |
| `layout.showHeader` | boolean | `true` | Header render/layout toggle |
| `formatting.distanceUnit` | string | `"nm"` | Distance unit suffix for segment info |
| `formatting.courseUnit` | string | `"°"` | Course unit suffix for segment info |
| `formatting.waypointsText` | string | `"waypoints"` | Header meta suffix (`{N} {waypointsText}`) |
| `default` | string | `"---"` | Placeholder fallback token for invalid formatted values |
| `editing` | boolean | `false` | Disables dispatch mode in layout-editing contexts |
| `dyniLayoutEditing` | boolean | `false` | Dyninstruments runtime editing fallback used by `HtmlWidgetUtils.isEditingMode` |
| `viewportHeight` | number | `window.innerHeight` | Optional test/runtime override for vertical natural-height cap source |

Store key inputs (nav cluster):

- `editingRoute`: `nav.routeHandler.editingRoute`
- `editingIndex`: `nav.routeHandler.editingIndex`
- `activeName`: `nav.routeHandler.activeName`
- `useRhumbLine`: `nav.routeHandler.useRhumbLine`
- `routeShowLL`: `properties.routeShowLL`

## Visual Contract

### CSS State Classes

| Class | Source | Meaning |
|---|---|---|
| `dyni-route-points-html` | wrapper root | Base widget block |
| `dyni-route-points-mode-high` | ratio/vertical mode resolution | Stacked narrow/tall layout |
| `dyni-route-points-mode-normal` | ratio mode resolution | Balanced list layout |
| `dyni-route-points-mode-flat` | ratio mode resolution | Wide shell layout |
| `dyni-route-points-dispatch` | capability + non-editing gate | Interactive row activation mode |
| `dyni-route-points-passive` | fallback mode | Display-only mode |
| `dyni-route-points-active-route` | `domain.isActiveRoute === true` | Active editing-route state |
| `dyni-route-points-row-selected` | row selection state | Selected row highlight |
| `dyni-route-points-marker-selected` | row selection state | Selected marker fill/highlight |

### Element Class Contract

| Selector | Purpose |
|---|---|
| `.dyni-route-points-header` | Header block (optional) |
| `.dyni-route-points-header-route` | Route-name container |
| `.dyni-route-points-header-meta` | Waypoint-count meta container |
| `.dyni-route-points-list` | Scroll container |
| `.dyni-route-points-list-content` | Row stack container |
| `.dyni-route-points-row` | One waypoint row |
| `.dyni-route-points-ordinal` | Row ordinal cell |
| `.dyni-route-points-middle` | Name/info composite region |
| `.dyni-route-points-name` | Waypoint name cell |
| `.dyni-route-points-info` | Coordinate or segment-info cell |
| `.dyni-route-points-marker-cell` | Marker cell |
| `.dyni-route-points-marker` | Marker glyph |

### Click Ownership

Dispatch mode (`dyni-route-points-dispatch`):

- wrapper includes `onclick="catchAll"` (host-owned handler)
- each row includes `onclick="routePointActivate"` and `data-rp-idx="<index>"`
- `namedHandlers(props, hostContext)` returns `{ routePointActivate }`

Passive mode (`dyni-route-points-passive`):

- wrapper has no `onclick`
- rows have no `onclick` and no `data-rp-idx`
- `namedHandlers(...)` returns `{}`

`catchAll` ownership rule:

- The widget never returns `catchAll` from `namedHandlers`; it only references `onclick="catchAll"` in markup when dispatch mode is active.

## Layout Modes

Mode selection:

```text
ratio = shellWidth / shellHeight
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

Committed vertical override:

- `RoutePointsDomEffects.applyCommittedEffects(...)` checks committed ancestry.
- If inside `.widgetContainer.vertical`, mode is forced to `high`.
- First render is fail-closed host-sized; authoritative vertical facts apply on corrective rerender/update when committed state is available.

Mode matrix:

| Mode | Header layout | Row layout |
|---|---|---|
| `high` | stacked (`routeName` over `meta`) | `ordinal | (name over info) | marker` |
| `normal` | side-by-side (`routeName | meta`) | `ordinal | name | info | marker` |
| `flat` | side panel (`routeName` over `meta`) | `ordinal | name | info | marker` |

## Layout Constants (Owner: RoutePointsLayout)

| Constant | Value | Purpose |
|---|---|---|
| `PAD_X_RATIO` | `0.03` | Outer horizontal padding ratio |
| `INNER_Y_RATIO` | `0.02` | Outer vertical padding ratio |
| `GAP_RATIO` | `0.03` | Base responsive gap ratio |
| `ROW_HEIGHT_RATIO` | `0.22` | Row-height ratio against profile anchor |
| `ROW_HEIGHT_MIN_PX` / `ROW_HEIGHT_MAX_PX` | `18` / `62` | Host-sized row-height clamps |
| `ROW_HEIGHT_MIN_PX_VERTICAL` / `ROW_HEIGHT_MAX_PX_VERTICAL` | `22` / `48` | Vertical-mode tighter row-height clamps |
| `HEADER_HEIGHT_SHARE_HIGH` | `1.0` | High-mode header height share vs row height |
| `HEADER_HEIGHT_SHARE_NORMAL` | `0.6` | Normal-mode header height share vs row height |
| `HEAD_PANEL_WIDTH_RATIO_FLAT` | `0.36` | Flat-mode header-panel width share |
| `HEAD_PANEL_MIN_RATIO_FLAT` / `HEAD_PANEL_MAX_RATIO_FLAT` | `0.22` / `0.48` | Flat head-panel share clamp window |
| `ROW_GAP_RATIO` | `0.06` | Vertical row gap ratio |
| `HEADER_GAP_RATIO` | `0.08` | Header-to-list gap ratio |
| `ROW_PADDING_RATIO` | `0.025` | Row inner padding ratio |
| `HEADER_SPLIT_GAP_RATIO` | `0.05` | Header name/meta split gap ratio |
| `MARKER_DIAMETER_RATIO` | `0.48` | Marker dot size share of marker cell |
| `MARKER_DIAMETER_MIN_PX` / `MARKER_DIAMETER_MAX_PX` | `3` / `24` | Marker dot pixel clamps |
| `MAX_VIEWPORT_HEIGHT_RATIO` | `0.75` | Vertical natural-height cap ratio (`75vh`) |
| `RESPONSIVE_SCALES.textFillScale` | `1.18` | Shared text-fit fill profile value |
| `RESPONSIVE_SCALES.flatHeadPanelScale` | `0.84` | Flat panel share responsive scaler |

Anchor model:

- Host-sized path: `computeProfile(W, H)` (`minDim = min(W, H)`).
- Vertical path: `computeProfile(W, W)` (`minDim = W`).
- Row-height floor clamp via `computeInsetPx(...)`, ceiling clamp in layout owner.

Structural geometry owner:

- `computeInlineGeometry(...)` is the sole source of wrapper/header/list/row/cell inline dimensions.
- Widget CSS does not redefine mode geometry ratios or row/header dimensions.
- Row geometry accepts `trailingGutterPx` and reserves that width before marker placement so marker cells do not collide with visible scrollbars.
- Marker dot size is geometry-driven (`markerDotStyle`) and derived from marker-cell dimensions.

## Text-Fit Contract (Owner: RoutePointsHtmlFit)

Measured fit path:

- `TextTileLayout.measureFittedLine(...)` with `RadialTextLayout` primitives
- Theme tokens from `ThemeResolver.resolveForRoot(...)`:
  - value weight: `font.weight`
  - label weight: `font.labelWeight`
- Measurement context cache key on host context: `__dyniRoutePointsTextMeasureCtx`

Output contract:

- Returns style-only decisions (`font-size:<n>px;`) for header and each row cell.
- Fit output never contains user text payload.
- Source model text is never trimmed/altered by fit.
- Markup keeps `white-space: nowrap`; fit uses each raw text-box height as the sizing ceiling and scales down only when required.

## Formatter Contract

Header:

- Route name: `domain.routeName` (trimmed text, no formatter).
- Meta text: `"{pointCount} {waypointsText}"` (or just count when suffix empty).

Row name fallback:

- When a normalized waypoint name is empty, visible row label uses zero-based point index string (`"0"`, `"1"`, ...).

Info cell:

- `showLatLon === true`:
  - formatter: `formatLonLats({ lat, lon })`
  - invalid coordinates preserve formatter placeholder output
- `showLatLon === false`:
  - row `0`: placeholder `"---{courseUnit}/---{distanceUnit}"`
  - row `>= 1` with finite previous+current coordinates:
    - `CenterDisplayMath.computeCourseDistance(prev, curr, useRhumbLine)` returns `{ course, distance }`
    - course formatter: `formatDirection(course)`
    - distance formatter: `formatDistance(distance, distanceUnit)` where `distance` is passed as meters directly
    - composed text: `"{courseText}{courseUnit}/{distanceText}{distanceUnit}"`
  - invalid segment endpoint coordinates: placeholder `"---{courseUnit}/---{distanceUnit}"`

## Selected-Row Visibility Contract

Owner: `RoutePointsDomEffects`.

Flow:

1. Renderer schedules post-commit pass when `hasValidSelection === true`.
2. Deferred pass resolves current committed root/list.
3. `ensureSelectedRowVisible(listEl, selectedIndex)` mutates `scrollTop` only if selected row is outside viewport.

Stale safety:

- Passes are tokened per host context.
- Older scheduled passes are dropped when superseded.
- Detached/mismatched roots are ignored (no mutation).

## `.widgetContainer.vertical` Behavior

- Vertical ancestry is committed-DOM derived (`targetEl.closest(".widgetContainer.vertical")`).
- Vertical mode forces `high` layout and uses width-only row-height anchoring (`computeProfile(W, W)`).
- Natural height is computed from row rhythm and capped at `75vh`.
- Wrapper (`.dyni-route-points-html`) receives inline `height:<cappedPx>px;`.
- Vertical layout geometry uses the same capped natural height as its effective shell height input (single height model for wrapper and inner list rows).
- List container scrolls when content exceeds capped viewport height.
- CSS keeps `height:auto` in vertical stacks so inline wrapper height owns final sizing.

## `showHeader` Behavior

- `layout.showHeader !== false` enables header geometry.
- `layout.showHeader === false` removes header rect and header markup.
- List receives full content area when header is disabled.
- Vertical natural-height math omits header height/gap when header is disabled.

## `isActiveRoute` Contract

- Wrapper gets `dyni-route-points-active-route` when `domain.isActiveRoute === true`.
- ViewModel derivation: true only when `editingRoute` is an object, `activeName` is a non-empty string, and `editingRoute.name === activeName`.

## Resize Signature Contract

`resizeSignature(props)` serializes `RoutePointsRenderModel.resizeSignatureParts`.

Non-vertical signature parts:

1. `pointCount`
2. `mode`
3. `showHeader` flag
4. `showLatLon` flag
5. `selectedIndex`
6. `canActivateRoutePoint` flag
7. rounded shell width
8. rounded shell height
9. measured scrollbar gutter width (`scrollbarGutterPx`)
10. `isVerticalCommitted` flag (`0`)

Vertical signature parts:

1. `isVerticalCommitted` flag (`1`)
2. rounded shell width
3. `pointCount`
4. `showHeader` flag
5. `showLatLon` flag
6. `selectedIndex`
7. `canActivateRoutePoint` flag
8. measured scrollbar gutter width (`scrollbarGutterPx`)

Vertical signature excludes shell height to avoid self-induced resize churn from intrinsic wrapper-height updates.

## Interaction Contract

Dispatch gate (`canActivateRoutePoint`) requires:

- `hostActions.getCapabilities` is available
- `hostActions.routePoints.activate` is available
- `capabilities.routePoints.activate === "dispatch"`
- `capabilities.routeEditor.openEditRoute === "dispatch"` (editroutepage guard)
- editing mode is off (`HtmlWidgetUtils.isEditingMode(props) === false`)

Handler behavior:

```text
routePointActivate(ev):
  - resolve closest [data-rp-idx]
  - parse non-negative integer index
  - re-check gate
  - call hostActions.routePoints.activate(index)
  - return activation result !== false
```

Bridge limitations (known):

- Map-centering parity depends on core relay behavior behind `avnav.api.routePoints.activate`.
- Core double-click `WaypointDialog` behavior is page-local and not exposed via plugin bridge.

## Visual Regression Checklist

Primary test coverage:

- `tests/cluster/rendering/RoutePointsTextHtmlWidget.test.js`
- `tests/cluster/rendering/RoutePointsRenderModel.test.js`
- `tests/cluster/rendering/RoutePointsMarkup.test.js`
- `tests/cluster/rendering/RoutePointsDomEffects.test.js`
- `tests/shared/nav/RoutePointsLayout.test.js`
- `tests/shared/nav/RoutePointsHtmlFit.test.js`

Checklist:

- [ ] `high`/`normal`/`flat` mode classes resolve by ratio + vertical override
- [ ] header on/off behavior reflects `showHeader`
- [ ] row render includes ordinal/name/info/marker with selected state class toggles
- [ ] empty waypoint names render zero-based index fallback text
- [ ] info cell formatter contract holds for lat/lon, segment math, and placeholders
- [ ] escaped output protects route/header/row text
- [ ] dispatch/passive interaction wiring follows page-aware capability gate
- [ ] selected-row visibility pass scrolls off-screen selection into view and drops stale passes
- [ ] vertical natural height is wrapper-owned, capped at `75vh`, and does not destabilize vertical resize signature
- [ ] fit output contains only `font-size` style decisions and keeps source text unchanged

## Related

- [active-route.md](active-route.md)
- [map-zoom.md](map-zoom.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md)
- [../architecture/vertical-container-contract.md](../architecture/vertical-container-contract.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
