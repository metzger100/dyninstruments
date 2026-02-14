# Module System

**Status:** ✅ Implemented | plugin.js (`MODULES` registry + `loadModule`)

## Overview

dyninstruments uses a custom runtime module loader. Modules are UMD-wrapped JS files that register on `window.DyniModules`. `plugin.js` loads them via `<script>` injection with dependency resolution.

## `MODULES` Registry

Defined in `plugin.js`. It maps module IDs to file paths, global keys, and dependencies.

```javascript
const MODULES = {
  GaugeAngleUtils: { js: BASE + "modules/Cores/GaugeAngleUtils.js", globalKey: "DyniGaugeAngleUtils" },
  GaugeTickUtils: { js: BASE + "modules/Cores/GaugeTickUtils.js", globalKey: "DyniGaugeTickUtils" },
  GaugePrimitiveDrawUtils: {
    js: BASE + "modules/Cores/GaugePrimitiveDrawUtils.js",
    globalKey: "DyniGaugePrimitiveDrawUtils",
    deps: ["GaugeAngleUtils"]
  },
  GaugeDialDrawUtils: {
    js: BASE + "modules/Cores/GaugeDialDrawUtils.js",
    globalKey: "DyniGaugeDialDrawUtils",
    deps: ["GaugeAngleUtils", "GaugeTickUtils", "GaugePrimitiveDrawUtils"]
  },
  GaugeTextUtils: { js: BASE + "modules/Cores/GaugeTextUtils.js", globalKey: "DyniGaugeTextUtils" },
  GaugeValueUtils: {
    js: BASE + "modules/Cores/GaugeValueUtils.js",
    globalKey: "DyniGaugeValueUtils",
    deps: ["GaugeAngleUtils"]
  },
  GaugeUtils: {
    js: BASE + "modules/Cores/GaugeUtils.js",
    globalKey: "DyniGaugeUtils",
    deps: ["GaugeTextUtils","GaugeValueUtils","GaugeAngleUtils","GaugeTickUtils","GaugePrimitiveDrawUtils","GaugeDialDrawUtils"]
  },
  SemicircleGaugeRenderer: {
    js: BASE + "modules/Cores/SemicircleGaugeRenderer.js",
    globalKey: "DyniSemicircleGaugeRenderer",
    deps: ["GaugeUtils"]
  },
  WindDial: { js: BASE + "modules/WindDial/WindDial.js", globalKey: "DyniWindDial", deps: ["GaugeUtils"] },
  CompassGauge: { js: BASE + "modules/CompassGauge/CompassGauge.js", globalKey: "DyniCompassGauge", deps: ["GaugeUtils"] },
  // ... other modules
};
```

## Dependency Graph

```text
ClusterHost
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
    const gaugeUtils = Helpers.getModule("GaugeUtils")?.create(def, Helpers);
    function renderCanvas(canvas, props) { /* ... */ }
    function translateFunction(props) { /* ... */ }
    return { id: "ModuleName", wantsHideNativeHead: true, renderCanvas, translateFunction };
  }

  return { id: "ModuleName", create };
}));
```

## `loadModule()` Flow

1. Check cache (dedup).
2. Recursively load all dependencies first (`Promise.all(deps.map(loadModule))`).
3. Load CSS via `loadCssOnce()` (`<link>`).
4. Load JS via `loadScriptOnce()` (`<script>`).
5. Verify module is present on `window.DyniModules[globalKey]`.
6. Return module object (`{ id, create }`).

## Registration Flow

```javascript
const needed = uniqueModules(INSTRUMENTS);
Promise.all(needed.map(loadModule)).then((mods) => {
  INSTRUMENTS.forEach(inst => registerInstrument(byId[inst.module], inst));
});
```

## Adding a New Module

1. Create `modules/NewModule/NewModule.js` with UMD wrapper.
2. Add it to `MODULES` in `plugin.js`.
3. Declare `deps` using module IDs already in `MODULES`.
4. Add CSS path if needed.

## Related

- [cluster-system.md](cluster-system.md) — how ClusterHost uses loaded modules
- [../shared/helpers.md](../shared/helpers.md) — `Helpers` passed to `create`
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — step-by-step guide
