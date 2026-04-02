# PLAN6 — Route Points List Widget (`nav/routePoints`)

## Status

Written after repository verification and concept review.

This plan includes the full layout/behavioral concept specification (formerly `RP_Concept.md`, now inlined in the "Concept Specification" section below) and uses the existing `activeRoute` HTML kind as the architectural reference. The coding agent may choose equivalent implementations for rendering details as long as the behavioral, structural, and documentation outcomes below are met. Vertical-container detection, natural-height ownership, first-pass fallback behavior, post-commit correction behavior, resizeSignature mode contracts, and mapper output grouping are explicit plan contracts and must be followed as specified.

---

## Goal

Add a new native HTML kind `routePoints` to the `nav` cluster that renders the editing route's waypoint list with three responsive layout modes, selectable waypoint highlighting, per-row segment info, page-aware row click interaction, and an intrinsic height calculation when hosted inside `.widgetContainer.vertical`.

Expected outcomes after completion:

- A new `RoutePointsTextHtmlWidget` renders a scrollable waypoint list with ordinal, name, info, and marker columns.
- Three layout modes (`high`, `normal`, `flat`) are resolved from shell aspect ratio, with `.widgetContainer.vertical` forcing `high`.
- An optional header shows route name and waypoint count; it is removable via `showHeader` editable.
- Per-row info displays either lat/lon coordinates or course/distance from the previous point, toggled by `routeShowLL`.
- Course/distance is computed via `CenterDisplayMath.computeCourseDistance` with rhumb-line awareness.
- Formatted values use AvNav core formatters (`formatLonLats`, `formatDirection`, `formatDistance`).
- Text sizing is box-driven: every text element is fitted against its own layout box, scaled down only when it does not fit, never truncated with ellipsis.
- `.widgetContainer.vertical` computes natural height from row count, gaps, and header, capped at `75vh`, with list overflow scrolling.
- `selectedIndex` from `editingIndex` highlights the active waypoint. Whenever a valid selection exists, the selected row is visible inside the scrollable list container.
- `isActiveRoute` is reflected as a dedicated wrapper state class for CSS styling.
- When a waypoint name is empty after normalization, the visible label uses the zero-based point index string.
- On `editroutepage`, clicking a row activates the corresponding waypoint via `hostActions.routePoints.activate(index)`, achieving selection-action parity with the core `RoutePointsWidget`.
- On all other pages (`gpspage`, `navpage`, etc.), the widget is passive: no click handlers, no `catchAll`, host retains default click ownership.
- The widget follows all existing architectural conventions: UMD wrapper, shared layout/fit split, `HtmlSurfaceController` lifecycle, fail-closed contracts, smell-prevention rules, file-size budget.
- Documentation and tests cover the new kind end-to-end.

---

## Verified Baseline

The following points were rechecked against the repository before this plan:

1. `activeRoute` is the canonical HTML-kind reference implementation: `ActiveRouteTextHtmlWidget` + `ActiveRouteLayout` + `ActiveRouteHtmlFit` + `ActiveRouteViewModel`.
2. `HtmlSurfaceController` owns the strict `attach`/`update`/`detach`/`destroy` lifecycle for `surface: "html"` kinds and manages named handlers and resize signatures.
3. `ClusterKindCatalog` is the single source of truth for route selection; new tuples must be added there.
4. `ClusterRendererRouter` owns the renderer inventory; new HTML renderers must be added to its `rendererSpecs` map and `deps`.
5. `NavMapper` already handles `activeRoute` via `ActiveRouteViewModel.build()`; a new `routePoints` branch must be added.
6. `CenterDisplayMath.computeCourseDistance(src, dst, useRhumbLine)` already computes great-circle and rhumb-line bearing/distance between two points. Returns `{ course: number, distance: number }` where course is in degrees and distance is in meters (`EARTH_RADIUS_M = 6371000`). This matches the AvNav core convention where `formatDistance(meters, unit)` internally converts from meters to the target unit (e.g., divides by 1852 for nm) and `formatDirection(degrees)` takes degrees directly.
7. `HtmlWidgetUtils` provides `escapeHtml`, `toStyleAttr`, `resolveShellRect`, `resolveRatioMode`, `isEditingMode`, `toFiniteNumber`, and `trimText`.
8. `ResponsiveScaleProfile` + `LayoutRectMath` are the shared responsive-scaling and rectangle-math owners. `ResponsiveScaleProfile.computeProfile(W, H, spec)` computes `minDim = min(W, H)` internally; passing `W` for both dimensions forces `minDim = W` (used for `.widgetContainer.vertical` width-only anchor). `computeInsetPx(profile, ratio, floor)` returns `max(floor, floor(minDim × ratio))`.
9. `TextTileLayout.measureFittedLine` and related APIs handle box-driven text fitting for HTML widget inline style output.
10. `RadialTextLayout.fitSingleTextPx` and `measureValueUnitFit` are the text measurement primitives.
11. `ThemeResolver.resolveForRoot` provides font weight and label weight tokens.
12. `plugin.css` owns `.widget.dyniplugin .widgetData.dyni-shell` fill behavior; widget-local CSS must not override it.
13. AvNav `nav.routeHandler.editingRoute` and `nav.routeHandler.editingIndex` are the source keys for the route editor's current route and selected index.
14. `config/shared/kind-defaults.js` defines `NAV_KIND` entries for per-kind caption/unit text params used by text renderer kinds. routePoints text settings (`distanceUnit`, `courseUnit`, `waypointsText`) are standalone editables owned by `config/clusters/nav.js` and do not belong in `kind-defaults.js`.
15. `config/clusters/nav.js` defines the `nav` cluster's `storeKeys`, `editableParameters`, and `updateFunction`.
16. No `routePoints` code, config, or catalog entry exists in the repository today.
17. `TemporaryHostActionBridge` exposes `hostActions.routePoints.activate(index)` bridging to `avnav.api.routePoints.activate`. The capability snapshot reports `routePoints.activate === "dispatch"` on `editroutepage` and `gpspage` (when the relay is present); `"unsupported"` elsewhere. The `routeEditor.openEditRoute === "dispatch"` capability is `editroutepage`-only.
18. Core `RoutePointsWidget.jsx` dispatches row clicks via `onItemClick` → `widgetClick`. Only `EditRoutePage.widgetClick` handles `item.name === "RoutePoints"` meaningfully (selects waypoint, centers map, opens dialog on double-click). `GpsPage.onItemClick` falls through to `history.pop()`. `NavPage.widgetClick` has no `RoutePoints` handler.
19. `ActiveRouteTextHtmlWidget` uses `canDispatchOpenRoute(hostContext)` + `openActiveRoute(hostContext, props, htmlUtils)` as the canonical dispatch/passive pattern for HTML-kind host-action interaction via named handlers.

---

## Concept Specification

This section is the authoritative layout/behavioral specification for the `routePoints` widget. It defines all settings, layout geometry, sizing rules, data contracts, and formatting rules.

### Exposed Settings

#### `showHeader`

- type: `boolean`
- default: `true`

Behavior:

- `true` renders the header exactly as defined in the current concept.
- `false` removes the header from layout completely.

Mode-specific effect:

- high mode: wrapper becomes `list` only instead of `header | list`; the list gets the full widget height.
- normal mode: wrapper becomes `list` only instead of `header | list`; the list gets the full widget height.
- flat mode: wrapper becomes `listPanel` only instead of `headPanel | listPanel`; the list gets the full widget width.

`.widgetContainer.vertical` effect: natural height calculation must omit header height and header-to-list gap. The rest of the vertical sizing rule stays unchanged.

#### `distanceUnit`

- type: `string`
- default: `"nm"`

Behavior: controls the unit used for segment distance in row info when `showLatLon === false`.

#### `courseUnit`

- type: `string`
- default: `"°"`

Behavior: controls the visible unit appended to the formatted course value.

#### `waypointsText`

- type: `string`
- default: `"waypoints"`

Behavior: controls the visible suffix appended to the number of waypoints in the header.

### Layout Concept

#### Shared mode rules

Mode resolution:

- ratio `< routePointsRatioThresholdNormal` → `high`
- ratio `> routePointsRatioThresholdFlat` → `flat`
- otherwise → `normal`
- `.widgetContainer.vertical` forces `high` and a dedicated height calculation

Mode resolution decides box topology only.

#### Row Height Anchor

Row height is the single structural anchor from which all other vertical dimensions (header height, gaps, ordinal/marker square size) are derived as ratios.

**Problem:** Row height cannot be derived from shell height alone. In `.widgetContainer.vertical` the shell height is *computed from* row height — that would be circular. A linear ratio on shell width alone breaks at extreme aspect ratios: a 100px-wide high-mode shell produces microscopic rows while a 1400px-wide flat-mode shell produces absurdly tall ones.

**Solution: `min(W, H)` anchor with vertical-container fallback.**

The layout module computes the anchor input depending on context, then feeds it through `ResponsiveScaleProfile` API calls:

```text
// Host-sized shells: min(W, H) is the anchor — computeProfile does this internally
profile = ResponsiveScaleProfile.computeProfile(W, H, { scales: RESPONSIVE_SCALES })
// profile.minDim === min(W, H)

// .widgetContainer.vertical: W is the anchor — pass W for both dimensions to force minDim = W
profile = ResponsiveScaleProfile.computeProfile(W, W, { scales: RESPONSIVE_SCALES })
// profile.minDim === W

// Row height from profile (same call for both paths)
rowHeight = ResponsiveScaleProfile.computeInsetPx(profile, ROW_HEIGHT_RATIO, ROW_HEIGHT_MIN_PX)
// computeInsetPx returns: max(floor, floor(profile.minDim × ratio))
// Then clamp ceiling externally:
rowHeight = min(rowHeight, ROW_HEIGHT_MAX_PX)
```

`computeProfile(W, H, spec)` internally computes `minDim = min(W, H)`. Passing `W` for both arguments (`computeProfile(W, W, spec)`) forces `minDim = W`, which is the correct anchor for `.widgetContainer.vertical` where H is unknown.

`computeInsetPx(profile, ratio, floor)` returns `max(floor, floor(profile.minDim × ratio))`, which provides the floor clamp. The ceiling clamp (`ROW_HEIGHT_MAX_PX`) must be applied externally by the layout module since `computeInsetPx` only supports a floor parameter.

Why `min(W, H)` self-corrects for host-sized shells:

- Tall narrow shell (high mode): W is small → W dominates → rows stay modest.
- Wide flat shell (flat mode): H is small → H dominates → rows don't balloon.
- Balanced shell (normal mode): the smaller dimension is always the one "under pressure," which is exactly the right constraint for row height.

Why `W` alone is safe for `.widgetContainer.vertical`: vertical-container forces `high` mode, which means the shell is narrow by definition. W is already the constraining dimension. The absolute pixel clamps (`ROW_HEIGHT_MIN_PX`, `ROW_HEIGHT_MAX_PX`) act as the safety net that `min(W, H)` would have provided if H were available. The clamp bounds should be tighter than the host-sized clamps to prevent runaway sizing (e.g., floor ~22px, ceiling ~48px).

**Derived dimensions (all expressed as ratios of `rowHeight`):**

