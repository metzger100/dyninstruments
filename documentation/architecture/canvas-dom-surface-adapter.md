# Canvas DOM Surface Adapter

**Status:** Current.

## Overview

`runtime/surface/CanvasDomSurfaceAdapter.js` owns committed canvas lifecycle on the renderHtml host path.

Adapter responsibilities:

- create committed canvas surface controllers
- attach/update/detach committed canvas surfaces
- resize observation and repaint scheduling
- renderCanvas(canvas, props) dispatch to routed renderer
- compatibility with central theme and shell sizing contracts

## Key Details

- Source file: `runtime/surface/CanvasDomSurfaceAdapter.js`.
- `ClusterShellRenderer` owns the inert shell markup and the stable `.dyni-surface-canvas-mount` mount host; the adapter
  never touches pre-commit shell markup.
- `createSurfaceController(...)` fail-closes (throws) when `rendererSpec.renderCanvas` is missing.
- Routed renderers are dispatched through `renderCanvas(canvas, props)`.
- First canvas paint happens after commit, on a themed root whose theme outputs are already materialized.
- There is no `invalidateTheme()` API in this architecture.
- Ratio-sized canvas shells materialize sizing via shell aspect-ratio; natural sizing is route-specific and finalized by
  the committed renderer after activation, not by `CanvasDomSurfaceAdapter`.
- In vertical mode, width stays host-owned; only height/sizing beyond that is adapter/renderer concern.

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
