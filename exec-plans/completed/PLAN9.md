# PLAN9 — Theme Unification and Commit-Driven Surface Rendering

## Status

Final implementation plan.

This plan is prescriptive and implementation-ready.

It defines the target architecture for theme ownership, runtime lifecycle, HTML rendering, canvas compatibility, sizing, styling, host-integration boundaries, and enforcement.

---

## Goal

After completion:

- `ThemeModel` is the only semantic owner of shared theme tokens, defaults, preset metadata, mode-aware overrides, normalization, and output-var metadata.

- `ThemeResolver` is the only shared theme resolver boundary.

- `runtime/theme-runtime.js` is the only theme lifecycle and root-materialization owner.

- `plugin.js` is the sole automatic startup owner.

- startup reads the global preset exactly once from `:root`.

- theme output vars are materialized only on committed `.widget.dyniplugin` roots.

- commit-time root materialization is the only per-root theme apply path.

- dyninstruments owns canonical foreground, background, border, font family, and migrated font weights.

- the host contributes only night-mode state and runtime surface-policy context.

- HTML surfaces are commit-driven, controller-rendered, and shadow-root isolated.

- canvas surfaces continue to use the committed mount model and remain compatible with the new runtime API.

- HTML and canvas both read the same canonical resolved theme.

- migrated CSS consumes only `--dyni-theme-*` outputs for migrated values.

- raw `--dyni-*` vars remain input-only.

- widgets own their vertical height logic completely.

- runtime only requests vertical sizing in vertical mode and materializes the widget-returned height on the inert shell.

- in `.widgetContainer.vertical`, every widget except `RoutePoints` returns ratio-based height from widget code; `RoutePoints` returns natural height from widget code with a viewport cap and width-aware sizing context.

- `shellRect` remains the single authoritative source for committed HTML layout and text sizing.

- there is no init-time root scan, no per-root preset selection, no public imperative theme API, no resolver caching, no surface-level theme invalidation path, and no HTML `UserHtml` event-binding dependency for dyninstruments surfaces.

- no compatibility shim architecture is left behind except the explicitly allowed temporary host-action bridge described below.

---

## In scope

- `shared/theme/*`

- `runtime/theme-runtime.js`

- `runtime/init.js`

- `plugin.js`

- `runtime/component-loader.js`

- component registry assembly and metadata

- `runtime/helpers.js`

- `runtime/TemporaryHostActionBridge.js`

- `cluster/ClusterWidget.js`

- `cluster/rendering/ClusterRendererRouter.js`

- `cluster/rendering/HtmlSurfaceController.js`

- `cluster/rendering/CanvasDomSurfaceAdapter.js`

- widget renderer contracts

- widget sizing/layout contracts

- migrated CSS consumers

- tests, docs, and enforcement/tooling for the rewritten architecture

## Out of scope

- AvNav core changes

- document-level theme observers

- generic stylesheet observers

- live rereading of `:root` preset CSS after startup

- public imperative preset mutation APIs

- host-provided canonical visual fallback tokens

- replacing the entire shared token graph with materialized CSS outputs in this plan

- changing the AvNav `ExternalWidget` / `UserHtml` contract outside the dyninstruments shell it already renders

- CSS-only replacement of current `shellRect`-driven HTML layout/text fitting

---

## Non-negotiable architectural rules

### 1. Single startup preset source

`document.documentElement` is the only legal startup source for `--dyni-theme-preset`.

`user.css` must set the preset on `:root`.

Do not read preset selection from widget roots, `.app`, `.pageFrame`, `body`, `window.DyniPlugin.theme`, settings stubs, or document scans.

### 2. Canonical night-mode detection

Canonical night-mode detection is strict ancestor-based detection from the committed plugin root:

- `getNightModeState(rootEl) => !!rootEl.closest(".nightMode")`

There is no canonical fallback to `document.documentElement` or `body`.

The host contributes only mode state and runtime policy context. It does not contribute canonical colors, borders, or fonts.

### 3. Strict root-only theme resolution

Theme resolution is root-only.

All production theme consumers must resolve the committed `.widget.dyniplugin` root and call `ThemeResolver.resolveForRoot(rootEl)`.

There is no generic fallback mode for canvases, inner HTML nodes, placeholder nodes, shell nodes, or generic `.widget` nodes.

### 4. No compatibility architecture for removed theme/surface/runtime behavior

Do not keep compatibility wrappers for removed theme, resolver, surface, or startup behavior.

Removed architecture must be removed in the same implementation.

#### Explicit temporary exception: `TemporaryHostActionBridge`

`TemporaryHostActionBridge` remains allowed as the one temporary host-integration shim in this plan.

Its charter is narrow:

- it is runtime-owned

- it is the only sanctioned workaround layer for missing AvNav host action APIs

- it must stay outside renderers, helpers, and theme code

- committed renderers must see only normalized runtime callbacks

- no renderer-local React probing, DOM host probing, or duplicate workaround path is allowed

If AvNav later exposes stable host action APIs, this bridge becomes the single replacement point.

### 5. No resolver caching

`ThemeResolver` must not cache by root.

There is no `invalidateRoot()` / `invalidateAll()` API in the rewritten architecture.

### 6. HTML rendering is commit-driven

Dyni HTML surfaces are not pre-commit semantic renderers.

Pre-commit `renderHtml()` returns only inert shell markup.

Authoritative HTML content, `shellRect`-driven layout, text fitting, theme reads, and event binding happen only after commit inside the committed HTML surface lifecycle.

### 7. No AvNav-side code changes

This plan must work without AvNav code changes.

The inert shell continues to be rendered through the existing host path.

Committed dyninstruments HTML content must therefore live in a plugin-owned `ShadowRoot` attached to a stable mount host inside the inert shell.

### 8. Blank first paint is allowed; flat first paint is not

A blank first-paint shell is allowed.

In vertical containers, every widget except `RoutePoints` must already reserve the correct outer height before commit.

For `RoutePoints`, exact width-derived vertical height is allowed to be finalized at first host commit before committed surface attach, because the current host contract does not provide authoritative pre-return shell width.

Height correction must not depend on a semantic post-attach rerender of the committed surface.

### 9. Widget-owned vertical height

In `.widgetContainer.vertical`, widgets own vertical height logic completely.

Runtime does not invent widget sizing math. Runtime only:

- detects that vertical sizing is required

- resolves host-owned sizing context

- requests vertical sizing from the widget

- materializes the widget-returned height on the inert shell at the correct lifecycle point

### 10. Width is always host-defined

Width is always host-defined.

The widget never owns width.

In vertical mode the widget owns height only.

This rule applies to both HTML and canvas.

