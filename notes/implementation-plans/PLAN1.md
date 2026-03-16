# Implementation Plan — `renderHtml` Active Widgets / ActiveRoute Pilot

**Status:** ❌ Not Started | `renderHtml` foundation, ActiveRoute pilot, host-action parity, NavPage widget sizing

## Overview

This plan introduces a narrow `renderHtml` path for active widgets, starting with `dyni_Nav_Instruments` `kind: "activeRoute"`.
The pilot must preserve the current ActiveRoute visual contract while adding the core-style route-editor action via `TemporaryHostActionBridge`, without turning HTML into the default renderer path for passive widgets.

The pilot widget is built as a **parallel `activeRouteInteractive`** kind (registered in `config/clusters/nav.js` alongside the existing `activeRoute` canvas widget) routed to a new `ActiveRouteTextHtmlWidget` renderer. The old canvas `ActiveRouteTextWidget` stays untouched until the new HTML renderer reaches full parity, at which point the old kind and canvas renderer are removed in a single cleanup commit.

## Current Codebase Findings

- `ClusterWidget`, `ClusterRendererRouter`, and `RendererPropsWidget` already pass through `renderHtml(props)`.
- `runtime/widget-registrar.js` already injects `this.hostActions` into `renderHtml`, `initFunction`, and `finalizeFunction`.
- `TemporaryHostActionBridge` already exposes page-aware capability for this widget:
  - `routeEditor.openActiveRoute` = `dispatch` on `navpage`
  - `routeEditor.openActiveRoute` = `passive` on `gpspage`
  - `routeEditor.openActiveRoute` = `unsupported` elsewhere
- `ActiveRouteTextWidget` is still canvas-only and owns the current visual contract:
  - `high` / `normal` / `flat` layout modes
  - approach accent
  - route-name truncation
  - placeholder handling
  - disconnect overlay
- `ActiveRouteLayout` is currently a canvas-layout owner; the HTML path has no documented size/layout contract yet.
- Several runtime/style utilities still assume widgets are canvas-backed:
  - `runtime/init.js` discovers plugin containers via `canvas.widgetData`
  - `runtime/widget-registrar.js` only marks roots and reapplies theme presets in `renderCanvas`
  - `plugin.css` hides AvNav native head only under `[data-dyni]`
- No shared HTML-string escaping utility exists yet for `renderHtml` string renderers.

## AvNav Widget Sizing on NavPage — Critical Analysis

This section documents how AvNav sizes widgets on the NavPage (and MapPage in general), what assumptions exist, and what the plugin must do to make `renderHtml` widgets display correctly. This is also partially relevant for `renderCanvas` widgets that may need non-default height in the vertical panel.

### How AvNav Renders External Widgets

`ExternalWidget.jsx` is the React component that renders plugin-registered widgets. It wraps everything in a `WidgetFrame` which produces this DOM structure:

```text
<div class="widget externalWidget dyniplugin {additionalClasses}" style="...">  ← WidgetFrame
  <div class="widgetHead">...</div>                                              ← WidgetHead (hidden by plugin CSS)
  <div class="noresize">                                                         ← when mode !== 'gps'
    <canvas class="widgetData" />                                                ← if renderCanvas
    <UserHtml />                                                                 ← if renderHtml (parsed HTML string)
  </div>
</div>
```

Key: when `mode === 'gps'` (GpsPage), a `<div class="resize">` with automatic font-sizing via `resizeElementFont` is used instead of `<div class="noresize">`. On NavPage, `mode` is `"vertical"` or `"horizontal"`, so `noresize` is always used — **no automatic font scaling happens**.

### Panel Layout on NavPage

NavPage uses `MapPage.jsx` which creates four widget panels:

| Panel | CSS class | `mode` prop | Layout direction | Key sizing rules |
|---|---|---|---|---|
| `left` | `.widgetContainer.vertical.left` | `"vertical"` | Column (bottom-aligned) | `width: var(--avnav-left-widgets-width)` = 8.8em, `max-height: 100%`, widgets share height via `flex-grow: 1` |
| `top` | `.widgetContainer.horizontal.top` | `"horizontal"` | Row (wrapping) | `max-height: calc(4em + 0.2em)`, widgets get `height: 4em` fixed |
| `bottomLeft` | `.widgetContainer.horizontal.bottomLeft` | `"horizontal"` | Row (reverse) | Same horizontal rules as top |
| `bottomRight` | `.widgetContainer.horizontal.bottomRight` | `"horizontal"` | Row | Same horizontal rules as top |

### Vertical Panel (Left) — Height Distribution

```css
.widgetContainer.vertical {
  overflow: hidden;
  flex-direction: column;
  justify-content: flex-end;    /* widgets anchor to bottom, overflow clips from top */
  align-items: stretch;
}
.widgetContainer.vertical .widget {
  flex-grow: 1;     /* from base .widget rule */
  flex-shrink: 0;   /* widgets do NOT shrink below intrinsic size */
  width: calc(100% - 0.2em);
}
```

