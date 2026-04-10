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

- shellRect from mount host drives fit/layout
- layoutSignature + postPatch provide bounded relayout behavior
- no triggerResize-style rerender shim

## Vertical Contract

getVerticalShellSizing returns ratio sizing with aspect ratio 2 in vertical mode.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/cluster-widget-system.md
