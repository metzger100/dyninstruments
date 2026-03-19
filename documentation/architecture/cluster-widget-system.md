# Cluster Widget System

**Status:** ✅ Implemented | Strict kind-catalog + surface-aware router architecture (Phase 8)

## Overview

`ClusterWidget` is the meta-module used by all cluster widgets. It uses a modular internal architecture:

- Thin orchestrator: `cluster/ClusterWidget.js`
- Mapping toolkit: `cluster/mappers/ClusterMapperToolkit.js`
- Cluster mapper map: `cluster/mappers/ClusterMapperRegistry.js`
- Kind/surface routing spec: `cluster/rendering/ClusterKindCatalog.js`
- Surface-aware router + shell owner: `cluster/rendering/ClusterRendererRouter.js`
- Canvas surface owner: `cluster/rendering/CanvasDomSurfaceAdapter.js`
- HTML surface owner (minimal lifecycle contract in Phase 8): `cluster/rendering/HtmlSurfaceController.js`
- Per-cluster mappers: `cluster/mappers/*.js`

## Runtime Flow

1. AvNav calls `ClusterWidget.translateFunction(props)`
2. `ClusterMapperRegistry` resolves cluster by `props.cluster || def.cluster`
3. `ClusterMapperToolkit.createToolkit(props)` provides:
- `cap(kind)`
- `unit(kind)`
- `out(value, caption, unit, formatter, formatterParameters)`
- `makeAngleFormatter(isDirection, leadingZero, fallback)`
4. Matching mapper module translates to either:
- numeric output for `ThreeValueTextWidget` (default text kinds)
- stacked pair or variant output for `PositionCoordinateWidget` (`positionBoat`/`positionWp`, vessel `dateTime`, vessel `timeStatus`)
- dedicated text-renderer output for `ActiveRouteTextWidget` (`nav` `activeRoute`)
- dedicated text-renderer output for `CenterDisplayTextWidget` (`nav` `centerDisplay`)
- graphic output with `renderer: "..."`
5. `ClusterWidget.renderHtml(props)` delegates shell rendering to `ClusterRendererRouter`
6. `ClusterRendererRouter` resolves route strictly by `props.cluster + props.kind` via `ClusterKindCatalog` (fail-closed; no unknown-kind fallback)
7. Router renders shell-first markup: `.widgetData.dyni-shell` with `data-dyni-instance`, `data-dyni-surface`, and `.dyni-kind-*`
8. Surface shell owner by route surface:
- `canvas-dom` -> `CanvasDomSurfaceAdapter.renderSurfaceShell()` (stable mount subtree)
- `html` -> `HtmlSurfaceController.renderSurfaceShell(...)`
9. Router exposes helper APIs for Phase 9 host/session wiring:
- `createSurfaceControllerFactory(hostContext)` for `SurfaceSessionController`
- `createSessionPayload(commitPayload)` to normalize `surface/rootEl/shellEl/props/revision`

Phase 8 contract note:
- Router no longer exposes `renderCanvas`.
- Router no longer performs passive fallback routing (`unknown -> ThreeValueTextWidget`).

## Mapper Modules

Current mapper modules:

- `CourseHeadingMapper.js` (`courseHeading`)
- `SpeedMapper.js` (`speed`)
- `EnvironmentMapper.js` (`environment`)
- `WindMapper.js` (`wind`)
- `NavMapper.js` (`nav`)
- `AnchorMapper.js` (`anchor`)
- `VesselMapper.js` (`vessel`)

Each module implements:

```javascript
function create(def, Helpers) {
  function translate(props, toolkit) {
    return {};
  }
  return { cluster: "clusterName", translate };
}
```

Mapper boundary:
- Keep mapper modules declarative (`create` + `translate` only).
- Mapper responsibilities: kind routing, output shape mapping, numeric normalization, renderer selection.
- Renderer responsibilities: formatter/status/display logic and layout behavior.

## Vessel Kind Contract Tuples

| kind | renderer path | store field(s) | raw unit/type | formatter contract |
|---|---|---|---|---|
| `dateTime` | `PositionCoordinateWidget` (`displayVariant: "dateTime"`) | `clock` | Date/time value | axis formatters `formatDate`/`formatTime` |
| `timeStatus` | `PositionCoordinateWidget` (`displayVariant: "timeStatus"`) | `gpsValid`, `clock` | bool-like + Date/time | status-circle formatter + `formatTime` |
| `pitch` | default `ThreeValueTextWidget` path | `pitch` | radians number or `undefined` | **mandatory:** `formatDirection` + `[true, true, false]` |
| `roll` | default `ThreeValueTextWidget` path | `roll` | radians number or `undefined` | **mandatory:** `formatDirection` + `[true, true, false]` |