All widgets in the vertical panel get **equal height** via `flex-grow: 1` distributed among siblings. The total available height is the map area height. If there are 7 widgets (default NavPage left panel), each gets ~1/7 of the vertical space.

For **canvas widgets** this works because:
- `plugin.css` sets `[data-dyni] canvas.widgetData { width: 100% !important; height: 100% !important; }`
- The canvas element fills whatever space flex allocates
- The canvas renderer draws into actual pixel dimensions via `Helpers.setupCanvas(canvas)`

For **HTML widgets** this is problematic because:
- HTML content has **intrinsic size** — it pushes the widget height based on content
- The `.noresize` wrapper is `flex: 1; display: flex; flex-direction: column; min-height: 0; min-width: 0`
- If the HTML content is smaller than the flex-allocated space, it won't fill the widget
- If the HTML content is taller, it may cause unexpected overflow or widget expansion

### Horizontal Panels (Top, Bottom) — Fixed Height and Width

```css
.widgetContainer.horizontal .widget {
  height: var(--avnav-horizontal-widgets-height);   /* = 4em, fixed */
}
```

Height is fixed at 4em. Width comes from **widget-specific CSS rules** in AvNav's `widgets.less`:

```css
/* Example: AvNav built-in ActiveRouteWidget */
.widget.activeRouteWidget { width: 7em; }   /* via .smallWidget(@size1) */

/* Example: AvNav built-in SOG widget */
.widget.SOG { width: 11em; }                /* via .bigWidget(@size2) */
```

Plugin widgets have CSS class `dyniplugin` and `externalWidget`, **not** any of AvNav's built-in widget classes. Without explicit width rules, the plugin widget will have **no defined width** in horizontal panels — it will either collapse to content width or stretch unpredictably depending on `flex-grow`.

### GpsPage — Automatic Font Scaling (Not NavPage)

On GpsPage (`mode === 'gps'`), `WidgetFrame` uses `ResizeFrame` which calls `resizeElementFont(el)`. This function iterates on `el.style.fontSize` (as a percentage) to find the largest font-size where `scrollHeight <= clientHeight && scrollWidth <= clientWidth`. This is what makes GpsPage widgets auto-scale their text to fill available space.

**This does not apply on NavPage** because `mode` is `"vertical"` or `"horizontal"`, not `"gps"`.

### The `mode` Prop Is Passed to Plugin Renderers

The `mode` string (`"vertical"`, `"horizontal"`, `"gps"`) flows from the `WidgetContainer` through `WidgetFactory.createWidget` → `DynamicWidget` → `ExternalWidget` → `getProps()` → `renderHtml(props)` / `renderCanvas(canvas, props)`. The plugin can read `props.mode` and adapt its rendering accordingly.

Additionally, `WidgetFrame` adds the CSS class `"horizontal"` to the widget div when `mode === 'horizontal'`, which means `.widget.horizontal` selectors apply.

### What the Plugin Must Do for renderHtml on NavPage

1. **Explicit widget width in horizontal panels**: Add CSS rules in `plugin.css` or component CSS that set width for plugin widgets in horizontal containers:
   ```css
   .widgetContainer.horizontal .widget.dyniplugin { width: 7em; }
   /* or per-kind overrides via additional class names */
   ```

2. **HTML wrapper must fill allocated flex space**: The outermost HTML element returned by `renderHtml` must be styled to fill its parent flex container:
   ```css
   .dyni-htmlWidget {
     display: flex;
     flex-direction: column;
     width: 100%;
     height: 100%;
     min-height: 0;
     overflow: hidden;
   }
   ```

3. **Use `mode` prop for layout switching**: Instead of canvas-based W/H ratio detection, the HTML renderer can use `props.mode` to select a compact (horizontal/4em-constrained) vs. expanded (vertical/flex-shared) layout. CSS classes or data attributes can be set from the `mode` prop.

4. **Font sizing strategy**: Since `resizeElementFont` does not run on NavPage, the HTML renderer must either:
   - Use fixed `em`-based sizing that works within the known panel dimensions (8.8em wide vertical panel, 4em tall horizontal panel at the base `widgetFontSize`)
   - Use CSS `clamp()` / viewport-relative units for responsive text
   - Accept that text will not auto-scale like on GpsPage

5. **Canvas widgets that need more height**: For canvas-based widgets that need disproportionate space in the vertical panel (e.g., radial gauges), the same flex distribution applies — every widget gets equal `flex-grow: 1`. To request more space, a widget would need CSS overrides for `flex-grow` or explicit `min-height`. This is an AvNav layout constraint, not something the plugin can fully control without user CSS overrides.

