# Canvas DOM Surface Adapter

**Status:** ✅ Implemented | `canvas-dom` surface owner used by `ClusterRendererRouter`

## Overview

`cluster/rendering/CanvasDomSurfaceAdapter.js` owns the internal canvas lifecycle on the HTML host path.
`ClusterRendererRouter` uses it for:

- stable canvas-surface shell generation (`renderSurfaceShell`)
- `canvas-dom` controller creation (`createSurfaceController`) for surface-session lifecycle hooks

## Key Details

- File: `cluster/rendering/CanvasDomSurfaceAdapter.js`
- Component ID: `CanvasDomSurfaceAdapter`
- Router integration owner: `cluster/rendering/ClusterRendererRouter.js` (`canvas-dom` branch)
- Strict contract:
  - throws when `rendererSpec.renderCanvas` is missing
  - throws when `ResizeObserver` is unavailable
  - throws when shell mount target `.dyni-surface-canvas-mount` is missing
- Shell markup owner:
  - `renderSurfaceShell()` returns stable canvas-surface markup
  - no prop-dependent HTML changes inside the canvas mount subtree
- Surface contract ownership:
  - internal canvas node creation/removal
  - resize observation + repaint scheduling
  - explicit `invalidateTheme()` path with ThemeResolver cache invalidation
  - attach/update/detach/destroy lifecycle

## API/Interfaces

```javascript
const adapter = Helpers.getModule("CanvasDomSurfaceAdapter").create(def, Helpers);

adapter.renderSurfaceShell(); // -> stable HTML string

const controller = adapter.createSurfaceController({
  rendererSpec,                // required, must implement renderCanvas(canvas, props)
  hostContext,                 // optional
  requestAnimationFrame,       // optional override
  cancelAnimationFrame,        // optional override
  ResizeObserver               // optional override; required by contract
});

controller.attach({ surface, rootEl, shellEl, props, revision });
controller.update({ surface, rootEl, shellEl, props, revision });
controller.detach(reason);
controller.destroy();
controller.invalidateTheme(reason);
```

### Payload Contract (`attach` / `update`)

| Key | Type | Required | Notes |
|---|---|---|---|
| `surface` | `string` | no | when present, must be `"canvas-dom"` |
| `rootEl` | `Element` | yes | widget root for theme invalidation |
| `shellEl` | `Element` | yes | shell containing `.dyni-surface-canvas-mount` |
| `props` | `any` | no | renderer props snapshot |
| `revision` | `number` | yes | finite revision id from runtime/session ownership |

## Related

- [cluster-widget-system.md](cluster-widget-system.md)
- [surface-session-controller.md](surface-session-controller.md)
- [host-commit-controller.md](host-commit-controller.md)
