# PLAN4 — Runtime & Theme Lifecycle Cleanup After renderHtml Refactor

## Status

Cleanup plan for lifecycle misalignments, duplicated utilities, timing bugs, and documentation gaps accumulated during the renderCanvas → renderHtml host registration refactor.

---

## Goal

After this plan is implemented, the runtime and theme lifecycle should be tight, fast, and fail-fast — no speculative fallbacks, no duplicated logic, no timing-dependent workarounds, no silent degradation. Documentation must accurately describe the current runtime architecture end-to-end.

Binding targets:

- **ThemeResolver** discovers preset names from CSS variables at render time, closing the proven timing gap where `--dyni-theme-preset` set in `user.css` has no effect.

- **Duplicated utility functions** (`startPerfSpan`/`endPerfSpan`, `toFiniteNumber`/`escapeHtml`/`resolveShellRect`/`resolveMode`/`isEditingMode`, `getNightModeState`, `normalizePresetName`, `loadScriptOnce`) are extracted into shared modules or explicitly suppressed with documented reasons.

- **Hot-path waste** (per-call `computeCapabilities`, per-call `getState` shallow copy, double model computation in `resizeSignature`, whole-body `MutationObserver`) is eliminated or bounded.

- **Framework-method typeof guards** on ThemeResolver invalidation APIs are removed after confirmed module loading.

- **CanvasDomSurfaceAdapter** is brought back under the ≤400-line budget.

- **`documentation/architecture/runtime-lifecycle.md`** is extended with the complete lifecycle analysis performed during this plan's investigation, and all affected architecture/convention/guide docs are updated.

---

## Lifecycle & Flow Analysis

This section records the end-to-end lifecycle analysis that motivated the problem list. It serves as the investigative reference for all phases.

### Bootstrap Flow

`plugin.js` loads 25 internal scripts sequentially via a Promise chain. Each script resolves before the next loads. After all scripts, `runtime/init.js` auto-invokes `runInit()`.

```
plugin.js
  ├─ Guard: avnav.api present
  ├─ Resolve AVNAV_BASE_URL → baseUrl
  ├─ Create namespace: window.DyniPlugin = { baseUrl }
  └─ Sequential Promise chain:
       runtime/namespace.js           ← DyniPlugin.{runtime, state, config}
       runtime/helpers.js             ← applyFormatter, setupCanvas, resolveTypography
       runtime/editable-defaults.js
       config/components/registry-*.js (×4) → config/components.js
       config/shared/*.js (×3)
       config/clusters/*.js (×8)      ← push into config.clusters[]
       config/widget-definitions.js   ← config.widgetDefinitions = config.clusters
       runtime/component-loader.js    ← loadScriptOnce ⚠ duplicated from plugin.js
       runtime/widget-registrar.js
       runtime/HostCommitController.js
       runtime/SurfaceSessionController.js
       runtime/TemporaryHostActionBridge.js
       runtime/init.js                ← runInit() auto-invoked
```

**Dependency wall:** Runtime IIFEs execute on `DyniPlugin.runtime` and have no access to UMD components loaded later by `component-loader.js`. This is why runtime files cannot call `Helpers.getModule()` and must either duplicate shared utilities or access them via the runtime namespace.

### Init Flow

`runInit()` creates the Helpers object, loads all UMD components via `component-loader.js`, registers each widget definition with AvNav, and resolves the theme preset:

```
runInit()
  ├─ Guard: avnav.api present, state.initStarted not set
  ├─ Create TemporaryHostActionBridge → state.hostActionBridge
  ├─ Build Helpers (applyFormatter, setupCanvas, getModule, ...)
  ├─ Create ComponentLoader from config.components registry
  ├─ uniqueComponents(widgetDefinitions) + force-include ThemePresets
  ├─ Promise.all(loadComponent for each unique component)
  │   └─ Each: resolve deps → loadCssOnce + loadScriptOnce → verify .create
  ├─ For each widgetDef: registerWidget(component, widgetDef, Helpers)
  ├─ Stash state.themeResolverModule, build state.themePresetApi
  ├─ resolveThemePresetName():
  │   1. readThemePresetFromSettingsApi() → null (stub)
  │   2. window.DyniPlugin.theme string
  │   3. CSS --dyni-theme-preset on .widget.dyniplugin roots
  │   4. CSS --dyni-theme-preset on <html> or <body>
  │   5. "default"
  └─ applyThemePresetToRegisteredWidgets(presetName)
       querySelectorAll(".widget.dyniplugin") → roots
       ⚠ At init time, AvNav may not have mounted containers yet.
       If roots.length === 0, preset is saved in state but never applied to DOM.
```

### Widget Registration

`registerWidget` calls `component.create(def, Helpers)` to build the component spec. For `ClusterWidget`, this creates the full routing infrastructure at registration time: `mapperToolkit`, `rendererRouter` (which resolves all renderer specs and validates the kind catalog), and `mapperRegistry`. The spec is then registered with AvNav via `avnav.api.registerWidget`.

All `renderHtml`, `initFunction`, and `finalizeFunction` are wrapped to inject `ctx.hostActions` before each call. `translateFunction` is NOT wrapped — it is a pure data transform.

### Render Cycle (per frame)

AvNav calls `translateFunction`, then `renderHtml` on every store key change:

```
translateFunction(props)
  └─ mapperRegistry.mapCluster(props, toolkit)
       └─ mapper.translate(props, toolkit) → renderer-specific props

renderHtml(translatedProps)
  ├─ resolveRuntimeState(ctx)
  │   └─ Lazy-init HostCommitController + SurfaceSessionController on first call
  ├─ hostCommitController.recordRender(props)  → revision++
  ├─ ctx.__dyniHostCommitState = getState()
  │   ⚠ Creates new 10-property object every call (Problem 8)
  ├─ rendererRouter.renderHtml(props)
  │   ├─ kindCatalog.resolveRoute(cluster, kind) → { rendererId, surface }
  │   ├─ buildShellHtml(routeState, hostContext)
  │   │   └─ renderSurfaceShell:
  │   │        canvas-dom: static shell HTML
  │   │        html: HtmlSurfaceController.renderSurfaceShell
  │   │              ├─ Pre-bind named handlers on ctx.eventHandler
  │   │              ├─ rendererSpec.renderHtml(props) → inner HTML
  │   │              └─ Wrap in <div class="dyni-surface-html">
  │   └─ Return HTML string
  ├─ hostCommitController.scheduleCommit({ onCommit: ... })
  │   └─ onCommit (fires after AvNav commits HTML to DOM):
  │        ├─ rendererRouter.createSessionPayload(commitPayload)
  │        └─ surfaceSessionController.reconcileSession(sessionPayload)
  └─ Return HTML string to AvNav host
```

### Host Commit Scheduling

`HostCommitController` resolves shell elements in the DOM after AvNav commits the HTML string:

```
scheduleCommit(callbacks)
  └─ scheduleRafAttempt(revision, callbacks, attempt=1)
       RAF-1 → commitIfReady("raf-1")
         ├─ Stale revision? → abort
         ├─ resolveShellElement() → querySelector('[data-dyni-instance="..."]')
         ├─ Not found → attempt 2
         └─ Found → resolveRootElement → onCommit(...)

       RAF-2 → commitIfReady("raf-2")
         ├─ Not found → installDeferredObservers()
         │   ├─ MutationObserver on document.body { childList, subtree }
         │   │   ⚠ Fires on EVERY unrelated DOM mutation (Problem 6)
         │   └─ setTimeout(0) fallback
         └─ Found → onCommit(...)
```

Only 2 RAF attempts before the expensive MutationObserver fallback. No timeout ceiling — the observer runs indefinitely until the element appears or a new render makes the revision stale.

### Surface Session State Machine

`SurfaceSessionController.reconcileSession(payload)`:

| Condition | Action |
|---|---|
| `revision < mountedRevision` | Skip (stale) |
| No active controller | Create → `attach(payload)` |
| Same surface, same shellEl | `update(payload)` |
| Same surface, different shellEl | `detach("remount")` → `attach(payload)` |
| Different surface | `detach` → `destroy` → create new → `attach(payload)` |

### HTML Surface Lifecycle

For `activeRoute` and `zoom` kinds:

```
renderSurfaceShell (during renderHtml, before DOM exists):
  ├─ Pre-bind named handlers ← required for onclick attrs in HTML
  ├─ rendererSpec.renderHtml(props) → inner HTML string
  └─ Wrap in <div class="dyni-surface-html">

attach (after host commit):
  ├─ Rebind named handlers (with current props closure)
  ├─ Compute initial resizeSignature
  └─ rendererSpec.initFunction(props) → this.triggerResize()

update (subsequent renders):
  ├─ Rebind named handlers with new props
  ├─ Compare resizeSignature → if changed, triggerResize()
  │   ⚠ resizeSignature recomputes the full render model
  └─ Return { updated, changed }

detach/destroy:
  └─ Remove owned handlers, clear state
```

Handler pre-bind / rebind subtlety: handlers are pre-bound during `renderSurfaceShell` and rebound during `attach` and every `update`. On normal update cycles (not first mount), the pre-bind in `renderSurfaceShell` is always followed by an `update` rebind — every render does handler binding twice.

### Canvas-DOM Surface Lifecycle

For all gauge, text, dial, and display kinds:

```
renderSurfaceShell: static HTML (no renderer involvement)

attach:
  ├─ Find .dyni-surface-canvas, find .dyni-surface-canvas-mount
  ├─ Create <canvas>, apply contract styles (100% w/h, font-size: initial)
  ├─ Append canvas, bind ResizeObserver → schedulePaint("size")
  └─ schedulePaint("attach") → RAF → paintNow → renderCanvas(canvas, props)

update:
  ├─ shallowEqual(oldProps, newProps) → skip if equal
  └─ schedulePaint("update") → RAF → paintNow

Paint coalescing: dirty flags (paint/size/theme) coalesced into single RAF.

Theme invalidation:
  invalidateTheme() → ThemeResolver.invalidateRoot → schedulePaint("theme")
  ⚠ callThemeInvalidation uses typeof guards (Problem 11)

detach/destroy: cancel RAF, disconnect ResizeObserver, remove canvas
```

### Theme Token Resolution at Render Time

```
ThemeResolver.resolveForRoot(rootEl):
  ├─ Night mode check (body/html .nightMode) → invalidateAll if changed
  ├─ Return cached if present
  ├─ getActivePresetName(rootEl, presetDefs)
  │   └─ rootEl.getAttribute("data-dyni-theme")
  │      ⚠ NO fallback to getComputedStyle("--dyni-theme-preset") (Problem 1)
  ├─ Lookup preset values from ThemePresets.PRESETS[presetName]
  └─ resolveTokens([computedStyle], presetValues)
       Per token: CSS override → preset value → built-in default
```

The per-token CSS read path works correctly. Only the preset *name* discovery is broken — it has no CSS fallback.

### Event Handler & Click Dispatch

```
HTML onclick="handlerName" → AvNav resolves against ctx.eventHandler

activeRouteOpen:
  canDispatchOpenRoute(hostContext) → hostActions.getCapabilities()
  hostActions.routeEditor.openActiveRoute()
  → TemporaryHostActionBridge.dispatchViaPageItemClick

mapZoomCheckAutoZoom:
  canDispatchCheckAutoZoom(hostContext) → hostActions.getCapabilities()
  hostActions.map.checkAutoZoom()
  → TemporaryHostActionBridge.dispatchViaPageItemClick

Bridge dispatch chain:
  ensureActive() → computeCapabilities()
  ⚠ detectPageId: 3× getElementById probes, recomputed every call (Problem 7)
  → findPageItemClickHandler via React fiber walk → handler(syntheticEvent)
```

### Kind-Switch Flow (Surface Transition)

When `kind` changes from a canvas-dom kind to an html kind (e.g. `sogRadial` → `activeRoute`):

1. `translateFunction` → NavMapper maps activeRoute data
2. `renderHtml` → router resolves `surface: "html"`, `HtmlSurfaceController.renderSurfaceShell` pre-binds handlers and renders inner HTML
3. `scheduleCommit` → RAF chain → commit fires
4. `reconcileSession({ surface: "html" })`:
   - Old surface was `canvas-dom` → surface switch
   - Old controller: `detach("surface-switch")` (cancel RAF, disconnect ResizeObserver, remove canvas)
   - Old controller: `destroy()`
   - New controller: `createSurfaceController("html")` → `attach(payload)` (bind handlers, init)

Kind switches within the same surface (e.g. `sogRadial` → `stwRadial`) are handled by the dynamic controller inside `ClusterRendererRouter` without destroying the surface controller.

---

## Problem Analysis

### Problem 1: ThemeResolver cannot read `--dyni-theme-preset` from CSS at render time