### Summary of Sizing Dimensions

| Context | Width | Height | Font scaling |
|---|---|---|---|
| NavPage vertical (left) | ~8.8em (container-set) | Equal share via flex-grow | None (noresize) |
| NavPage horizontal (top/bottom) | **Must be set by plugin CSS** | 4em (fixed) | None (noresize) |
| GpsPage | Grid-cell allocated | Grid-cell allocated | `resizeElementFont` auto-scales |

## New `renderHtml` Concepts

- `renderHtml` stays an exception for active widgets only. Canvas remains the default for passive display widgets.
- Use AvNav string-mode HTML rendering plus `this.eventHandler`. Do not introduce React/HTM or inline JS.
- Treat host actions as capability-driven state, not as unconditional APIs. Renderers must branch on `dispatch`, `passive`, and `unsupported`.
- Passive HTML widgets must rely on the host/page click path instead of intercepting clicks themselves.
- Make widget-root discovery independent of `canvas.widgetData` so HTML-only widgets can still receive theme presets, native-head hiding, and future runtime hooks.
- Separate semantic state from presentation:
  - JS owns parsing, formatting, disconnect/action state, and host-action wiring.
  - `ThemeResolver` owns visual tokens and their defaults.
  - component CSS owns layout/composition, truncation, and semantic-class arrangement for `renderHtml` widgets only.
- Add a shared HTML escaping helper before any store-driven string is interpolated into `renderHtml`.
- Close the missing HTML size/layout contract before converting ActiveRoute:
  - component CSS is the layout owner for `renderHtml` widgets
  - the plugin must explicitly handle NavPage panel sizing (horizontal width, vertical flex-fill)
  - if a runtime size bridge is still needed, it may expose generic size attributes/classes, but it must not become the layout owner

## Proposed Working Model

### Render Path Contract

```text
storeKeys
-> mapper translate()
-> renderer props (includes props.mode from AvNav)
-> renderer builds HTML view model
-> renderer registers this.eventHandler callbacks
-> renderer returns escaped HTML string
-> component CSS owns layout/composition
-> ThemeResolver supplies visual tokens consumed by CSS
```

Rules:

- mappers stay declarative and do not know about DOM, click handlers, or host-action capability lookup
- renderer modules own parsing, formatting, placeholder rules, capability mapping, and markup selection
- event handlers are registered only in `renderHtml` through `this.eventHandler`
- `initFunction` / `finalizeFunction` are reserved for shared runtime hooks such as future resize observers, not for business logic
- `props.mode` is the primary signal for layout adaptation on NavPage (`"vertical"` / `"horizontal"`) vs GpsPage (`"gps"`)

### HTML Root Contract

Suggested root contract for all future active widgets:

- runtime marks widget roots independently of canvas presence
- widget root carries plugin identity and renderer identity:
  - `[data-dyni]`
  - `[data-dyni-render="html"]`
- HTML renderer returns one full-size wrapper element
- click ownership is mode-dependent:
  - `dispatch` -> renderer may attach a handler
  - `passive` / `unsupported` -> renderer returns passive markup and lets the host own click semantics

```html
<div class="dyni-htmlWidget dyni-activeRoute" data-dyni-mode="vertical">...</div>
```

- renderer wrapper fills the usable widget area and becomes the only click boundary for widget-owned interactions
- `wantsHideNativeHead: true` remains the way to reclaim full widget space for HTML widgets too
- the wrapper element must be styled to fill its flex parent (`width: 100%; height: 100%; display: flex; overflow: hidden`)
- `data-dyni-mode` mirrors `props.mode` so CSS can target layout variants without JS layout switching

### Theme / CSS Contract

Ownership decision:

- `ThemeResolver` is the single owner of visual-token defaults and preset resolution
- `plugin.css` remains the shared shell layer only
- component CSS files are a narrow exception for `renderHtml` widgets and own only widget composition/layout, truncation, and DOM arrangement

Contract:

- `plugin.css` keeps only plugin-wide shell rules such as font inheritance, root attributes, border behavior, native-head hiding, shared HTML-widget base selectors, **and NavPage panel sizing rules for plugin widgets** (horizontal width defaults)
- widget-specific CSS files own renderer-internal composition/layout rules such as tile grids, truncation, layout rearrangement, semantic state selectors, and widget-only responsive rules
- HTML widgets consume resolved visual values through CSS custom properties on the widget root
- those custom properties are populated from the ThemeResolver-owned token set; component CSS consumes them but never defines fallback token defaults or preset values
- fonts, font weights, colors, and any future stroke/line-thickness style tokens remain ThemeResolver-owned even when HTML widgets use them in CSS

Minimum token set for the pilot:

- foreground text color
- warning/accent color
- primary font weight
- label font weight
- border/head-hiding state already provided by plugin root styling

