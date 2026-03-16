# Implementation Plan — `renderHtml` Active Widgets / ActiveRoute Pilot / NavPage Sizing

**Status:** Reworked against the current dyninstruments and AvNav codebases. Implementation gate remains **RED** until shell discovery, semantic head hiding, preset propagation, HTML root measurement, semantic re-layout, and ActiveRoute parity are hardened.

## Scope

This plan defines the first safe `renderHtml` path for dyninstruments, using ActiveRoute as the pilot widget. It also closes the missing NavPage shell-sizing contract for both `renderHtml` widgets and selected `renderCanvas` widgets.

This is **not** a blanket migration to HTML. Canvas remains the default renderer path for passive instruments until HTML parity is proven.

No AvNav core change is required for the pilot.

---

## Verified Facts From The Current Codebase

1. **AvNav already supports HTML-only widgets.**
   `ExternalWidget` renders `UserHtml` whenever `renderHtml` returns content and creates a canvas only when `renderCanvas` exists. `initFunction` and `finalizeFunction` still run.

2. **The current dyninstruments blocker is runtime discovery, not host HTML support.**
   `runtime/init.js` still enumerates plugin containers from `canvas.widgetData`, so HTML-only roots are invisible to preset re-apply scans.

3. **The shell class stack is preserved today.**
   `ExternalWidget` passes translated props through `WidgetFrame`, and `WidgetFrame` merges `props.className` and `props.addClass`. Registered dyni shell classes survive even if translated output adds classes.

4. **The current native-head hiding path is still canvas-marked and is not sufficient for an HTML ActiveRoute pilot.**
   `plugin.css` hides AvNav header/value through `[data-dyni]`, and `runtime/widget-registrar.js` sets that marker only from the wrapped `renderCanvas` path when `wantsHideNativeHead` is true.

5. **ActiveRoute can still trigger a native AvNav header even when `caption` and `unit` are empty.**
   In AvNav, `WidgetHead` renders when `caption`, `unit`, or `infoMiddle` exist. `infoMiddle` is populated from `disconnect`. In dyninstruments, `config/clusters/nav.js` sets `disconnect` for `kind: "activeRoute"` when `wpServer === false` or no route name exists.

6. **The current theme model is not CSS-only.**
   `ThemePresets.apply()` updates `data-dyni-theme` on the shell. `ThemeResolver` still resolves canvas tokens from this precedence:
   - computed style on the canvas element
   - computed style on the widget root
   - `ThemePresets.PRESETS`
   - resolver defaults

7. **The current string-mode `renderHtml` path has no DOM root ref.**
   `renderHtml`, `initFunction`, and `finalizeFunction` do not receive the mounted HTML element. Any `ResizeObserver` plan therefore needs an explicit post-mount root-locator contract.

8. **A new `activeRouteInteractive` kind needs more than router wiring.**
   In addition to mapper/router/component registration, `config/shared/kind-defaults.js` and `config/clusters/nav.js` must be updated because ActiveRoute captions, units, editables, and disconnect logic are keyed to `kind: "activeRoute"` today.

9. **`config/components.js` is part of the runtime gate, not just bookkeeping.**
   Any new `ActiveRouteTextHtmlWidget` must be registered there and loaded as a dependency for `ClusterRendererRouter`, otherwise `Helpers.getModule("ActiveRouteTextHtmlWidget")` cannot resolve at runtime.

10. **NavPage shell sizing is host-defined and mode-specific.**
    - left panel: `mode="vertical"`
    - top/bottom panels: `mode="horizontal"`
    - GPS/dashboard pages: `mode="gps"`
    AvNav `.widget` defaults still include `flex-grow: 1`. In horizontal containers, editor mode additionally applies `flex-shrink: 1` to widgets.

---

## Phase 0 — Re-Verified Assessment

### 0a — AvNav `ExternalWidget` HTML-only path

**Verdict:** PASS

Confirmed:

- `ExternalWidget` renders `UserHtml` if `renderHtml` returns non-null content.
- Canvas creation is conditional on `props.renderCanvas`.
- `UserHtml` translates string-mode event handlers and suppresses propagation/default before invoking dyninstruments handlers.
- `initFunction` and `finalizeFunction` run even when no canvas exists.

