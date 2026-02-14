# Cluster System

**Status:** ✅ Implemented | Modular `ClusterHost` dispatcher architecture

## Overview

`ClusterHost` is the meta-module used by all cluster widgets. It now uses a modular internal architecture:

- Thin orchestrator: `modules/ClusterHost/ClusterHost.js`
- Translation toolkit: `modules/ClusterHost/Core/TranslateUtils.js`
- Cluster dispatch map: `modules/ClusterHost/Core/DispatchRegistry.js`
- Renderer lifecycle/delegation: `modules/ClusterHost/Core/RendererRegistry.js`
- Per-cluster translators: `modules/ClusterHost/Dispatch/*.js`

This keeps translation logic isolated per cluster while preserving existing behavior.

## Runtime Flow

1. AvNav calls `ClusterHost.translateFunction(props)`.
2. `DispatchRegistry` resolves cluster by `props.cluster || def.cluster`.
3. `TranslateUtils.createToolkit(props)` provides:
   - `cap(kind)`
   - `unit(kind)`
   - `out(value, caption, unit, formatter, formatterParameters)`
   - `makeAngleFormatter(isDirection, leadingZero, fallback)`
4. Matching dispatch module translates to either:
   - Numeric output for `ThreeElements`
   - Graphic output with `renderer: "..."`
5. `ClusterHost.renderCanvas()` delegates to `RendererRegistry`, which picks renderer by `props.renderer`.
6. `ClusterHost.finalizeFunction()` fans out to all sub-renderers and tolerates renderer-local finalize errors.

## Dispatch Modules

Current dispatch modules:

- `CourseHeading.js` (`courseHeading`)
- `Speed.js` (`speed`)
- `Position.js` (`position`)
- `Distance.js` (`distance`)
- `Environment.js` (`environment`)
- `Wind.js` (`wind`)
- `Time.js` (`time`)
- `Nav.js` (`nav`)
- `Anchor.js` (`anchor`)
- `Vessel.js` (`vessel`)

Each module implements:

```javascript
function create(def, Helpers) {
  function translate(props, toolkit) {
    // cluster-specific mapping
    return {};
  }
  return { cluster: "clusterName", translate };
}
```

## Renderer Delegation

`RendererRegistry` manages these sub-renderers:

- `ThreeElements` (default fallback)
- `WindDial`
- `CompassGauge`
- `SpeedGauge`
- `DepthGauge`
- `TemperatureGauge`
- `VoltageGauge`

`wantsHideNativeHead` is aggregated (`true` if any sub-renderer requests it).

## Adding or Changing a Cluster

1. Update cluster config in `config/clusters/*.js` and kind defaults in `config/shared/kind-maps.js`.
2. Add or update a dispatch module in `modules/ClusterHost/Dispatch/`.
3. Register the dispatch module in `config/modules.js`.
4. Add it to `ClusterHostDispatchRegistry.deps` in `config/modules.js`.
5. If a new graphic renderer is introduced, wire it in:
   - `config/modules.js`
   - `modules/ClusterHost/Core/RendererRegistry.js`

## Related

- [module-system.md](module-system.md) — module registry and dependency loading
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md) — `translateFunction` lifecycle
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md) — cluster authoring workflow
