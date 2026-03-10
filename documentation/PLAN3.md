# Implementation Plan — Atomicity Linter & Redundant Verbosity Cleanup

**Status:** ⏳ Planned | Linter rules and codebase fixes for contract-trusting atomicity enforcement

## Overview

This plan addresses a systemic problem introduced by AI-assisted code generation: verbose defensive code that re-checks, re-defaults, and re-validates internal components whose contracts already guarantee correctness. The project is atomic — each module has defined contracts, and interior code must trust those contracts rather than re-guarding them.

Scope:

- implement new linter rules that detect redundant internal checks, redundant default duplication, and unnecessary defensive patterns against guaranteed-valid internal state
- clean the existing codebase to pass those rules
- promote the rules from `warn` to `block` once the backlog reaches zero

Two categories of violations are targeted:

1. **Redundant internal checks** — `if` statements, `try` blocks, `typeof` guards, and null checks that test properties or behaviors guaranteed by internal module contracts.
2. **Redundant default duplication** — hardcoded fallback values that duplicate defaults already declared in `config/clusters/*.js`, engine-level `DEFAULT_*` constants, or `editableParameters` specs.

## Problem Analysis

### Problem 1: Widgets Re-Hardcode Config-Owned Defaults

Every widget that calls `engine.createRenderer(spec)` passes a `ratioDefaults` object with hardcoded numeric literals. These same values are already declared as `default:` in the corresponding `config/clusters/*.js` editable parameter specs. The engine itself also carries `DEFAULT_RATIO_DEFAULTS` as its own fallback for when no `ratioDefaults` is supplied.

This creates a three-layer duplication chain:

```
config/clusters/speed.js:        speedLinearRatioThresholdNormal: { default: 1.1 }
                                  speedLinearRatioThresholdFlat:   { default: 3.5 }
                                          ↓
widgets/linear/SpeedLinearWidget: ratioDefaults: { normal: 1.1, flat: 3.5 }
                                          ↓
shared/LinearGaugeEngine:         DEFAULT_RATIO_DEFAULTS = { normal: 1.1, flat: 3.5 }
shared/LinearGaugeLayout:         DEFAULT_RATIO_THRESHOLD_NORMAL = 1.1
                                  DEFAULT_RATIO_THRESHOLD_FLAT = 3.5
```

If a config default changes, the widget hardcodes silently override the config intent. The engine defaults exist as a last-resort safety net — they should never be reached in normal runtime because the config system always provides the values. The widget-level `ratioDefaults` is pure redundancy.

The same pattern exists for `rangeDefaults` — widgets hardcode `{ min: X, max: Y }` that duplicate the config-owned editable parameter defaults for min/max range values.

**Affected widgets (ratioDefaults duplication):**

| Widget | ratioDefaults | Config source | Match? |
|---|---|---|---|
| `SpeedLinearWidget` | `{ normal: 1.1, flat: 3.5 }` | `speed.js` | ✅ exact duplicate |
| `DepthLinearWidget` | `{ normal: 1.1, flat: 3.5 }` | `environment.js` | ✅ exact duplicate |
| `TemperatureLinearWidget` | `{ normal: 1.1, flat: 3.5 }` | `environment.js` | ✅ exact duplicate |
| `VoltageLinearWidget` | `{ normal: 1.1, flat: 3.5 }` | `vessel.js` | ✅ exact duplicate |
| `CompassLinearWidget` | `{ normal: 1.1, flat: 3.5 }` | `course-heading.js` | ✅ exact duplicate |
| `WindLinearWidget` | `{ normal: 0.9, flat: 3 }` | `wind.js` | ✅ exact duplicate |
| `SpeedRadialWidget` | `{ normal: 1.1, flat: 3.5 }` | `speed.js` | ✅ exact duplicate |
| `DepthRadialWidget` | `{ normal: 1.1, flat: 3.5 }` | `environment.js` | ✅ exact duplicate |
| `TemperatureRadialWidget` | `{ normal: 1.1, flat: 3.5 }` | `environment.js` | ✅ exact duplicate |
| `VoltageRadialWidget` | `{ normal: 1.1, flat: 3.5 }` | `vessel.js` | ✅ exact duplicate |
| `CompassRadialWidget` | `{ normal: 0.8, flat: 2.2 }` | `course-heading.js` | ✅ exact duplicate |
| `WindRadialWidget` | `{ normal: 0.7, flat: 2.0 }` | `wind.js` | ✅ exact duplicate |

