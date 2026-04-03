# PLAN7 — Edit Route Summary Widget (`nav/editRoute`)

## Status

Written after repository verification and code-trace review of both the core AvNav route-editor flow and the dyninstruments HTML-widget architecture.

This plan is code-grounded against the verified sources named in the request. It keeps the same structure and rigor level as `exec-plans/completed/PLAN6.md`, but adapts it to the `nav/editRoute` summary widget. The plan explicitly separates three concerns that the code already separates:

1. **core widget summary behavior** (`viewer/components/EditRouteWidget.jsx`)
2. **core route-editor / dialog workflow** (`viewer/gui/EditRoutePage.jsx`, `viewer/nav/routeeditor.js`)
3. **dyn host-bridge dispatch constraints** (`runtime/TemporaryHostActionBridge.js`, `documentation/avnav-api/interactive-widgets.md`)

The coding agent may choose equivalent rendering mechanics where appropriate, but the layout topology, state rules, interaction contract, data contract, parity split, and documentation/test outcomes below are explicit plan contracts.

---

## Goal

Add a new native HTML kind `editRoute` to the `nav` cluster that reproduces the **core EditRoute widget’s summary role and workflow-entry role** at native dyninstruments quality, while keeping all real editing workflow in the host route-editor page/dialog flow.

Expected outcomes after completion:

* A new `EditRouteTextHtmlWidget` renders a compact editing-route summary based on the **editing route**, not the active-route store.
* The widget preserves the core data model:

  * route display name
  * point count
  * total route distance
  * remaining distance and ETA only at the same density level where core shows them
  * active-route state based on exact route-name equality
  * local/server route-source state matching core `route.isServer()` semantics
  * `No Route` state when no editing route is available
* The core horizontal vs non-horizontal density split is preserved through dyn mode mapping:

  * `flat` = core horizontal-equivalent density
  * `normal` and `high` = core non-horizontal-equivalent density
  * `.widgetContainer.vertical` forces `high`
* The widget remains a **summary/workflow-entry widget only**. It does **not** embed buttons, per-field controls, point editing, rename, load/save, delete, stop-nav, or waypoint editing.
* Clicking the widget opens the host edit-route workflow **only** when the host bridge reports `routeEditor.openEditRoute === "dispatch"`; today that is `editroutepage` only.
* On `navpage`, `gpspage`, and all unsupported/passive contexts, the widget stays passive and does not steal clicks.
* In layout-editing mode, the widget is always passive.
* Native HTML implementation follows the same architectural layering already used for `activeRoute` and `routePoints`: viewmodel → mapper → kind catalog/router → HTML shell → shared layout/fit/render-model/markup helpers.
* Documentation and regression coverage make the parity boundary explicit: **widget parity** is required, but **page/dialog workflow parity** remains host-owned.

---

## Verified Baseline

The following points were rechecked against the repositories before this plan was written.

1. **Core `EditRouteWidget` is a summary widget, not an inline editor.**
   `viewer/components/EditRouteWidget.jsx` creates `const editor = new RouteEdit(RouteEdit.MODES.EDIT);` and renders only summary fields inside `WidgetFrame`. It does not define its own click handler.

2. **Core `EditRouteWidget` reads the editing route, not the active-route leg.**
   `EditRouteWidget.storeKeys = editor.getStoreKeys(...)` and `RouteEdit.MODES.EDIT` in `viewer/nav/routeeditor.js` bind to:

   * `nav.routeHandler.editingRoute`
   * `nav.routeHandler.editingIndex`
   * `nav.routeHandler.activeName`
   * `nav.routeHandler.useRhumbLine`

3. **Core active-state derivation is exact route-name equality.**
   In `viewer/nav/routeeditor.js`, the helper `isActive(route, activeName)` returns `route.name === activeName`. `StateHelper.getRouteIndexFlag(state)` uses that rule for both route-editor and leg-based states.

4. **Core widget display fields are exactly:**

   * `route.displayName()`
   * `route.points.length`
   * `route.computeLength(0, props.useRhumbLine)`
   * `props.remain` only when the editing route is active
   * `props.eta` only when the editing route is active
     This is all in `viewer/components/EditRouteWidget.jsx`.

5. **Core density split is only horizontal vs non-horizontal.**
   `EditRouteWidget.jsx` renders `RTG` and `ETA` only when `props.mode !== "horizontal"`. There is no separate core field contract for “high” vs “normal”.

6. **Core vertical container does not add new data; it only changes sizing.**
   In `viewer/style/widgets.less`, `.editRouteWidget` has `.vertical & { min-height: 8em; }`. No extra vertical-only fields are introduced.

7. **Core active-route visual is a widget class/border state.**
   `EditRouteWidget.jsx` appends `" activeRoute "` when active; CSS in `viewer/style/widgets.less` gives `.editRouteWidget.activeRoute` an attention border.

8. **Core local/server state is expressed through `WidgetFrame.disconnect`, but the meaning is route-source, not network transport.**
   `EditRouteWidget.jsx` passes `disconnect={!route.isServer()}`.
   `viewer/components/WidgetBase.jsx` renders the disconnected icon in the header when `disconnect === true`.
   `viewer/nav/routeobjects.js` defines:

   * `LOCAL_PREFIX = "local@"`
   * `Route.displayName()` strips that prefix
   * `Route.isServer()` is based on `isServerName(name)`
     Therefore, for this widget, the “disconnect” icon is really a **local/non-server route marker**.

9. **Core widget does not compute writable/disconnected editability.**
   Editability is determined elsewhere. `RouteEdit.isRouteWritable()` in `viewer/nav/routeeditor.js` checks `route.isServer()` plus `keys.properties.connectedMode`. `EditRouteWidget.jsx` itself does not read `connectedMode`.

10. **Core edit-route dialog/workflow lives in `EditRoutePage.jsx`, not in the widget.**
    `viewer/gui/EditRoutePage.jsx`:

    * `widgetClick()` handles `item.name === "EditRoute"` by opening `EditRouteDialog`
    * `checkRouteWritable()` prompts “save as new local route” when disconnected from a server route
    * `EditRouteDialog` owns rename/load/download/points/stop/delete/save-as/save
    * `EditPointsDialog` owns point-list editing, invert, renumber, empty, and waypoint-dialog entry

11. **Core point workflow is host/dialog owned.**
    `EditPointsDialog` embeds `RoutePointsWidget`, but point editing, delete, empty, invert, renumber, and `WayPointDialog` are all driven from `EditRoutePage.jsx`, not from the summary widget.

12. **Core `RoutePointsWidget` is interactive only because the page wires it that way.**
    In `viewer/components/RoutePointsWidget.jsx`, row clicks are relayed upward via `props.onClick`. In `EditRoutePage.widgetClick`, `item.name === "RoutePoints"` selects/centers/open-dialog logic. This is important because the same separation also applies to `EditRoute`.

