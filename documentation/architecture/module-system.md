# Module System

**Status:** ✅ Implemented | plugin.js (MODULES registry + loadModule)

## Overview

dyninstruments uses a custom runtime module loader. Modules are UMD-wrapped JS files that register on `window.DyniModules`. plugin.js loads them via `<script>` injection with dependency resolution.

## MODULES Registry

Defined in plugin.js. Maps module IDs to file paths, globalKeys, and dependencies:

```javascript
const MODULES = {
  InstrumentComponents: {
    js: BASE + "modules/Cores/InstrumentComponents.js",
    css: undefined,
    globalKey: "DyniInstrumentComponents"
  },
  ThreeElements: {
    js: BASE + "modules/ThreeElements/ThreeElements.js",
    css: BASE + "modules/ThreeElements/ThreeElements.css",
    globalKey: "DyniThreeElements"
  },
  WindDial: {
    js: BASE + "modules/WindDial/WindDial.js",
    css: BASE + "modules/WindDial/WindDial.css",
    globalKey: "DyniWindDial",
    deps: ["InstrumentComponents"]
  },
  CompassGauge: {
    js: BASE + "modules/CompassGauge/CompassGauge.js",
    css: BASE + "modules/CompassGauge/CompassGauge.css",
    globalKey: "DyniCompassGauge",
    deps: ["InstrumentComponents"]
  },
  SpeedGauge: {
    js: BASE + "modules/SpeedGauge/SpeedGauge.js",
    globalKey: "DyniSpeedGauge",
    deps: ["InstrumentComponents"]
  },
  DepthGauge: {
    js: BASE + "modules/DepthGauge/DepthGauge.js",
    globalKey: "DyniDepthGauge",
    deps: ["InstrumentComponents"]
  },
  TemperatureGauge: {
    js: BASE + "modules/TemperatureGauge/TemperatureGauge.js",
    globalKey: "DyniTemperatureGauge",
    deps: ["InstrumentComponents"]
  },
  VoltageGauge: {
    js: BASE + "modules/VoltageGauge/VoltageGauge.js",
    globalKey: "DyniVoltageGauge",
    deps: ["InstrumentComponents"]
  },
  ClusterHost: {
    js: BASE + "modules/ClusterHost/ClusterHost.js",
    css: BASE + "modules/ClusterHost/ClusterHost.css",
    globalKey: "DyniClusterHost",
    deps: ["ThreeElements","WindDial","CompassGauge","SpeedGauge","DepthGauge","TemperatureGauge","VoltageGauge"]
  }
};
```

## Dependency Graph

```
ClusterHost
├── ThreeElements
├── WindDial ← InstrumentComponents
├── CompassGauge ← InstrumentComponents
├── SpeedGauge ← InstrumentComponents
├── DepthGauge ← InstrumentComponents
├── TemperatureGauge ← InstrumentComponents
└── VoltageGauge ← InstrumentComponents
```

All gauge/dial modules depend on InstrumentComponents. ClusterHost depends on all renderers.

## UMD Module Template

Every module follows this pattern:

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniModuleName = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    // Get dependencies via Helpers.getModule()
    const IC = Helpers.getModule('InstrumentComponents')?.create();

    function renderCanvas(canvas, props) { /* ... */ }
    function translateFunction(props) { /* ... */ }

    return {
      id: "ModuleName",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "ModuleName", create };
}));
```

**Key points:**
- `create(def, Helpers)` is called by `registerInstrument()` in plugin.js
- `def` = the cluster definition object from CLUSTERS[]
- `Helpers` = shared helper object (see [helpers.md](../shared/helpers.md))
- Dependencies accessed via `Helpers.getModule('ModuleId')` which returns `window.DyniModules[globalKey]`

## loadModule() Flow

1. Check cache (dedup)
2. Recursively load all deps first (`Promise.all(deps.map(loadModule))`)
3. Load CSS via `loadCssOnce()` (creates `<link>` element)
4. Load JS via `loadScriptOnce()` (creates `<script>` element)
5. Verify module registered on `window.DyniModules[globalKey]`
6. Return module object (has `.create()` method)

## Registration Flow

```javascript
// 1. Collect unique modules needed by all CLUSTERS
const needed = uniqueModules(INSTRUMENTS);

// 2. Load all modules (with dependency resolution)
Promise.all(needed.map(loadModule)).then((mods) => {
  // 3. Register each widget with AvNav
  INSTRUMENTS.forEach(inst => {
    registerInstrument(byId[inst.module], inst);
  });
});
```

## Adding a New Module

1. Create JS file: `modules/NewModule/NewModule.js` with UMD wrapper
2. Add to MODULES registry in plugin.js:
   ```javascript
   NewModule: {
     js: BASE + "modules/NewModule/NewModule.js",
     css: undefined,  // or path to CSS
     globalKey: "DyniNewModule",
     deps: ["InstrumentComponents"]  // if needed
   }
   ```
3. Add to ClusterHost deps if it's a renderer
4. Add CSS file if needed (optional)

## Related

- [cluster-system.md](cluster-system.md) — How ClusterHost uses loaded modules
- [../shared/helpers.md](../shared/helpers.md) — Helpers object passed to create()
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — Step-by-step guide
