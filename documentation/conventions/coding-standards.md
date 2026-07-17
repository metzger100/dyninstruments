# Coding Standards

**Status:** ✅ Implemented | Canonical JS structure, naming, doc comments, and reuse rules

## Overview

Use this document for runtime-safe component structure and naming. It defines file-size limits, focused file doc comments, canonical templates, and shared-utility reuse rules.

## Key Details

- Runtime components must follow UMD/IIFE registration under `window.DyniComponents`.
- No ES module `import`/`export` in plugin runtime files.
- Cluster host registration uses `renderHtml`; host `renderCanvas` is not the cluster path.
- Internal canvas rendering remains valid through `CanvasDomSurfaceAdapter` and renderer `renderCanvas(canvas, props)` callbacks.
- Reusable logic belongs in shared kits, not in duplicated widget-local helpers.
- Preserve explicit falsy defaults (`""`, `0`, `false`) via property-presence/nullish checks; never use truthy fallback for configured defaults.
- Cache-owning modules must expose explicit invalidation APIs and mutation paths must call them.
- Preset-name normalization is owned internally by `runtime.theme` during configure/apply/resolve flows. Do not duplicate preset normalization outside `runtime/theme` internals.
- Cluster mappers are declarative routing/normalization only; route identity belongs in `config/cluster-routes/`, and formatter/presentation behavior belongs in `widgets/` or shared widget kits.
- User-visible responsive floors must come from the shared responsive-profile contract; widget-local floors are allowed only for technical safety bounds.
- Fail-fast / keep-it-simple: validate and default at boundaries, then trust the resulting internal contract.
- Do not add speculative legacy/compat/fallback helpers or duplicate CSS/config defaults in runtime code.

## Fail-fast / keep-it-simple

Validate and default at boundaries, then trust the resulting internal contract.

## File Size Limits

- **Hard limit: 400 non-empty lines per file.** This applies to all JS files (source and test) and all Markdown documentation files. There are no exceptions, no warning tier, and no workarounds. If a file approaches or reaches 400 lines, the agent must stop and split it before continuing — even if the current exec-plan does not mention splitting. Repo rules always override exec-plan assumptions.
- Exempt file types: `.css`, `.json` layout files, exec-plan files (`exec-plans/`), agent skill files (`.agents/skills/`), tool scripts (`tools/`), and package config files.
- One-liner compression (collapsing multiline code onto fewer lines to stay under the limit) is a blocking lint violation. The linter detects dense oneliners, long packed lines, chained ternaries, collapsed blocks, and other compression patterns. See `documentation/conventions/smell-prevention.md` §Oneliner line-limit bypass.
- Shared drawing/layout logic must be split into `shared/widget-kits/radial/` modules:
  - `RadialAngleMath`
  - `RadialTickMath`
  - `RadialCanvasPrimitives`
  - `RadialFrameRenderer`
- Gauge-specific behavior stays in individual gauge component files.
- Cluster configs live under `config/clusters/`.
- If a legacy file already exceeds 400 lines, isolate new logic and avoid increasing file size further.

## Repo Rules Override Exec-Plans

If an exec-plan's implementation phases would cause a file to exceed 400 lines, the agent must refactor and split the file as part of that phase. The plan does not need to mention splitting explicitly — the 400-line rule is always in effect. Do not wait for a later "cleanup" phase. Do not use one-liner compression to fit more logic into fewer lines.

## File Overview Comments

Every shipped JavaScript file starts with one top-level JSDoc `@file` overview.
ESLint's `jsdoc/require-file-overview` rule enforces presence, uniqueness, and
placement at the beginning of the file. Keep the overview short. Do not repeat
component-registry dependencies in comments; `config.components` is their
authoritative owner. When an overview includes a `Documentation:` target,
`npm run docs:check` validates that the target exists.

```javascript
/**
 * @file [Name] - [One-line description]
 * Documentation: documentation/[path].md
 */
```

Example:

```javascript
/**
 * @file SpeedRadialWidget - Semicircle speedometer with warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
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

  function create(def, componentContext) {
    // Component code here
    return { id: "ComponentName" };
  }

  return { id: "ComponentName", create };
}));
```

## Naming Conventions