13. **Core `NavPage` and `GpsPage` do not meaningfully support `EditRoute` widget entry.**

    * `viewer/gui/NavPage.jsx`: special-cases `ActiveRoute`, not `EditRoute`
    * `viewer/gui/GpsPage.jsx`: no `EditRoute` special case
      Therefore, native dyn interaction must not assume that every page can dispatch edit-route workflow.

14. **dyn `TemporaryHostActionBridge` already exposes the right host action.**
    `runtime/TemporaryHostActionBridge.js` defines `hostActions.routeEditor.openEditRoute()`.
    Capability snapshot:

    * `routeEditor.openEditRoute === "dispatch"` only on `editroutepage`
    * `"unsupported"` elsewhere

15. **Bridge dispatch path is page-item-click based, not a new API.**
    `TemporaryHostActionBridge.routeEditor.openEditRoute()` dispatches a synthetic page click with `item: { name: "EditRoute" }`, which reuses host-owned `onItemClick` / `widgetClick` logic.

16. **dyn already has two strong architectural references for this widget:**

    * `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` for a compact summary widget with full-surface hotspot/catchAll behavior
    * `shared/widget-kits/nav/RoutePointsRenderModel.js` for page-aware host-action gating and passive-by-default interaction

17. **dyn HTML widget interaction rules are already documented.**
    `documentation/avnav-api/interactive-widgets.md` and `documentation/guides/add-new-html-kind.md` require:

    * `catchAll` referenced in markup, never returned from `namedHandlers`
    * passive behavior in unsupported contexts
    * passive behavior in layout-editing mode
    * wrapper click ownership only when dispatch mode is active

18. **The `nav` cluster already exposes the data needed for `editRoute`.**
    `config/clusters/nav.js` already has:

    * `editingRoute`
    * `editingIndex`
    * `activeName`
    * `useRhumbLine`
    * `rteDistance` → `nav.route.remain`
    * `rteEta` → `nav.route.eta`
      No new AvNav store keys are required for the first implementation.

19. **No native `editRoute` kind exists today.**
    There is no `editRoute` branch in `cluster/mappers/NavMapper.js`, no `nav/editRoute` tuple in `cluster/rendering/ClusterKindCatalog.js`, and no `EditRouteTextHtmlWidget` in the widget registry.

---

## Concept Specification

This section is the authoritative layout and behavior specification for `nav/editRoute`.

### Exposed Settings

#### `editRouteRatioThresholdNormal`

* type: `FLOAT`
* default: `1.2`
* internal: `true`

Behavior:

* If shell aspect ratio is **below** this threshold, the widget resolves to `high` mode unless `.widgetContainer.vertical` has already forced `high`.

Rationale:

* `activeRoute` is the closest existing dyn summary-widget reference and already uses `1.2` as its high/normal threshold.
* `EditRoute` is also a compact summary/workflow-entry widget, not a list widget.

#### `editRouteRatioThresholdFlat`

* type: `FLOAT`
* default: `3.8`
* internal: `true`

Behavior:

* If shell aspect ratio is **above** this threshold, the widget resolves to `flat` mode unless `.widgetContainer.vertical` has already forced `high`.

Rationale:

* `activeRoute` already uses `3.8` as its normal/flat threshold and is the closest native HTML reference.

#### No additional end-user editables in this phase

The core widget hardcodes the visible field labels:

* `PTS:`
* `DST:`
* `RTG:`
* `ETA:`

Those labels are part of the core parity target (`viewer/components/EditRouteWidget.jsx`). They should stay fixed in PLAN7. This phase does **not** introduce label-editables, caption/unit editables, or source-badge text editables.

### Layout Concept

#### Shared mode rules

Mode resolution:

* ratio `< editRouteRatioThresholdNormal` → `high`
* ratio `> editRouteRatioThresholdFlat` → `flat`
* otherwise → `normal`
* `.widgetContainer.vertical` forces `high`

**Core parity mapping:**

* `flat` is the dyn equivalent of core **horizontal**
* `normal` and `high` are dyn equivalents of core **non-horizontal**
* `.widgetContainer.vertical` remains a sizing/layout rule, not a new data-density contract

#### State-driven field visibility

This contract is fixed and authoritative:

| State                   | `flat`                     | `normal`                                                           | `high`                   | `.widgetContainer.vertical` |
| ----------------------- | -------------------------- | ------------------------------------------------------------------ | ------------------------ | --------------------------- |
| no route                | show `No Route` only       | show `No Route` only                                               | show `No Route` only     | same as `high`              |
| route present, inactive | route name + `PTS` + `DST` | route name + `PTS` + `DST` + `RTG` placeholder + `ETA` placeholder | same fields as `normal`  | same as `high`              |
| route present, active   | route name + `PTS` + `DST` | route name + `PTS` + `DST` + populated `RTG`/`ETA` when available  | same fields as `normal`  | same as `high`              |
| local route             | local-source badge shown   | local-source badge shown                                           | local-source badge shown | local-source badge shown    |
| server route            | no source badge            | no source badge                                                    | no source badge          | no source badge             |
| layout editing mode     | passive only               | passive only                                                       | passive only             | passive only                |

#### Exact box topology

Only cosmetic spacing constants are implementation-tunable. The **box topology, field allocation, field order, and state behavior below are not optional**.

##### Shared structural nodes

Every rendered non-empty widget has these logical nodes:

* `wrapper`
* `nameBar`
* `nameText`
* `sourceBadge` (present only for local routes)
* metric boxes for `PTS`, `DST`, and optionally `RTG`, `ETA`

The metric order is fixed:

1. `PTS`
2. `DST`
3. `RTG`
4. `ETA`

##### `flat`

**Purpose:** wide-shell compact summary, matching the core horizontal density.

**Topology:**

```text
| namePanel [nameText + optional sourceBadge] | ptsTile | dstTile |
```

Rules:

* `namePanel` occupies the left side.
* `ptsTile` and `dstTile` occupy the right side in a single horizontal strip.
* `RTG` and `ETA` do not render in `flat`, even when the route is active.
* `sourceBadge` sits inside `namePanel` at the trailing edge; `nameText` occupies the remaining width.
* `namePanel` is the only large text region in this mode.

Missing-data behavior:

* no route: render only `namePanel` with `No Route`; do not render metric tiles
* route present but blank display name: render an empty `nameText` box; do not substitute `No Route`
* invalid total distance: `DST` renders the core formatter placeholder from `formatDistance(undefined)`
* local badge omitted when no route or server route

##### `normal`

**Purpose:** balanced summary mode, matching the core non-horizontal field set.

**Topology:**

```text
nameBar [nameText + optional sourceBadge]
PTS tile | DST tile
RTG tile | ETA tile
```

Rules:

* `nameBar` spans the full width.
* Below `nameBar` is a 2×2 metric grid.
* Tile positions are fixed:

  * top-left = `PTS`
  * top-right = `DST`
  * bottom-left = `RTG`
  * bottom-right = `ETA`
* `RTG` and `ETA` always have boxes in this mode when a route exists:

  * active route → populate from data if available
  * inactive route → render formatter placeholders
* Metric labels remain visible even when values are placeholders.