### 11. Structural reset is host-owned

Committed HTML renderers do not own a separate structural-reset protocol in this plan.

There is no renderer `resetKey()` contract.

Remount happens only when the host/session lifecycle already remounts:

- shell changed

- routed renderer changed

- surface changed

- widget finalized/destroyed

Renderers must patch in place across normal payload changes.

### 12. `shellRect` remains authoritative

`shellRect` remains the single authoritative source for committed HTML layout and text sizing.

Committed HTML renderers may continue to do geometry-driven JS fit/layout based on `shellRect`.

This plan removes the old `triggerResize()` dependency, but it does not replace `shellRect` with CSS-only layout.

There is no standalone observer-driven layout loop in this plan.

---

## Authoritative architecture

### Semantic ownership

- `shared/theme/ThemeModel.js` is the only semantic owner.

- `shared/theme/ThemeResolver.js` is the only shared theme resolver boundary.

- `runtime/theme-runtime.js` is the only runtime lifecycle/apply owner.

### Runtime ownership

- `plugin.js` is the sole automatic startup owner.

- `runtime/init.js` performs startup wiring only and must not self-run.

- `runtime/theme-runtime.js` is loaded by `plugin.js` before `runtime/init.js`.

- `runtime._theme` is internal only and published at `window.DyniPlugin.runtime._theme`.

- theme runtime state is closure-private inside `runtime/theme-runtime.js`, not stored on `window.DyniPlugin.state`.

- `TemporaryHostActionBridge` is runtime-owned and injected into normalized surface policy.

### Surface ownership

- `ClusterRendererRouter` owns route resolution, shell assembly, pre-commit vertical sizing requests/materialization, first-commit `RoutePoints` sizing exception handling, and surface-policy resolution.

- `HtmlSurfaceController` owns committed HTML mount/update/detach/destroy, shadow-root creation, shadow-style injection, committed renderer lifecycle, `shellRect` measurement source selection, and bounded post-patch relayout.

- `CanvasDomSurfaceAdapter` owns committed canvas mount/update/detach/destroy.

- `ClusterWidget` owns commit ordering and calls theme materialization before surface reconciliation.

### Visual ownership

Dyninstruments owns canonical defaults and canonical resolution for:

- `surface.fg`

- `surface.bg`

- `surface.border`

- `font.family`

- `font.weight`

- `font.labelWeight`

- existing shared token groups such as `colors.*`, `radial.*`, `linear.*`, and `xte.*`

The host provides only:

- day/night state via `getNightModeState(rootEl)`

- runtime surface policy context such as page identity and container orientation

- normalized host action callbacks via runtime-owned bridge/policy plumbing

- host-owned box facts such as committed shell width where required for sizing

The host must not provide canonical theme fallback values through inherited color, inherited font-family, host border styles, or host CSS vars such as `--instrument-fg`.

---

## Theme model

Theme resolution has two axes:

1. preset family
   
   - `default`
   
   - `slim`
   
   - `bold`
   
   - `highcontrast`

2. mode
   
   - `day`
   
   - `night`

`night` is not a legal preset family.

If `--dyni-theme-preset: night` is provided, normalization maps it to `default`.

The former night theme values become `default` family night-mode overrides.

---

## ThemeModel contract

`ThemeModel` is a direct module API.

It must not export `create()`.

It is the sole owner of:

- token metadata

- token paths

- input-var names

- output-var names for materialized tokens

- base defaults

- mode-aware defaults

- preset family definitions

- mode-aware family overrides

- preset normalization helpers

- supported preset-name metadata

- merge-order metadata used by `ThemeResolver`

### Token metadata shape

Use one authoritative metadata model.

Each token entry must carry:

- `path`

- `inputVar`

- optional `outputVar`

- `type`

- `default`

- optional `defaultByMode`

Each preset entry must carry:

- `base`

- optional `day`

- optional `night`

### ThemeModel exports

`ThemeModel` must export helpers for:

- preset normalization

- supported preset names

- token lookup by path

- output token listing

- merge-order metadata

---

## Theme token and preset contract

### Public shared input vars for migrated visual tokens

The shared input API for migrated visual tokens is:

- `--dyni-fg`

- `--dyni-bg`

- `--dyni-border`

- `--dyni-font`

- `--dyni-font-weight`

- `--dyni-label-weight`

Remove from the shared theme API:

- `--dyni-border-day`

- `--dyni-border-night`

Other shared inputs remain in `ThemeModel`, including:

- `colors.*`

- `radial.*`

- `linear.*`

- `xte.*`

Widget-local layout vars remain outside the shared theme model.

### Mandatory materialized output vars

The first-pass output set is exactly:

- `--dyni-theme-surface-fg`

- `--dyni-theme-surface-bg`

- `--dyni-theme-surface-border`

- `--dyni-theme-font-family`

- `--dyni-theme-font-weight`

- `--dyni-theme-font-label-weight`

These outputs are mandatory.

They must be overwritten on every apply.

### Canonical default family day-mode baseline

The `default` family day-mode baseline is:

- `surface.fg = black`

- `surface.bg = white`

- `surface.border = rgba(0, 0, 0, 0.30)`

- `font.family = "Inter", "SF Pro Text", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Ubuntu, Cantarell, "Liberation Sans", Arial, system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`

- `font.weight = 700`

- `font.labelWeight = 700`

### Preset families and overrides

The `default` family has no base overrides. All tokens resolve to global base defaults.

The `slim` family base overrides are:

- `radial.ring.arcLineWidth = 1`

- `radial.ticks.majorWidth = 2`

- `radial.ticks.minorWidth = 1`

- `radial.pointer.widthFactor = 0.72`

- `linear.track.lineWidth = 1`

- `linear.ticks.majorWidth = 2`

- `linear.ticks.minorWidth = 1`

- `linear.pointer.widthFactor = 0.72`

- `font.labelWeight = 400`

- `xte.lineWidthFactor = 1`

The `bold` family base overrides are:

- `radial.ring.arcLineWidth = 2.5`

- `radial.ticks.majorWidth = 4`

- `radial.ticks.minorWidth = 2`

- `radial.pointer.widthFactor = 1.54`

- `linear.track.lineWidth = 2.5`

- `linear.ticks.majorWidth = 4`

- `linear.ticks.minorWidth = 2`

- `linear.pointer.widthFactor = 1.54`

- `xte.lineWidthFactor = 2`

The `highcontrast` family base overrides are:

- `colors.pointer = #ff0000`

- `colors.warning = #ffcc00`

- `colors.alarm = #ff3300`

- `radial.ring.arcLineWidth = 2`

- `radial.ticks.majorWidth = 3`

