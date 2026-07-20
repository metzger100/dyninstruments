# Canvas DOM Surface Adapter

**Status:** ✅ Implemented | Committed canvas surface lifecycle owner for canvas-dom routes

## Overview

`runtime/surface/CanvasDomSurfaceAdapter.js` owns committed canvas lifecycle on the renderHtml host path.

Adapter responsibilities:

- create committed canvas surface controllers
- attach/update/detach committed canvas surfaces
- resize observation and repaint scheduling
- renderCanvas(canvas, props) dispatch to routed renderer
- compatibility with central theme and shell sizing contracts

## Contract Highlights

- `ClusterShellRenderer` owns the inert shell markup and returns stable shell markup with `.dyni-surface-canvas-mount`
- `CanvasDomSurfaceAdapter` owns committed canvas attach/update/detach/paint only
- createSurfaceController(...) fail-closes when rendererSpec.renderCanvas is missing
- first canvas paint occurs after commit on a themed root (theme outputs already materialized)
- no invalidateTheme() API exists in this architecture

## Vertical Sizing Integration

Canvas shells use the same central vertical sizing pipeline as HTML shells.

- ratio sizing materialized through shell aspect-ratio
- current canvas routes use ratio shell sizing
- natural sizing is route-specific and finalized by the committed renderer after activation, not by
  CanvasDomSurfaceAdapter
- width remains host-owned in vertical mode

## Related

- cluster-widget-system.md
- runtime-lifecycle.md
- surface-session-controller.md
- host-commit-controller.md