**Affected widgets (rangeDefaults duplication):**

| Widget | rangeDefaults | Config source | Match? |
|---|---|---|---|
| `SpeedLinearWidget` | `{ min: 0, max: 30 }` | `speed.js` | ✅ exact duplicate |
| `SpeedRadialWidget` | `{ min: 0, max: 30 }` | `speed.js` | ✅ exact duplicate |
| `DepthLinearWidget` | `{ min: 0, max: 30 }` | `environment.js` | ✅ exact duplicate |
| `DepthRadialWidget` | `{ min: 0, max: 30 }` | `environment.js` | ✅ exact duplicate |
| `TemperatureLinearWidget` | `{ min: 0, max: 35 }` | `environment.js` | ✅ exact duplicate |
| `TemperatureRadialWidget` | `{ min: 0, max: 35 }` | `environment.js` | ✅ exact duplicate |

`VoltageLinearWidget` and `VoltageRadialWidget` are not part of the live Phase 2 warning surface on March 10, 2026. Their wrapper-owned `rangeDefaults` no longer match the config-owned editable defaults in `config/clusters/vessel.js`, so their range ownership mismatch remains separate cleanup work rather than `widget-renderer-default-duplication`.

### Problem 2: Engine/Layout Modules Duplicate Each Other's Defaults

The `DEFAULT_RATIO_THRESHOLD_NORMAL` / `DEFAULT_RATIO_THRESHOLD_FLAT` constants appear in both `LinearGaugeLayout.js` and `LinearGaugeEngine.js`. The layout module uses its own default as a `clampNumber` fallback inside `computeMode()`. The engine also applies its own default when the widget doesn't supply `ratioDefaults`. This means the same value is guarded at two layers, and if one changes independently the other silently overrides it. The same split exists between `SemicircleRadialEngine` and `FullCircleRadialEngine` with their respective `DEFAULT_RATIO_DEFAULTS`.

### Problem 3: Canvas API Method Checks on Internal Objects

`LinearCanvasPrimitives.js` guards standard Canvas 2D methods with `typeof` checks:

```javascript
if (lineWidth > 0 && typeof ctx.strokeRect === "function") {
```

```javascript
if (Array.isArray(s.dash) && typeof ctx.setLineDash === "function") {
```

The `ctx` parameter is always a `CanvasRenderingContext2D` obtained from `Helpers.setupCanvas()`. Both `strokeRect` and `setLineDash` are standard Canvas 2D methods present in every supported browser. These `typeof` guards check for internal API features that are guaranteed by the platform contract.

### Problem 4: Try/Finally Wrapping Guaranteed Canvas Operations

`LinearCanvasPrimitives.js` wraps every primitive drawing operation in `try { ... } finally { ctx.restore(); }` for calls like `beginPath()`, `moveTo()`, `lineTo()`, `stroke()` — standard Canvas 2D operations that do not throw exceptions under normal conditions. The `ctx` is validated upstream by `resolveSurface()`. The `save/restore` pair can be structured without a `try` block. `RadialCanvasPrimitives.js` has the same pattern in its `withSave` helper.

### Problem 5: Redundant `typeof` Checks on Helpers Module Methods

`RadialTickMath.js` checks `typeof Helpers.getModule === "function"` and `typeof angleMath.mod === "function"` — both guaranteed by the module loader contract. These guards add fallback code paths that can never execute in production.

### Problem 6: Hardcoded Prop-String Duplication in Widget `createRenderer` Specs

Every widget that calls `engine.createRenderer(spec)` hardcodes the string names of its config-owned editable parameters inside `rangeProps`, `tickProps`, and `ratioProps`. These strings are the exact keys declared in `config/clusters/*.js`. Any rename in the config that isn't mirrored in the widget silently breaks the binding. This is the same class of duplication: values that are already owned by the config layer being re-declared in the widget layer.

### Problem 7: Inline Config Default Duplication in VoltageLinearWidget

`VoltageLinearWidget.js` hardcodes fallback values `12.2` and `11.6` for sector thresholds via `typeof !== "undefined"` guards, duplicating the `default:` values from `config/clusters/vessel.js`. The editable-defaults system guarantees these properties exist on `props` at render time. `RadialValueMath.buildLowEndSectors` accepts `defaultWarningFrom` / `defaultAlarmFrom` options — another layer of fallback for the same values.