| Dimension               | Derivation                                       | Notes                                                               |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| `headerHeight` (high)   | `rowHeight × HEADER_HEIGHT_SHARE_HIGH` (≈ 1.0)   | Two stacked lines each get half; header matches row rhythm          |
| `headerHeight` (normal) | `rowHeight × HEADER_HEIGHT_SHARE_NORMAL` (≈ 0.6) | Horizontal name/meta bar; visually subordinate to data rows         |
| `headerHeight` (flat)   | n/a — header is a side panel                     | Panel height equals list height; no separate header-height constant |
| `ordinalWidth`          | `rowHeight`                                      | Square cell                                                         |
| `markerWidth`           | `rowHeight`                                      | Square cell                                                         |
| `rowGap`                | `rowHeight × ROW_GAP_RATIO`                      | Vertical gap between rows                                           |
| `headerGap`             | `rowHeight × HEADER_GAP_RATIO`                   | Gap between header and list (high/normal only)                      |
| `rowPadding`            | `rowHeight × ROW_PADDING_RATIO`                  | Inner padding within a row                                          |

The `ROW_HEIGHT_RATIO`, clamp bounds, responsive scale keys, and all derived-dimension ratios are owned by `RoutePointsLayout`. The coding agent should tune exact values against the concept example (42px row height at the reference shell size) and the `ActiveRouteLayout` proportional system.

`RoutePointsLayout` is also the single source of structural DOM geometry. The renderer must apply the layout result through inline styles on the wrapper, header, list, rows, and cells so the rendered DOM uses the same pixel geometry that the fit module measured.

#### High Mode

**Visual intent:** High mode is the stacked mode for tall or narrow shells.

**Geometry:**

- wrapper rows: `header | list` with padding to the widget border and between the elements
- header rows: `routeName | meta` with padding between the elements (top: routeName at half height, bottom: meta at half height)
- each list row has a grid with 3 horizontal areas, second horizontal slot is split vertically:
  - left: ordinal (square shape)
  - middle top: `waypoint name` (half height)
  - middle bottom: `info` (half height)
  - right: round marker (square shape)

**Important sizing rule:** The header is a grid with two horizontal cells. The row height is the structural anchor (see "Row Height Anchor" above). The header height is `rowHeight × HEADER_HEIGHT_SHARE_HIGH`. The grid height and the height of the split middle area of the grid are computed from that row height by layout ratios.

Example concept:

- row height = 42px
  - row inner box = 40px after padding
    - ordinal = 40 px
    - middle = 40 px (top slot = 19px, gap = 2px, bottom slot = 19px)
    - gap = 2px
    - marker = 40 px

**Header rule:** The header fills the whole header box. The two header lines are vertically distributed by layout share.

#### Normal Mode

**Visual intent:** Normal mode is the balanced list mode.

**Geometry:**

- wrapper rows: `header | list` with padding to the widget border and between the elements
- header columns: `routeName | meta` with padding between the elements (left: routeName at half width, right: meta at half width)
- each row is a grid with four horizontal areas: `ordinal | waypoint name | info | marker`
  - left: ordinal (square shape)
  - middle left: `waypoint name` (half of remaining width)
  - middle right: `info` (half of remaining width)
  - right: round marker (square shape)

**Important sizing rule:** The header is a grid with two horizontal cells. The route name and meta get their own boxes inside it (routename and meta get 50% of the width each). The row height is the structural anchor (see "Row Height Anchor" above). The header height is `rowHeight × HEADER_HEIGHT_SHARE_NORMAL`, making it visually subordinate to data rows.

#### Flat Mode

**Visual intent:** Flat mode is the wide-shell mode.

**Geometry:**

- wrapper columns: `headPanel | listPanel` with padding to the widget border and between the elements
- head panel rows: `routeName | meta` with padding between the elements (top: routeName at half height, bottom: meta at half height)
- each row is a grid with four horizontal areas: `ordinal | waypoint name | info | marker`
  - left: ordinal (square shape)
  - middle left: `waypoint name` (half of remaining width)
  - middle right: `info` (half of remaining width)
  - right: round marker (square shape)

**Important sizing rule:** The left header panel is a real panel. That means the side panel gets a width share from layout, and the two text boxes inside that panel get height shares from layout.

### Widget Size

#### Normal Case

The height and width of the widget is defined by the host.

#### Special Case: `.widgetContainer.vertical`

This is the most important route-points-specific deviation from `activeRoute`.

**What is special about it:** In `.widgetContainer.vertical`, the host does not want a permanently fixed-height list widget. A route-points list should be allowed to grow intrinsically, otherwise it wastes space when there are few points and becomes unreadable when there are many.

**Required behavior when the widget root is inside `.widgetContainer.vertical`:**

1. Force mode = `high`.
2. Derive `rowHeight` from the width-only anchor path (see "Row Height Anchor" above): `computeInsetPx(computeProfile(W, W, spec), ROW_HEIGHT_RATIO, ROW_HEIGHT_MIN_PX)` clamped to `ROW_HEIGHT_MAX_PX`, with tighter clamps than the host-sized path.
3. Compute natural shell height from: header height + header gap + row count × row height + max(0, row count - 1) × row gap + outer padding.
4. Cap the final widget height at `75vh`.
5. Make the list scrollable if the natural height exceeds that cap.
6. Apply the computed natural height as an inline style on the widget wrapper element (`.dyni-route-points-html`).
7. Re-evaluate committed ancestry through the normal attach/update render path; no widget-owned observer is required.

**Vertical lifecycle timing contract:**

Pre-commit `renderHtml()` runs before mounted DOM ancestry is reliable. The widget uses normal host-sized assumptions on the first render. After attach, `initFunction().triggerResize()` requests one corrective rerender. That rerender reads committed ancestry via `targetEl.closest(".widgetContainer.vertical")` and applies the vertical-container layout contract: forced `high` mode, width-only anchor, natural height computation, and wrapper inline height injection. Later normal updates re-evaluate the same committed ancestry path. AvNav layout owns `.widgetContainer.vertical`, so no widget-owned observer is required.

### Text Sizing

Text sizing is box-driven:

- Every text element gets its own layout box.
- Every text element is fitted against the real width and height of its own box.
- The font size is reduced only when the text would not fit.
- If the text fits, it should use the full available box height/width up to its maximum.
- List text elements are fitted on their own as well.

Overflow rule: never use ellipsis; always keep `white-space: nowrap`; always scale text down to fit into its box; text must stay inside its own box.

Implementation rule: layout computes the text boxes; fit computes one font size per text box; renderer only applies the fitted size to the matching element.

**RoutePoints fit contract:**

`RoutePointsHtmlFit` must return font-size decisions only. The rendered text for route name, header meta, waypoint name, ordinal, and info text must always equal the full normalized source string. No fit helper may alter, trim, substitute, abbreviate, or ellipsize the visible text for this widget.

Allowed implementation paths:

- `RadialTextLayout.fitSingleTextPx(...)`, or
- `TextTileLayout.measureFittedLine(...)` used strictly as a measurement source for font-size selection, without consuming any trimmed or transformed text output.

Forbidden for this widget:

- `drawFittedLine(...)`
- `trimToWidth(...)`
- ellipsis-based rendering
- any helper usage that changes the emitted text content rather than only the font size.

**No-trim regression** (required in test plan):

For header and row cells, rendered text content must equal the full normalized source string. Verification must assert both:

1. text content is unchanged, and
2. long content is handled by reduced font size rather than text shortening.

### AvNav Keys and Formatting Contract

#### Source keys retrieved by the nav cluster

The `nav` cluster provides the route-points widget from these store keys:

- `editingRoute` ← `nav.routeHandler.editingRoute`
- `editingIndex` ← `nav.routeHandler.editingIndex`
- `activeName` ← `nav.routeHandler.activeName`
- `useRhumbLine` ← `nav.routeHandler.useRhumbLine`
- `routeShowLL` ← `properties.routeShowLL`

#### Route object

The view-model reads the route from `editingRoute`.

Expected input shape:

- `editingRoute` must be an object
- `editingRoute.points` must be an array (an empty array is valid)
- `editingRoute.name` is used as the route name
- each point may contain: `name`, `lat`, `lon`
- when a waypoint `name` is empty after normalization (trimmed to `""`), the visible label uses the zero-based point index as a string (e.g., `"0"`, `"1"`, `"2"`)
- if `editingRoute` is missing, not an object, or `points` is not an array, the view-model returns `route: null`
- if `editingRoute` is an object and `points` is an empty array, the view-model returns a valid route object with `points: []`

Route shape produced by the view-model:

```text
route: {
  name: string,
  points: [
    {
      name: string,       // trimmed; falls back to zero-based index string when empty
      lat: number | undefined,
      lon: number | undefined
    }
  ],
  sourceRoute: editingRoute
}
```

#### Mapper output for `routePoints`

`NavMapper` turns the view-model output into the renderer payload using grouped sub-objects. The mapper output must stay under the mapper-output complexity threshold by grouping renderer-facing data. Later phases rely on this grouped contract and must not revisit the mapper shape.

Top-level mapper output:

- `renderer`: `"RoutePointsTextHtmlWidget"`
- `domain`: route data and selection state
- `layout`: mode thresholds and header toggle
- `formatting`: unit strings and label text

Sub-object shapes:

```text
domain: {
  route,           // { name, points, sourceRoute } or null
  routeName,       // string
  pointCount,      // number
  selectedIndex,   // number or -1
  isActiveRoute,   // boolean
  showLatLon,      // boolean
  useRhumbLine     // boolean
}

layout: {
  ratioThresholdNormal,   // number or undefined
  ratioThresholdFlat,     // number or undefined
  showHeader              // boolean
}

formatting: {
  distanceUnit,    // string
  courseUnit,      // string
  waypointsText    // string
}
```

The stable top-level shape is `renderer` + `domain` + `layout` + `formatting`. New top-level groups may be added in the future when a concrete field requires them, but the existing groups must remain structurally stable from the first implementation.

#### Formatter contract

##### Header

**Route name:** Source is explicit normalized `routeName`. Formatter: none (plain trimmed text).

**Waypoint count:** Source is `pointCount`. Formatter: plain string template `"{N} [waypointsText]"` (not an AvNav core formatter).

##### Row info when `showLatLon === true`

Source: point `{ lat, lon }`. Formatter: `formatLonLats({ lat, lon })`.

Rows with missing or non-finite `lat`/`lon` values render the formatter’s placeholder output.

##### Row info when `showLatLon === false`

**Row 0:** No previous segment. Display string: `"---" + courseUnit + "/---" + distanceUnit`.

**Row >= 1with valid previous and current point coordinates:** Source is the segment from the previous point to the current point; bearing/distance is computed by`CenterDisplayMath.computeCourseDistance(previousPoint, currentPoint, useRhumbLine)`. The return value is` { course: number, distance: number }`where`course`is in **degrees** and`distance`is in **meters** (computed from`EARTH_RADIUS_M = 6371000`). This matches AvNav core conventions —` formatDistance(meters, unit)`internally divides by the unit factor before formatting, and`formatDirection(degrees)`takes degrees directly. Formatters: course →`formatDirection()`, distance →` formatDistance()`. Final display string:` "{course}{courseUnit}/{distance}{distanceUnit}"`.

**Row >= 1with missing or non-finite coordinates on either endpoint:** Display string:`"---" + courseUnit + "/---" + distanceUnit`.

**Important:** The raw distance value from `computeCourseDistance` must be passed directly to `formatDistance` without manual conversion. `formatDistance` accepts its first parameter in meters and converts to the target unit internally. `computeCourseDistance` is only called for rows whose previous and current points both have finite coordinates.

---

## Architecture Notes

These notes anchor the plan. They are descriptive, not prescriptive.

### How activeRoute serves as the template

`activeRoute` demonstrates the canonical HTML-kind flow:

1. `ActiveRouteViewModel` normalizes domain data in the mapper.
2. `NavMapper.translate()` returns a dedicated renderer output with `renderer: "ActiveRouteTextHtmlWidget"`.
3. `ClusterKindCatalog` routes `nav/activeRoute` to `surface: "html"`.
4. `ActiveRouteTextHtmlWidget.renderHtml()` builds HTML string with escaped text and inline fit styles.
5. `ActiveRouteLayout` owns responsive geometry (insets, content rect, mode-specific panel/tile rects).
6. `ActiveRouteHtmlFit` owns text measurement and font-size style output.
7. `HtmlSurfaceController` manages lifecycle and named handlers.

`routePoints` follows the same layering with these differences:

- The mapper output uses grouped sub-objects (`domain`, `layout`, `formatting`) to comply with mapper-output complexity discipline.
- The view-model reads a route object with a variable-length point array instead of a fixed set of display fields.
- The renderer produces a list with dynamic row count instead of a fixed metric grid.
- The layout module owns the structural geometry contract: row height, header dimensions, list dimensions, row gaps, cell rects, and vertical natural-height math all come from `RoutePointsLayout`.
- `RoutePointsMarkup` applies that layout-owned geometry to the DOM through inline styles on the wrapper, header, list, rows, and cells. `RoutePointsTextHtmlWidget.css` supplies presentation and state styling only.
- The fit module must fit text per-row and per-cell, not per-metric-tile.
- `.widgetContainer.vertical` uses an attach-time corrective rerender so committed ancestry can drive forced `high` mode and wrapper-owned natural height.
- Selected-row visibility uses a dedicated post-commit DOM pass against the current mounted list after attach and after later renders whose committed output may change row visibility.
- Row click interaction uses a page-aware passive-by-default handler-registration model: `namedHandlers` returns an empty map on all pages except `editroutepage`, where `routePointActivate` is registered for selection-action parity with the core `RoutePointsWidget`. This is a renderer-level contract decision, distinct from the `activeRoute` pattern where `activeRouteOpen` is registered whenever the `routeEditor.openActiveRoute` capability is present.

### Store key timing

`editingRoute` is set by the AvNav route editor. It may be `undefined` or not an object when no route is loaded. The view-model must return `route: null` when `editingRoute` is missing, not an object, or lacks an array `points` field. When `editingRoute` is an object with an empty `points` array, the view-model must return a valid route object with `points: []`. The renderer must handle both `route: null` (render an empty wrapper with mode classes, no header content, and no list rows) and a zero-point route (empty list, header with zero count) gracefully. Neither case may throw.

### Marker and selection

`editingIndex` identifies the currently selected waypoint. The renderer should apply a visual highlight class to the matching row. If `editingIndex` is out of range or not a finite number, no row is highlighted.

###### Selected-row visibility

Whenever a valid selection exists, the selected row must be visible inside `.dyni-route-points-list`.

The first host render performs no committed-DOM work. `initFunction().triggerResize()` requests the attach-time corrective rerender for authoritative vertical-state resolution and wrapper-owned natural height. After any attach or rerender whose committed output may change selected-row visibility, the renderer shell schedules a bounded post-commit visibility pass owned by `RoutePointsDomEffects`.

The shell resolves committed vertical facts from `hostContext.__dyniHostCommitState` on attach-time correction and later normal updates, then passes `isVerticalCommitted` into `RoutePointsRenderModel`. Separately, the shell asks `RoutePointsDomEffects` to run a post-commit visibility pass keyed to the current widget instance. That pass resolves the current `.dyni-route-points-list`, locates the selected row in the mounted DOM, and adjusts `scrollTop` only when needed.

Missing, invalid, or out-of-range selection is a no-op. Already-visible selection produces no scroll mutation. The correction is idempotent, stale-safe, and must not create resize-signature churn.

**Execution owner: `RoutePointsDomEffects`.**

`RoutePointsDomEffects.js` is the single owner of committed-DOM reads and writes for this widget. It owns:

- authoritative `.widgetContainer.vertical` ancestry lookup on the committed target element for corrective-rerender inputs
- bounded post-commit selected-row visibility scheduling for the current widget instance
- selected-row visibility correction inside `.dyni-route-points-list`
- idempotent scroll-mutation helpers

`RoutePointsDomEffects` does not own resize-signature computation, markup generation, or render-model logic.

**Lifecycle contract:**

- attach-time corrective rerender: triggered by `initFunction().triggerResize()` after the first mounted shell exists
- selection-change corrective rerender: triggered when `selectedIndex` changes and the resize signature changes
- post-commit visibility pass: scheduled by the renderer shell after attach and after rerenders whose committed output may change selected-row visibility
- the renderer shell resolves committed host facts from `hostContext.__dyniHostCommitState`, calls `RoutePointsDomEffects` for vertical-state inputs, and schedules `RoutePointsDomEffects` for selected-row visibility on the current mounted list

**Lifecycle timing:**

Attach-time correction and later normal updates read committed ancestry before render-model assembly. Selected-row visibility runs after commit against the current mounted list through a bounded deferred probe owned by `RoutePointsDomEffects`.

### isActiveRoute rendering contract

`domain.isActiveRoute` is passed through the mapper. The renderer applies a dedicated wrapper state class `dyni-route-points-active-route` when `isActiveRoute === true`.

The view-model derives `isActiveRoute` from the core route-editor active-state rule: the result is `true` when `editingRoute` is an object, `activeName` is a non-empty string, and `editingRoute.name === activeName`. The result is `false` in all other cases.

Display normalization for header text and waypoint labels does not participate in this comparison. CSS and tests cover the active-route wrapper state. Acceptance criteria include active/inactive rendering checks.

### Waypoint name fallback

When a waypoint `name` is empty after normalization, the visible label uses the zero-based point index as a string (e.g., `"0"`, `"1"`, `"2"`). This fallback is applied in view-model or render-model normalization, visible row labels, renderer regression tests, and documentation examples. This keeps row identity deterministic and aligns the widget with the core route-point data path.

### Row click behavior — EditRoutePage selection-action parity

#### Core widget behavior analysis

The core `RoutePointsWidget.jsx` dispatches row clicks through AvNav's `onItemClick` chain. On each page the behavior differs:

| Page            | Core click behavior                                                                                                                                                                                                                                                                               | Plugin parity                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `editroutepage` | `widgetClick` handler intercepts `item.name === "RoutePoints"`, calls `currentEditor.setNewIndex(point.idx)` to select the waypoint, calls `MapHolder.setCenter(currentEditor.getPointAt())` to center the map, opens `WaypointDialog` on double-click (same point already selected and centered) | Row click dispatches waypoint activation via `hostActions.routePoints.activate(index)` |
| `gpspage`       | No `RoutePoints` handler — falls through to `history.pop()` (navigate back); not meaningful for the list                                                                                                                                                                                          | Passive — no click dispatch, no `catchAll`, host retains default click ownership       |
| `navpage`       | No `RoutePoints` handler — falls through to `history.push("gpspage")`                                                                                                                                                                                                                             | Passive — same as `gpspage`                                                            |
| other pages     | Not available or no handler                                                                                                                                                                                                                                                                       | Passive — no click dispatch                                                            |

#### Dispatch mechanism: `TemporaryHostActionBridge`

The plugin bridges host workflow actions through `runtime/TemporaryHostActionBridge.js`. For route point activation:

- `hostActions.routePoints.activate(index)` calls the runtime-exposed `avnav.api.routePoints.activate(normalizedIndex)`.
- The bridge validates the index (must be a non-negative integer) and checks capability state before dispatch.
- The bridge's capability snapshot reports `routePoints.activate === "dispatch"` on `editroutepage` and `gpspage` (when the relay API is present), and `"unsupported"` elsewhere.
- All bridge code is tagged with `// dyni-workaround(avnav-plugin-actions)` per `coding-standards.md`.

#### Page restriction rule

The widget must restrict interactive row clicks to `editroutepage` only, matching the core behavior where only the `EditRoutePage.widgetClick` handler processes `RoutePoints` clicks meaningfully.

Capability gate for row activation:

```text
canActivateRoutePoint(hostContext) =
  hostActions exists
  AND hostActions.getCapabilities is a function
  AND hostActions.routePoints.activate is a function
  AND capabilities.routePoints.activate === "dispatch"
  AND capabilities.routeEditor.openEditRoute === "dispatch"   ← editroutepage-only guard
  AND NOT isEditingMode(props)                                ← layout editing bypasses interaction
```

The `routeEditor.openEditRoute === "dispatch"` clause restricts activation to `editroutepage`. This mirrors the core, where only `EditRoutePage.widgetClick` handles `RoutePoints` meaningfully — `GpsPage.onItemClick` just pops the page.

#### Click dispatch and state classes

When `canActivateRoutePoint` returns `true`:

- Wrapper gets `onclick="catchAll"` to block upward propagation (prevents `GpsPage.history.pop()` or `NavPage` default navigation).
- Each row gets `onclick="routePointActivate"` (named handler).
- Each row carries a `data-rp-idx="N"` attribute for index lookup.
- The handler resolves the index from the event target via `closest("[data-rp-idx]")` and calls `hostActions.routePoints.activate(index)`.
- Wrapper gets state class `dyni-route-points-dispatch` (interactive mode).

When `canActivateRoutePoint` returns `false`:

- No `catchAll` on wrapper.
- No `onclick` on rows.
- No `data-rp-idx` attributes.
- Wrapper gets state class `dyni-route-points-passive` (display-only mode).
- Host retains default click ownership (page navigation, layout editing, etc.).

**`catchAll` ownership rule:**

`catchAll` is host-owned and pre-registered outside this widget. The widget must never return `catchAll` from `namedHandlers(props, hostContext)` and must never try to take ownership of it through `HtmlSurfaceController`.

When dispatch mode is active, `RoutePointsMarkup` may emit `onclick="catchAll"` on the wrapper solely to consume the host-owned handler and stop upward propagation.

#### Named handler: `routePointActivate`

```text
routePointActivate(ev):
  1. Resolve target element: ev.target.closest("[data-rp-idx]")
  2. If no target → return (click on non-row area inside widget)
  3. Parse index: parseInt(target.getAttribute("data-rp-idx"), 10)
  4. If index is not a finite non-negative integer → return
  5. If isEditingMode(props) → return false
  6. If !canActivateRoutePoint(hostContext) → return false
  7. Call hostActions.routePoints.activate(index)
  8. Return result (true on success, throws on bridge error)
```

The handler is registered via `namedHandlers(props, hostContext)` and is session-owned by `HtmlSurfaceController` — wired on `attach`/`update`, removed on `detach`/`destroy`.

#### Scope limitations vs core parity

The plugin dispatch via `hostActions.routePoints.activate(index)` achieves selection-action parity for waypoint selection. Two core-side behaviors are page-owned and not replicable from the plugin:

1. **Map centering** (`MapHolder.setCenter`): The core `EditRoutePage.widgetClick` centers the map after setting the index. The `avnav.api.routePoints.activate` relay may or may not trigger map centering internally. If it does, full parity is achieved. If it does not, the waypoint is still selected but the map is not re-centered. This is a known bridge limitation and is acceptable.

2. **Double-click WaypointDialog**: The core opens a `WaypointDialog` when the same waypoint is clicked a second time and the map was already centered. The plugin has no access to `WaypointDialog` or its React-level hooks. This is out of scope.

