# Component System

**Status:** ✅ Implemented | `config/components/registry-*.js` fragments + `config/components.js` assembler + `runtime/component-loader.js` (`loadComponent`)

## Overview

dyninstruments uses a custom runtime component loader. Components are UMD-wrapped JS files that register on `window.DyniComponents`.

Ownership split:

- `plugin.js` bootstraps internal scripts (`runtime/*`, `config/*`) in fixed order
- `plugin.js` exposes canonical `runtime.loadScriptOnce(id, src)` before internal script bootstrap
- `config/components/registry-*.js` define domain-specific component registry fragments
- `config/components.js` fail-closed assembles fragments into `config.components`
- `runtime/component-loader.js` resolves dependencies and injects component JS/CSS
- `runtime/PerfSpanHelper.js` exposes runtime perf-span API for runtime IIFE modules
- `runtime/HostCommitController.js` provides deferred commit scheduling for HTML-shell mounting
- `runtime/SurfaceSessionController.js` owns per-instance `html`/`canvas-dom` lifecycle state

## `config.components` Registry

`config.components` is assembled from these fragment groups:

- `config/components/registry-shared-foundation.js` (`sharedFoundation`)
- `config/components/registry-shared-engines.js` (`sharedEngines`)
- `config/components/registry-widgets.js` (`widgets`)
- `config/components/registry-cluster.js` (`cluster`)

`config/components.js` merges groups in fixed order (`sharedFoundation -> sharedEngines -> widgets -> cluster`) and fail-closes when:

- a required group is missing
- duplicate component IDs exist across groups

The final assembled map still uses the same component ID -> `{ js, css, globalKey, deps }` shape consumed by `runtime/component-loader.js`.

`ClusterWidget` depends on modular internals instead of embedding logic in one file:

- `ClusterMapperToolkit`
- `ClusterRendererRouter`
- `ClusterMapperRegistry`

`ClusterMapperRegistry` depends on all per-cluster mapper components.
`ClusterRendererRouter` depends on kind/surface routing owners plus renderer components used at runtime.
`ThemeResolver` is a shared plugin-wide token resolver used by both gauge and text rendering paths.
`ThemePresets` is a shared runtime preset applier that sets `data-dyni-theme` on container roots and owns canonical preset normalization (`normalizePresetName`).
`PerfSpanHelper` is a shared UMD owner for perf-span start/end behavior used by cluster UMD consumers.
`HtmlWidgetUtils` is a shared UMD owner for HTML-widget utility helpers (`escapeHtml`, `toStyleAttr`, ratio/shell helpers).
Dedicated nav renderers may also depend on shared layout-owner modules that consume `ResponsiveScaleProfile`.

## Dependency Graph

```text
ClusterWidget
├── PerfSpanHelper
├── ClusterMapperToolkit
│   └── RadialAngleMath
├── ClusterMapperRegistry
│   ├── CourseHeadingMapper
│   ├── SpeedMapper
│   ├── EnvironmentMapper
│   ├── WindMapper
│   ├── NavMapper
│   ├── MapMapper
│   ├── AnchorMapper
│   └── VesselMapper
└── ClusterRendererRouter
    ├── PerfSpanHelper
    ├── ClusterKindCatalog
    ├── CanvasDomSurfaceAdapter
    │   ├── ThemeResolver
    │   └── PerfSpanHelper
    ├── HtmlSurfaceController
    │   └── PerfSpanHelper
    ├── ThreeValueTextWidget
    │   ├── ThemeResolver
    │   └── TextLayoutEngine
    ├── PositionCoordinateWidget
    │   ├── ThemeResolver
    │   └── TextLayoutEngine
    ├── ActiveRouteTextHtmlWidget
    │   ├── ActiveRouteHtmlFit
    │   │   ├── ThemeResolver
    │   │   ├── RadialTextLayout
    │   │   ├── TextTileLayout
    │   │   └── ActiveRouteLayout
    │   │       └── ResponsiveScaleProfile
    │   └── HtmlWidgetUtils
    ├── MapZoomTextHtmlWidget
    │   ├── MapZoomHtmlFit
    │   │   ├── TextLayoutEngine
    │   │   ├── HtmlWidgetUtils
    │   │   └── ThemeResolver
    │   └── HtmlWidgetUtils
    ├── RendererPropsWidget
    │   ├── WindRadialWidget
    │   ├── CompassRadialWidget
    │   ├── WindLinearWidget
    │   ├── CompassLinearWidget
    │   ├── SpeedRadialWidget
    │   ├── SpeedLinearWidget
    │   ├── DepthRadialWidget
    │   ├── DepthLinearWidget
    │   ├── TemperatureRadialWidget
    │   ├── TemperatureLinearWidget
    │   ├── VoltageRadialWidget
    │   ├── VoltageLinearWidget
    │   └── XteDisplayWidget
    │       ├── RadialToolkit
    │       ├── CanvasLayerCache
    │       ├── XteHighwayPrimitives
    │       ├── XteHighwayLayout
    │       │   └── ResponsiveScaleProfile
    │       └── TextTileLayout

WindRadialWidget/CompassRadialWidget
  ├── FullCircleRadialEngine
  │   ├── RadialToolkit
  │   └── CanvasLayerCache
  └── FullCircleRadialTextLayout

SpeedRadialWidget/DepthRadialWidget/TemperatureRadialWidget/VoltageRadialWidget
  ├── SemicircleRadialEngine
  │   └── RadialToolkit
  └── RadialValueMath

TextLayoutEngine
  ├── RadialValueMath
  ├── TextLayoutPrimitives
  │   └── RadialTextLayout
  └── TextLayoutComposite
      └── TextLayoutPrimitives

runtime/init.js (explicit load)
  └── ThemePresets

runtime/HostCommitController.js
  └── runtime/PerfSpanHelper.js API (`runtime.getPerfSpanApi()`)

runtime/SurfaceSessionController.js
  └── runtime/PerfSpanHelper.js API (`runtime.getPerfSpanApi()`)
```

`PositionCoordinateWidget` no longer depends on `ThreeValueTextWidget`; widget-to-widget coupling has been removed from the dependency graph.
`ClusterRendererRouter` uses strict kind-catalog routing and does not expose a host `renderCanvas` delegation path.

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

In the current init flow, theme presets are applied to discovered `.widget.dyniplugin` roots directly after widget registration.

## Adding a New Component

1. Create UMD component file
2. Add component ID entry in the correct fragment file under `config/components/`
3. Add `deps` to existing component IDs when needed (usually same fragment, or cross-fragment by ID)
4. Add CSS path if required
5. If the component should be loaded as a `ClusterWidget` renderer/mapper dependency, update the owning dependency list entry (for example `ClusterRendererRouter` or `ClusterMapperRegistry`) in the same fragment model

## Related

- [cluster-widget-system.md](cluster-widget-system.md) — `ClusterWidget` modular mapper architecture
- [host-commit-controller.md](host-commit-controller.md) — standalone deferred commit controller API
- [../shared/helpers.md](../shared/helpers.md) — `Helpers` passed to `create`
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — gauge workflow
- [../guides/add-new-full-circle-dial.md](../guides/add-new-full-circle-dial.md) — full-circle dial workflow