- `radial.ticks.minorWidth = 2`

- `radial.pointer.widthFactor = 1.4`

- `linear.track.lineWidth = 2`

- `linear.ticks.majorWidth = 3`

- `linear.ticks.minorWidth = 2`

- `linear.pointer.widthFactor = 1.4`

- `xte.lineWidthFactor = 1.3`

No family other than `default` defines mode-specific overrides in this plan.

### Default family night-mode overrides

The `default` family `night` override set is:

- `surface.fg = rgba(252, 11, 11, 0.60)`

- `surface.bg = black`

- `surface.border = rgba(252, 11, 11, 0.18)`

- `colors.pointer = #cc2222`

- `colors.warning = #8b6914`

- `colors.alarm = #992222`

- `colors.laylineStb = #3d6b3d`

- `colors.laylinePort = #8b3333`

No night override exists for `font.family`, `font.weight`, `font.labelWeight`, or any `radial.*`, `linear.*`, or `xte.*` token.

### Family + mode composition rule

Mode composes on top of family selection.

For any token, given the active preset family and the current mode:

1. the active family's current-mode override wins if defined

2. otherwise the active family's base override wins if defined

3. otherwise the global current-mode default wins if defined

4. otherwise the global base default applies

This means that a non-default family such as `slim` at night inherits global night defaults for every token it does not override itself, while its own base overrides still apply for the tokens it does override. Explicit CSS input overrides on the plugin root take priority over all four layers above.

### Resolution order

Resolution order for a token is:

1. explicit root CSS input override from the strict plugin root

2. active preset current-mode override

3. active preset base override

4. global current-mode default

5. global base default

Night mode is determined only by `getNightModeState(rootEl)`.

---

## ThemeResolver contract

`ThemeResolver` is a direct module API.

It must not export `create()`.

It resolves tokens only.

It must not write DOM state.

DOM writes belong only to `runtime._theme.applyToRoot(rootEl)`.

### Strict root contract

`ThemeResolver.resolveForRoot(rootEl)` requires a real committed `.widget.dyniplugin` root.

It must throw if:

- `rootEl` is missing

- `rootEl` is not an element

- `rootEl` is not the plugin widget root

### Runtime configuration contract

`runtime._theme` configures `ThemeResolver` with:

- `ThemeModel`

- `getNightModeState`

- internal `getActivePresetName()`

- pure helpers needed for CSS input reads

Call sites remain on the simple public API:

- `ThemeResolver.resolveForRoot(rootEl)`

### No caching

`ThemeResolver` must not cache resolved themes by root.

No invalidation API exists.

---

## Strict root discovery

`runtime/helpers.js` must expose:

- `Helpers.requirePluginRoot(target)`

This helper is the mandatory theme-root discovery path.

### Contract

`Helpers.requirePluginRoot(target)` must:

- accept an element, `ShadowRoot`, event target, canvas element, or node inside committed HTML

- resolve the nearest committed `.widget.dyniplugin` root through the composed tree

- cross shadow boundaries by walking from a `ShadowRoot` to `shadowRoot.host`

- throw if no committed plugin root exists

Do not use generic fallback patterns such as `Helpers.resolveWidgetRoot(x) || x` for theme resolution.

`Helpers.resolveWidgetRoot(...)` may remain only for non-theme generic host logic if still needed elsewhere, but it must not be used for theme resolution.

Remove helper APIs that own canonical theme semantics:

- `Helpers.resolveTextColor()`

- `Helpers.resolveFontFamily()`

All production theme consumers must follow:

```js
const rootEl = Helpers.requirePluginRoot(target);
const theme = ThemeResolver.resolveForRoot(rootEl);
```

---

## Component system changes

### API shape support

The component loader and registry must support two explicit API shapes:

- `apiShape: "factory"`

- `apiShape: "module"`

Behavior:

- `factory` requires `create()`

- `module` requires a direct module API and must not require `create()`

Only these components use `apiShape: "module"` in this plan:

- `ThemeModel`

- `ThemeResolver`

All other components remain factory-shaped.

### CSS loading model

This plan does not introduce a generic `global | shadow` ownership framework.

Instead it uses a strict two-bucket rule:

- `plugin.css` remains global

- committed HTML renderer CSS is shadow CSS

Behavior:

- global CSS keeps the current document-level `<link>` loading behavior

- committed HTML renderer CSS must not be auto-linked into `document.head`

- runtime must fetch and cache shadow CSS as text for later shadow-root injection

### Shadow CSS preload rule

Committed HTML renderer CSS must be preloaded and cached as text before first committed HTML mount.

`HtmlSurfaceController` remains synchronous.

It must never mount committed HTML first and inject widget shadow styles later.

If required shadow CSS cannot be preloaded, widget startup must fail loudly rather than silently mounting unstyled content.

### Renderer CSS declaration rule

Each committed HTML renderer must explicitly declare its shadow CSS bundle, for example:

- `shadowCss: ["RoutePointsTextHtmlWidget.css"]`

Runtime preloads these files once and injects only the active renderer’s bundle into that renderer’s shadow root.

Do not inject every HTML widget stylesheet into every shadow root.

### Shadow CSS rewrite rule

Current light-DOM widget CSS must be rewritten for shadow-local use.

Each committed HTML widget stylesheet must:

- be rooted at an internal shadow class such as `.dyni-html-root`

- not depend on outer document ancestry such as `.widget.dyniplugin`, `.widgetContainer.vertical`, or page-root selectors

- consume mirrored context classes or data attributes set inside the shadow tree

### Registry changes

- register `ThemeModel` and `ThemeResolver` as module-shaped components

- register committed HTML renderers with explicit `shadowCss` bundle declarations

- keep light-DOM shell/root CSS in global `plugin.css`

---

## Runtime lifecycle

### Bootstrap ownership

`plugin.js` is the sole automatic startup owner.

`plugin.js` must:

1. load internal scripts in authoritative order

2. load `runtime/theme-runtime.js` before `runtime/init.js`

3. call `window.DyniPlugin.runtime.runInit()` exactly once after internal scripts load

`runtime/init.js` must not self-run.

### Startup sequence

1. `plugin.js` loads internal scripts, including `runtime/theme-runtime.js` before `runtime/init.js`.

2. `plugin.js` calls `window.DyniPlugin.runtime.runInit()` exactly once.

3. `runtime/init.js` eager-loads `ThemeModel` and `ThemeResolver` through the component loader.

4. `runtime/init.js` reads `--dyni-theme-preset` exactly once from `document.documentElement`.

5. `runtime/init.js` normalizes the preset name via `ThemeModel`.

6. `runtime/init.js` configures `runtime._theme`.

