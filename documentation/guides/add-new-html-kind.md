# Guide: Add a New Native HTML Kind

**Status:** ✅ Reference Guide | `surface: "html"` flow for cluster kinds

## Prerequisites

Read first:

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md)
- [../avnav-api/interactive-widgets.md](../avnav-api/interactive-widgets.md)
- [../widgets/active-route.md](../widgets/active-route.md)

## Overview

Use this guide when a kind should render native HTML instead of internal canvas.

Ownership model:

- `ClusterWidget` owns global `catchAll` registration in `initFunction`.
- `HtmlSurfaceController` owns named handler lifecycle (`attach`/`update`/`detach`/`destroy`).
- Mapper/ViewModel own domain normalization; HTML renderer owns markup + handler map + resize signature.
- Kind catalog is the source of truth for `surface: "html"` routing.

## Step 1: Define or Reuse a ViewModel Contract

Create or reuse a viewmodel under `cluster/viewmodels/` when multiple renderers share the same domain contract.

Rules:

- Normalize and shape data only.
- No HTML markup.
- No canvas drawing.
- No surface lifecycle ownership.

## Step 2: Implement HTML Renderer Module

Create a UMD renderer under `widgets/text/<WidgetName>/<WidgetName>.js`.

Required renderer contract:

- `renderHtml(props)` returns HTML string.
- `namedHandlers(props, hostContext)` returns `{ handlerName: fn }`.
- `resizeSignature(props, hostContext)` returns primitive signature (`string|number|boolean|null`).

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

- Wrapper markup should include `onclick="catchAll"` so empty-space clicks are consumed.
- Do not claim ownership of `catchAll` inside `namedHandlers`; that handler is global and runtime-owned.

## Step 3: Register Component

Add component entry in `config/components.js` and include CSS if renderer needs local styling.

```javascript
NewHtmlWidget: {
  js: BASE + "widgets/text/NewHtmlWidget/NewHtmlWidget.js",
  css: BASE + "widgets/text/NewHtmlWidget/NewHtmlWidget.css",
  globalKey: "DyniNewHtmlWidget"
}
```

If cluster-routed, add component to `ClusterRendererRouter` dependencies and `rendererSpecs` inventory.

## Step 4: Add Kind Catalog Tuple

Add strict tuple in `cluster/rendering/ClusterKindCatalog.js`:

```javascript
{ cluster: "nav", kind: "newHtmlKind", viewModelId: "NewViewModel", rendererId: "NewHtmlWidget", surface: "html" }
```

Rules:

- `surface` must be `"html"`.
- Mapper `renderer` must match tuple `rendererId`.
- Unknown/mismatched tuple fails closed.

## Step 5: Mapper Branch

Keep mapper declarative; route normalized props to renderer.

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

## Step 6: Validate Lifecycle Behavior

Required behavior checks:

1. `catchAll` wrapper consumes empty-space clicks.
2. Named handlers are attached on `attach` and removed on `detach`/`destroy`.
3. `resizeSignature` changes trigger `triggerResize()` once per signature change.
4. Surface switch (`html` <-> `canvas-dom`) leaves no stale handlers behind.

Run:

```bash
npm run check:all
```

## Checklist

- [ ] ViewModel contract exists (or existing one reused)
- [ ] HTML renderer exposes `renderHtml`, `namedHandlers`, `resizeSignature`
- [ ] Component registered in `config/components.js`
- [ ] Router inventory updated in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Kind catalog tuple added with `surface: "html"`
- [ ] Mapper branch remains declarative and renderer-aligned
- [ ] Interaction + lifecycle checks pass

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [add-new-text-renderer.md](add-new-text-renderer.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/interactive-widgets.md](../avnav-api/interactive-widgets.md)
