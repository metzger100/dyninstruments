# EditRoute HTML Renderer

**Status:** ✅ Implemented | `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`

## Overview

`editRoute` is a native HTML nav kind (`surface: "html"`) that reproduces the core EditRoute summary role and opens the host edit-route workflow when dispatch is available.

Route tuple:

- `cluster: "nav"`
- `kind: "editRoute"`
- `renderer: "EditRouteTextHtmlWidget"`

## Key Details

- Core parity scope keeps the same summary/workflow-entry role, but dyn flat density intentionally diverges from core horizontal by also showing `RTE`/`ETA`.
- Captions are configurable for all four metrics (`PTS`, `DST`, `RTE`, `ETA`).
- Distance units are configurable for `DST` and `RTE` metric tiles.
- Dyninstruments follow-up fix: default visible remaining-distance caption is `RTE` (core AvNav still labels this field `RTG` in some surfaces).
- Host workflow remains host-owned (`EditRouteDialog`, point editing, rename/load/save/delete, writable prompts).
- Source route is always `editingRoute` (not active-route leg state).
- Active-state rule is exact raw-name equality: `editingRoute.name === activeName`.
- Local/server source semantics follow route-name rules:
- local route name prefix `local@` is stripped for display.
- local route shows a `LOCAL` badge in the name bar.
- non-local/server route shows no source badge.
- Mode mapping:
- `flat` -> dyn follow-up compact two-band density (`name`, `PTS`, `DST`, `RTE`, `ETA`)
- `normal`/`high` -> core non-horizontal-equivalent density (`name`, `PTS`, `DST`, `RTE`, `ETA`)
- `.widgetContainer.vertical` forces `high` and applies native shell profile (`height:auto; aspect-ratio:7/8; min-height:8em;`).
- No-route contract: show `No Route` in the name area and omit metric boxes.

Core source references:

- `viewer/components/EditRouteWidget.jsx`
- `viewer/nav/routeeditor.js`
- `viewer/gui/EditRoutePage.jsx`

## Ownership

- `cluster/viewmodels/EditRouteViewModel.js`: editing-route normalization, active/local/server flags, total-distance derivation, active-gated `remainingDistance`/`eta`.
- `shared/widget-kits/nav/EditRouteRenderModel.js`: renderer-facing model + formatter composition + dispatch gate + resize signature inputs.
- `shared/widget-kits/nav/EditRouteLayout.js`: mode resolution, metric/name measurement geometry, committed vertical shell profile.
- `shared/widget-kits/nav/EditRouteHtmlFit.js`: per-box text-fit styles (`font-size:<n>px;` only).
- `shared/widget-kits/nav/EditRouteMarkup.js`: escaped HTML assembly + wrapper state classes + dispatch/passive click attributes.
- `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js`: HTML shell lifecycle orchestration (`renderHtml`, `namedHandlers`, `resizeSignature`, attach-time corrective rerender).

## Module Registration

```javascript
EditRouteTextHtmlWidget: {
  js: BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js",
  css: BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css",
  globalKey: "DyniEditRouteTextHtmlWidget",
  deps: ["EditRouteHtmlFit", "HtmlWidgetUtils", "EditRouteRenderModel", "EditRouteMarkup"]
}
```

Kind catalog tuple:

```javascript
{ cluster: "nav", kind: "editRoute", viewModelId: "EditRouteViewModel", rendererId: "EditRouteTextHtmlWidget", surface: "html" }
```

## Props

`NavMapper` returns grouped payload for `kind === "editRoute"`:

| Prop | Type | Default | Description |
|---|---|---|---|
| `domain.hasRoute` | boolean | `false` | Route-present state |
| `domain.routeName` | string | `""` | Display name (local prefix stripped) |
| `domain.pointCount` | number | `0` | `editingRoute.points.length` |
| `domain.totalDistance` | number \| `undefined` | `undefined` | Total route distance (meters) |
| `domain.remainingDistance` | number \| `undefined` | `undefined` | Active-route-gated remaining distance |
| `domain.eta` | Date-like \| `undefined` | `undefined` | Active-route-gated ETA |
| `domain.isActiveRoute` | boolean | `false` | Exact active-name parity flag |
| `domain.isLocalRoute` | boolean | `false` | Local route source flag |
| `domain.isServerRoute` | boolean | `false` | Server route source flag |
| `layout.ratioThresholdNormal` | number | `1.2` | Ratio below this resolves `high` |
| `layout.ratioThresholdFlat` | number | `3.8` | Ratio above this resolves `flat` |
| `captions.pts` | string | `"PTS"` | PTS caption text |
| `captions.dst` | string | `"DST"` | DST caption text |
| `captions.rte` | string | `"RTE"` | Remaining-distance caption text |
| `captions.eta` | string | `"ETA"` | ETA caption text |
| `units.dst` | string | `"nm"` | DST distance unit text + `formatDistance` parameter |
| `units.rte` | string | `"nm"` | RTE distance unit text + `formatDistance` parameter |
| `default` | string | `"---"` | Formatter placeholder fallback |
| `editing` / `dyniLayoutEditing` | boolean | `false` | Forces passive interaction mode |