Consequence:

- No AvNav-side blocker exists for an HTML-only dyninstruments widget.
- No host-side code change is required for the pilot.

### 0b — Runtime root discovery for HTML-only widgets

**Verdict:** FAIL

Current gap:

- `runtime/init.js` still discovers plugin roots through `canvas.widgetData` enumeration.
- `isPluginContainer()` already accepts `.dyniplugin` and `[data-dyni]`, but `listPluginContainers()` never scans shell roots directly.
- HTML-only widgets without a canvas are therefore invisible to preset re-apply scans.

Required correction:

- make shell scanning primary
- discover plugin roots directly by shell selector:
  - `.widget.dyniplugin`
- keep `[data-dyni]` only as a temporary fallback while CSS migration is in flight

### 0c — Native head hiding

**Verdict:** FAIL / PILOT BLOCKER

Current state:

- `plugin.css` still hides native AvNav elements through `[data-dyni]`
- current runtime marking happens only in the wrapped canvas path
- ActiveRoute disconnect state can still cause AvNav `WidgetHead` to render because `disconnect` feeds the `infoMiddle` slot even when `caption` and `unit` are empty

Important clarification:

- this is a real blocker for an HTML ActiveRoute pilot
- the failure mode is not theoretical: `config/clusters/nav.js` sets `disconnect` for `kind: "activeRoute"` when `wpServer === false` or the route name is missing
- therefore native-head suppression must be shell-semantic and available without canvas markup side effects

Required correction:

- introduce a semantic shell class:
  - `.dyni-hide-native-head`
- append it directly to the registered widget shell class list when `wantsHideNativeHead === true`
- switch head-hiding CSS to that class
- keep `[data-dyni]` selectors only as a temporary migration fallback

Required CSS target:

```css
.widget.dyniplugin.dyni-hide-native-head > .widgetHead {
  display: none !important;
}

/* legacy fallback only; keep temporarily if older paths still emit valueData */
.widget.dyniplugin.dyni-hide-native-head .valueData {
  display: none !important;
}
```

### 0d — NavPage sizing

**Verdict:** FAIL / PARTIAL

What AvNav actually does:

- left NavPage panel uses `mode="vertical"`
- top and bottom NavPage panels use `mode="horizontal"`
- `gps` is the only mode that gets automatic resize behavior in `WidgetFrame`
- NavPage widgets render inside `.noresize`

Core sizing facts:

#### Left NavPage panel (`vertical`)

- width is host-defined
- height is distributed across widgets by flex
- plugin content must fill the assigned shell height
- taller widgets can bias their share only through shell-level `flexGrow` and optional `minHeight`

#### Top and bottom NavPage panels (`horizontal`)

- height is host-fixed
- width is the main plugin-controlled dimension
- default `.widget` CSS still includes `flex-grow: 1`
- in editing mode, `.widgetContainer.horizontal .widget` additionally gets `flex-shrink: 1`
- `style.width` alone is therefore not deterministic

#### GpsPage (`gps`)

- host grid allocation and resize behavior remain host-controlled
- plugin should avoid forcing shell size here

Required correction:

- define an explicit shell sizing contract
- solve width on horizontal NavPage panels with `style.width + style.flexGrow = 0`
- set `style.flexShrink = 0` when deterministic width must also hold in editor mode
- solve fill behavior for HTML wrappers
- document that vertical-panel height bias is possible, horizontal-panel height growth is not

### 0e — Theme propagation without canvas

**Verdict:** FAIL

Current gap:

- `ThemePresets.apply()` only updates `data-dyni-theme`
- runtime root discovery still depends on canvases
- HTML-only widgets therefore do not reliably receive preset state after mount
- `plugin.css` does not yet define preset-driven public tokens for HTML widgets

Important clarification:

- the current canvas theme path is still owned by `ThemeResolver`
- the current runtime is **not** a CSS-only theme system
- switching `data-dyni-theme` alone is not enough for HTML unless the required public CSS tokens also exist on the shell

Required baseline:

- theme preset application must no longer depend on the canvas path
- HTML-only widgets must receive the correct `data-dyni-theme` on the shell after mount
- Phase 1 must preserve the existing canvas precedence contract:
  - canvas CSS vars
  - root CSS vars
  - `ThemePresets.PRESETS`
  - resolver defaults
- HTML widgets need a shell-level public CSS token layer for the subset of tokens they consume

Phase 1 decision:

- keep `ThemeResolver` unchanged for canvas widgets unless an explicit later theme-unification step is approved
- add shell-level public CSS tokens for HTML widgets in `plugin.css`
- keep `data-dyni-theme` in sync on `.widget.dyniplugin`
- do **not** describe Phase 1 as a full removal of the JS preset layer

---

## Final Technical Contract

### 1. Separate outer shell and inner renderer

There are two distinct layers.

#### Outer shell

The AvNav widget root:

- `.widget.dyniplugin`

Optional shell state:

- `.dyni-hide-native-head`
- `data-dyni-theme="night|slim|bold|highcontrast"`
- no `data-dyni-theme` attribute for `default`

This layer controls:

- width in horizontal NavPage panels
- flex height share in the vertical NavPage panel
- native-head visibility
- preset name visibility
- shell-level public tokens for HTML widgets

#### Inner renderer

The dyninstruments-owned content inside `.noresize` or `.resize`:

- canvas
- HTML wrapper returned by `renderHtml`

This layer controls:

- composition
- truncation
- tile layout
- click handling
- visual presentation

**Rule:** solve shell sizing first, then solve fill and layout inside the renderer.

### 2. Shell identity and discovery

The first-class plugin shell contract is:

- `.widget.dyniplugin`
- optional `.dyni-hide-native-head`
- optional `data-dyni-theme`

Required rule:

- runtime discovers plugin shells by shell selector, not by canvases
- runtime behavior must not depend on per-instance root IDs or DOM-order coupling
- `[data-dyni]` remains transition-only until CSS migration is complete

### 3. `className` merge policy

The current AvNav path already preserves base shell classes.

The correct policy is:

- registration-time classes remain authoritative for semantic shell behavior
- translated classes may add shell classes, but must not be required for root identity or head hiding
- HeadHide must be added directly to the registration-time class list

Required registration pattern:

```js
const wantsHide = !!spec.wantsHideNativeHead;
const mergedClassName = [
  "dyniplugin",
  wantsHide ? "dyni-hide-native-head" : "",
  widgetDef.def.className,
  spec.className
].filter(Boolean).join(" ");
```

### 4. Theme propagation policy

Phase 1 must reflect the code that exists today.

#### Canvas widgets

Canvas widgets continue to resolve tokens through `ThemeResolver`.

Required preserved precedence:

- canvas CSS vars
- root CSS vars
- `ThemePresets.PRESETS`
- `ThemeResolver` defaults

Do not describe Phase 1 as a CSS-only canvas theme system.

#### HTML widgets

HTML widgets do not use `ThemeResolver` today.

Required HTML contract:

- preset name remains visible as `data-dyni-theme` on the shell
- `plugin.css` defines default public tokens on `.widget.dyniplugin`
- `plugin.css` defines preset overrides for those same public tokens on selectors such as:
  - `.widget.dyniplugin[data-dyni-theme="night"]`
- HTML widgets consume those shell-level public tokens through normal CSS cascade

This keeps the HTML path explicit without pretending that canvas has already moved to the same mechanism.

#### Runtime preset application

Because `renderHtml` and any HTML-side root lookup depend on mounted DOM, the runtime helper must support a **post-commit** path.

Important clarification:

- `renderCanvas` in AvNav `ExternalWidget` already runs from a mounted lifecycle path
- the queued helper is therefore required primarily for HTML-only widgets, late-mounted roots, and canvas-independent convergence to the active preset state
- the helper must not be justified by the claim that `renderCanvas` itself is pre-commit
- preset propagation and layout synchronization are separate concerns; the preset queue does not replace normal widget-state-to-DOM synchronization

Required helper shape:

```js
runtime.queueApplyThemePresetToRegisteredWidgets()
```

Required behavior:

- debounce/throttle repeated requests
- schedule work asynchronously after mount
- scan `.widget.dyniplugin`
- resolve the active preset in a canvas-independent way
- update or clear `data-dyni-theme`
- invalidate canvas token caches after preset changes

