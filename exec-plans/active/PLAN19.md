# PLAN19: Stable Release Workflow for dyninstruments

**Goal:** Build local tooling that lets an AI agent create versioned releases — deciding the next SemVer and writing release notes — from a plugin architecture that cleanly separates runtime from development files, with GitHub Releases as a secondary copy target.

**Status:** Plan — not yet implemented

---

## Context snapshot

| Fact                               | Value                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Runtime JS files                   | 165                                                                           |
| Runtime CSS files                  | 8 (1 plugin-wide + 7 widget/shadow)                                           |
| Font assets                        | 4 woff2 files + LICENSE.txt under `assets/fonts/`                             |
| Component registry groups          | 4 (shared-foundation 63 components, shared-engines 8, widgets 35, cluster 23) |
| File-size limit                    | 400 non-empty lines per file (`check:all` enforced)                           |
| Registry `shared-foundation`       | **369 / 400** non-empty lines — must split before adding `assets` field       |
| Registry `widgets`                 | **331 / 400** non-empty lines — must split before adding `assets` field       |
| Build step                         | None — raw source files served directly by AvNav                              |
| Version source of truth            | Git tags (package.json stays `0.0.0-test`)                                    |
| Existing Node-side registry parser | `tools/components-registry-loader.mjs` (vm-based sandbox)                     |

---

## Phases

The work is ordered by dependency. Each phase must pass `npm run check:all` before the next begins.

---

### Phase 1 — Fix broken gate + dead code cleanup

**Why first:** `npm run check:core` currently **fails** because `exec-plans/active/` is untracked (empty directory not committed to git), causing the doc-reachability check to fail on links in `CLAUDE.md` and `AGENTS.md`. The gate must pass before any other work begins. Additionally, the codebase has accumulated dead code paths and unnecessary defensive guards that should be cleaned up before the first release.

#### 1a. Fix broken gate + minor doc cleanup

`CLAUDE.md`, `AGENTS.md`, and `.agents/skills/create-plan/SKILL.md` reference `exec-plans/active/`, but that directory is untracked because it is empty (active plans live outside the repo during execution). The `check:core` doc-reachability check fails because git does not track empty directories. Fix: add `exec-plans/active/.gitkeep` so the directory is committed and the links resolve. No link text changes needed — the references are correct.

Also fix a typo in `CONTRIBUTING.md` line 14: "remeber" → "remember".

#### 1b. Remove dead code and redundant guards

Manual code analysis found the following unreachable, unnecessary, or redundant code:

| File                                                                               | Dead code                                                                                                                                | Rationale                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/component-loader.js`                                                      | Local `loadScriptOnce` function (lines 33–48) and the `typeof runtime.loadScriptOnce === "function"` guard at line 52 and line 134       | `plugin.js` always sets `runtime.loadScriptOnce` before `component-loader.js` runs. The local copy is never reached. Simplify to direct use of `runtime.loadScriptOnce`.                                                                                  |
| `runtime/theme-runtime.js:175`                                                     | `typeof themeResolver.resolveOutputsForRoot === "function"` guard with fallback to `resolveForRoot`                                      | `ThemeResolver` always exports `resolveOutputsForRoot`. The fallback path is never reached. Replace with direct call.                                                                                                                                     |
| `runtime/namespace.js:20`                                                          | `fallbackRoot` path in `getAvnavApi` — looks up `rootRef.avnav.api` when `ns.avnavApi` is null                                           | `plugin.js` sets `ns.avnavApi` before any caller runs `getAvnavApi`. The window-global lookup is dead. Remove the fallback branch.                                                                                                                        |
| `plugin.js:22`, `runtime/init.js:90`                                               | `console && console.error && console.error(...)`                                                                                         | `console` is guaranteed in ES6+ browsers (the project's target). Simplify to direct `console.error()`.                                                                                                                                                    |
| `runtime/init.js`                                                                  | Duplicated `readThemePresetCssVarFromElement` and `normalizePresetName` functions (identical copies exist in `runtime/theme-runtime.js`) | Structural redundancy across IIFE modules. Fix: add `resolveStartupPresetName(docElement)` to the `runtime._theme` frozen API, delegate from `init.js`, delete the local copies (~20 lines removed from `init.js`, ~3 lines added to `theme-runtime.js`). |
| `cluster/viewmodels/AisTargetViewModel.js:48`                                      | `target.type == 21` — loose equality; only non-`== null` use of `==` in the codebase                                                     | AvNav may deliver `type` as string or number. Fix: replace with `target.type === 21 \|\| target.type === "21"` to make the intent explicit.                                                                                                                 |
| 7 mappers: `CourseHeading`, `Environment`, `Map`, `Nav`, `Speed`, `Vessel`, `Wind` | `const num = toolkit.num \| function (value) { ... }` inline fallback                                                                    | `ClusterMapperToolkit.createToolkit()` always provides `toolkit.num`. The fallback is never reached. `AnchorMapper` and `DefaultMapper` already use `toolkit.num` directly. Replace with `const num = toolkit.num;` in all seven.                           |
| All widget files with `version` field                                              | Per-widget `version: "X.Y.Z"` strings (e.g., `ClusterWidget "1.16.0"`, `ThreeValueTextWidget "4.3.0"`, all linear `"0.1.0"`)             | No runtime code reads these. No check enforces them. Values are hand-managed and inconsistent. Project version lives in git tags per plan design. Strip all per-widget `version` fields.                                                                  |

#### 1c. Normalize `isFinite` usage

30 source files contain 115 bare `isFinite()` calls (which coerces strings: `isFinite("42")` → `true`). The rest of the codebase already uses `Number.isFinite()` (104 calls). The affected files span the rendering/canvas layer, gauge widgets, cluster mappers, and text widgets.

Replace every bare `isFinite(x)` with `Number.isFinite(x)` across all 30 files. This is safe because these call sites already pass values through `Number()` before the check. Add a new `global-isfinite` rule to `check-patterns` that blocks bare `isFinite(` (not preceded by `Number.`) in source files. The linter rule is the enforcer — it will catch any remaining or future bare uses.

#### 1d. Consolidate gauge formatter functions

Three radial widgets (`SpeedRadialWidget`, `VoltageRadialWidget`, `TemperatureRadialWidget`) and three linear widgets (`SpeedLinearWidget`, `VoltageLinearWidget`, `TemperatureLinearWidget`) each define their own `formatXxxString` / `displayXxxFromRaw` / `formatDisplay` function. These are structurally identical: resolve default text → `Number(raw)` → check finite → call `Helpers.applyFormatter` with formatter+parameters → normalize → extract number text → return `{ num, text }`. Only the default formatter name and default parameters differ.

`DefaultRadialWidget` already solves this correctly by delegating to `RadialValueMath.formatGaugeDisplay`. Extend `formatGaugeDisplay` to accept the formatter name and default parameters, then replace the local copies in all six gauge widgets with calls to the shared helper. This removes ~20 lines per widget.

#### 1e. Remove micro-duplications in shared widget-kits

Two targeted cleanups in the HTML widget helper layer:

1. **`resolveHostCommitTarget` in `RoutePointsDomEffects.js`**: Delete the local copy (which adds a redundant `typeof hostContext === "object"` guard) and use `HtmlWidgetUtils.resolveHostCommitTarget` instead. `RoutePointsDomEffects` already depends on `HtmlWidgetUtils` through the shared layer.

2. **Inline dispatch-mode checks**: Four files re-implement `surfacePolicy.interaction.mode === "dispatch"` inline instead of calling `HtmlWidgetUtils.canDispatchSurfaceInteraction`:
   
   - `ActiveRouteTextHtmlWidget.js:26`
   - `MapZoomTextHtmlWidget.js:56`
   - `AisTargetRenderModel.js:178`
   - `AlarmRenderModel.js:40`
   
   Replace each inline check with a call to the shared helper. All four files have access to `HtmlWidgetUtils` through their dependency chain.

#### 1f. Add lint suppression comments for css-js-default-duplication warnings

Three warnings in `runtime/theme-runtime.js:163` and `shared/theme/ThemeModel.js:19,45` are architecturally intentional: the theme system must know its own defaults in both CSS and JS. Add `dyni-lint-disable-next-line css-js-default-duplication` suppression comments with design rationale.

#### 1g. Tests + check:all green

Verify `npm run check:all` passes with 0 failures. The doc-reachability failure is resolved (`.gitkeep`), the css-js-default-duplication warnings are suppressed, the `isFinite` linter rule passes, and no runtime behavior changes.

---

### Phase 2 — Rename "fallback" domain vocabulary + resync scorecards

**Why before registry split:** The `premature-legacy-support` linter rule flags any identifier containing "fallback", "legacy", "compat", or "deprecated". The codebase has 22 warnings — almost all caused by the `StableDigits` formatter returning `{ padded, fallback }` where "fallback" means "the plain/unpadded text", not a defensive compatibility path. This naming cascades through 17 source files and 7 test files. Cleaning this up before the registry split avoids carrying the warning backlog into the new fragment files.

#### 2a. Rename StableDigits output field

Rename `StableDigits.fallback` → `StableDigits.plain` throughout the chain. The `{ padded, plain }` pair reads naturally: "padded" is the zero-padded display text, "plain" is the undecorated text.

**Cascade renames (source files):**

| Pattern                                           | Rename to                      | Files affected                                                                                                                                            |
| ------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.fallback` (StableDigits output)                 | `.plain`                       | `StableDigits.js`, `RadialValueMath.js`, `CenterDisplayRenderModel.js`, `MapZoomTextHtmlWidget.js`, `ActiveRouteTextHtmlWidget.js`, `XteDisplayWidget.js` |
| `fallbackText` / `fallbackValueText` (fit system) | `plainText` / `plainValueText` | `AisTargetHtmlFit.js`, `EditRouteHtmlFit.js`, `EditRouteHtmlFitSupport.js`, `RoutePointsHtmlFit.js`, `RoutePointsRenderModel.js`, `ActiveRouteHtmlFit.js` |
| `fallbackValue` / `fallbackFit` (fit system)      | `plainValue` / `plainFit`      | `ActiveRouteHtmlFit.js`, `EditRouteHtmlFit.js`, `AisTargetHtmlFit.js`, `RoutePointsHtmlFit.js`                                                            |
| `resolveMetricFallbackValue` (fit support)        | `resolveMetricPlainValue`      | `EditRouteHtmlFitSupport.js`                                                                                                                              |
| `useFallback` (fit system boolean flag)           | `usePlain`                     | `ActiveRouteHtmlFit.js`, `EditRouteHtmlFit.js`, `EditRouteHtmlFitSupport.js`                                                                              |
| `buildFallbackFit` (AlarmTextHtmlWidget)          | `buildBaselineFit`             | `AlarmTextHtmlWidget.js`                                                                                                                                  |
| `fallbackFit` (AlarmTextHtmlWidget)               | `baselineFit`                  | `AlarmTextHtmlWidget.js`                                                                                                                                  |
| `buildFallback` / `const fallback` (StableDigits internal) | `buildPlain` / `const plain`   | `StableDigits.js`                                                                                                                                         |

**Cascade renames (utility parameters):**

| Pattern                                               | Rename to                                                 | Files affected                                          |
| ----------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `function toSafeInteger(value, fallback)`             | `function toSafeInteger(value, defaultValue)`             | `RoutePointsDomEffects.js`, `RoutePointsRenderModel.js` |
| `function toElementHeight(element, fallback)`         | `function toElementHeight(element, defaultValue)`         | `RoutePointsDomEffects.js`                              |
| `function clampPositive(value, fallback)`             | `function clampPositive(value, defaultValue)`             | `StateScreenTextFit.js`                                 |
| `function resolveInsetValue(insets, key, fallback)`   | `function resolveInsetValue(insets, key, defaultValue)`   | `EditRouteLayoutGeometry.js`                            |
| `function resolveSuffix(rawSuffix, fallbackSuffix)`   | `function resolveSuffix(rawSuffix, defaultSuffix)`        | `StableDigits.js`                                       |
| `function extractNumericDisplay(valueText, fallback)` | `function extractNumericDisplay(valueText, defaultValue)` | `UnitAwareFormatter.js`                                 |
| `const fallbackRoot`                                  | *(removed in Phase 1b)*                                   | `runtime/namespace.js`                                  |

**Test file updates:** 7 test files that assert on `fallback` field names or `fallbackText` values must be updated to match. Additionally, `tests/shared/nav/AisTargetHtmlFitFallback.test.js` must be renamed to `AisTargetHtmlFitPlain.test.js` to match the new vocabulary.

#### 2b. Resync QUALITY.md

Update the layer health table and known drift patterns to match the current `check:all` output:

| Data point                 | Current (stale) | Correct                                                   |
| -------------------------- | --------------- | --------------------------------------------------------- |
| runtime/ file count        | 6               | 12                                                        |
| config/ file count         | 12              | 23                                                        |
| cluster/ file count        | 12              | 24                                                        |
| shared/ file count         | 32              | 82                                                        |
| widgets/radial/ file count | 6               | 7                                                         |
| widgets/text/ file count   | 5               | 10                                                        |
| widgets/linear/ file count | 6               | 7                                                         |
| check:patterns warnings    | 16              | 0 (after 2a cleanup)                                      |
| premature-legacy-support   | 12              | 0 (after 2a cleanup)                                      |
| css-js-default-duplication | 3               | 0 (after 1f suppression)                                  |
| mapper-output-complexity   | 1               | 0 (already resolved)                                      |
| check:filesize warnings    | 29              | 29 (unchanged at Phase 2; Phase 3 split may change count) |
| checkedFiles               | 384             | 438                                                       |

#### 2c. Resync TECH-DEBT.md

- Update TD-015 file-size hotspot list to the current warning set.
- Update TD-025 to reflect that premature-legacy-support warnings are now 0 (resolved, not just narrowed). Move to the resolved table.
- Add a new resolved entry for the Phase 2a vocabulary rename.

#### 2d. Update ROADMAP.md

Mark the release tooling roadmap item as in-progress (addressed by this plan).

#### 2e. Tests + check:all green

Verify `npm run check:all` passes. The premature-legacy-support and css-js-default-duplication warning counts should both be 0.

---

### Phase 3 — Registry file splits (unblock the 400-line ceiling)

**Why before asset architecture:** The asset registry (Phase 4) adds an `assets` field to component entries, which will push `registry-shared-foundation.js` (369 lines) and `registry-widgets.js` (331 lines) over the 400-line limit. These files must be split before any new fields are added.

#### 3a. Split `registry-shared-foundation.js`

The 63 components in `sharedFoundation` group naturally into four domain sub-groups. Split into four files inside `config/components/`:

| New file                                 | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Rationale                                              | ~Non-empty lines |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------- |
| `registry-shared-foundation-format.js`   | `PlaceholderNormalize`, `StableDigits`, `UnitAwareFormatter`, `DepthDisplayFormatter`                                                                                                                                                                                                                                                                                                                                                                                                                                               | Format/display utilities                               | ~38              |
| `registry-shared-foundation-geometry.js` | `RadialAngleMath`, `RadialCanvasPrimitives`, `RadialFrameRenderer`, `RadialTextFitting`, `RadialTextLayout`, `RadialTickMath`, `RadialValueMath`, `LinearCanvasPrimitives`, `LinearGaugeEngineDrawing`, `LinearGaugeLayout`, `LinearGaugeMath`, `LinearGaugeEngineSupport`, `LinearGaugeLabelFit`, `LinearGaugeTextLayout`, `TextLayoutPrimitives`, `TextTileLayout`, `TextFitMath`, `TextLayoutEngine`, `TextLayoutComposite`, `GeometryScale`, `LayoutRectMath`, `ResponsiveScaleProfile`                                         | Pure geometry, math, and canvas rendering primitives   | ~145             |
| `registry-shared-foundation-layout.js`   | `AisTargetLayout`, `AisTargetLayoutMath`, `AisTargetLayoutGeometry`, `AisTargetHtmlFit`, `AlarmHtmlFit`, `ActiveRouteHtmlFit`, `ActiveRouteLayout`, `EditRouteLayout`, `EditRouteLayoutMath`, `EditRouteLayoutGeometry`, `EditRouteHtmlFitSupport`, `EditRouteHtmlFit`, `RoutePointsLayoutSizing`, `RoutePointsRowGeometry`, `RoutePointsLayout`, `RoutePointsInfoText`, `RoutePointsHtmlFit`, `MapZoomHtmlFit`, `CenterDisplayLayout`, `CenterDisplayMath`, `CenterDisplayRenderModel`, `XteHighwayLayout`, `XteHighwayPrimitives` | Widget-specific HTML layout, fit, and sizing logic     | ~145             |
| `registry-shared-foundation-state.js`    | `StateScreenLabels`, `StateScreenPrecedence`, `StateScreenInteraction`, `StateScreenTextFit`, `StateScreenMarkup`, `StateScreenCanvasOverlay`, `HtmlWidgetUtils`, `PreparedPayloadModelCache`, `CanvasLayerCache`, `SpringEasing`, `PerfSpanHelper`, `ThemeModel`, `ThemeResolver`, `CenterDisplayStateAdapter`                                                                                                                                                                                                                     | State management, DOM utils, caching, animation, theme | ~75              |

The group key `sharedFoundation` stays in the assembly logic (`config/components.js`), but it now merges from four fragment files instead of one.

**Fragment assignment pattern:** All fragments use the same additive pattern:

```js
var sf = groups.sharedFoundation = groups.sharedFoundation || {};
sf.ComponentA = { ... };
sf.ComponentB = { ... };
```

This is safe regardless of load order — each fragment either creates or extends the object. The `config/components.js` assembly already iterates `groups.sharedFoundation` as a flat object, so no assembly changes are needed.

**Bootstrap script order in `plugin.js`:** Replace the single `config/components/registry-shared-foundation.js` entry with the four new files in the order: format → geometry → layout → state. Order within a group does not matter for correctness (components are resolved at `loadComponent` time, not registration time), but keeping a stable order aids readability.

**Headers:** Each new fragment file must include the standard module header block. The `config/components` directory is already in the `check:headers` SCAN_ROOTS, so compliance is enforced automatically.

#### 3b. Split `registry-widgets.js`

The 35 components split by widget surface type:

| New file                     | Components                                                                                                                                                                                                                                                                                                                                                                      | Rationale                                                             | ~Non-empty lines |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------- |
| `registry-widgets-nav.js`    | `NavInteractionPolicy`, `AisTargetRenderModel`, `AisTargetMarkup`, `AisTargetTextHtmlWidget`, `ActiveRouteTextHtmlWidget`, `EditRouteRenderModel`, `EditRouteMarkup`, `EditRouteTextHtmlWidget`, `RoutePointsRenderModel`, `RoutePointsMarkup`, `RoutePointsDomEffects`, `RoutePointsTextHtmlWidget`, `MapZoomTextHtmlWidget`, `CenterDisplayTextWidget`, `RendererPropsWidget` | Nav/route HTML widgets, their models, and diagnostics (15 components) | ~170             |
| `registry-widgets-vessel.js` | `AlarmRenderModel`, `AlarmTextHtmlWidget`, `AlarmMarkup`, `PositionCoordinateWidget`, `ThreeValueTextWidget`, `XteDisplayWidget`                                                                                                                                                                                                                                                | Vessel/alarm/text widgets (6 components)                              | ~75              |
| `registry-widgets-gauge.js`  | `CompassRadialWidget`, `CompassLinearWidget`, `DepthRadialWidget`, `DepthLinearWidget`, `DefaultRadialWidget`, `DefaultLinearWidget`, `SpeedRadialWidget`, `SpeedLinearWidget`, `TemperatureRadialWidget`, `TemperatureLinearWidget`, `VoltageRadialWidget`, `VoltageLinearWidget`, `WindRadialWidget`, `WindLinearWidget`                                                      | Canvas gauge widgets (14 components)                                  | ~95              |

Same additive pattern as 3a: each fragment uses `var w = groups.widgets = groups.widgets || {};` to either create or extend the object.

**`SHARED_HTML_SHADOW_CSS` constant:** The current monolith defines `const SHARED_HTML_SHADOW_CSS = BASE + "shared/html/HtmlShadowCommon.css"` once at the top. After the split, both the nav fragment (5 components use it: `AisTargetTextHtmlWidget`, `ActiveRouteTextHtmlWidget`, `EditRouteTextHtmlWidget`, `RoutePointsTextHtmlWidget`, `MapZoomTextHtmlWidget`) and the vessel fragment (1 component: `AlarmTextHtmlWidget`) need this constant. Each fragment defines it independently at the top of its IIFE. The gauge fragment does not need it.

#### 3c. Update `plugin.js` bootstrap list

Replace the two single-file entries with their split successors. The total number of `<script>` loads increases by 5 (2 files become 7), but each file is small and they load sequentially anyway.

**Note:** This is a transitional edit. Phase 5b will later replace the entire hardcoded `internalScripts` array with manifest consumption, superseding these changes.

#### 3d. Update `tools/components-registry-loader.mjs`

The `REGISTRY_SCRIPT_CHAIN` array must list all new fragment files in the same order as `plugin.js`. The existing chain:

```
runtime/namespace.js
config/components/registry-shared-foundation.js
config/components/registry-shared-engines.js
config/components/registry-widgets.js
config/components/registry-cluster.js
config/components.js
```

Becomes:

```
runtime/namespace.js
config/components/registry-shared-foundation-format.js
config/components/registry-shared-foundation-geometry.js
config/components/registry-shared-foundation-layout.js
config/components/registry-shared-foundation-state.js
config/components/registry-shared-engines.js
config/components/registry-widgets-nav.js
config/components/registry-widgets-vessel.js
config/components/registry-widgets-gauge.js
config/components/registry-cluster.js
config/components.js
```

This is the only tool-side change.

#### 3e. Tests

Existing tests for the component registry and the `check:deps` / `check:umd` / `check:headers` tooling must pass unchanged. The file-size check will no longer warn on the previously near-limit files.

Add a new test (or extend the existing registry tests) to verify that the split fragments produce an identical merged registry to the pre-split monolith. Run both and deep-equal the result, then delete the test once the split is confirmed stable.

#### 3f. Update documentation and agent skills for new registry filenames

After the split, `registry-shared-foundation.js` and `registry-widgets.js` no longer exist. All documentation and agent skills that reference them must be updated to point to the correct fragment file(s).

**Agent skills (3 files):**

| File                                    | Change                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.agents/skills/add-widget/SKILL.md`    | Update "Add entry to `registry-widgets.js`" → point to the correct fragment (`registry-widgets-nav.js`, `registry-widgets-vessel.js`, or `registry-widgets-gauge.js` depending on widget type). Update the `RendererPropsWidget.deps` instruction similarly. |
| `.agents/skills/create-plan/SKILL.md`   | Update `registry-widgets.js` reference → list all three widget fragments as context files.                                                                                                                                                                   |
| `.agents/skills/mapper-review/SKILL.md` | Update grep example to search the correct fragment file(s).                                                                                                                                                                                                  |

**Guides (6 files):** Each guide must direct the reader to the correct fragment based on widget type:

| File                                               | Fragment target                                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `documentation/guides/add-new-gauge.md`            | `registry-widgets-gauge.js`                                                                           |
| `documentation/guides/add-new-linear-gauge.md`     | `registry-widgets-gauge.js`                                                                           |
| `documentation/guides/add-new-full-circle-dial.md` | `registry-widgets-gauge.js`                                                                           |
| `documentation/guides/add-new-text-renderer.md`    | `registry-widgets-nav.js` or `registry-widgets-vessel.js` (clarify by surface type)                   |
| `documentation/guides/add-new-html-kind.md`        | `registry-widgets-nav.js` or `registry-widgets-vessel.js` (clarify by surface type)                   |
| `documentation/guides/add-new-cluster.md`          | `registry-cluster.js` (unchanged) but update any shared-foundation references to the correct fragment |

**Architecture/reference docs (1+ files):**

| File                                             | Change                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `documentation/architecture/component-system.md` | Update the registry file list and the `PreparedPayloadModelCache` example to reference `registry-shared-foundation-state.js`. |

---

### Phase 4 — Asset architecture

**Goal:** Every runtime asset (fonts, SVGs, images, audio) has a declared home in the component registry, is preloaded by the component loader, and is accessible to widgets via `runtime.getAsset(key)`.

#### 4a. Plugin-wide font convention (default path)

Fonts shared across the plugin (e.g., the instrument digit typeface) are a plugin-wide concern. They stay in `plugin.css` via `@font-face` with relative `url()` paths and are not registered in the component registry.

The release zip builder handles them by hard rule: **always include everything under `assets/fonts/`**. This is documented in the release tool's source as a named constant.

No runtime code changes needed — `@font-face` with `url()` already works.

Widget-specific fonts that should only load when a particular widget is used (e.g., a symbol font for a specialized gauge) can be registered per-component via the `assets` field with `type: "font"` (Phase 4b/4c). These are loaded on demand by the preloader, not globally via `plugin.css`.

#### 4b. Component-level asset registry schema

Add an optional `assets` field to component registry entries:

```js
SomeComponent: {
  js: BASE + "path/to/component.js",
  css: undefined,
  globalKey: "DyniSomeComponent",
  deps: ["OtherComponent"],
  assets: [
    { key: "compass-icon", path: "assets/icons/compass.svg", type: "svg" },
    { key: "alarm-tone", path: "assets/sounds/alarm.mp3", type: "audio" }
  ]
}
```

Field definitions:

| Field  | Type   | Required | Description                                                                                |
| ------ | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `key`  | string | yes      | Globally unique asset identifier across all components. Used as the `getAsset` lookup key. |
| `path` | string | yes      | Path relative to plugin root (no BASE prefix — stored as relative, resolved at load time). |
| `type` | string | yes      | One of: `"svg"`, `"image"`, `"audio"`, `"json"`, `"font"`. Determines preload strategy.   |

The `path` field stores the relative path (e.g., `"assets/icons/compass.svg"`). The loader prepends `DyniPlugin.baseUrl` at load time. The registry loader tool prepends its sentinel base. This keeps paths consistent with how `js` and `css` work today, except the BASE prefix is applied at consumption rather than registration, which is cleaner for tooling. **This is a divergence from the existing `js`/`css` pattern** where BASE is baked in at registration time. The rationale: asset paths must be usable by both browser runtime (needs full URL) and Node.js tooling (needs relative path). Storing relative and resolving at consumption handles both.

**Convention:** `js` and `css` fields continue to store BASE-prefixed URLs for backward compatibility. Only `assets[].path` uses the relative convention. A future cleanup could migrate `js`/`css` to relative too, but that is out of scope for this plan.

#### 4c. Component loader: asset preloading

Extend `runtime/component-loader.js` to preload declared assets after JS/CSS loads complete. The preload strategy per type:

| Type      | Preload mechanism                            | Stored as                                |
| --------- | -------------------------------------------- | ---------------------------------------- |
| `"svg"`   | `fetch()` → `.text()`                        | Raw SVG string (for inline injection)    |
| `"image"` | `new Image(); img.src = url` → wait `onload` | `HTMLImageElement` reference             |
| `"audio"` | `fetch()` → `.arrayBuffer()`                 | `ArrayBuffer` (widget decodes as needed) |
| `"json"`  | `fetch()` → `.json()`                        | Parsed object                            |
| `"font"`  | `fetch()` → `.arrayBuffer()` → `new FontFace(key, buf)` → `document.fonts.add(face)` | Registered `FontFace` (ready to use in CSS/canvas) |

Implementation structure within `component-loader.js`:

Since the loader is currently at 119 non-empty lines, adding asset preloading could approach the 300-line warning zone. To stay well under 400, extract the preload logic into a new file:

**New file: `runtime/asset-preloader.js`** (~80–120 lines)

Responsibilities:

- `createAssetPreloader(baseUrl)` factory returning `{ preloadAssets, getAsset }`
- `preloadAssets(assetDeclarations)` → `Promise.all` of type-dispatched fetches
- `getAsset(key)` → returns preloaded asset or signals an error/miss
- Internal cache: `Map<key, { value, type, status }>`
- Duplicate-key guard: if `preloadAssets` encounters a key that is already registered (from a different component), it throws immediately. This catches accidental collisions at load time rather than silently overwriting.

**`getAsset` error contract:**

- **Unknown key** (never declared in any component's `assets` array) → **throw.** This is a programmer error (typo or missing registration) and should be loud during development.
- **Known key but fetch failed** (network error, 404, etc.) → **return null.** The preloader logs a warning at preload time. The widget receives null and must degrade gracefully (fallback icon, skip sound, etc.). This prevents a flaky network from crashing the entire widget.

**Changes to `component-loader.js`** (~20 lines added):

In `loadComponent(id)`, after the existing JS/CSS load step and before `validateComponentApi`, insert:

```
.then(function () {
  var assetDecls = m.assets || [];
  if (assetDecls.length === 0) return;
  return preloader.preloadAssets(
    assetDecls.map(function (a) {
      return { key: a.key, url: BASE + a.path, type: a.type };
    })
  );
})
```

**Public API added to `runtime`:**

```js
runtime.getAsset = function (key) { return preloader.getAsset(key); };
runtime.assetUrl = function (relativePath) { return ns.baseUrl + relativePath; };
```

- `runtime.getAsset(key)` — returns the preloaded value (SVG string, Image element, ArrayBuffer, or parsed JSON). Throws if the key is unknown (never registered). Returns null if the key is registered but the fetch failed.
- `runtime.assetUrl(path)` — resolves a relative asset path to a full URL. For cases where a widget needs the URL itself rather than the preloaded content (e.g., for CSS `background-image` set from JS).

#### 4d. Bootstrap script order update

Add `runtime/asset-preloader.js` to the `plugin.js` internal scripts list, immediately before `runtime/component-loader.js` (the loader depends on the preloader).

#### 4e. Registry loader tool update

Extend `tools/components-registry-loader.mjs` to also extract the `assets` field from each component. The returned registry object already includes all fields — no code change needed for extraction. The release zip builder (Phase 6) reads `assets[].path` to discover which files to include.

#### 4f. Tests

- Unit test `asset-preloader.js`: mock `fetch` / `Image`, verify preload for each type, verify `getAsset` throws on unknown key, verify `getAsset` returns null for failed fetch, verify successful preload returns correct value.
- Unit test `component-loader.js` integration: verify that a component with `assets` triggers preloading and that `getAsset` works after load.
- Extend existing registry validation tests to accept the `assets` field.
- `check:deps` and `check:headers` must pass with the new file.

#### 4g. Documentation

Add `documentation/architecture/asset-system.md` describing the convention, the registry schema, the preloader contract (including the throw-vs-null behavior), and the plugin-wide font exception.

---

### Phase 5 — Bootstrap manifest extraction

**Why:** The release zip builder needs to know which files `plugin.js` loads at bootstrap. Currently the `internalScripts` array is hardcoded inside an IIFE in `plugin.js` — unparseable from Node without regex hacks.

#### 5a. Create `config/bootstrap-manifest.js`

A new file that both the browser and Node.js tooling can consume. Browser-side it registers onto `DyniPlugin.config.bootstrapManifest`. Node-side the registry loader evaluates it in the vm sandbox.

```js
(function (root) {
  "use strict";
  var ns = root.DyniPlugin;
  var config = ns.config = ns.config || {};

  config.bootstrapManifest = [
    "runtime/namespace.js",
    "runtime/PerfSpanHelper.js",
    "runtime/helpers.js",
    "runtime/editable-defaults.js",
    "config/components/registry-shared-foundation-format.js",
    "config/components/registry-shared-foundation-geometry.js",
    "config/components/registry-shared-foundation-layout.js",
    "config/components/registry-shared-foundation-state.js",
    "config/components/registry-shared-engines.js",
    "config/components/registry-widgets-nav.js",
    "config/components/registry-widgets-vessel.js",
    "config/components/registry-widgets-gauge.js",
    "config/components/registry-cluster.js",
    "shared/unit-format-families.js",
    "config/components.js",
    "config/shared/editable-param-utils.js",
    "config/shared/kind-defaults.js",
    "config/shared/unit-editable-utils.js",
    "config/shared/common-editables.js",
    "config/shared/environment-base-editables.js",
    "config/shared/environment-depth-editables.js",
    "config/shared/environment-temperature-editables.js",
    "config/shared/environment-editables.js",
    "config/clusters/course-heading.js",
    "config/clusters/speed.js",
    "config/clusters/environment.js",
    "config/clusters/wind.js",
    "config/clusters/nav.js",
    "config/clusters/map.js",
    "config/clusters/anchor.js",
    "config/clusters/vessel.js",
    "config/clusters/default.js",
    "config/widget-definitions.js",
    "runtime/asset-preloader.js",
    "runtime/component-loader.js",
    "runtime/widget-registrar.js",
    "runtime/HostCommitController.js",
    "runtime/SurfaceSessionController.js",
    "runtime/TemporaryHostActionBridgeDiscovery.js",
    "runtime/TemporaryHostActionBridge.js",
    "runtime/theme-runtime.js",
    "runtime/init.js"
  ];
}(this));
```

#### 5b. Refactor `plugin.js`

Replace the hardcoded `internalScripts` array with a two-step load:

1. Load `config/bootstrap-manifest.js` first (single hardcoded script load — the only hardcoded path remaining).
2. Read `DyniPlugin.config.bootstrapManifest` and load each entry sequentially.

This reduces `plugin.js` to ~70 non-empty lines and makes the script chain a single-source-of-truth that both runtime and tooling share.

**Error handling:** If the manifest script fails to load (404, network error), `plugin.js` must log a clear error identifying the missing file (`"dyninstruments: failed to load bootstrap manifest at config/bootstrap-manifest.js"`) rather than silently hanging or producing an obscure error from the subsequent `undefined` read.

#### 5c. Update registry loader tool

Add a second exported function to `components-registry-loader.mjs`:

```js
export function loadBootstrapManifest(rootDir) {
  const sandbox = { DyniPlugin: { baseUrl: SENTINEL_BASE, config: {} } };
  const files = ["runtime/namespace.js", "config/bootstrap-manifest.js"];
  for (const relPath of files) {
    const absPath = path.join(rootDir, relPath);
    const source = fs.readFileSync(absPath, "utf8");
    vm.runInNewContext(source, sandbox, { filename: relPath });
  }
  return sandbox.DyniPlugin.config.bootstrapManifest;
}
```

This runs only `namespace.js` + the manifest file in a minimal sandbox — it does not load the full registry chain. The existing `loadComponentsRegistry` stays unchanged. The zip builder (Phase 6) calls both functions independently.

#### 5d. Update `check:headers` SCAN_ROOTS

Add `config/bootstrap-manifest.js` as a standalone entry in `check:headers`'s SCAN_ROOTS (same pattern as the existing `config/components.js` entry). The new manifest file must include the standard module header block.

#### 5e. Tests

- Verify `plugin.js` loads the manifest and then all listed scripts (extend existing plugin bootstrap tests).
- Verify the registry loader's `loadBootstrapManifest` returns the expected array.
- Verify that a missing manifest script produces a clear error in `plugin.js`.

---

### Phase 6 — Release tooling

Two npm scripts: `release:prepare` and `release:create`. Both live in `tools/`.

#### 6a. `release:prepare` — gather context for AI agent

**File:** `tools/release-prepare.mjs`

**What it does:**

1. Reads the latest git tag matching `v*` (or reports "no prior release" if none exists).
2. Runs `git log --oneline <last-tag>..HEAD` to get the commit list since last release.
3. Categorizes changed files since last tag into `runtime` vs `dev-only` using the same directory classification the zip builder uses.
4. Counts: commits total, runtime-file changes, dev-only changes, new files, deleted files.

**Output:** Structured JSON to stdout, designed for minimal token usage:

```json
{
  "plugin": "dyninstruments",
  "lastRelease": { "tag": "v0.3.0", "date": "2025-06-15" },
  "commitsSinceLastRelease": [
    "abc1234 feat: add wind radial layline sectors",
    "def5678 fix: compass HDT wrap at 360°",
    "ghi9012 refactor: extract LinearGaugeMath from engine",
    "jkl3456 docs: update widget catalog",
    "mno7890 test: cover anchor mapper edge cases"
  ],
  "changeSummary": {
    "runtimeFilesChanged": 12,
    "devOnlyFilesChanged": 8,
    "newFiles": 3,
    "deletedFiles": 0
  },
  "runtimeChangedPaths": [
    "widgets/radial/WindRadialWidget/WindRadialWidget.js",
    "widgets/radial/CompassRadialWidget/CompassRadialWidget.js",
    "shared/widget-kits/radial/FullCircleRadialEngine.js"
  ],
  "semverHint": {
    "hasNewFeatures": true,
    "hasBugfixes": true,
    "hasBreakingChanges": false,
    "suggestion": "minor"
  }
}
```

The `semverHint` is a heuristic based on commit message prefixes (`feat:` → minor, `fix:` → patch, `BREAKING:` or `!:` → major). It is a suggestion — the AI agent makes the final decision.

**npm script:** `"release:prepare": "node tools/release-prepare.mjs"`

#### 6b. `release:create` — build and commit the release

**File:** `tools/release-create.mjs` (orchestrator, ~150 lines) **File:** `tools/release-zip-builder.mjs` (zip assembly logic, ~200 lines)

Split into two files because the orchestrator (check gate + file I/O + git tagging) and the zip builder (registry parsing + file collection + compression) are distinct responsibilities, and together they would exceed 300 lines.

**Arguments:**

```
node tools/release-create.mjs --version=1.0.0 --notes=path/to/release-notes.md
```

- `--version` (required): The SemVer version string, without `v` prefix. The tool prepends `v` for the git tag.
- `--notes` (required): Path to a markdown file containing the AI-written release notes.

**What it does, in order:**

1. **Validate inputs:** Version matches SemVer regex, notes file exists and is non-empty, version is not already tagged.
2. **Run `npm run check:core` and `npm run test:coverage:check`** (fail-closed gate). If either check fails, the tool exits with a non-zero code and a clear error message. No release artifacts are created.
3. **Run `npm run perf:check`** (advisory). If perf check fails, the tool prints a warning with the failing benchmarks but does **not** block the release. The developer or AI agent can decide whether to investigate or proceed.
4. **Build the runtime file manifest:**
   - Load the bootstrap manifest via `loadBootstrapManifest()` from `components-registry-loader.mjs`.
   - Load the component registry via `loadComponentsRegistry()` from the same loader.
   - Collect all `js`, `css`, `shadowCss` paths from the registry (strip sentinel base to get relative paths).
   - Collect all `assets[].path` entries from the registry.
   - Add `plugin.js`, `plugin.css`, `config/bootstrap-manifest.js`.
   - Add `assets/fonts/` contents (the plugin-wide font convention).
   - Deduplicate and sort.
5. **Validate completeness:** Every file in the manifest must exist on disk. Missing files fail the build.
6. **Create the zip:**
   - Root directory inside zip: `dyninstruments/`
   - All runtime files are placed under `dyninstruments/` preserving their relative paths.
   - Uses shell `zip` command (see implementation note below).
   - Output: `releases/dyninstruments-{version}.zip`
7. **Copy the release notes:**
   - Output: `releases/dyninstruments-{version}.md`
8. **Commit and tag:**
   - `git add releases/dyninstruments-{version}.zip releases/dyninstruments-{version}.md`
   - `git commit -m "release: v{version}"`
   - `git tag -a v{version} -m "Release v{version}"` (annotated tag — stores tagger, date, message; preferred by `git describe`).
   - Does NOT push — the developer (or AI agent) pushes explicitly.
9. **Print summary:**
   - Files included in zip (count + total size).
   - Output paths for zip and notes.
   - Git commit and tag created.
   - Next step: `git push origin main && git push origin v{version}` to trigger GitHub Release.

**Implementation note — zip library:** Node.js has no built-in zip. Since this project has minimal dependencies (only vitest/jsdom for dev), shelling out to `zip` is preferred to keep `devDependencies` lean. The tool checks that `zip` is available at startup and gives clear install instructions per platform (macOS: `brew install zip`, Debian/Ubuntu: `apt install zip`, Windows: install via WSL or add to PATH) if not found.

**npm script:** `"release:create": "node tools/release-create.mjs"`

#### 6c. `tools/release-zip-builder.mjs` — the file collection engine

Exported function: `buildReleaseManifest(rootDir)` → returns `string[]` (deduplicated, sorted list of all runtime file paths relative to the plugin root).

This is the heart of the "parsing" logic:

1. Execute `config/bootstrap-manifest.js` in vm sandbox via `loadBootstrapManifest()` → get `bootstrapManifest` array (these are all the scripts `plugin.js` loads at startup).
2. Execute the full registry script chain in vm sandbox via `loadComponentsRegistry()` → get `config.components` (all component definitions).
3. For each component, collect:
   - `js` path (strip sentinel base → relative path)
   - `css` path if defined
   - All `shadowCss` paths if defined
   - All `assets[].path` entries if defined
4. Merge with bootstrap manifest paths.
5. Add fixed entries: `plugin.js`, `plugin.css`, `config/bootstrap-manifest.js`.
6. Add plugin-wide assets: glob `assets/fonts/**/*` (all files under the fonts directory).
7. Deduplicate, sort, return.

Also exported: `validateManifest(rootDir, files)` → verifies every listed file exists on disk, returns `{ valid: boolean, missing: string[] }`.

#### 6d. `releases/` directory and git configuration

- Lives at repository root.

- Added to `.gitignore`: **No** — `releases/` is the canonical source. It is committed to the repository.

- **New file: `.gitattributes`** — add `releases/*.zip binary` to prevent git from attempting text diffs on zip files.

- Structure after several releases:
  
  ```
  releases/
    dyninstruments-0.1.0.zip
    dyninstruments-0.1.0.md
    dyninstruments-0.2.0.zip
    dyninstruments-0.2.0.md
    dyninstruments-1.0.0.zip
    dyninstruments-1.0.0.md
  ```

- The release notes markdown has no required schema, but the AI agent should include: version, date, summary, what changed (features, fixes, breaking changes), and upgrade notes if applicable.

#### 6e. Tests

- `release-zip-builder.mjs`: unit test that the manifest includes all expected files from the current codebase, excludes all dev-only files (tests, tools, docs, exec-plans, perf, AGENTS.md, CLAUDE.md, etc.), and the validation catches a deliberately missing file.
- `release-prepare.mjs`: test with a mock git history.
- `release-create.mjs`: integration test that verifies the full flow (mock `check:core` and `test:coverage:check` to succeed, verify zip contents, verify notes copy, verify commit was created, verify annotated tag creation).

---

### Phase 7 — README rewrite

**Audience:** Primary — AvNav end-user who wants instrument widgets. Secondary — developer link to CONTRIBUTING.md.

**Structure:**

```
# dyninstruments

One-paragraph pitch: what it is, what it does for you, why you'd want it.

## What you get

Brief description of the widget clusters with a table or compact listing:
- Course & Heading (compass radial, compass linear, COG, HDT, HDM)
- Speed (SOG, STW as radial, linear, or text)
- Environment (depth, temperature, voltage as radial, linear, or text)
- Wind (AWA/AWS, TWA/TWS radial with optional layline sectors)
- Navigation (active route, route points, edit route, AIS targets, map zoom, XTE)
- Anchor (watch circle)
- Vessel (alarms, position, center display, three-value)

## Installation

Step-by-step:
1. Download the latest release zip from GitHub Releases (or from releases/ in the repo).
2. Extract to your AvNav plugin directory.
3. Restart AvNav.
4. Widgets appear in the AvNav layout editor under "dyninstruments".

## Configuration

How to use the AvNav editor to:
- Select a cluster widget.
- Choose a `kind` (e.g., `sogLinear`, `tempRadial`).
- Override captions, units, and scale options.
- Enable warning/alarm sectors on gauges.
- Override SignalK paths via KEY fields.

## Theming

Brief note that the plugin respects AvNav day/night mode and supports user CSS overrides via theme tokens.

## Requirements

- AvNav version (whatever the minimum is).
- Browser with ES6 support (all modern browsers).

## Development

Short paragraph: "dyninstruments is developed with AI-assisted tooling. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, coding standards, and release process."

## License

Current license statement.
```

**What gets removed from README:** All architecture details, component system explanation, surface model internals, file tree, dependency rules, roadmap, performance notes. These live in their existing documentation files.

---

### Phase 8 — Release documentation

**New file:** `documentation/guides/release-workflow.md`

Contents:

1. **Overview:** The release flow is local-first. AI agent runs `release:prepare`, decides SemVer, writes notes, runs `release:create`. GitHub Releases is a secondary copy target.
2. **Prerequisite:** `npm install`, `zip` command available.
3. **Step-by-step release flow:**
   - `npm run release:prepare` → review JSON output → decide version and write release notes markdown.
   - `npm run release:create -- --version=X.Y.Z --notes=path/to/notes.md` → tool runs checks (core + coverage as gate, perf as advisory), builds zip, commits artifacts to `releases/`, creates annotated git tag.
   - `git push origin main && git push origin vX.Y.Z` → triggers GitHub Actions.
4. **SemVer decision guide:** When to bump major/minor/patch. What the `semverHint` means and when to override it.
5. **Release notes writing guide:** What to include, tone (user-facing, not developer jargon), example structure.
6. **Troubleshooting:** Common failure modes (`check:core` failure, missing files, duplicate version tag).

**Update:** `documentation/TABLEOFCONTENTS.md` to reference the new guide.

**Update:** `CONTRIBUTING.md` to add a "Releasing" section with a pointer to the release workflow guide.

---

### Phase 9 — GitHub Actions workflow

**File:** `.github/workflows/publish-release.yml`

**Trigger:** Push of a tag matching `v*`.

**Job:** Single job, runs on `ubuntu-latest`.

**Steps:**

1. Checkout the repository at the tag ref.
2. Extract version from tag name (`v1.0.0` → `1.0.0`).
3. Verify that `releases/dyninstruments-{version}.zip` and `releases/dyninstruments-{version}.md` exist. If not, fail with a clear error: "Release artifacts not found. Run `npm run release:create` locally first."
4. Read the markdown file content for the release body.
5. Create a GitHub Release using `softprops/action-gh-release` (or the GitHub CLI):
   - Tag: the pushed tag.
   - Name: `dyninstruments v{version}`.
   - Body: contents of the `.md` file.
   - Attach: the `.zip` file.
6. Done. No build, no tests, no npm install. Pure copy.

**Critical design constraint:** This workflow does ZERO validation. The local `release:create` flow is the gate. If artifacts exist in `releases/` at the tagged commit, they ship. This is intentional — GitHub Releases is an addon, not the authority.

---

## Implementation order (dependency-sorted)

```
Phase 1  Fix broken gate + dead code cleanup
  ├── 1a  Fix broken gate (.gitkeep for exec-plans/active/) + CONTRIBUTING.md typo
  ├── 1b  Remove dead code and redundant guards in runtime/cluster/widget layers
  ├── 1c  Normalize isFinite → Number.isFinite + add linter rule
  ├── 1d  Consolidate gauge formatter functions into shared helper
  ├── 1e  Remove micro-duplications (resolveHostCommitTarget, inline dispatch checks)
  ├── 1f  Add lint suppression for css-js-default-duplication
  └── 1g  Tests + check:all green

Phase 2  Rename "fallback" domain vocabulary + resync scorecards
  ├── 2a  Rename StableDigits.fallback → .plain + cascade
  ├── 2b  Resync QUALITY.md
  ├── 2c  Resync TECH-DEBT.md
  ├── 2d  Update ROADMAP.md
  └── 2e  Tests + check:all green

Phase 3  Registry file splits
  ├── 3a  Split registry-shared-foundation.js → 4 files
  ├── 3b  Split registry-widgets.js → 3 files
  ├── 3c  Update plugin.js bootstrap list (transitional — superseded by 5b)
  ├── 3d  Update components-registry-loader.mjs
  ├── 3e  Tests + check:all green
  └── 3f  Update documentation and agent skills for new registry filenames

Phase 4  Asset architecture
  ├── 4a  Document plugin-wide font convention
  ├── 4b  Add assets field to registry schema (no entries yet — schema only)
  ├── 4c  Create runtime/asset-preloader.js
  ├── 4c′ Extend component-loader.js to call preloader
  ├── 4d  Update plugin.js bootstrap order
  ├── 4e  Update registry loader tool
  ├── 4f  Tests + check:all green
  └── 4g  Documentation (asset-system.md)

Phase 5  Bootstrap manifest extraction
  ├── 5a  Create config/bootstrap-manifest.js
  ├── 5b  Refactor plugin.js to consume manifest
  ├── 5c  Add loadBootstrapManifest to registry loader tool
  ├── 5d  Update check:headers SCAN_ROOTS
  └── 5e  Tests + check:all green

Phase 6  Release tooling
  ├── 6a  tools/release-prepare.mjs
  ├── 6b  tools/release-create.mjs (orchestrator)
  ├── 6c  tools/release-zip-builder.mjs (file collector)
  ├── 6d  Create releases/ directory (with .gitkeep) + .gitattributes
  ├── 6e  Tests + check:all green
  └──     Add npm scripts to package.json

Phase 7  README rewrite
  └──     Replace README.md with user-focused content

Phase 8  Release documentation
  ├──     Create documentation/guides/release-workflow.md
  ├──     Update TABLEOFCONTENTS.md
  └──     Update CONTRIBUTING.md

Phase 9  GitHub Actions
  └──     Create .github/workflows/publish-release.yml
```

---

## New and modified files summary

### New files

| File                                                       | Phase | Purpose                                                   | Est. lines |
| ---------------------------------------------------------- | ----- | --------------------------------------------------------- | ---------- |
| `exec-plans/active/.gitkeep`                               | 1a    | Track empty directory so doc-reachability links resolve   | 0          |
| `config/components/registry-shared-foundation-format.js`   | 3a    | Foundation registry fragment — format components          | ~50        |
| `config/components/registry-shared-foundation-geometry.js` | 3a    | Foundation registry fragment — geometry/math primitives   | ~160       |
| `config/components/registry-shared-foundation-layout.js`   | 3a    | Foundation registry fragment — widget-specific layout/fit | ~160       |
| `config/components/registry-shared-foundation-state.js`    | 3a    | Foundation registry fragment — state/DOM/cache/theme      | ~90        |
| `config/components/registry-widgets-nav.js`                | 3b    | Widgets registry fragment — nav/route/diagnostics         | ~170       |
| `config/components/registry-widgets-vessel.js`             | 3b    | Widgets registry fragment — vessel/alarm/text             | ~75        |
| `config/components/registry-widgets-gauge.js`              | 3b    | Widgets registry fragment — canvas gauges                 | ~95        |
| `runtime/asset-preloader.js`                               | 4c    | Asset preload engine + getAsset API                       | ~100       |
| `config/bootstrap-manifest.js`                             | 5a    | Single-source bootstrap script list                       | ~60        |
| `tools/release-prepare.mjs`                                | 6a    | Gather release context for AI agent                       | ~120       |
| `tools/release-create.mjs`                                 | 6b    | Release orchestrator (check gate + zip + commit + tag)    | ~170       |
| `tools/release-zip-builder.mjs`                            | 6c    | Registry-driven runtime file collector                    | ~200       |
| `documentation/architecture/asset-system.md`               | 4g    | Asset convention and API docs                             | ~80        |
| `documentation/guides/release-workflow.md`                 | 8     | Release process documentation                             | ~120       |
| `.github/workflows/publish-release.yml`                    | 9     | GitHub Release copy workflow                              | ~40        |
| `.gitattributes`                                           | 6d    | Binary diff prevention for release zips                   | ~1         |
| `releases/.gitkeep`                                        | 6d    | Track empty releases directory before first release       | 0          |

### Modified files

| File                                                                  | Phase      | Change                                                                                                                                                           |
| --------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/skills/create-plan/SKILL.md`                                 | 3f         | Update registry filenames                                                                                                                                        |
| `runtime/component-loader.js`                                         | 1b, 4c     | Remove dead `loadScriptOnce` duplicate; add asset preload step                                                                                                   |
| `runtime/theme-runtime.js`                                            | 1b, 1f     | Remove unreachable `resolveOutputsForRoot` guard; add `resolveStartupPresetName` to `_theme` API; add css-js-default-duplication suppression                     |
| `runtime/namespace.js`                                                | 1b         | Remove unreachable `fallbackRoot` path in `getAvnavApi`                                                                                                          |
| `runtime/init.js`                                                     | 1b         | Simplify `console &&` guard; delete duplicated `readThemePresetCssVarFromElement` + `normalizePresetName`, delegate to `runtime._theme.resolveStartupPresetName` |
| `plugin.js`                                                           | 1b, 3c, 5b | Simplify `console &&` guard; replace hardcoded script list with manifest consumption                                                                             |
| `cluster/viewmodels/AisTargetViewModel.js`                            | 1b         | Fix loose equality: `target.type == 21` → `target.type === 21 \|\| target.type === "21"`                                                                           |
| `cluster/mappers/CourseHeadingMapper.js`                              | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| `cluster/mappers/EnvironmentMapper.js`                                | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| `cluster/mappers/MapMapper.js`                                        | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| `cluster/mappers/NavMapper.js`                                        | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| `cluster/mappers/SpeedMapper.js`                                      | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| `cluster/mappers/VesselMapper.js`                                     | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| `cluster/mappers/WindMapper.js`                                       | 1b         | Remove dead `toolkit.num \| function` fallback                                                                                                                   |
| All widgets with `version` field                                      | 1b         | Strip per-widget `version` fields (ClusterWidget, ThreeValueTextWidget, XteDisplayWidget, all 7 linear, all 7 radial)                                                |
| 30 files using bare `isFinite` (see 1c)                               | 1c         | Replace `isFinite(x)` → `Number.isFinite(x)`                                                                                                                     |
| `tools/check-patterns.mjs` or `tools/check-patterns/`                 | 1c         | Add `global-isfinite` linter rule                                                                                                                                |
| `shared/widget-kits/radial/RadialValueMath.js`                        | 1d, 2a     | Extend `formatGaugeDisplay` to accept formatter name/params; rename `.fallback` → `.plain`                                                                       |
| `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js`               | 1d         | Delete `formatSpeedString` + `displaySpeedFromRaw`, delegate to shared `formatGaugeDisplay`                                                                      |
| `widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js`           | 1d         | Delete `formatVoltageString` + `displayVoltageFromRaw`, delegate to shared `formatGaugeDisplay`                                                                  |
| `widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js`   | 1d         | Delete `toCelsiusNumber` + `displayTempFromRaw`, delegate to shared `formatGaugeDisplay`                                                                         |
| `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js`               | 1d         | Delete local `formatDisplay`, delegate to shared `formatGaugeDisplay`                                                                                            |
| `widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js`           | 1d         | Delete local `formatDisplay`, delegate to shared `formatGaugeDisplay`                                                                                            |
| `widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js`   | 1d         | Delete local `formatDisplay`, delegate to shared `formatGaugeDisplay`                                                                                            |
| `shared/widget-kits/nav/RoutePointsDomEffects.js`                     | 1e, 2a     | Delete local `resolveHostCommitTarget`, use `HtmlWidgetUtils` version; rename `fallback` → `defaultValue` in `toSafeInteger` and `toElementHeight`               |
| `shared/widget-kits/nav/AisTargetRenderModel.js`                      | 1e         | Replace inline dispatch-mode check with `HtmlWidgetUtils.canDispatchSurfaceInteraction`                                                                          |
| `shared/widget-kits/vessel/AlarmRenderModel.js`                       | 1e         | Replace inline dispatch-mode check with `HtmlWidgetUtils.canDispatchSurfaceInteraction`                                                                          |
| `shared/theme/ThemeModel.js`                                          | 1f         | Add css-js-default-duplication suppression comments                                                                                                              |
| `shared/widget-kits/format/StableDigits.js`                           | 2a         | Rename `fallback` → `plain`, `fallbackSuffix` → `defaultSuffix`, `buildFallback` → `buildPlain`                                                                  |
| `shared/widget-kits/format/UnitAwareFormatter.js`                     | 2a         | Rename `fallback` parameter → `defaultValue`                                                                                                                     |
| `shared/widget-kits/nav/ActiveRouteHtmlFit.js`                        | 2a         | Rename `fallbackValue`/`useFallback` → `plainValue`/`usePlain` throughout                                                                                        |
| `shared/widget-kits/nav/AisTargetHtmlFit.js`                          | 2a         | Rename `fallbackText`/`fallbackFit` → `plainText`/`plainFit`                                                                                                     |
| `shared/widget-kits/nav/EditRouteHtmlFit.js`                          | 2a         | Rename `fallbackValueText`/`fallbackValue`/`useFallback` → `plainValueText`/`plainValue`/`usePlain`                                                              |
| `shared/widget-kits/nav/EditRouteHtmlFitSupport.js`                   | 2a         | Rename `fallbackText`/`fallbackValue`/`resolveMetricFallbackValue`/`useFallback` → `plainText`/`plainValue`/`resolveMetricPlainValue`/`usePlain`                 |
| `shared/widget-kits/nav/EditRouteLayoutGeometry.js`                   | 2a         | Rename `fallback` parameter → `defaultValue`                                                                                                                     |
| `shared/widget-kits/nav/RoutePointsHtmlFit.js`                        | 2a         | Rename `fallbackText`/`fallbackFit` → `plainText`/`plainFit`                                                                                                     |
| `shared/widget-kits/nav/RoutePointsRenderModel.js`                    | 2a         | Rename `fallback` parameter → `defaultValue`, `fallbackValueText` → `plainValueText`                                                                             |
| `shared/widget-kits/nav/CenterDisplayRenderModel.js`                  | 2a         | Rename `.fallback` → `.plain`                                                                                                                                    |
| `shared/widget-kits/state/StateScreenTextFit.js`                      | 2a         | Rename `fallback` parameter → `defaultValue`                                                                                                                     |
| `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js`             | 2a         | Rename `buildFallbackFit` → `buildBaselineFit`, `fallbackFit` → `baselineFit`                                                                                    |
| `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` | 1e, 2a     | Replace inline dispatch-mode check with shared helper; rename `fallbackText` fields → `plainText`                                                                |
| `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`         | 1e, 2a     | Replace inline dispatch-mode check with shared helper; rename `.fallback` → `.plain`                                                                             |
| `widgets/text/XteDisplayWidget/XteDisplayWidget.js`                   | 2a         | Rename `.fallback` → `.plain`                                                                                                                                    |
| `tests/shared/format/StableDigits.test.js`                            | 2a         | Rename `.fallback` assertions → `.plain`                                                                                                                         |
| `tests/shared/nav/AisTargetHtmlFitFallback.test.js`                   | 2a         | Rename file → `AisTargetHtmlFitPlain.test.js`; update `fallbackText`/`fallbackFit` assertions → `plainText`/`plainFit`                                          |
| `tests/shared/nav/AisTargetRenderModel.test.js`                       | 2a         | Update `fallbackText` assertions → `plainText`                                                                                                                   |
| `tests/shared/nav/EditRouteHtmlFit.test.js`                           | 2a         | Update `fallbackValueText`/`useFallback` assertions → `plainValueText`/`usePlain`                                                                                |
| `tests/shared/nav/EditRouteRenderModel.test.js`                       | 2a         | Update `fallbackText` assertions → `plainText`                                                                                                                   |
| `tests/tools/check-patterns.test.js`                                  | 2a         | Update `fallback` references in rule test fixtures                                                                                                               |
| `tests/tools/check-smell-contracts.test.js`                           | 2a         | Update `fallback` references in smell contract fixtures                                                                                                          |
| `CONTRIBUTING.md`                                                     | 1a, 8      | Fix typo "remeber" → "remember"; add release workflow cross-reference                                                                                            |
| `documentation/QUALITY.md`                                            | 2b         | Resync layer counts, check summaries, drift patterns                                                                                                             |
| `documentation/TECH-DEBT.md`                                          | 2c         | Resync TD-015/TD-025, add resolved entry for vocabulary rename                                                                                                   |
| `ROADMAP.md`                                                          | 2d         | Mark release tooling item as in-progress                                                                                                                         |
| `.agents/skills/add-widget/SKILL.md`                                  | 3f         | Update registry filenames for split fragments                                                                                                                    |
| `.agents/skills/mapper-review/SKILL.md`                               | 3f         | Update grep example for split fragments                                                                                                                          |
| `documentation/guides/add-new-gauge.md`                               | 3f         | Update to reference `registry-widgets-gauge.js`                                                                                                                  |
| `documentation/guides/add-new-linear-gauge.md`                        | 3f         | Update to reference `registry-widgets-gauge.js`                                                                                                                  |
| `documentation/guides/add-new-full-circle-dial.md`                    | 3f         | Update to reference `registry-widgets-gauge.js`                                                                                                                  |
| `documentation/guides/add-new-text-renderer.md`                       | 3f         | Update to reference correct widget fragment                                                                                                                      |
| `documentation/guides/add-new-html-kind.md`                           | 3f         | Update to reference correct widget fragment                                                                                                                      |
| `documentation/guides/add-new-cluster.md`                             | 3f         | Update shared-foundation references to correct fragment                                                                                                          |
| `documentation/architecture/component-system.md`                      | 3f         | Update registry file list and examples                                                                                                                           |
| `tools/components-registry-loader.mjs`                                | 3d, 4e, 5c | Update script chain, add `loadBootstrapManifest` export                                                                                                          |
| `tools/check-headers.mjs`                                             | 5d         | Add `config/bootstrap-manifest.js` to SCAN_ROOTS                                                                                                                 |
| `package.json`                                                        | 6          | Add `release:prepare` and `release:create` scripts                                                                                                               |
| `README.md`                                                           | 7          | Full rewrite — user-focused                                                                                                                                      |
| `documentation/TABLEOFCONTENTS.md`                                    | 8          | Add release workflow link                                                                                                                                        |

### Deleted files

| File                                              | Phase | Replaced by          |
| ------------------------------------------------- | ----- | -------------------- |
| `config/components/registry-shared-foundation.js` | 3a    | Four fragment files  |
| `config/components/registry-widgets.js`           | 3b    | Three fragment files |

---

## Risks and mitigations

| Risk                                                 | Impact                                    | Mitigation                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry split breaks load order                     | Widgets fail to render                    | Phase 3e: deep-equal test of merged registry before and after split                                                                                                                                                                                                                                     |
| Additive fragment assignment order matters           | Second fragment silently overwrites first | Each fragment uses `groups.X = groups.X \| {}` guard; `config/components.js` duplicate-ID check catches accidental key collisions                                                                                                                                                                       |
| Asset preloader fetch failures block widget loading  | Widget hangs on load                      | Preloader catches per-asset errors and logs warning; `getAsset` returns null for failed loads; widget must handle null gracefully                                                                                                                                                                       |
| `zip` command not available on developer machine     | `release:create` fails                    | Tool checks for `zip` at startup, prints install instructions for macOS/Linux/Windows                                                                                                                                                                                                                   |
| Release zip missing a runtime file                   | Plugin broken in production               | Phase 6c: manifest validation checks every file exists; Phase 6e: test verifies zip contents against current codebase                                                                                                                                                                                   |
| Git tag already exists for version                   | Overwrite risk                            | `release:create` checks `git tag -l v{version}` and refuses to proceed if it exists                                                                                                                                                                                                                     |
| Release commit/tag on dirty working tree             | Unintended files in commit                | `release:create` checks for uncommitted changes (outside `releases/`) and refuses to proceed if working tree is dirty                                                                                                                                                                                   |
| `check:core` + `test:coverage:check` is slow (~30s+) | Developer friction on release             | Acceptable — this runs once per release, not per commit. The gate is non-negotiable.                                                                                                                                                                                                                    |
| `releases/` grows large over time                    | Repo bloat                                | Acceptable for now. Font woff2 files are ~80KB total, so each release zip is ~500KB–1MB. After 50 releases that's ~50MB — manageable. If it becomes a problem, old releases can be pruned with a `releases:gc` tool (out of scope). `.gitattributes` marks zips as binary to prevent futile text diffs. |
| Manifest script fails to load                        | Entire plugin dead                        | `plugin.js` catches the load error and logs a clear message identifying the missing file                                                                                                                                                                                                                |

---

## What this plan does NOT cover

- **Bundling or minification.** The plugin has no build step today and this plan preserves that. Files ship as authored.
- **Auto-changelog generation.** The AI agent writes release notes from the structured context. There is no conventional-commits parser that generates notes mechanically.
- **CDN or package registry publishing.** Distribution is zip-to-AvNav-plugin-dir only.
- **Multi-plugin monorepo support.** This is a single-plugin repository.
- **Migration of existing `js`/`css` registry fields to relative paths.** Only the new `assets` field uses relative paths. Migrating `js`/`css` is a future cleanup.