# Coding Standards

**Status:** ✅ Implemented | Canonical JS structure, naming, headers, and reuse rules

## Overview

Use this document for runtime-safe component structure and naming. It defines file-size limits, mandatory headers, canonical templates, and shared-utility reuse rules.

## Key Details

- Runtime components must follow UMD/IIFE registration under `window.DyniComponents`.
- No ES module `import`/`export` in plugin runtime files.
- Reusable logic belongs in shared kits, not in duplicated widget-local helpers.
- Preserve explicit falsy defaults (`""`, `0`, `false`) via property-presence/nullish checks; never use truthy fallback for configured defaults.
- Cache-owning modules must expose explicit invalidation APIs and mutation paths must call them.
- Cluster mappers are declarative routing/normalization only; formatter and presentation behavior belongs in renderer modules.

## File Size Limits

- Target: `<=400` lines per JS file.
- Shared drawing/layout logic must be split into `shared/widget-kits/gauge/` modules:
  - `GaugeAngleMath`
  - `GaugeTickMath`
  - `GaugeCanvasPrimitives`
  - `GaugeDialRenderer`
- Gauge-specific behavior stays in individual gauge component files.
- Cluster configs live under `config/clusters/`.
- If a legacy file already exceeds 400 lines, isolate new logic and avoid increasing file size further.

## Mandatory File Headers

For new or modified JS component files, include a short header block:

```javascript
/**
 * Module: [Name] - [One-line description]
 * Documentation: documentation/[path].md
 * Depends: [list of component dependencies]
 */
```

Example:

```javascript
/**
 * Module: SpeedGaugeWidget - Semicircle speedometer with warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine
 */
```

## UMD Component Template

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniComponentName = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    // Component code here
    return { id: "ComponentName" };
  }

  return { id: "ComponentName", create };
}));
```

## Naming Conventions

- Widget names: `dyninstruments_{Cluster}` (example: `dyninstruments_Speed`)
- Component `globalKey` values: `Dyni{ComponentName}` (example: `DyniSpeedGaugeWidget`)
- Gauge ratio threshold props: `{gauge}RatioThresholdNormal`, `{gauge}RatioThresholdFlat`
- Sector props: `{gauge}WarningFrom`, `{gauge}AlarmFrom`
- Per-kind caption/unit props: `caption_{kindName}`, `unit_{kindName}`
- `editableParameter` conditions: `{ kind: "xxxRadial" }` or `[{ kind: "a" }, { kind: "b" }]`
- Renderer wrappers under `cluster/rendering/` must use role-based IDs (example: `DateTimeRendererWrapper`, `TimeStatusRendererWrapper`), not cluster-prefixed IDs.

## Mapper Boundary Rules

- Keep mapper files (`cluster/mappers/*Mapper.js`) limited to `create()` and `translate()` function declarations.
- Keep mapper output declarative: select `renderer`, map values, normalize numbers, and pass-through formatter keys only.
- Do not implement formatter logic, status-symbol conversion, or rendering fallbacks inside mappers.
- Move any non-trivial logic to renderer components (`cluster/rendering/`, `widgets/`) or `ClusterMapperToolkit`.

## Widget Archetypes

Use this routing table before starting a new widget. Shared engine purposes:

- `SemicircleGaugeEngine`: shared semicircle gauge rendering flow (geometry, sectors, ticks, pointer, ratio mode).
- `FullCircleDialEngine`: shared full-circle dial rendering flow (ring/ticks, static layers, pointer and frame orchestration).
- `TextLayoutEngine`: shared text layout mode routing, fit calculation, and text draw helpers.
- Cluster renderer wrappers: role-based adapters that delegate to one of the archetypes above.

| Archetype | Shared Engine | Reference Implementation | Guide |
|---|---|---|---|
| Semicircle gauge | `SemicircleGaugeEngine` | [SpeedGaugeWidget](../../widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js) | [add-new-gauge](../guides/add-new-gauge.md) |
| Full-circle dial | `FullCircleDialEngine` | [CompassGaugeWidget](../../widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js) | [add-new-dial](../guides/add-new-full-circle-dial.md) |
| Text renderer | `TextLayoutEngine` | [ThreeValueTextWidget](../../widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js) | [add-new-text-renderer](../guides/add-new-text-renderer.md) |
| Cluster renderer wrapper | `(delegates to above)` | [DateTimeRendererWrapper](../../cluster/rendering/DateTimeRendererWrapper.js) | [add-new-cluster](../guides/add-new-cluster.md) |

Rule: Before creating any new widget, check this table. If your widget matches an archetype, use the corresponding shared engine. If it does not match any archetype, discuss with the team before creating a new engine.

## Reference Implementations

- For a new semicircle gauge: `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js` - canonical UMD wrapper, header format, and `SemicircleGaugeEngine` delegation.
- For a new shared utility facade: `shared/widget-kits/gauge/GaugeToolkit.js` - facade pattern and dependency composition across shared gauge modules.
- For a new cluster mapper: `cluster/mappers/SpeedMapper.js` - `translate(props, toolkit)` mapping pattern and renderer routing output shape.

## Shared Utilities

Reusable logic MUST go in `shared/widget-kits/`. Never duplicate functions across widgets.

Current shared utilities include:
- `GaugeValueMath.clamp()`
- `GaugeValueMath.isFiniteNumber()`
- `GaugeValueMath.extractNumberText()`
- `GaugeValueMath.buildHighEndSectors()`
- `GaugeValueMath.buildLowEndSectors()`
- `GaugeValueMath.formatSpeedString()`
- `GaugeValueMath.formatAngle180()`
- `GaugeValueMath.formatDirection360()`
- `GaugeValueMath.computeMode()`
- `GaugeValueMath.computeSemicircleGeometry()`
- `GaugeTextLayout.setFont()`
- `GaugeTextLayout.fitSingleTextPx()`
- `GaugeTextLayout.drawDisconnectOverlay()`
- `Helpers.applyFormatter()`

Check these before writing any helper function. For shared gauge utility APIs, see [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md).

## Related

- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md)
- [../architecture/component-system.md](../architecture/component-system.md)