Canvas may keep an immediate fast-path when a concrete root is already known. That path is lifecycle-correct and may remain. The queued shell-scan path is required so HTML-only and late-mounted roots also converge to the active preset state.

### 5. Native-head hiding policy

Head hiding must be semantic and shell-based.

- registration adds `.dyni-hide-native-head` to the shell class list when requested
- CSS hides `.widgetHead` through that class
- HTML widgets must not depend on `[data-dyni]` for native-head suppression
- `[data-dyni]` may remain only as a temporary migration fallback
- `.valueData` hiding should be treated as a legacy-compatibility fallback, not as the primary contract for new `ExternalWidget`-based HTML widgets

### 6. NavPage sizing policy

Per-widget shell sizing flows through translated `style` on the AvNav shell.

Allowed shell sizing controls:

- `mode === "horizontal"`
  - explicit `style.width`
  - `style.flexGrow = 0`
  - `style.flexShrink = 0` when deterministic width must also hold in layout-editor mode
- `mode === "vertical"`
  - `style.flexGrow`
  - optional `style.minHeight`
- `mode === "gps"`
  - no shell forcing; let host layout and resize behavior work normally

### 7. Base HTML wrapper contract

Every `renderHtml` widget must return a single outer wrapper that fills the shell.

Example shape:

```html
<div class="dyni-htmlWidget" data-dyni-instance="...">
  ...
</div>
```

```css
.dyni-htmlWidget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}
```

### 8. HTML root-locator and layout-mode policy

`props.mode` is only the shell-context signal:

- `horizontal` = top/bottom NavPage shell context
- `vertical` = left NavPage shell context
- `gps` = dashboard shell context

It is **not** sufficient for ActiveRoute sub-layout selection.

ActiveRoute currently chooses `flat`, `normal`, and `high` from the actual rendered aspect ratio through `TextLayoutEngine.computeModeLayout(W, H, ...)`.

The current string-mode `renderHtml` API has no direct DOM ref.

Required HTML rule:

- the HTML renderer must measure actual DOM size
- layout kind must be derived from measured `W/H`, not just from `props.mode`
- the renderer must update layout state whenever shell size changes
- the renderer must also recompute layout when semantic inputs change at constant size, including at minimum:
  - route name text
  - `disconnect`
  - `isApproaching`
  - metric captions/units/values
  - ratio-threshold parameters

Required implementation shape:

- allocate a stable per-instance ID on widget context
- stamp that ID into the single HTML root, for example `data-dyni-instance="..."`
- after mount, resolve the root element by that selector
- attach `ResizeObserver` to that root
- compute:
  - actual `W`
  - actual `H`
  - layout kind from `TextLayoutEngine.computeModeLayout`
  - fitted text and pixel geometry from the shared ActiveRoute helpers
- write the resolved layout into attributes/classes and CSS vars, for example:
  - `data-dyni-layout="flat|normal|high"`
  - `data-dyni-approach="true|false"`
  - `data-dyni-disconnect="true|false"`
  - pixel CSS custom properties in `px`
- rerun the same computation from normal widget update/render paths when relevant semantic data changes even if `ResizeObserver` does not fire
- disconnect observers deterministically in `finalizeFunction`

### 9. ActiveRoute HTML visual-fidelity contract

The HTML ActiveRoute renderer must reproduce the current canvas semantics, not just its high-level structure.

The contract has four layers:

1. semantic data contract
2. geometric layout contract
3. typography and fitting contract
4. overlay/state contract

#### 9.1 Canonical layout constants from `ActiveRouteLayout`

These values are canonical and must stay shared between canvas and HTML:

- `PAD_X_RATIO = 0.04`
- `INNER_Y_RATIO = 0.035`
- `GAP_RATIO = 0.04`
- `NAME_PAD_X_RATIO = 0.025`
- `METRIC_TILE_PAD_RATIO = 0.04`
- `METRIC_TILE_CAPTION_RATIO = 0.34`
- `NAME_PANEL_RATIO_FLAT = 0.38`
- `NAME_BAND_RATIO_HIGH = 0.22`
- `NAME_BAND_RATIO_NORMAL = 0.34`
- `NORMAL_APPROACH_TOP_RATIO = 0.52`
- flat/high/normal name min/max clamp ratios exactly as defined in `ActiveRouteLayout.js`