## Linter Rule Design

### Rule 1: `widget-renderer-default-duplication`

**Severity:** starts as `warn`, promoted to `block` in Phase 8.

**Scope:** `widgets/**/*.js`

**Detection logic:** Parse `createRenderer({ ... })` call arguments. For each property that matches a known default-carrying key (`ratioDefaults`, `rangeDefaults`), extract the literal values. Cross-reference against `config/clusters/*.js` editable parameter `default:` values via the `ratioProps`/`rangeProps` string bindings. Flag when widget-level defaults exactly duplicate config-level defaults.

**Message:** `[widget-renderer-default-duplication] {file}:{line} — Widget hardcodes {key}: {value} which duplicates the config-owned default in {configFile}. Remove the widget-level default and let the engine's built-in fallback handle the (unreachable) missing-config case.`

### Rule 2: `engine-layout-default-drift`

**Severity:** starts as `warn`, promoted to `block` in Phase 8.

**Scope:** `shared/widget-kits/linear/*.js`, `shared/widget-kits/radial/*.js`

**Detection logic:** Extract all `DEFAULT_RATIO_*` and `DEFAULT_RANGE_*` constants from engine and layout modules within the same widget-kit family. Flag when constants that represent the same logical default appear in multiple files with potentially drifting values.

**Message:** `[engine-layout-default-drift] {file}:{line} — Default constant {name} = {value} duplicates the same logical default in {otherFile}. Consolidate to a single source-of-truth module or remove the redundant copy.`

### Rule 3: `canvas-api-typeof-guard`

**Severity:** starts as `warn`, promoted to `block` in Phase 8.

**Scope:** `shared/**/*.js`, `widgets/**/*.js`

**Detection logic:** Match patterns like `typeof ctx.{methodName} === "function"` where `{methodName}` is a standard Canvas 2D API method (`strokeRect`, `setLineDash`, `fillRect`, `beginPath`, `save`, `restore`, `measureText`, `drawImage`, `createLinearGradient`, `createRadialGradient`, `getImageData`, `putImageData`).

**Message:** `[canvas-api-typeof-guard] {file}:{line} — Redundant typeof guard for standard Canvas 2D method ctx.{method}. The rendering context is validated at the setupCanvas() boundary; trust the platform contract.`

### Rule 4: `try-finally-canvas-drawing`

**Severity:** starts as `warn`, promoted to `block` in Phase 8.

**Scope:** `shared/**/*.js`

**Detection logic:** Match `try { ... } finally { ctx.restore(); }` blocks where the try body contains only standard Canvas 2D drawing calls. These operations do not throw exceptions on valid contexts.

**Message:** `[try-finally-canvas-drawing] {file}:{line} — try/finally wrapping standard Canvas 2D drawing operations. These calls cannot throw on a valid context. Replace with direct save/restore pairing.`

### Rule 5: `framework-method-typeof-guard`

**Severity:** starts as `warn`, promoted to `block` in Phase 8.

**Scope:** `shared/**/*.js`, `widgets/**/*.js`

**Detection logic:** Match patterns like `typeof Helpers.getModule === "function"`, `typeof Helpers.applyFormatter === "function"`, or similar checks on framework-provided methods. Also match `moduleName && typeof moduleName.methodName === "function"` where `moduleName` is the result of a `Helpers.getModule()` call within the same function scope.

**Message:** `[framework-method-typeof-guard] {file}:{line} — Redundant typeof guard on framework method {expression}. The module loader guarantees this method exists; trust the internal contract.`

### Rule 6: `inline-config-default-duplication`

**Severity:** starts as `warn`, promoted to `block` in Phase 8.

**Scope:** `widgets/**/*.js`, `shared/**/*.js`

**Detection logic:** Match patterns where a numeric literal appears as a fallback for a property that traces back to an editable parameter with a `default:` value. Specifically: `typeof p.{propName} !== "undefined" ? p.{propName} : {literal}` where `{propName}` is an editable parameter key and `{literal}` matches the `default:` value in the config.

**Message:** `[inline-config-default-duplication] {file}:{line} — Inline default {literal} for prop '{propName}' duplicates the config-owned default in {configFile}. The editable-defaults system guarantees this property is populated; remove the inline fallback.`

