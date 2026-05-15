# PLAN24: Close the ROADMAP Fixes and Correct XTE/Mobile Rendering

## Status

**Verified and signed off.** All baseline facts, root causes, duplication counts, file references, and implementation instructions cross-checked against both source trees (dyninstruments-main, avnav-master).

This plan is the execution source of truth for the four outstanding items in `ROADMAP.md`:

1. make the border color follow `--dyni-fg` by default,
2. show the XTE `No Waypoint` state on `navpage`,
3. add the new AvNav `plugin.mjs` entrypoint while retaining `plugin.js`,
4. eliminate the Chrome mobile-view rendering failure for horizontal Dyni widgets.

It also includes three companion fixes directly related to the work above:

5. **XTE highway static-layer DPI correction** — root-caused before the plan was written; directly related to XTE rendering.
6. **Canvas state-screen visual alignment** — `StateScreenCanvasOverlay` does not match the visual style of the HTML `StateScreenMarkup` used by route widgets; canvas state screens must be brought into line.
7. **Shared-helper extraction, deduplication, and null-value safety** — `RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, and `RadialToolkit` contain generic code used by every widget type. `toFiniteNumber` is duplicated 15 times. `clamp` is duplicated 3 times with inconsistent behavior. All `Number(raw)` formatter sites silently convert `null` to `0`. This phase extracts canonical shared modules (`ValueMath`, `CanvasTextLayout`, `CanvasTextFitting`, `GaugeToolkit`), eliminates all duplicates, and fixes null-safety across every rendering path.

---

## Goal

After PLAN24 is complete:

1. `surface.border` resolves to the fully resolved foreground color whenever `--dyni-border` is not explicitly set.
   - Default day border follows day `surface.fg`.
   - Default night border follows night `surface.fg`.
   - A user-supplied `--dyni-fg` automatically becomes the border color unless `--dyni-border` overrides it.
   - Explicit `--dyni-border` remains authoritative.

2. `XteDisplayWidget` shows the shared `No Waypoint` state screen whenever `display.wpName` is an empty string, including the `navpage` graphics-only configuration where `layout.hideTextualMetrics === true`.

3. AvNav can load Dyni through modern `plugin.mjs` plugin handling while legacy systems can still use `plugin.js`.
   - Both entrypoints use one shared bootstrap core.
   - The modern module path receives and preserves the AvNav API object passed to the default export.
   - Module reloads are safe when AvNav uses timestamped plugin base URLs; stale classic-script DOM IDs must not suppress loading updated files.

4. Horizontal Dyni widgets in AvNav map-page `top`, `bottomLeft`, and `bottomRight` containers no longer trigger Chrome mobile-view width explosions or sad-face canvases.
   - Dyni defines the same effective baseline width contract as AvNav’s small horizontal widgets: `width: 7em` on horizontal Dyni widget roots.
   - The rule is fixed infrastructure, not a user-facing theme token.

5. The XTE highway static background renders at the correct dimensions on HiDPI displays.
   - The cached static highway layer uses the same device-pixel-ratio transform contract as the rest of the canvas rendering path.
   - The dynamic indicator and center strip remain aligned with the static background.

6. Canvas state screens (`StateScreenCanvasOverlay`) match the visual style of HTML state screens (`StateScreenMarkup`).
   - The dim 20% opacity background fill is removed; canvas state screens render the label on a clean canvas, matching the HTML state-screen appearance.
   - Text fitting uses measured width-constrained sizing consistent with `StateScreenTextFit`, replacing the fixed 18%-of-min-dimension formula.
   - All canvas widgets that use the shared overlay (XteDisplayWidget, ThreeValueTextWidget, PositionCoordinateWidget, CenterDisplayTextWidget, and all radial and linear gauge widgets) adopt the new appearance.

7. Shared helpers are deduplicated, correctly placed, and null-safe.
   - A new `ValueMath` module is the canonical source for `isFiniteNumber`, `toFiniteNumber`, `clamp`, `formatGaugeDisplay`, angle formatters, tick-step resolvers, and other generic numeric helpers previously scattered across `RadialValueMath`, `LinearGaugeMath`, and 15+ inline `toFiniteNumber` copies.
   - `RadialTextLayout` and `RadialTextFitting` are extracted into generic `CanvasTextLayout` and `CanvasTextFitting` modules.
   - All internal Dyni code migrates to the canonical modules directly. `RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, and `RadialToolkit` are slimmed to their genuinely radial responsibilities plus user-facing re-export wrappers.
   - `LinearGaugeEngine` and `XteDisplayWidget` depend on `GaugeToolkit`, not `RadialToolkit`. Only the genuinely radial engines (`FullCircleRadialEngine`, `SemicircleRadialEngine`) still use `RadialToolkit`.
   - Every `Number(raw)` site that converts sensor values is null-safe; `null` store values produce `"---"` across all widget types, not `"0"`.
   - No inline duplicates of `toFiniteNumber`, `clamp`, `clampPositive`, `ensureObject`, or `trimText` remain.

8. Tests, docs, release packaging, and `ROADMAP.md` agree with the new behavior.

---

## Root-Cause Findings Already Established

### A. XTE static highway is half-sized because its cached offscreen canvas is not DPI-transformed

This cause is code-certain.

Current behavior:

- `runtime/canvas-runtime.js` sizes the visible canvas backing buffer to `CSS size × DPR` and applies a DPR transform to the visible drawing context.
- `shared/widget-kits/canvas/CanvasLayerCache.js` creates raw offscreen canvases at backing-buffer size and deliberately leaves transform ownership to the caller.
- Cached radial and linear renderers already set an explicit transform before drawing into their offscreen layers.
- `widgets/text/XteDisplayWidget/XteDisplayWidget.js` rebuilds the cached static highway layer without applying that transform, then blits the full layer onto the visible DPR-transformed canvas.

Therefore, on a DPR 2 display:

- static highway geometry is drawn into only the top-left quarter of the raw backing layer in CSS-space coordinates,
- the cache blit scales that under-filled layer back to widget size,
- the result is a static highway background that visually occupies half the intended width and height,
- while the dynamic indicator and middle strip remain correct because they are drawn directly on the already transformed visible context.

**Fix owner:** `XteDisplayWidget` only. Do **not** change the global `CanvasLayerCache` transform contract.

### B. Chrome mobile rendering failure is a host-width contract failure, not a Dyni canvas DPR miscalculation

This cause was isolated in Chrome DevTools mobile emulation.

Observed broken state:

- Failing widgets were only Dyni widgets in AvNav horizontal map-page containers:
  - `.widgetContainer.horizontal.bottomLeft`
  - `.widgetContainer.horizontal.bottomRight`
- Their browser-computed CSS width was already absurd before canvas allocation:
  - approximately `33,554,430px` CSS width,
  - approximately `67,108,860px` canvas backing width at DPR 2.
- Dyni’s canvas runtime was simply applying its normal contract:
  - `backingWidth = computedCssWidth × DPR`.
- Vertical Dyni widgets on the same page remained normal.

Validated hotfix:

```css
.widgetContainer.horizontal .widget.dyniplugin.horizontal {
  width: 7em;
}
```

This single width rule restored normal sizing in mobile emulation:

- top horizontal widget: sane flex-expanded CSS width,
- bottom widgets: sane flex-expanded CSS width,
- backing canvas width exactly matched `CSS width × DPR`,
- no gigantic canvases.

**Fix owner:** Dyni plugin host CSS. The required contract is a definite baseline width for horizontal Dyni widget roots. No AvNav core patch is required for this plan.

---

## Shared Decisions Locked for PLAN24

These decisions were resolved before writing this plan and are not open implementation branches:

1. **No Waypoint behavior:** show `No Waypoint` even when XTE textual metrics are hidden.
2. **Border fallback semantics:** exact resolved foreground fallback unless `--dyni-border` is explicit.
3. **Plugin architecture:** one shared bootstrap core used by both `plugin.js` and `plugin.mjs`.
4. **Horizontal mobile fix:** fixed CSS width rule `width: 7em`; no user-tunable width token.
5. **XTE DPR fix scope:** correct `XteDisplayWidget`’s static cache rebuild only; do not globalize transforms in `CanvasLayerCache`.
6. **Module reload safety:** classic script identities used from `plugin.mjs` must be base-URL/generation-aware so timestamped AvNav reloads do not reuse stale DOM script IDs.
7. **Canvas state-screen alignment scope:** change the shared `StateScreenCanvasOverlay` globally; all canvas consumers (XTE, ThreeValueText, PositionCoordinate, CenterDisplayText, and all radial and linear gauge widgets) adopt the new visual style.
8. **Voltage null fix scope:** fix at the rendering/formatter layer (`formatGaugeDisplay` and equivalent sites) via the `ValueMath` extraction; mappers pass values through transparently.
9. **Deduplication strategy:** new canonical modules (`ValueMath`, `CanvasTextLayout`, `CanvasTextFitting`, `GaugeToolkit`) own all shared logic. All internal Dyni code migrates its `require()` calls to the canonical modules directly. Existing modules (`RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, `RadialToolkit`) remain as thin re-export wrappers registered under their old component IDs so that user-facing layouts, user.css references, and any external user code are not broken. No backward-compat aliases for renamed functions — internal callers adopt the new names.
10. **Generic helpers live in `ValueMath`:** `trimText` and `ensureObject` are included in `ValueMath` despite not being numeric — the alternative (a separate micro-module) adds more component registration overhead than it saves at Dyni's scale.

---

## Verified Baseline

The following facts are verified against the current uploaded source trees and the live reproduction session.

### Theme and border baseline

1. `runtime/theme/model.js` defines `surface.fg` from `--dyni-fg`.
2. `runtime/theme/model.js` defines `surface.border` from `--dyni-border` with its own independent day default `rgba(0, 0, 0, 0.30)`.
3. `runtime/theme/model.js` defines an independent night border default `rgba(252, 11, 11, 0.18)`.
4. The default night preset also contains an explicit independent `surface.border` value.
5. `runtime/theme/resolver.js` resolves each token independently through this merge order:
   - root input override,
   - preset mode override,
   - preset base override,
   - global mode default,
   - global base default.
6. The current resolver has no derived-token rule that says “border inherits the resolved foreground when border is absent.”
7. `plugin.css` consumes `--dyni-theme-surface-border` for border color; output-token semantics can therefore be changed without rewriting every widget stylesheet.

### XTE state-screen baseline

8. `widgets/text/XteDisplayWidget/XteDisplayWidget.js` resolves the XTE state branch before drawing the highway.
9. It currently selects `noTarget` only when:
   - `display.wpName` is a string,
   - the trimmed string is empty,
   - and `hideTextualMetrics` is **false**.
10. That final `!hideTextualMetrics` gate prevents `No Waypoint` from appearing in the navpage graphics-only XTE configuration.
11. `tests/widgets/text/XteDisplayWidget.test.js` currently contains a test that explicitly asserts the old undesired behavior: no `No Waypoint` state when textual metrics are hidden.
12. `documentation/widgets/xte-display.md` currently documents the same old condition by saying `noTarget` applies when textual metrics are visible.
13. Shared state-screen conventions already define `noTarget` as `No Waypoint` and do not make it conditional on XTE metric visibility.

### XTE cached-layer DPI baseline

14. `runtime/canvas-runtime.js` renders in CSS coordinates on a DPR-transformed visible canvas context.
15. `shared/widget-kits/canvas/CanvasLayerCache.js` supplies offscreen layer canvases at raw backing-buffer size and leaves transform application to callers.
16. `shared/widget-kits/radial/FullCircleRadialEngine.js` applies a DPR transform before drawing into cached layers.
17. `shared/widget-kits/linear/LinearGaugeEngine.js` applies an explicit layer transform before drawing into cached layers.
18. `XteDisplayWidget.js` currently clears the static layer with raw `layerCanvas.width/height` and draws static highway geometry without any layer transform.
19. That difference is sufficient to explain the exact DPR-dependent half-width/half-height static highway bug.

### Plugin startup baseline

20. Dyni currently ships `plugin.js` only; no `plugin.mjs` entrypoint exists.
21. `plugin.js`:
   - discovers `avnav.api`,
   - derives its base from `AVNAV_BASE_URL`,
   - writes `window.DyniPlugin.baseUrl`,
   - writes `window.DyniPlugin.avnavApi`,
   - attempts `bootstrap-bundle.js`,
   - falls back to `config/bootstrap-manifest.js`,
   - then calls `window.DyniPlugin.runtime.runInit()`.
22. `plugin.js` currently owns script-ID generation and `loadScriptOnce` directly; this logic is not reusable by a second entrypoint without extraction.
23. `tools/release-zip-builder.mjs` includes `plugin.js`, `plugin.css`, `plugin.json`, and `config/bootstrap-manifest.js` as fixed runtime files.
24. Release tooling does not currently include `plugin.mjs` or a dedicated shared bootstrap-core file.
25. Existing plugin bootstrap tests are built around the `plugin.js` path.

### AvNav modern module-loader baseline

26. The uploaded AvNav host source prefers `plugin.mjs` when it is present.
27. AvNav dynamically imports `plugin.mjs` and calls its default export with a modern API object.
28. The modern API exposes `getBaseUrl()` for plugin-local assets.
29. AvNav can change the plugin base to a timestamped `__<timestamp>/` directory when a module update is detected.
30. If Dyni’s classic script DOM IDs stay globally static under the module path, a later module reload can mistakenly treat old scripts as already loaded.
31. Therefore, module-path script identity must be aware of the effective base/generation.

### Mobile horizontal widget baseline

32. `plugin.css` fills Dyni shell/surface/canvas descendants with `width: 100%`.
33. `plugin.css` gives the Dyni shell `flex: 1 1 auto`, `min-width: 0`, and `max-width: 100%`.
34. `plugin.css` has a vertical-container override but no horizontal-widget baseline width rule.
35. AvNav’s `viewer/style/widgets.less` establishes horizontal container flex layout.
36. AvNav also uses `@size1: 7em` as a native small-widget width convention for several built-in widgets.
37. Dyni external horizontal widgets do not automatically inherit those AvNav native width classes.
38. In Chrome mobile emulation, broken horizontal Dyni widgets reported CSS widths around `33.5 million px` and canvas widths around `67 million px` at DPR 2.
39. The same page’s vertical Dyni widgets reported normal dimensions and normal DPR scaling.
40. Applying only `width: 7em` to `.widgetContainer.horizontal .widget.dyniplugin.horizontal` restored normal dimensions and preserved horizontal flex expansion.

### Documentation and roadmap baseline

41. `ROADMAP.md` still lists all four target fixes under `### Fixes`.
42. Runtime/docs guidance currently talks about `plugin.js` as the sole automatic startup owner, which will become outdated once `plugin.mjs` lands.
43. XTE docs still describe the old `No Waypoint` gate.
44. Theme docs list `--dyni-border` and the surface-border output token but do not describe the new “foreground unless explicitly overridden” fallback rule.
45. Canvas caching docs do not explicitly call out the XTE offscreen-layer transform requirement that this plan will enforce.

### Canvas state-screen baseline

46. `shared/widget-kits/state/StateScreenCanvasOverlay.js` draws state screens on canvas with a 20% opacity foreground-colored `fillRect` over the entire canvas area, then centers the label at `Math.floor(Math.min(W, H) * 0.18)` px with no width fitting.
47. `shared/widget-kits/state/StateScreenMarkup.js` renders HTML state screens with no background overlay — just a centered label inside a `dyni-state-screen-body` flexbox container.
48. `shared/widget-kits/state/StateScreenTextFit.js` measures label text against the available container width (80%) and height (80%) and scales the font to fit, producing a CSS `font-size` style string. This is used by the HTML path but not by the canvas path.
49. `StateScreenCanvasOverlay` is used by seven direct callers: XteDisplayWidget, ThreeValueTextWidget, PositionCoordinateWidget, CenterDisplayStateAdapter (gateway for CenterDisplayTextWidget), FullCircleRadialEngine (all full-circle radial gauges), SemicircleRadialEngine (all semicircle radial gauges), and LinearGaugeEngine (all linear gauges). All pass the same interface: `{ ctx, W, H, family, color, labelWeight, kind }`. The visual change therefore affects every canvas-based widget in the system.
50. `tests/shared/state/StateScreenCanvasOverlay.test.js` asserts the current dim-overlay behavior, including the presence of a `fillRect` call and centered `fillText`.

### Voltage null-value baseline

51. `VesselMapper` maps the plain `voltage` kind via `toolkit.out(p.value, ...)`, and `voltageLinear`/`voltageRadial` via direct `{ value: p.value, ... }`. None of these normalize `null`/`undefined`/empty-string to `undefined`.
52. `VesselMapper` maps `pitch` and `roll` with explicit null-normalization: `(rawValue == null || (typeof rawValue === "string" && rawValue.trim() === "")) ? undefined : rawValue`.
53. `shared/widget-kits/radial/RadialValueMath.js` `formatGaugeDisplay` converts the raw value with `Number(raw)`. `Number(null) === 0`, which passes `Number.isFinite()`, so `null` is treated as a valid `0` reading.
54. `shared/widget-kits/format/PlaceholderNormalize.js` returns `"---"` as the default placeholder when the input is `null`, `undefined`, or a dash-only string.
55. Existing VesselMapper tests for voltage kinds always pass valid numeric values (`12.4`) and do not cover `null`, `undefined`, or empty-string store values.

### Helper duplication and misplacement baseline

56. `toFiniteNumber` (`const n = Number(value); return Number.isFinite(n) ? n : undefined`) is defined as a private function in 15 files: `HtmlWidgetUtils`, `TextFitMath`, `GeometryScale`, `CenterDisplayMath`, `EditRouteRenderModel`, `EditRouteLayoutMath`, `RoutePointsRenderModel`, `StateScreenTextFit`, `RoutePointsViewModel`, `AisTargetViewModel`, `EditRouteViewModel`, `ActiveRouteViewModel`, `ClusterMapperToolkit`, `TemporaryHostActionBridge`, `ClusterSurfacePolicy`. All copies are identical.
57. `clamp` is defined in 3 files with inconsistent behavior: `RadialValueMath` coerces via `Number()` (null → 0 → clamped), `LinearGaugeMath` checks `Number.isFinite()` first (null → `lo`), `XteHighwayPrimitives` has a third inline copy.
58. `clampPositive` is defined identically in `RadialTextFitting` and `StateScreenTextFit`.
59. `ensureObject` is defined identically in `ClusterWidget`, `RouteActivationController`, and `RouteActivationPayloadBuilder`.
60. `trimText` is defined identically in `HtmlWidgetUtils`, `RouteActivationPayloadBuilder`, and `ClusterShellRenderer`.
61. `ClusterMapperToolkit` defines inline fallback implementations of `norm360` and `norm180` for when `RadialAngleMath` is unavailable, duplicating the canonical versions in `RadialAngleMath`.
62. `RadialValueMath` exports 23 functions; only 6 are radial geometry (`valueToAngle`, `angleToValue`, `buildValueTickAngles`, `sectorAngles`, `buildHighEndSectors`, `buildLowEndSectors`). The remaining 17 are generic and used by linear widgets, TextLayoutEngine, and LinearGaugeEngine.
63. `RadialTextLayout` provides generic canvas text drawing functions (drawClampedLine, drawCaptionMax, drawValueUnitWithFit, drawInlineCapValUnit, drawThreeRowsBlock). Used by nav HTML fit modules, TextLayoutPrimitives, and both radial and linear gauge text layouts. Nothing in it is radial-specific.
64. `RadialTextFitting` provides generic canvas text measurement and fitting functions (setFont, measureTextWidth, fitTextPx, measureValueUnitFit, fitInlineCapValUnit). Used through RadialTextLayout. Nothing in it is radial-specific.
65. `RadialToolkit` bundles 6 return members: `theme`, `text` (RadialTextLayout), `value` (RadialValueMath), `angle` (RadialAngleMath), `tick` (RadialTickMath), `draw` (aggregated from RadialCanvasPrimitives and RadialFrameRenderer). `LinearGaugeEngine` depends on it but only uses `theme`, `text`, and `value` — not the three actually-radial members (`angle`, `tick`, `draw`). (`LinearGaugeTextLayout` does not depend on `RadialToolkit`; its only component dependency is `LinearGaugeLabelFit`.)
66. The `Number(raw)` null-coercion bug (`Number(null) === 0` passing `Number.isFinite()`) exists in 12 sites: `formatGaugeDisplay`, `DepthDisplayFormatter.formatDisplay`, `WindRadialWidget.windFormatSpeedText`, `WindLinearWidget.resolveSpeedText`, `WindLinearWidget` inline angle conversion, `CompassRadialWidget` marker check, `CompassLinearWidget` marker check, `CompassLinearWidget` heading conversion, `LinearGaugeEngine` default `formatDisplay` fallback, `SemicircleRadialEngine` default `formatDisplay` fallback, `PositionCoordinateWidget.formatAxisValue` non-raw path, and `ClusterMapperToolkit.makeAngleFormatter`.

---

## Hard Constraints

1. **Do not change AvNav core code as part of this plan.**
   - AvNav source was used to confirm host behavior and module-loader contracts.
   - The shipped fix belongs in Dyni unless implementation disproves the already validated CSS correction.

2. **Do not remove `plugin.js`.**
   - It remains the legacy startup path.

3. **Do not duplicate full bootstrap logic across `plugin.js` and `plugin.mjs`.**
   - Extract a shared core.
   - Keep entrypoints thin and role-specific.

4. **Do not make horizontal widget width a user-facing token.**
   - Use the fixed baseline `width: 7em` rule.

5. **Do not “fix” the XTE static highway by changing `CanvasLayerCache` globally.**
   - Existing radial and linear callers already manage layer transforms.
   - A global cache behavior change risks double-scaling existing renderers.

6. **Do not restore textual metric rows on navpage to solve `No Waypoint`.**
   - The state-screen fix must be independent of `hideTextualMetrics`.

7. **Do not weaken explicit border customization.**
   - `--dyni-border` remains an override and must win over the inherited foreground fallback.

8. **Do not let module reloads reuse stale script IDs.**
   - The `plugin.mjs` path must distinguish script identities across AvNav timestamped base URLs or equivalent generation information.

9. **Maintain the existing bundle-first, manifest-fallback startup behavior.**
   - PLAN24 modernizes ownership; it does not regress startup/release performance work already present.

10. **Keep docs and tests in lockstep with behavior changes.**
    - Every visible or contract-level behavior change in this plan requires test and documentation updates.

11. **Do not change `StateScreenMarkup` or `HtmlShadowCommon.css` to accommodate the canvas alignment.**
    - The canvas overlay must match the HTML style, not the other way around.

12. **Migrate all internal `require()` calls to canonical modules; keep wrappers only for user-facing backward compatibility.**
    - All internal Dyni code switches `require("RadialValueMath")` → `require("ValueMath")`, `require("RadialTextLayout")` → `require("CanvasTextLayout")`, `require("RadialToolkit")` → `require("GaugeToolkit")` (or keeps `RadialToolkit` where genuinely radial). `RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, and `RadialToolkit` remain registered as component IDs with re-exports so user layouts and external user code are not broken.

---

## Compatibility and User-Visible Behavior Changes

### Border color

The default visual border appearance will change: absent a `--dyni-border` override, the border now uses the foreground color exactly instead of a softer independent RGBA value. This is intended and requested. Users who need a subtler border retain full control through explicit `--dyni-border`.

### XTE navpage empty state

A graphics-only XTE widget with no active waypoint will now show `No Waypoint` instead of continuing to render an empty/live highway branch. This aligns it with the shared state-screen model used by route-related widgets.

### Plugin loading

Modern AvNav versions that prefer `plugin.mjs` will use the new module entrypoint. Older systems will continue with `plugin.js`. Runtime behavior after bootstrap should remain equivalent.

### Mobile horizontal widgets

Horizontal Dyni widgets will gain a definite baseline width. In AvNav horizontal flex containers, they may still grow beyond `7em`; the rule provides a safe basis, not a hard maximum.

### XTE highway drawing

The highway background will occupy the full intended geometry on DPR > 1 screens. No behavior change is expected at DPR 1 except internal cache setup normalization.

### Canvas state screens

All canvas widgets that show state screens (XTE, ThreeValueText, PositionCoordinate, CenterDisplayText, and all radial and linear gauge widgets) will lose the subtle foreground-colored tint overlay and gain properly fitted label text. The visual result will match the HTML state screens used by route widgets. This is a visible change on any canvas widget entering a `disconnected`, `noTarget`, `noRoute`, or `noAis` state.

### Voltage and sensor missing data

All gauge, compass, and wind widgets with missing or unconfigured store data will now show `"---"` instead of `"0"`. A genuine sensor reading of 0 remains displayed correctly — `isFiniteNumber` rejects `null` by type-checking (`typeof n === "number"`) while accepting `0`.

### Shared-helper extraction

All internal Dyni code migrates `require()` calls from the old module names (`RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, `RadialToolkit`) to the canonical modules (`ValueMath`, `CanvasTextLayout`, `CanvasTextFitting`, `GaugeToolkit`), except for genuinely radial engines (FullCircleRadialEngine, SemicircleRadialEngine) which keep `RadialToolkit`. The old component IDs remain registered as re-export wrappers so that user layouts and external user code continue to resolve them. The `clamp` function adopts the null-safe `LinearGaugeMath` behavior (null → `lo`) rather than the coercing `RadialValueMath` behavior (null → `Number(null)` → 0 → clamped). The tick-step resolvers lose the "Semicircle" prefix (`resolveStandardTickSteps` etc.); all internal callers are updated to the new names.