Consequence:

- HTML widgets do not need a canvas just to access theme tokens
- no widget-local duplication of preset defaults
- `plugin.css` does not become a dumping ground for widget-local DOM layout
- `ActiveRouteTextHtmlWidget` should ship with its own component CSS file registered through `config/components.js`
- this component-CSS exception applies only to `renderHtml` widgets, not to canvas widgets
- component CSS arranges markup; ThemeResolver remains the source of truth for how that markup looks

### Responsive Layout Contract

Ownership decision:

- component CSS owns layout/composition for HTML widgets
- `high` / `normal` / `flat` remain documentation labels for the three compositions, but they are not renderer-owned mode props
- `ThemeResolver` does not encode layout breakpoints or composition switching
- `props.mode` (`"vertical"` / `"horizontal"` / `"gps"`) is the primary layout signal from AvNav

Implementation rule:

- `activeRouteRatioThresholdNormal` / `activeRouteRatioThresholdFlat` are retired for the HTML renderer because layout breakpoints become CSS-owned
- the HTML renderer uses `props.mode` to set a `data-dyni-mode` attribute on the wrapper; CSS targets this attribute for layout switching
- in horizontal mode (`4em` height), CSS selects a compact single-row composition
- in vertical mode (flex-shared height), CSS selects a stacked multi-row composition
- in gps mode (auto-scaled), CSS selects the full expanded composition
- if the target browser still needs a runtime size assist (e.g., container queries are unavailable), that assist may expose a generic size bucket on the root, but layout rules still live in component CSS
- renderer/view-model code must not decide between `high` / `normal` / `flat`
- renderer/view-model code must not carry theme, typography, or layout-selection defaults

### ActiveRoute View-Model Contract

The HTML renderer should not directly format from raw props into string concatenation. It should first build a small semantic model:

| Field | Meaning |
|---|---|
| `routeNameText` | trimmed route name or placeholder |
| `metrics` | ordered tile array for `RTE`, `ETA`, optional `NEXT` |
| `isApproaching` | enables accent state and `NEXT` tile visibility |
| `disconnect` | enables placeholder values and disconnect overlay |
| `actionMode` | `dispatch`, `passive`, or `unsupported` |
| `isActionable` | convenience boolean for markup/CSS |
| `mode` | AvNav panel mode: `"vertical"`, `"horizontal"`, or `"gps"` |

Rendering rules:

- `NEXT` tile exists whenever `isApproaching === true`, even if the course value is missing
- disconnect keeps the same tile structure; only values switch to placeholders
- `high` / `normal` / `flat` composition is selected by component CSS (via `data-dyni-mode` and container dimensions), not by the view model
- route-name truncation is CSS-owned (`overflow`, `text-overflow`) rather than manual canvas fitting
- all user/store-derived strings are escaped once at the render boundary
- the view model carries semantic state only; it does not expose visual-token or layout-mode fields

### Host-Action Behavior Matrix

| Capability | Widget behavior | Markup/handler rule |
|---|---|---|
| `dispatch` | widget owns the click and opens the route editor | register root click handler via `this.eventHandler`; render clickable affordance |
| `passive` | widget stays visually passive and relies on host/page click semantics | do not register root handler; do not install `catchAll`; let the host own click flow |
| `unsupported` | widget renders data only | no action handler; no clickable affordance |

Implications:

- host-action lookups happen inside the renderer, never in config or mapper code
- workaround paths are narrow and explicitly marked
- ActiveRoute should be the reference for later `EditRoute`, `RoutePoints`, and `AisTarget` capability gating
- passive markup may expose semantic classes/attributes for styling and tests, but it must stay handler-free so the host keeps click ownership

### ActiveRoute DOM Shape

Target DOM structure for the pilot in `dispatch` mode:

```html
<div
  class="dyni-htmlWidget dyni-activeRoute dyni-state-approach dyni-state-actionable"
  data-dyni-action-mode="dispatch"
  data-dyni-mode="vertical"
  onclick="openActiveRoute"
>
  <div class="dyni-activeRoute__name">Harbor Run</div>
  <div class="dyni-activeRoute__metrics">
    <div class="dyni-activeRoute__tile dyni-activeRoute__tile--remain">...</div>
    <div class="dyni-activeRoute__tile dyni-activeRoute__tile--eta">...</div>
    <div class="dyni-activeRoute__tile dyni-activeRoute__tile--next">...</div>
  </div>
  <div class="dyni-activeRoute__overlay">NO DATA</div>
</div>
```

Behavior:

- root state classes own semantic state (`approach`, `disconnect`, `actionable`), not layout mode
- `data-dyni-mode` carries the AvNav panel mode for CSS layout switching
- tile order remains semantic and stable; CSS rearranges layout, not JS
- overlay is present only in disconnect mode
- `passive` and `unsupported` markup reuses the same structure but omits `onclick` and the actionable affordance so the host keeps click ownership
- `data-dyni-action-mode` is optional but useful for test assertions and capability-specific styling hooks