7. `runtime._theme` configures `ThemeResolver`.

8. startup preloads shadow CSS text required by registered committed HTML renderers.

9. startup does not enumerate plugin roots.

10. startup does not apply per-root theme state.

### Preset ingestion rule

The global preset contract is:

- read `--dyni-theme-preset` once from `:root`

- normalize and store it in `runtime._theme`

- do not live-reread CSS on every commit

- changes to `user.css` continue to follow the normal plugin reload/manual-refresh workflow

There is no public imperative preset API in this plan.

---

## Commit-time theme materialization

Commit-time application is the only per-root apply path.

### Authoritative commit sequence

Every commit must follow this order:

1. AvNav commit yields the real committed plugin root and shell.

2. `ClusterWidget` receives the commit payload in `HostCommitController.onCommit`.

3. `ClusterWidget` calls `runtime._theme.applyToRoot(rootEl)`.

4. `runtime._theme.applyToRoot(rootEl)` resolves the canonical theme and overwrites the six output vars on `rootEl.style`.

5. any first-commit shell sizing exception work runs, including width-derived `RoutePoints` vertical shell sizing when applicable.

6. `surfaceSessionController.reconcileSession(...)` runs.

7. committed HTML or canvas surface reconciliation proceeds against a root whose theme vars already exist.

Do not add a theme-change detection gate before apply.

Apply on every commit.

### Output scope and ownership

Materialized outputs exist only as inline style on committed `.widget.dyniplugin` roots.

Do not define stylesheet defaults for `--dyni-theme-*` outputs.

Do not write outputs to shell nodes, document root, `body`, generic `.widget`, or AvNav namespaces.

---

## Surface policy model

Runtime must centralize page-dependent surface policy resolution.

Widgets and committed renderers must not call host capability APIs directly.

Runtime resolves one normalized surface policy object per surface/update.

### Surface policy contents

At minimum the policy object must contain:

- `pageId`

- `containerOrientation`

- `interaction.mode`

- normalized action callbacks already bound to the current page/context

- any additional host facts required for rendering, layout, or placeholder behavior

### Pre-commit vertical-context source

The authoritative pre-commit source for vertical context is host props:

- `surfacePolicy.containerOrientation = "vertical"` when `props.mode === "vertical"`

- otherwise non-vertical

Committed DOM checks such as `.widgetContainer.vertical` are not canonical for sizing or policy resolution.

They may remain only for post-commit DOM effects or migration assertions.

### Interaction model

The HTML interaction contract is binary:

- `interaction.mode = "dispatch" | "passive"`

Behavior:

- `dispatch`
  
  - attach listeners
  
  - claim click ownership for the whole widget surface
  
  - suppress blank-space click propagation inside the widget surface
  
  - stop propagation / prevent default where required
  
  - dispatch host actions through normalized callbacks

- `passive`
  
  - do not attach action listeners
  
  - do not claim click ownership
  
  - render as visible, non-interactive content

Do not keep a separate `unsupported` mode in the committed HTML surface contract.

Keep page/context facts such as `pageId` separately where they affect visible rendering.

### `editroutepage` RoutePoints dispatch gating

On `editroutepage`, `RoutePoints` may resolve to `interaction.mode = "dispatch"` only when runtime can positively verify that the full parity-preserving host dispatch path is available for the current page context.

If parity prerequisites cannot be verified, runtime must resolve the surface as `passive`.

Fail-closed behavior still applies if a dispatch-capable policy later encounters an unexpected parity mismatch at dispatch time, but the normal degraded state is passive, not clickable-error behavior.

---

## Vertical sizing architecture

### Cross-surface rule

Outside `.widgetContainer.vertical`, the host defines widget dimensions.

Inside `.widgetContainer.vertical`:

- host owns width

- widget owns height

- the inert shell must reserve that height at the correct lifecycle point

This is true for both HTML and canvas.

### Widget-owned API

Every widget that can render in vertical mode must expose:

```js
getVerticalShellSizing(sizingContext, surfacePolicy)
```

This API is called only in vertical mode.

Runtime/router must not call it outside vertical mode.

### Sizing context contract

The sizing API consumes:

- `payload`: the same normalized payload the committed renderer receives

- `shellWidth`: authoritative host-owned shell width when available

- `viewportHeight`: authoritative viewport height for cap policies

`viewportHeight` is runtime-owned and centrally resolved from the browser viewport. Widgets may not read DOM to derive this sizing.

`shellWidth` may be unavailable before commit under the current host contract. Ratio-based vertical sizing must not require a pre-commit numeric shell width.

### Return contract

The only legal return shapes are:

```js
{ kind: "ratio", aspectRatio: number }
```

or:

```js
{ kind: "natural", height: string }
```

Runtime does not parse, reinterpret, or derive alternate formulas from `height`.

Materialization is determined only by `kind`:

- `{ kind: "ratio", aspectRatio }` is materialized on the inert shell through CSS `aspect-ratio`

- `{ kind: "natural", height }` is materialized on the inert shell through explicit CSS `height`

Runtime must not convert ratio sizing into a derived explicit pre-commit height.

### Initial widget-owned implementations in this plan

The first implementation round uses these widget-owned height policies:

- radial widgets return ratio sizing with aspect ratio `1`

- linear widgets return ratio sizing with aspect ratio `2`

- `ActiveRouteTextHtmlWidget` returns ratio sizing with aspect ratio `2`

- `MapZoomTextHtmlWidget` returns ratio sizing with aspect ratio `2`

- `ThreeValueTextWidget` returns ratio sizing with aspect ratio `2`

- `PositionCoordinateWidget` returns ratio sizing with aspect ratio `2`

- `XteDisplayWidget` returns ratio sizing with aspect ratio `2`

- `EditRouteTextHtmlWidget` returns ratio sizing with aspect ratio `7 / 8`

- `AisTargetTextHtmlWidget` returns ratio sizing with aspect ratio `7 / 8`

- `CenterDisplayTextWidget` returns ratio sizing with aspect ratio `7 / 8`

- `RoutePoints` returns natural height from widget code, capped in vertical mode by `60vh`, using width-aware sizing context

These values live in widget code, not in runtime tables.

### RoutePoints

`RoutePoints` is the only width-derived natural-height widget in this plan.

Its `getVerticalShellSizing(sizingContext, surfacePolicy)` computes natural height from:

- `payload` facts such as route point count, header visibility, spacing and row-height policy inputs

- authoritative `shellWidth`

- authoritative `viewportHeight`

It then returns a natural CSS height string that already includes the viewport cap policy.

The current cap remains `60vh` unless intentionally changed in implementation.

### Pre-commit shell materialization