---

## Implementation Order

## Phase 0 — Preflight and Issue Fixtures

### Purpose

Make the plan executable without ambiguity and preserve reproductions as test intent before production edits.

### Work

1. Read the project docs/contracts that constrain the touched areas:
   - `ROADMAP.md`
   - XTE widget docs
   - theme-token docs
   - plugin runtime/lifecycle docs
   - canvas-layer cache conventions
   - release packaging tests and bootstrap tests.

2. Treat the mobile DevTools reproduction as an acceptance fixture:
   - horizontal map widgets fail before the width rule,
   - same/widgets recover after `width: 7em`.

3. Treat the XTE static highway screenshot/reproduction as the visual symptom of the already code-proven DPR cache transform bug.

### Exit condition

The implementation work proceeds with the decisions in this plan unchanged; no additional design branch remains unresolved.

---

## Phase 1 — Fix XTE `No Waypoint` State in Graphics-Only Mode

### Purpose

Bring `navpage` XTE empty-state behavior into line with the shared state-screen contract.

### Code changes

1. Update `widgets/text/XteDisplayWidget/XteDisplayWidget.js`:
   - Remove the `!hideTextualMetrics` requirement from the `noTarget` condition.
   - Continue to prioritize `disconnected` above `noTarget` as before.
   - Preserve the existing data branch for all non-empty waypoint names.

2. Update `tests/widgets/text/XteDisplayWidget.test.js`:
   - Replace the old test that asserts “no `No Waypoint` when textual metrics are hidden.”
   - New expected behavior:
     - empty `wpName`, hidden textual metrics → state screen draws `No Waypoint`,
     - no static highway draw,
     - no dynamic highway draw,
     - no textual metric rows.
   - Keep the existing visible-metrics `No Waypoint` test.
   - Keep/extend precedence coverage if needed so `disconnect === true` still wins over empty waypoint state.

3. Update `documentation/widgets/xte-display.md`:
   - Remove “and textual metrics are visible” from the `noTarget` condition.
   - Clarify that `layout.hideTextualMetrics` suppresses the live readouts/name but not state screens.

### Tests

Run:

```bash
npx vitest run tests/widgets/text/XteDisplayWidget.test.js
```

### Exit condition

`No Waypoint` displays consistently in both full XTE and navpage graphics-only XTE modes, with tests and docs updated.

---

## Phase 2 — Correct XTE Static Highway Offscreen DPR Transform

### Purpose

Fix the half-sized XTE highway background without changing shared cache semantics.

### Code changes

1. Update `widgets/text/XteDisplayWidget/XteDisplayWidget.js` inside the `staticLayer.ensureLayer(...)` rebuild callback.

2. Before clearing/drawing the cached static highway:
   - apply the layer transform that maps CSS-space geometry onto the layer backing buffer,
   - follow the existing radial/linear cached-renderer convention,
   - clear in the coordinate system consistent with that transform,
   - draw `primitives.drawStaticHighway(...)` in the same CSS-space geometry already used by the widget.

3. Keep `CanvasLayerCache` unchanged.

### Test changes

Extend `tests/widgets/text/XteDisplayWidget.test.js`, or add a tightly scoped companion test if clearer, to assert the static layer setup is DPR-aware.

Minimum required coverage:

1. Use a DPR-style canvas backing size where layer backing dimensions exceed CSS geometry dimensions.
2. Assert the static layer receives the expected transform before static draw.
3. Assert static highway render remains a single cached rebuild under unchanged keys.
4. Preserve existing dynamic highway assertions.

### Documentation

Update at least one of:

- `documentation/widgets/xte-display.md`,
- `documentation/conventions/canvas-layer-caching.md`,
- `documentation/shared/canvas-layer-cache.md` if present in the implementation checkout.

The documentation change must make the offscreen transform contract explicit enough to prevent reintroducing this exact bug.

### Tests

Run:

```bash
npx vitest run tests/widgets/text/XteDisplayWidget.test.js
```

### Exit condition

The XTE static highway renders at full intended size on DPR > 1, dynamic overlays remain aligned, and a test prevents regression.

---