Missing-data behavior:

* no route: render only `nameBar` with `No Route`; do not render the metric grid
* missing `remainingDistance` or `eta` on an active route: render placeholders, not blanks
* inactive route: `RTG` and `ETA` must still render their placeholders because that is what core non-horizontal mode does

##### `high`

**Purpose:** tall/narrow summary mode with maximum readability.

**Topology:**

```text
nameBar [nameText + optional sourceBadge]
PTS row: label | value
DST row: label | value
RTG row: label | value
ETA row: label | value
```

Rules:

* `nameBar` spans the full width on top.
* Each metric gets its own horizontal row.
* Each metric row is a two-cell structure:

  * left cell = fixed label (`PTS:`, `DST:`, `RTG:`, `ETA:`)
  * right cell = fitted value text
* `RTG` and `ETA` rows are always present when a route exists, with the same active/inactive placeholder rules as `normal`.
* This mode is purely summary; there are no row-level hotspots or inline controls.

Missing-data behavior:

* no route: render only `nameBar` with `No Route`; omit metric rows entirely
* route present but malformed fields: render placeholders per field; do not collapse the row set

##### `.widgetContainer.vertical`

This is an explicit plan contract.

**Behavior:**

1. Force mode = `high`.
2. Keep the same field set and row order as `high`.
3. Use a widget-owned vertical shell profile derived from the core CSS:

   * core width comes from `.smallWidget(@size1)` with `@size1 = 7em`
   * core vertical min-height is `8em`
4. Therefore the native HTML widget must use a vertical profile equivalent to:

   * `height: auto`
   * `aspect-ratio: 7 / 8`
   * `min-height: 8em`
5. Vertical mode is still a summary widget. There is no intrinsic-height growth by point count and no scrolling behavior.

**Why this contract is code-grounded:**

* Core `EditRouteWidget` has fixed small-widget width and a vertical min-height rule in `viewer/style/widgets.less`.
* Unlike `routePoints`, there is no variable-length list that needs content-driven height.

#### Visual state contract

##### Active-route state

When `isActiveRoute === true`:

* apply a dedicated wrapper class, equivalent in meaning to core `.editRouteWidget.activeRoute`
* CSS must provide an attention/border treatment that is visually equivalent in intent to the core attention border
* active state does **not** add extra fields in `flat`; it only affects visuals there

##### Local-route state

When `isLocalRoute === true`:

* apply a dedicated wrapper state class
* render a dedicated source badge inside `nameBar`

Because native HTML widgets hide the native widget head (`wantsHideNativeHead: true`), the core `WidgetHead` disconnected icon cannot be reused directly. The local-route badge is therefore a dyn-specific presentation adaptation of the same core state.

The badge contract is fixed:

* present only for local/non-server routes
* absent for server routes and no-route state
* non-interactive
* always lives inside `nameBar`, trailing the route name

##### No-route state

When no valid editing route is available:

* apply a dedicated wrapper state class
* render `No Route` in the route-name position
* omit all metric boxes
* keep full-surface click behavior only if dispatch mode is active in the host context

##### No widget-owned writable/disconnected state

The widget must **not** expose separate CSS states for:

* `connectedMode`
* route writable vs not writable
* server-disconnected save-as-local prompt state

Those are not part of core widget behavior. They belong to the route-page/dialog workflow (`checkRouteWritable()` and `RouteEdit.isRouteWritable()` in `viewer/gui/EditRoutePage.jsx` and `viewer/nav/routeeditor.js`).

### Widget Size

#### Normal host-sized case

Outside `.widgetContainer.vertical`, width and height are host-owned.

The widget does not compute intrinsic height in standard containers.

#### Special case: `.widgetContainer.vertical`

The vertical contract is simpler than `routePoints` and follows the core widget more closely.

Required behavior:

1. First render may not know committed ancestry; assume normal host-sized rendering.
2. After attach, `initFunction().triggerResize()` requests one corrective rerender.
3. The corrective rerender resolves committed ancestry via `targetEl.closest(".widgetContainer.vertical")`.
4. If vertical ancestry is present:

   * force `high`
   * use the vertical aspect-ratio/min-height profile described above
   * use width-only geometry anchoring for layout/fit measurements
5. Later updates re-evaluate committed ancestry through the normal render path.
6. No widget-owned observer is required.

### Text Sizing

Text sizing is box-driven.

Rules:

* every visible text node gets its own measurement box
* fit computes font size only
* rendered text content must remain the full normalized source string
* `white-space: nowrap`
* no wrapping
* no ellipsis
* no text substitution by the fit helper

This is a dyn-standard presentation adaptation. Core CSS uses ellipsis for the route name (`viewer/style/widgets.less`), but the dyn HTML system already uses fit-based rendering for native HTML widgets. PLAN7 keeps the content faithful and uses scale-to-fit instead of ellipsis.

Text nodes that require fit decisions:

* `nameText`
* `sourceBadge`
* metric labels in `high`
* metric captions/value boxes in `flat` and `normal`
* metric values in all modes

### AvNav Keys and Formatting Contract

#### Source keys retrieved by the nav cluster

The widget uses the existing `nav` cluster keys:

* `editingRoute` ← `nav.routeHandler.editingRoute`
* `editingIndex` ← `nav.routeHandler.editingIndex`
  present because the route-editor store bundle already provides it, but not used by the summary renderer
* `activeName` ← `nav.routeHandler.activeName`
* `useRhumbLine` ← `nav.routeHandler.useRhumbLine`
* `rteDistance` ← `nav.route.remain`
* `rteEta` ← `nav.route.eta`

No new AvNav store keys are required.

#### Route source

The source route is always `editingRoute`.

This matches the core widget exactly:

* `EditRouteWidget.jsx` uses `RouteEdit.MODES.EDIT`
* it does not use the active-route leg source

#### Route normalization contract

A dedicated `EditRouteViewModel` must normalize the editing route into a renderer-safe domain object.

Expected input shape:

* `editingRoute` must be an object
* `editingRoute.points` must be an array
* `editingRoute.name` may be empty, local-prefixed, or server-named

Validation:

* if `editingRoute` is missing, not an object, or `points` is not an array → `route: null`
* if `editingRoute.points` is an empty array → valid route with `pointCount: 0`
* the viewmodel must not assume that `editingRoute` has working class methods at runtime

Display-name derivation:

* match core `routeobjects.nameToBaseName()` / `Route.displayName()`
* strip `local@` prefix when present
* otherwise preserve the raw name
* blank names stay blank; do not coerce them to `No Route`

Route-source derivation:

* match core `routeobjects.isServerName(name)` / `Route.isServer()`
* `isServerRoute = true` only when the raw name satisfies the same server-name rule as core
* `isLocalRoute = !isServerRoute` for any present route whose name does not satisfy that rule

#### Total distance contract

Core uses `route.computeLength(0, useRhumbLine)` in `EditRouteWidget.jsx`.

For dyn, the implementation contract is:

* canonical calculation: sum leg distances over the normalized point array using `CenterDisplayMath.computeCourseDistance(prev, next, useRhumbLine).distance`
* optional fast path: when `sourceRoute.computeLength` exists and returns a finite number, it may be used directly
* if any leg is malformed or non-computable, that leg contributes `0` rather than poisoning the entire total

This preserves the core intent while fail-closing against malformed plain objects.

Distance units:

* raw total distance remains in **meters**
* renderer formats it with `formatDistance(...)`, matching core usage

#### Remaining distance and ETA contract

Core widget behavior:

* `remain = isActive ? props.remain : undefined`
* `eta = isActive ? props.eta : undefined`

The dyn contract must match that rule.

Therefore:

* `remainingDistance` is exposed only when `isActiveRoute === true`; otherwise `undefined`
* `eta` is exposed only when `isActiveRoute === true`; otherwise `undefined`

This is why `normal` and `high` show placeholders for inactive routes: the field boxes exist, but the formatter input is `undefined`.

#### Point count contract

Point count is `editingRoute.points.length`.

Formatting:

* use `formatDecimal(pointCount, 3)` to preserve the core display convention from `EditRouteWidget.jsx`

#### Formatter contract

##### Route name

* source: normalized display name
* formatter: none

##### PTS

* source: numeric point count
* formatter: `formatDecimal(..., 3)`

##### DST

* source: total distance in meters
* formatter: `formatDistance(...)`

##### RTG

* source: `remainingDistance` in meters, but only when active
* formatter: `formatDistance(...)`
* inactive route → formatter receives `undefined` → placeholder output

##### ETA

* source: `eta`, but only when active
* formatter: `formatTime(...)`
* inactive route → formatter receives `undefined` → placeholder output

#### Mapper output for `editRoute`

`NavMapper` must return a grouped renderer payload.

Top-level mapper output:

* `renderer`: `"EditRouteTextHtmlWidget"`
* `domain`
* `layout`

Sub-object shapes:

```text
domain: {
  hasRoute,          // boolean
  routeName,         // normalized display name or ""
  pointCount,        // number
  totalDistance,     // meters or undefined
  remainingDistance, // meters or undefined
  eta,               // Date or undefined
  isActiveRoute,     // boolean
  isLocalRoute,      // boolean
  isServerRoute      // boolean
}

layout: {
  ratioThresholdNormal,  // number or undefined
  ratioThresholdFlat     // number or undefined
}
```

The renderer owns the fixed visible labels and the fixed `No Route` text in this phase.

---

## Architecture Notes

These notes anchor the plan. They are descriptive, not prescriptive.

### Why `activeRoute` and `routePoints` are the right references

`activeRoute` is the best structural reference because it is already a compact HTML summary widget with:

* mode switching
* box-driven fit
* full-surface hotspot behavior
* passive/dispatch state classes
* hidden native head

`routePoints` is the best interaction reference because it already solves:

* page-aware capability gating
* passive-by-default behavior
* editing-mode passivity
* bridge-aware separation between renderer behavior and host workflow

`editRoute` combines those two ideas:

* **summary widget topology like `activeRoute`**
* **interaction gating discipline like `routePoints`**

### Why a dedicated `EditRouteViewModel` is warranted

A new dedicated viewmodel is required because `editRoute`’s domain is not the same as either existing route widget.

It is **not** equivalent to `ActiveRouteViewModel` because:

* source route is `editingRoute`, not `nav.route.name` / active route domain
* local/server source semantics are derived from route-name rules
* total distance must be calculated from the editing route

It is **not** equivalent to `RoutePointsViewModel` because:

* this widget does not need a point list
* it needs route totals and active-gated remain/ETA
* it is a summary view, not a list-selection view

### Shared route normalization: do not force a broad refactor in PLAN7

PLAN7 should **not** refactor `ActiveRouteViewModel.js` or `RoutePointsViewModel.js` into a new common route-domain layer.

Reason:

* current code paths are already stable and covered
* the overlap is small
* broad “shared route utility” refactors would expand scope and risk without changing user-visible behavior

PLAN7 should therefore:

* add `EditRouteViewModel.js`
* keep its normalization self-contained
* allow a tiny additive helper only if it stays private to the new widget stack and does not churn existing viewmodels

### Core parity split

The following matrix is the authoritative parity boundary.

| Concern                                              | Core behavior (verified)                                                  | PLAN7 parity target                                                       | Host-owned / out of scope      |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| route source                                         | `EditRouteWidget.jsx` uses `RouteEdit.MODES.EDIT`                         | use `editingRoute` exactly                                                | none                           |
| active-state rule                                    | `route.name === activeName` in `routeeditor.js`                           | same exact rule                                                           | none                           |
| route name                                           | `route.displayName()` strips `local@`                                     | same display-name rule                                                    | none                           |
| point count                                          | `route.points.length`                                                     | same                                                                      | none                           |
| total distance                                       | `route.computeLength(0, useRhumbLine)`                                    | same semantic result via direct method fast path or leg-sum fallback      | none                           |
| remaining/ETA gating                                 | only passed through when active                                           | same                                                                      | none                           |
| density split                                        | horizontal = name/PTS/DST, non-horizontal = +RTG/+ETA                     | `flat` = horizontal-equivalent, `normal/high` = non-horizontal-equivalent | none                           |
| active visual                                        | widget class/border only                                                  | wrapper state class/border treatment                                      | none                           |
| local/server visual                                  | `disconnect={!route.isServer()}` via header icon                          | same semantic state, but as native badge/class because hidden head        | none                           |
| click role                                           | widget is summary/workflow entry only                                     | full-surface open-workflow entry only                                     | no inline controls             |
| editability prompt                                   | `checkRouteWritable()` + confirm/save-local path                          | do not replicate in widget                                                | host route dialog/page owns it |
| rename/load/download/delete/save-as/stop             | `EditRouteDialog`                                                         | do not embed                                                              | host-owned                     |
| point editing / empty / invert / renumber            | `EditPointsDialog`                                                        | do not embed                                                              | host-owned                     |
| waypoint dialog / map centering / double-click logic | `EditRoutePage.widgetClick`, `startWaypointDialog`, `MapHolder.setCenter` | do not embed                                                              | host-owned                     |

### Interaction chain to preserve

The native widget must enter the **host** workflow, not recreate it.

Required dispatch chain:

1. widget full-surface click
2. `hostActions.routeEditor.openEditRoute()`
3. `TemporaryHostActionBridge` dispatches synthetic `{ item: { name: "EditRoute" } }`
4. host page `onItemClick` / `widgetClick` receives it
5. `EditRoutePage.widgetClick()` opens `EditRouteDialog`

This is the correct parity path because it keeps all route-editor behavior in host-owned code.

### Why dispatch must be `editroutepage`-only

This is not just a bridge preference; it is grounded in core page behavior.

* `EditRoutePage.widgetClick()` handles `EditRoute` correctly.
* `NavPage.widgetClick()` has no `EditRoute` special case.
* `GpsPage.onItemClick()` has no `EditRoute` special case.

