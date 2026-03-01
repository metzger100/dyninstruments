# Cluster Widget System

**Status:** ✅ Implemented | Modular `ClusterWidget` mapper architecture

## Overview

`ClusterWidget` is the meta-module used by all cluster widgets. It uses a modular internal architecture:

- Thin orchestrator: `cluster/ClusterWidget.js`
- Mapping toolkit: `cluster/mappers/ClusterMapperToolkit.js`
- Cluster mapper map: `cluster/mappers/ClusterMapperRegistry.js`
- Renderer lifecycle/delegation: `cluster/rendering/ClusterRendererRouter.js`
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
- stacked pair output for `PositionCoordinateWidget` (`positionBoat`/`positionWp`)
- vessel-specific stacked pair output via `DateTimeRendererWrapper` and `TimeStatusRendererWrapper` (both delegate rendering to `PositionCoordinateWidget`)
- graphic output with `renderer: "..."`
5. `ClusterWidget.renderCanvas()` delegates to `ClusterRendererRouter`, which picks renderer by `props.renderer`
6. `ClusterWidget.finalizeFunction()` fans out to all sub-renderers and tolerates renderer-local finalize errors

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
| `dateTime` | `DateTimeRendererWrapper` -> `PositionCoordinateWidget` | `clock` | Date/time value | `formatDateTime` + axis formatters `formatDate`/`formatTime` |
| `timeStatus` | `TimeStatusRendererWrapper` -> `PositionCoordinateWidget` | `gpsValid`, `clock` | bool-like + Date/time | status-circle formatter + `formatTime` |
| `pitch` | default `ThreeValueTextWidget` path | `pitch` | radians number or `undefined` | **mandatory:** `formatDirection` + `[true, true, false]` |
| `roll` | default `ThreeValueTextWidget` path | `roll` | radians number or `undefined` | **mandatory:** `formatDirection` + `[true, true, false]` |

Reference: [plugin-core-contracts.md](plugin-core-contracts.md), [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md), [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md).

## Renderer Delegation

`ClusterRendererRouter` manages these sub-renderers:

- `ThreeValueTextWidget` (default fallback)
- `PositionCoordinateWidget` (stacked pair renderer for nav positions; self-contained and no longer delegates flat mode to another widget)
- `DateTimeRendererWrapper` (vessel date/time wrapper that forwards to `PositionCoordinateWidget`)
- `TimeStatusRendererWrapper` (vessel gps-status/time wrapper that forwards to `PositionCoordinateWidget`)
- `WindRadialWidget`
- `CompassRadialWidget`
- `SpeedRadialWidget`
- `DepthRadialWidget`
- `TemperatureRadialWidget`
- `VoltageRadialWidget`
- `XteDisplayWidget`

`wantsHideNativeHead` is aggregated (`true` if any sub-renderer requests it).

Naming boundary:
- Components under `cluster/rendering/` use role-based IDs, not cluster-prefixed IDs.

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