## Phase 3 — Make Surface Border Derive from Resolved Foreground

### Purpose

Implement the ROADMAP requirement literally: border color follows `--dyni-fg` unless explicitly overridden.

### Required semantics

The resolver must satisfy all of these cases:

1. No `--dyni-border`, day mode:
   - `surface.border === surface.fg`.

2. No `--dyni-border`, night mode:
   - `surface.border === surface.fg` after night-mode resolution.

3. Custom `--dyni-fg`, no `--dyni-border`:
   - `surface.border === custom surface.fg`.

4. Explicit `--dyni-border`:
   - `surface.border === explicit border`, regardless of foreground.

### Code changes

1. Rework the theme model/resolver so `surface.border` no longer has an independent effective fallback that wins when no border input exists.

2. Preserve the public input variable `--dyni-border` and output variable `--dyni-theme-surface-border`.

3. Remove or neutralize default/preset border entries that would otherwise prevent inheritance from the resolved foreground.

4. Implement the fallback after the foreground is resolvable, so border follows the **resolved** foreground rather than merely the raw CSS input.

### Recommended implementation shape

A clean implementation may choose either of these equivalent approaches:

- a resolver-level derived fallback for `surface.border`, or
- a model/resolver rule that resolves explicit border values first and, when absent, assigns the already resolved `surface.fg`.

The chosen code must make precedence obvious and testable.

### Test changes

Add focused resolver/runtime coverage, most likely in `tests/runtime/theme-runtime.test.js` or a dedicated theme-resolver test:

1. day default border equals foreground,
2. night default border equals foreground,
3. custom `--dyni-fg` flows into border,
4. explicit `--dyni-border` overrides inherited foreground.

### Documentation

Update:

- `documentation/shared/theme-tokens.md`,
- `documentation/shared/css-theming.md`.

State clearly:

- `--dyni-border` is optional,
- when omitted, border follows the resolved foreground token,
- the output token remains `--dyni-theme-surface-border`.

### Tests

Run:

```bash
npx vitest run tests/runtime/theme-runtime.test.js
```

### Exit condition

The border token contract matches the ROADMAP wording exactly and is protected by tests.

---

## Phase 4 — Add `plugin.mjs` with a Shared Bootstrap Core and Reload-Safe Script Identity

### Purpose

Support AvNav’s modern module plugin path without forking Dyni startup behavior or losing legacy support.

### Target architecture

Refactor current startup into three responsibilities:

1. **Shared bootstrap core**
   - Owns common Dyni bootstrap orchestration:
     - namespace preparation,
     - base URL handling inputs,
     - API object injection into `window.DyniPlugin.avnavApi`,
     - script loading,
     - bundle-first startup,
     - manifest fallback,
     - `runInit()`.

2. **Legacy `plugin.js` adapter**
   - Still resolves `avnav.api` / `window.avnav.api`.
   - Still derives base URL from `AVNAV_BASE_URL`.
   - Delegates to the shared bootstrap core.

3. **Modern `plugin.mjs` adapter**
   - Default-exports an async initializer compatible with AvNav’s module loader.
   - Receives the API object from AvNav.
   - Uses `api.getBaseUrl()` for plugin-local assets.
   - Delegates to the shared bootstrap core.
   - Returns any intended shutdown hook only if the shared startup design already supports one; otherwise returning nothing is acceptable.

### Shared core placement

Choose a runtime path that can be released and tested consistently, for example:

- `runtime/plugin-bootstrap-core.js`,

or an equivalent clearly named startup-core location.

The exact name may vary, but it must be a single reusable implementation used by both entrypoints.

### Critical reload-safety requirement

For the module path, script IDs used by `loadScriptOnce` must not remain globally static across AvNav timestamped base URLs.

The implementation must:

1. identify the effective bootstrap generation from the module base URL or an equivalent deterministic discriminator,
2. include that discriminator in classic script DOM IDs created from the `plugin.mjs` path,
3. continue deduplicating repeated loads within the same generation,
4. allow a later timestamped generation to load new scripts rather than silently seeing old IDs and skipping them.

This is mandatory because AvNav may load updated modules from a base such as `.../__<timestamp>/`.

### Code changes

1. Add the shared bootstrap core file.
2. Refactor `plugin.js` into a thin adapter using the shared core.
3. Add `plugin.mjs` default export using the shared core.
4. Preserve all current startup error logging behavior or equivalent clarity.
5. Preserve bundle-first / manifest-fallback behavior.
6. Preserve `window.DyniPlugin.runtime.loadScriptOnce` or provide an intentionally compatible replacement if tests/docs rely on it.

### Release packaging changes

Update `tools/release-zip-builder.mjs` and relevant release tests so release ZIPs include:

- `plugin.js`,
- `plugin.mjs`,
- the shared bootstrap core file,
- existing plugin assets already covered today.

Update:

- `tests/tools/release-zip-builder.test.js`,
- `tests/tools/release-create.test.js`,
- any fixture manifests used by those tests.

### Bootstrap tests

Extend or add tests under `tests/plugin/` to cover:

1. legacy `plugin.js` still bootstraps the bundle path,
2. legacy `plugin.js` still falls back to the manifest path,
3. `plugin.mjs` default export accepts a provided API object,
4. `plugin.mjs` uses `api.getBaseUrl()` rather than `AVNAV_BASE_URL`,
5. `window.DyniPlugin.avnavApi` receives the passed modern API,
6. shared startup logic reaches `runInit()` on the module path,
7. same-base module startup deduplicates scripts,
8. changed/timestamped module base generates distinct script IDs and does not suppress loading updated files.

### Documentation updates

Update all startup docs that currently say `plugin.js` is the sole automatic owner, including:

- `documentation/architecture/runtime-lifecycle.md`,
- `documentation/architecture/component-system.md`,
- `documentation/architecture/asset-system.md`,
- `documentation/avnav-api/plugin-lifecycle.md`.

Review any guides that directly mention adding scripts to `plugin.js` or treating only `plugin.js` as startup owner, and update them if they become inaccurate.

### Tests

Run at minimum:

```bash
npx vitest run tests/plugin/plugin-bootstrap.test.js
npx vitest run tests/tools/release-zip-builder.test.js
npx vitest run tests/tools/release-create.test.js
```

Run any new plugin module test file explicitly if separated from the existing bootstrap test.

### Exit condition

Both AvNav startup generations are supported by one tested bootstrap core, release packaging includes the new entrypoint/core assets, and timestamped modern reloads cannot reuse stale classic-script IDs.

---

## Phase 5 — Fix Chrome Mobile Horizontal Dyni Widget Width Explosion

### Purpose

Prevent browser layout from assigning impossible widths to horizontal Dyni widget roots in map-page top/bottom containers.

### Code change

Add this rule to `plugin.css`:

```css
.widgetContainer.horizontal .widget.dyniplugin.horizontal {
  width: 7em;
}
```

### Why this exact rule

1. It was live-tested in the broken Chrome mobile-emulation case.
2. It fixes the root width contract while preserving AvNav horizontal flex growth.
3. It matches AvNav’s native `@size1: 7em` small-widget convention.
4. It is minimal: no unnecessary `flex`, `min-width`, or `max-width` override is required for the reproduced failure.
5. It avoids a pointless user-facing width customization surface.

### Test changes

Add a CSS contract test, preferably as a new focused test such as:

- `tests/plugin/plugin-css-host-sizing.test.js`,

or an equivalently scoped plugin CSS test.

The test must assert the presence of:

- selector: `.widgetContainer.horizontal .widget.dyniplugin.horizontal`,
- declaration: `width: 7em`.

### Manual acceptance test

In Chrome DevTools mobile emulation:

1. Load the map view with Dyni widgets in horizontal `top`, `bottomLeft`, and `bottomRight` containers.
2. Verify there are no sad-face canvases.
3. Inspect all `.dyni-surface-canvas-node` elements:
   - CSS widths are sane page/widget widths, not multi-million-pixel widths,
   - backing widths are approximately `CSS width × devicePixelRatio`,
   - horizontal widgets continue to flex-expand normally within their containers.
4. Confirm the same layout remains sane in desktop view.

### Exit condition

The reproduced mobile failure no longer occurs, the CSS width contract is tested, and no AvNav core change is needed.

---

## Phase 6 — Align Canvas State-Screen Visual Style with HTML State Screens

### Purpose

Make `StateScreenCanvasOverlay` visually match `StateScreenMarkup` so all Dyni state screens look the same regardless of rendering surface.

### Code changes

1. Update `shared/widget-kits/state/StateScreenCanvasOverlay.js`:
   - Remove the `ctx.globalAlpha = 0.20` / `ctx.fillRect(0, 0, W, H)` dim overlay.
   - Replace the fixed `Math.floor(Math.min(W, H) * 0.18)` font size with measured width-fitting logic consistent with `StateScreenTextFit`:
     - Compute a ceiling font size from `Math.floor(Math.min(W, H) * 0.8)` (80% of height).
     - Measure the label text at that size.
     - If the measured width exceeds `W * 0.8` (80% of width), scale the font proportionally downward.
   - Keep the existing centered `fillText` at `(W/2, H/2)`.

2. No changes to `StateScreenMarkup`, `StateScreenTextFit`, or `HtmlShadowCommon.css`.

### Test changes

Update `tests/shared/state/StateScreenCanvasOverlay.test.js`:

- Remove or replace the assertion that `fillRect` is called (the dim overlay no longer exists).
- Assert that `fillText` is still called with the canonical label for each kind.
- Assert that the font size adapts to canvas dimensions: a narrow canvas should produce a smaller font than a square canvas of the same area.

### Exit condition

Canvas state screens render with no dim overlay and properly fitted label text, matching the HTML state-screen appearance. All canvas consumers (XTE, ThreeValueText, PositionCoordinate, CenterDisplayText, and all radial and linear gauge widgets via FullCircleRadialEngine, SemicircleRadialEngine, and LinearGaugeEngine) inherit the change through the shared overlay.

---

## Phase 7 — Extract Shared Value Helpers, Deduplicate Utilities, and Fix Null-Value Handling