Therefore, `nav/editRoute` must not attempt dispatch on `navpage` or `gpspage`. It should be passive there even if the widget is visible.

### No separate DOM-effects module is needed

Unlike `routePoints`, this widget has:

* no selected-row visibility pass
* no scroll container
* no variable-height list
* no committed-DOM mutation beyond one attach-time corrective rerender

Therefore, committed vertical detection can be handled in the renderer shell without a dedicated `EditRouteDomEffects.js`.

---

## Hard Constraints

### Architectural

* Preserve the existing AvNav registration model.
* Use UMD modules only.
* Keep new/changed files within the 400-line budget.
* Do not change `HtmlSurfaceController` internals.
* Do not change `TemporaryHostActionBridge` internals.
* Do not change core AvNav code.
* Do not refactor existing `activeRoute` or `routePoints` stacks unless a strictly additive dependency registration change is required.

### Behavioral

* `editRoute` must use the **editing route** as its source.
* Active state must be exact raw-name equality against `activeName`.
* `flat` must render only `route name`, `PTS`, `DST`.
* `normal` and `high` must render `route name`, `PTS`, `DST`, `RTG`, `ETA`.
* `.widgetContainer.vertical` must force `high`.
* No-route state must render `No Route` only and must omit metric boxes.
* The widget must remain summary-only; do not embed buttons or inline route controls.
* The widget must not compute or render a writable/non-writable state from `connectedMode`.
* The widget must not display a fake network-disconnect state. Only the core local-route/source-state parity is in scope.
* Text-fit must not trim, abbreviate, or ellipsize emitted text.
* The widget must fail closed on malformed route data and never throw.

### Interaction

* Full-surface click only; no partial-surface click ownership.
* Use a hotspot overlay plus wrapper `catchAll` only when dispatch mode is active.
* `namedHandlers()` must return `{ editRouteOpen: fn }` only in dispatch mode and `{}` otherwise.
* Never return `catchAll` from `namedHandlers()`.
* In layout-editing mode, the widget must be passive even on `editroutepage`.
* On unsupported/passive pages, the widget must not steal clicks or intercept wrapper ownership.
* Do not use `routePoints.activate` or `openActiveRoute` for this kind.

### Vertical-mode lifecycle

* First render must tolerate missing committed ancestry and render as non-vertical.
* `initFunction().triggerResize()` must request one corrective rerender after attach.
* Vertical committed ancestry must be re-evaluated during later updates.
* In vertical mode, the resize signature must exclude shell height if the widget’s own aspect-ratio/min-height profile controls the effective height, to avoid self-induced loops.

### Scope

* Do not embed `EditRouteDialog`, `EditPointsDialog`, `WayPointDialog`, or host button logic in the widget.
* Do not try to replicate `MapHolder.setCenter`, double-click waypoint dialog opening, or route-stop behavior.
* Do not change `documentation/avnav-api/plugin-lifecycle.md` or `interactive-widgets.md` unless the implementation actually reveals a documentation gap; current docs already cover the required bridge/catchAll behavior.

---

## Implementation Order

### Phase 1 — ViewModel and Mapper Wiring

**Intent:** create the data-normalization layer and connect it to the nav mapper.

**Dependencies:** none.

#### 1A. Create `cluster/viewmodels/EditRouteViewModel.js`

Create a new UMD module.

Contract:

* `build(props, toolkit)` returns a normalized edit-route domain object.
* Required derived outputs:

  * `route` → normalized summary route object or `null`
  * `hasRoute`
  * `isActiveRoute`
  * `remainingDistance`
  * `eta`

Normalized route object shape:

```text
route: {
  rawName,        // original route name or ""
  displayName,    // local-prefix-stripped display name
  pointCount,     // points.length
  totalDistance,  // meters
  isLocalRoute,   // boolean
  isServerRoute,  // boolean
  sourceRoute     // original editingRoute object
}
```

Rules:

* `editingRoute` missing / non-object / `points` not array → `route: null`, `hasRoute: false`
* empty `points` array → valid route with `pointCount: 0`, `totalDistance: 0`
* display name strips `local@` exactly like core `routeobjects.nameToBaseName()`
* local/server rule must match core `routeobjects.isServerName()`
* `isActiveRoute = !!route && activeName is non-empty string && editingRoute.name === activeName`
* `remainingDistance = rteDistance` only when active, otherwise `undefined`
* `eta = rteEta` only when active, otherwise `undefined`

Distance calculation:

* if `sourceRoute.computeLength(0, useRhumbLine)` exists and yields a finite number, it may be used
* otherwise sum leg distances via `CenterDisplayMath.computeCourseDistance(prev, next, useRhumbLine)`
* malformed legs contribute `0`

#### 1B. Add `tests/cluster/viewmodels/EditRouteViewModel.test.js`

Cover:

* missing `editingRoute`
* `editingRoute` without `points`
* empty route (`points: []`)
* local name prefix stripping
* server/local flag derivation
* exact active-name equality
* remaining/ETA gated by active state
* total distance for:

  * empty route
  * one-point route
  * multi-point route
  * invalid leg data
  * rhumb-line vs great-circle branch
* blank route name remains blank
* malformed route never throws

#### 1C. Register `EditRouteViewModel` in `config/components/registry-cluster.js`

Add:

* component entry for `EditRouteViewModel`
* dependency on `CenterDisplayMath` if the viewmodel uses the fallback leg-sum path
* add `EditRouteViewModel` to `NavMapper.deps`

#### 1D. Add `editRoute` branch to `cluster/mappers/NavMapper.js`

Instantiate the viewmodel in `create()` and add a new `translate()` branch:

```text
renderer: "EditRouteTextHtmlWidget"
domain: {
  hasRoute,
  routeName,
  pointCount,
  totalDistance,
  remainingDistance,
  eta,
  isActiveRoute,
  isLocalRoute,
  isServerRoute
}
layout: {
  ratioThresholdNormal,
  ratioThresholdFlat
}
```

Mapper rules:

* `routeName` comes from normalized display name
* no label-editable group in this phase
* fixed visible labels remain renderer-owned

#### 1E. Update `config/clusters/nav.js`

Changes:

1. Add new kind option:

```text
opt("Edit route", "editRoute")
```

2. Add kind-scoped internal editables:

* `editRouteRatioThresholdNormal`

  * float
  * default `1.2`
  * condition `{ kind: "editRoute" }`
* `editRouteRatioThresholdFlat`

  * float
  * default `3.8`
  * condition `{ kind: "editRoute" }`

3. Reuse the existing store keys already present in `nav.js`:

   * `editingRoute`
   * `editingIndex`
   * `activeName`
   * `useRhumbLine`
   * `rteDistance`
   * `rteEta`

4. No `updateFunction` branch is needed for `editRoute`.

5. Update the cluster description text so the new widget kind is discoverable.

#### 1F. Verify `config/shared/kind-defaults.js` requires no changes

`editRoute` is a native HTML summary widget with fixed core labels. It does not need per-kind caption/unit text params in `kind-defaults.js`.

