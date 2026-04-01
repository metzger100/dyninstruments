# PLAN1 — Rebuilding the Nav Cluster on an HTML Host with Internal Surfaces

## Status

Architecture plan for the first robust introduction of `renderHtml` in the existing Nav cluster under AvNav.

---

## Goal

The plugin is to receive a clean foundation for additional `renderHtml` widgets without abandoning the existing cluster concept.

Binding target architecture:

- There remains **one visible Nav cluster widget**: `dyni_Nav_Instruments`.

- On the AvNav side, this widget is registered **purely as a `renderHtml` widget**.

- Inside the widget, there are two internal surfaces: `html` and `canvas-dom`.

- `activeRouteInteractive` becomes the first native HTML child.

- Existing canvas children remain for now, but are rendered internally through `canvas-dom`.

- Root, theme, and shell infrastructure are decoupled from canvas and built root-first.

- The HTML host path keeps AvNav's established `.widgetData` wrapper convention as the first plugin-owned container returned by `renderHtml`, for compatibility with existing AvNav/plugin patterns.

- Head hiding is applied **globally** for this widget for now, not per `kind`.

---

## Hard Constraints from AvNav and the Current Plugin

### AvNav Host

AvNav decides at the level of the registered widget definition:

- If `renderCanvas` exists, the host creates a canvas node.

- If `renderCanvas` is missing, there is no host canvas and no host canvas path.

- `initFunction` is called **synchronously inside the React render body** of `ExternalWidget.jsx` — not in a lifecycle hook and not before render, but as part of the first render pass. At that time, no DOM exists for the widget.

- `renderHtml` is called immediately afterward in the same synchronous render pass.

- For `renderHtml`-only widgets, there is no plugin-side post-mount hook.

- In hybrid widgets, `renderCanvas` is called after **every** React render (via `useEffect` without a dependency array). If `renderCanvas` is no longer registered, this specific post-render hook disappears. **However:** `renderHtml` is still called synchronously in the render body on **every** React re-render (triggered by store key changes or `triggerRedraw()` / `triggerResize()`). The `canvas-dom` adapter therefore receives current props on every re-render via `renderHtml` and can schedule a canvas repaint there through prop comparison — a completely separate trigger mechanism is not required.

Consequence:

- Under AvNav, a widget can only truly be HTML-only if the registered definition has **no** `renderCanvas`.

- For HTML widgets, the plugin keeps AvNav's established `.widgetData` wrapper convention as the first plugin-owned wrapper returned by `renderHtml` (also consistent with the example plugins), even though no host canvas exists. This is a compatibility convention, not a hard host requirement.

- Root, theme, and surface bindings must not depend on a host canvas or a host post-render hook.

- The `canvas-dom` adapter uses the `renderHtml` call AvNav still provides as a redraw trigger: prop comparison in the `renderHtml` path, and on change schedule a canvas repaint via `requestAnimationFrame`. `this.triggerRedraw()` remains available on the context and still works without `renderCanvas`.

### AvNav Interaction and the `eventHandler` Mechanism

On `GpsPage`, widget clicks normally bubble back to the host through `onItemClick`.

AvNav's `UserHtml.tsx` intercepts `on*` attributes and automatically calls `stopPropagation()` and `preventDefault()` for **every registered handler**. **However:** only elements with an `on*` attribute matching a registered `eventHandler` name are intercepted. Empty areas between buttons or elements without handlers are **not** isolated.

Consequence:

- Interactive HTML areas must register an `onclick` handler on the **outermost wrapper** (for example `onclick="catchAll"`) so that clicks on empty space are also consumed.

- `catchAll` is **not** a built-in AvNav facility, but an **explicitly registered `eventHandler`** of the plugin, which must be assigned in `initFunction` to `context.eventHandler.catchAll`.

- Other named control handlers are **not** treated as global widget infrastructure in this architecture. They belong to the active `html` surface session and are attached and removed by the `html` surface controller on `attach` / `detach` / `destroy`. This is an internal lifecycle rule of the plugin architecture, not an AvNav host requirement. `initFunction` therefore does not permanently bind surface-specific closures that outlive the active HTML surface.

- **Implementation detail:** AvNav initializes `eventHandler` in `ExternalWidget.jsx` as an **empty array** (`[]`), not as an object. Assigning named properties (`this.eventHandler.catchAll = fn`) works because JavaScript arrays are objects — but this is not an official API contract. This assumption is established in the testPlugin example and is functionally stable, but should remain documented as an AvNav implementation detail.

- Host action dispatch is separate from this and is only an optional second axis.

- `TemporaryHostActionBridge` does not replace bubble blocking.

### AvNav Resize and Canvas Hosting

AvNav's `WidgetBase.jsx` applies `ResizeFrame` only when `mode === 'gps'`. `ResizeFrame` wraps **all children** of the widget — including the entire `UserHtml` output — in a `.resize` container and dynamically scales its `font-size` as a percentage via `GuiHelpers.resizeElementFont()`. This also affects the plugin’s own HTML shell and the internal canvas container inside it.

Consequence:

- AvNav's `ResizeFrame` also affects the plugin’s HTML shell — through cascading font-size scaling. The `canvas-dom` adapter and its shell containers must isolate themselves from this: the canvas surface wrapper must set `font-size: initial` so that the percentage scaling from `ResizeFrame` does not affect canvas sizing or layout calculations.

- The `canvas-dom` adapter must still implement its own sizing logic (`ResizeObserver` or size signature check), because `ResizeFrame` only performs font scaling, not canvas buffer sizing.

### Current Dyni Plugin

The current cluster path is hybrid on the host side:

- `cluster/ClusterWidget.js` always exposes `renderHtml` and `renderCanvas`.

- `runtime/widget-registrar.js` registers these hooks statically.

- `runtime/init.js` and parts of the theme infrastructure are still canvas-centric (`canvas.widgetData` discovery).

---

## Architecture Decision

**A single visible `dyni_Nav_Instruments` remains, but is converted on the host side into a pure `renderHtml` widget.**

The previous host hybrid model is removed. Instead, the render split is introduced **inside the plugin runtime system**:

- Host surface: always `html`

- Internal widget surface per `kind`: `html` or `canvas-dom`

### Alternative Not Chosen: Dual Host Architecture

Two separate AvNav registrations (`ClusterCanvasHostWidget` / `ClusterHtmlHostWidget`) would break the visible cluster concept apart. This remains only as a documented fallback option.

---

## Architectural Principles

### 1. One Visible Cluster, One Host Type

`dyni_Nav_Instruments` will in future be registered with exactly these host functions: `translateFunction`, `renderHtml`, `initFunction`, `finalizeFunction`. It will **no longer** be registered with `renderCanvas`.

The first plugin-owned DOM node returned by `renderHtml` remains AvNav-compatible and therefore keeps the `widgetData` class as a compatibility convention.

### 2. Domain `kind` Remains Domain-Level

`kind` remains the domain axis (`eta`, `rteEta`, `dst`, `activeRoute`, `activeRouteInteractive`, etc.). `activeRouteInteractive` is an independent `kind` — not an alias, not a UI variant, not a toggle flag.

### 3. Surface Is Its Own Architectural Axis

Each entry explicitly defines a surface (`surface: "html"` or `surface: "canvas-dom"`). This surface controls: renderer family, shell wrapper structure, lifecycle and redraw logic, CSS classes, and data attributes.