### Purpose

Eliminate misplaced, duplicated, and inconsistent numeric/text/utility helpers across the codebase. Fix the `Number(null) === 0` bug in all rendering paths. Establish a single canonical source for each shared helper.

### Root-cause summary

1. **`Number(raw)` before null guard** — twelve formatter/rendering sites convert `null` to `0` via `Number(null)`, which passes `Number.isFinite()` and displays `"0"` instead of `"---"`. The correct pattern (`isFiniteNumber` or `raw == null` guard) already exists elsewhere in the same codebase but is not used consistently.

2. **`RadialValueMath` is misnamed** — most of its functions (isFiniteNumber, clamp, formatGaugeDisplay, angle formatters, tick-step resolvers, computeMode, computePad, computeGap, normalizeRange) are generic and used by every linear widget, by TextLayoutEngine, and by LinearGaugeEngine. Only six functions are genuinely radial geometry.

3. **`RadialTextLayout` and `RadialTextFitting` are misplaced** — entirely generic canvas text drawing/measuring modules used by nav HTML fit modules, TextLayoutPrimitives, and both radial and linear gauge text layouts. Nothing in them is radial-specific.

4. **`toFiniteNumber` is duplicated 15 times** — identical `const n = Number(value); return Number.isFinite(n) ? n : undefined` appears in HtmlWidgetUtils, TextFitMath, GeometryScale, CenterDisplayMath, EditRouteRenderModel, EditRouteLayoutMath, RoutePointsRenderModel, StateScreenTextFit, four cluster viewmodels, ClusterMapperToolkit, TemporaryHostActionBridge, and ClusterSurfacePolicy.

5. **`clamp` is duplicated 3 times with inconsistent behavior** — RadialValueMath coerces with `Number()` (null → 0), LinearGaugeMath checks `Number.isFinite()` first (null → falls to `lo`), XteHighwayPrimitives has a third inline copy.

6. **Other duplicated helpers** — `clampPositive` (2 copies: RadialTextFitting, StateScreenTextFit), `ensureObject` (3 copies: ClusterWidget, RouteActivationController, RouteActivationPayloadBuilder), `trimText` (3 copies: HtmlWidgetUtils, RouteActivationPayloadBuilder, ClusterShellRenderer), `norm360`/`norm180` fallback copies in ClusterMapperToolkit.

7. **`RadialToolkit` bundles generic and radial code** — LinearGaugeEngine depends on it but only uses `theme`, `text`, and `value` — not the three actually-radial members (`angle`, `tick`, `draw`).

### Extraction plan

#### A. New module: `shared/widget-kits/value/ValueMath.js`

Extract from `RadialValueMath`:

- `isFiniteNumber` — canonical null-safe finite check (replaces all `toFiniteNumber` copies)
- `toFiniteNumber` — the `Number.isFinite(n) ? n : undefined` variant, also canonical
- `clamp` — with null-safe behavior (using `isFiniteNumber` internally, not `Number()` coercion)
- `almostInt`, `isApprox`
- `extractNumberText`
- `normalizeRange`
- `computePad`, `computeGap`, `computeMode`
- `formatGaugeDisplay` — with `raw == null` guard added before `Number()` conversion
- `formatAngle180`, `formatDirection360`, `formatMajorLabel`
- Tick-step resolvers renamed: `resolveTickSteps` (base), `resolveStandardTickSteps`, `resolveTemperatureTickSteps`, `resolveVoltageTickSteps` (drop "Semicircle" prefix)

Also provide from deduplicated sources:

- `clampPositive` — from RadialTextFitting/StateScreenTextFit
- `ensureObject` — from ClusterWidget/RouteActivation*
- `trimText` — from HtmlWidgetUtils/ClusterShellRenderer

These become the canonical implementations. All 15+ `toFiniteNumber` sites, all 3 `clamp` sites, and all other duplicates import from `ValueMath` instead of defining their own.

#### B. Slim `RadialValueMath` to radial geometry only

Retain only the six genuinely radial functions:

- `valueToAngle`, `angleToValue`
- `buildValueTickAngles`
- `sectorAngles`
- `buildHighEndSectors`, `buildLowEndSectors`

Re-export everything from `ValueMath` so the component ID remains available for user-facing backward compatibility (layouts, user code). All internal Dyni callers migrate their `require("RadialValueMath")` → `require("ValueMath")` and adopt the renamed tick-step functions (`resolveStandardTickSteps` etc.).

#### C. New module: `shared/widget-kits/text/CanvasTextLayout.js` (component ID: `CanvasTextLayout`)

Move all functions from `RadialTextLayout` into this file: `lineAnchor`, `resolveFamily`, `drawClampedLine`, `drawCaptionMax`, `drawValueUnitWithFit`, `drawInlineCapValUnit`, `drawThreeRowsBlock`.

Slim `RadialTextLayout` to a re-export wrapper: its `create()` returns the `CanvasTextLayout` instance plus an `id: "RadialTextLayout"` for user-facing backward compatibility. All internal Dyni callers migrate `require("RadialTextLayout")` → `require("CanvasTextLayout")`: TextLayoutPrimitives, AisTargetHtmlFit, EditRouteHtmlFit, ActiveRouteHtmlFit, RoutePointsHtmlFit, CenterDisplayTextWidget.

#### D. New module: `shared/widget-kits/text/CanvasTextFitting.js` (component ID: `CanvasTextFitting`)

Move all functions from `RadialTextFitting` into this file: `clampPositive` (becomes a `ValueMath` import internally), `resolveWidthCache`, `setFont`, `measureTextWidth`, `fitTextPx`, `fitSingleTextPx`, `measureValueUnitFit`, `fitInlineCapValUnit`.

Slim `RadialTextFitting` to a re-export wrapper for user-facing backward compatibility only. `CanvasTextLayout` depends on `CanvasTextFitting` directly (no longer through `RadialTextFitting`).

#### E. New module: `shared/widget-kits/gauge/GaugeToolkit.js` (component ID: `GaugeToolkit`)

A generic gauge toolkit that bundles the three non-radial members `LinearGaugeEngine` actually needs:

| Member | Source |
|---|---|
| `theme` | `componentContext.theme.tokens` |
| `text` | `CanvasTextLayout` |
| `value` | `ValueMath` |

`LinearGaugeEngine` and `XteDisplayWidget` switch their dependency from `RadialToolkit` to `GaugeToolkit`. All internal `GU.theme`, `GU.text`, `GU.value` / `toolkit.theme`, `toolkit.text`, `toolkit.value` references remain valid — only the `require()` call changes. (`LinearGaugeTextLayout` does not depend on `RadialToolkit`; its only component dependency is `LinearGaugeLabelFit`, and it needs no `require()` change.)

`RadialToolkit` extends `GaugeToolkit` by adding the three radial-specific members:

| Member | Source |
|---|---|
| `angle` | `RadialAngleMath` |
| `tick` | `RadialTickMath` |
| `draw` | `RadialCanvasPrimitives` |

`RadialToolkit.create()` returns all six members (three from `GaugeToolkit` plus three radial). Only `FullCircleRadialEngine` and `SemicircleRadialEngine` continue to `require("RadialToolkit")` — they are the only genuinely radial consumers.

### New module summary

| New file | Component ID | Extracted from | Purpose |
|---|---|---|---|
| `shared/widget-kits/value/ValueMath.js` | `ValueMath` | `RadialValueMath` + 15 `toFiniteNumber` sites + `LinearGaugeMath.clamp` + other duplicates | Canonical numeric, formatting, and utility helpers |
| `shared/widget-kits/text/CanvasTextLayout.js` | `CanvasTextLayout` | `RadialTextLayout` | Generic canvas text drawing |
| `shared/widget-kits/text/CanvasTextFitting.js` | `CanvasTextFitting` | `RadialTextFitting` | Generic canvas text measurement and fitting |
| `shared/widget-kits/gauge/GaugeToolkit.js` | `GaugeToolkit` | New (thin bundle) | Generic gauge toolkit: theme + text + value |

### Slimmed modules

| Existing file | Keeps | Re-exports from |
|---|---|---|
| `RadialValueMath` | `valueToAngle`, `angleToValue`, `buildValueTickAngles`, `sectorAngles`, `buildHighEndSectors`, `buildLowEndSectors` | `ValueMath` (all generic members). No internal Dyni code uses this wrapper; it exists only for user-facing backward compatibility. |
| `RadialTextLayout` | nothing (wrapper only) | `CanvasTextLayout`. No internal Dyni code uses this wrapper; it exists only for user-facing backward compatibility. |
| `RadialTextFitting` | nothing (wrapper only) | `CanvasTextFitting`. No internal Dyni code uses this wrapper; it exists only for user-facing backward compatibility. |
| `RadialToolkit` | bundles `angle`, `tick`, `draw` | `GaugeToolkit` (theme, text, value). Still used by `FullCircleRadialEngine` and `SemicircleRadialEngine`. |
| `LinearGaugeMath` | `keyToText`, `mapValueToX`, `resolveAxisDomain`, `buildTicks`, `formatTickLabel` | `ValueMath.clamp` (removes own copy) |

#### F. Remove duplicated inline helpers

In every module that currently defines its own `toFiniteNumber`, `clamp`, `clampPositive`, `ensureObject`, or `trimText`:

1. Add a component dependency on `ValueMath`.
2. Replace the private function with the `ValueMath` import.
3. Remove the dead private function.

For `norm360`/`norm180` fallbacks in `ClusterMapperToolkit`: since the toolkit already receives `RadialAngleMath` as a dependency, remove the inline fallback and require the dependency.

#### G. Fix all `Number(raw)` null-safety sites

With the `ValueMath` extraction providing a null-safe `formatGaugeDisplay`, the following sites are fixed by using the shared function:

1. `formatGaugeDisplay` in ValueMath — `raw == null` guard before `Number()`.
2. `DepthDisplayFormatter.formatDisplay` — same guard.
3. `WindRadialWidget.windFormatSpeedText` — same guard.
4. `WindLinearWidget.resolveSpeedText` — same guard.
5. `WindLinearWidget` inline angle conversion — use `isFiniteNumber` from ValueMath.
6. `CompassRadialWidget` marker check — replace `Number.isFinite(Number(x))` with `ValueMath.isFiniteNumber(x)`.
7. `CompassLinearWidget` marker check — same replacement.
8. `CompassLinearWidget` heading conversion — use `isFiniteNumber`.
9. `LinearGaugeEngine` default `formatDisplay` fallback — guard `null`.
10. `SemicircleRadialEngine` default `formatDisplay` fallback — same guard as `LinearGaugeEngine`.
11. `PositionCoordinateWidget.formatAxisValue` non-raw path — guard `rawValue == null` before `Number(rawValue)` so null coordinates show placeholder instead of 0°.
12. `ClusterMapperToolkit.makeAngleFormatter` — guard `raw == null` before `Number(raw)` so null wind/heading angles show `defaultText` instead of "0".

### Deduplication inventory

| Helper | Current copies | Canonical home after Phase 7 |
|---|---|---|
| `toFiniteNumber` | 15 | `ValueMath.toFiniteNumber` |
| `isFiniteNumber` | 1 (RadialValueMath) + variants | `ValueMath.isFiniteNumber` |
| `clamp` | 3 (inconsistent) | `ValueMath.clamp` (null-safe) |
| `clampPositive` | 2 | `ValueMath.clampPositive` |
| `ensureObject` | 3 | `ValueMath.ensureObject` |
| `trimText` | 3 | `ValueMath.trimText` |
| `norm360`/`norm180` | RadialAngleMath + inline fallback | `RadialAngleMath` only |
| `formatGaugeDisplay` | 1 (RadialValueMath) | `ValueMath.formatGaugeDisplay` (null-safe) |
| Canvas text drawing | `RadialTextLayout` | `CanvasTextLayout` |
| Canvas text fitting | `RadialTextFitting` | `CanvasTextFitting` |

### Test changes

1. **New `tests/shared/value/ValueMath.test.js`** — canonical tests for all extracted functions, including null/undefined/empty-string handling for `isFiniteNumber`, `toFiniteNumber`, `clamp`, and `formatGaugeDisplay`.

2. **Update existing RadialValueMath tests** (`tests/shared/radial/RadialValueMath.test.js` or equivalent) — verify re-export compatibility; the tests should still pass through the wrapper.

3. **Update existing LinearGaugeMath tests** — remove `clamp` tests that are now covered by `ValueMath`.

4. **Add null-value tests** for each `Number(raw)` fix site:
   - `formatGaugeDisplay(null, ...)` → `{ num: NaN, text: "---" }`
   - `DepthDisplayFormatter.formatDisplay(null, ...)` → `{ num: NaN, text: "---" }`
   - Wind speed with `null` → placeholder text
   - Compass marker with `null` → marker not rendered
   - All voltage/depth/speed/temperature gauges with `null` → `"---"`

5. **Update VesselMapper tests** — add `null`/`undefined`/empty-string value coverage for voltage kinds to confirm the end-to-end pipeline now shows `"---"`.

6. **Verify no test regressions** across all widget test suites after the deduplication.

### Release packaging

Register the new modules as components in the appropriate registry files so they are discovered by the component system and included automatically in the release manifest:

- `ValueMath` in `config/components/registry-shared-foundation-geometry.js` (alongside `RadialValueMath`)
- `CanvasTextLayout` in `config/components/registry-shared-foundation-geometry.js` (alongside `RadialTextLayout`)
- `CanvasTextFitting` in `config/components/registry-shared-foundation-geometry.js` (alongside `RadialTextFitting`)
- `GaugeToolkit` in `config/components/registry-shared-engines.js` (alongside `RadialToolkit`)

Each registration must declare correct `deps` so the component system resolves load order. `tools/release-zip-builder.mjs` already discovers component files from the registry and does not need manual updates for these modules.

### Documentation

Update:

- `documentation/conventions/` — add or update a shared-helpers convention page documenting `ValueMath` as the canonical source for numeric utilities.
- `documentation/shared/` — update any pages that reference `RadialValueMath` for non-radial usage.
- Module-level `Depends:` headers in every changed file.

### Exit condition

Every duplicated helper has exactly one canonical implementation in `ValueMath`, `CanvasTextLayout`, or `CanvasTextFitting`. All `Number(raw)` sites are null-safe. All internal Dyni code uses the canonical modules directly. `RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, and `RadialToolkit` are slimmed to their genuinely radial responsibilities plus user-facing re-exports. Only `FullCircleRadialEngine` and `SemicircleRadialEngine` still depend on `RadialToolkit`. All existing tests pass through the new module structure.

---

## Phase 8 — Update ROADMAP and Cross-Cutting Documentation

### Purpose

Keep project intent, docs, and implementation status aligned.

### Work

1. Update `ROADMAP.md` after the fixes are implemented:
   - remove the four completed lines under `### Fixes`, or otherwise clear them in the established roadmap style if the repository uses a different completion convention at implementation time.

2. Ensure docs changed in earlier phases are internally consistent:
   - XTE docs no longer contradict the new state-screen behavior,
   - theme docs describe border inheritance clearly,
   - plugin docs describe dual startup entrypoints and shared core,
   - cache docs explicitly prevent the offscreen DPR mistake from recurring,
   - state-screen docs describe the aligned canvas/HTML rendering contract if a shared state-screen conventions page exists,
   - shared-helper docs (or a new conventions page) document `ValueMath` as the canonical source for numeric utilities, `CanvasTextLayout`/`CanvasTextFitting` for canvas text operations, and `GaugeToolkit` for the generic gauge bundle,
   - module-level `Depends:` headers in every changed file reflect the new module names.

3. Update any table-of-contents or doc-reachability metadata only if the repository’s doc tooling requires it.

### Exit condition

No docs still describe the pre-PLAN24 behavior, and `ROADMAP.md` no longer lists the completed fixes as pending.

---

## Phase 9 — Validation Gate

### Required targeted tests

Run the touched-area suites:

```bash
npx vitest run tests/widgets/text/XteDisplayWidget.test.js
npx vitest run tests/runtime/theme-runtime.test.js
npx vitest run tests/plugin/plugin-bootstrap.test.js
npx vitest run tests/tools/release-zip-builder.test.js
npx vitest run tests/tools/release-create.test.js
```

Also run any new test files added for:

- module entrypoint behavior,
- plugin CSS horizontal host sizing,
- canvas state-screen overlay behavior.

And run the newly touched suites:

```bash
npx vitest run tests/shared/state/StateScreenCanvasOverlay.test.js
npx vitest run tests/shared/value/ValueMath.test.js
npx vitest run tests/cluster/mappers/VesselMapper.test.js
```

Run the **full test suite** (`npx vitest run`) to verify no regressions from the 40+ file deduplication.

### Required project-wide checks

Run:

```bash
npm run check:all
```

If implementation legitimately alters baselines that require repository-approved update commands, run only the documented project command for that baseline and explain why in the final change notes.

### Required manual checks

1. **XTE HiDPI visual check**
   - Open a DPR > 1 browser/device/emulation state.
   - Confirm static highway background fills the same geometry as the dynamic indicator and center strip.
   - Resize once to force cache rebuild and verify it remains correct.

2. **XTE navpage no-waypoint check**
   - Use the navpage XTE display with no waypoint.
   - Confirm `No Waypoint` state appears even though textual metrics remain hidden.

3. **Chrome mobile horizontal widget check**
   - Reproduce the map-page top/bottom horizontal Dyni widget case.
   - Confirm no absurd width, no broken canvas, no sad-face canvas.

4. **Modern plugin loading check**
   - In an AvNav environment that advertises `plugin.mjs`, confirm Dyni initializes through the module path.
   - Confirm normal widget registration/rendering after startup.

5. **Legacy plugin loading check**
   - In a legacy or forced `plugin.js` path, confirm Dyni initializes with the previous startup behavior.

6. **Canvas state-screen visual check**
   - Trigger a `GPS Lost` or `No Waypoint` state on a canvas widget.
   - Confirm no dim overlay tint; the label is centered with properly fitted font size.
   - Compare visually with an HTML widget state screen (`No Route` on ActiveRoute); they should look consistent.
   - Verify at least one radial gauge, one linear gauge, and CenterDisplayText in a disconnected state — not only XTE, ThreeValueText, and PositionCoordinate.

7. **Null-value visual check across widget types**
   - Configure a voltage widget, a depth widget, and a speed widget with no store path or an unpopulated store path.
   - Confirm all display `"---"`, not `"0"` or `"0.0"`.
   - Confirm compass widgets with no bearing/marker data do not render a stale 0° marker.
   - Confirm position coordinate widgets with no lat/lon data show placeholder, not 0°00'00".
   - Test all three kinds per data type where applicable: plain text, linear gauge, and radial gauge.