## Parity Target

### Visual parity

- Preserve the same data hierarchy: route name + `RTE`, `ETA`, conditional `NEXT`.
- Preserve current mode semantics: tall stacked layout (vertical panel), compact single-row layout (horizontal panels), auto-scaled layout (GpsPage).
- Keep route-name truncation, approach accent, placeholder semantics, and disconnect overlay.
- Keep theme and preset behavior aligned with existing CSS token names.

### Feature parity

- On `navpage`, clicking the widget opens the route editor via `this.hostActions.routeEditor.openActiveRoute()`.
- On `gpspage` (`passive`) and unsupported pages, the widget must not fake a dispatch path.
- HTML-owned click handling must not reintroduce the `GpsPage` bubbling problem documented in `interactive-widgets.md`.

## Decision Gate Before Widget Migration

- Step 0 must explicitly close the repo-wide contract for future HTML widgets:
  - when `renderHtml` is allowed
  - how HTML widgets receive theme/root/native-head behavior
  - how host-action capability gating is documented
  - what must be shared vs widget-local
  - that ThemeResolver owns look tokens while component CSS owns layout/composition
  - that component CSS is a `renderHtml`-only exception, not a rollback of the canvas-first styling model
  - how NavPage widget sizing works and what the plugin must provide
- Step 1 runtime work must explicitly close how HTML widgets get:
  - root detection (without `canvas.widgetData` dependency)
  - preset application
  - native-head hiding
  - root-level theme token exposure for HTML CSS consumption
  - correct sizing behavior in all NavPage panel modes
- Retire hidden canvas-only ratio editables for ActiveRoute when the HTML renderer lands.

## Likely Touch Points

- `runtime/init.js`
- `runtime/widget-registrar.js`
- `plugin.css`
- `config/components.js`
- `config/clusters/nav.js`
- `cluster/mappers/NavMapper.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` (new)
- `widgets/text/ActiveRouteTextHtmlWidget/active-route-html.css` (new)
- `runtime/TemporaryHostActionBridge.js`
- `documentation/core-principles.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/architecture/component-system.md`
- `documentation/shared/css-theming.md`
- `documentation/widgets/active-route.md`
- `documentation/guides/add-new-text-renderer.md`
- `documentation/TECH-DEBT.md`
- `documentation/TABLEOFCONTENTS.md`

## Todo Steps

### Step 0 — Verify the existing foundation is stable

Analyze the commits that laid the `renderHtml` foundation and search for regressions or wrong implementations.

Relevant commits:
- 43b373bd04480601bbfe3028fa2d2af4346de6fc
- ce0c7b7d1542661e67986f4c742cc044b9af2120
- 6c90688c597a9d6dc2f65e37e02bdc582b7537a1
- f50738a3de5e1bf24fb7466c6c56325973536e33
- 3ce68adbc9ba715b8234ffb51affc830b0c8df99

Goal: verify that the existing code works as intended for `renderHtml`-based widgets and update subsequent steps to avoid common pitfalls when interacting with AvNav core.

Specific verification areas:

**0a — ExternalWidget rendering path**

Verify that `ExternalWidget.jsx` correctly handles the case where **only** `renderHtml` is provided (no `renderCanvas`). The current code:
- Creates a `<canvas>` element only when `props.renderCanvas` is truthy (line 71): `{props.renderCanvas ? <canvas className='widgetData' ref={canvasRef}></canvas> : null}`
- Renders `UserHtml` when `renderHtml` returns a non-null string (line 72)
- The `useEffect` that calls `renderCanvas` still runs every render cycle even when `renderCanvas` is undefined — verify this causes no side effects

Confirm that the `ClusterRendererRouter` correctly delegates: when the active sub-renderer has only `renderHtml` (no `renderCanvas`), the router must return `undefined` from `renderCanvas` so that `ExternalWidget` does not create a canvas element.

**0b — Widget root marking for HTML-only widgets**

The current `wrapRenderCanvas` in `widget-registrar.js` marks the root element with `[data-dyni]` and applies theme presets. But this only runs inside `wrapRenderCanvas` — it does **not** run for `renderHtml`-only widgets because `wrapWidgetContext` (used for `renderHtml`) does not include root marking.

This means an HTML-only widget will:
- ✗ Not have `[data-dyni]` on its AvNav widget root
- ✗ Not get theme presets applied to its container
- ✗ Not get the native head hidden via `[data-dyni] .widgetHead { display: none !important; }`

Verify this gap and document the fix needed in Step 2.

**0c — Native head hiding**