### Existing Rules to Promote

| Rule | Current severity | Proposed severity | When |
|---|---|---|---|
| `redundant-null-type-guard` | warn | block | Phase 8, after backlog reaches zero |
| `internal-hook-fallback` | warn | block | Phase 8, after backlog reaches zero |
| `hardcoded-runtime-default` | warn | block | Phase 8, after backlog reaches zero |

## Todo Steps

### Phase 0 — Implement new linter rules in warn mode

Status: implemented on `2026-03-10`. Added the six warn-only atomicity rules, dedicated checker coverage in `tests/tools/check-patterns-atomicity.test.js`, shared atomicity contract caching, and the March 10, 2026 backlog snapshot. `node tools/check-patterns.mjs` now reports `33` warnings for the Phase 0 rollout surface: `widget-renderer-default-duplication=18`, `engine-layout-default-drift=6`, `canvas-api-typeof-guard=2`, `try-finally-canvas-drawing=2`, `framework-method-typeof-guard=3`, and `inline-config-default-duplication=2`.

1. Create `tools/check-patterns/rules-atomicity.mjs` with implementations for the six rules described above.
2. Register all six rules in `tools/check-patterns/rules.mjs` with `severity: "warn"`.
3. Add shared utilities to `tools/check-patterns/shared.mjs` if needed — the config cross-referencing helpers that parse `config/clusters/*.js` editable parameter `default:` values and map them to widget renderer spec properties via `ratioProps`/`rangeProps` bindings.
4. Create `tests/tools/check-patterns-atomicity.test.js` with positive (should flag) and negative (should not flag) test cases for each rule.
5. Run the full linter suite and record the initial warn-only backlog count in `documentation/TECH-DEBT.md`.

### Phase 1 — Remove widget-level `ratioDefaults` duplication

Status: implemented on `2026-03-10`. Removed wrapper-owned `ratioDefaults` from the 12 config-backed linear/radial wrappers, updated wrapper and shared-engine coverage for config-backed threshold ownership vs engine fallback behavior, and tightened the shared API / authoring docs so plugin wrappers treat `ratioDefaults` as an engine-level safety fallback only. `node tools/check-patterns.mjs` should now report `widget-renderer-default-duplication=6`, leaving only the Phase 2 `rangeDefaults` backlog for that rule.

1. For each linear and radial widget that passes `ratioDefaults` to `createRenderer()`, remove the `ratioDefaults` property from the spec object.
2. The engines (`LinearGaugeEngine`, `SemicircleRadialEngine`, `FullCircleRadialEngine`) already carry `DEFAULT_RATIO_DEFAULTS` as last-resort fallbacks — verify those constants still exist and are documented as the single source of truth.
3. Run all existing widget render tests to confirm no behavior change.
4. Add engine-level tests that verify `createRenderer` produces the same layout output when `ratioDefaults` is absent from the widget spec as when it was explicitly supplied with the duplicate values.

### Phase 2 — Remove widget-level `rangeDefaults` duplication

Status: implemented on `2026-03-10`. Removed wrapper-owned `rangeDefaults` from the six config-backed wrappers still flagged by `widget-renderer-default-duplication` (`Speed/Depth/Temperature` in both linear and semicircle families), updated wrapper and shared-engine coverage for config-owned range bounds vs engine fallback behavior, and tightened the shared API / authoring docs so config-backed wrappers omit `rangeDefaults`. `node tools/check-patterns.mjs` should now report `widget-renderer-default-duplication=0`; the remaining atomicity backlog is `15` warnings across the other five warn-mode rules. Voltage range ownership remains out of scope for this phase because those wrappers no longer match config-owned min/max defaults.

1. Remove `rangeDefaults` from the six duplicate wrappers only: `SpeedLinearWidget`, `DepthLinearWidget`, `TemperatureLinearWidget`, `SpeedRadialWidget`, `DepthRadialWidget`, and `TemperatureRadialWidget`.
2. Keep `LinearGaugeEngine.DEFAULT_RANGE_DEFAULTS` and `SemicircleRadialEngine.DEFAULT_RANGE_DEFAULTS` unchanged as the single runtime fallback owners.
3. Update wrapper tests to assert thin wrapper specs omit `rangeDefaults`.
4. Add engine-level regressions for config-bound equivalence and omitted-range fallback behavior.

### Phase 3 — Consolidate engine/layout default constants