These values are part of the renderer contract.

#### 9.2 Responsive scaling and pixel rounding contract

The current canvas renderer does not use pure percentages. It computes responsive insets and applies `Math.floor` at multiple steps.

Required rule:

- JS computes final pixel layout values from measured DOM size using the shared layout helpers
- JS writes final values as CSS custom properties in `px`
- CSS consumes those pixel variables

This avoids subpixel drift and preserves parity with canvas rounding behavior.

#### 9.3 Exact outer templates by resolved layout kind

**Flat**

- name panel on the left
- metrics area on the right
- metrics columns:
  - non-approach: `remain | eta`
  - approach: `remain | eta | next`

**High**

- name band on top
- metrics stack below
- metrics rows:
  - non-approach: `remain / eta`
  - approach: `remain / eta / next`

**Normal, non-approach**

- name band on top
- metrics row below
- metrics columns: `remain | eta`

**Normal, approach**

- name band on top
- nested metrics block below:
  - top block = `remain | eta`
  - bottom block = `next`
  - top height share uses the existing `0.52` ratio after gap handling

#### 9.4 Route name rendering contract

Canvas behavior today:

- route name is a single line
- no wrapping
- text is font-fitted to available width/height
- overflow is handled by trimming characters until the measured text fits
- canvas does **not** append ellipsis

Required HTML behavior:

- keep route name single-line
- do not introduce ellipsis unless canvas changes too
- preserve current semantics as closely as possible

Mode-specific constants:

- `flat` and `high`: use `labelWeight`
- `normal`: use `valueWeight`
- alpha:
  - `flat` / `high`: `0.78`
  - `normal`: `0.92`
- max font-size ceiling by mode:
  - `flat`: `0.46 * nameRect.h`
  - `high`: `0.54 * nameRect.h`
  - `normal`: `0.66 * nameRect.h`

#### 9.5 Metric tile contract

Each metric tile keeps this structure:

- caption
- value
- unit

Canvas behavior today:

- caption height comes from `computeIntrinsicTileSpacing(...)`
- value and unit line uses shared fitting logic
- secondary caption/unit scale is `0.72`

Required HTML behavior:

- metric tiles receive pixel-level spacing values from the shared layout/model layer
- do not approximate tile spacing with CSS-only percentages
- value and unit remain on one line
- caption remains a distinct upper region

#### 9.6 Overlay and state contract

Canvas behavior today:

- approach accent is a translucent overlay over the **content rect**, not the entire widget
- approach overlay alpha is `0.14`
- disconnect is a full-widget overlay
- disconnect overlay keeps current canvas semantics from `TextLayoutEngine.drawDisconnectOverlay(...)`
- disconnect state does not change structural layout selection

Required HTML behavior:

- preserve the same overlay scopes
- preserve the same layout selection under disconnect

#### 9.7 Theme/token contract for HTML ActiveRoute

At minimum the HTML path must receive shell-level public tokens for:

- foreground/text color
- warning color
- font weight
- label weight
- font family

These must be defined on the shell CSS layer that HTML consumes directly.

#### 9.8 Event behavior contract

For the pilot widget:

- string-mode `renderHtml` remains the default path
- root click is installed only when the action mode is `dispatch`
- `dispatch` must call:
  - `this.hostActions.routeEditor.openActiveRoute()`
- `passive` and `unsupported` install no root click handler
- event handling must remain compatible with AvNav `UserHtml` propagation suppression

#### 9.9 Acceptance matrix for visual parity

Parity must be verified for all combinations below:

- `flat`, `high`, `normal`
- approach `true` / `false`
- disconnect `true` / `false`
- long route names requiring trimming
- preset variants `default`, `slim`, `bold`, `night`, `highcontrast`
- shell contexts `vertical`, `horizontal`, `gps`

---

## Implementation Phases

## Phase 1 — Runtime and shell hardening

Goal: make HTML-only widgets first-class before introducing any real HTML widget.

### 1.1 Root discovery