Both limitations are tracked per `dyni-workaround(avnav-plugin-actions)` convention and recorded in `TECH-DEBT.md`.

---

## Hard Constraints

### Architecture

- Do not change the AvNav host registration strategy.
- Do not add ES modules or a build step.
- Follow the existing UMD component pattern.
- Do not add a second responsive scale profile; use `ResponsiveScaleProfile`.
- Do not duplicate shared utilities (`HtmlWidgetUtils`, `CenterDisplayMath`, etc.).

### File organization

- Renderer folder: `widgets/text/RoutePointsTextHtmlWidget/`
  - `RoutePointsTextHtmlWidget.js` — thin renderer entrypoint (exported contract surface: `renderHtml`, `namedHandlers`, `resizeSignature`, `initFunction`, dependency wiring)
  - `RoutePointsRenderModel.js` — pure normalization owner (grouped prop reads, mode resolution, vertical-state resolution, route/header/row display-model assembly, page-aware interaction flags, resize-signature input derivation)
  - `RoutePointsMarkup.js` — pure HTML string assembly owner (wrapper classes, header markup, row markup, state classes, escaped text insertion, fit-style application)
  - `RoutePointsDomEffects.js` — committed-DOM side-effect owner (authoritative vertical ancestry lookup, bounded post-commit visibility scheduling, selected-row visibility correction, idempotent scroll mutation helpers; no resize-signature ownership)
  - `RoutePointsTextHtmlWidget.css` — widget-local styles
- ViewModel: `cluster/viewmodels/RoutePointsViewModel.js`
- Layout owner: `shared/widget-kits/nav/RoutePointsLayout.js`
- Fit owner: `shared/widget-kits/nav/RoutePointsHtmlFit.js`
- Each file must stay within the 400-line budget.

### Behavioral

- Row height must be derived from `ResponsiveScaleProfile.computeInsetPx(profile, ROW_HEIGHT_RATIO, ROW_HEIGHT_MIN_PX)` clamped to `ROW_HEIGHT_MAX_PX`, where the profile is computed via `computeProfile(W, H, spec)` for host-sized shells (anchor = `min(W, H)`) or `computeProfile(W, W, spec)` for `.widgetContainer.vertical` (anchor = `W`). All other vertical dimensions (header height, gaps, square cells) must be ratios of that anchor.
- Text sizing is box-driven per the concept: scale down to fit, never ellipsis, always `white-space: nowrap`. The rendered text for all text cells must equal the full normalized source string; `RoutePointsHtmlFit` must return font-size decisions only and must never alter, trim, substitute, abbreviate, or ellipsize visible text.
- `.widgetContainer.vertical` must compute intrinsic height and cap at `75vh` using `window.innerHeight` as the viewport height source; when `window.innerHeight` is unavailable, use an injected `viewportHeight` parameter.
- Layout-owned structural geometry must reach the DOM through inline styles on the wrapper, header, list, rows, and cells. `RoutePointsTextHtmlWidget.css` must not duplicate layout-owned dimensions or mode ratios.
- `showHeader === false` must remove header entirely from layout and vertical height calculation.
- Formatter usage must match the concept: `formatLonLats`, `formatDirection`, `formatDistance`.
- Course/distance computation must use `CenterDisplayMath.computeCourseDistance` with `useRhumbLine`. The returned distance is in meters and must be passed directly to `formatDistance` without manual conversion; `formatDistance` converts from meters internally.
- The first row (index 0) must show a placeholder when `showLatLon === false`.
- Pre-commit `renderHtml()` must treat mounted-container state as unknown unless runtime-owned committed host facts are already present.
- `.widgetContainer.vertical` detection based on committed ancestry is authoritative after attach and on later normal updates.
- First render must use normal host-sized assumptions.
- The widget must use `initFunction().triggerResize()` to request one corrective rerender after attach when vertical-dependent layout may differ from the first pass.
- Natural height semantics is widget wrapper owned (`.dyni-route-points-html`). Do not mutate `.dyni-surface-html`, `.widgetData.dyni-shell`, or use widget CSS to override shared shell ownership.
- Non-vertical mode resizeSignature may include shell height. Vertical mode resizeSignature must exclude shell height. Vertical-mode signature inputs must be stable and must not be produced by the widget's own intrinsic-height output.
- Whenever a valid selection exists, the selected row must be visible inside `.dyni-route-points-list`. The visibility correction is owned by `RoutePointsDomEffects`, runs through a bounded post-commit pass against the current mounted list, and is scheduled after attach and after rerenders whose committed output may change selected-row visibility. The correction must be idempotent and free of resize-signature churn.
- `domain.isActiveRoute` must be consumed by the renderer as a dedicated wrapper state class (`dyni-route-points-active-route`).
- When a waypoint name is empty after normalization, the visible label must use the zero-based point index string.

### Scope

- Do not change existing `activeRoute` code or tests.
- Do not change `HtmlSurfaceController` internals.
- Do not change `CenterDisplayMath` internals.
- Do not perform source-code changes in the documentation phase.

---

## Implementation Order

### Phase 1 — ViewModel and Mapper Wiring

**Intent:** create the domain normalization layer and connect it through the mapper.

**Dependencies:** none.

#### 1A. Create `cluster/viewmodels/RoutePointsViewModel.js`

Create a UMD module following `ActiveRouteViewModel` as template.

Contract:

- `build(props, toolkit)` returns:
  - `route`: `{ name, points: [{ name, lat, lon }], sourceRoute }` or `null`
  - `selectedIndex`: finite number from `editingIndex` or `-1`
  - `isActiveRoute`: `true` when `editingRoute` is an object, `activeName` is a non-empty string, and `editingRoute.name === activeName`; `false` in all other cases
  - `showLatLon`: boolean from `routeShowLL`
  - `useRhumbLine`: boolean from `useRhumbLine`

Validation:

- `editingRoute` must be an object with an array `points` field; otherwise return `route: null`.
- `editingRoute` with an empty `points` array (`[]`) is a valid empty route; return a route object with `points: []`.
- `route.name` is normalized to the trimmed display string used by the renderer.
- Each point’s `lat`/`lon` is normalized to a finite number or `undefined`.
- Each point’s `name` is trimmed to string. When the trimmed name is empty, the view-model substitutes the zero-based point index as a string (e.g. `"0"`, `"1"`, `"2"`).
- `sourceRoute` keeps the original `editingRoute` object for downstream consumers that need raw route identity.

#### 1B. Add `tests/cluster/viewmodels/RoutePointsViewModel.test.js`

Cover:

- Valid route with multiple points
- Missing `editingRoute` → `route: null`
- `editingRoute` without `points` array → `route: null`
- `editingRoute` with empty `points` array → valid route object with `points: []`
- Points with missing/invalid `lat`/`lon` normalize to `undefined`
- Points with empty or missing names produce the zero-based index string as the visible label
- `editingIndex` normalization (finite, non-finite, missing)
- `isActiveRoute` derivation: `true` when `activeName` is a non-empty string and exactly equals `editingRoute.name`; `false` when names differ; `false` when `activeName` is empty; `false` when `editingRoute` is missing
- `showLatLon` and `useRhumbLine` passthrough

#### 1C. Register `RoutePointsViewModel` in `config/components/registry-cluster.js`

Add component entry:

```javascript
RoutePointsViewModel: {
  js: BASE + "cluster/viewmodels/RoutePointsViewModel.js",
  css: undefined,
  globalKey: "DyniRoutePointsViewModel"
}
```

Add `"RoutePointsViewModel"` to `NavMapper.deps`.

#### 1D. Add `routePoints` branch to `NavMapper.js`

Instantiate the view-model in `create()`:

```javascript
const routePointsViewModel = Helpers.getModule("RoutePointsViewModel").create(def, Helpers);
```

Add branch in `translate()`:

```javascript
if (req === "routePoints") {
  const rpDomain = routePointsViewModel.build(p, toolkit);
  return {
    renderer: "RoutePointsTextHtmlWidget",
    domain: {
      route: rpDomain.route,
      routeName: rpDomain.route ? rpDomain.route.name : "",
      pointCount: rpDomain.route ? rpDomain.route.points.length : 0,
      selectedIndex: rpDomain.selectedIndex,
      isActiveRoute: rpDomain.isActiveRoute,
      showLatLon: rpDomain.showLatLon,
      useRhumbLine: rpDomain.useRhumbLine
    },
    layout: {
      ratioThresholdNormal: num(p.routePointsRatioThresholdNormal),
      ratioThresholdFlat: num(p.routePointsRatioThresholdFlat),
      showHeader: p.showHeader
    },
    formatting: {
      distanceUnit: p.distanceUnit,
      courseUnit: p.courseUnit,
      waypointsText: p.waypointsText
    }
  };
}
```

#### 1E. Add store keys and editable parameters in `config/clusters/nav.js`

Extend the existing `storeKeys` object with:

```javascript
editingRoute: "nav.routeHandler.editingRoute",  
editingIndex: "nav.routeHandler.editingIndex",  
activeName: "nav.routeHandler.activeName",  
useRhumbLine: "nav.routeHandler.useRhumbLine",  
routeShowLL: "properties.routeShowLL"
```

Extend the existing `kind` SELECT list with:

```javascript
opt("Route points list", "routePoints")
```

Add editable parameters scoped with `condition: { kind: "routePoints" }`:

- `routePointsRatioThresholdNormal`: `FLOAT`, min 0.5, max 2.0, step 0.05, default `1.0`, `internal: true`
- `routePointsRatioThresholdFlat`: `FLOAT`, min 1.5, max 6.0, step 0.05, default `3.5`, `internal: true`
- `showHeader`: `BOOLEAN`, default `true`
- `distanceUnit`: `STRING`, default `"nm"`
- `courseUnit`: `STRING`, default `"°"`
- `waypointsText`: `STRING`, default `"waypoints"`

`distanceUnit`, `courseUnit`, and `waypointsText` are standalone routePoints editables in the nav cluster config. They are owned by `config/clusters/nav.js` and passed through the mapper’s `formatting` group. They do not use the `makePerKindTextParams` pattern because they are routePoints-specific display labels, not the per-kind caption/unit contract used by text renderer kinds.

The existing `updateFunction` keeps its current kind-specific behavior for other nav kinds. `routePoints` introduces no additional disconnect/update branch.

#### 1F. Verify `config/shared/kind-defaults.js` requires no changes

No per-kind caption/unit text params are needed for the `routePoints` kind. The routePoints-specific text settings (`distanceUnit`, `courseUnit`, `waypointsText`) are standalone editables owned by the nav cluster config, not `makePerKindTextParams` entries.

#### 1G. Update mapper tests

Extend `tests/cluster/mappers/NavMapper.test.js` (or create if absent) to verify:

- `routePoints` branch returns correct renderer and grouped domain/layout/formatting payload
- Missing `editingRoute` propagates `domain.route: null` through mapper
- Empty `editingRoute.points` array propagates a valid route object with `points: []` and `pointCount: 0` through mapper
- Editable props pass through to correct sub-objects (thresholds in `layout`, unit strings in `formatting`)

**Exit conditions:**

- view-model tests pass
- mapper wiring tests pass
- `npm run check:all` passes

---

### Phase 2 — Layout Owner

**Intent:** create the responsive layout geometry module that owns mode resolution, row rects, header rects, and the `.widgetContainer.vertical` natural height computation.

**Dependencies:** Phase 1 must be complete (the layout module needs to understand the domain shape).

#### 2A. Create `shared/widget-kits/nav/RoutePointsLayout.js`