The current `plugin.css` rule is:
```css
[data-dyni] .widgetHead,
[data-dyni] .valueData {
  display: none !important;
}
```

This depends on `[data-dyni]` being present on the widget root. As noted in 0b, HTML-only widgets won't have this attribute unless root marking is fixed. Verify:
- that the `wantsHideNativeHead` flag flows correctly through `ClusterWidget` → `ClusterRendererRouter` → `widget-registrar.js`
- that the head hiding works for the case where both `renderCanvas` and `renderHtml` are present (current state) but would break for `renderHtml`-only

The correct model is:
- `[data-dyni]` = "this is the actual plugin-owned DOM root"
- `.dyni-hide-native-head` = "hide AvNav's native header on that root" (optional additional marker)
- the runtime applies both markers to the real AvNav root (`.widget` or `.DirectWidget`), not just to the registered className
- for canvas widgets: discover root from `canvas.closest(".widget, .DirectWidget")`
- for HTML widgets: discover root from the `.dyni-htmlWidget` wrapper's `closest(".widget, .DirectWidget")`

Updated CSS (target for Step 2):
```css
[data-dyni].dyni-hide-native-head .widgetHead,
[data-dyni].dyni-hide-native-head .valueData {
  display: none !important;
}
```

**0d — NavPage widget sizing for the plugin**

Verify that current canvas-based dyninstruments widgets size correctly on NavPage:
- In the vertical left panel: canvas fills the flex-allocated space via `[data-dyni] canvas.widgetData { width: 100% !important; height: 100% !important }`
- In horizontal panels: plugin widgets need an explicit `width` rule — check whether current widgets have one or rely on AvNav defaults
- Confirm that `props.mode` is accessible inside `renderCanvas` / `renderHtml` and carries the correct value (`"vertical"`, `"horizontal"`, `"gps"`)

Document what sizing rules are missing for the HTML path and must be added in Step 2.

**0e — Event handler wiring via UserHtml**

Verify that `UserHtml.tsx` correctly translates `onclick="handlerName"` attributes in the HTML string to React synthetic events that call `this.eventHandler["handlerName"]`. Specifically:
- the HTML string contains lowercase `onclick="openActiveRoute"`
- `UserHtml`'s `transform` function matches `node.attribs[k].match(/^on../)` and looks up `context.eventHandler[evstring]`
- the handler is called with `ev.stopPropagation()` and `ev.preventDefault()` — confirm this prevents event bubbling to the AvNav `onItemClick` handler on NavPage (which would cause a double-dispatch or navigation to GpsPage)

**0f — ThemeResolver access without canvas**

The current `ThemeResolver.resolve(canvas)` takes a canvas element and reads computed styles from the canvas ancestor chain. For HTML-only widgets, there is no canvas. Verify:
- whether `ThemeResolver` can accept a non-canvas element (e.g., the HTML wrapper element)
- if not, what adapter is needed in the `initFunction` or `renderHtml` path to provide tokens
- whether tokens can alternatively be exposed as CSS custom properties on the root element (avoiding the need for JS token resolution in the HTML renderer)

Exit criteria for Step 0:
- Each verification area (0a–0f) is documented with pass/fail and any fixes needed
- Subsequent steps are updated to account for discovered issues
- No code changes — this step is analysis only

### Step 1 — Establish `renderHtml` concepts, rules, and documentation boundary

Goal: make the HTML-widget contract explicit before any runtime or renderer migration starts.

Main changes:

- update repo-level rules so future sessions do not treat `renderHtml` as an ad hoc exception:
  - `documentation/core-principles.md`
  - `documentation/conventions/coding-standards.md`
  - `documentation/conventions/smell-prevention.md`
- document the new active-widget architecture:
  - `renderHtml` is for active widgets only
  - string-mode HTML + `this.eventHandler` is the default path
  - store-driven strings must be escaped before interpolation
  - host actions must be capability-gated and marked with `dyni-workaround(avnav-plugin-actions)` where applicable
  - HTML widgets still need a documented root/theme/head-hiding contract
  - `ThemeResolver` owns all look-related tokens and defaults
  - widget-specific CSS is a narrow `renderHtml`-only exception and owns layout/composition only
  - `plugin.css` vs widget-specific CSS ownership must be explicit
  - passive widgets rely on host click semantics; only `dispatch` widgets attach root handlers
- document the NavPage widget sizing contract:
  - `props.mode` is the primary layout signal
  - horizontal panels require explicit width from the plugin
  - vertical panels require HTML content to fill flex-allocated space
  - the HTML wrapper element sizing contract
  - what `resizeElementFont` does and does not do per mode
- add or update discoverable authoring docs:
  - `documentation/avnav-api/plugin-lifecycle.md`
  - `documentation/avnav-api/interactive-widgets.md`
  - `documentation/architecture/component-system.md`
  - `documentation/shared/css-theming.md`
  - `documentation/guides/add-new-text-renderer.md` or a dedicated `add-new-html-widget.md`
  - `documentation/TABLEOFCONTENTS.md`