Change runtime discovery to scan plugin shells directly:

- `.widget.dyniplugin`

Do not use `canvas.widgetData` as the primary discovery mechanism anymore.

### 1.2 Registration-time shell identity

Move shell identity to registration, not to canvas render side effects.

Responsibilities:

- always register widgets with `dyniplugin`
- append `.dyni-hide-native-head` at registration time when `wantsHideNativeHead === true`
- preserve any existing widget-specific classes
- allow translated classes to add non-semantic shell classes only

**Exit condition:** ActiveRoute disconnect state cannot reveal native `WidgetHead` on HTML-only widgets.

### 1.3 Preset application for HTML and canvas widgets

Add a throttled helper such as:

```js
runtime.queueApplyThemePresetToRegisteredWidgets()
```

Important requirement:

- this helper must schedule **post-commit** work for HTML-only widgets and late-mounted roots
- a direct synchronous call from the wrapped `renderHtml` path is not sufficient because `renderHtml` runs before mount
- this helper is not justified by `renderCanvas`; the AvNav `ExternalWidget` canvas path already runs after mount

Use the helper from wrapped `renderHtml`, from any lifecycle entry that may create or reveal HTML-only roots, and from preset-switch paths that need a shell scan.

Runtime requirements:

- resolve the active preset in a canvas-independent way
- keep `data-dyni-theme` in sync with the active preset name
- remove the attribute entirely for `default`
- invalidate canvas theme caches after preset changes
- keep the existing canvas `ThemeResolver` precedence intact

Canvas may keep its immediate per-root apply fast-path when a concrete shell is already known. That fast-path is valid, but it must no longer be the only mechanism.

### 1.4 Shell CSS hardening in `plugin.css`

Update plugin-wide shell CSS to cover:

- shell selectors based on `.widget.dyniplugin`
- head-hiding semantics through `.dyni-hide-native-head`
- canvas fill rules based on the shell contract
- base HTML wrapper fill rules
- base font-family inheritance on dyni roots
- default public tokens for HTML widgets
- preset-specific public token overrides for HTML widgets

Migration note:

- `[data-dyni]` selectors may remain temporarily while the old head-hide/canvas-fill path is being retired
- do not remove the legacy selectors until the replacement shell selectors are live and tested

### 1.5 Shell sizing helper

Add a shared helper owned by translation logic, for example:

```js
function resolveWidgetShellStyle(opts) {
  const mode = opts.mode;
  if (mode === "horizontal") {
    if (!opts.horizontalWidth) return undefined;
    return {
      width: opts.horizontalWidth,
      flexGrow: 0,
      flexShrink: opts.lockWidthInEditor ? 0 : undefined
    };
  }
  if (mode === "vertical") {
    const out = {};
    if (opts.verticalFlexGrow != null) out.flexGrow = opts.verticalFlexGrow;
    if (opts.verticalMinHeight) out.minHeight = opts.verticalMinHeight;
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}
```

Do not describe width-only sizing as deterministic for horizontal widgets unless the editor-mode shrink behavior is explicitly handled or explicitly declared out of scope.

### 1.6 Tests

Required tests:

- HTML-only roots are discovered without canvases
- late-mounted HTML-only roots receive preset state through the queued helper
- default preset clears `data-dyni-theme`
- preset switching invalidates canvas caches deterministically
- head hiding works through `.dyni-hide-native-head`
- ActiveRoute disconnect state does not reveal native AvNav header UI
- canvas widgets still keep correct preset behavior
- translated `style.width`, `style.flexGrow`, and where required `style.flexShrink` reach `WidgetFrame`
- translated class output can add classes without breaking the registered shell class stack

**Exit gate:** no real HTML widget work starts until Phase 1 is green.

## Phase 2 — Shared ActiveRoute semantic and layout extraction

Goal: isolate the ActiveRoute view model and exact layout contract from renderer technology.

Main work:

- extract shared ActiveRoute semantic helpers from the current canvas widget
- keep `ActiveRouteLayout` as the canonical geometry source
- extract visual constants from the canvas widget into shared constants:
  - approach alpha
  - route-name alpha by mode
  - metric secondary scale
  - route-name font-size ceilings by mode
