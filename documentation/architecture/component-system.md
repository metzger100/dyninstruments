# Component System

**Status:** ✅ Implemented | `config/components.js` (`config.components`) + `runtime/component-loader.js` (`loadComponent`)

## Overview

dyninstruments uses a custom runtime component loader. Components are UMD-wrapped JS files that register on `window.DyniComponents`.

Ownership split:

- `plugin.js` bootstraps internal scripts (`runtime/*`, `config/*`) in fixed order
- `config/components.js` defines component registry entries
- `runtime/component-loader.js` resolves dependencies and injects component JS/CSS

## `config.components` Registry

Defined in `config/components.js`. It maps component IDs to file paths, global keys, and optional dependencies (`deps`).

`ClusterWidget` depends on modular internals instead of embedding logic in one file:

- `ClusterMapperToolkit`
- `ClusterRendererRouter`
- `ClusterMapperRegistry`

`ClusterMapperRegistry` depends on all per-cluster mapper components.
`ClusterRendererRouter` depends on all renderer components used at runtime.
`ThemeResolver` is a shared plugin-wide token resolver used by both gauge and text rendering paths.
`ThemePresets` is a shared runtime preset applier that maps preset overrides to container-level CSS vars.

## Dependency Graph

```text
ClusterWidget
├── ClusterMapperToolkit
│   └── GaugeAngleMath
├── ClusterMapperRegistry
│   ├── CourseHeadingMapper
│   ├── SpeedMapper
│   ├── EnvironmentMapper
│   ├── WindMapper
│   ├── NavMapper
│   ├── AnchorMapper
│   └── VesselMapper
└── ClusterRendererRouter
    ├── ThreeValueTextWidget
    │   ├── ThemeResolver
    │   ├── GaugeTextLayout
    │   └── GaugeValueMath
    ├── PositionCoordinateWidget
    │   ├── ThemeResolver
    │   ├── GaugeTextLayout
    │   └── GaugeValueMath
    ├── WindDialWidget
    ├── CompassGaugeWidget
    ├── SpeedGaugeWidget
    ├── DepthGaugeWidget
    ├── TemperatureGaugeWidget
    └── VoltageGaugeWidget

WindDialWidget/CompassGaugeWidget
  └── GaugeToolkit
      ├── ThemeResolver
      ├── GaugeAngleMath
      ├── GaugeTickMath
      ├── GaugeCanvasPrimitives
      ├── GaugeDialRenderer
      ├── GaugeTextLayout
      └── GaugeValueMath

SpeedGaugeWidget/DepthGaugeWidget/TemperatureGaugeWidget/VoltageGaugeWidget
  ├── SemicircleGaugeEngine
  │   └── GaugeToolkit
  └── GaugeValueMath

runtime/init.js (explicit load)
  └── ThemePresets
      └── ThemeResolver
```

`PositionCoordinateWidget` no longer depends on `ThreeValueTextWidget`; widget-to-widget coupling has been removed from the dependency graph.

## UMD Component Template

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniModuleName = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    return {};
  }

  return { id: "ComponentName", create };
}));
```

## `loadComponent()` Flow

1. Check cache (dedup)
2. Recursively load dependencies first (`Promise.all(deps.map(loadComponent))`)
3. Load CSS via `loadCssOnce()` (`<link>`)
4. Load JS via `loadScriptOnce()` (`<script>`)
5. Verify component exists on `window.DyniComponents[globalKey]` and has `create`
6. Return component object (`{ id, create }`)

## Registration Flow

`runtime/init.js` orchestration:

```javascript
const loader = runtime.createComponentLoader(config.components);
const needed = loader.uniqueComponents(config.widgetDefinitions);
if (!needed.includes("ThemePresets")) needed.push("ThemePresets");

Promise.all(needed.map(loader.loadComponent)).then(function (componentsLoaded) {
  const byId = {};
  componentsLoaded.forEach(function (c) { byId[c.id] = c; });

  config.widgetDefinitions.forEach(function (widgetDef) {
    runtime.registerWidget(byId[widgetDef.widget], widgetDef, Helpers);
  });

  runtime.applyThemePresetToRegisteredWidgets();
});
```

## Adding a New Component

1. Create UMD component file
2. Add component ID entry in `config/components.js`
3. Add `deps` to existing component IDs when needed
4. Add CSS path if required

## Related

- [cluster-widget-system.md](cluster-widget-system.md) — `ClusterWidget` modular mapper architecture
- [../shared/helpers.md](../shared/helpers.md) — `Helpers` passed to `create`
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — gauge workflow
