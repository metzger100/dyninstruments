# Guide: Add a New Native HTML Kind

**Status:** ✅ Reference Guide | `surface: "html"` flow for cluster kinds

## Overview

Use this guide when a cluster kind should render native HTML instead of internal canvas.

Ownership model:

- `ClusterWidget` owns global `catchAll` registration in `initFunction`
- `HtmlSurfaceController` owns named-handler lifecycle (`attach`/`update`/`detach`/`destroy`)
- Mapper/ViewModel own domain normalization
- HTML renderer owns markup + class/state contract + handler names + resize signature
- Kind catalog is the source of truth for `surface: "html"` routing

## Prerequisites

Read first:

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md)
- [../avnav-api/interactive-widgets.md](../avnav-api/interactive-widgets.md)
- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../widgets/active-route.md](../widgets/active-route.md)
- [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md)
- [../architecture/vertical-container-contract.md](../architecture/vertical-container-contract.md)

## Step 1: Define or Reuse a ViewModel Contract

Create or reuse a viewmodel under `cluster/viewmodels/` when multiple renderers share a domain payload.

Rules:

- normalize and shape data only
- no HTML markup
- no canvas drawing
- no surface lifecycle ownership

## Step 2: Implement HTML Renderer Module

Create a UMD renderer under `widgets/text/<WidgetName>/<WidgetName>.js`.

Required renderer contract:

- `renderHtml(props)` returns HTML string
- `namedHandlers(props, hostContext)` returns `{ handlerName: fn }`
- `resizeSignature(props, hostContext)` returns primitive signature (`string|number|boolean|null`)
- Reuse `HtmlWidgetUtils` for shared HTML helpers (`escapeHtml`, `toStyleAttr`, `resolveShellRect`, `resolveRatioMode`, `isEditingMode`) instead of creating local copies.

Minimal shape:

```javascript
return {
  id: "NewHtmlWidget",
  wantsHideNativeHead: true,
  renderHtml: renderHtml,
  namedHandlers: namedHandlers,
  resizeSignature: resizeSignature
};
```

Interaction rules:

- wrapper markup should include `onclick="catchAll"` only when renderer intentionally captures empty-space clicks
- do not claim ownership of `catchAll` inside `namedHandlers`; that handler is global and runtime-owned

## Step 3: Define Visual Contract Before Wiring

Before finishing implementation, define and document these visual artifacts:

1. Mode matrix (`high`/`normal`/`flat` or renderer-specific equivalent)
2. Class schema (base class, element classes, additive state classes)
3. Token map (font/color/weight owners and which module resolves them)
4. Layout and fit ownership split (which shared module owns geometry vs text fit)
5. Widget-local CSS scope boundaries (what is allowed in widget CSS vs `plugin.css`)

Required output in the widget module doc:

- CSS/state table
- layout constants table (if constants are runtime-owned)
- text-fit constants table (if constants are runtime-owned)
- layering/click ownership notes for hotspots

## Step 4: Register Component

Add component entry in `config/components/registry-widgets.js` and include CSS if renderer needs local styling.

```javascript
NewHtmlWidget: {
  js: BASE + "widgets/text/NewHtmlWidget/NewHtmlWidget.js",
  css: BASE + "widgets/text/NewHtmlWidget/NewHtmlWidget.css",
  globalKey: "DyniNewHtmlWidget"
}
```

If cluster-routed, add the component ID to `ClusterRendererRouter.deps` in `config/components/registry-cluster.js`, then update renderer inventory.

## Step 5: Add Kind Catalog Tuple

Add strict tuple in `cluster/rendering/ClusterKindCatalog.js`:

```javascript
{ cluster: "nav", kind: "newHtmlKind", viewModelId: "NewViewModel", rendererId: "NewHtmlWidget", surface: "html" }
```

Rules:

- `surface` must be `"html"`
- mapper `renderer` must match tuple `rendererId`
- unknown/mismatched tuple fails closed

## Step 6: Mapper Branch

Keep mapper declarative; route normalized props to the renderer.

```javascript
if (req === "newHtmlKind") {
  const vm = newViewModel.build(p, toolkit);
  return {
    renderer: "NewHtmlWidget",
    routeName: vm.routeName,
    display: vm.display,
    captions: vm.captions,
    units: vm.units,
    default: p.default
  };
}
```

## Step 7: Required HTML-Kind Test Matrix

Minimum regression coverage:

| Area | Required checks |
|---|---|
| Surface lifecycle | attach/update/detach/destroy ownership and stale-handler cleanup on remount/surface-switch |
| Click ownership | dispatch vs passive/editing mode behavior, `catchAll` usage, named-handler wiring |
| Resize contract | signature changes only on layout-relevant inputs; stable signature when irrelevant fields do not change |
| Class/state rendering | mode classes, state classes, conditional tiles/rows |
| Escaping + fail-closed | escaped output for all text fields and explicit throw for missing required payload |

Recommended test locations:

- renderer tests under `tests/cluster/rendering/`
- layout/fit owner tests under `tests/shared/`
- router/surface session coverage under `tests/cluster/rendering/` and `tests/runtime/`

## Step 8: Guardrails (Smell-Aligned)

Do not ship a new HTML kind if any of these are violated:

- no duplicated runtime defaults already owned by config/theme/boundary contracts
- no widget-local compact curve when a shared responsive owner is required
- no shell/root CSS overrides in widget-local CSS (`.widget.dyniplugin`, `.widgetData.dyni-shell`, `.dyni-surface-html` remain shared-owner scope)
- no ad hoc `data-dyni-*` state markers when class/state contract is sufficient
- no mapper presentation logic leakage (format/layout/display stays renderer/shared-owner responsibility)

## Lifecycle Patterns for Complex HTML Kinds

### Corrective Rerender Pattern (Committed DOM Dependencies)

- Use this pattern when renderer behavior depends on committed DOM ancestry or mounted geometry (for example `.widgetContainer.vertical` detection).
- Add `initFunction` to the renderer contract and call `this.triggerResize()` once after first mount.
- First render must stay host-sized and avoid committed-DOM checks; corrective rerender and later updates may use committed host facts.
- Full lifecycle and fail-closed rules: [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md).
- Reference implementation: `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` lines 278-281.

### Renderer Split Pattern (When a Single File Nears 400 Lines)

When a complex HTML kind approaches file-size limits, split into separately registered UMD modules:

| Module | Responsibility | DOM access |
|---|---|---|
| Shell (entrypoint) | lifecycle orchestration + `renderHtml`/`namedHandlers`/`resizeSignature`/`initFunction` export | reads `hostContext.__dyniHostCommitState` |
| RenderModel | pure normalization and display-model assembly | none |
| Markup | pure HTML assembly, escaped text, structural/style attrs | none |
| DomEffects | committed-DOM side effects (ancestry checks, post-commit corrections) | reads/writes committed DOM |

- Each module has its own UMD registration in `config/components/registry-widgets.js`.
- Shell depends on helper modules through normal `deps` chaining.
- `ClusterRendererRouter` depends only on the shell component.

### Box-Driven Text Fitting Workflow

For fitted HTML text (inline style, not canvas drawing), use this flow:

1. Layout owner computes box rects for each text element.
2. Fit owner measures against each box using `RadialTextLayout.fitSingleTextPx(...)` or `TextTileLayout.measureFittedLine(...)`.
3. Fit owner returns only inline `font-size:Npx;` style strings.
4. Markup owner applies those style strings via `style="..."`.

Rules:

- Reduce font size only when text does not fit.
- Do not use ellipsis truncation for fitted text; keep `white-space: nowrap` + `overflow: hidden`.
- Fit logic must not alter/trim/abbreviate text content.
- Forbidden in fitted HTML flow: `drawFittedLine(...)`, `trimToWidth(...)`, or helpers that mutate emitted text.

### Page-Aware Handler Registration

Use explicit dispatch/passive mode switching when interaction is page-dependent:

1. Add a capability gate (`canDispatch(hostContext)`) that checks `hostActions.getCapabilities()` for required dispatch and page constraints.
2. `namedHandlers(props, hostContext)` returns `{ handlerName: fn }` in dispatch mode and `{}` in passive mode.
3. Add `onclick="handlerName"` and `onclick="catchAll"` only when dispatch mode is active.
4. Never return `catchAll` from `namedHandlers`; it is host-owned and pre-registered.
5. In layout editing mode (`isEditingMode(props) === true`), always return passive.

Reference: `ActiveRouteTextHtmlWidget` (`canDispatchOpenRoute`, `activeRouteOpen`).

### Grouped Mapper Output for Complex Payloads

When one mapper branch needs more than 8 top-level props (`mapper-output-complexity`), group renderer payload fields:

```javascript
return {
  renderer: "NewHtmlWidget",
  domain: { /* route/selection/display state */ },
  layout: { /* thresholds, toggles */ },
  formatting: { /* units, labels */ }
};
```

- Keep stable top-level shape: `renderer` + named groups.
- Add new groups only when a concrete field requires them.
- Keep existing group structure stable once implemented.
- `domain` owns what to render, `layout` owns geometry inputs, `formatting` owns text presentation inputs.

## Validation

Required completion gate:

```bash
npm run check:all
```

During iteration:

```bash
npm run docs:check
npm run test
```

## Checklist

- [ ] ViewModel contract exists (or existing one reused)
- [ ] HTML renderer exposes `renderHtml`, `namedHandlers`, `resizeSignature`
- [ ] HTML renderer reuses `HtmlWidgetUtils` for escaping/style/shell/ratio/editing helpers
- [ ] Visual mode matrix + class schema + token map are documented
- [ ] Layout/fit ownership split is documented and aligned with actual owner modules
- [ ] Component registered in `config/components/registry-widgets.js`
- [ ] Router inventory updated in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Kind catalog tuple added with `surface: "html"`
- [ ] Mapper branch remains declarative and renderer-aligned
- [ ] Required HTML-kind test matrix is covered
- [ ] Complex renderer split into Shell + helpers if approaching 400-line budget
- [ ] Corrective rerender pattern used when committed DOM ancestry is needed
- [ ] Text fitting follows box-driven workflow (font-size only, no text alteration)
- [ ] Handler registration is page-aware (dispatch/passive, never returns `catchAll`)
- [ ] Mapper output uses grouped sub-objects if >8 top-level props
- [ ] `npm run check:all` passes

## Related

- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../widgets/active-route.md](../widgets/active-route.md)
- [add-new-cluster.md](add-new-cluster.md)
- [add-new-text-renderer.md](add-new-text-renderer.md)