- add a shared HTML escaping helper before any store-driven string is interpolated into `renderHtml`
- define pilot view-model fields such as:
  - route name text
  - metrics
  - approach state
  - disconnect state
  - action mode
  - shell mode
  - measured width/height
  - resolved layout kind (`flat`, `high`, `normal`)
  - resolved pixel geometry for name and metric tiles
  - resolved fitted typography values needed by the HTML renderer

Rule:

- JS owns semantic state, measured geometry, and fitted typography
- CSS owns final DOM composition and paint semantics

## Phase 3 — Parallel HTML ActiveRoute pilot

Goal: build a real HTML widget without replacing the existing canvas ActiveRoute path yet.

Main work:

- add `ActiveRouteTextHtmlWidget`
- add dedicated component CSS
- register the new component in `config/components.js`
- add `ActiveRouteTextHtmlWidget` as a dependency wherever `ClusterRendererRouter` must resolve it
- introduce a parallel kind such as `activeRouteInteractive`
- route only that new kind to the HTML renderer
- keep current `activeRoute` canvas rendering unchanged

Renderer rules:

- string-mode `renderHtml`
- single outer `.dyni-htmlWidget` wrapper
- stable per-instance root attribute for DOM lookup
- semantic state classes and `data-dyni-*` attributes for layout and state
- post-mount DOM resolution plus `ResizeObserver`
- JS-computed pixel variables for layout rectangles and spacing
- deterministic observer cleanup
- no `renderCanvas`

Cluster/config rules:

- `NavMapper.js` must emit the new renderer id for the new kind
- `ClusterRendererRouter.js` must resolve and delegate to the new HTML widget
- `config/clusters/nav.js` must add the new kind and duplicate ActiveRoute-specific editables/conditions where required
- `config/shared/kind-defaults.js` must cover the new kind for captions/units if the HTML pilot uses the same semantic fields

## Phase 4 — Visual parity and route-editor behavior

Goal: make the pilot visually and behaviorally equivalent where host capabilities allow it.

Main work:

- implement route-name fit/trimming behavior without introducing ellipsis
- implement metric tile spacing and caption/value/unit hierarchy from shared fitted values
- implement approach overlay with the existing content-rect semantics
- implement disconnect overlay with the existing full-widget semantics
- install a recompute path that runs on:
  - real DOM resize
  - route-name changes
  - approach-state changes
  - disconnect changes
  - metric/caption/unit changes
  - ratio-threshold changes
- `dispatch` mode installs the root click handler
- `passive` mode installs no root click handler
- `unsupported` mode installs no root click handler
- `dispatch` calls `this.hostActions.routeEditor.openActiveRoute()`
- validate that HTML click handling does not bubble into host click behavior

## Phase 5 — Promote and clean up

Goal: replace the canvas ActiveRoute widget only after the HTML pilot has parity.

Main work:

- point `activeRoute` to the HTML renderer
- remove the parallel pilot kind
- retire obsolete canvas-only ActiveRoute code only after parity is verified
- remove legacy `[data-dyni]` selectors only after the new shell contract is proven green

---

## Files to Touch

### dyninstruments

- `runtime/init.js`
- `runtime/widget-registrar.js`
- `runtime/helpers.js` if shared HTML token helpers are added there
- `plugin.css`
- `shared/theme/ThemePresets.js` only if preset-to-public-token export/helpers are introduced
- `shared/widget-kits/nav/ActiveRouteLayout.js`
- `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js`
- `cluster/mappers/NavMapper.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `config/clusters/nav.js`
- `config/shared/kind-defaults.js`
- `config/components.js`
- `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` (new)
- `widgets/text/ActiveRouteTextHtmlWidget/active-route-html.css` (new)
- runtime and widget tests covering root discovery, preset application, shell sizing, semantic re-layout, visual parity, and event behavior

### AvNav reference points this plan depends on

No AvNav changes are required for the pilot, but these host files define the constraints the plugin must obey:

- `viewer/components/ExternalWidget.jsx`
- `viewer/components/UserHtml.tsx`
- `viewer/components/WidgetBase.jsx`
- `viewer/components/MapPage.jsx`
- `viewer/style/widgets.less`