- Cluster widget names: `dyni_{Cluster}_Instruments` (example: `dyni_Speed_Instruments`)
- Component `globalKey` values: `Dyni{ComponentName}` (example: `DyniSpeedRadialWidget`)
- Gauge ratio threshold props: `{gauge}RatioThresholdNormal`, `{gauge}RatioThresholdFlat`
- Sector props: `{gauge}WarningFrom`, `{gauge}AlarmFrom`
- Per-kind caption/unit props: `caption_{kindName}`, `unit_{kindName}`
- Unit-selector props: `formatUnit_{metricKey}`
- Unit display-label props: `unit_{metricKey}_{token}`
- Unit-specific numeric props: `<scaleBaseKey>_{token}`
- `editableParameter` conditions: `{ kind: "xxxRadial" }` or `[{ kind: "a" }, { kind: "b" }]`
- Renderer components must use role-based IDs, not cluster-prefixed IDs, and must not be per-kind mapper-to-widget forwarding shims.
- Shared unit-binding tables may define an optional `rendererKey` alias for renderer-domain payload names.
- Mixed migrated/non-migrated cluster maps should be split so migrated kinds do not flow through `makePerKindTextParams(...)`.

## Mapper Boundary Rules

- Keep mapper files (`cluster/mappers/*Mapper.js`) limited to `create()` and `translate()` function declarations.
- Keep mapper output declarative: map values, normalize numbers, and pass-through formatter keys only.
- Do not implement formatter logic, status-symbol conversion, or rendering fallbacks inside mappers.
- Move any non-trivial logic to renderer components (`widgets/`) or shared widget kits, or to `ClusterMapperToolkit` when it is mapper-shared logic.

## Fail-Fast / Keep It Simple

- Apply defaults and validation once at the boundary (config, mapper, runtime helper, or theme resolver).
- After that boundary, trust internal `props/state/theme/display/cfg` contracts instead of re-sanitizing them.
- Do not create `normalize*` helpers or fallback wrappers for internal hook/spec results unless an external boundary contract requires them.
- Do not mirror `plugin.css`, theme token, or editable-parameter defaults in widget/shared runtime code.
- Renderer-side helpers may format with mapper-resolved formatter tokens, but they must not repeat mapper fallback or token-validation logic.
- Do not pass display labels such as `m/s`, `°C`, or `hPa` into formatter parameters.
- If an exception must keep a fallback path, annotate it with a rule-specific suppression:
  - `// dyni-lint-disable-next-line <rule-name> -- <reason>`
  - `/* dyni-lint-disable-line <rule-name> -- <reason> */`

## Temporary Workaround Marker

- If code intentionally bridges a missing/undocumented AvNav host-action contract, mark the block with:
  - `// dyni-workaround(avnav-plugin-actions) -- <reason>`
- Use this marker only for temporary plugin-side workflow bridges such as route-editor, route-point, AIS, or page-click ownership gaps.
- Keep the reason short and name the missing contract if known (`routePoints`, `routeEditor`, `ais`, `GpsPage` click fallback).
- This marker is for future cleanup/searchability; it is not a lint-suppression directive.

## Responsive Layout Ownership

- Shared responsive compaction policy belongs to one shared owner; [../shared/responsive-scale-profile.md](../shared/responsive-scale-profile.md) documents that contract and the runtime module lives under `shared/widget-kits/layout/ResponsiveScaleProfile.js`.
- Layout-owner modules may map shared profile outputs into family-specific geometry, spacing, and text ceilings, but they must not invent a second compact curve or copy the baseline constants locally.
- Cluster mappers, renderer props, theme tokens, `plugin.css`, and editable parameters are not owners of responsive compaction policy.
- Local literals are acceptable only for technical safety bounds (`0`, `1`, `2`, or equivalent non-visual guards). User-visible responsive floors such as text/layout minima must come from the shared profile contract.

## Widget Archetypes

Use this routing table before starting a new widget. Shared engine purposes:

- `SemicircleRadialEngine`: shared semicircle gauge rendering flow (geometry, sectors, ticks, pointer, ratio mode).
- `LinearGaugeEngine`: shared horizontal gauge rendering flow (axis modes, sectors, ticks, pointer, ratio mode).
- `FullCircleRadialEngine`: shared full-circle dial rendering flow (ring/ticks, static layers, pointer and frame orchestration).
- `TextLayoutEngine`: shared text layout mode routing, fit calculation, and text draw helpers.
- `HtmlSurfaceController`: shared HTML-surface lifecycle owner (`renderHtml`, named handlers, `resizeSignature`).
- Renderer variants: extend an existing renderer when the visual contract stays the same and only kind-specific formatting or field mapping changes.

