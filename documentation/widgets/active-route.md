# Active Route HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for nav/activeRoute

## Overview

ActiveRouteTextHtmlWidget is a committed HTML renderer routed by ClusterRendererRouter.

- surface: html
- shell: inert pre-commit markup only
- semantic DOM: committed renderer mount/update lifecycle in shadow root
- interaction: runtime surface policy dispatch/passive mode

## Interaction Contract

- dispatch mode attaches direct click listeners on the committed wrapper
- passive mode keeps content non-interactive
- action dispatch uses surfacePolicy.actions.routeEditor.openActiveRoute()
- wrapper-level click suppression prevents blank-space propagation in dispatch mode

## Layout Contract

- shellRect from `.dyni-surface-html-mount` is the authoritative geometry input for fit/layout.
- HtmlSurfaceController owns the committed shadow-root box contract and injects the base fill rules for `:host` and `.dyni-html-root`.
- ActiveRoute markup and CSS can rely on wrapper/tile `width:100%` and `height:100%` resolving against that controller-owned contract.
- no triggerResize-style rerender shim and no resize-observer path for this renderer

## Vertical Contract

getVerticalShellSizing returns ratio sizing with aspect ratio 2 in vertical mode.

## Text-Fit Contract

- `shared/widget-kits/nav/ActiveRouteLayout.js` owns mode geometry and metric tile spacing, including caption band sizing.
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js` owns text measurement and emits inline style payload:
  - `routeNameStyle`
  - `metrics.<id>.captionStyle`
  - `metrics.<id>.valueStyle`
  - `metrics.<id>.unitStyle`
- `ActiveRouteTextHtmlWidget.renderMetricTile()` applies all metric fit styles, including caption fit on `.dyni-active-route-metric-caption`.
- Missing fit inputs fail closed (`compute()` returns `null`), and renderer output stays valid without extra relayout loops.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/cluster-widget-system.md