8. **Clean migration check**
   - Confirm zero internal Dyni `require("RadialValueMath")`, `require("RadialTextLayout")`, or `require("RadialTextFitting")` calls remain (only `FullCircleRadialEngine` and `SemicircleRadialEngine` still `require("RadialToolkit")`).
   - Confirm the component IDs `RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, and `RadialToolkit` still resolve via re-export wrappers (user-facing backward compatibility).

### Exit condition

All targeted tests, full checks, and manual acceptance checks pass, or any intentional residual limitation is explicitly documented with a concrete follow-up issue. PLAN24 is not complete with an uninvestigated mobile sad-face reproduction or a partially fixed XTE highway background.

---

## Acceptance Criteria

### ROADMAP Fix 1 — Border follows foreground

- [ ] No border override in day mode resolves border equal to foreground.
- [ ] No border override in night mode resolves border equal to foreground.
- [ ] Custom `--dyni-fg` flows into border.
- [ ] Custom `--dyni-border` still wins.
- [ ] Theme docs explain the new fallback.

### ROADMAP Fix 2 — XTE `No Waypoint` on navpage

- [ ] Empty `display.wpName` shows `No Waypoint` with visible textual metrics.
- [ ] Empty `display.wpName` shows `No Waypoint` with hidden textual metrics.
- [ ] `disconnected` precedence remains intact.
- [ ] XTE docs reflect state-screen behavior.

### ROADMAP Fix 3 — `plugin.mjs` support

- [ ] `plugin.mjs` exists and default-exports an AvNav-compatible initializer.
- [ ] `plugin.js` still exists and remains supported.
- [ ] Both adapters call the same shared bootstrap core.
- [ ] Module path uses provided API and `api.getBaseUrl()`.
- [ ] Bundle-first / manifest-fallback logic remains functional.
- [ ] Script IDs are generation-aware for module reloads.
- [ ] Release packaging contains all required startup assets.
- [ ] Startup docs no longer claim only `plugin.js` can own automatic startup.

### ROADMAP Fix 4 — Chrome mobile horizontal rendering

- [ ] `plugin.css` contains the horizontal Dyni width rule with `width: 7em`.
- [ ] The reproducing mobile map-page layout no longer creates multi-million-pixel CSS widths.
- [ ] Canvas backing size remains proportional to real CSS width and DPR.
- [ ] Top/bottom horizontal widgets remain visually usable and flex correctly.
- [ ] No user-facing width token is introduced.

### Companion Fix — XTE static highway DPR correction

- [ ] Static XTE highway cached layer uses an explicit DPR/backing-size transform before draw.
- [ ] Dynamic indicator remains aligned with static highway geometry.
- [ ] `CanvasLayerCache` global transform behavior remains unchanged.
- [ ] Test coverage prevents the offscreen-layer transform omission from returning.

### Companion Fix — Canvas state-screen visual alignment

- [ ] `StateScreenCanvasOverlay` no longer draws a dim overlay fill.
- [ ] Label font size is measured and fitted to 80% of available width/height, matching `StateScreenTextFit` behavior.
- [ ] Canvas state screens look visually consistent with HTML state screens.
- [ ] All canvas consumers (XTE, ThreeValueText, PositionCoordinate, CenterDisplayText, and all radial and linear gauge widgets) inherit the change.
- [ ] `StateScreenCanvasOverlay` test updated to reflect new rendering behavior.

### Companion Fix — Shared-helper extraction, deduplication, and null-value safety

- [ ] `ValueMath` module exists at `shared/widget-kits/value/ValueMath.js` with component ID `ValueMath`.
- [ ] `CanvasTextLayout` module exists at `shared/widget-kits/text/CanvasTextLayout.js` with component ID `CanvasTextLayout`.
- [ ] `CanvasTextFitting` module exists at `shared/widget-kits/text/CanvasTextFitting.js` with component ID `CanvasTextFitting`.
- [ ] `GaugeToolkit` module exists at `shared/widget-kits/gauge/GaugeToolkit.js` with component ID `GaugeToolkit`.
- [ ] `RadialValueMath` is a re-export wrapper: only retains 6 radial geometry functions, re-exports all `ValueMath` members.
- [ ] `RadialTextLayout` is a re-export wrapper for `CanvasTextLayout`.
- [ ] `RadialTextFitting` is a re-export wrapper for `CanvasTextFitting`.
- [ ] `RadialToolkit` extends `GaugeToolkit` with `angle`, `tick`, `draw`.
- [ ] `LinearGaugeEngine` depends on `GaugeToolkit`, not `RadialToolkit`. (`LinearGaugeTextLayout` is unchanged; it depends only on `LinearGaugeLabelFit`.)
- [ ] `XteDisplayWidget` depends on `GaugeToolkit`, not `RadialToolkit`.
- [ ] All 10 gauge widgets (Temperature/Default/Speed/Voltage/Depth × radial/linear) `require("ValueMath")` and use renamed tick-step functions (`resolveStandardTickSteps` etc.).
- [ ] WindLinearWidget and CompassLinearWidget `require("ValueMath")`.
- [ ] TextLayoutEngine `require("ValueMath")`.
- [ ] TextLayoutPrimitives, AisTargetHtmlFit, EditRouteHtmlFit, ActiveRouteHtmlFit, RoutePointsHtmlFit, CenterDisplayTextWidget `require("CanvasTextLayout")`.
- [ ] Only `FullCircleRadialEngine` and `SemicircleRadialEngine` still `require("RadialToolkit")`.
- [ ] Zero internal Dyni `require("RadialValueMath")`, `require("RadialTextLayout")`, or `require("RadialTextFitting")` calls remain.
- [ ] Re-export wrappers (`RadialValueMath`, `RadialTextLayout`, `RadialTextFitting`, `RadialToolkit`) remain registered as component IDs for user-facing backward compatibility.
- [ ] `LinearGaugeMath.clamp` is removed; `ValueMath.clamp` used instead.
- [ ] Zero private copies of `toFiniteNumber` remain in the codebase.
- [ ] Zero private copies of `clamp`, `clampPositive`, `ensureObject`, or `trimText` remain.
- [ ] `ClusterMapperToolkit` `norm360`/`norm180` inline fallbacks are removed.
- [ ] `formatGaugeDisplay` returns `{ num: NaN, text: "---" }` for `null` input.
- [ ] `DepthDisplayFormatter.formatDisplay` returns placeholder for `null` input.
- [ ] Wind speed/angle formatters return placeholder for `null` input.
- [ ] Compass marker checks use `ValueMath.isFiniteNumber` — `null` marker is not rendered.
- [ ] `SemicircleRadialEngine` default `formatDisplay` fallback guards `null` — same fix as `LinearGaugeEngine`.
- [ ] `PositionCoordinateWidget.formatAxisValue` non-raw path guards `null` — null coordinates show placeholder, not 0°.
- [ ] `ClusterMapperToolkit.makeAngleFormatter` guards `null` — null angles show `defaultText`, not "0".
- [ ] All gauge widgets (voltage, depth, speed, temperature, default) show `"---"` for `null` store values.
- [ ] Position coordinate widgets show placeholder for `null` lat/lon store values.
- [ ] Valid numeric values including `0` continue to display correctly across all widgets.
- [ ] `ValueMath` test suite covers `isFiniteNumber`, `toFiniteNumber`, `clamp`, `formatGaugeDisplay` with `null`, `undefined`, `NaN`, `0`, empty string, and valid numbers.

### Repository hygiene

- [ ] Docs match shipped behavior.
- [ ] Release tooling matches shipped files.
- [ ] `ROADMAP.md` no longer lists completed Fixes items as pending.
- [ ] `npm run check:all` passes.

---

## Files Expected to Change

This list is intentionally concrete but not exclusive; implementation may touch adjacent test helpers or docs if needed.

### Runtime/widgets

- `widgets/text/XteDisplayWidget/XteDisplayWidget.js` (RadialToolkit → GaugeToolkit)
- `runtime/theme/model.js`
- `runtime/theme/resolver.js`
- `plugin.css`
- `plugin.js`
- `plugin.mjs` **(new)**
- shared bootstrap core file, for example `runtime/plugin-bootstrap-core.js` **(new)**
- `shared/widget-kits/state/StateScreenCanvasOverlay.js`
- `shared/widget-kits/value/ValueMath.js` **(new)**
- `shared/widget-kits/text/CanvasTextLayout.js` **(new)**
- `shared/widget-kits/text/CanvasTextFitting.js` **(new)**
- `shared/widget-kits/gauge/GaugeToolkit.js` **(new)**
- `shared/widget-kits/radial/RadialValueMath.js` (slimmed to re-export wrapper)
- `shared/widget-kits/radial/RadialTextLayout.js` (slimmed to re-export wrapper)
- `shared/widget-kits/radial/RadialTextFitting.js` (slimmed to re-export wrapper)
- `shared/widget-kits/radial/RadialToolkit.js` (extends GaugeToolkit)
- `shared/widget-kits/radial/SemicircleRadialEngine.js` (null-fix in default formatDisplay fallback)
- `shared/widget-kits/linear/LinearGaugeMath.js` (clamp removed)
- `shared/widget-kits/linear/LinearGaugeEngine.js` (GaugeToolkit, null-fix)
- `shared/widget-kits/linear/LinearGaugeTextLayout.js` (Depends header update only; no require() change needed)
- `shared/widget-kits/format/DepthDisplayFormatter.js` (null-fix)
- `shared/widget-kits/xte/XteHighwayPrimitives.js` (inline clamp removed)
- `shared/widget-kits/text/TextLayoutPrimitives.js` (RadialTextLayout → CanvasTextLayout)
- `widgets/radial/CompassRadialWidget/CompassRadialWidget.js` (isFiniteNumber fix)
- `widgets/linear/CompassLinearWidget/CompassLinearWidget.js` (RadialValueMath → ValueMath, isFiniteNumber fix)
- `widgets/radial/WindRadialWidget/WindRadialWidget.js` (null-fix)
- `widgets/linear/WindLinearWidget/WindLinearWidget.js` (RadialValueMath → ValueMath, null-fix)
- `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` (null-fix in formatAxisValue)
- `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` (RadialTextLayout → CanvasTextLayout)
- `widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/radial/DepthRadialWidget/DepthRadialWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `widgets/linear/DepthLinearWidget/DepthLinearWidget.js` (RadialValueMath → ValueMath, tick-step rename)
- `shared/widget-kits/nav/AisTargetHtmlFit.js` (RadialTextLayout → CanvasTextLayout)
- `shared/widget-kits/nav/EditRouteHtmlFit.js` (RadialTextLayout → CanvasTextLayout)
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js` (RadialTextLayout → CanvasTextLayout)
- `shared/widget-kits/nav/RoutePointsHtmlFit.js` (RadialTextLayout → CanvasTextLayout)
- `shared/widget-kits/html/HtmlWidgetUtils.js` (toFiniteNumber/trimText → ValueMath)
- `shared/widget-kits/text/TextFitMath.js` (toFiniteNumber → ValueMath)
- `shared/widget-kits/text/TextLayoutEngine.js` (RadialValueMath → ValueMath)
- `shared/widget-kits/layout/GeometryScale.js` (toFiniteNumber → ValueMath)
- `shared/widget-kits/state/StateScreenTextFit.js` (toFiniteNumber/clampPositive → ValueMath)
- `shared/widget-kits/nav/CenterDisplayMath.js` (toFiniteNumber → ValueMath)
- `shared/widget-kits/nav/EditRouteRenderModel.js` (toFiniteNumber → ValueMath)
- `shared/widget-kits/nav/EditRouteLayoutMath.js` (toFiniteNumber → ValueMath)
- `shared/widget-kits/nav/RoutePointsRenderModel.js` (toFiniteNumber → ValueMath)
- `cluster/viewmodels/RoutePointsViewModel.js` (toFiniteNumber → ValueMath)
- `cluster/viewmodels/AisTargetViewModel.js` (toFiniteNumber → ValueMath)
- `cluster/viewmodels/EditRouteViewModel.js` (toFiniteNumber → ValueMath)
- `cluster/viewmodels/ActiveRouteViewModel.js` (toFiniteNumber → ValueMath)
- `cluster/mappers/ClusterMapperToolkit.js` (toFiniteNumber/norm fallbacks → ValueMath/RadialAngleMath, null-fix in makeAngleFormatter)
- `cluster/ClusterWidget.js` (ensureObject → ValueMath)
- `runtime/cluster/RouteActivationController.js` (ensureObject → ValueMath)
- `runtime/cluster/RouteActivationPayloadBuilder.js` (ensureObject/trimText → ValueMath)
- `runtime/cluster/ClusterShellRenderer.js` (trimText → ValueMath)
- `runtime/TemporaryHostActionBridge.js` (toFiniteNumber → ValueMath)
- `runtime/surface/ClusterSurfacePolicy.js` (toFiniteNumber → ValueMath)

### Configuration

- `config/components/registry-shared-foundation-geometry.js` (add ValueMath, CanvasTextLayout, CanvasTextFitting component registrations with correct deps; update deps for TextLayoutEngine RadialValueMath → ValueMath, TextLayoutPrimitives RadialTextLayout → CanvasTextLayout, and other migrated modules)
- `config/components/registry-shared-engines.js` (add GaugeToolkit component registration with correct deps; update LinearGaugeEngine dep RadialToolkit → GaugeToolkit; update RadialToolkit deps: replace RadialTextLayout and RadialValueMath with GaugeToolkit, keep RadialAngleMath/RadialTickMath/RadialCanvasPrimitives/RadialFrameRenderer)
- `config/components/registry-shared-foundation-layout.js` (update deps for AisTargetHtmlFit, ActiveRouteHtmlFit, EditRouteHtmlFit, RoutePointsHtmlFit: RadialTextLayout → CanvasTextLayout)
- `config/components/registry-widgets-gauge.js` (update gauge widget deps: RadialValueMath → ValueMath for all 12 gauge widgets that currently list RadialValueMath — the 10 standard gauges plus CompassLinearWidget and WindLinearWidget; add ValueMath as a new dep on CompassRadialWidget for the isFiniteNumber marker fix)
- `config/components/registry-widgets-nav.js` (update CenterDisplayTextWidget dep RadialTextLayout → CanvasTextLayout)
- `config/components/registry-widgets-vessel.js` (update XteDisplayWidget dep RadialToolkit → GaugeToolkit if listed there)

### Tests

- `tests/widgets/text/XteDisplayWidget.test.js`
- `tests/runtime/theme-runtime.test.js`
- `tests/plugin/plugin-bootstrap.test.js`
- new focused plugin-module test if split out
- new focused plugin CSS horizontal sizing test if split out
- `tests/tools/release-zip-builder.test.js`
- `tests/tools/release-create.test.js`
- `tests/shared/state/StateScreenCanvasOverlay.test.js`
- `tests/shared/value/ValueMath.test.js` **(new)**
- `tests/cluster/mappers/VesselMapper.test.js`
- existing test suites for all widgets/modules that switch to ValueMath imports (verify no regressions)

### Release tooling

- `tools/release-zip-builder.mjs`
- any release fixture/prepare file required by the test suite

### Documentation

- `ROADMAP.md`
- `documentation/widgets/xte-display.md`
- `documentation/shared/theme-tokens.md`
- `documentation/shared/css-theming.md`
- `documentation/architecture/runtime-lifecycle.md`
- `documentation/architecture/component-system.md`
- `documentation/architecture/asset-system.md`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/conventions/canvas-layer-caching.md` or the repository’s equivalent cache-contract page
- `documentation/shared/state-screens.md`
- new or updated shared-helper conventions page documenting `ValueMath`, `CanvasTextLayout`, `CanvasTextFitting`, `GaugeToolkit`
- any guide whose `plugin.js`-only wording becomes inaccurate

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Border inheritance changes default visual contrast | borders may look stronger than before | This is intentional; explicit `--dyni-border` remains available and docs must say so |
| Theme fallback is implemented as a raw CSS shortcut instead of resolved-token logic | custom/night foreground may not propagate correctly | Tests must cover day, night, custom foreground, explicit border |
| `plugin.mjs` duplicates or diverges from `plugin.js` | startup drift and future bugs | Mandatory shared bootstrap core |
| Modern module reload sees old DOM script IDs | updated plugin files silently fail to load | Generation-aware script-ID tests with different base URLs |
| Global cache transform change double-scales existing cached renderers | regressions outside XTE | Do not touch `CanvasLayerCache` behavior |
| Width fix over-constrains horizontal layout | widget sizing may become rigid | Use only `width: 7em`; validated that flex expansion still works |
| Mobile failure is “fixed” only visually, not contractually | huge backing canvases could persist off-screen | Manual check must verify actual CSS/backing canvas dimensions |
| Removing canvas state-screen dim overlay changes appearance of all canvas widget state screens, not only XTE | users may notice the visual change on disconnected gauges | This is intentional alignment; the old dim overlay was inconsistent with the HTML state-screen style |
| Canvas text fitting logic diverges from `StateScreenTextFit` | subtle sizing differences between canvas and HTML state screens | Implement the same 80%-of-width/height ceiling and proportional scale-down; test with narrow and square geometries |
| Null-safety guard masks a genuine 0 sensor reading | a real 0 reading could theoretically be suppressed | `isFiniteNumber(0)` returns `true`; only `null`/`undefined` are rejected. The guard is `typeof n === "number"`, so numeric `0` always passes |
| Extraction touches 40+ files in one phase | risk of regression across many modules | Clean migration with updated registry deps ensures the component system resolves all load orders correctly; full test suite must pass before and after |
| Bootstrap order changes break initialization | new modules must load before dependents | Register new modules with correct `deps` in component registries and test the load order in both bundle and manifest-fallback modes |
| `clamp` behavior change from coercing to null-safe | code relying on `clamp(null, lo, hi) === lo` vs `clamp(null, lo, hi) === Number(lo)` may behave differently | The null-safe behavior (`null` → `lo`) matches `LinearGaugeMath`; `RadialValueMath`'s coercing version was the outlier |