UMD module. Dependencies: `ResponsiveScaleProfile`, `LayoutRectMath`.

Responsibilities:

- `computeRowHeight(W, H, isVerticalContainer)`: anchor computation per the "Row Height Anchor" concept. For host-sized shells: `computeInsetPx(computeProfile(W, H, spec), ROW_HEIGHT_RATIO, ROW_HEIGHT_MIN_PX)` clamped to `ROW_HEIGHT_MAX_PX`. For `.widgetContainer.vertical`: `computeInsetPx(computeProfile(W, W, spec), ROW_HEIGHT_RATIO, ROW_HEIGHT_MIN_PX)` clamped to `ROW_HEIGHT_MAX_PX` (with tighter clamps). Passing `W` for both dimensions to `computeProfile` forces `minDim = W` when H is unavailable. Single source of truth for the structural anchor.
- `computeInsets(W, H)`: responsive insets (padding, gap, inner spacing) via `ResponsiveScaleProfile`.
- `createContentRect(W, H, insets)`: usable content area after outer padding.
- `computeLayout(args)`: given content rect, mode, showHeader, point count, compute:
  - `rowHeight` via `computeRowHeight`
  - `headerRect` (or `null` if `showHeader === false`) — height derived as `rowHeight × HEADER_HEIGHT_SHARE_{mode}`
  - `listRect`
  - array of `rowRects` (one per point)
  - per-row cell rects: `ordinalRect`, `middleRect` (or `nameRect`/`infoRect` depending on mode), `markerRect`
  - in high mode: middle splits vertically into `nameRect` (top half) and `infoRect` (bottom half)
  - in normal/flat mode: middle area is two horizontal cells `nameRect | infoRect`
- `computeHeaderLayout(headerRect, mode)`: split header into `routeNameRect` and `metaRect` per mode geometry.
- `computeInlineGeometry(args)`: derive the inline structural style values consumed by markup for wrapper, header, list, rows, and cells. This is the only source of structural pixel geometry used by the DOM.
- `computeNaturalHeight(args)`: for `.widgetContainer.vertical`:
  - derive `rowHeight` via `computeRowHeight(W, undefined, true)` (width-only anchor path: `computeProfile(W, W, spec)`)
  - sum: `headerHeight` (if shown, = `rowHeight × HEADER_HEIGHT_SHARE_HIGH`) + `headerGap` (if shown, = `rowHeight × HEADER_GAP_RATIO`) + rowCount × `rowHeight` + max(0, rowCount - 1) × `rowGap` (= `rowHeight × ROW_GAP_RATIO`) + outer padding. Any derived remaining list height, capped list viewport height, or inline geometry height emitted from this computation must be clamped to `>= 0`.
  - cap at `75vh`-equivalent pixel value using `window.innerHeight` as the viewport height source; when `window.innerHeight` is unavailable (e.g., in test environments), use an injected `viewportHeight` parameter passed through the layout API

Layout constants to be defined (following the "Row Height Anchor" strategy in the concept):

Anchor computation:

- `ROW_HEIGHT_RATIO`: ratio parameter for `computeInsetPx(profile, ratio, floor)` that maps anchor dimension → row height. The anchor input is `min(W, H)` for host-sized shells (via `computeProfile(W, H, spec)`), `W` for `.widgetContainer.vertical` (via `computeProfile(W, W, spec)`).
- `ROW_HEIGHT_MIN_PX`: absolute floor clamp for `rowHeight` (prevents microscopic rows in tiny shells).
- `ROW_HEIGHT_MAX_PX`: absolute ceiling clamp for `rowHeight` (prevents oversized rows in large shells).
- For `.widgetContainer.vertical`, tighter clamps should apply (e.g., floor ~22px, ceiling ~48px) since only width is available as anchor input.

Ratios derived from `rowHeight`:

- `HEADER_HEIGHT_SHARE_HIGH`: header height in high mode as a multiple of `rowHeight` (≈ 1.0; header matches row rhythm)
- `HEADER_HEIGHT_SHARE_NORMAL`: header height in normal mode as a multiple of `rowHeight` (≈ 0.6; visually subordinate bar)
- `HEAD_PANEL_WIDTH_RATIO_FLAT`: width share for flat-mode left panel (header panel height equals list height, so no header-height ratio is needed)
- `ROW_GAP_RATIO`: vertical gap between rows as a fraction of `rowHeight`
- `HEADER_GAP_RATIO`: gap between header and list as a fraction of `rowHeight` (high/normal only)
- `ROW_PADDING_RATIO`: inner padding within a row as a fraction of `rowHeight`
- Header name/meta split ratios per mode (50/50 horizontal in normal, 50/50 vertical in high, 50/50 vertical in flat panel)

Implicit from `rowHeight` (not separate constants):

- Ordinal square width = `rowHeight` (square cell)
- Marker square width = `rowHeight` (square cell)

The coding agent should tune exact constant values by calibrating `ROW_HEIGHT_RATIO` and the responsive scale keys against the concept example (42px row height at the reference shell size) and the `ActiveRouteLayout` proportional system. Constants must live in the layout module, not in renderer or CSS.

#### 2B. Add `tests/shared/nav/RoutePointsLayout.test.js`

Cover:

- Row height anchor: `computeProfile(W, H, spec)` path for host-sized shells produces `minDim = min(W, H)`; `computeProfile(W, W, spec)` path for vertical container produces `minDim = W`
- Row height anchor: extreme aspect ratios (very tall narrow shell, very wide flat shell) produce reasonable row heights via `min(W, H)` self-correction
- Row height anchor: absolute clamps prevent microscopic and oversized rows
- Row height anchor: tighter clamps apply in vertical-container mode
- Header height derivation: high mode uses `HEADER_HEIGHT_SHARE_HIGH × rowHeight`, normal mode uses `HEADER_HEIGHT_SHARE_NORMAL × rowHeight`
- Content rect computation for various shell sizes
- High mode: header stacked above list, rows stacked vertically, 3-area row grid, vertical middle split
- Normal mode: header side-by-side, rows in 4-column grid
- Flat mode: left panel + right list, rows in 4-column grid
- `showHeader === false`: no header rect, list gets full height/width
- `.widgetContainer.vertical` natural height computation for various point counts
- Natural height cap at 75vh equivalent
- Inline geometry output for wrapper, header, list, rows, and cells matches the layout rect contract
- Zero-point edge case (valid route with `points: []` — zero rows, header with zero count)
- Single-point edge case

#### 2C. Register `RoutePointsLayout` in `config/components/registry-shared-foundation.js`

```javascript
RoutePointsLayout: {
  js: BASE + "shared/widget-kits/nav/RoutePointsLayout.js",
  css: undefined,
  globalKey: "DyniRoutePointsLayout",
  deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
}
```

**Exit conditions:**

- layout geometry tests pass for all three modes
- vertical height computation tests pass
- showHeader toggle tests pass
- `npm run check:all` passes

---

### Phase 3 — Fit Owner

**Intent:** create the text-fit module that measures and assigns font sizes per text box.

**Dependencies:** Phase 2 must be complete (fit consumes layout rects).

#### 3A. Create `shared/widget-kits/nav/RoutePointsHtmlFit.js`

UMD module. Dependencies: `ThemeResolver`, `RadialTextLayout`, `TextTileLayout`, `RoutePointsLayout`, `HtmlWidgetUtils`.

Responsibilities:

- `compute(args)`: given model, hostContext, targetEl, shellRect, return:
  - `headerFit`: `{ routeNameStyle, metaStyle }` or `null` if no header
  - `rowFits`: array of `{ ordinalStyle, nameStyle, infoStyle }` — one per point
  - Each style is an inline `font-size:Npx;` string or empty string.

Implementation approach:

- Resolve theme tokens (`font.weight`, `font.labelWeight`) from `ThemeResolver`.
- Resolve font family from `Helpers.resolveFontFamily`.
- Create or cache a measurement context (canvas 2D or approximate fallback, same pattern as `ActiveRouteHtmlFit`).
- Use `RoutePointsLayout.computeLayout(...)` to get all box rects.
- For each text box, use `TextTileLayout.measureFittedLine(...)` or `RadialTextLayout.fitSingleTextPx(...)` to compute the fitted font size.
- Convert fitted sizes to inline style strings via `HtmlWidgetUtils.toFiniteNumber` and font-size assembly.

Text fitting must follow the concept rule: each text element is fitted independently against its own box. The font size is reduced only when the text would not fit. If the text fits, it uses the full available box height.

#### 3B. Add `tests/shared/nav/RoutePointsHtmlFit.test.js`

Cover:

- Fit produces style strings for header and each row
- Fit returns null when shellRect or targetEl is missing
- `showHeader === false` produces null headerFit
- Different modes produce different box proportions
- Empty route (zero points) produces empty rowFits array
- Font size scales down for long text
- Font size uses full box height for short text
- **No-trim regression:** for header and row cells, rendered text content equals the full normalized source string; long content is handled by reduced font size, never by text shortening; fit output contains only `font-size` style decisions and no altered text content

#### 3C. Register `RoutePointsHtmlFit` in `config/components/registry-shared-foundation.js`

```javascript
RoutePointsHtmlFit: {
  js: BASE + "shared/widget-kits/nav/RoutePointsHtmlFit.js",
  css: undefined,
  globalKey: "DyniRoutePointsHtmlFit",
  deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "RoutePointsLayout", "HtmlWidgetUtils"]
}
```

**Exit conditions:**

- fit tests pass
- `npm run check:all` passes

---

### Phase 4 — HTML Renderer

**Intent:** create the widget renderer folder that produces the HTML markup string, manages handlers, resize signature, and committed-DOM side effects, split into focused helper modules.

**Dependencies:** Phases 1–3 must be complete.

The renderer is organized as a thin shell plus three standalone helper components. Each helper module is a separately registered UMD component in `config/components/registry-widgets.js`, and the renderer shell depends on them through the normal component-loader path. This keeps the 400-line budget realistic per file while separating pure render-model logic, pure markup assembly, and committed-DOM side effects.

#### 4A. Create `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js` — Renderer Shell

UMD module. Dependencies: `RoutePointsHtmlFit`, `HtmlWidgetUtils`, `RoutePointsRenderModel`, `RoutePointsMarkup`, `RoutePointsDomEffects`.

This file is the thin entrypoint that owns the exported contract surface consumed by `HtmlSurfaceController`:

- `renderHtml(props)` — resolves committed host facts for the current rerender, delegates pure model assembly to `RoutePointsRenderModel`, delegates HTML string assembly with layout-owned inline geometry to `RoutePointsMarkup`, and schedules any required post-commit selected-row visibility work through `RoutePointsDomEffects`
- `namedHandlers(props, hostContext)` — returns handler map when dispatch mode is active
- `resizeSignature(props, hostContext)` — returns the primitive signature string derived from `RoutePointsRenderModel`
- `initFunction` — triggers one corrective rerender after attach
- `wantsHideNativeHead: true`

The shell owns orchestration only. It resolves the committed target from `hostContext.__dyniHostCommitState`, asks `RoutePointsDomEffects` for committed vertical state during corrective rerenders, passes `isVerticalCommitted` into `RoutePointsRenderModel`, passes the final model into `RoutePointsMarkup`, and schedules a bounded post-commit visibility pass whenever the current render requires selected-row enforcement.

If `hostContext.__dyniHostCommitState` is missing, null, stale, or lacks a committed target/root/shell element for the current pass, the renderer must fail closed:

- treat `isVerticalCommitted` as `false`
- skip committed-DOM effects for that pass
- use normal host-sized assumptions for layout
- never throw

Committed host facts are authoritative only when they are present and belong to the current mounted widget instance.

The `initFunction` follows the same pattern as `ActiveRouteTextHtmlWidget`:

```javascript
const initFunction = function () {  
  if (this && typeof this.triggerResize === "function") {  
    this.triggerResize();  
  }  
};
```

This requests the attach-time corrective rerender. The shell also relies on `resizeSignature` to request later corrective rerenders when layout-relevant inputs change, including `selectedIndex`, and pairs those rerenders with bounded post-commit selected-row visibility passes when required.

#### 4B. Create `widgets/text/RoutePointsTextHtmlWidget/RoutePointsRenderModel.js` — Pure Normalization Owner

Standalone UMD component registered in `config/components/registry-widgets.js`. Dependencies: `CenterDisplayMath`, `RoutePointsLayout`, `HtmlWidgetUtils`.

Responsibilities:

- read and normalize all props from the grouped mapper output (`props.domain`, `props.layout`, `props.formatting`)
- consume already-resolved environment inputs from the renderer shell, including:
  - `isVerticalCommitted`
  - `shellRect`
  - `viewportHeight` when needed by layout
- resolve mode from layout thresholds, with `isVerticalCommitted === true` forcing `high`
- compute layout-owned geometry and wrapper height inputs through `RoutePointsLayout`
- compute per-row info strings using `CenterDisplayMath` and `Helpers.applyFormatter`
- resolve interaction flags from host capability inputs supplied by the shell
- derive resize-signature input arrays for vertical and non-vertical modes

`RoutePointsRenderModel` is pure. It has no DOM dependencies, performs no ancestry lookup, performs no scrolling, and does not read `hostContext.__dyniHostCommitState` directly.

**Info cell formatting** (per concept formatter contract):

- `showLatLon === true`: `Helpers.applyFormatter(point, { formatter: "formatLonLats", formatterParameters: [] })`
- `showLatLon === false`, row index `0`: `"---" + courseUnit + "/---" + distanceUnit`
- `showLatLon === false`, row index `>= 1`:
  - `CenterDisplayMath.computeCourseDistance(points[i - 1], points[i], useRhumbLine)` → `{ course, distance }`
  - `course` → `Helpers.applyFormatter(course, { formatter: "formatDirection", formatterParameters: [] })`
  - `distance` → `Helpers.applyFormatter(distance, { formatter: "formatDistance", formatterParameters: [distanceUnit] })`
  - display string: `"{course}{courseUnit}/{distance}{distanceUnit}"`

#### 4C. Create `widgets/text/RoutePointsTextHtmlWidget/RoutePointsMarkup.js` — Pure HTML String Assembly Owner

Standalone UMD component registered in `config/components/registry-widgets.js`.

Responsibilities:

- Build wrapper div with mode/state classes.
- Apply layout-owned inline geometry to the wrapper, header, list, rows, and cells.
- If `model.canActivateRoutePoint`, add `onclick="catchAll"` to wrapper and add `dyni-route-points-dispatch` class; otherwise add `dyni-route-points-passive` class.
- If `model.isActiveRoute`, add `dyni-route-points-active-route` class to wrapper.
- If `showHeader !== false`, render header with route name and `"{N} {waypointsText}"`.
- Render scrollable list container.
- For each point, render a row div with:
  - `data-rp-row="N"` on every row for committed-DOM row lookup.
  - If `model.canActivateRoutePoint`: add `onclick="routePointActivate"` and `data-rp-idx="N"` (zero-based index).
  - Ordinal cell (1-based index).
  - Waypoint name cell (uses point name or, when the name is empty, the zero-based point index string).
  - Info cell (lat/lon or course/distance per concept rules).
  - Marker cell (round marker, with selected-state class when index matches `selectedIndex`).
- Apply inline fit styles to all text elements.
- Apply inline structural styles generated from the layout result.
- All text content escaped via `htmlUtils.escapeHtml`.

This module is pure: it takes a render model and fit styles as input and returns an HTML string. It has no DOM dependencies and no side effects.

#### 4D. Create `widgets/text/RoutePointsTextHtmlWidget/RoutePointsDomEffects.js` — Committed-DOM Owner

Standalone UMD component registered in `config/components/registry-widgets.js`.

Responsibilities:

- `isVerticalContainer(targetEl)` returns `true` when the committed target element is inside `.widgetContainer.vertical`

- `ensureSelectedRowVisible(listEl, selectedIndex)` inspects row `[data-rp-row="N"]` relative to `.dyni-route-points-list` and adjusts `scrollTop` only when the row is outside the visible viewport

- `scheduleSelectedRowVisibility(args)` schedules a bounded deferred probe keyed to the current widget instance, resolves the newly mounted `.dyni-route-points-list`, and calls `ensureSelectedRowVisible(...)` against the current DOM

**Stale-drop contract for deferred visibility passes:**

`scheduleSelectedRowVisibility(args)` must associate the scheduled pass with both:

- the current widget instance key, and
- a monotonic render token or committed-root identity for the currently mounted output

When the deferred pass executes, it must abort without DOM mutation if:

- the widget has been detached,
- the mounted root/list no longer matches the scheduled target,
- or a newer scheduled pass has superseded it.

Only the latest still-current pass may mutate `scrollTop`.

- `applyCommittedEffects(args)` accepts the committed shell target, resolves vertical-container state for attach-time correction and later normal updates, and returns the committed facts consumed by the renderer shell

This module owns committed-DOM work only. It does not own resize-signature computation, markup generation, natural-height math, or render-model assembly.

**Lifecycle contract:**

`RoutePointsDomEffects` serves two timing paths owned by the renderer shell.

1. Corrective-rerender vertical-state path:
   
   - the renderer shell resolves the committed target from `hostContext.__dyniHostCommitState`
   - the shell calls `applyCommittedEffects(...)`
   - `applyCommittedEffects(...)` returns `isVerticalCommitted` for `RoutePointsRenderModel`

2. Post-commit selected-row visibility path:
   
   - attach-time and selection-change rerenders that may affect selected-row visibility schedule `scheduleSelectedRowVisibility(...)`
   - the scheduled pass resolves the current mounted list for the widget instance after commit
   - the scheduled pass applies `ensureSelectedRowVisible(...)` to the current DOM only when a valid selected row exists

The deferred visibility path must be bounded, stale-safe, idempotent, and free of resize-signature side effects.

**`resizeSignature(props)`** (owned by renderer shell, inputs derived by `RoutePointsRenderModel`):

The resize signature uses two contracts depending on committed vertical state.

Non-vertical mode signature inputs:

- `pointCount`

- `mode`

- `showHeader` flag

- `showLatLon` flag

- `selectedIndex`

- `canActivateRoutePoint` flag

- rounded shell width

- rounded shell height

- `isVerticalCommitted` flag

Vertical mode signature inputs:

- `isVerticalCommitted` flag

- rounded shell width

- `pointCount`

- `showHeader` flag

- `showLatLon` flag

- `selectedIndex`

- `canActivateRoutePoint` flag

Vertical-mode signature inputs must remain stable and must not depend on the widget’s own intrinsic-height output.

**Natural height ownership in `.widgetContainer.vertical`:**

Natural height is owned by `.dyni-route-points-html`. The renderer shell applies the computed inline height only when `isVerticalCommitted === true` during attach-time correction or a later normal update.

#### 4E. Create `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css`

Widget-local CSS must define:

- `.dyni-route-points-html` base visual block and state styling.
- `.dyni-route-points-list`: scrollable container (`overflow-y: auto` when content exceeds available height).
- `.dyni-route-points-row-selected`: selected waypoint highlight.
- `.dyni-route-points-ordinal`: centered text presentation.
- `.dyni-route-points-marker`: round marker presentation.
- `.dyni-route-points-marker-selected`: selected marker state.
- Font weight variables from theme tokens (`--dyni-font-weight`, `--dyni-label-weight`).
- `white-space: nowrap` on all text cells (per concept).
- `overflow: hidden` on text cells (text fitted by JS, never ellipsis).
- `.dyni-route-points-dispatch`: interactive mode state class — `cursor: pointer` on rows.
- `.dyni-route-points-passive`: passive mode state class — no cursor/interaction styling on rows.
- `.dyni-route-points-active-route`: active-route state class — applied when the editing route matches the active route.

Structural geometry is layout-owned and arrives through inline styles emitted by `RoutePointsMarkup`. CSS must not redefine header ratios, row heights, row gaps, panel widths, or cell track sizes.

CSS specificity must follow the existing `ActiveRouteTextHtmlWidget.css` pattern:

```css
.widget.dyniplugin .widgetData.dyni-shell .dyni-route-points-html { ... }
```

Vertical-container override:

```css
.widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-route-points-html {
  height: auto;
  /* natural height applied as inline style on .dyni-route-points-html by renderer */
}
```

The renderer applies the computed natural height as an inline style on the `.dyni-route-points-html` wrapper element. The CSS `height: auto` allows the inline style to take effect. Shell and surface elements are never mutated by the widget.

#### 4F. Register helper components and renderer shell in `config/components/registry-widgets.js`

Each component registry entry must keep the standard single-`js` shape consumed by `runtime/component-loader.js`. Register the split renderer as four standalone UMD components:

```javascript
RoutePointsRenderModel: {
  js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsRenderModel.js",
  css: undefined,
  globalKey: "DyniRoutePointsRenderModel",
  deps: ["CenterDisplayMath", "RoutePointsLayout", "HtmlWidgetUtils"]
},
RoutePointsMarkup: {
  js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsMarkup.js",
  css: undefined,
  globalKey: "DyniRoutePointsMarkup"
},
RoutePointsDomEffects: {
  js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsDomEffects.js",
  css: undefined,
  globalKey: "DyniRoutePointsDomEffects"
},
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

The renderer shell resolves the helper components via `Helpers.getModule(...)` inside `create(def, Helpers)`. `ClusterRendererRouter` continues to depend only on `RoutePointsTextHtmlWidget`; the shell-level dependency chain loads the helper components before the shell is created.

#### 4G. Add kind catalog tuple in `ClusterKindCatalog.js`

```javascript
{ cluster: "nav", kind: "routePoints", viewModelId: "RoutePointsViewModel", rendererId: "RoutePointsTextHtmlWidget", surface: "html" }
```

#### 4H. Add renderer to `ClusterRendererRouter.js` inventory

In `rendererSpecs`:

```javascript
RoutePointsTextHtmlWidget: Helpers.getModule("RoutePointsTextHtmlWidget").create(def, Helpers)
```

Add `"RoutePointsTextHtmlWidget"` to `ClusterRendererRouter.deps` in `config/components/registry-cluster.js`.

#### 4I. Add `tests/cluster/rendering/RoutePointsTextHtmlWidget.test.js`

Required test matrix (per `add-new-html-kind.md` Step 7). Each nontrivial test class is tied to its implementation owner:

| Area                          | Required checks                                                                                                                                                                                                                                                                                                                                                                                                    | Implementation owner                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Surface lifecycle             | attach/update/detach/destroy ownership and stale-handler cleanup                                                                                                                                                                                                                                                                                                                                                   | `RoutePointsTextHtmlWidget` (shell) via `HtmlSurfaceController`                        |
| Info formatting               | lat/lon mode uses `formatLonLats` and preserves its placeholder output for invalid coordinates; course/distance mode uses `computeCourseDistance` + `formatDirection` + `formatDistance` for valid segments; row `0` and invalid segments use the configured placeholder pattern                                                                                                                                   | `RoutePointsRenderModel`                                                               |
| Resize contract               | signature changes on layout-relevant inputs; stable when irrelevant fields do not change                                                                                                                                                                                                                                                                                                                           | `RoutePointsTextHtmlWidget` (shell), inputs from `RoutePointsRenderModel`              |
| Class/state rendering         | mode classes (`high`/`normal`/`flat`), header present/absent, selected row class                                                                                                                                                                                                                                                                                                                                   | `RoutePointsMarkup`                                                                    |
| Row rendering                 | correct ordinal, name (or zero-based index fallback for empty names), info per `showLatLon` toggle, marker presence                                                                                                                                                                                                                                                                                                | `RoutePointsMarkup`                                                                    |
| Escaping + fail-closed        | escaped output for all text; `route: null` renders as an empty wrapper with mode classes, no header content, and no list rows (no throw)                                                                                                                                                                                                                                                                           | `RoutePointsMarkup`                                                                    |
| No-trim regression            | for header and row cells, rendered text content equals the full normalized source string; long content is handled by reduced font size, never by text shortening                                                                                                                                                                                                                                                   | `RoutePointsHtmlFit` + `RoutePointsMarkup`                                             |
| isActiveRoute rendering       | wrapper gets `dyni-route-points-active-route` class when `isActiveRoute === true`; class absent when `isActiveRoute === false`                                                                                                                                                                                                                                                                                     | `RoutePointsMarkup`                                                                    |
| Selected-row visibility       | attach-time and selection-change post-commit visibility passes scroll an offscreen selected row into view on the newly mounted list; invalid or absent selection is a no-op; already visible selection produces no scroll mutation; repeated passes with the same visible selection remain stable; stale scheduled passes are dropped; no resize-signature churn or rerender loop is caused by the visibility pass | `RoutePointsDomEffects.scheduleSelectedRowVisibility` + `ensureSelectedRowVisible`     |
| Vertical behavior             | committed vertical-container detection forces `high` mode; natural height is computed on the wrapper; list scrolls when capped                                                                                                                                                                                                                                                                                     | `RoutePointsDomEffects.isVerticalContainer` + `RoutePointsLayout.computeNaturalHeight` |
| Initial mount                 | initial host render uses host-sized assumptions and performs no committed-DOM work                                                                                                                                                                                                                                                                                                                                 | renderer shell + `RoutePointsRenderModel`                                              |
| Attach-time correction        | initFunction().triggerResize() requests the corrective rerender; committed vertical detection applies forced high mode and wrapper-owned natural height during that rerender                                                                                                                                                                                                                                       | shell + `RoutePointsDomEffects`                                                        |
| Selection-change visibility   | a changed selectedIndex updates the resize signature, requests a rerender when needed, and schedules a post-commit visibility pass for the current mounted list                                                                                                                                                                                                                                                    | renderer shell + `RoutePointsDomEffects`                                               |
| Signature stability           | self-induced wrapper height changes do not destabilize the vertical-mode resize signature                                                                                                                                                                                                                                                                                                                          | renderer shell                                                                         |
| Corrective rerender           | post-attach `initFunction().triggerResize()` triggers corrective rerender; authoritative vertical detection applies forced high mode and natural height on corrective pass                                                                                                                                                                                                                                         | `RoutePointsTextHtmlWidget` (shell) + `RoutePointsDomEffects`                          |
| No rerender loop              | no repeated corrective rerender loop from self-induced height changes; vertical-mode resizeSignature stays stable when shell height changes only because the widget changed its own wrapper height                                                                                                                                                                                                                 | `RoutePointsTextHtmlWidget` (shell) resize-signature contract                          |
| `showHeader === false`        | header absent, list fills widget                                                                                                                                                                                                                                                                                                                                                                                   | `RoutePointsMarkup` + `RoutePointsLayout`                                              |
| Zero-point route              | valid route with `points: []` renders as an empty list; header shows zero count if shown; participates in vertical sizing and passive display rules; no throw                                                                                                                                                                                                                                                      | `RoutePointsMarkup` + `RoutePointsRenderModel`                                         |
| Dispatch mode (editroutepage) | `canActivateRoutePoint` returns `true`; wrapper has `onclick="catchAll"` and `dyni-route-points-dispatch` class; rows have `onclick="routePointActivate"` and `data-rp-idx` attributes; `namedHandlers` returns `routePointActivate` function; handler calls `hostActions.routePoints.activate(index)` with correct index                                                                                          | `RoutePointsTextHtmlWidget` (shell) + `RoutePointsRenderModel`                         |
| Passive mode (other pages)    | `canActivateRoutePoint` returns `false` when `routeEditor.openEditRoute !== "dispatch"`; wrapper has no `onclick`; wrapper has `dyni-route-points-passive` class; rows have no `onclick` or `data-rp-idx`; `namedHandlers` returns `{}`                                                                                                                                                                            | `RoutePointsTextHtmlWidget` (shell) + `RoutePointsRenderModel`                         |
| Passive mode (gpspage)        | Even though `routePoints.activate === "dispatch"` on gpspage, `routeEditor.openEditRoute === "unsupported"` blocks activation; widget is passive                                                                                                                                                                                                                                                                   | `RoutePointsRenderModel`                                                               |
| Passive mode (layout editing) | `isEditingMode === true` forces passive; no handlers, no `catchAll`                                                                                                                                                                                                                                                                                                                                                | `RoutePointsRenderModel`                                                               |
| Handler edge cases            | `routePointActivate` with missing `data-rp-idx`, invalid index, click on non-row area → returns `false` without calling `activate`; negative index rejected                                                                                                                                                                                                                                                        | `RoutePointsTextHtmlWidget` (shell)                                                    |

Additional focused unit tests for internal helpers:

| Test file                                                | Coverage target                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/cluster/rendering/RoutePointsRenderModel.test.js` | Pure render-model assembly: prop normalization, mode resolution, info string computation for valid segments, placeholder handling for invalid coordinates and invalid segments, interaction flag derivation, resize-signature inputs                                                                                                                                                      |
| `tests/cluster/rendering/RoutePointsMarkup.test.js`      | Pure markup assembly: wrapper classes, header markup, row markup, state classes, fit-style application, layout-owned inline geometry application, escaped text, no-trim regression                                                                                                                                                                                                        |
| `tests/cluster/rendering/RoutePointsDomEffects.test.js`  | Committed-DOM effects: vertical ancestry lookup, bounded post-commit visibility scheduling, scroll-into-view correction on the current mounted list, idempotent no-op for already-visible or invalid selection, no resize-signature side effects, stale scheduled visibility passes are dropped when the widget detaches, remounts, or a newer render token supersedes the scheduled pass |

**Exit conditions:**

- renderer shell tests pass

- internal helper unit tests pass

- kind catalog + router wiring pass

- `npm run check:all` passes
  
  ### Phase 5 — Update Documentation

**Intent:** document the new kind following existing conventions.

**Dependencies:** all code phases complete.

**Scope boundary:** documentation only.

#### 5A. Create `documentation/widgets/route-points.md`

Following the `active-route.md` template, document:

- Overview: renderer tuple, domain ownership, module registration
- Props table
- Visual contract: CSS state classes (including `dyni-route-points-active-route`), element class contract, layering and click ownership
- Layout modes: mode selection, mode matrix, geometry per mode
- Layout constants (owner: `RoutePointsLayout`)
- Text-fit constants (owner: `RoutePointsHtmlFit`)
- Formatter contract: source keys, per-row formatting rules, course/distance computation
- Waypoint name fallback: empty names display zero-based point index string
- Selected-row visibility: committed-DOM execution contract for scroll-into-view
- `.widgetContainer.vertical` behavior
- `showHeader` behavior
- `isActiveRoute` rendering contract: wrapper state class `dyni-route-points-active-route`
- Resize signature contract
- Interaction contract: page-aware dispatch/passive modes, capability gate, named handler, bridge limitations
- Visual regression checklist

#### 5B. Update `documentation/architecture/cluster-widget-system.md`

Add:

- `RoutePointsTextHtmlWidget` to the shipped HTML kinds note.
- `RoutePointsViewModel` to the viewmodel modules section.
- `nav/routePoints` to the native HTML tuple list.

#### 5C. Update `documentation/TABLEOFCONTENTS.md`

Add entries:

- `"How does the RoutePoints HTML renderer work?"` → `widgets/route-points.md`
- `"What is the RoutePoints layout and fit contract?"` → `widgets/route-points.md`
- `"How does the .widgetContainer.vertical height work for routePoints?"` → `widgets/route-points.md`
- `"How does RoutePoints row click interaction work (page-aware dispatch)?"` → `widgets/route-points.md#interaction-contract`

#### 5D. Update `documentation/guides/add-new-html-kind.md` if needed

If any pattern discovered during implementation generalizes (e.g., vertical height detection pattern, list-type HTML widget conventions), add a note or reference.

#### 5E. Update `documentation/QUALITY.md` and `documentation/TECH-DEBT.md`

Record:

- Bridge limitation: `hostActions.routePoints.activate(index)` selects the waypoint in the editing route but map centering depends on whether the `avnav.api.routePoints.activate` relay triggers `MapHolder.setCenter` internally. If it does not, waypoint selection works but map does not re-center. Tag: `dyni-workaround(avnav-plugin-actions) -- routePoints map centering depends on core relay behavior`.
- Bridge limitation: Double-click `WaypointDialog` open is core-page-owned (`EditRoutePage.widgetClick` local state) and is not replicable from the plugin. Tag: `dyni-workaround(avnav-plugin-actions) -- WaypointDialog is page-local React state`.
- Any known limitations of the vertical height detection approach.

#### 5F. Update `ROADMAP.md` if applicable

Mark `routePoints` as implemented.

**Exit conditions:**

- documentation links resolve
- `npm run docs:check` passes
- docs match implemented behavior

---

## Affected File Map

