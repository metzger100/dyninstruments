# Cluster Widget System

**Status:** ✅ Implemented | Modular `ClusterWidget` mapper architecture

## Overview

`ClusterWidget` is the meta-module used by all cluster widgets. It uses a modular internal architecture:

- Thin orchestrator: `cluster/ClusterWidget.js`
- Mapping toolkit: `cluster/mappers/ClusterMapperToolkit.js`
- Cluster mapper map: `cluster/mappers/ClusterMapperRegistry.js`
- Renderer lifecycle/delegation: `cluster/rendering/ClusterRendererRouter.js`
- Standalone canvas-dom surface adapter foundation (Phase 7): `cluster/rendering/CanvasDomSurfaceAdapter.js`
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
5. `ClusterWidget.initFunction()` delegates one-time initialization to the active renderer selected by the init-call props
6. `ClusterWidget.renderCanvas()` / `ClusterWidget.renderHtml()` delegate to `ClusterRendererRouter`, which picks renderer by `props.renderer`
7. `ClusterWidget.finalizeFunction()` fans out to all sub-renderers and tolerates renderer-local finalize errors

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

## Renderer Delegation

`ClusterRendererRouter` manages these sub-renderers:

- `ThreeValueTextWidget` (default fallback)
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

`wantsHideNativeHead` is aggregated (`true` if any sub-renderer requests it).

Phase 7 status note:
- `CanvasDomSurfaceAdapter` is implemented as a standalone module and tested in isolation.
- Router/Cluster wiring to this adapter is intentionally deferred to later PLAN1 phases.

Sub-renderer capability contract:

- pure canvas renderer: implements `renderCanvas(canvas, props)`
- pure HTML renderer: implements `renderHtml(props)`
- mixed renderer: may implement both render paths
- optional lifecycle hooks: `initFunction(...)` for active-renderer setup, `finalizeFunction(...)` for defensive cleanup fan-out
- `RendererPropsWidget` applies mapper-owned `rendererProps` merges consistently across delegated canvas render, HTML render, and init calls

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

### New Renderer Component

Must be registered in two places:

1. `config/components.js`
- add renderer component entry
- add dependency in `ClusterRendererRouter.deps`
2. `cluster/rendering/ClusterRendererRouter.js`
- add `rendererName: rendererSpec` entry in `rendererSpecs` map

## Related

- [component-system.md](component-system.md) — component registry and dependency loading
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — `translateFunction` lifecycle
- [plugin-core-contracts.md](plugin-core-contracts.md) — core tuple schema and incident constraints
- [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md) — canonical formatter signatures
- [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md) — key/unit catalog
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md) — cluster authoring workflow
- [../guides/add-new-full-circle-dial.md](../guides/add-new-full-circle-dial.md) — full-circle dial renderer workflow