---

## Related Source Anchors

These are the primary files/contracts PLAN24 is based on:

- `ROADMAP.md`
- `runtime/theme/model.js`
- `runtime/theme/resolver.js`
- `widgets/text/XteDisplayWidget/XteDisplayWidget.js`
- `shared/widget-kits/canvas/CanvasLayerCache.js`
- `runtime/canvas-runtime.js`
- cached radial/linear engine implementations that already apply layer transforms
- `plugin.js`
- `tools/release-zip-builder.mjs`
- AvNav host-side `viewer/util/pluginmanager.js`
- AvNav API definition `viewer/api/api.interface.ts`
- AvNav widget layout stylesheet `viewer/style/widgets.less`
- `shared/widget-kits/state/StateScreenCanvasOverlay.js`
- `shared/widget-kits/state/StateScreenMarkup.js`
- `shared/widget-kits/state/StateScreenTextFit.js`
- `cluster/mappers/VesselMapper.js`
- `shared/widget-kits/radial/RadialValueMath.js`
- `shared/widget-kits/radial/RadialTextLayout.js`
- `shared/widget-kits/radial/RadialTextFitting.js`
- `shared/widget-kits/radial/RadialToolkit.js`
- `shared/widget-kits/linear/LinearGaugeMath.js`
- `shared/widget-kits/linear/LinearGaugeEngine.js`
- `shared/widget-kits/format/DepthDisplayFormatter.js`
- `shared/widget-kits/html/HtmlWidgetUtils.js`
- `shared/widget-kits/text/TextFitMath.js`
- `shared/widget-kits/layout/GeometryScale.js`
- `cluster/mappers/ClusterMapperToolkit.js`
- `widgets/radial/CompassRadialWidget/CompassRadialWidget.js`
- `widgets/linear/CompassLinearWidget/CompassLinearWidget.js`
- `widgets/radial/WindRadialWidget/WindRadialWidget.js`
- `widgets/linear/WindLinearWidget/WindLinearWidget.js`
- `shared/widget-kits/radial/SemicircleRadialEngine.js`
- `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`
- `runtime/format-runtime.js` (reference: correct null handling in `applyFormatter`)

---

## Completion Definition

PLAN24 is complete only when all eight behavior corrections are shipped together:

1. foreground-derived border fallback,
2. XTE `No Waypoint` state in navpage graphics-only mode,
3. `plugin.mjs` support with shared/bootstrap-safe legacy compatibility,
4. Chrome mobile horizontal-widget width stability,
5. XTE static highway DPR cache correction,
6. canvas state-screen visual alignment with HTML state screens,
7. shared-helper extraction (`ValueMath`, `CanvasTextLayout`, `CanvasTextFitting`, `GaugeToolkit`), clean migration of all internal callers to canonical modules, deduplication of all inline helpers, and null-safe `Number(raw)` handling across all rendering paths,
8. tests, docs, release manifest, and roadmap state all describe that reality.
