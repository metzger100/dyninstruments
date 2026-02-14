# Module System

**Status:** ✅ Implemented | `config/modules.js` (`config.modules`) + `core/module-loader.js` (`loadModule`)

## Overview

dyninstruments uses a custom runtime module loader. Modules are UMD-wrapped JS files that register on `window.DyniModules`. `plugin.js` bootstraps internal scripts, and `core/module-loader.js` loads renderer/config modules via `<script>` injection with dependency resolution.

## `MODULES` Registry

Defined in `config/modules.js` (`config.modules`). It maps module IDs to file paths, global keys, and optional dependencies (`deps`).

`ClusterHost` now depends on internal modules instead of embedding all logic in one file:

- `ClusterHostTranslateUtils`
- `ClusterHostRendererRegistry`
- `ClusterHostDispatchRegistry`

`ClusterHostDispatchRegistry` depends on all per-cluster dispatch modules.
`ClusterHostRendererRegistry` depends on all renderer modules used at runtime.

## Dependency Graph

```text
ClusterHost
├── ClusterHostTranslateUtils
├── ClusterHostDispatchRegistry
│   ├── ClusterHostDispatchCourseHeading
│   ├── ClusterHostDispatchSpeed
│   ├── ClusterHostDispatchPosition
│   ├── ClusterHostDispatchDistance
│   ├── ClusterHostDispatchEnvironment
│   ├── ClusterHostDispatchWind
│   ├── ClusterHostDispatchTime
│   ├── ClusterHostDispatchNav
│   ├── ClusterHostDispatchAnchor
│   └── ClusterHostDispatchVessel
└── ClusterHostRendererRegistry
    ├── ThreeElements
    ├── WindDial
    ├── CompassGauge
    ├── SpeedGauge
    ├── DepthGauge
    ├── TemperatureGauge
    └── VoltageGauge

WindDial/CompassGauge
  └── GaugeUtils
      ├── GaugeAngleUtils
      ├── GaugeTickUtils
      ├── GaugePrimitiveDrawUtils
      ├── GaugeDialDrawUtils
      ├── GaugeTextUtils
      └── GaugeValueUtils

SpeedGauge/DepthGauge/TemperatureGauge/VoltageGauge
  └── SemicircleGaugeRenderer
      └── GaugeUtils
```

## UMD Module Template

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniModuleName = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    return {};
  }

  return { id: "ModuleName", create };
}));
```

## `loadModule()` Flow

1. Check cache (dedup).
2. Recursively load dependencies first (`Promise.all(deps.map(loadModule))`).
3. Load CSS via `loadCssOnce()` (`<link>`).
4. Load JS via `loadScriptOnce()` (`<script>`).
5. Verify module exists on `window.DyniModules[globalKey]` and has `create`.
6. Return module object (`{ id, create }`).

## Registration Flow

```javascript
const needed = loader.uniqueModules(config.instruments);
Promise.all(needed.map(loader.loadModule)).then((mods) => {
  config.instruments.forEach(inst => registerInstrument(byId[inst.module], inst, Helpers));
});
```

## Adding a New Module

1. Create JS module file using the UMD template.
2. Add module ID entry in `config/modules.js`.
3. Set `deps` to existing module IDs when needed.
4. Add CSS path if required.

## Related

- [cluster-system.md](cluster-system.md) — `ClusterHost` modular dispatch architecture
- [../shared/helpers.md](../shared/helpers.md) — `Helpers` passed to `create`
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — step-by-step gauge workflow
