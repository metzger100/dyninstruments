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

- The `canvas-dom` adapter must still implement its own sizing logic (`ResizeObserver`), because `ResizeFrame` only performs font scaling, not canvas buffer sizing.

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

### 1. Root Classes

Target state: `.widget.dyniplugin` plus **static** host classes such as `dyni-host-html`, optionally `dyni-hide-native-head`. The first plugin-owned HTML wrapper remains `.widgetData.dyni-shell`. Renderer and `kind` states only on that shell or below it. These classes are provided through the registered widget definition or `WidgetFrame`, not rewritten dynamically during commit.

### 2. ThemeResolver Becomes Root-First

Target API: `resolveForRoot(rootEl)`, with `resolveForCanvas(canvas)` only as an adapter path. Final tokens as CSS custom properties on root/shell. HTML and canvas consume the same token reality.

This also includes the helper layer: `runtime/helpers.js` (`resolveTextColor`, `resolveFontFamily`) must not remain separately canvas-first, but must be switched to the same root/token contract or cleanly adapted to it.

### 3. Theme Preset Application and Root Discovery

`runtime/init.js` discovers plugin roots through `.widget.dyniplugin`, no longer through `canvas.widgetData`. Theme presets also work for HTML-only widgets.

### 4. Head Hiding Remains Global

Head hiding via a global root class. Theme via root tokens. No mixing.

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

## Rollout Order

### Phase 1 — Runtime Foundation for HTML Host

Goal: decouple root discovery, theme presets, registrar, and CSS/root markers from canvas. Introduce local root commit per instance (`requestAnimationFrame`-based with `MutationObserver` fallback), without dynamically rewriting root classes. Replace every runtime-critical dependency on `canvas.widgetData` discovery and `[data-dyni]`-based behavior with root-first or shell-first paths in the same phase.

Result: HTML-only widgets work cleanly at the infrastructure level, including theme/preset application, head-hiding markers, and CSS/root discovery without any residual dependency on host canvas markers.

### Phase 2+3 — Convert Cluster to HTML Host + Canvas DOM Adapter (ATOMIC)

**Phase 2 and Phase 3 are implemented as one atomic delivery unit.** Reason: between removing `renderCanvas` (Phase 2) and providing the canvas DOM adapter (Phase 3), all existing canvas widgets would fail. For a live navigation plugin, that is not acceptable.

Goal of Phase 2: `dyni_Nav_Instruments` becomes `renderHtml`-only on the host side. Internal surface router and `SurfaceSessionController` are introduced.

Goal of Phase 3: continue running existing canvas kinds inside the HTML host. Minimal bind / draw / cleanup lifecycle for internal canvas: prop comparison in `renderHtml` as redraw trigger, own `ResizeObserver` for buffer sizing, `font-size: initial` for isolation from `ResizeFrame`, clear fill contract of the canvas surface wrapper, explicit theme invalidation for repaint.

Result: the visible cluster remains unchanged. Host canvas disappears completely. The canvas DOM adapter locally replaces the missing host canvas lifecycle. Surface switches inside the same instance are lifecycle-safe.

### Phase 4 — `activeRouteInteractive` as the First Native HTML Kind

New independent `kind`, shared `ActiveRouteViewModel`, own HTML renderer. AvNav-compliant interaction contract through string-based `renderHtml`, registered `catchAll` `eventHandler`, and named control handlers. For layout-relevant content changes, the HTML path uses `resizeSignature(props)` and `triggerResize()`. Optional host actions through runtime facade.

Result: first real HTML path in the Nav cluster. Interactive area works on `GpsPage` without triggering the host click path.

### Phase 5 — Gradually Migrate Additional Kinds

As needed, migrate further `canvas-dom` kinds to native HTML renderers.

### Phase 6 — Refactor `activeRouteInteractive` → `activeRoute`

Once the HTML path is stable, `activeRoute` is converted to HTML and `activeRouteInteractive` is refactored into `activeRoute`.

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