Reference: [plugin-core-contracts.md](plugin-core-contracts.md), [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md), [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md).

## Kind Catalog & Surface Routing

`ClusterKindCatalog` is the single source of truth for route selection.
Each entry contains:

- `cluster`
- `kind`
- `viewModelId`
- `rendererId`
- `surface` (`html` or `canvas-dom`)

Strict routing rules:

- Missing `cluster + kind` tuple throws.
- Duplicate tuples throw at catalog build time.
- Unsupported `surface` values throw.
- Unknown `rendererId` values throw during router initialization.
- Mapper-provided `props.renderer` must match the catalog `rendererId` for the same tuple; mismatch throws.

In Phase 8, all shipped tuples use `surface: "canvas-dom"`. The `html` branch is fully wired and validated, but reserved for later phases.

## Surface-Aware Router

`ClusterRendererRouter` owns renderer inventory and surface shell routing for:

- `ThreeValueTextWidget`
- `PositionCoordinateWidget` (stacked pair text renderer for nav positions plus vessel `dateTime` / `timeStatus` variants)
- `ActiveRouteTextWidget`
- `CenterDisplayTextWidget`
- `WindRadialWidget`
- `CompassRadialWidget`
- `SpeedRadialWidget`
- `SpeedLinearWidget`
- `DepthRadialWidget`
- `DepthLinearWidget`
- `TemperatureRadialWidget`
- `TemperatureLinearWidget`
- `VoltageRadialWidget`
- `VoltageLinearWidget`
- `XteDisplayWidget`

`wantsHideNativeHead` remains aggregated (`true` if any referenced renderer requests it).

`RendererPropsWidget` still applies mapper-owned `rendererProps` merges for delegated gauge renderers.

Surface owner contract:

- `CanvasDomSurfaceAdapter.createSurfaceController(...)` -> `attach/update/detach/destroy` + optional `invalidateTheme`
- `HtmlSurfaceController.createSurfaceController(...)` -> strict `attach/update/detach/destroy` (minimal in Phase 8)

Naming boundary:
- Components under `cluster/rendering/` use role-based IDs, not cluster-prefixed IDs.

## `cluster/rendering/` Boundary

What belongs in `cluster/rendering/`:

- the router (`ClusterRendererRouter`)
- router-owned generic infrastructure (`RendererPropsWidget`)
- true sub-renderers whose primary responsibility is cluster-side rendering orchestration

What does not belong in `cluster/rendering/`:

- per-kind mapper-to-widget shim files that only forward props to a widget in `widgets/`
- translation-only logic that belongs in mappers
- adaptation logic that can live inside the target renderer as a renderer-owned variant contract

Rule:
- If multiple kinds share the same visual/layout contract, extend the existing renderer with a variant prop (for example `PositionCoordinateWidget` `displayVariant`) instead of adding a new cluster-side forwarding shim.

## Registration Rules for New Components

### New Mapper Component

Must be registered in two places:

1. `config/components.js`
- add component entry
- add dependency in `ClusterMapperRegistry.deps`
2. `cluster/mappers/ClusterMapperRegistry.js`
- add `cluster: moduleId` entry to `MAPPER_MODULE_IDS`

### New Kind Route (Cluster + Kind)

Must be updated in three places:

1. cluster config (`config/clusters/*.js`)
- add kind option/editables/store keys
2. mapper (`cluster/mappers/*Mapper.js`)
- map kind output shape and normalized props
3. kind catalog (`cluster/rendering/ClusterKindCatalog.js`)
- add strict tuple with `viewModelId`, `rendererId`, and `surface`

### New Renderer Component / Route Target

Must be registered in runtime dependency + router inventory:

1. `config/components.js`
- add renderer component entry
- add dependency in `ClusterRendererRouter.deps`
2. `cluster/rendering/ClusterRendererRouter.js`
- add `rendererName: rendererSpec` in router inventory
- if mapper uses `rendererProps`, route through `RendererPropsWidget`
- ensure catalog tuples point to the new `rendererId`

## Related

- [component-system.md](component-system.md) — component registry and dependency loading
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — `translateFunction` lifecycle
- [plugin-core-contracts.md](plugin-core-contracts.md) — core tuple schema and incident constraints
- [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md) — canonical formatter signatures
- [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md) — key/unit catalog
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md) — cluster authoring workflow
- [../guides/add-new-full-circle-dial.md](../guides/add-new-full-circle-dial.md) — full-circle dial renderer workflow