Nav-cluster store keys:

- `editingRoute`, `editingIndex`, `activeName`, `useRhumbLine`, `rteDistance`, `rteEta`

## Visual Contract

### Wrapper State Classes

| Class | Meaning |
|---|---|
| `dyni-edit-route-html` | Base wrapper |
| `dyni-edit-route-mode-flat` / `-normal` / `-high` | Mode state |
| `dyni-edit-route-active-route` | Active-route visual state |
| `dyni-edit-route-local-route` | Local source-state marker |
| `dyni-edit-route-no-route` | No-route state |
| `dyni-edit-route-open-dispatch` | Dispatch click ownership is active |
| `dyni-edit-route-open-passive` | Widget is display-only |

### Element Contract

| Selector | Purpose |
|---|---|
| `.dyni-edit-route-name-bar` | Name row/container |
| `.dyni-edit-route-name-text` | Route name / `No Route` text |
| `.dyni-edit-route-source-badge` | Local route badge (`LOCAL`) |
| `.dyni-edit-route-metrics` | Metrics container |
| `.dyni-edit-route-metric-*` | Metric tiles in `flat`/`normal` |
| `.dyni-edit-route-metric-row` | Metric rows in `high` |
| `.dyni-edit-route-open-hotspot` | Full-surface dispatch hotspot (`onclick="editRouteOpen"`) |

## Layout Modes

| Mode | Route Present | No Route |
|---|---|---|
| `flat` | `name + PTS + DST + RTE + ETA` | `No Route` only |
| `normal` | `name + PTS + DST + RTE + ETA` (2x2 metrics) | `No Route` only |
| `high` | `name + PTS + DST + RTE + ETA` (4 stacked metric rows) | `No Route` only |

Field-order contract:

1. `PTS`
2. `DST`
3. `RTE`
4. `ETA`

Visibility rules:

- `RTE` and `ETA` render in `flat`/`normal`/`high` whenever a route exists.
- Inactive routes keep `RTE`/`ETA` placeholders (`---`) in every route-present mode.
- `flat` uses top-row name + bottom metrics topology with metric order `PTS`, `DST`, `RTE`, `ETA`.
- `flat` renders `DST`/`RTE` units below values and renders `PTS`/`ETA` without unit nodes.
- `normal`/`high` keep inline value/unit composition.

Vertical behavior (`.widgetContainer.vertical`):

- committed vertical ancestry forces `high`
- wrapper style profile: `height:auto; aspect-ratio:7/8; min-height:8em;`
- width-driven effective layout height is used for layout/fit and resize-signature stability

## Interaction Contract

Dispatch gate (`canOpenEditRoute`) requires all:

1. not in layout-editing mode
2. `hostActions.getCapabilities()` available
3. `hostActions.routeEditor.openEditRoute()` available
4. `capabilities.routeEditor.openEditRoute === "dispatch"`

Dispatch-mode behavior:

- wrapper includes `onclick="catchAll"`
- full-surface hotspot includes `onclick="editRouteOpen"`
- `namedHandlers()` returns `{ editRouteOpen }` only

Passive behavior:

- no wrapper `onclick`
- no hotspot element
- `namedHandlers()` returns `{}`

Supported page behavior:

| Host context | Capability state | Widget behavior |
|---|---|---|
| `editroutepage` | `dispatch` | Opens host edit-route workflow |
| `navpage` | `unsupported` | Passive summary |
| `gpspage` | `unsupported` | Passive summary |
| layout-editing mode (any page) | forced passive | Passive summary |

## Out Of Scope

Widget intentionally does not implement:

- rename/load/download/delete/save-as/save route actions
- stop-navigation actions
- route-points list editing, reordering, inversion, or empty operations
- waypoint dialog workflows
- writable/disconnected decision logic (`checkRouteWritable` equivalent)

These remain host-owned workflow behavior.

## State Examples

- no route: name bar shows `No Route`, no metrics, dispatch/passive class depends on capability.
- active server route in `normal`: name bar + `PTS/DST/RTE/ETA` with populated `RTE/ETA`, no `LOCAL` badge.
- inactive local route in `high`: name bar + `LOCAL` badge + stacked metric rows, `RTE/ETA` placeholders.
- passive page (`navpage`/`gpspage`): normal rendering remains visible but no `catchAll`/hotspot click ownership.

## Tests

- `tests/cluster/viewmodels/EditRouteViewModel.test.js`
- `tests/shared/nav/EditRouteLayout.test.js`
- `tests/shared/nav/EditRouteHtmlFit.test.js`
- `tests/shared/nav/EditRouteRenderModel.test.js`
- `tests/shared/nav/EditRouteMarkup.test.js`
- `tests/cluster/rendering/EditRouteTextHtmlWidget.test.js`

## Related

- [active-route.md](active-route.md)
- [route-points.md](route-points.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/interactive-widgets.md](../avnav-api/interactive-widgets.md)
- [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md)