Status: implemented on `2026-03-10`. Cleared the full live `engine-layout-default-drift` backlog across the linear, semicircle, and full-circle gauge families. `LinearGaugeLayout`, `SemicircleRadialLayout`, and `FullCircleRadialLayout` now use layout-owned structural fallback thresholds only (`1.0/3.0` for linear + semicircle, `1.0/2.0` for full-circle), while `LinearGaugeEngine`, `SemicircleRadialEngine`, and `FullCircleRadialEngine` remain the sole semantic owners of `DEFAULT_RATIO_DEFAULTS`. Added focused layout regressions for explicit-threshold behavior plus omitted-threshold structural fallback behavior. `node tools/check-patterns.mjs` should now report `engine-layout-default-drift=0`, reducing the remaining atomicity backlog to `9` warnings across the four later-phase rules.

1. Remove semantic `DEFAULT_RATIO_THRESHOLD_*` constants from all three layout owners and replace them with layout-owned structural fallback thresholds in `computeMode()`.
2. Keep the existing clamp/order behavior in all three layout owners (`thresholdNormal >= 0.1`, `thresholdFlat >= thresholdNormal`) so direct callers still get a safe mode when thresholds are omitted.
3. Keep engine `DEFAULT_RATIO_DEFAULTS` unchanged and annotate each engine as the last-resort runtime owner for missing threshold props.
4. Add targeted layout tests for all three families that prove explicit thresholds still drive mode selection and omitted thresholds use the new structural fallback pair.

### Phase 4 — Remove canvas API `typeof` guards

Status: implemented on `2026-03-10`. Removed the two internal Canvas 2D method guards from `LinearCanvasPrimitives`, added direct shared-primitive coverage for dashed track rendering plus fill-only vs stroked band behavior, and extended `createMockContext2D()` so the shared test harness models `strokeRect()` as part of the owned Canvas 2D contract. `node tools/check-patterns.mjs` now reports `canvas-api-typeof-guard=0`, reducing the remaining atomicity backlog to `7` warnings across the later-phase rules (`try-finally-canvas-drawing=2`, `framework-method-typeof-guard=3`, `inline-config-default-duplication=2`). `npm run check:all` passed after the cleanup with `78/78` test files and `470/470` tests green.

1. In `LinearCanvasPrimitives.js`, removed the `typeof ctx.strokeRect === "function"` and `typeof ctx.setLineDash === "function"` guards while keeping the real semantic gates (`lineWidth > 0`, `Array.isArray(s.dash)`).
2. Added direct regression coverage in `tests/shared/linear/LinearCanvasPrimitives.test.js` and updated `tests/helpers/mock-canvas.js` so the shared mock matches the owned Canvas 2D contract.
3. Revalidated the Phase 4 surface with the targeted primitive suite, `node tools/check-patterns.mjs`, and the required `npm run check:all` gate.

### Phase 5 — Simplify try/finally canvas drawing blocks

Status: implemented on `2026-03-10`. Removed the remaining internal `try { ... } finally { ctx.restore(); }` wrappers from the shared linear and radial primitive owners, expanded direct primitive regressions to assert balanced `save`/`restore` usage across the touched public draw paths, and revalidated the Phase 5 surface with `node tools/check-patterns.mjs` plus the full `npm run check:all` gate. `node tools/check-patterns.mjs` now reports `try-finally-canvas-drawing=0`, reducing the remaining atomicity backlog to `5` warnings across the later-phase rules (`framework-method-typeof-guard=3`, `inline-config-default-duplication=2`). `npm run check:all` passed after the cleanup with `78/78` test files and `474/474` tests green.

1. In `LinearCanvasPrimitives.js`, replaced all `try { draw(); } finally { ctx.restore(); }` patterns with direct `draw(); ctx.restore();` sequencing in `drawTrack`, `drawBand`, `drawTick`, and `drawPointer` while keeping the existing semantic gates unchanged.
2. In `RadialCanvasPrimitives.js`, replaced the same pattern in the shared `withCtx` helper so `RadialCanvasPrimitives` and `RadialFrameRenderer` continue to consume one context-owner API with direct save/draw/restore sequencing.
3. Expanded direct primitive coverage in `tests/shared/linear/LinearCanvasPrimitives.test.js` and `tests/shared/radial/RadialCanvasPrimitives.test.js` to assert balanced `save`/`restore` calls plus unchanged dash, fill/stroke, tick, pointer, ring, and annular-sector behavior.