| Archetype | Shared Engine | Reference Implementation | Guide |
|---|---|---|---|
| Semicircle gauge | `SemicircleRadialEngine` | [SpeedRadialWidget](../../widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js) | [add-new-gauge](../guides/add-new-gauge.md) |
| Linear gauge | `LinearGaugeEngine` | [SpeedLinearWidget](../../widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js) | [add-new-linear-gauge](../guides/add-new-linear-gauge.md) |
| Full-circle dial | `FullCircleRadialEngine` | [CompassRadialWidget](../../widgets/radial/CompassRadialWidget/CompassRadialWidget.js) | [add-new-dial](../guides/add-new-full-circle-dial.md) |
| Text renderer | `TextLayoutEngine` | [ThreeValueTextWidget](../../widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js) | [add-new-text-renderer](../guides/add-new-text-renderer.md) |
| Text renderer variant | `TextLayoutEngine` | [PositionCoordinateWidget](../../widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js) | [add-new-text-renderer](../guides/add-new-text-renderer.md) |
| Native HTML kind | `HtmlSurfaceController` lifecycle | [ActiveRouteTextHtmlWidget](../../widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js) | [add-new-html-kind](../guides/add-new-html-kind.md) |

Rule: Before creating any new widget, check this table. If your widget matches an archetype, use the corresponding shared engine. If it does not match any archetype, discuss with the team before creating a new engine.

## Reference Implementations

- For a new semicircle gauge: `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js` - canonical UMD wrapper, focused doc comment, and `SemicircleRadialEngine` delegation.
- For a new linear gauge: `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js` - canonical UMD wrapper and `LinearGaugeEngine` delegation.
- For a new generic shared utility facade: `shared/widget-kits/gauge/GaugeToolkit.js` - facade pattern and dependency composition across non-radial shared gauge modules.
- For radial-only draw orchestration: `shared/widget-kits/radial/RadialToolkit.js` - radial facade extending `GaugeToolkit`.
- For a new cluster mapper: `cluster/mappers/SpeedMapper.js` - `translate(props, toolkit)` mapping pattern and renderer routing output shape.

## Bootstrap-Loaded Shared Catalogs

- `shared/unit-format-families.js` is the bootstrap-loaded shared catalog for migrated formatter families.
- It self-initializes `DyniPlugin.config.shared` before assigning `DyniPlugin.config.shared.unitFormatFamilies`.
- The file is also registered on `window.DyniComponents.DyniUnitFormatFamilies`.
- The component registry contract keeps this bootstrap-only file exempt from the normal `{ id, create }` runtime component shape.

## Shared Utilities

Reusable logic MUST go in `shared/widget-kits/`. Never duplicate functions across widgets.

Current shared utilities include:
- `HtmlDomPatchUtils.patchInnerHtml()`
- `HtmlWidgetUtils.toFiniteNumber()`
- `HtmlWidgetUtils.trimText()`
- `HtmlWidgetUtils.escapeHtml()`
- `HtmlWidgetUtils.toStyleAttr()`
- `HtmlWidgetUtils.resolveShellRect()`
- `HtmlWidgetUtils.resolveRatioMode()`
- `HtmlWidgetUtils.isEditingMode()`
- `PreparedPayloadModelCache.createPreparedModelCache()`
- `ValueMath.clamp()`
- `ValueMath.isFiniteNumber()`
- `ValueMath.toFiniteNumber()`
- `ValueMath.toOptionalFiniteNumber()`
- `ValueMath.trimText()`
- `ValueMath.extractNumberText()`
- `ValueMath.formatAngle180()`
- `ValueMath.formatDirection360()`
- `ValueMath.computeMode()`
- `RadialValueMath.sectorAngles()`
- `RadialValueMath.buildHighEndSectors()`
- `RadialValueMath.buildLowEndSectors()`
- `CanvasTextFitting.setFont()`
- `CanvasTextFitting.measureTextWidth()`
- `CanvasTextFitting.fitSingleTextPx()`
- `CanvasTextLayout.drawValueUnitWithFit()`
- `CanvasTextLayout.drawInlineCapValUnit()`
- `GaugeToolkit` for generic gauge access to theme tokens, `CanvasTextLayout`, and `ValueMath`
- `StateScreenCanvasOverlay.drawStateScreen()`
- `UnitAwareFormatter.formatWithToken()`
- `UnitAwareFormatter.formatDistance()`
- `UnitAwareFormatter.appendUnit()`
- `UnitAwareFormatter.extractNumericDisplay()`
- `componentContext.format.applyFormatter()`
- `componentContext.canvas.setupCanvas()`
- `componentContext.dom.getNightModeState(rootEl)`
- `GeometryScale.scale()`
- `GeometryScale.scaleStroke()`
- `GeometryScale.scalePointer()`

Check these before writing any helper function. For helper ownership, see [shared-helpers.md](shared-helpers.md). For radial gauge utility APIs, see [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md).

## Related

- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../guides/add-new-linear-gauge.md](../guides/add-new-linear-gauge.md)
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md)
- [../architecture/component-system.md](../architecture/component-system.md)