#### 1G. Update mapper/config tests

Extend:

* `tests/cluster/mappers/NavMapper.test.js`
* `tests/config/clusters/nav.test.js`

Cover:

* new kind option presence
* threshold editables scoped to `editRoute`
* mapper output shape for `editRoute`
* mapper handles `route: null` safely

---

### Phase 2 — Layout Module

**Intent:** define the authoritative measurement geometry for the widget’s four layout states.

**Dependencies:** Phase 1.

#### 2A. Create `shared/widget-kits/nav/EditRouteLayout.js`

This module is the single owner of measurement geometry.

Responsibilities:

* resolve mode (`flat`, `normal`, `high`)
* accept committed vertical override from the renderer shell
* compute measurement rects for:

  * `nameText`
  * `sourceBadge`
  * `PTS`
  * `DST`
  * `RTG`
  * `ETA`
* compute visibility flags for metric boxes based on:

  * `hasRoute`
  * mode
* compute vertical-shell profile metadata:

  * force-high
  * width-only anchor path
  * wrapper inline style recommendations (`height:auto`, `aspect-ratio:7/8`, `min-height:8em`)

Geometry anchor:

* host-sized shells: use `ResponsiveScaleProfile.computeProfile(W, H, spec)` so `minDim = min(W, H)`
* committed vertical shells: use `ResponsiveScaleProfile.computeProfile(W, W, spec)` so `minDim = W`

Important design note:

* Unlike `routePoints`, this widget does **not** need list-row structural inline geometry.
* CSS may own the structural grid template, but `EditRouteLayout` must remain the measurement owner for fit boxes and the authoritative owner of which boxes exist in each mode/state.

#### 2B. Add `tests/shared/nav/EditRouteLayout.test.js`

Cover:

* `flat` returns boxes for `name`, `PTS`, `DST` only
* `normal` returns boxes for `name`, `PTS`, `DST`, `RTG`, `ETA`
* `high` returns stacked row boxes
* no-route omits metric boxes in all modes
* local badge box exists only when `isLocalRoute === true`
* vertical committed state forces `high`
* vertical path uses width-only anchor
* vertical metadata includes `aspect-ratio: 7/8` and `min-height: 8em`

#### 2C. Register `EditRouteLayout` in `config/components/registry-shared-foundation.js`

Add a new shared foundation component entry and wire dependencies:

* `ResponsiveScaleProfile`
* `LayoutRectMath`

No extra sizing helper file is required unless the implementation proves the constants are too noisy for a single-file layout owner.

---

### Phase 3 — Fit Module

**Intent:** implement box-driven text fitting for all edit-route boxes.

**Dependencies:** Phase 2.

#### 3A. Create `shared/widget-kits/nav/EditRouteHtmlFit.js`

Responsibilities:

* compute font-size decisions for:

  * `nameText`
  * `sourceBadge`
  * metric labels
  * metric values
* consume measurement rects from `EditRouteLayout`
* use the same fit discipline as other native HTML widgets:

  * shrink only when needed
  * no text mutation
  * no ellipsis

Dependencies should mirror current native HTML fit modules:

* `ThemeResolver`
* `RadialTextLayout`
* `TextTileLayout`
* `EditRouteLayout`
* `HtmlWidgetUtils`

#### 3B. Add `tests/shared/nav/EditRouteHtmlFit.test.js`

Cover:

* fit returns stable styles for all visible boxes
* missing shell rect returns a no-throw null/empty result
* long route names reduce font size instead of truncating text
* badge text also fits its own box
* metric label/value boxes fit independently
* no-route state only computes name fit

#### 3C. Register `EditRouteHtmlFit` in `config/components/registry-shared-foundation.js`

Add the component entry and dependencies.

---

### Phase 4 — HTML Renderer Shell, Render Model, Markup, Catalog, Router

**Intent:** add the actual native HTML widget and wire it into the cluster rendering system.

**Dependencies:** Phases 1–3.

#### 4A. Create `shared/widget-kits/nav/EditRouteRenderModel.js`

This module is the pure normalization/render-contract owner for the renderer.

Responsibilities:

* consume mapper `domain` + `layout`
* resolve committed vertical override passed from the renderer shell
* resolve mode
* compute field visibility
* format visible texts using core formatters:

  * `formatDecimal(pointCount, 3)`
  * `formatDistance(totalDistance)`
  * `formatDistance(remainingDistance)`
  * `formatTime(eta)`
* produce placeholder-bearing field texts where core would do so
* expose CSS state flags:

  * `hasRoute`
  * `isActiveRoute`
  * `isLocalRoute`
  * `isServerRoute`
  * `canOpenEditRoute`
  * `captureClicks`
* expose wrapper-style metadata for vertical mode
* build stable resize-signature inputs

Interaction gating contract:

`canOpenEditRoute === true` only when all are true:

* not in layout-editing mode
* `hostActions.getCapabilities` exists
* `hostActions.routeEditor.openEditRoute` exists
* `capabilities.routeEditor.openEditRoute === "dispatch"`

All other cases are passive.

#### 4B. Create `shared/widget-kits/nav/EditRouteMarkup.js`

This module is the HTML-string assembly owner.

Responsibilities:

* emit wrapper classes:

  * `dyni-edit-route-html`
  * `dyni-edit-route-mode-flat|normal|high`
  * `dyni-edit-route-active-route`
  * `dyni-edit-route-local-route`
  * `dyni-edit-route-no-route`
  * `dyni-edit-route-open-dispatch|passive`
* emit the exact box topology from the concept spec
* emit hotspot/catchAll attributes only in dispatch mode
* emit no inline controls
* emit no onclicks in passive mode
* apply fit styles to the matching nodes
* apply vertical wrapper inline styles when requested by the layout/render model

#### 4C. Create `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`

The renderer shell must follow the existing HTML surface contract.

Responsibilities:

* `wantsHideNativeHead: true`
* resolve committed host elements from `hostContext.__dyniHostCommitState`
* on first render: tolerate missing committed ancestry
* on attach: `triggerResize()` once for corrective rerender
* resolve `.widgetContainer.vertical` from committed ancestry
* call `EditRouteRenderModel`
* call `EditRouteHtmlFit`
* call `EditRouteMarkup`
* own `namedHandlers()`

Interaction contract:

* when dispatch is active: return `{ editRouteOpen: fn }`
* when passive: return `{}`
* never return `catchAll`

Open handler behavior:

* call `hostActions.routeEditor.openEditRoute()`
* return `false` when passive or editing mode

#### 4D. Create `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css`

CSS responsibilities:

* presentation only
* cursor state for dispatch/passive
* attention styling for active route
* local-route badge styling
* no-route styling
* mode-specific grid templates
* generic `.widgetContainer.vertical` selector for the vertical aspect-ratio/min-height profile

CSS must not add inline controls or duplicate formatter logic.

#### 4E. Update `config/components/registry-widgets.js`

Add:

* `EditRouteRenderModel`
* `EditRouteMarkup`
* `EditRouteTextHtmlWidget`