- define the enforcement plan for future follow-up:
  - if new `check-patterns` rules are added in the same session, wire them here
  - if enforcement is deferred, record the backlog explicitly in `documentation/TECH-DEBT.md`

Exit criteria:

- future `renderHtml` sessions have a written architectural contract before copying the ActiveRoute pilot
- NavPage sizing constraints are documented so renderers don't have to rediscover them
- rule/enforcement gaps are explicit instead of being left implicit in one widget implementation

### Step 2 — Formalize HTML-widget runtime foundation

Goal: make `renderHtml` widgets first-class in runtime and docs before touching ActiveRoute markup.

Main changes:

**2a — Canvas-independent root discovery and marking**

- update `listPluginContainers` in `runtime/init.js` to also discover HTML-only widget roots:
  - currently queries `canvas.widgetData` elements and walks up to `.widget, .DirectWidget`
  - must additionally query `[data-dyni-render="html"]` or `.dyni-htmlWidget` elements
  - or: switch to querying `[data-dyni]` directly if root marking happens before discovery
- update `wrapRenderCanvas` / `wrapWidgetContext` in `runtime/widget-registrar.js`:
  - `renderHtml` wrapper must also mark the AvNav root with `[data-dyni]` and apply theme presets
  - the HTML wrapper element is not available at render time (it's a string); root marking must happen via `initFunction` or a post-render hook
  - alternative: root marking via `renderCanvas` when both render methods are present (current canvas+HTML hybrid), and a new `initFunction`-based path for HTML-only

**2b — Theme token exposure via CSS custom properties**

- expose ThemeResolver-owned visual tokens as CSS custom properties on the widget root element:
  ```css
  [data-dyni] {
    --dyni-fg-color: <resolved text color>;
    --dyni-warning-color: <resolved warning/accent>;
    --dyni-font-weight: <resolved primary weight>;
    --dyni-label-weight: <resolved label weight>;
  }
  ```
- these must be set from JS (via the ThemeResolver resolution) onto the actual DOM element
- component CSS consumes these variables; it never defines fallback token defaults
- this replaces the need for `ThemeResolver.resolve(canvas)` inside HTML renderers

**2c — Native head hiding for HTML-only widgets**

- ensure `[data-dyni]` is present on the AvNav root for HTML-only widgets
- update `plugin.css` to use the compound selector model:
  ```css
  [data-dyni].dyni-hide-native-head .widgetHead,
  [data-dyni].dyni-hide-native-head .valueData {
    display: none !important;
  }
  ```
- the runtime must add `.dyni-hide-native-head` when `wantsHideNativeHead` is true

**2d — NavPage panel sizing foundation in plugin.css**

Add base sizing rules for plugin widgets on NavPage:

```css
/* Horizontal panel width default for plugin widgets */
.widgetContainer.horizontal .widget.dyniplugin {
  width: 7em;  /* match AvNav .smallWidget default; override per-widget in component CSS if needed */
}

/* HTML widget wrapper must fill available flex space */
.dyni-htmlWidget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}
```

These rules go in `plugin.css` because they are plugin-wide concerns, not widget-specific layout.

**2e — Tests**

- add failing tests first for HTML-only root discovery, preset application, and head hiding
- add tests for the sizing rules: verify that `.dyni-htmlWidget` in a flex container fills available space
- verify that `props.mode` is correctly passed through the render chain

Exit criteria:

- an HTML-only widget can be discovered, themed, and styled without a backing canvas
- the widget sizes correctly in all NavPage panel modes (vertical, horizontal) and on GpsPage
- runtime behavior matches the Step 0/1 contract

### Step 3 — Extract shared HTML/view-model primitives

Goal: move ActiveRoute-specific semantics out of the current canvas renderer so the HTML migration is mostly a presenter swap.

Main changes:

- extract ActiveRoute parsing, formatter selection, placeholder handling, and action-capability resolution into a renderer-local helper/view-model first; promote to shared only if later widgets actually reuse the same contract
- add a shared HTML escaping utility for string renderers:
  ```js
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  ```
- keep `plugin.css` limited to shared shell behavior and add renderHtml-only component CSS for ActiveRouteTextHtmlWidget through `config/components.js`
- remove renderer-owned layout-mode decisions from the ActiveRoute view model
- add `mode` from `props.mode` to the view model so it can be set as `data-dyni-mode` on the wrapper
- keep mapper output stable unless Step 1 already removed obsolete hidden ratio editables

Exit criteria:

- ActiveRoute semantic output is testable without canvas drawing
- HTML string rendering has a safe shared escape boundary
- the view model includes `mode` for CSS-based layout switching

### Step 4 — Build `activeRouteInteractive` as parallel HTML renderer

Goal: build the new HTML-based ActiveRoute as a parallel kind alongside the existing canvas widget, without replacing it.

Main changes:

- create `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`:
  - implements `renderHtml(props)` returning an escaped HTML string
  - builds the semantic view model from Step 3
  - sets `data-dyni-mode` from `props.mode`
  - registers `this.eventHandler["openActiveRoute"]` when `actionMode === "dispatch"`
  - does **not** implement `renderCanvas`
- create `widgets/text/ActiveRouteTextHtmlWidget/active-route-html.css`:
  - owns layout/composition for the three mode targets:
    - `[data-dyni-mode="horizontal"]` → compact single-row (fits 4em height)
    - `[data-dyni-mode="vertical"]` → stacked multi-row (fills flex-allocated height in 8.8em wide container)
    - `[data-dyni-mode="gps"]` → full expanded layout
  - uses CSS custom properties from ThemeResolver for colors, fonts, weights
  - handles route-name truncation via `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
  - handles approach accent via `background-color` with alpha on `.dyni-state-approach`
  - handles disconnect overlay positioning
- register in `config/components.js` with CSS dependency:
  ```js
  ActiveRouteTextHtmlWidget: {
    js: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
    css: BASE + "widgets/text/ActiveRouteTextHtmlWidget/active-route-html.css",
    globalKey: "DyniActiveRouteTextHtmlWidget",
    deps: ["ThemeResolver", "TextTileLayout"]
  }
  ```
- register `activeRouteInteractive` kind in `config/clusters/nav.js`:
  ```js
  opt("Active route (interactive)", "activeRouteInteractive"),
  ```
- add routing in `ClusterRendererRouter` and `NavMapper` to direct `activeRouteInteractive` to the new HTML renderer
- **do not touch** the existing `activeRoute` kind or `ActiveRouteTextWidget` canvas renderer

Exit criteria:

- `activeRouteInteractive` is selectable in the AvNav layout editor as a separate instrument kind
- the HTML widget renders correctly in all NavPage panels (vertical left, horizontal top/bottom)
- the HTML widget renders correctly on GpsPage
- visual output matches the existing canvas widget's structure and visible states
- the existing `activeRoute` canvas widget is unchanged and still works

### Step 5 — Add route-editor feature parity and close the pilot

Goal: make the HTML widget behave like core ActiveRoute where the bridge supports it, then lock the pattern for later interactive widgets.

Main changes:

- register a root click handler through `this.eventHandler` only when `actionMode === "dispatch"`
- on `dispatch`, call `this.hostActions.routeEditor.openActiveRoute()`
- on `passive`, do not register a handler, do not install `catchAll`, and rely on host/page click behavior
- on `unsupported`, render passive non-clickable markup
- verify that `UserHtml`'s event handling correctly stops propagation to prevent the NavPage `widgetClick` handler from also firing (which would try to match `item.name === "ActiveRoute"` and fail, then navigate to GpsPage)
- add tests for handler registration, capability gating, and host-action calls
- manually verify `navpage` click behavior in AvNav:
  - clicking `activeRouteInteractive` widget opens route editor
  - clicking the widget on `gpspage` does NOT trigger any action
  - clicking the widget on other pages does nothing
- run the full gate: `npm run check:all`

Exit criteria:

- the interactive HTML widget has full route-editor parity on NavPage
- event bubbling does not cause unintended navigation
- `npm run check:all` passes

### Step 6 — Replace canvas `activeRoute` and clean up

Goal: promote the HTML renderer to be the default `activeRoute` and remove the parallel path.

Main changes:

- update `config/clusters/nav.js`: change `activeRoute` kind to route to `ActiveRouteTextHtmlWidget` instead of `ActiveRouteTextWidget`
- remove the `activeRouteInteractive` kind option (it becomes the new `activeRoute`)
- remove or deprecate `ActiveRouteTextWidget` canvas renderer and `ActiveRouteLayout` canvas layout module (if no longer used by other widgets)
- retire `activeRouteRatioThresholdNormal` / `activeRouteRatioThresholdFlat` editable parameters from the `activeRoute` kind
- remove dead canvas code and unused dependencies
- refresh roadmap/docs so HTML active widgets are a documented extension path
- add or update a dedicated HTML-widget authoring guide and link it from `TABLEOFCONTENTS.md`
- run the full gate: `npm run check:all`

Exit criteria:

- repo docs contain a stable HTML-widget pattern
- ActiveRoute is the reference implementation for future interactive parity widgets
- `npm run check:all` passes
- no orphaned canvas-only code remains for ActiveRoute

## Related

- `ROADMAP.md`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/widgets/active-route.md`
- `runtime/TemporaryHostActionBridge.js`