### 4. Shared Domain Logic, Separate Renderers

`activeRoute` and `activeRouteInteractive` share only the domain view model (`routeName`, `disconnect`, `display.remain`, `display.eta`, `display.nextCourse`, `display.isApproaching`, `captions`, `units`). They do **not** share rendering logic.

### 5. Root Is Always `.widget.dyniplugin`

No longer architecturally load-bearing: `[data-dyni]`, `canvas.widgetData` as the root anchor. `[data-dyni]` may temporarily remain as a compatibility trail, but Phase 1 removes all runtime-critical dependencies on these legacy anchors.

Host-related markers (`dyni-host-html`, optional head-hiding marker) are provided **statically** through the registered widget definition or `WidgetFrame` classes, not written onto the root later in a local commit.

### 6. Theme Is Root-First

Theme resolution, preset application, and token provision are anchored at the widget root, no longer through canvas.

Important: this applies to the **entire style resolution**. `ThemeResolver` and the canvas-adjacent typography/color helpers must be converted to the same root/token contract so that `renderCanvas` and `renderHtml` do not create separate style realities.

### 7. Renderers Do Not Manipulate the Host Root

Renderers provide only their inner content. Root lookup, root classes, theme application, and host shell control belong to registration and runtime.

### 8. Root Commit Is a Separate Runtime Step

Because AvNav provides no plugin post-mount hook for `renderHtml`-only widgets, the root is not established implicitly through the renderer or through `initFunction`. Instead: `initFunction` creates only instance state; `renderHtml` returns a stable shell with instance marking; the runtime then schedules a **local commit step per widget instance**.

### 8a. Shell Stability Is Surface-Specific

**Hard constraint:** AvNav's `ExternalWidget.jsx` passes the HTML string returned by `renderHtml` into `ReactHtmlParser`, which creates new React elements on every call. For `canvas-dom`, the canvas mount subtree must therefore not become unstable during normal data updates, otherwise canvas nodes, context, and cached DOM references are lost.

Consequence: **what must remain stable is the shell of a surface session, not necessarily the entire inner HTML content.**

- For **`canvas-dom`**, the shell/mount subtree returned by `renderHtml` remains structurally identical for the same surface session. Mutable data (current props, revision, dirty state) does **not** flow into the HTML string there, but exclusively into JavaScript controller state; repaints run through the controller.

- For **`html`**, only the outer shell frame remains stable. The inner content may change normally between re-renders with the props; `renderHtml` remains the regular declarative update path there.

### 9. Surface Switching Is an Explicit Lifecycle

Surface switches fully destroy old surface bindings. Remounts of the same surface are treated as reattach. Asynchronous work is protected by revision checks.

### 10. Interactive HTML Widgets: Host Contract

Interactive HTML widgets use: string-based `renderHtml`, `this.eventHandler`, and an **explicitly registered** `catchAll` handler on the wrapper of the interactive area.

### 11. Host Action Dispatch Is Separate from Bubble Blocking

Interaction consumption and host action dispatch are two separate axes. `TemporaryHostActionBridge` is only an optional dispatch facade.

---

## Target Architecture

### A. Registered Host

`dyni_Nav_Instruments` contains: `renderHtml`, `translateFunction`, `initFunction`, `finalizeFunction`. **Not:** `renderCanvas`. AvNav creates no host canvas.

### B. Internal Surface Layer

- **`html`**: for native HTML widgets (for example `activeRouteInteractive`).

- **`canvas-dom`**: for existing canvas widgets. Canvas is no longer provided by AvNav, but by the plugin’s own HTML shell.

### C. Cluster Shell

`ClusterWidget` becomes an HTML host shell. Responsibilities: cluster entry point, `translateFunction`, surface selection, shell markup via `renderHtml`, stable mount target for `canvas-dom`, local commit step, registration/update/cleanup of internal surface controllers.

Shell structure (illustrative):

- `.widget.dyniplugin` as host root; static host markers such as `dyni-host-html` and optional head hiding come from the registered widget definition / `WidgetFrame` class, not from the commit

- `.widgetData.dyni-shell` as the first plugin-owned node returned by `renderHtml`, with `data-dyni-instance`, `data-dyni-surface`

- Surface classes: `.dyni-surface-html` or `.dyni-surface-canvas`

- Kind classes: `.dyni-kind-activeRouteInteractive`

**Important (Principle 8a):** `data-dyni-surface` and `data-dyni-instance` remain stable for the lifetime of a surface session. For `canvas-dom`, the shell/mount subtree additionally remains structurally identical; mutable data such as revision or current props is **not** written into the HTML string there, but managed through JavaScript instance state. For `html`, the inner content from `renderHtml` may change normally with the props. On surface switches, a DOM rebuild is expected and accepted.

Root classes remain static and host-related. Runtime states belong on the `.widgetData.dyni-shell` wrapper and its descendants.

### D. Kind Catalog / Surface Catalog

Central spec with minimum content per entry: `kind`, `viewModelId`, `rendererId`, `surface`. Example:

```js
{ kind: "activeRoute", viewModelId: "ActiveRouteViewModel",
  rendererId: "ActiveRouteTextWidget", surface: "canvas-dom" }
{ kind: "activeRouteInteractive", viewModelId: "ActiveRouteViewModel",
  rendererId: "ActiveRouteTextHtmlWidget", surface: "html" }
```

Binding rule: this spec is the single source of truth. Head hiding is **not** a per-`kind` property. `wantsHideNativeHead` is applied host-wide / globally.

### E. View Model Layer

Shared `ActiveRouteViewModel` (`cluster/viewmodels/ActiveRouteViewModel.js`): normalize data, derive disconnect state, prepare route/distance/ETA/course/states, deliver caption and unit contracts. No HTML markup, no canvas drawing.

### F. Renderer Families

**1. Native HTML renderers** (for example `ActiveRouteTextHtmlWidget`): HTML for the surface wrapper, interaction markup, token consumption. Interaction contract: string-based `renderHtml`, handlers through `this.eventHandler`, `onclick="catchAll"` on the wrapper (where `catchAll` is an **explicitly registered eventHandler**, not an AvNav built-in). Controls use named handlers that are owned by the active `html` surface controller, not by one-time global init state. Host action dispatch is optional via a runtime facade.