Vertical sizing is a shell contract.

For all ratio-based widgets, runtime must request `getVerticalShellSizing(...)` and materialize the result on the inert light-DOM shell before `renderHtml()` returns by applying CSS `aspect-ratio` to the shell.

Runtime must not convert ratio sizing into an explicit pre-commit `height`.

For `RoutePoints`, exact width-derived vertical height is allowed to be materialized at first host commit before committed surface attach, because authoritative width is not available earlier under the current host contract.

`RoutePoints` remains the only width-derived natural-height exception in this plan.

---

## Route and renderer contracts

### Shell vs committed-renderer split

HTML route specs must be split into two distinct boundaries:

1. a minimal shell spec for pre-commit inert markup

2. a committed renderer factory for post-commit DOM ownership

### Shell spec

The shell spec owns only:

- inert shell class/id metadata

- stable empty mount-host structure

- pre-commit shell sizing materialization when available at that stage

The inert shell must remain payload-invariant apart from stable route/surface metadata and sizing state.

It must not own:

- semantic widget content

- event handlers

- fit/layout logic

- theme reads

### Committed renderer factory

The committed renderer factory creates the committed DOM renderer instance used by `HtmlSurfaceController`.

It owns:

- shadow-root subtree creation

- in-place DOM patching

- direct listener binding

- theme consumption

- `shellRect`-driven layout and fit logic

- mirrored context classes/attributes inside shadow DOM

- bounded post-patch measurement/effects

`ClusterRendererRouter.renderHtml()` uses only the shell spec.

Committed renderer instances must be passed through the committed-surface session path.

---

## HTML renderer architecture

### High-level model

Dyni committed HTML surfaces render into a `ShadowRoot` attached to a stable light-DOM mount host inside the inert shell.

AvNav continues to own only the outer inert light-DOM shell.

Dyni owns the committed shadow subtree.

### Inert shell contract

The inert shell must include a dedicated stable empty light-DOM mount host, such as:

- `.dyni-surface-html`

- `.dyni-surface-html-mount`

The inert shell remains payload-invariant apart from stable route/surface metadata and sizing state.

`HtmlSurfaceController.attach()` finds the mount host and creates or reuses one `ShadowRoot` there.

Blank first-paint shells are allowed.

### Authoritative `shellRect` source

Committed HTML `shellRect` is measured from the dedicated light-DOM mount host.

That mount host must be box-equivalent to the usable shell content area.

Committed renderers must not measure the outer shell directly unless the shell and mount host are guaranteed box-identical by contract.

### Committed renderer lifecycle

Committed HTML renderers are DOM-first renderer instances.

They must not rely on:

- pre-commit `renderHtml()` as their semantic rendering API

- `namedHandlers()`

- `initFunction()`

- `UserHtml` event translation

The committed renderer instance contract is:

- `mount(mountEl, payload)`

- `update(payload)`

- `postPatch(payload)`

- `detach(reason)`

- `destroy()`

- optional `layoutSignature(payload)`

### Update model

The default update model is:

- mount once

- patch DOM in place on update

- remount only when the host/session lifecycle remounts because shell/renderer/surface ownership changed

Do not replace the entire committed subtree on every update.

There is no renderer-owned structural-reset discriminator in this plan.

### Layout signature

Committed HTML renderers may expose a cheap `layoutSignature(payload)`.

`HtmlSurfaceController.update()` compares the signature:

- changed → rerun layout/fit, then patch DOM

- unchanged → patch content/state only

This replaces the old meaning of `resizeSignature()`.

### Post-patch effects and relayout

Committed renderers may need committed-DOM measurements or side effects after patch.

`postPatch(payload)` exists for:

- measuring committed DOM facts

- computing follow-up layout facts

- applying imperative effects such as scroll reveal

The post-patch contract is bounded:

- at most one additional internal relayout pass per mount/update cycle

- no unbounded rerender loops

This preserves current `shellRect`-driven fit behavior without a standalone resize lifecycle.

### Event ownership

Dyni HTML surfaces do not use AvNav `UserHtml` event binding as their interaction mechanism.

Remove dependence on:

- `namedHandlers()`

- `catchAll`

- `onclick="handlerName"`-style handler registration

- pre-render handler registration for dyninstruments HTML surfaces

Committed HTML renderers attach and remove direct DOM listeners themselves, under control of the runtime surface policy.

### Blank-space click suppression parity

In `interaction.mode = "dispatch"`, committed HTML renderers must install a wrapper-level click suppressor so blank-space clicks inside the widget surface do not leak into host panel actions.

In `interaction.mode = "passive"`, no suppressor is installed.

This is the authoritative replacement for current `catchAll` behavior.

### Styling ownership

Committed HTML widget styles are shadow-local.

Global selectors must not be relied on to style committed HTML content.

Outer document selectors such as `#navpage`, `.widgetContainer.vertical`, or ancestry under `.widget.dyniplugin` must not be part of the committed HTML style contract.

Required outer context must be mirrored into committed renderer state and reflected inside the shadow tree as explicit classes or attributes.

At minimum, mirrored context must cover `pageId` and vertical-orientation context anywhere those facts affect rendering or styling.

### Shadow style loading

Shadow styles are runtime-owned cached text assets.

The runtime must cache CSS text for committed HTML renderer styles before first mount and inject them into the shadow root on mount.

Global CSS continues to style only:

- plugin root

- inert shell

- light-DOM mount hosts

- other non-shadow surfaces

---

## RoutePoints interaction parity

`RoutePoints` must not lose functional parity with the host RoutePoints widget.

### Normalized callback contract

The normalized runtime callback contract is:

```js
hostActions.routePoints.activate({ index, pointSnapshot })
```

where:

- `index` is the selected row index

- `pointSnapshot` is the parity-preserving row snapshot from normalized widget payload

### RoutePoints parity snapshot contract

`RoutePoints` normalized payload must carry a host-shape parity snapshot for each row.

At minimum preserve:

- `idx`

- `name`

- `lat`

- `lon`

- `routeName`

and preserve when available:

- `course`

- `distance`

- `selected`

The bridge must not attempt late reconstruction from a thinner display-only model.

### Runtime ownership

Committed HTML renderers do not inspect host page state or React internals.

They only call the normalized runtime callback.

`TemporaryHostActionBridge` owns host-specific lookup and dispatch.

### EditRoute parity rule

On `editroutepage`, `routePoints.activate(...)` must be parity-preserving.

Runtime may resolve `interaction.mode = "dispatch"` there only when it can positively verify that the full parity-preserving host dispatch path is available for the current page context.

If runtime cannot verify those prerequisites, the surface must resolve as `passive`.

It must:

- construct or forward a host-compatible route-point object from `pointSnapshot`

- dispatch through the page `onItemClick` / `widgetClick` path with synthetic AvNav payload

- set `avnav.item.name = "RoutePoints"`

- set `avnav.point` to the host-compatible route-point object

This preserves the host page’s existing semantics for:

- selection

- recentering

- second-click dialog opening

### No fallback on `editroutepage`

On `editroutepage`, if full parity dispatch cannot be achieved after dispatch capability was granted, the bridge must fail closed.

Do not silently fall back to a lower-fidelity relay path there.

The normal degraded state when prerequisites cannot be proven is `passive`, not clickable-error behavior.

### Other pages

On other pages, route-point interaction continues to flow through normalized surface policy and bridge capabilities.

The committed HTML contract remains binary `dispatch | passive`.

Host-specific capability checks remain runtime-owned.

---

## Canvas compatibility and migration

Canvas surfaces remain on the committed mount model.

The HTML renderer rewrite does not require a separate canvas lifecycle rewrite.

However, canvas must migrate to the same runtime/theme architecture.

### Canvas rules

- canvas shells remain inert light-DOM shells

- `CanvasDomSurfaceAdapter` remains the owner of the real `<canvas>` after commit

- in vertical containers, canvas shells must receive pre-commit height materialization from the central widget-owned sizing resolver, just like HTML shells

- the first canvas paint must occur against a committed root whose theme vars have already been materialized

### Canvas cleanup required in this plan

- remove `invalidateTheme()` from `CanvasDomSurfaceAdapter`

- remove `invalidateTheme()` from `ClusterRendererRouter`

- remove resolver cache invalidation calls

- migrate `ThemeResolver` usage to the direct module API

- migrate strict theme-root discovery to `Helpers.requirePluginRoot(target)`

- remove helper fallback theme APIs from canvas paths

- ensure canvas renderers read canonical resolved theme values rather than helper fallbacks

---

## CSS and consumer contract

### Vertical shell CSS ownership rule

In vertical mode, the outer inert shell owns the reserved height.

Shared shell CSS must not override runtime-owned vertical shell sizing with unconditional fill rules such as `height: 100% !important` on `.widgetData.dyni-shell`.

Inner surface and mount descendants may still use fill behavior within the reserved shell.

Outside vertical mode, non-vertical shells may continue to use fill behavior.

### Inputs

Raw `--dyni-*` vars remain input-only.

They are read from the strict committed plugin root’s computed style by `ThemeResolver`.

### Outputs

Materialized `--dyni-theme-*` vars are runtime-owned and written only as inline style on committed `.widget.dyniplugin` roots.

### Root surface consumer rule

The plugin root is the canonical CSS consumer for the surface layer:

```css
.widget.dyniplugin {
  color: var(--dyni-theme-surface-fg);
  background-color: var(--dyni-theme-surface-bg);
  border-color: var(--dyni-theme-surface-border);
  font-family: var(--dyni-theme-font-family);
}
```

This must remain strictly scoped to plugin roots.

### Typography weight consumer rule

`.widget.dyniplugin` sets only `font-family` at the root.

It must not set one global `font-weight`.

All HTML widget CSS weight declarations must migrate from raw inputs to output vars:

- `--dyni-font-weight` → `--dyni-theme-font-weight`

- `--dyni-label-weight` → `--dyni-theme-font-label-weight`

### Shadow CSS rule

Committed HTML shadow CSS consumes theme outputs via inherited CSS custom properties from the plugin root.

Committed HTML shadow CSS must not read raw `--dyni-*` inputs for migrated values.

### Canvas and JS consumer rule

Canvas and JS consumers must read the canonical resolved theme from `ThemeResolver`.

They must not read canonical foreground/font values from helper fallback APIs.

---

## Removed architecture

Remove all of the following everywhere in production code, docs, tests, and enforcement tooling:

- `ThemePresets`

- `ThemeResolver.create(...)`

- `data-dyni-theme`

- per-root preset selection

- init-time root scans for theme application

- `window.DyniPlugin.theme`

- settings-stub theme reads

- public `applyThemePreset*` APIs

- `--dyni-border-day`

- `--dyni-border-night`

- helper fallback theme APIs

- resolver cache invalidation APIs

- generic theme-consumer fallback patterns such as `Helpers.resolveWidgetRoot(x) || x`

- documentElement/body night-mode contracts

- HTML `namedHandlers()` as the dyninstruments interaction path

- HTML `initFunction().triggerResize()` shims

- surface `invalidateTheme()` APIs

- HTML dependence on AvNav `UserHtml` event translation for dyninstruments-owned interactions

- any generic “inject all CSS into every shadow root” behavior

Do not remove the explicitly sanctioned `TemporaryHostActionBridge` runtime facade described above.

---

## Implementation phases

### Phase 1 — Theme core rewrite

Intent: establish one semantic theme owner, one resolver boundary, and one runtime theme lifecycle.

Deliverables:

- create `shared/theme/ThemeModel.js` as the sole semantic owner

- remove `ThemePresets`

- make `ThemeModel` a direct module API

- make `ThemeResolver` a direct module API

- remove resolver caching and invalidation APIs

- encode preset normalization, supported families, token metadata, default baselines, mode overrides, and output metadata in `ThemeModel`

- replace split border inputs with a single shared `--dyni-border`

- bring `surface.bg` into scope as a canonical token

- add explicit `apiShape: "module" | "factory"` support to the loader/registry

- register `ThemeModel` and `ThemeResolver` as `apiShape: "module"`

Exit conditions:

- `ThemeModel` is the only semantic owner

- `ThemeResolver` no longer duplicates semantic ownership tables

- `ThemeResolver` no longer exports or relies on `create()`

- resolver caching is gone

### Phase 2 — Runtime lifecycle rewrite

Intent: make startup and commit-time theme application deterministic and internal.

Deliverables:

- add `runtime/theme-runtime.js`

- make `plugin.js` the sole automatic startup owner

- remove `runtime/init.js` self-invocation

- `runtime/init.js` eager-loads `ThemeModel` and `ThemeResolver`

- `runtime/init.js` reads `--dyni-theme-preset` once from `document.documentElement`

- preload required committed HTML shadow CSS text during startup/component load

- add runtime support to fetch/cache shadow CSS text without globally linking it

- remove settings-stub/theme-global/document-scan startup behavior

- configure `runtime._theme` as the sole theme runtime boundary

- in `ClusterWidget`, call `_theme.applyToRoot(rootEl)` in `HostCommitController.onCommit` before `surfaceSessionController.reconcileSession(...)`

- apply theme outputs unconditionally on every commit

Exit conditions:

- startup reads preset once from `:root`

- commit-time root application is the only per-root theme apply path

- no init-time root scan remains

- no public imperative preset API exists

### Phase 3 — Surface policy and sizing architecture

Intent: centralize host policy and pre-commit sizing without taking widget-specific height logic away from widgets.

Deliverables:

- add centralized surface-policy resolution in runtime/router

- collapse HTML interaction mode to `dispatch | passive`

- keep `pageId` and other host facts separate from interaction mode

- make `props.mode === "vertical"` the canonical pre-commit vertical-context source

- add widget-owned `getVerticalShellSizing(sizingContext, surfacePolicy)` for all widgets that render in vertical mode

- define sizing context as normalized payload + `shellWidth` + `viewportHeight`

- add central pre-commit shell sizing request/materialization

- materialize ratio sizing on inert shells through CSS `aspect-ratio` and natural sizing through explicit CSS `height`

- update shell CSS so vertical shells can own reserved height and inner descendants can fill within that shell

- keep ratio-based height for all widgets except `RoutePoints`

- keep width-aware natural-height-with-cap for `RoutePoints`

- implement the `RoutePoints` first-commit width-derived sizing exception before surface attach

Exit conditions:

- widgets no longer call host capability APIs directly for rendering decisions

- inert shells reserve correct vertical size at the required lifecycle point

- width remains host-owned

- widget height logic remains widget-owned

### Phase 4 — HTML renderer architecture rewrite

Intent: replace pre-commit semantic HTML rendering with committed shadow-root DOM ownership.

Deliverables:

- split HTML route specs into shell spec + committed renderer factory

- make pre-commit `renderHtml()` return inert shell markup only

- keep the inert shell payload-invariant apart from stable route/surface metadata and sizing state

- add dedicated HTML light-DOM mount hosts inside the shell

- define the mount host as the authoritative `shellRect` measurement source

- attach committed HTML rendering to a `ShadowRoot` on the mount host

- move dyninstruments HTML interaction ownership to direct DOM listeners

- implement dispatch-mode whole-surface click suppression parity

- remove `namedHandlers()`, `catchAll`, and `onclick="handlerName"` dependence for dyninstruments HTML surfaces

- make committed HTML renderers DOM-first instances with `mount/update/postPatch/detach/destroy`

- keep in-place DOM patching as the default update path

- introduce `layoutSignature(payload)` for committed HTML renderers

- implement bounded post-patch relayout/effects with at most one extra pass

- move committed HTML widget CSS to shadow-local assets and inject cached CSS text into the shadow root

- mirror required outer context into explicit shadow-visible classes/attributes

Exit conditions:

- first real HTML content is rendered only after commit inside the shadow root

- dyninstruments HTML interaction no longer depends on AvNav `UserHtml` event binding

- committed HTML styles are shadow-local and isolated

- HTML fit/layout runs only in the committed lifecycle using `shellRect`

- no renderer-owned reset contract exists beyond the host/session remount path

### Phase 5 — Canvas migration and helper cleanup

Intent: keep canvas compatible with the new runtime architecture and remove shared helper/theme cleanup debt.

Deliverables:

- migrate canvas theme reads to strict root-only resolution

- remove `invalidateTheme()` from canvas/surface/router code

- remove resolver invalidation calls

- remove helper fallback theme APIs from production use

- implement composed-tree-aware `Helpers.requirePluginRoot(target)`

- ensure canvas respects central pre-commit shell sizing in vertical containers

Exit conditions:

- canvas works with the new runtime/theme API

- helper fallback theme semantics are removed from production code

- strict root resolution works for both shadow-hosted HTML and canvas

### Phase 6 — Host parity bridge update

Intent: preserve host RoutePoints behavior without leaking host internals into renderers.

Deliverables:

- keep `TemporaryHostActionBridge` as the one sanctioned temporary host-action shim

- change normalized RoutePoints callback shape to `routePoints.activate({ index, pointSnapshot })`

- strengthen normalized `RoutePoints` row payloads to include host-shape parity snapshots

- extend bridge dispatch on `editroutepage` to synthesize a host RoutePoints click with host-compatible route-point payload

- resolve `editroutepage` RoutePoints surfaces as `passive` unless runtime can positively verify parity-preserving dispatch prerequisites

- fail closed on `editroutepage` when parity dispatch cannot be achieved after dispatch capability was granted

- keep committed renderers unaware of host React/DOM probing

Exit conditions:

- RoutePoints committed HTML can preserve host click semantics on `editroutepage`

- no renderer-local host probing exists

- no lower-fidelity fallback remains on `editroutepage`

### Phase 7 — CSS, docs, tests, and enforcement

Intent: remove all remnants of the removed architecture and lock in the new model.

Deliverables:

- migrate global CSS consumers to the six `--dyni-theme-*` outputs for migrated values

- migrate committed HTML shadow CSS to output-only consumption for migrated values

- rewrite docs for theme ownership, runtime lifecycle, component system, committed HTML lifecycle, vertical sizing contract, `shellRect` measurement contract, and temporary host-action bridge boundaries

- update tests for:
  
  - module-vs-factory component loading
  
  - startup-only preset ingestion from `:root`
  
  - strict root-only resolver behavior
  
  - composed-tree root discovery across shadow boundaries
  
  - commit-time theme apply ordering
  
  - mandatory output overwrite on every commit
  
  - central surface-policy resolution
  
  - `props.mode`-driven vertical-context resolution
  
  - widget-owned `getVerticalShellSizing(sizingContext, surfacePolicy)` behavior
  
  - ratio sizing materialization through shell `aspect-ratio`
  
  - natural sizing materialization through shell `height`
  
  - pre-commit shell sizing materialization in vertical containers
  
  - vertical shell CSS ownership without `height: 100% !important` overriding reserved shell height
  
  - `RoutePoints` first-commit width-derived sizing exception
  
  - committed HTML shell/factory split
  
  - shadow-root mount/update/detach/destroy behavior
  
  - per-renderer shadow CSS preload and injection
  
  - direct DOM listener ownership under `dispatch | passive`
  
  - dispatch-mode blank-space click suppression
  
  - `layoutSignature`-driven committed HTML layout passes
  
  - bounded post-patch relayout behavior
  
  - mount-host `shellRect` measurement contract
  
  - RoutePoints parity bridge dispatch on `editroutepage`
  
  - passive policy resolution on `editroutepage` when parity prerequisites cannot be verified
  
  - no fallback relay on `editroutepage`
  
  - canvas compatibility with the new runtime/theme API
  
  - removal of removed APIs and old selector paths

- update architecture/tooling checks so the removed patterns are rejected