### Phase 6 — Remove framework method `typeof` guards and inline config default duplication

Status: implemented on `2026-03-10`. Removed the two internal framework-method guards from `RadialTickMath`, removed the config-duplicating voltage threshold fallbacks from `VoltageLinearWidget`, updated the focused shared/widget regressions to use the runtime module-loader and editable-default contracts, and revalidated the Phase 6 surface with targeted Vitest coverage plus the full `npm run check:all` gate. `node tools/check-patterns.mjs` now reports `1` remaining warning across the later-phase rules (`framework-method-typeof-guard=1`, `inline-config-default-duplication=0`); the remaining `ThemeResolver` warning is intentional Phase 7 suppression work. `npm run check:all` passed after the cleanup with `78/78` test files and `474/474` tests green.

1. In `RadialTickMath.js`, replaced the `Helpers && typeof Helpers.getModule === "function"` guard and the `angleMath && typeof angleMath.mod === "function"` fallback with direct internal-contract calls.
2. In `VoltageLinearWidget.js`, removed the inline `12.2` / `11.6` threshold fallbacks so the low-end sector builder now trusts the config-owned editable defaults from `config/clusters/vessel.js`.
3. Updated `tests/shared/radial/RadialTickMath.test.js` and `tests/widgets/linear/VoltageLinearWidget.test.js` so the focused coverage matches the owned runtime contracts, then revalidated with `npx vitest run tests/shared/radial/RadialTickMath.test.js tests/widgets/linear/VoltageLinearWidget.test.js tests/tools/check-patterns-atomicity.test.js`, `node tools/check-patterns.mjs`, and `npm run check:all`.

### Phase 7 — Add lint suppressions for legitimate boundary exceptions

Some `typeof` checks are legitimate because they operate at genuine external boundaries, not internal contracts:

| File | Pattern | Reason for suppression |
|---|---|---|
| `CanvasLayerCache.js` | `typeof canvas.ownerDocument.createElement === "function"` | DOM boundary — canvas element may come from different document contexts |
| `CanvasLayerCache.js` | `typeof canvas.getBoundingClientRect === "function"` | DOM boundary — canvas element capability check |
| `ThemeResolver.js` | `typeof Helpers.getModule === "function"` | Runtime bootstrap order — ThemeResolver may be created before all modules are registered |
| `ThemeResolver.js` | `typeof canvas.closest === "function"` | DOM boundary — older canvas polyfills |

1. Add `dyni-lint-disable-next-line` comments with the specific rule name and a short justification for each legitimate exception.
2. Run the full linter suite and verify the backlog is now zero for all new rules.

### Phase 8 — Promote all new rules to block and promote existing warn rules

1. In `tools/check-patterns/rules.mjs`, change severity from `"warn"` to `"block"` for all six new rules.
2. Promote existing warn rules to block:
   - `redundant-null-type-guard`
   - `internal-hook-fallback`
   - `hardcoded-runtime-default`
3. Run the full linter suite and confirm zero violations.
4. Update this document's status to `✅ Implemented`.

### Phase 9 — Documentation and guidance updates

1. Update `documentation/TECH-DEBT.md` to remove the warn-backlog entries from Phase 0.
2. Update `documentation/conventions/coding-standards.md` with the new atomicity rules and their rationale.
3. Update `CONTRIBUTING.md` so contributors and agents know to avoid re-introducing the patterns these rules catch.
4. Update `AGENTS.md` and `CLAUDE.md` with explicit guidance for AI agents to trust internal contracts rather than adding defensive guards.

## Affected File Map