**2. Canvas DOM adapter** (for example `CanvasDomSurfaceAdapter(ActiveRouteTextWidget)`): stable mount point and internal canvas, drive existing canvas renderers, **prop comparison in `renderHtml`** as redraw trigger (AvNav calls `renderHtml` on every re-render), **own sizing logic** (`ResizeObserver` for canvas buffer sizing, `font-size: initial` on the canvas surface wrapper for isolation from AvNav's `ResizeFrame` cascade), clear **fill contract** between `.dyni-surface-canvas` and internal canvas as a replacement for the previous host canvas contract, bind/dirty flags, cleanup.

### G. Runtime / Surface Controller

Two small, explicit building blocks per widget instance:

#### 1. HostCommitController

Reason: `initFunction` runs synchronously in the React render body (no DOM), and `renderHtml`-only has no post-mount hook.

**Init phase:** `initFunction` creates only local instance state: `instanceId`, `renderRevision`, `mountedRevision`, references for `rootEl` / `shellEl`, commit status, scheduled commit handle, reference to the active surface controller, last `props` snapshot. No DOM access.

**HTML phase:** `renderHtml` returns a stable shell whose first plugin-owned node is `.widgetData.dyni-shell`, with `data-dyni-instance`, `data-dyni-surface`, and inner surface wrapper. For `canvas-dom`, the shell/mount subtree remains structurally identical (Principle 8a); mutable data (props, revision) is managed through JavaScript instance state, not in the markup. For `html`, the inner content may change normally with the props. Stores the latest `props` on `this` and increments the internal revision in instance state.

**Deferred commit after HTML mount:** after each `renderHtml`, exactly one local commit is scheduled.

Primary strategy: `requestAnimationFrame` — React mounts the HTML string returned by `renderHtml` synchronously in the same render cycle; an `rAF` callback then runs reliably after the DOM exists. Fallback: `MutationObserver` on `document.body` with `subtree: true`, waiting for the appearance of its own `data-dyni-instance` selector (expensive, only if `rAF` still finds no mount after 2 attempts). `setTimeout(..., 0)` only as a last fallback. Both `MutationObserver` and `rAF` retries are cleaned up immediately after a successful commit.

Reason for `requestAnimationFrame` as the primary strategy: at the time of setup, `MutationObserver` would need a DOM reference to a stable parent container. After `renderHtml` (pure string return), no such reference exists — an observer would have to watch `document.body` with `subtree: true`, which is disproportionately expensive.

Task of the commit step: find the shell via `data-dyni-instance`, determine the root via `.closest(".widget.dyniplugin")`, only verify static host markers, materialize theme/preset, cache references, then attach or update the surface controller.

Important: no global DOM registry, no global scan infrastructure. Only local commit per instance.

#### 2. SurfaceSessionController

Reason: AvNav keeps the widget instance even if `kind`, surface, or shell changes.

Instance state: `desiredSurface`, `mountedSurface`, `surfaceRevision`, `activeController`, `lastProps`.

Each surface implements: `attach({ rootEl, shellEl, props, revision })`, `update({ rootEl, shellEl, props, revision })`, `detach(reason)`, `destroy()`.

Switching logic — three cases:

- **same surface, same shell:** `update`

- **same surface, new shell or remount:** `detach("remount")` → `attach(...)`

- **different surface:** detach old controller with `detach("surface-switch")`, clear references, attach new controller

Asynchronous protection: every delayed task carries the current revision. Stale work is discarded.

#### 3. Surface-Specific Details

**`html` controller:** shell references, optional local state, optional bound host action facade, lifecycle ownership of all named control `eventHandler` registrations except the global `catchAll`, and cleanup for its own listeners/timers. On `attach`, it binds only the handlers needed by the active HTML surface; on `detach` / `destroy`, it removes them again. In addition, the controller maintains a small `resizeSignature(props)` for layout-relevant HTML content; on signature change, `triggerResize()` is fired exactly once.

**`canvas-dom` controller:** reference to internal canvas, bind/dirty flags, **prop comparison in `renderHtml`** as redraw trigger (AvNav still calls `renderHtml` on every re-render — the controller compares props and schedules a canvas repaint via `requestAnimationFrame` on change), **its own `ResizeObserver`** for canvas buffer sizing (AvNav's `ResizeFrame` only performs font scaling), **`font-size: initial`** on the canvas surface wrapper (isolation against `ResizeFrame` cascade), explicit fill contract of the surface wrapper for the internal canvas, DPI/size logic through `Helpers.setupCanvas(canvas)` or an equivalent local helper. Theme/preset changes explicitly invalidate the controller and force a repaint even without prop changes.

#### 4. Redraw and Rebind Triggers

- new props after `renderHtml` runs again (via prop comparison in the controller)

- new or remounted internal canvas

- size changes (own `ResizeObserver`)

- theme/preset changes (`html`: for layout-relevant HTML via `resizeSignature` + `triggerResize()`, `canvas-dom`: explicit theme invalidation with repaint)

- explicit invalidation

No generic global observer system. Local mechanism per instance.

#### 5. Finalize Phase

`finalizeFunction` performs cleanup: cancel scheduled commits, clear timers / RAF / MutationObserver / ResizeObserver, discard DOM references, reset dirty/bind state, call `destroy()` on the active surface controller, optionally invoke a wrapped `finalizeFunction` from the canvas renderer.

---

## Theme and Root Model

### 1. Static Root Contract

The widget root is always `.widget.dyniplugin`. Host-related classes such as `dyni-host-html` and, if enabled, `dyni-hide-native-head` are established statically through the registered widget definition or `WidgetFrame` classes. The first plugin-owned node returned by `renderHtml` remains `.widgetData.dyni-shell` and carries only instance-, surface-, and kind-local state such as `data-dyni-instance`, `data-dyni-surface`, and `dyni-kind-*`.

Root identity is therefore a registration concern, not a renderer concern and not a commit-time mutation concern. Renderers do not write host markers onto the root. The local commit step only resolves `rootEl` and `shellEl`, verifies the static host contract, and binds the active surface session to that root/shell pair.

### 2. Theme Is Root-First

Theme resolution, preset application, and token materialization are anchored at the widget root. `ThemeResolver` therefore exposes a root-first path (`resolveForRoot(rootEl)`) as the primary API. Any canvas-based entry point remains only an adapter path that resolves its owning root and then uses the same token contract.

This rule applies to the entire style system, not only to high-level theme selection. `runtime/helpers.js`, including typography and color helpers such as `resolveTextColor` and `resolveFontFamily`, must participate in the same shared root/token contract. HTML and `canvas-dom` surfaces must consume one style reality, not separate HTML and canvas style paths.

### 3. Root Discovery and Preset Application

`runtime/init.js` discovers plugin instances through `.widget.dyniplugin`, not through `canvas.widgetData`. Theme preset lookup, invalidation, and application also begin at the root, so HTML-only widgets participate in the same preset flow as canvas-backed surfaces.

Any remaining runtime path that still starts from `canvas.widgetData`, `[data-dyni]`, or another legacy canvas-origin marker is replaced by root-first or shell-first discovery. `[data-dyni]` may remain temporarily as a compatibility trace, but no runtime-critical behavior depends on it.

### 4. Global Head-Hiding Policy

Head hiding remains a global host-level policy and is expressed through a static root class such as `dyni-hide-native-head`. It is not mixed into renderer state, shell state, or theme logic. Theme is carried by root tokens; head hiding is carried by a root class. These concerns stay separate.

---

## Changes in Existing Code

### 1. `cluster/ClusterWidget.js`

`renderCanvas` is removed. `renderHtml` becomes the only host render path. `initFunction` / `finalizeFunction` manage `HostCommitController` and `SurfaceSessionController`. Internal surface delegation instead of host canvas delegation.

### 2. `cluster/rendering/ClusterRendererRouter.js`

Rebuild into a surface router: determine surface per `kind`, select HTML renderer or canvas DOM adapter, generate HTML shell markup, coordinate local commit, coordinate attach / update / reattach / cleanup for surface controllers. No longer: forwarding into the host canvas path.

### 3. `cluster/mappers/NavMapper.js`

Add `activeRouteInteractive`, shared view model, central catalog instead of distributed special cases.

### 4. `config/clusters/nav.js`

`activeRouteInteractive` as a selectable `kind`. Editables apply to both active route kinds. Disconnect logic applies to both.

### 5. `runtime/widget-registrar.js`

Register without `renderCanvas`. Static host marking (`dyni-host-html`, optional head hiding) through widget/frame classes instead of local DOM commit. Theme preset application not only in the canvas wrapper. Register `catchAll` as an explicit `eventHandler` in `initFunction`; all other named HTML control handlers are owned by the active `html` surface controller.

### 6. `runtime/init.js`

Discovery through `.widget.dyniplugin`. Theme preset independent of `canvas.widgetData`. Root commit support for HTML-only widgets (`requestAnimationFrame`-based with `MutationObserver` fallback), but without dynamic rewriting of root classes. In the same step, any remaining preset/theme invalidation or root lookup that still starts from `canvas.widgetData` is replaced by root-first or shell-first discovery.

### 7. `ThemeResolver`

Add a root-first API. Canvas remains only a convenience path. Final tokens as CSS custom properties. This API is to be defined together with the typography/color helpers as **one** shared style resolution path.

### 7a. `runtime/helpers.js` / Canvas Typography Helpers

Switch `resolveTextColor`, `resolveFontFamily`, and related canvas helpers to the same root/token contract. No parallel second style path only for canvas.

### 8. CSS / `plugin.css`

Move rules from `[data-dyni]` to `.widget.dyniplugin`, `.widgetData.dyni-shell`, or surface-specific shell classes. `widgetData` remains the compatibility wrapper; Dyni-specific layout rules start there or below it, but no runtime-critical behavior may depend exclusively on legacy `canvas.widgetData` discovery or `[data-dyni]` selectors. Surface-specific wrapper classes. `font-size: initial` on `.dyni-surface-canvas` (isolation against `ResizeFrame` cascade). Clear fill contract for `.dyni-surface-canvas` and the internal canvas. Head hiding via static root class. HTML layouts for `activeRouteInteractive`. Interactive areas with wrapper and `catchAll`. Phase 1 is not complete until the CSS/head-hiding/theme-presence path works for HTML-only host widgets without any canvas-origin marker.

### 9. `runtime/TemporaryHostActionBridge.js`

Remains a temporary facade. Capabilities as dispatch information, not as bubble policy. Renderers remain functional without the bridge.

---

## ## Implementation Phases

### Overview

Phases 1–4 form the runtime foundation. Phases 5–9 are the atomic cluster conversion
(all must land together for deployment, but are implemented and tested individually).
Phases 10–12 deliver the first native HTML kind.

Each phase lists:

- **Goal** — what this phase achieves in isolation.
- **Input files** — load these into context (plan + these files).
- **Touch / Create** — files to edit or create.
- **Test exit** — how to verify before moving on.
- **Scope boundary** — what NOT to change yet.

Always load PLAN1.md (architecture sections, principles, constraints) as context
alongside the input files.

---

### Phase 1 — ThemeResolver: Root-First API

**Status:** implemented (`2026-03-19`)

**Goal:** `ThemeResolver` gains a `resolveForRoot(rootEl)` entry point that resolves
tokens from a widget root element instead of requiring a canvas. The existing
`resolve(canvas)` path becomes a thin adapter that finds its owning root and
delegates to `resolveForRoot`. Cache is keyed by root element, not by canvas.

**Input files:** `shared/theme/ThemeResolver.js`, `tests/shared/theme/ThemeResolver.test.js`

**Touch:** `shared/theme/ThemeResolver.js`
**Test exit:** All existing `ThemeResolver` tests pass. New tests verify that
`resolveForRoot(rootEl)` returns correct tokens when CSS custom properties are set
on the root, and that `resolve(canvas)` still works as before by delegating through
the root path.

**Scope boundary:** Do not change `helpers.js`, `init.js`, `widget-registrar.js`,
or `plugin.css`.

---

### Phase 2 — Canvas Typography Helpers: Shared Root/Token Contract

**Status:** implemented (`2026-03-19`)

**Goal:** `resolveTextColor`, `resolveFontFamily`, and `resolveTypography` in
`helpers.js` switch to the same root-first token contract introduced in Phase 1.
They accept either a canvas or a root element. When given a canvas, they resolve
the owning root and use the shared path. No parallel second style resolution path
for canvas only.

**Input files:** `runtime/helpers.js`, `tests/runtime/helpers.test.js`,
`shared/theme/ThemeResolver.js` (as reference for the new API)

**Touch:** `runtime/helpers.js`
**Test exit:** All existing `helpers` tests pass. New tests verify that
`resolveTextColor` and `resolveFontFamily` return correct values when called with
a root element (no canvas), and still work when called with a canvas.

**Scope boundary:** Do not change `init.js`, `widget-registrar.js`, `plugin.css`,
or any cluster files.

---

### Phase 3 — Root Discovery: `init.js` Decoupled from Canvas

**Status:** implemented (`2026-03-19`)

**Goal:** `listPluginContainers` discovers widget instances through
`.widget.dyniplugin` instead of `canvas.widgetData`. Theme preset lookup,
invalidation, and application begin at the root. `invalidateThemeResolverCache`
uses the root-first `ThemeResolver` API. HTML-only widgets (no canvas child)
participate in the same preset/invalidation flow as canvas-backed widgets.

**Input files:** `runtime/init.js`, `tests/runtime/init.test.js`,
`shared/theme/ThemeResolver.js` (as reference)

**Touch:** `runtime/init.js`
**Test exit:** All existing `init` tests pass. New tests verify that
`listPluginContainers` finds a `.widget.dyniplugin` root that contains no
`canvas.widgetData`, and that `applyThemePresetToContainer` works on such a root.

**Scope boundary:** Do not change `widget-registrar.js`, `plugin.css`, or any
cluster files. `[data-dyni]` may remain as a secondary selector in
`isPluginContainer` for backward compatibility, but must no longer be the primary
discovery path.

---

### Phase 4 — Widget Registrar: Static Host Marking + CSS Migration

**Status:** implemented (`2026-03-19`)

**Goal:** `widget-registrar.js` applies host-level markers (`dyni-host-html`,
`dyni-hide-native-head`) as static classes on the widget/frame definition, not by
mutating the DOM in `wrapRenderCanvas`. Theme preset application is no longer
gated behind `canvas.__dyniMarked`. `plugin.css` moves runtime-critical rules from
`[data-dyni]` selectors to `.widget.dyniplugin` and `.widgetData.dyni-shell` (or
equivalent static selectors). `[data-dyni]` selectors may remain as a temporary
compatibility trail but no runtime-critical behavior depends on them.

**Input files:** `runtime/widget-registrar.js`, `tests/runtime/widget-registrar.test.js`,
`plugin.css`, `runtime/init.js` (as reference for the new root contract)

**Touch:** `runtime/widget-registrar.js`, `plugin.css`
**Test exit:** All existing `widget-registrar` tests pass. New tests verify that a
widget registered without `renderCanvas` still gets head-hiding and theme preset
applied through the static class path. CSS visually hides `.widgetHead` inside
`.widget.dyniplugin` without requiring `[data-dyni]`.

**Scope boundary:** Do not change cluster files. The widget is still registered
with `renderCanvas` at this point — the registrar must handle both paths. The
actual removal of `renderCanvas` from the registration happens in Phase 9.

---

### Phase 5 — HostCommitController (Standalone Module)

**Status:** implemented (`2026-03-19`)

**Goal:** Create `runtime/HostCommitController.js` as a self-contained module.
Implements the deferred commit lifecycle described in the plan (Section G.1):
instance state creation in init, revision tracking, rAF-based commit scheduling
with MutationObserver fallback, root/shell resolution, cleanup. Exposes a clear
factory function. Does not wire into ClusterWidget yet.

**Input files:** PLAN1.md Section G.1 (HostCommitController), `runtime/helpers.js`
(as reference for module patterns/UMD shape),
`viewer/components/ExternalWidget.jsx` (as reference for the host lifecycle)

**Create:** `runtime/HostCommitController.js`, `tests/runtime/HostCommitController.test.js`
**Test exit:** Unit tests cover: init creates instance state without DOM access;
`scheduleCommit` resolves shell via `data-dyni-instance` after rAF; stale commits
(wrong revision) are discarded; cleanup cancels pending rAF/MutationObserver/timers;
double-schedule is deduplicated.

**Scope boundary:** Do not modify any existing files. This is a new module only.

---

### Phase 6 — SurfaceSessionController (Standalone Module)

**Status:** implemented (`2026-03-19`)

**Goal:** Create `runtime/SurfaceSessionController.js` as a self-contained state
machine. Implements the switching logic described in the plan (Section G.2):
tracks `desiredSurface` / `mountedSurface` / `surfaceRevision` / `activeController`,
dispatches `attach` / `update` / `detach("remount")` / `detach("surface-switch")` /
`destroy` on surface controllers. Surface controllers are injected as a factory —
the actual html and canvas-dom controllers are not created here.

**Input files:** PLAN1.md Section G.2 (SurfaceSessionController)

**Create:** `runtime/SurfaceSessionController.js`, `tests/runtime/SurfaceSessionController.test.js`
**Test exit:** Unit tests with mock surface controllers cover: same surface + same
shell → `update`; same surface + new shell → `detach("remount")` then `attach`;
different surface → `detach("surface-switch")` on old, `attach` on new; `destroy`
calls through; stale async work (wrong revision) is rejected.
**Documentation update:** Add or update architecture documentation for the new
runtime lifecycle module (`SurfaceSessionController`) and keep
`documentation/TABLEOFCONTENTS.md` in sync with any new documentation page.

**Scope boundary:** Do not modify any existing files. This is a new module only.

---

### Phase 7 — CanvasDomSurfaceAdapter (Standalone Module)

**Status:** implemented (`2026-03-19`)

**Goal:** Create `cluster/rendering/CanvasDomSurfaceAdapter.js`. Implements the
`canvas-dom` surface controller described in the plan (Section G.3 / F.2):
stable shell markup generation, internal canvas management, prop comparison as
redraw trigger, own ResizeObserver for buffer sizing, `font-size: initial`
isolation, fill contract, DPI/size logic via `Helpers.setupCanvas` or equivalent,
dirty/bind flags, theme invalidation, cleanup. Conforms to the surface controller
interface from Phase 6 (`attach` / `update` / `detach` / `destroy`).

**Input files:** PLAN1.md Sections F.2, G.3, `runtime/helpers.js` (for
`setupCanvas`), one existing canvas renderer as reference (e.g.
`widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`),
`viewer/components/ExternalWidget.jsx` + `viewer/hoc/Resizable.jsx` (for
understanding the host render/resize contract)

**Create:** `cluster/rendering/CanvasDomSurfaceAdapter.js`,
`tests/cluster/rendering/CanvasDomSurfaceAdapter.test.js`
**Test exit:** Unit tests cover: `attach` creates internal canvas and binds
ResizeObserver; `update` with changed props schedules repaint; `update` with
identical props does not repaint; theme invalidation forces repaint even without
prop change; `detach` disconnects ResizeObserver and clears canvas refs; shell
markup is structurally stable across `update` calls (Principle 8a).
**Documentation update:** Update architecture/rendering docs to document the
`canvas-dom` adapter contract (`attach`/`update`/`detach`/`destroy`), the
`font-size: initial` isolation rule, and `ResizeObserver` ownership. Update
`documentation/TABLEOFCONTENTS.md` if a new doc page is added.

**Scope boundary:** Do not modify existing renderer files. Do not rewrite
ClusterRendererRouter yet. This module wraps existing renderers but does not
change them.

---

### Phase 8 — Kind Catalog + Surface Router (ClusterRendererRouter Rewrite)

**Status:** implemented (`2026-03-19`)

**Goal:** Create the Kind Catalog as a central spec (Section D) with `kind`,
`viewModelId`, `rendererId`, `surface` per entry. Rewrite `ClusterRendererRouter.js`
from a simple renderer delegator into a surface-aware router: determine surface
per kind from the catalog, select renderer or canvas-dom adapter, generate the
HTML shell markup (Section C), coordinate surface controller lifecycle via the
SurfaceSessionController interface. The router no longer exposes `renderCanvas`.

**Input files:** `cluster/rendering/ClusterRendererRouter.js`,
`tests/cluster/rendering/` (existing router tests), `cluster/rendering/CanvasDomSurfaceAdapter.js`
(Phase 7), `runtime/SurfaceSessionController.js` (Phase 6), PLAN1.md Sections C, D, F

**Touch:** `cluster/rendering/ClusterRendererRouter.js`
**Create:** Kind Catalog (may be a new file or a section within the router — either
is acceptable). Possibly `cluster/rendering/HtmlSurfaceController.js` as a minimal
stub that satisfies the surface controller interface for `html` kinds (no real HTML
kinds exist yet, but the router needs both branches to be complete).
**Test exit:** Existing router tests are adapted. New tests verify: correct surface
selection per catalog entry; shell markup includes `data-dyni-instance`,
`data-dyni-surface`, and surface-specific classes; `canvas-dom` entries route
through `CanvasDomSurfaceAdapter`; `html` entries route through the stub html
controller; `renderCanvas` is no longer exposed.
**Documentation update:** Update architecture docs for the new Kind Catalog and
surface-aware router flow (`renderHtml` shell path, surface selection, and
controller lifecycle). Update `documentation/TABLEOFCONTENTS.md` navigation for
new/renamed references.

**Scope boundary:** Do not modify `ClusterWidget.js` yet. Do not modify
`widget-registrar.js` yet. The router is tested in isolation from the host wiring.

---

### Phase 9 — Wire Everything: ClusterWidget + Registrar Flip

**Status:** implemented (`2026-03-19`)

**Goal:** Rewrite `ClusterWidget.js` to use `HostCommitController` and
`SurfaceSessionController` (via the rewritten router). `initFunction` creates
instance state and registers the global `catchAll` eventHandler.
`renderHtml` returns the shell, stores props, increments revision, and triggers
the deferred commit. `finalizeFunction` cleans up. Remove `renderCanvas` from the
returned spec. Update `widget-registrar.js` to no longer wrap or pass
`renderCanvas`. Update `plugin.css` with surface-specific shell classes
(`.dyni-surface-canvas`, `.dyni-surface-html`, `font-size: initial` isolation).

**Input files:** `cluster/ClusterWidget.js`, `tests/cluster/ClusterWidget.test.js`,
`runtime/widget-registrar.js`, `tests/runtime/widget-registrar.test.js`,
`plugin.css`, all modules from Phases 5–8

**Touch:** `cluster/ClusterWidget.js`, `runtime/widget-registrar.js`, `plugin.css`
**Test exit:** All existing cluster and registrar tests adapted and passing. New
integration tests verify: widget registered without `renderCanvas`; `renderHtml`
returns valid shell markup; deferred commit finds root and binds surface
controller; canvas kinds still render through the canvas-dom adapter; surface
switch (simulated kind change) cleans up old controller and attaches new one;
`finalizeFunction` leaves no dangling observers or timers.
**Documentation update:** Update lifecycle/architecture/theme docs for the host
flip to `renderHtml`-only registration, `ClusterWidget` lifecycle ownership,
static host-class policy, and surface shell CSS contract. Keep
`documentation/TABLEOFCONTENTS.md` aligned with the updated pages.

**Deployment note:** Phases 5–9 are deployed together. No subset is safe to ship.
But each phase is implemented and tested individually, and each leaves the existing
code functional until Phase 9 flips the switch.

---

### Phase 10 — ActiveRouteViewModel Extraction

**Status:** implemented (`2026-03-20`)

**Goal:** Extract the `activeRoute` domain logic currently inline in
`NavMapper.js` into a shared `cluster/viewmodels/ActiveRouteViewModel.js`.
Normalize data, derive disconnect state, prepare route/distance/ETA/course/states,
deliver caption and unit contracts. No HTML markup, no canvas drawing. Update
`NavMapper.js` to use the extracted view model for the existing `activeRoute` kind.

**Input files:** `cluster/mappers/NavMapper.js`,
`tests/cluster/mappers/NavMapper.test.js`

**Create:** `cluster/viewmodels/ActiveRouteViewModel.js`,
`tests/cluster/viewmodels/ActiveRouteViewModel.test.js`
**Touch:** `cluster/mappers/NavMapper.js`
**Test exit:** All existing NavMapper tests pass unchanged (the output for
`kind: "activeRoute"` is identical). New ViewModel unit tests cover: field
normalization, disconnect derivation, missing/null value handling.
**Documentation update:** Update active-route and architecture docs to document
`ActiveRouteViewModel` as the shared domain contract and list the new file in
`documentation/TABLEOFCONTENTS.md` if a dedicated doc page is added.

**Scope boundary:** Do not add `activeRouteInteractive` yet. This phase only
extracts — it does not introduce new kinds.

---

### Phase 11 — `activeRouteInteractive`: Config, Mapper, HTML Renderer

**Status:** implemented (`2026-03-20`)

**Goal:** Add `activeRouteInteractive` as a new independent `kind`. Register it
in the Kind Catalog with `surface: "html"`. Add it to `nav.js` config as a
selectable kind. Add the mapper case in `NavMapper.js` using the shared
`ActiveRouteViewModel`. Create the HTML renderer
(`cluster/rendering/ActiveRouteTextHtmlWidget.js`) that produces string-based
HTML for the surface wrapper and content area.

**Input files:** `config/clusters/nav.js`, `cluster/mappers/NavMapper.js`,
Kind Catalog (from Phase 8), `cluster/viewmodels/ActiveRouteViewModel.js`
(Phase 10), PLAN1.md Sections D, E, F.1

**Create:** `cluster/rendering/ActiveRouteTextHtmlWidget.js`,
`tests/cluster/rendering/ActiveRouteTextHtmlWidget.test.js`
**Touch:** `config/clusters/nav.js`, `cluster/mappers/NavMapper.js`, Kind Catalog
**Test exit:** NavMapper tests verify `kind: "activeRouteInteractive"` produces
correct view model output. Renderer tests verify HTML output includes expected
structure, captions, values. Config tests verify the new kind appears in the
selectable list and that editables and disconnect logic apply to both active route
kinds.
**Documentation update:** Update widget + cluster docs for the new
`activeRouteInteractive` kind, Kind Catalog entry (`surface: "html"`), and
HTML renderer contract. Update `documentation/TABLEOFCONTENTS.md` for added docs.

**Scope boundary:** Do not implement eventHandler wiring or interaction behavior
yet. The renderer produces static HTML only at this point.

---

### Phase 12 — EventHandler Wiring for HTML Surface Controller

**Status:** implemented (`2026-03-20`)

**Goal:** Complete the `html` surface controller (stub from Phase 8) with real
lifecycle management of named `eventHandler` registrations. On `attach`, bind
only the handlers needed by the active HTML kind. On `detach` / `destroy`, remove
them. Implement `resizeSignature(props)` + `triggerResize()` for layout-relevant
content changes. Wire `ActiveRouteTextHtmlWidget` to use named control handlers
for interactive elements. Ensure `catchAll` (registered globally in
`ClusterWidget.initFunction`) covers empty-space clicks on the interactive wrapper.
Add interaction-related CSS for `activeRouteInteractive` to `plugin.css`.

**Input files:** `cluster/rendering/HtmlSurfaceController.js` (stub from Phase 8),
`cluster/rendering/ActiveRouteTextHtmlWidget.js` (Phase 11),
`cluster/ClusterWidget.js` (Phase 9, for catchAll reference),
`viewer/components/UserHtml.tsx` (for understanding the eventHandler contract),
`plugin.css`, PLAN1.md Sections F.1, G.3 (html controller), Principle 10

**Touch:** `cluster/rendering/HtmlSurfaceController.js`,
`cluster/rendering/ActiveRouteTextHtmlWidget.js`, `plugin.css`
**Test exit:** Tests verify: named handlers are registered on `attach` and removed
on `detach`; `resizeSignature` change triggers `triggerResize()` exactly once;
surface switch removes all named handlers; `catchAll` is present on the outermost
interactive wrapper; interactive area markup passes through `UserHtml` event
interception correctly (click events get `stopPropagation` + `preventDefault`).
**Documentation update:** Update interactive-widget and lifecycle docs for
`catchAll` registration ownership (`initFunction` global + surface-owned named
handlers), `resizeSignature` behavior, and HTML-surface detach cleanup rules.
Update `documentation/TABLEOFCONTENTS.md` links as needed.

**Scope boundary:** Host action dispatch via `TemporaryHostActionBridge` is
optional and can be wired separately. The widget must be safe and usable without it.

---

### Phase 13 — Compatibility Trail Cleanup

**Status:** implemented (`2026-03-20`)

**Goal:** Remove every temporary compatibility path, dead code path, and
deferred deprecation that accumulated during Phases 1–12. After this phase,
no legacy marker, selector, adapter shim, or unreachable code path remains
in the codebase.

**Input files:** All files touched or created in Phases 1–12, plus
`shared/theme/ThemePresets.js`, `config/components.js`. Use `grep` to
verify zero remaining occurrences of each item before marking it done.

**Items to clean up (comprehensive — verify each):**

**A. `[data-dyni]` attribute — full removal**

Phase 4 left `[data-dyni]` CSS selectors as a "temporary compatibility trail".
Phase 3 left `data-dyni` as a secondary fallback in `isPluginContainer`.
Phase 9 removed `wrapRenderCanvas`, which was the only runtime code that
set `data-dyni` on roots. No runtime path depends on it any more.

- `runtime/init.js`: remove the `data-dyni` fallback branch from
  `isPluginContainer`. Discovery is `.widget.dyniplugin` only.
- `plugin.css`: remove all `[data-dyni]` selectors. Every rule that was
  duplicated onto `.widget.dyniplugin` (Phase 4) now stands alone.
- Verify: `grep -rn "data-dyni" --include="*.js" --include="*.css"` in
  non-test source returns zero hits (excluding `data-dyni-instance`,
  `data-dyni-surface`, `data-dyni-theme` which are current architecture).

**B. `canvas.widgetData` queries — full removal**

Phase 3 replaced the primary discovery path. Verify no residual
`querySelectorAll("canvas.widgetData")` remains in `runtime/init.js` or
anywhere else in non-test source. The CSS rule
`[data-dyni] canvas.widgetData` is removed with item A.

**C. `wrapRenderCanvas` and `__dyniMarked` — dead code removal**

Phase 9 stopped registering `renderCanvas`. If `wrapRenderCanvas` or
`canvas.__dyniMarked` still exist in `runtime/widget-registrar.js` as
unreachable code, remove them.

**D. ThemeResolver canvas-keyed WeakMap**

Phase 1 introduced root-keyed resolution. If the old `byCanvas` WeakMap
or `invalidateCanvas(canvas)` API still exist as adapter shims, simplify:
remove canvas-keyed cache, keep only root-keyed cache. The public
`resolve(canvas)` adapter method may remain (it finds the root and
delegates), but should not maintain its own cache layer. Update
`invalidateCanvas` to resolve root and call `invalidateRoot`, or remove
it in favor of `invalidateRoot` / `invalidateAll` only.

**E. `helpers.js` canvas-keyed WeakMaps**

Phase 2 switched typography helpers to the root/token contract. If
`typographyByCanvas` or `layoutByCanvas` WeakMaps still exist as adapter
caches for the `resolveTypography(canvas)` path, simplify to root-keyed
only. The canvas-accepting function signatures may remain as convenience
adapters (find root, delegate), but should not keep a separate cache.

**F. Old `renderCanvas` export from ClusterRendererRouter**

Phase 8 rewrote the router to no longer expose `renderCanvas`. Verify the
function and its delegation path are fully removed, not just unused.

**G. Old `renderCanvas` delegation in ClusterWidget**

Phase 9 rewrote `ClusterWidget.js`. Verify the returned spec no longer
contains a `renderCanvas` property at all, and that no internal function
references the removed host canvas lifecycle.

**H. Stale lint suppression comments**

Some `dyni-lint-disable` comments reference documentation or boundaries
that have changed. Review all suppression comments in files touched during
Phases 1–12 and update the justification text where the referenced
documentation path or boundary contract has moved. Remove any suppression
that is no longer needed because the underlying code was restructured.

**I. Test cleanup**

Review test files for `widget-registrar`, `init`, `helpers`, `ThemeResolver`,
`ClusterWidget`, and `ClusterRendererRouter`. Remove or update test cases
that exercise removed code paths (e.g., tests that assert `data-dyni` is
set, tests that call `wrapRenderCanvas`, tests that pass a canvas to
`listPluginContainers`). Ensure no test depends on a compatibility trail
that this phase removes.

**J. TECH-DEBT.md update**

Add a completed entry documenting the removal of all `[data-dyni]` legacy
selectors, `canvas.widgetData` discovery, and canvas-keyed cache shims.
Reference this phase.

**Touch:** `runtime/init.js`, `runtime/widget-registrar.js`, `runtime/helpers.js`,
`shared/theme/ThemeResolver.js`, `cluster/ClusterWidget.js`,
`cluster/rendering/ClusterRendererRouter.js`, `plugin.css`,
`documentation/TECH-DEBT.md`, affected test files.
**Documentation update:** In this cleanup phase, update all docs that still
describe removed compatibility paths (legacy selectors/markers/canvas-origin
discovery) and keep `documentation/TABLEOFCONTENTS.md` accurate. Keep
`documentation/TECH-DEBT.md` synchronized with what was removed/resolved.

**Test exit:** `npm run check:all` passes. `grep -rn` for each removed
pattern confirms zero non-test source hits. All existing tests pass
(adapted where necessary). No new warnings from `check:patterns` or
`check:filesize`.

**Scope boundary:** Do not change widget renderers, shared widget-kits,
mappers, or config files. This phase is purely removal and simplification
of infrastructure code. Keep behavior changes scoped to removal/simplification
work; broad architecture narrative alignment still happens in Phase 14.

---

### Phase 14 — Documentation Sweep

**Status:** implemented (`2026-03-20`)

**Goal:** Bring all project documentation in line with the post-Phase-12
architecture. Individual phases may have updated docs for the files they
touched, but those updates lack the big picture of the completed
architecture. This phase performs a systematic sweep across every
documentation file and AI instruction file to ensure consistency,
remove outdated references, add missing coverage for new modules, and
update guides to reflect the dual-surface (html / canvas-dom) world.

**Input files:** All files under `documentation/`, all top-level `.md` files
(`ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`,
`ROADMAP.md`), `documentation/TABLEOFCONTENTS.md`, all new modules created
in Phases 5–12.

**Items to update (comprehensive — verify each):**

**A. Top-level AI instruction files**

- `AGENTS.md` and `CLAUDE.md`: Section 1 ("Project Constraints") states
  "Canvas 2D only — All visual rendering via `renderCanvas(canvas, props)`".
  Update to reflect the dual-surface model: canvas-dom for existing gauges,
  native HTML for interactive widgets, `renderHtml` as the sole host path.
- `AGENTS.md` and `CLAUDE.md`: Section 4 ("File Map") — add entries for
  new modules (`runtime/HostCommitController.js`,
  `runtime/SurfaceSessionController.js`,
  `cluster/rendering/CanvasDomSurfaceAdapter.js`,
  `cluster/rendering/HtmlSurfaceController.js`,
  `cluster/viewmodels/ActiveRouteViewModel.js`,
  `cluster/rendering/ActiveRouteTextHtmlWidget.js`,
  Kind Catalog location).
- `ARCHITECTURE.md`: Layer Map and Component Registration Flow must reflect
  the new `renderHtml`-only registration, the surface layer, and the
  HostCommitController/SurfaceSessionController runtime modules. Add
  `cluster/viewmodels/` to the layer map.

**B. Architecture documentation**

- `documentation/architecture/cluster-widget-system.md`: Rewrite to
  reflect the surface router model. The old flow
  "ClusterWidget.renderCanvas() delegates via ClusterRendererRouter" is
  replaced by the shell/surface/commit architecture. Document the Kind
  Catalog as the routing spec. Document surface lifecycle
  (attach/update/detach/destroy).
- `documentation/architecture/component-system.md`: Update the
  registration flow to show `renderHtml`-only registration. Remove or
  mark as historical any `renderCanvas` registration path.
- `documentation/architecture/plugin-core-contracts.md`: Review and
  update any contract descriptions that assume canvas-only rendering.

**C. AvNav API documentation**

- `documentation/avnav-api/plugin-lifecycle.md`: Major update needed.
  The lifecycle table lists `renderCanvas` as an optional hook — update
  to document that the Nav cluster no longer uses it. Update the
  `wantsHideNativeHead` section: head hiding is now via static root class,
  not `data-dyni` attribute. Update the `hostActions` injection section
  to reflect that injection no longer happens through `wrapRenderCanvas`.
  Update the render cycle diagram to show `renderHtml` → deferred commit →
  surface controller lifecycle.
- `documentation/avnav-api/interactive-widgets.md`: Update the recommended
  pattern. The current doc shows `catchAll` registered inside `renderHtml`.
  The new architecture registers `catchAll` once in `initFunction` (global)
  and named control handlers are managed by the html surface controller on
  attach/detach. Update code examples accordingly. Document the
  `resizeSignature` + `triggerResize` pattern for layout-relevant HTML.
- `documentation/avnav-api/editable-parameters.md`: Add
  `activeRouteInteractive` to any relevant examples.

**D. Shared / theme documentation**

- `documentation/shared/theme-tokens.md`: Update to document the
  root-first resolution path (`resolveForRoot`). Note that the
  canvas-accepting `resolve(canvas)` is now an adapter. Remove any
  language suggesting the cache is canvas-scoped.
- `documentation/shared/css-theming.md`: Update selectors from
  `[data-dyni]` to `.widget.dyniplugin`. Document new surface-specific
  classes (`.dyni-surface-html`, `.dyni-surface-canvas`), shell classes
  (`.widgetData.dyni-shell`), and kind classes (`.dyni-kind-*`).
  Document `font-size: initial` isolation on `.dyni-surface-canvas`.
- `documentation/shared/helpers.md`: Update `resolveTextColor` and
  `resolveFontFamily` documentation to reflect the root-first API.
  Note that canvas-accepting signatures remain as convenience adapters.

**E. Core principles**

- `documentation/core-principles.md`: Rule 3 states "Passive visual
  rendering stays on Canvas 2D via `renderCanvas(canvas, props)`;
  `renderHtml(props)` is allowed only for active widgets that need
  DOM-owned interaction." Update to reflect the new reality: all
  rendering goes through `renderHtml` on the host side; canvas
  rendering happens inside the canvas-dom adapter for existing gauges;
  native HTML is used for interactive kinds and will gradually replace
  canvas for non-interactive kinds too.

**F. Guides**

- `documentation/guides/add-new-text-renderer.md`: Update to document
  both paths — canvas renderer (wrapped by CanvasDomSurfaceAdapter)
  and native HTML renderer. Update the step-by-step to include Kind
  Catalog registration with `surface` field.
- `documentation/guides/add-new-gauge.md`: Update to note that new
  gauges are wrapped by the canvas-dom adapter and registered with
  `surface: "canvas-dom"` in the Kind Catalog. The renderer itself
  is unchanged, but the host path is different.
- `documentation/guides/add-new-linear-gauge.md`: Same as above.
- `documentation/guides/add-new-full-circle-dial.md`: Same as above.
- `documentation/guides/add-new-cluster.md`: Update to document the
  Kind Catalog, surface selection, and the distinction between html
  and canvas-dom kinds.
- Consider adding: `documentation/guides/add-new-html-kind.md` — a
  new guide for creating native HTML kinds (ViewModel extraction,
  HTML renderer, Kind Catalog entry, eventHandler wiring, surface
  controller lifecycle).

**G. Widget documentation**

- `documentation/widgets/active-route.md`: Add `activeRouteInteractive`
  as a documented kind. Document the shared `ActiveRouteViewModel`,
  the HTML renderer, the interaction contract, and the relationship
  to `activeRoute`.

**H. Conventions**

- `documentation/conventions/smell-prevention.md`: Update the reference
  to `renderCanvas` in the orchestration stub rule to include
  `renderHtml` and surface controller delegation.
- `documentation/conventions/coding-standards.md`: Review for any
  examples or rules that assume canvas-only rendering.

**I. Structural documentation**

- `documentation/TABLEOFCONTENTS.md`: Add entries for all new
  documentation pages and all new modules. Verify all existing links
  still resolve.
- `documentation/TECH-DEBT.md`: Review for any items that should be
  added or resolved as a result of the full implementation.
- `ROADMAP.md`: Update to reflect completed phases and adjust future
  milestones (Phase 15/16: gradual migration, activeRoute refactor).
- `README.md`: Update if it describes the rendering architecture or
  widget capabilities.
- `CONTRIBUTING.md`: Update if it references the old rendering pipeline
  or registration flow.

**J. Phase related Documentation**

- In all documentation Files it might also be possible that the docs are talking about Phases or Steps. Remove those references to the implementation plans and extend the docs to be standalone without the references to the plans.

**Touch:** All files listed above.

**Test exit:** `npm run check:all` passes (including `check:docs` and
`check:doc-reachability` if they exist). All internal documentation
cross-references resolve. `grep -rn` for `renderCanvas` across
`documentation/` returns only clearly marked historical/compatibility
context, not active guidance. The TABLEOFCONTENTS.md index covers every
module and documentation page.

**Scope boundary:** Do not change any source code. This phase is
documentation only. If you discover a source code inconsistency while
reviewing docs, note it as a TECH-DEBT item rather than fixing it here.

---

## Deployment Boundaries

| Deployable unit              | Phases | Rationale                                                                                                                                                                                     |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime foundation           | 1–4    | Each phase is independently safe. Existing canvas widgets continue working. Can be shipped incrementally.                                                                                     |
| Cluster HTML host conversion | 5–9    | Must ship together. Between removing `renderCanvas` (Phase 9) and having the canvas-dom adapter (Phase 7), canvas widgets would break. But each phase is implemented and tested individually. |
| First native HTML kind       | 10–12  | Can ship incrementally. Phase 10–11 add a new read-only kind. Phase 12 adds interactivity.                                                                                                    |

---

## Acceptance Criteria

### Host and Runtime

- `dyni_Nav_Instruments` is registered in AvNav without `renderCanvas`.

- The first plugin-owned HTML wrapper returned by `renderHtml` keeps the `widgetData` class as a compatibility convention.

- Root discovery, theme, and preset work without host canvas.

- `ThemeResolver` and the canvas typography/color helpers form a shared style path.

- Root classes remain host-related and static; the local commit only verifies them.

- `wantsHideNativeHead` is applied globally to the widget, not per `kind`.

### Surface and Lifecycle

- `html` and `canvas-dom` work under the same HTML host.

- Surface switches leave behind no old observers, canvas refs, or handlers.

- Remounts are correctly treated as reattach.

- Stale asynchronous work is discarded by revision.

- The canvas DOM adapter uses prop comparison in `renderHtml` as redraw trigger (not dependent on AvNav `renderCanvas` heartbeat).

- The canvas DOM adapter has its own sizing logic (`ResizeObserver` for buffer sizing, `font-size: initial` for isolation from AvNav `ResizeFrame`) and an explicit fill contract between surface wrapper and internal canvas.

- Native HTML kinds reliably trigger `triggerResize()` for layout-relevant content changes through a small `resizeSignature(props)`.

- Theme/preset changes reliably cause a repaint in `canvas-dom`, even without prop changes.

### Interactive HTML Widgets

- Interactive HTML kinds use the AvNav `eventHandler` path as standard.

- `catchAll` is an explicitly registered `eventHandler`, set on the outermost wrapper of the interactive area.

- Named control handlers are attached only for the active HTML surface session and are removed again on surface switch, remount, and destroy.

- Clicks inside the interactive HTML area do not trigger host navigation behavior on `GpsPage`.

- Empty-space clicks are also consumed.

- Host action dispatch is optional and separate from bubble blocking.

- Without an available dispatch capability, the widget remains safe and usable.
