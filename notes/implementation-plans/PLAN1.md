# Implementation Plan — `renderHtml` Active Widgets / ActiveRoute Pilot

**Status:** ❌ Not Started | `renderHtml` foundation, ActiveRoute pilot, host-action parity

## Overview

This plan introduces a narrow `renderHtml` path for active widgets, starting with `dyni_Nav_Instruments` `kind: "activeRoute"`.
The pilot must preserve the current ActiveRoute visual contract while adding the core-style route-editor action via `TemporaryHostActionBridge`, without turning HTML into the default renderer path for passive widgets.

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
  - if a runtime size bridge is still needed, it may expose generic size attributes/classes, but it must not become the layout owner

## Proposed Working Model

### Render Path Contract

```text
storeKeys
-> mapper translate()
-> renderer props
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
<div class="dyni-htmlWidget dyni-activeRoute">...</div>
```

- renderer wrapper fills the usable widget area and becomes the only click boundary for widget-owned interactions
- `wantsHideNativeHead: true` remains the way to reclaim full widget space for HTML widgets too

### Theme / CSS Contract

Ownership decision:

- `ThemeResolver` is the single owner of visual-token defaults and preset resolution
- `plugin.css` remains the shared shell layer only
- component CSS files are a narrow exception for `renderHtml` widgets and own only widget composition/layout, truncation, and DOM arrangement

Contract:

- `plugin.css` keeps only plugin-wide shell rules such as font inheritance, root attributes, border behavior, native-head hiding, and shared HTML-widget base selectors
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
- `ActiveRoute` should ship with its own component CSS file registered through `config/components.js`
- this component-CSS exception applies only to `renderHtml` widgets, not to canvas widgets
- component CSS arranges markup; ThemeResolver remains the source of truth for how that markup looks

### Responsive Layout Contract

Ownership decision:

- component CSS owns layout/composition for HTML widgets
- `high` / `normal` / `flat` remain documentation labels for the three compositions, but they are not renderer-owned mode props
- `ThemeResolver` does not encode layout breakpoints or composition switching

Implementation rule:

- `activeRouteRatioThresholdNormal` / `activeRouteRatioThresholdFlat` are retired for the HTML renderer because layout breakpoints become CSS-owned
- if the target browser still needs a runtime size assist, that assist may expose a generic size bucket on the root, but layout rules still live in component CSS
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

Rendering rules:

- `NEXT` tile exists whenever `isApproaching === true`, even if the course value is missing
- disconnect keeps the same tile structure; only values switch to placeholders
- `high` / `normal` / `flat` composition is selected by component CSS, not by the view model
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
- tile order remains semantic and stable; CSS rearranges layout, not JS
- overlay is present only in disconnect mode
- `passive` and `unsupported` markup reuses the same structure but omits `onclick` and the actionable affordance so the host keeps click ownership
- `data-dyni-action-mode` is optional but useful for test assertions and capability-specific styling hooks

## Parity Target

### Visual parity

- Preserve the same data hierarchy: route name + `RTE`, `ETA`, conditional `NEXT`.
- Preserve current mode semantics: tall stacked layout, mixed two-row layout, wide single-row layout.
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
- Step 1 runtime work must explicitly close how HTML widgets get:
  - root detection
  - preset application
  - native-head hiding
  - root-level theme token exposure for HTML CSS consumption
- Retire hidden canvas-only ratio editables for ActiveRoute when the HTML renderer lands.

## Likely Touch Points

- `runtime/init.js`
- `runtime/widget-registrar.js`
- `plugin.css`
- `config/components.js`
- `config/clusters/nav.js`
- `cluster/mappers/NavMapper.js`
- `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js`
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

### Step 0 — Make sure that the already layed foundation is stable

I want to analyze all those commits step by step and search for regressions or wrong implementations.

Relevant commits:
- 43b373bd04480601bbfe3028fa2d2af4346de6fc
- ce0c7b7d1542661e67986f4c742cc044b9af2120
- 6c90688c597a9d6dc2f65e37e02bdc582b7537a1
- f50738a3de5e1bf24fb7466c6c56325973536e33
- 3ce68adbc9ba715b8234ffb51affc830b0c8df99

Goal: make sure that code works like intended for renderHtml based widget. And also update the following Steps to don't run into common errors when interacting with the core project. e.g.:

- either trigger renderCanvas or trigger renderHtml because ExternalWidget als supports both and generates an empty canvas plus the html
- the hiding of the avnav header must work with this concept:
  - [data-dyni] = “this is the actual plugin-owned DOM root”
  - .dyni-hide-native-head = “hide AvNav’s native header on that root”
  - the runtime applies both markers to the real root, not just to the registered className. For canvas widgets that means rediscovering the root from canvas.closest(".widget, .DirectWidget") as before; for HTML widgets, from the .dyni-htmlWidget wrapper. That keeps the new HTML-ready model, but removes the broken assumption that dyniplugin/dyni-hide-native-head already land on the actual AvNav root.

```css
[data-dyni].dyni-hide-native-head .widgetHead,
[data-dyni].dyni-hide-native-head .valueData {
  display: none !important;
}
```
- Make sure that it is clear that visuals follow the ThemeResolver while the components own css only is there for the layout and composition.
- Rewrite this plan to not replace the existing activeRoute but first building a parallel activeRouteInteractive before removing the old canvas widget and refactor the new one.

It is very important that we keep the code clean. 

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
- rule/enforcement gaps are explicit instead of being left implicit in one widget implementation

### Step 2 — Formalize HTML-widget runtime foundation

Goal: make `renderHtml` widgets first-class in runtime and docs before touching ActiveRoute markup.

Main changes:

- remove canvas-only discovery assumptions from theme-preset and root-marking logic
- add a class/attribute contract that lets HTML-only widgets hide native head and receive preset styling
- expose ThemeResolver-owned visual tokens to HTML widgets through root CSS variables without moving token defaults into CSS
- keep the runtime bridge generic: it exposes resolved tokens and root markers, but it does not own widget layout or visual defaults
- add failing tests first for HTML-only root discovery, preset application, and head hiding

Exit criteria:

- an HTML-only widget can be discovered, themed, and styled without a backing canvas
- runtime behavior matches the Step 0 contract

### Step 3 — Extract shared HTML/view-model primitives

Goal: move ActiveRoute-specific semantics out of the current canvas renderer so the HTML migration is mostly a presenter swap.

Main changes:

- extract ActiveRoute parsing, formatter selection, placeholder handling, and action-capability resolution into a renderer-local helper/view-model first; promote to shared only if later widgets actually reuse the same contract
- add a shared HTML escaping utility for string renderers
- keep `plugin.css` limited to shared shell behavior and add renderHtml-only component CSS for ActiveRoute through `config/components.js`
- remove renderer-owned layout-mode decisions from the ActiveRoute view model
- keep mapper output stable unless Step 1 already removed obsolete hidden ratio editables

Exit criteria:

- ActiveRoute semantic output is testable without canvas drawing
- HTML string rendering has a safe shared escape boundary

### Step 4 — Convert ActiveRoute to `renderHtml` with visual parity

Goal: replace the canvas drawing path with DOM markup that reproduces the current widget contract.

Main changes:

- switch `ActiveRouteTextWidget` from `renderCanvas` to `renderHtml`
- render a full-widget DOM root with semantic state classes and scoped component CSS that consumes ThemeResolver-owned tokens
- preserve route name hierarchy, `RTE` / `ETA` / `NEXT` tiles, approach accent, ellipsis, placeholders, and disconnect state
- keep the same passive-vs-dispatch capability split in markup: handler only on `dispatch`, host-owned click flow otherwise
- update ActiveRoute docs to describe the HTML-backed renderer and any retired canvas-only thresholds

Exit criteria:

- ActiveRoute no longer depends on canvas rendering
- HTML output matches the current widget’s structure and visible states across compact, normal, and wide sizes

### Step 5 — Add route-editor feature parity and close the pilot

Goal: make the HTML widget behave like core ActiveRoute where the bridge supports it, then lock the pattern for later interactive widgets.

Main changes:

- register a root click handler through `this.eventHandler` only when `actionMode === "dispatch"`
- on `dispatch`, call `this.hostActions.routeEditor.openActiveRoute()`
- on `passive`, do not register a handler, do not install `catchAll`, and rely on host/page click behavior
- on `unsupported`, render passive non-clickable markup
- add tests for handler registration, capability gating, and host-action calls
- manually verify `navpage` click behavior in AvNav
- remove dead ActiveRoute canvas code and unused dependencies
- refresh roadmap/docs so HTML active widgets are a documented extension path
- add or update a dedicated HTML-widget authoring guide and link it from `TABLEOFCONTENTS.md`
- run the full gate: `npm run check:all`

Exit criteria:

- repo docs contain a stable HTML-widget pattern
- ActiveRoute is the reference implementation for future interactive parity widgets
- `npm run check:all` passes

## Related

- `ROADMAP.md`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/widgets/active-route.md`
- `runtime/TemporaryHostActionBridge.js`