| File | Description | Planned change |
|---|---|---|
| `tools/check-patterns/rules-atomicity.mjs` | New rule implementations | Created in Phase 0 |
| `tools/check-patterns/atomicity-contracts.mjs` | Atomicity config/widget contract index | Created in Phase 0 |
| `tools/check-patterns/atomicity-parser.mjs` | Atomicity literal/object parser helpers | Created in Phase 0 |
| `tools/check-patterns/rules.mjs` | Pattern-rule registry | Modified in Phase 0 to register new rules, modified in Phase 8 to promote severity |
| `tools/check-patterns/shared.mjs` | Shared linter utilities | Modified in Phase 0 if config cross-referencing helpers are needed |
| `tests/tools/check-patterns-atomicity.test.js` | New rule test coverage | Created in Phase 0 |
| `tests/helpers/mock-canvas.js` | Shared canvas test harness | Modified in Phase 4 to model `strokeRect()` on the owned Canvas 2D contract |
| `tests/shared/linear/LinearCanvasPrimitives.test.js` | Direct linear primitive regression coverage | Created in Phase 4 |
| `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js` | Linear speed gauge | Modified in Phase 1 and Phase 2 |
| `widgets/linear/DepthLinearWidget/DepthLinearWidget.js` | Linear depth gauge | Modified in Phase 1 and Phase 2 |
| `widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js` | Linear temperature gauge | Modified in Phase 1 and Phase 2 |
| `widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js` | Linear voltage gauge | Modified in Phase 1 and Phase 6; Phase 2 range ownership cleanup deferred |
| `widgets/linear/CompassLinearWidget/CompassLinearWidget.js` | Linear compass gauge | Modified in Phase 1 |
| `widgets/linear/WindLinearWidget/WindLinearWidget.js` | Linear wind gauge | Modified in Phase 1 |
| `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js` | Semicircle speedometer | Modified in Phase 1 and Phase 2 |
| `widgets/radial/DepthRadialWidget/DepthRadialWidget.js` | Semicircle depth gauge | Modified in Phase 1 and Phase 2 |
| `widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js` | Semicircle temperature gauge | Modified in Phase 1 and Phase 2 |
| `widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js` | Semicircle voltage gauge | Modified in Phase 1; Phase 2 range ownership cleanup deferred |
| `widgets/radial/CompassRadialWidget/CompassRadialWidget.js` | Full-circle compass dial | Modified in Phase 1 |
| `widgets/radial/WindRadialWidget/WindRadialWidget.js` | Full-circle wind dial | Modified in Phase 1 |
| `shared/widget-kits/linear/LinearGaugeLayout.js` | Linear-family responsive layout owner | Modified in Phase 3 |
| `shared/widget-kits/radial/SemicircleRadialLayout.js` | Semicircle-family responsive layout owner | Modified in Phase 3 |
| `shared/widget-kits/radial/FullCircleRadialLayout.js` | Full-circle-family responsive layout owner | Modified in Phase 3 |
| `shared/widget-kits/linear/LinearGaugeEngine.js` | Linear gauge rendering pipeline | Modified in Phase 3 to document engine-owned ratio fallback ownership |
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Semicircle gauge pipeline | Modified in Phase 3 to document engine-owned ratio fallback ownership |
| `shared/widget-kits/radial/FullCircleRadialEngine.js` | Full-circle dial pipeline | Modified in Phase 3 to document engine-owned ratio fallback ownership |
| `shared/widget-kits/linear/LinearCanvasPrimitives.js` | Linear canvas drawing primitives | Modified in Phase 4 and Phase 5 |
| `shared/widget-kits/radial/RadialCanvasPrimitives.js` | Radial canvas drawing primitives | Modified in Phase 5 |
| `shared/widget-kits/radial/RadialTickMath.js` | Radial tick math helper | Modified in Phase 6 |
| `shared/widget-kits/canvas/CanvasLayerCache.js` | Canvas layer caching | Modified in Phase 7 (suppression only) |
| `shared/theme/ThemeResolver.js` | Theme resolution | Modified in Phase 7 (suppression only) |
| `documentation/TECH-DEBT.md` | Tech debt tracking | Modified in Phase 0 and Phase 9 |
| `documentation/conventions/coding-standards.md` | Coding standards | Modified in Phase 9 |
| `CONTRIBUTING.md` | Contributor workflow | Modified in Phase 9 |
| `AGENTS.md` | AI agent instructions | Modified in Phase 9 |
| `CLAUDE.md` | Claude-specific instructions | Modified in Phase 9 |

## Related

- [core-principles.md](core-principles.md) — Principles #10, #16, #17, #18 directly motivate this plan
- [PLAN2.md](PLAN2.md) — Responsive rollout that established the layout/engine contract hierarchy
- [conventions/coding-standards.md](conventions/coding-standards.md) — Coding standards for lint suppression format
- [../ARCHITECTURE.md](../ARCHITECTURE.md) — Layer dependency rules
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — Contributor workflow for running linters
