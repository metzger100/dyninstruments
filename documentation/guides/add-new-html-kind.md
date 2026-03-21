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

Add component entry in `config/components.js` and include CSS if renderer needs local styling.

```javascript
NewHtmlWidget: {
  js: BASE + "widgets/text/NewHtmlWidget/NewHtmlWidget.js",
  css: BASE + "widgets/text/NewHtmlWidget/NewHtmlWidget.css",
  globalKey: "DyniNewHtmlWidget"
}
```

If cluster-routed, add the component to `ClusterRendererRouter` dependencies and renderer inventory.

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
- [ ] Visual mode matrix + class schema + token map are documented
- [ ] Layout/fit ownership split is documented and aligned with actual owner modules
- [ ] Component registered in `config/components.js`
- [ ] Router inventory updated in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Kind catalog tuple added with `surface: "html"`
- [ ] Mapper branch remains declarative and renderer-aligned
- [ ] Required HTML-kind test matrix is covered
- [ ] `npm run check:all` passes

## Related

- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../widgets/active-route.md](../widgets/active-route.md)
- [add-new-cluster.md](add-new-cluster.md)
- [add-new-text-renderer.md](add-new-text-renderer.md)