| File                                                                   | Likely phase | Planned change                                                                                           |
| ---------------------------------------------------------------------- | ------------:| -------------------------------------------------------------------------------------------------------- |
| `cluster/viewmodels/RoutePointsViewModel.js`                           | 1            | Create new viewmodel                                                                                     |
| `tests/cluster/viewmodels/RoutePointsViewModel.test.js`                | 1            | Create viewmodel tests                                                                                   |
| `cluster/mappers/NavMapper.js`                                         | 1            | Add `routePoints` translate branch                                                                       |
| `config/clusters/nav.js`                                               | 1            | Add store keys, kind option, editables                                                                   |
| `config/shared/kind-defaults.js`                                       | 1            | No routePoints entries needed; routePoints text settings are standalone editables in nav.js              |
| `config/components/registry-cluster.js`                                | 1, 4         | Register RoutePointsViewModel; add RoutePointsTextHtmlWidget to ClusterRendererRouter.deps               |
| `tests/cluster/mappers/NavMapper.test.js`                              | 1            | Add routePoints mapper tests                                                                             |
| `shared/widget-kits/nav/RoutePointsLayout.js`                          | 2            | Create layout owner                                                                                      |
| `tests/shared/nav/RoutePointsLayout.test.js`                           | 2            | Create layout tests                                                                                      |
| `config/components/registry-shared-foundation.js`                      | 2, 3         | Register RoutePointsLayout, RoutePointsHtmlFit                                                           |
| `shared/widget-kits/nav/RoutePointsHtmlFit.js`                         | 3            | Create fit owner                                                                                         |
| `tests/shared/nav/RoutePointsHtmlFit.test.js`                          | 3            | Create fit tests                                                                                         |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js`  | 4            | Create renderer shell                                                                                    |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsRenderModel.js`     | 4            | Create render-model owner                                                                                |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsMarkup.js`          | 4            | Create markup owner                                                                                      |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsDomEffects.js`      | 4            | Create committed-DOM effects owner                                                                       |
| `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css` | 4            | Create widget CSS                                                                                        |
| `config/components/registry-widgets.js`                                | 4            | Register RoutePointsRenderModel, RoutePointsMarkup, RoutePointsDomEffects, and RoutePointsTextHtmlWidget |
| `cluster/rendering/ClusterKindCatalog.js`                              | 4            | Add `nav/routePoints` tuple                                                                              |
| `cluster/rendering/ClusterRendererRouter.js`                           | 4            | Add renderer to inventory                                                                                |
| `tests/cluster/rendering/RoutePointsTextHtmlWidget.test.js`            | 4            | Create renderer integration tests                                                                        |
| `tests/cluster/rendering/RoutePointsRenderModel.test.js`               | 4            | Create render-model unit tests                                                                           |
| `tests/cluster/rendering/RoutePointsMarkup.test.js`                    | 4            | Create markup unit tests                                                                                 |
| `tests/cluster/rendering/RoutePointsDomEffects.test.js`                | 4            | Create DOM effects unit tests                                                                            |
| `tests/config/components.test.js`                                      | 1, 2, 3, 4   | Update expected dependency arrays                                                                        |
| `documentation/widgets/route-points.md`                                | 5            | Create widget docs                                                                                       |
| `documentation/architecture/cluster-widget-system.md`                  | 5            | Add routePoints references                                                                               |
| `documentation/TABLEOFCONTENTS.md`                                     | 5            | Add new doc entries                                                                                      |
| `documentation/QUALITY.md`                                             | 5            | Update quality status                                                                                    |
| `documentation/TECH-DEBT.md`                                           | 5            | Record deferred work                                                                                     |

---

## Don'ts

- Do not change the AvNav registration model.
- Do not introduce ES modules or a build step.
- Do not change `HtmlSurfaceController` internals.
- Do not change `CenterDisplayMath` internals.
- Do not change `TemporaryHostActionBridge` internals (use its existing `routePoints.activate` and `getCapabilities` APIs).
- Do not change existing `activeRoute` code or its tests.
- Do not duplicate `HtmlWidgetUtils`, `CenterDisplayMath`, `ResponsiveScaleProfile`, or other shared helpers.
- Do not use ellipsis for text overflow (concept requires scale-to-fit).
- Do not enable row click interaction on any page other than `editroutepage` (passive on `navpage`, `gpspage`, and all other pages).
- Do not attempt to replicate core-owned behaviors like `MapHolder.setCenter` or `WaypointDialog` from the plugin side.
- Do not use `data-dyni-*` attributes for state that should be expressed as CSS classes.
- Do not hardcode runtime defaults already owned by config/editable-parameter boundaries.
- Do not exceed the 400-line file-size budget.
- Do not use the documentation phase to sneak in source changes.
- Do not treat `avnav.api.routePoints` as a stable plugin API; all usage must be guarded and tagged with `// dyni-workaround(avnav-plugin-actions)`.
- Do not mutate `.dyni-surface-html`, `.widgetData.dyni-shell`, or shared shell fill rules for natural height injection; natural height is widget wrapper owned (`.dyni-route-points-html`).
- Do not include shell height in the resizeSignature when in vertical mode; it is a self-induced input.
- Do not omit selected-row visibility enforcement; when a valid selection exists, the selected row must be visible inside `.dyni-route-points-list` after the post-commit pass that follows attach and after later post-commit passes scheduled for updates that change `selectedIndex`.
- Do not leave `domain.isActiveRoute` without a rendering consumer; the renderer must apply `dyni-route-points-active-route` as a wrapper state class.
- Do not leave empty waypoint names without a deterministic fallback; use the zero-based point index string.
- Do not add routePoints text settings (`distanceUnit`, `courseUnit`, `waypointsText`) to `config/shared/kind-defaults.js`; they are standalone editables owned by `config/clusters/nav.js`.
- Do not treat vertical detection, natural-height ownership target, first-pass fallback behavior, or post-commit correction behavior as implementation choices; these are explicit plan contracts.
- Do not return `catchAll` from `namedHandlers()`; `catchAll` is host-owned and must only be referenced from markup when dispatch mode is active.

---

## Deployment Boundaries

| Deployable unit                                        | Phases | Notes                                                                                         |
| ------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------- |
| ViewModel + mapper wiring + config                     | 1      | Additive; no existing behavior changes                                                        |
| Layout geometry module                                 | 2      | Additive shared module; no existing consumers                                                 |
| Text-fit module                                        | 3      | Additive shared module; depends on layout                                                     |
| HTML renderer shell + helpers + CSS + catalog + router | 4      | User-visible new widget kind; renderer split into shell + render-model + markup + DOM effects |
| Documentation                                          | 5      | After code phases only                                                                        |

---

## Acceptance Criteria

### ViewModel and mapper

- `RoutePointsViewModel.build()` correctly normalizes valid and invalid route objects.
- `RoutePointsViewModel.build()` returns a valid route object with `points: []` when `editingRoute.points` is an empty array.
- `RoutePointsViewModel.build()` derives `isActiveRoute` from exact core route-name equality against a non-empty `activeName`.
- `NavMapper.translate()` returns a grouped renderer payload for `routePoints` kind with `domain`, `layout`, and `formatting` sub-objects.
- Missing/invalid `editingRoute` (missing, not an object, or `points` is not an array) propagates `domain.route: null` without throwing.

### Layout

- `RoutePointsLayout.computeRowHeight()` uses `computeProfile(W, H, spec)` (anchor = `min(W, H)`) for host-sized shells and `computeProfile(W, W, spec)` (anchor = `W`) for vertical-container shells, with `computeInsetPx` for floor clamp and external ceiling clamp.
- Row height stays reasonable at extreme aspect ratios (very narrow, very wide).
- Header height in high and normal mode is a defined ratio of `rowHeight`.
- `RoutePointsLayout.computeLayout()` produces correct rects for all three modes.
- `RoutePointsLayout.computeInlineGeometry()` produces the structural inline style values consumed by the DOM.
- Row rects follow the concept geometry (ordinal square, middle split, marker square).
- Header rects follow mode-specific split rules.
- `showHeader === false` removes header rects and gives list full dimensions.
- `.widgetContainer.vertical` natural height is computed correctly and capped at 75vh.
- Zero-point routes never subtract a row gap from natural height; all derived list/wrapper heights remain non-negative.

### Fit

- `RoutePointsHtmlFit.compute()` produces inline font-size styles for all text boxes.
- Text is scaled down only when it exceeds its box; otherwise uses full box height.
- Missing shell rect or target element returns null gracefully.
- `RoutePointsHtmlFit` returns font-size decisions only; the rendered text for all cells equals the full normalized source string. No fit helper alters, trims, substitutes, abbreviates, or ellipsizes visible text.

#### Renderer

- `selectedIndex` participates in `resizeSignature`, so selection changes request a corrective rerender through the existing HTML-surface resize path.
- Whenever a valid selection exists, the selected row is visible inside `.dyni-route-points-list` after the attach-time post-commit visibility pass and after any later post-commit visibility pass scheduled for a changed `selectedIndex`.
- Missing, invalid, or out-of-range selection produces no scroll mutation.
- Already visible selection produces no scroll mutation.
- The selected-row visibility correction is idempotent, stale-safe, and free of resize-signature churn.
- The initial host render uses host-sized assumptions and performs no committed-DOM work.
- `initFunction().triggerResize()` requests the attach-time corrective rerender.
- Corrective rerenders and later normal updates resolve committed container facts from `hostContext.__dyniHostCommitState`.
- Committed `.widgetContainer.vertical` detection applies forced `high` mode and wrapper-owned natural height injection when the committed target is inside `.widgetContainer.vertical`.
- Natural height is applied as inline style on `.dyni-route-points-html`; shell and surface elements are never mutated.
- Selected-row visibility is enforced through a bounded post-commit DOM pass that targets the current mounted list for the widget instance.
- In lat/lon mode, rows with invalid coordinates render the formatter placeholder output.
- In course/distance mode, row `0` and any row whose segment endpoints are invalid render the configured placeholder pattern.
- No repeated corrective rerender loop occurs from self-induced height changes.
- Missing or incomplete committed host facts produce a no-throw fallback to non-vertical host-sized rendering and skip committed-DOM effects for that pass.

### Interaction parity

- The renderer uses a page-aware passive-by-default handler-registration model: `namedHandlers` returns `{}` by default and registers `routePointActivate` only on `editroutepage`.
- On `editroutepage`: `canActivateRoutePoint` returns `true`; wrapper has `catchAll`; rows have `routePointActivate` handler and `data-rp-idx` attributes; clicking a row calls `hostActions.routePoints.activate(index)` with the correct zero-based index.
- On `gpspage`: `canActivateRoutePoint` returns `false` (blocked by `routeEditor.openEditRoute !== "dispatch"`); widget is passive; no `catchAll`, no row handlers.
- On `navpage`: `canActivateRoutePoint` returns `false`; widget is passive.
- On unknown/other pages: `canActivateRoutePoint` returns `false`; widget is passive.
- In layout editing mode: `canActivateRoutePoint` returns `false`; widget is passive; host click chain (edit dialog) works unchanged.
- `namedHandlers` returns `{ routePointActivate: fn }` only when dispatch is active, `{}` otherwise.
- `routePointActivate` handler safely ignores clicks on non-row areas and invalid indices.
- On `editroutepage`: wrapper has `onclick="catchAll"` in markup, but `namedHandlers()` returns only `{ routePointActivate: fn }` and never `catchAll`.

### Kind catalog and router

- `nav/routePoints` resolves to `surface: "html"` and `rendererId: "RoutePointsTextHtmlWidget"`.
- Router creates and manages HTML surface controller for the new kind.

### Documentation

- `documentation/widgets/route-points.md` exists and covers all visual/behavioral contracts.
- `TABLEOFCONTENTS.md` links resolve.
- Architecture docs reference the new kind.
- Any deferred work is tracked explicitly.

### Quality gate

- `npm run check:all` passes (includes `check:core`, coverage threshold, `perf:check`).
- All new files are within the 400-line budget.
- No new smell-rule violations.

---

## Related

- [PLAN1.md](PLAN1.md) — original `renderHtml` architecture plan
- [PLAN4.md](PLAN4.md) — runtime/theme lifecycle cleanup (shared utility context)
- [core-principles.md](../../documentation/core-principles.md) — architectural principles
- [coding-standards.md](../../documentation/conventions/coding-standards.md) — UMD templates and file-size rules
- [smell-prevention.md](../../documentation/conventions/smell-prevention.md) — duplication and suppression guidance
- [active-route.md](../../documentation/widgets/active-route.md) — canonical HTML-kind reference
- [add-new-html-kind.md](../../documentation/guides/add-new-html-kind.md) — HTML kind authoring workflow
- [cluster-widget-system.md](../../documentation/architecture/cluster-widget-system.md) — cluster routing architecture
- [core-formatter-catalog.md](../../documentation/avnav-api/core-formatter-catalog.md) — formatter signatures
- [interactive-widgets.md](../../documentation/avnav-api/interactive-widgets.md) — click ownership patterns