Keep `EditRouteRenderModel` and `EditRouteMarkup` under `shared/widget-kits/nav`, matching current route-points architecture.

#### 4F. Update `config/components/registry-cluster.js`

Add the new renderer dependency to `ClusterRendererRouter.deps` and keep `NavMapper.deps` up to date.

#### 4G. Add `nav/editRoute` to `cluster/rendering/ClusterKindCatalog.js`

New tuple:

```text
{ cluster: "nav", kind: "editRoute", viewModelId: "EditRouteViewModel", rendererId: "EditRouteTextHtmlWidget", surface: "html" }
```

#### 4H. Update `cluster/rendering/ClusterRendererRouter.js`

Add renderer inventory entry for `EditRouteTextHtmlWidget`.

#### 4I. Add renderer tests

Create:

* `tests/cluster/rendering/EditRouteTextHtmlWidget.test.js`
* `tests/shared/nav/EditRouteRenderModel.test.js`
* `tests/shared/nav/EditRouteMarkup.test.js`

Coverage must include:

* no-route rendering
* active-route rendering
* local-route badge state
* `flat`, `normal`, `high`
* committed vertical forcing `high`
* passive vs dispatch behavior
* layout-editing passivity
* hotspot/catchAll ownership
* placeholder rendering for inactive/missing route metrics
* text-fit stability under shell resizing
* resize-signature stability in vertical mode

#### 4J. Update dependency-registry tests

Extend `tests/config/components.test.js` for the new components and dependency arrays.

---

### Phase 5 — Documentation and Status Tracking

**Intent:** document the new widget and record the parity boundary.

**Dependencies:** code phases only.

#### 5A. Create `documentation/widgets/edit-route.md`

Must cover:

* purpose and parity boundary
* core widget source references
* layout modes
* vertical behavior
* local-route badge meaning
* interaction contract
* supported/unsupported pages
* out-of-scope host workflow
* examples for no-route / active / local / passive states

#### 5B. Update `documentation/architecture/cluster-widget-system.md`

Add `nav/editRoute` to the native HTML kind inventory and describe its layering.

#### 5C. Update `documentation/TABLEOFCONTENTS.md`

Add the new widget doc.

#### 5D. Update `ROADMAP.md`

Mark `editRoute` coverage appropriately and cross-reference the new native kind.

#### 5E. Update quality/debt tracking docs if needed

Likely files:

* `documentation/QUALITY.md`
* `documentation/TECH-DEBT.md`

Record any explicitly deferred work only if a real deferral remains after implementation.

---

## Affected File Map

| File                                                               |   Likely phase | Planned change                                                          |
| ------------------------------------------------------------------ | -------------: | ----------------------------------------------------------------------- |
| `cluster/viewmodels/EditRouteViewModel.js`                         |              1 | Create new viewmodel                                                    |
| `tests/cluster/viewmodels/EditRouteViewModel.test.js`              |              1 | Create viewmodel tests                                                  |
| `cluster/mappers/NavMapper.js`                                     |              1 | Add `editRoute` mapper branch and instantiate new viewmodel             |
| `config/clusters/nav.js`                                           |              1 | Add `editRoute` kind option and internal ratio-threshold editables      |
| `config/shared/kind-defaults.js`                                   |              1 | No changes required; fixed labels stay renderer-owned                   |
| `config/components/registry-cluster.js`                            |           1, 4 | Register `EditRouteViewModel`; update mapper/router deps                |
| `tests/cluster/mappers/NavMapper.test.js`                          |              1 | Add `editRoute` mapper tests                                            |
| `tests/config/clusters/nav.test.js`                                |              1 | Add kind/editable coverage                                              |
| `shared/widget-kits/nav/EditRouteLayout.js`                        |              2 | Create layout owner                                                     |
| `tests/shared/nav/EditRouteLayout.test.js`                         |              2 | Create layout tests                                                     |
| `config/components/registry-shared-foundation.js`                  |           2, 3 | Register `EditRouteLayout` and `EditRouteHtmlFit`                       |
| `shared/widget-kits/nav/EditRouteHtmlFit.js`                       |              3 | Create fit owner                                                        |
| `tests/shared/nav/EditRouteHtmlFit.test.js`                        |              3 | Create fit tests                                                        |
| `shared/widget-kits/nav/EditRouteRenderModel.js`                   |              4 | Create pure render-model owner                                          |
| `shared/widget-kits/nav/EditRouteMarkup.js`                        |              4 | Create pure markup owner                                                |
| `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`  |              4 | Create HTML renderer shell                                              |
| `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css` |              4 | Create widget CSS                                                       |
| `config/components/registry-widgets.js`                            |              4 | Register render-model, markup, renderer                                 |
| `cluster/rendering/ClusterKindCatalog.js`                          |              4 | Add `nav/editRoute` tuple                                               |
| `cluster/rendering/ClusterRendererRouter.js`                       |              4 | Add renderer to inventory                                               |
| `tests/cluster/rendering/EditRouteTextHtmlWidget.test.js`          |              4 | Create renderer integration tests                                       |
| `tests/shared/nav/EditRouteRenderModel.test.js`                    |              4 | Create render-model tests                                               |
| `tests/shared/nav/EditRouteMarkup.test.js`                         |              4 | Create markup tests                                                     |
| `tests/config/components.test.js`                                  |     1, 2, 3, 4 | Update expected dependency arrays                                       |
| `documentation/widgets/edit-route.md`                              |              5 | Create widget doc                                                       |
| `documentation/architecture/cluster-widget-system.md`              |              5 | Add editRoute references                                                |
| `documentation/TABLEOFCONTENTS.md`                                 |              5 | Add doc entry                                                           |
| `ROADMAP.md`                                                       |              5 | Update coverage/status                                                  |
| `documentation/QUALITY.md`                                         |              5 | Update quality status if needed                                         |
| `documentation/TECH-DEBT.md`                                       |              5 | Record explicit deferrals if any                                        |
| `runtime/TemporaryHostActionBridge.js`                             | reference only | No source change planned; existing `openEditRoute` capability is reused |
| `documentation/avnav-api/plugin-lifecycle.md`                      | reference only | Existing host-action documentation already covers `openEditRoute()`     |
| `documentation/avnav-api/interactive-widgets.md`                   | reference only | Existing `catchAll`/passive interaction rules already cover this widget |
| `cluster/viewmodels/ActiveRouteViewModel.js`                       | reference only | No change; remains summary-widget reference                             |
| `cluster/viewmodels/RoutePointsViewModel.js`                       | reference only | No change; remains route-list normalization reference                   |

---

## Don'ts

