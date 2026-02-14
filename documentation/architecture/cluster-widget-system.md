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
- numeric output for `ThreeValueTextWidget`
- graphic output with `renderer: "..."`
5. `ClusterWidget.renderCanvas()` delegates to `ClusterRendererRouter`, which picks renderer by `props.renderer`
6. `ClusterWidget.finalizeFunction()` fans out to all sub-renderers and tolerates renderer-local finalize errors

## Mapper Modules

Current mapper modules:

- `CourseHeadingMapper.js` (`courseHeading`)
- `SpeedMapper.js` (`speed`)
- `PositionMapper.js` (`position`)
- `DistanceMapper.js` (`distance`)
- `EnvironmentMapper.js` (`environment`)
- `WindMapper.js` (`wind`)
- `TimeMapper.js` (`time`)
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

## Renderer Delegation

`ClusterRendererRouter` manages these sub-renderers:

- `ThreeValueTextWidget` (default fallback)
- `WindDialWidget`
- `CompassGaugeWidget`
- `SpeedGaugeWidget`
- `DepthGaugeWidget`
- `TemperatureGaugeWidget`
- `VoltageGaugeWidget`

`wantsHideNativeHead` is aggregated (`true` if any sub-renderer requests it).

## Registration Rules for New Components

### New Mapper Component

Must be registered in two places:

1. `config/components.js`
- add component entry
- add dependency in `ClusterMapperRegistry.deps`
2. `cluster/mappers/ClusterMapperRegistry.js`
- add component ID to `mapperIds`

### New Renderer Component

Must be registered in two places:

1. `config/components.js`
- add renderer component entry
- add dependency in `ClusterRendererRouter.deps`
2. `cluster/rendering/ClusterRendererRouter.js`
- instantiate in `create()`
- include in `subSpecs`
- add selection branch in `pickRenderer()`

## Related

- [component-system.md](component-system.md) — component registry and dependency loading
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — `translateFunction` lifecycle
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md) — cluster authoring workflow