Exit conditions:

- removed architecture remnants are gone, not deprecated

- docs describe the new commit-driven theme and surface lifecycles accurately

- tests and tooling enforce the new architecture

---

## Acceptance criteria

### Theme ownership

- `ThemeModel` is the only semantic owner of shared theme tokens, defaults, preset metadata, mode-aware overrides, normalization, and output-var metadata.

- `ThemeResolver` is the only shared resolver boundary.

- `ThemePresets` no longer exists.

- `night` is not a legal preset family.

### Component system

- `ThemeModel` and `ThemeResolver` are registered as module-shaped components.

- the loader supports explicit `factory` vs `module` API shape.

- `plugin.css` remains the only global stylesheet in this plan.

- committed HTML renderer CSS is preloaded as text before first committed HTML mount.

- committed HTML renderers declare their required shadow CSS bundles explicitly.

- only `ThemeModel` and `ThemeResolver` use `apiShape: "module"` in this plan.

### Runtime lifecycle

- `plugin.js` is the sole automatic startup owner.

- `runtime/init.js` reads the preset once from `:root` and does not self-run.

- startup does not scan roots.

- `runtime._theme.applyToRoot(rootEl)` runs before `reconcileSession(...)` on every commit.

- no theme-change detection gate exists before apply.

### Root and resolver contract

- `Helpers.requirePluginRoot(target)` is the mandatory theme-root discovery path.

- `Helpers.requirePluginRoot(target)` works across shadow boundaries.

- `ThemeResolver.resolveForRoot(rootEl)` throws on invalid input.

- `ThemeResolver` does not cache by root and exposes no invalidation API.

### Visual ownership

- dyninstruments owns canonical defaults for foreground, background, border, font family, and migrated weights.

- the host is used only for night-mode state and runtime policy context.

- no host visual variable or inherited host color/font is part of canonical theme resolution.

### Surface policy and sizing

- widgets do not directly own host-capability policy resolution.

- runtime resolves one normalized surface policy object per surface/update.

- pre-commit vertical mode is determined from `props.mode === "vertical"`.

- HTML interaction mode is binary: `dispatch | passive`.

- on `editroutepage`, `RoutePoints` resolves to `dispatch` only when runtime can positively verify parity-preserving host dispatch prerequisites; otherwise it resolves to `passive`.

- in `.widgetContainer.vertical`, width is host-owned.

- in `.widgetContainer.vertical`, widgets own height completely.

- runtime calls only `getVerticalShellSizing(sizingContext, surfacePolicy)` and materializes the result.

- ratio sizing is materialized through shell `aspect-ratio`; natural sizing is materialized through shell `height`.

- all widgets except `RoutePoints` use widget-owned ratio-based vertical height.

- `RoutePoints` uses widget-owned width-derived natural height with the viewport cap.

- `RoutePoints` exact vertical shell height may be finalized at first host commit before surface attach.

### CSS and output model

- vertical shell CSS does not override runtime-owned reserved shell height with unconditional fill rules.

- migrated CSS reads only the six `--dyni-theme-*` outputs for migrated values.

- raw `--dyni-*` vars remain input-only.

- committed HTML shadow CSS consumes inherited theme outputs, not raw inputs, for migrated values.

- `.widget.dyniplugin` is the canonical light-DOM surface consumer.

- outputs exist only as inline style on committed plugin roots.

- `.widget.dyniplugin` sets `font-family` but not one global `font-weight`.

- HTML widget CSS weight declarations consume `--dyni-theme-font-weight` / `--dyni-theme-font-label-weight`.

### HTML renderer architecture

- pre-commit `renderHtml()` returns inert shell markup only.

- the inert shell is payload-invariant apart from stable route/surface metadata and sizing state.

- committed HTML surfaces render into a `ShadowRoot` attached to a stable mount host inside the inert shell.

- blank first-paint shells are allowed.

- `shellRect` remains the single authoritative source for committed HTML layout and text sizing.

- committed HTML `shellRect` is measured from the light-DOM mount host.

- dyninstruments HTML interaction no longer depends on `UserHtml` event translation.

- committed HTML renderers are DOM-first instances with `mount/update/postPatch/detach/destroy`.

- in-place DOM patching is the default update path.

- committed HTML styles are shadow-local.

- required outer context is mirrored into shadow-visible classes/attributes, including `pageId` and vertical-orientation context where those affect rendering or styling.

- committed HTML layout work is driven by `layoutSignature(payload)` and bounded post-patch relayout, not `triggerResize()` shims or renderer-local observers.

- structural remount is host/session-owned; no renderer `resetKey()` contract exists.

- dispatch-mode committed HTML claims blank-space click ownership for the whole widget surface.

### RoutePoints parity

- `TemporaryHostActionBridge` remains the one sanctioned temporary host-action shim.

- committed RoutePoints HTML dispatches through normalized runtime callbacks only.

- the normalized RoutePoints callback shape is `routePoints.activate({ index, pointSnapshot })`.

- `RoutePoints` normalized payload includes host-shape parity snapshots for each row.

- on `editroutepage`, RoutePoints resolves to `dispatch` only when runtime can positively verify parity-preserving host dispatch prerequisites; otherwise it resolves to `passive`.

- on `editroutepage`, RoutePoints interaction preserves host click semantics by dispatching through the host page click path with host-compatible route-point payload.

- on `editroutepage`, no lower-fidelity fallback remains if parity dispatch cannot be achieved after dispatch capability was granted.

### Canvas compatibility

- canvas remains on the committed mount model.

- canvas works with the new runtime/theme API.

- in vertical containers, canvas shells receive pre-commit height materialization from the central widget-owned sizing contract.

- canvas no longer exposes or relies on `invalidateTheme()`.

### Cleanup completeness

- old preset selector state is gone.

- old helper theme APIs are gone from production use.

- old init-time root scanning is gone.

- old border day/night input vars are gone.

- surface `invalidateTheme()` is gone.

- dyninstruments HTML interaction no longer uses `namedHandlers()` / `catchAll` / `onclick="handlerName"` semantics.

- compatibility shims for removed theme/surface/runtime architecture are not left behind.

- docs, tests, and enforcement tooling reflect the new architecture.

---

## Future rule

If a future AvNav settings page later feeds preset selection or root overrides into dyninstruments, that integration must enter through `runtime._theme` as the sole ingestion boundary.

Do not reintroduce direct settings reads inside `ThemeResolver`, helpers, committed renderers, or `runtime/init.js`.

If AvNav later exposes stable host action APIs for RoutePoints or other widget actions, those integrations must replace the relevant `TemporaryHostActionBridge` workaround path centrally in runtime, not in renderers.