* Do not change core AvNav code.
* Do not change `TemporaryHostActionBridge` internals.
* Do not change `HtmlSurfaceController` internals.
* Do not change existing `activeRoute` or `routePoints` behavior.
* Do not widen PLAN7 into a shared route-domain refactor across existing widgets.
* Do not add inline buttons, row actions, or embedded dialogs to the widget.
* Do not replicate `EditRouteDialog`, `EditPointsDialog`, or `WayPointDialog` inside the renderer.
* Do not compute `connectedMode`-based writability in the widget.
* Do not invent a transport/network disconnect style for this widget.
* Do not treat local/server state as anything other than the core `route.isServer()` parity rule.
* Do not enable dispatch on `navpage`, `gpspage`, or other unsupported contexts.
* Do not steal clicks in passive mode.
* Do not omit the layout-editing passive rule.
* Do not return `catchAll` from `namedHandlers()`.
* Do not use ellipsis or trimmed text output in the native renderer.
* Do not collapse `RTG`/`ETA` boxes in `normal` or `high` just because the route is inactive; placeholders are required there.
* Do not show `RTG`/`ETA` in `flat`; core horizontal parity omits them.
* Do not leave `.widgetContainer.vertical` behavior as an implementation guess; it must force `high` and use the core-derived `7/8` aspect-ratio plus `8em` minimum-height contract.
* Do not include shell height in the resize signature when vertical mode is driven by the widget’s own aspect-ratio/min-height profile.
* Do not use the documentation phase to slip in code changes.

---

## Deployment Boundaries

| Deployable unit                                        | Phases | Notes                                   |
| ------------------------------------------------------ | ------ | --------------------------------------- |
| ViewModel + mapper wiring + nav config                 | 1      | Additive; no change to existing widgets |
| Layout module                                          | 2      | Additive shared module                  |
| Fit module                                             | 3      | Additive shared module                  |
| HTML renderer shell + helpers + CSS + catalog + router | 4      | User-visible new widget kind            |
| Documentation and status tracking                      | 5      | After code phases only                  |

---

## Acceptance Criteria

### ViewModel and mapper

* `EditRouteViewModel.build()` uses `editingRoute` as the route source.
* Missing/malformed `editingRoute` yields `route: null`, `hasRoute: false`, no throw.
* Local-prefix stripping matches core `route.displayName()` semantics.
* Local/server derivation matches core `route.isServer()` semantics.
* `isActiveRoute` is `true` only for exact raw-name equality against a non-empty `activeName`.
* `remainingDistance` and `eta` are exposed only when active.
* Total distance is correct for valid point sequences and fail-closed for malformed legs.
* `NavMapper.translate()` returns the grouped `renderer + domain + layout` payload for `editRoute`.
* `config/clusters/nav.js` exposes the new kind and only the two internal threshold editables for it.

### Layout

* `EditRouteLayout` resolves `flat`, `normal`, and `high` from shell ratio.
* `flat` exposes boxes only for `name`, `PTS`, `DST`.
* `normal` exposes `name` plus a 2×2 grid for `PTS`, `DST`, `RTG`, `ETA`.
* `high` exposes `name` plus four stacked metric rows.
* No-route state omits all metric boxes in all modes.
* Local-route state includes a badge box in all route-present modes.
* Committed vertical ancestry forces `high`.
* Vertical mode uses the width-only anchor path.
* Vertical metadata yields `height:auto`, `aspect-ratio:7/8`, `min-height:8em`.

### Fit

* `EditRouteHtmlFit.compute()` returns per-box font-size decisions only.
* Long route names scale down instead of truncating.
* Placeholder text also fits its boxes.
* Missing shell rect is handled gracefully.
* No fit helper changes emitted text content.

### Renderer

* `EditRouteTextHtmlWidget` hides the native head.
* First render works without committed ancestry.
* `initFunction().triggerResize()` requests one corrective rerender after attach.
* Later updates re-evaluate committed vertical ancestry.
* Wrapper classes reflect:

  * mode
  * active route
  * local route
  * no route
  * dispatch/passive
* No-route rendering shows `No Route` only.
* `flat` never shows `RTG` or `ETA`.
* `normal` and `high` always include `RTG` and `ETA` boxes for route-present state, with placeholders when inactive or missing.
* Local/source badge appears only for local routes.
* Vertical mode renders the `high` topology and the vertical shell profile.
* Vertical resize-signature logic does not loop on self-induced height changes.

### Interaction parity

* The widget is full-surface clickable only in dispatch mode.
* Dispatch mode requires:

  * host not in layout editing
  * `hostActions.routeEditor.openEditRoute` function
  * `capabilities.routeEditor.openEditRoute === "dispatch"`
* On `editroutepage`, dispatch mode is active and clicking opens the host edit-route workflow.
* On `navpage`, the widget is passive.
* On `gpspage`, the widget is passive.
* On unknown/other pages, the widget is passive.
* In layout-editing mode, the widget is passive even on `editroutepage`.
* In dispatch mode:

  * markup includes wrapper `onclick="catchAll"`
  * markup includes a full-surface hotspot with `onclick="editRouteOpen"`
  * `namedHandlers()` returns only `{ editRouteOpen: fn }`
* In passive mode:

  * no wrapper click attribute
  * no hotspot
  * `namedHandlers()` returns `{}`

### Host-workflow boundary

* Clicking the native widget does not bypass the host route-editor workflow.
* The widget does not embed rename/load/download/delete/save-as/stop controls.
* The widget does not embed the points dialog or waypoint dialog.
* The widget does not reproduce `checkRouteWritable()` logic inline.
* The widget does not reproduce route-points selection/map-centering/double-click logic.

### Kind catalog and router

* `nav/editRoute` resolves to `surface: "html"` and `rendererId: "EditRouteTextHtmlWidget"`.
* `ClusterRendererRouter` creates/manages the HTML surface for the new kind.

### Documentation

* `documentation/widgets/edit-route.md` exists and documents layout, states, interaction, and parity boundaries.
* `documentation/architecture/cluster-widget-system.md` mentions the new kind.
* `TABLEOFCONTENTS.md` links resolve.
* `ROADMAP.md` reflects the new coverage state.

### Quality gate

* `npm run check:all` passes.
* All new files remain within the 400-line budget.
* No new smell-rule violations are introduced.
* Existing bridge tests continue to pass without requiring bridge source changes.

---

## Related

* [PLAN6.md](../completed/PLAN6.md) — route-points HTML kind plan
* [core-principles.md](../../documentation/core-principles.md) — architectural principles
* [coding-standards.md](../../documentation/conventions/coding-standards.md) — UMD templates and file-size rules
* [smell-prevention.md](../../documentation/conventions/smell-prevention.md) — duplication and suppression guidance
* [active-route.md](../../documentation/widgets/active-route.md) — closest native summary-widget reference
* [route-points.md](../../documentation/widgets/route-points.md) — page-aware interaction reference
* [add-new-html-kind.md](../../documentation/guides/add-new-html-kind.md) — HTML kind authoring workflow
* [cluster-widget-system.md](../../documentation/architecture/cluster-widget-system.md) — cluster routing architecture
* [plugin-lifecycle.md](../../documentation/avnav-api/plugin-lifecycle.md) — host action bridge overview
* [interactive-widgets.md](../../documentation/avnav-api/interactive-widgets.md) — `catchAll` and passive/dispatch rules