`getActivePresetName()` in `shared/theme/ThemeResolver.js` (line 149) reads only the `data-dyni-theme` DOM attribute via `rootEl.getAttribute("data-dyni-theme")`. That attribute is set by `runtime/init.js` via `applyThemePresetToRegisteredWidgets()`, but at init time the `.widget.dyniplugin` containers may not exist yet (AvNav React hasn't mounted them).

When AvNav later mounts a container and calls `renderHtml`, `ThemeResolver.resolveForRoot(rootEl)` discovers no `data-dyni-theme` attribute and defaults to `"default"`, ignoring any `--dyni-theme-preset` CSS variable set in `user.css`.

Individual CSS tokens work because `resolveTokens()` reads each token via `getComputedStyle()` on every cache miss. The preset *name* has no equivalent render-time CSS read path.

**Evidence:** Setting `--dyni-theme-preset: bold` in `user.css` scoped to `.widget.dyniplugin` has no visible effect. Setting individual tokens like `--dyni-pointer: #00ff00` on the same selector works correctly.

**Files:** `shared/theme/ThemeResolver.js` (lines 149–154), `tests/shared/theme/ThemeResolver.test.js`

**Fix direction:** Make `getActivePresetName()` fall back to reading `--dyni-theme-preset` from `getComputedStyle(rootEl)` when `rootEl.getAttribute("data-dyni-theme")` returns `null`. Use `getAttribute() !== null` to distinguish "explicitly set to default" from "never set". The priority chain is preserved: DOM attribute (set by runtime/init or console) > CSS variable (set by `user.css`) > built-in default.

### Problem 2: `getNightModeState()` duplicated between ThemeResolver and helpers

`shared/theme/ThemeResolver.js` (line 164) and `runtime/helpers.js` (line 101) contain body-identical implementations. Both check `document.documentElement.classList` and `document.body.classList` for the `.nightMode` class.

**Files:** `shared/theme/ThemeResolver.js` (lines 164–180), `runtime/helpers.js` (lines 101–114)

**Smell rules:** `duplicate-functions` (block), core principle #8.

**Fix direction:** ThemeResolver is a self-contained UMD component and must not depend on runtime (core principle #4). The canonical implementation stays in ThemeResolver. Export it on the module surface. `runtime/helpers.js` delegates to `DyniComponents.DyniThemeResolver.create.getNightModeState` after component loading, or carries an explicit `dyni-lint-disable-next-line duplicate-functions` suppression with reason.

### Problem 3: `startPerfSpan` / `endPerfSpan` / `PERF_HOOK_KEY` / `GLOBAL_ROOT` duplicated across 6 files

The perf-hook wiring pattern is copy-pasted:

| File | Lines | Pattern |
|---|---|---|
| `cluster/ClusterWidget.js` | 14–35 | `GLOBAL_ROOT`, `PERF_HOOK_KEY`, `startPerfSpan`, `endPerfSpan` |
| `cluster/rendering/ClusterRendererRouter.js` | 13–34 | Identical |
| `cluster/rendering/HtmlSurfaceController.js` | 14–39 | Identical + extra `GLOBAL_ROOT` usage |
| `cluster/rendering/CanvasDomSurfaceAdapter.js` | 20–27 | Condensed variant + `GLOBAL_ROOT` reuse for RAF/ResizeObserver |
| `runtime/HostCommitController.js` | 12, 70–76 | `PERF_HOOK_KEY` + `resolvePerfHooks()` — body-identical logic |
| `runtime/SurfaceSessionController.js` | 11, 78–84 | `PERF_HOOK_KEY` + `resolvePerfHooks()` — body-identical logic |

**Smell rules:** `duplicate-functions` (block), `duplicate-block-clones` (block), core principle #8.

**Fix direction:** Extract `shared/widget-kits/perf/PerfSpanHelper.js` UMD micro-module. The four cluster/shared consumers import via `Helpers.getModule("PerfSpanHelper")`. Runtime IIFEs either access a shared implementation attached to `DyniPlugin.runtime.perf` during namespace bootstrap, or carry explicit `dyni-lint-disable-next-line duplicate-functions` suppressions.

### Problem 4: Utility functions duplicated across HTML widgets and HtmlFit modules

| Function | ActiveRouteTextHtmlWidget | MapZoomTextHtmlWidget | MapZoomHtmlFit | ActiveRouteHtmlFit |
|---|---|---|---|---|
| `toFiniteNumber` | line 22 | line 21 | line 24 | line 19 |
| `trimText` | line 18 | line 26 | — | — |
| `escapeHtmlText` / `escapeHtml` | line 27 (`escapeHtmlText`) | line 30 (`escapeHtml`) | — | — |
| `toStyleAttr` | line 36 | line 39 | — | — |
| `resolveShellRect` | line 88 (via helper) | line 61 | line 33 | — |
| `resolveMode` | line 92 | line 76 | — | — |
| `isEditingMode` | line 150 | line 122 | — | — |

`resolveShellRect` in MapZoomTextHtmlWidget (line 61) and MapZoomHtmlFit (line 33) are body-identical inline expansions. `escapeHtmlText` and `escapeHtml` are the same function under different names.

**Smell rules:** `duplicate-functions` (block), `duplicate-block-clones` (block), core principle #8.

**Fix direction:** Extract `shared/widget-kits/html/HtmlWidgetUtils.js` UMD module. All four consumer files delegate via `Helpers.getModule("HtmlWidgetUtils")`.

### Problem 5: MapZoomHtmlFit hardcodes font weights instead of reading ThemeResolver tokens

`shared/widget-kits/nav/MapZoomHtmlFit.js` lines 20–21:

```javascript
const VALUE_WEIGHT = 700;
const LABEL_WEIGHT = 700;
```

`ActiveRouteHtmlFit.js` correctly resolves `ThemeResolver` via `Helpers.getModule("ThemeResolver")` (line 115) and reads `tokens.font.weight` (line 132). `MapZoomHtmlFit` does not import ThemeResolver at all.

**Smell rules:** `css-js-default-duplication` (warn), `hardcoded-runtime-default` (block).

**Fix direction:** MapZoomHtmlFit resolves `ThemeResolver` and reads `font.weight` / `font.labelWeight` from `resolveForRoot()`. Remove hardcoded constants.

### Problem 6: HostCommitController uses MutationObserver on `document.body` with `subtree: true`

`runtime/HostCommitController.js` line 218: after two RAF attempts, `installDeferredObservers()` creates:

```javascript
state.observer.observe(doc.body, { childList: true, subtree: true });
```

This observer fires on every DOM mutation across the entire AvNav application. Each firing triggers `commitIfReady()` which runs `document.querySelector()`. There is no timeout ceiling — the observer runs indefinitely.

**Fix direction:** (a) Increase RAF budget from 2 to 4. (b) Add a timeout ceiling (2000ms) that disconnects the observer and calls `clearPendingState` with `"timeout-ceiling"` status. (c) If a parent container selector is known, scope the observer to that parent.

### Problem 7: TemporaryHostActionBridge recomputes `computeCapabilities()` on every action call

`computeCapabilities()` (line 158) calls `detectPageId(doc)` (up to 3 `getElementById` probes) and `getRoutePointsApi()` on every facade method: `getCapabilities` (line 199), `routePoints.activate` (line 203), `map.checkAutoZoom` (line 223), `routeEditor.openActiveRoute` (line 237), `routeEditor.openEditRoute` (line 250), `ais.showInfo` (line 261), and `dispatchViaPageItemClick` (line 186).

The page ID is stable during a bridge instance's lifetime. The capabilities are deterministic given page ID + API presence.

**Fix direction:** Compute capabilities once at `create()` time and cache. Keep a fresh `getRoutePointsApi()` probe only in `routePoints.activate`.

### Problem 8: HostCommitController.getState() creates a full shallow copy on every call

Lines 78–92: `getState()` creates a new object with 10 properties every call. Called from `ClusterWidget.renderHtml()` (line 130) on every render cycle for `ctx.__dyniHostCommitState`.

**Fix direction:** Cache a snapshot object. Rebuild it only in mutation methods (`initState`, `recordRender`, `commitIfReady`). `getState()` returns the cached reference.

### Problem 9: `loadScriptOnce` duplicated between `plugin.js` and `runtime/component-loader.js`

`plugin.js` line 22 and `runtime/component-loader.js` line 33: body-identical implementations.

**Smell rules:** `duplicate-functions` (block), core principle #8.

**Fix direction:** `plugin.js` runs before `component-loader.js`. Attach on namespace in `plugin.js` (`DyniPlugin.runtime.loadScriptOnce = loadScriptOnce`). `component-loader.js` reuses it. If load-order cannot be guaranteed, add explicit suppression.

### Problem 10: `normalizePresetName` duplicated across three theme files

Three near-identical implementations:

| File | Line | Validation source |
|---|---|---|
| `shared/theme/ThemeResolver.js` | 138 | Passed `presetDefs` argument |
| `shared/theme/ThemePresets.js` | 83 | Module-scoped `PRESETS` constant |
| `runtime/init.js` | 91 | `knownPresetNames().includes()` |

All three: check type is string, trim, lowercase, validate against known presets, default to `"default"`.

**Smell rules:** `duplicate-functions` (block), core principle #8.

**Fix direction:** The canonical implementation belongs in `ThemePresets` (which owns the preset catalog). `ThemeResolver` delegates to `ThemePresets.normalizePresetName` or uses a shared pure function that accepts the preset-names list as argument. `runtime/init.js` delegates to `ThemePresets` module after it is loaded during `runInit`.

### Problem 11: Framework-method typeof guards on ThemeResolver invalidation API

Two locations use `typeof resolverMod.invalidateRoot === "function"` / `typeof resolverMod.invalidateAll === "function"`:

- `runtime/init.js` `invalidateThemeResolverCache()` (lines 142–150)
- `cluster/rendering/CanvasDomSurfaceAdapter.js` `callThemeInvalidation()` (lines 148–160)

After ThemeResolver module loading, both `invalidateRoot` and `invalidateAll` are guaranteed by its module contract. Both guards also fall through to `invalidateAll` as a secondary check, creating a two-tier defensive pattern against an already-validated module.

**Smell rules:** `framework-method-typeof-guard` (block), `redundant-internal-fallback` (block).

**Fix direction:** Call `invalidateRoot` directly. Remove fallback branches. If the init.js timing requires the guard (ThemeResolver not yet loaded at call time), add an explicit `dyni-lint-disable-next-line` suppression.

### Problem 12: `CanvasDomSurfaceAdapter.js` at 447 lines exceeds ≤400-line budget

`cluster/rendering/CanvasDomSurfaceAdapter.js` is at 447 lines. Core principle #5 requires ≤400 lines.

**Fix direction:** Phase 1 perf extraction removes ~8 lines. Further extraction candidates: the recursive `findDescendantByClass` utility (lines 36–53) and `callThemeInvalidation` (lines 148–160). Replace `findDescendantByClass` with `querySelector` calls which already exist as fallbacks. Simplify `callThemeInvalidation` after removing typeof guards (Problem 11). Target: ≤395 lines.

---

## Hard Constraints

### Dependency Layering (Core Principle #4)

```
widgets → shared
cluster → cluster / widgets / shared
shared → shared
config = pure data
runtime → runtime only (must not depend on widgets / cluster / shared)
```

Runtime IIFE files (`runtime/*.js`) are attached to `DyniPlugin.runtime` and cannot use `Helpers.getModule()`. Any shared utility they need must either be attached to the runtime namespace during bootstrap or duplicated with an explicit suppression.

### UMD/IIFE Only (Core Principle #1)

No ES module `import`/`export`. No bundler. No build step. All files must be plain JS loadable via `<script>` tags.

### File Size (Core Principle #5)

≤400 lines per JS file. `CanvasDomSurfaceAdapter.js` currently violates this at 447 lines.

### Theme Priority Chain

The per-token resolution order must remain: CSS custom property override > preset value > ThemeResolver built-in default. The preset *name* resolution order must become: DOM attribute > CSS variable > built-in default.

### Smell Rules

All rules in `documentation/conventions/smell-prevention.md` are binding. Every intentional exception needs a `dyni-lint-disable-*` suppression with reason.

---

## Implementation Order

### Phase 1 — Extract shared utility modules

**Goal:** Eliminate cross-file duplication (Problems 3, 4, 9) and bring `CanvasDomSurfaceAdapter.js` under the line budget (Problem 12).

**Dependencies:** None. Purely additive extraction.

**A. Create `shared/widget-kits/perf/PerfSpanHelper.js`**

UMD micro-module exporting `startPerfSpan(name, tags)` and `endPerfSpan(span, tags)`. Owns `GLOBAL_ROOT` and `PERF_HOOK_KEY`. Module header per coding standards.

**B. Create `tests/shared/perf/PerfSpanHelper.test.js`**

Unit tests covering: span start/end with hooks installed, span start/end without hooks (returns null, no-op), tag passthrough.

**C. Wire PerfSpanHelper into the component registry**

Register in the relevant `config/components/registry-*.js` file and `config/components.js`.

**D. Replace duplicated perf blocks in cluster/shared consumers**

In `cluster/ClusterWidget.js`, `cluster/rendering/ClusterRendererRouter.js`, `cluster/rendering/HtmlSurfaceController.js`, and `cluster/rendering/CanvasDomSurfaceAdapter.js`: remove local `GLOBAL_ROOT`, `PERF_HOOK_KEY`, `startPerfSpan`, `endPerfSpan`. Replace with `Helpers.getModule("PerfSpanHelper")` delegation in `create()`.

Note: `CanvasDomSurfaceAdapter.js` also uses `GLOBAL_ROOT` for RAF/ResizeObserver resolution. Those references stay local (they are not perf-hook logic).

**E. Handle runtime IIFE perf copies**

For `runtime/HostCommitController.js` and `runtime/SurfaceSessionController.js`:
- Option A (preferred): during namespace bootstrap (`runtime/namespace.js`), attach the shared perf implementation on `DyniPlugin.runtime.perf = { startSpan, endSpan }`. Both files reference `runtime.perf.*`.
- Option B (fallback): add explicit `dyni-lint-disable-next-line duplicate-functions -- canonical source: shared/widget-kits/perf/PerfSpanHelper.js; runtime IIFE cannot access UMD components` suppressions.

**F. Create `shared/widget-kits/html/HtmlWidgetUtils.js`**

UMD module exporting: `toFiniteNumber`, `trimText`, `escapeHtml`, `toStyleAttr`, `resolveShellRect`, `resolveMode`, `isEditingMode`. Canonical function names (rename `escapeHtmlText` → `escapeHtml` everywhere).

**G. Create `tests/shared/html/HtmlWidgetUtils.test.js`**

Unit tests for each function. Cover edge cases: `toFiniteNumber(NaN)`, `toFiniteNumber(Infinity)`, `escapeHtml` with `<>&"'` characters, `resolveShellRect` with zero dimensions, `resolveMode` with missing ratio thresholds, `isEditingMode` with `dyniLayoutEditing` present/absent.

**H. Wire HtmlWidgetUtils into the component registry**

Register in the relevant `config/components/registry-*.js` and `config/components.js`.

**I. Replace duplicated utilities in HTML widget consumers**

In `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`: remove local `toFiniteNumber`, `trimText`, `escapeHtmlText`, `toStyleAttr`, `resolveShellRectFromTarget`, `resolveShellRect`, `resolveMode`, `isEditingMode`. Delegate to `Helpers.getModule("HtmlWidgetUtils")`.

In `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`: same removal, delegate.

In `shared/widget-kits/nav/MapZoomHtmlFit.js`: remove local `toFiniteNumber`, `resolveShellRect`. Delegate.

In `shared/widget-kits/nav/ActiveRouteHtmlFit.js`: remove local `toFiniteNumber`. Delegate.

**J. Deduplicate `loadScriptOnce`**

In `plugin.js`, after namespace bootstrap: `DyniPlugin.runtime.loadScriptOnce = loadScriptOnce`. In `component-loader.js`: `const loadScriptOnce = runtime.loadScriptOnce`. If load-order testing shows the namespace isn't ready at `component-loader.js` parse time, add explicit suppression instead.

**K. Bring `CanvasDomSurfaceAdapter.js` under 400 lines**

After perf extraction (~8 lines saved), extract `findDescendantByClass` (lines 36–53) — replace with `shellEl.querySelector(selector)` calls which already exist as fallbacks in `findSurfaceElement` and `findMountElement`. This removes the recursive tree walker entirely. Target: ≤395 lines after all Phase 1 changes.

**Touch:** `shared/widget-kits/perf/PerfSpanHelper.js` (created), `tests/shared/perf/PerfSpanHelper.test.js` (created), `shared/widget-kits/html/HtmlWidgetUtils.js` (created), `tests/shared/html/HtmlWidgetUtils.test.js` (created), `config/components/registry-shared-foundation.js` or equivalent (modified), `config/components.js` (modified), `cluster/ClusterWidget.js`, `cluster/rendering/ClusterRendererRouter.js`, `cluster/rendering/HtmlSurfaceController.js`, `cluster/rendering/CanvasDomSurfaceAdapter.js`, `runtime/HostCommitController.js`, `runtime/SurfaceSessionController.js`, `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`, `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`, `shared/widget-kits/nav/MapZoomHtmlFit.js`, `shared/widget-kits/nav/ActiveRouteHtmlFit.js`, `plugin.js`, `runtime/component-loader.js`.

**Test exit:** `npx vitest run` all tests pass. `node tools/check-patterns.mjs` reports no new warnings. `npm run check:all` passes including file-size check. `grep -rn "function startPerfSpan\|function endPerfSpan" cluster/ shared/` shows only one definition in `PerfSpanHelper.js` (plus explicitly suppressed runtime copies if Option B). `grep -rn "function toFiniteNumber\|function trimText\|function escapeHtml\|function toStyleAttr" widgets/text/ shared/widget-kits/` shows only one definition per function in `HtmlWidgetUtils.js`. `wc -l cluster/rendering/CanvasDomSurfaceAdapter.js` ≤ 400.

---

### Phase 2 — Fix ThemeResolver preset bug, deduplicate theme utilities, wire MapZoomHtmlFit

**Goal:** Close the CSS-variable preset timing gap (Problem 1), consolidate `getNightModeState` (Problem 2), consolidate `normalizePresetName` (Problem 10), wire MapZoomHtmlFit to ThemeResolver (Problem 5), and remove framework-method typeof guards on invalidation APIs (Problem 11).

**Dependencies:** Phase 1 must be complete (`MapZoomHtmlFit` was modified in Phase 1 for `toFiniteNumber`/`resolveShellRect` extraction; Phase 2 modifies it further).

**A. Fix `getActivePresetName` CSS variable fallback**

In `shared/theme/ThemeResolver.js`, modify `getActivePresetName(rootEl, presetDefs)`:

1. `const attr = rootEl.getAttribute("data-dyni-theme");`
2. If `attr !== null`: return `normalizePresetName(attr, presetDefs);` — DOM attribute wins.
3. Else: read `"--dyni-theme-preset"` from `getComputedStyle(rootEl)`.
4. If CSS value is a valid preset name: return it.
5. Else: return `"default"`.

This preserves the priority chain: DOM attribute (explicit runtime/init set) > CSS variable (`user.css`) > built-in default.

**B. Consolidate `normalizePresetName`**

Export a pure `normalizePresetName(presetName, presetNamesList)` function from `ThemePresets.js` on the module surface (`create.normalizePresetName`). `ThemeResolver.js` uses it with its resolved `presetDefs` keys. `runtime/init.js` uses it with `knownPresetNames()`. Remove the local implementations from ThemeResolver and init.js.

Since `runtime/init.js` is an IIFE and ThemePresets is loaded during `runInit()` before `normalizePresetName` is first called, the timing is safe — `ThemePresets` module is available via `byId.ThemePresets` or `DyniComponents.DyniThemePresets`.

**C. Export `getNightModeState` from ThemeResolver**

In `shared/theme/ThemeResolver.js`: export `getNightModeState` on `create.getNightModeState`. In `runtime/helpers.js`: after component loading, delegate to `DyniComponents.DyniThemeResolver.create.getNightModeState` if available. If the timing is unreliable (helpers is created before ThemeResolver loads), add `dyni-lint-disable-next-line duplicate-functions -- canonical source: ThemeResolver.js; helpers.js resolveTypography is called during component init before ThemeResolver may be loaded` suppression.

**D. Wire MapZoomHtmlFit to ThemeResolver**

In `shared/widget-kits/nav/MapZoomHtmlFit.js`: add `ThemeResolver` to `Depends` header. In `create(def, Helpers)`, resolve `ThemeResolver` and create an instance. In the `compute()` flow, read `tokens.font.weight` and `tokens.font.labelWeight` from `resolver.resolveForRoot(rootEl)`, matching the pattern in `ActiveRouteHtmlFit.js` (line 132). Remove `VALUE_WEIGHT` and `LABEL_WEIGHT` constants.

**E. Remove framework-method typeof guards on invalidation**

In `runtime/init.js` `invalidateThemeResolverCache()`: replace the two `typeof` checks with a direct `resolverMod.invalidateRoot(rootEl)` call. Add a null guard on `resolverMod` only (which is already present).

In `cluster/rendering/CanvasDomSurfaceAdapter.js` `callThemeInvalidation()`: replace the two `typeof` checks with a direct `themeResolver.invalidateRoot(targetRootEl)` call. `themeResolver` is resolved at `create` time via `Helpers.getModule("ThemeResolver")` — it is guaranteed to have `invalidateRoot`. Simplify or inline `callThemeInvalidation` since it becomes a one-liner.

**F. Add ThemeResolver preset-via-CSS tests**

In `tests/shared/theme/ThemeResolver.test.js`, add tests covering:
- `--dyni-theme-preset: bold` in computed style with no DOM attribute → preset `bold` is active
- DOM attribute `data-dyni-theme="slim"` with `--dyni-theme-preset: bold` → preset `slim` wins
- Neither attribute nor CSS variable → preset `"default"`
- Empty/invalid CSS variable value → preset `"default"`

**G. Add MapZoomHtmlFit font-weight-from-theme tests**

In `tests/shared/nav/MapZoomHtmlFit.test.js`: verify font weights come from ThemeResolver tokens and respond to preset changes (e.g., `slim` preset sets `font.labelWeight` to 400).

**Touch:** `shared/theme/ThemeResolver.js`, `shared/theme/ThemePresets.js`, `runtime/init.js`, `runtime/helpers.js`, `shared/widget-kits/nav/MapZoomHtmlFit.js`, `cluster/rendering/CanvasDomSurfaceAdapter.js`, `tests/shared/theme/ThemeResolver.test.js`, `tests/shared/nav/MapZoomHtmlFit.test.js`.

**Test exit:** `npx vitest run` all tests pass. `node tools/check-patterns.mjs` reports zero `hardcoded-runtime-default` and zero `framework-method-typeof-guard` regressions. `npm run check:all` passes. Manual test: set `--dyni-theme-preset: bold` in `user.css` scoped to `.widget.dyniplugin`, reload, confirm bold preset visuals appear. `grep -rn "VALUE_WEIGHT\|LABEL_WEIGHT" shared/widget-kits/nav/MapZoomHtmlFit.js` returns empty. `grep -rn "function normalizePresetName" --include="*.js" | grep -v test | grep -v node_modules` shows only `ThemePresets.js`.

---

### Phase 3 — Tighten runtime hot paths

**Goal:** Eliminate unnecessary recomputation in `TemporaryHostActionBridge` (Problem 7) and unnecessary allocation in `HostCommitController.getState()` (Problem 8).

**Dependencies:** None. These changes are internal to runtime files.

**A. Cache `computeCapabilities` at bridge create time**

In `runtime/TemporaryHostActionBridge.js`: compute capabilities once at `create()` time. Store as `cachedCapabilities`. Replace all `computeCapabilities()` callsites in facade methods with `cachedCapabilities`. Keep `getRoutePointsApi()` as a fresh probe only inside `routePoints.activate()` where the API presence is the live dispatch gate. `destroy()` nulls `cachedCapabilities` alongside `cachedFacade`.

**B. Cache `getState()` snapshot in HostCommitController**

In `runtime/HostCommitController.js`: add a `cachedStateSnapshot` variable. Rebuild it in the three mutation methods: `initState`, `recordRender`, `commitIfReady`. Have `getState()` return `cachedStateSnapshot` directly. This eliminates a 10-property object allocation on every `renderHtml` cycle.

Do not freeze the snapshot — downstream consumers may store references.

**C. Add tests**

In `tests/runtime/TemporaryHostActionBridge.test.js`: verify capabilities are computed once at create time; `routePoints.activate` still probes the live API; `destroy()` invalidates cached state.

In `tests/runtime/HostCommitController.test.js`: verify `getState()` returns the same object reference between mutations; the snapshot updates after `recordRender`, `commitIfReady`, `initState`.

**Touch:** `runtime/TemporaryHostActionBridge.js`, `runtime/HostCommitController.js`, `tests/runtime/TemporaryHostActionBridge.test.js`, `tests/runtime/HostCommitController.test.js`.

**Test exit:** `npx vitest run` all tests pass. `npm run check:all` passes. `grep -n "computeCapabilities()" runtime/TemporaryHostActionBridge.js` shows only one call site (at create time).

---

### Phase 4 — Scope MutationObserver fallback

**Goal:** Reduce the blast radius of the `MutationObserver` fallback in `HostCommitController` (Problem 6).

**Dependencies:** Phase 3 should be complete (Phase 3 modified `HostCommitController.js`; Phase 4 modifies it further).

**A. Increase RAF budget**

In `runtime/HostCommitController.js` `scheduleRafAttempt()`: change the recursion guard from `if (attempt < 2)` to `if (attempt < 4)`. Four RAF attempts cover the typical AvNav React commit timing without needing the observer fallback.

**B. Add timeout ceiling to observer**

In `installDeferredObservers()`: after creating the observer, schedule a ceiling timer (2000ms) that disconnects the observer and calls `clearPendingState` with status `"timeout-ceiling"` if the shell element has not been found. Store the ceiling handle and clean it up in `clearAsyncHandles()` / `clearTimeoutHandle()`.

**C. Scope observer if possible**

If the `instanceId` or parent container selector is available at schedule time, observe the nearest known ancestor instead of `document.body`. If the parent is not reliably known at observer-install time, keep `document.body` but document the ceiling as the primary mitigation.

**D. Add tests**

In `tests/runtime/HostCommitController.test.js`: verify 4 RAF attempts before observer fallback; observer disconnects after ceiling timeout; observer disconnects on successful commit; stale revision abandons observer.

**Touch:** `runtime/HostCommitController.js`, `tests/runtime/HostCommitController.test.js`.

**Test exit:** `npx vitest run` all tests pass. `npm run check:all` passes. `grep -n "attempt < " runtime/HostCommitController.js` confirms budget is 4. `grep -n "subtree: true" runtime/HostCommitController.js` — if present, verify a ceiling timer accompanies it.

---

### Phase 5 — Documentation update

**Goal:** Update runtime lifecycle documentation, architecture docs, and guides to reflect all changes from Phases 1–4 and the lifecycle analysis performed during this plan's investigation.

**Dependencies:** All previous phases must be complete. This phase is documentation only.

**Scope boundary:** Do not change any source code. If you discover a source code inconsistency while reviewing docs, note it as a TECH-DEBT item rather than fixing it here.

**A. `documentation/architecture/runtime-lifecycle.md`**

This file already exists and documents the runtime lifecycle. Extend and correct it:

1. Update the Bootstrap Flow section to note the `loadScriptOnce` deduplication (if implemented) or suppression status.
2. Update Init Flow to document the CSS-variable preset fallback in ThemeResolver — remove the "Known gap" paragraph and replace with the corrected behavior.
3. Update Host Commit Scheduling to reflect the 4-attempt RAF budget and the timeout ceiling.
4. Add a section on paint coalescing within CanvasDomSurfaceAdapter (dirty flag mechanics: `paintDirty`, `sizeDirty`, `themeDirty`).
5. Add a section documenting the handler pre-bind / rebind lifecycle for HTML surface renderers, noting that every render cycle binds handlers twice (pre-bind in `renderSurfaceShell` + rebind in `update`).
6. Update TemporaryHostActionBridge dispatch chain to note capabilities caching.
7. Update Theme Preset Resolution to document the render-time CSS-variable fallback in `getActivePresetName` and the consolidation of `normalizePresetName` into ThemePresets.
8. Add a section on `resizeSignature` recomputation cost — document that both HTML widgets recompute the full model in `resizeSignature`, which duplicates the model computation from `renderHtml`.
9. Add a section on known performance characteristics: cached capabilities, cached `getState` snapshot, paint coalescing, and the observer ceiling.

**B. `documentation/architecture/host-commit-controller.md`**

1. Update the deferred commit sequence diagram to show 4 RAF attempts instead of 2.
2. Document the MutationObserver timeout ceiling (2000ms).
3. Document the `getState()` snapshot caching behavior.

**C. `documentation/architecture/surface-session-controller.md`**

1. Review and verify all lifecycle transitions match the current code after Phase 3 changes.

**D. `documentation/architecture/canvas-dom-surface-adapter.md`**

1. Document the removal of `findDescendantByClass` in favor of `querySelector`.
2. Document the removal of `callThemeInvalidation` typeof guards.
3. Verify file-size compliance is documented.

**E. `documentation/shared/theme-tokens.md`**

1. Update "Runtime Integration" section to document the CSS-variable fallback in `getActivePresetName`.
2. Update the preset source precedence list to show the corrected render-time behavior:
   - DOM attribute `data-dyni-theme` (set by runtime/init or console)
   - CSS variable `--dyni-theme-preset` (set by `user.css`)
   - Built-in `"default"`
3. Remove or update the "Known gap" language about CSS presets not working.
4. Document the `normalizePresetName` consolidation into ThemePresets.
5. Document the `getNightModeState` export from ThemeResolver.

**F. `documentation/shared/helpers.md`**

1. Document the `getNightModeState` delegation to ThemeResolver (or suppression status).

**G. `documentation/conventions/coding-standards.md`**

1. Add `PerfSpanHelper` and `HtmlWidgetUtils` to the Shared Utilities list.
2. Update Reference Implementations if any new modules serve as canonical examples.

**H. `documentation/conventions/smell-prevention.md`**

1. Verify the `duplicate-functions` and `duplicate-block-clones` fix playbooks cover the extraction patterns used in Phase 1.
2. If new suppressions were added in runtime files, document the suppression rationale pattern for runtime IIFE files.

**I. `documentation/guides/add-new-html-kind.md`**

1. Update to reference `HtmlWidgetUtils` for shared utility functions.
2. Note that HTML widget utility functions (`toFiniteNumber`, `escapeHtml`, `resolveShellRect`, etc.) must come from `HtmlWidgetUtils`, not be duplicated locally.

**J. `documentation/TABLEOFCONTENTS.md`**

1. Add entries for `PerfSpanHelper` and `HtmlWidgetUtils` modules.
2. Add or verify entries for the extended runtime-lifecycle documentation.
3. Verify all existing links still resolve.

**K. `documentation/TECH-DEBT.md`**

1. Note `resizeSignature` model recomputation as a known performance cost — both HTML widgets recompute the full render model for signature comparison, duplicating the work done in `renderHtml`. This is not addressed in this plan but should be tracked for future optimization.
2. Note handler double-binding as a known lifecycle cost.
3. Note `SurfaceSessionController.getState()` has the same shallow-copy pattern as `HostCommitController.getState()` but is called less frequently — track for consistency cleanup if desired.

**L. `documentation/QUALITY.md`**

1. Update the quality scorecard to reflect the post-Phase-4 gate state.

**M. Remove implementation-plan phase references from docs**

In all documentation files: if any docs reference PLAN4 phases or steps, replace those references with standalone descriptions that do not depend on the plan. Documentation must be self-contained.

**Touch:** `documentation/architecture/runtime-lifecycle.md`, `documentation/architecture/host-commit-controller.md`, `documentation/architecture/surface-session-controller.md`, `documentation/architecture/canvas-dom-surface-adapter.md`, `documentation/shared/theme-tokens.md`, `documentation/shared/helpers.md`, `documentation/conventions/coding-standards.md`, `documentation/conventions/smell-prevention.md`, `documentation/guides/add-new-html-kind.md`, `documentation/TABLEOFCONTENTS.md`, `documentation/TECH-DEBT.md`, `documentation/QUALITY.md`.

**Test exit:** `npm run check:all` passes (including `check:docs` and `check:doc-reachability` if they exist). All internal documentation cross-references resolve. `grep -rn "PLAN4\|Phase [0-9]" documentation/` returns no dangling plan references. The TABLEOFCONTENTS.md index covers every module and documentation page.

---

## Affected File Map

| File | Phase | Change |
|---|---|---|
| `shared/widget-kits/perf/PerfSpanHelper.js` | 1 | Created |
| `tests/shared/perf/PerfSpanHelper.test.js` | 1 | Created |
| `shared/widget-kits/html/HtmlWidgetUtils.js` | 1 | Created |
| `tests/shared/html/HtmlWidgetUtils.test.js` | 1 | Created |
| `config/components/registry-shared-foundation.js` | 1 | Register new modules |
| `config/components.js` | 1 | Register new modules |
| `cluster/ClusterWidget.js` | 1 | Replace local perf block with PerfSpanHelper |
| `cluster/rendering/ClusterRendererRouter.js` | 1 | Replace local perf block with PerfSpanHelper |
| `cluster/rendering/HtmlSurfaceController.js` | 1 | Replace local perf block with PerfSpanHelper |
| `cluster/rendering/CanvasDomSurfaceAdapter.js` | 1, 2 | Replace perf block, remove findDescendantByClass, remove typeof guards |
| `runtime/HostCommitController.js` | 1, 3, 4 | Perf wiring, cached getState, RAF budget, observer ceiling |
| `runtime/SurfaceSessionController.js` | 1 | Perf wiring |
| `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` | 1 | Replace local utilities with HtmlWidgetUtils |
| `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js` | 1 | Replace local utilities with HtmlWidgetUtils |
| `shared/widget-kits/nav/MapZoomHtmlFit.js` | 1, 2 | Replace local utilities, wire ThemeResolver |
| `shared/widget-kits/nav/ActiveRouteHtmlFit.js` | 1 | Replace local toFiniteNumber |
| `plugin.js` | 1 | Expose loadScriptOnce on namespace |
| `runtime/component-loader.js` | 1 | Reuse namespace loadScriptOnce |
| `shared/theme/ThemeResolver.js` | 2 | CSS-variable fallback, export getNightModeState, delegate normalizePresetName |
| `shared/theme/ThemePresets.js` | 2 | Export normalizePresetName on module surface |
| `runtime/init.js` | 2 | Delegate normalizePresetName, remove typeof guards |
| `runtime/helpers.js` | 2 | Delegate getNightModeState |
| `runtime/TemporaryHostActionBridge.js` | 3 | Cache computeCapabilities |
| `tests/shared/theme/ThemeResolver.test.js` | 2 | CSS-variable preset tests |
| `tests/shared/nav/MapZoomHtmlFit.test.js` | 2 | Font-weight-from-theme tests |
| `tests/runtime/TemporaryHostActionBridge.test.js` | 3 | Caching tests |
| `tests/runtime/HostCommitController.test.js` | 3, 4 | Snapshot caching, RAF budget, ceiling tests |
| `documentation/architecture/runtime-lifecycle.md` | 5 | Extend with lifecycle analysis findings |
| `documentation/architecture/host-commit-controller.md` | 5 | RAF budget, ceiling, snapshot caching |
| `documentation/architecture/surface-session-controller.md` | 5 | Review |
| `documentation/architecture/canvas-dom-surface-adapter.md` | 5 | Remove findDescendantByClass, typeof guard docs |
| `documentation/shared/theme-tokens.md` | 5 | CSS-variable fallback, normalizePresetName, getNightModeState |
| `documentation/shared/helpers.md` | 5 | getNightModeState delegation |
| `documentation/conventions/coding-standards.md` | 5 | Add PerfSpanHelper, HtmlWidgetUtils to shared utilities |
| `documentation/conventions/smell-prevention.md` | 5 | Verify playbooks |
| `documentation/guides/add-new-html-kind.md` | 5 | Reference HtmlWidgetUtils |
| `documentation/TABLEOFCONTENTS.md` | 5 | Add new module entries |
| `documentation/TECH-DEBT.md` | 5 | Track resizeSignature cost, handler double-bind, SurfaceSessionController.getState |
| `documentation/QUALITY.md` | 5 | Update scorecard |

---

## Don'ts

- **Don't change the AvNav host registration path.** The `renderHtml` host path is stable and correct. This plan cleans internals only.

- **Don't add ES module imports to any file.** All files remain UMD or IIFE.

- **Don't add a bundler or build step.**

- **Don't make runtime IIFE files depend on `Helpers.getModule()`.** Use namespace-attached utilities or explicit lint suppressions.

- **Don't break the theme priority chain.** Per-token: CSS override > preset value > built-in default. Preset name: DOM attribute > CSS variable > built-in default.

- **Don't remove the MutationObserver fallback entirely.** It handles a real edge case. The plan scopes and ceilings it; it does not eliminate it.

- **Don't cache capabilities across bridge instances.** Each `create()` call computes its own capabilities. The cache is per-instance, invalidated by `destroy()`.

- **Don't freeze the `getState()` snapshot.** Downstream consumers may store references; freezing could break subtle patterns.

- **Don't modify `config/clusters/*.js` config definitions.** Config is stable and out of scope.

- **Don't touch canvas-only widgets** (radial/linear gauges) unless they share code with in-scope modules.

- **Don't exceed 400 lines per JS file.** New modules must be well under budget. Monitor consumer files after extraction.

- **Don't change source code in Phase 5.** Documentation only. Note any code inconsistencies as TECH-DEBT items.

---

## Deployment Boundaries

| Deployable unit | Phases | Rationale |
|---|---|---|
| Shared utility extraction | 1 | Safe: purely additive modules + consumer rewiring. All existing behavior preserved. |
| Theme lifecycle fixes | 2 | Must follow Phase 1 (shared file overlap). Fixes a user-facing bug (preset via CSS). |
| Runtime hot-path optimization | 3 | Independent of Phases 1–2. Internal performance improvement. |
| Observer scoping | 4 | Must follow Phase 3 (same file). Internal resilience improvement. |
| Documentation | 5 | Must follow all code phases. No code changes. |

---

## Acceptance Criteria

### Shared Utilities

- `PerfSpanHelper` is the single owner of perf-hook wiring. No file outside `PerfSpanHelper.js` and explicitly suppressed runtime IIFEs defines `startPerfSpan` or `endPerfSpan`.

- `HtmlWidgetUtils` is the single owner of HTML widget utility functions. No file outside `HtmlWidgetUtils.js` defines `toFiniteNumber`, `trimText`, `escapeHtml`, `toStyleAttr`, `resolveShellRect`, `resolveMode`, or `isEditingMode`.

- `loadScriptOnce` exists once in `plugin.js` and is reused by `component-loader.js` (or explicitly suppressed).

- `CanvasDomSurfaceAdapter.js` is ≤400 lines.

### Theme Lifecycle

- Setting `--dyni-theme-preset: bold` in `user.css` scoped to `.widget.dyniplugin` produces bold preset visuals. This is verified by automated tests and manual testing.

- `normalizePresetName` exists once in `ThemePresets.js`. `ThemeResolver.js` and `runtime/init.js` delegate to it.

- `getNightModeState` has a canonical implementation in `ThemeResolver`. `helpers.js` delegates or carries an explicit suppression.

- `MapZoomHtmlFit` reads font weights from ThemeResolver tokens. Changing `--dyni-font-weight: 400` in CSS affects MapZoom widget text weight.

- No `typeof resolverMod.invalidateRoot === "function"` guards remain in `runtime/init.js` or `CanvasDomSurfaceAdapter.js` after Phase 2.

### Runtime Hot Paths

- `TemporaryHostActionBridge` computes capabilities once at `create()` time. `detectPageId` is not called on every action dispatch.

- `HostCommitController.getState()` returns a cached snapshot that is only rebuilt on state mutations.

### Observer Resilience

- `HostCommitController` makes 4 RAF attempts before falling back to `MutationObserver`.

- The `MutationObserver` disconnects after a 2000ms ceiling if the shell element is never found.

### Documentation

- `documentation/architecture/runtime-lifecycle.md` accurately describes all lifecycle and flow paths as they exist after Phase 4.

- `documentation/shared/theme-tokens.md` documents the corrected preset resolution behavior.

- `documentation/TABLEOFCONTENTS.md` includes entries for `PerfSpanHelper` and `HtmlWidgetUtils`.

- No documentation file references PLAN4 phases or steps.

---

## Related

- [PLAN1.md](PLAN1.md) — Original renderHtml architecture plan that introduced the infrastructure this plan cleans
- [PLAN3.md](PLAN3.md) — Atomicity linter cleanup that established smell-rule severity model
- [core-principles.md](../../documentation/core-principles.md) — Principles #1, #4, #5, #8, #15, #16, #17, #18
- [coding-standards.md](../../documentation/conventions/coding-standards.md) — UMD template, file-size limits, shared-utility rules
- [smell-prevention.md](../../documentation/conventions/smell-prevention.md) — `duplicate-functions`, `duplicate-block-clones`, `hardcoded-runtime-default`, `framework-method-typeof-guard`
- [theme-tokens.md](../../documentation/shared/theme-tokens.md) — ThemeResolver API, preset system, runtime integration
- [runtime-lifecycle.md](../../documentation/architecture/runtime-lifecycle.md) — Lifecycle reference to be extended in Phase 5
- [host-commit-controller.md](../../documentation/architecture/host-commit-controller.md) — Commit scheduling architecture
- [surface-session-controller.md](../../documentation/architecture/surface-session-controller.md) — Surface lifecycle state machine
- [canvas-dom-surface-adapter.md](../../documentation/architecture/canvas-dom-surface-adapter.md) — Canvas-DOM adapter architecture
