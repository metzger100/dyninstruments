# Canvas DOM Surface Adapter

**Status:** ✅ Implemented | Committed canvas surface lifecycle owner for canvas-dom routes

## Overview

cluster/rendering/CanvasDomSurfaceAdapter.js owns committed canvas lifecycle on the renderHtml host path.

Router responsibilities:

- render inert canvas shell markup
- create committed canvas surface controllers

Adapter responsibilities:

- mount/update/detach/destroy canvas lifecycle
- resize observation and repaint scheduling
- renderCanvas(canvas, props) dispatch to routed renderer
- compatibility with central theme and shell sizing contracts

## Contract Highlights

- renderSurfaceShell() returns stable shell markup with .dyni-surface-canvas-mount
- createSurfaceController(...) fail-closes when rendererSpec.renderCanvas is missing
- first canvas paint occurs after commit on a themed root (theme outputs already materialized)
- no invalidateTheme() API exists in this architecture

## Vertical Sizing Integration

Canvas shells use the same central vertical sizing pipeline as HTML shells.

- ratio sizing materialized through shell aspect-ratio
- natural sizing materialized through shell height
- width remains host-owned in vertical mode

## Related

- cluster-widget-system.md
- runtime-lifecycle.md
- surface-session-controller.md
- host-commit-controller.md
