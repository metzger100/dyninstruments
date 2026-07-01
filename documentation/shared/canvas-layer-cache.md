# Canvas Layer Cache

**Status:** ✅ Implemented | Shared offscreen canvas layer cache for reusable background rendering

## Overview

`CanvasLayerCache` is a shared utility module for canvas widgets that cache one or more offscreen layers and blit them to a target context. It centralizes key-based rebuild control and explicit cache invalidation.

## Key Details

- Component ID: `CanvasLayerCache`
- Global key: `DyniCanvasLayerCache`
- File: `shared/widget-kits/canvas/CanvasLayerCache.js`
- Factory: `create(def, componentContext)`
- Main API: `createLayerCache(spec)`
- Layer config: `spec.layers` array (default: `["layer"]`)
- Key behavior:
  - string key -> used directly
  - non-string key -> `JSON.stringify(key)`
- Rebuild trigger:
  - key changed
  - `invalidate()` called
  - offscreen layer missing/recreated
  - layer buffer size changed
- Blit behavior:
  - `blit(targetCtx)` draws all layers in `spec.layers` order
  - `blitLayer(targetCtx, layerName)` draws a single named layer (no-op for unknown/absent layer)
  - uses 9-argument `drawImage` scaling from offscreen buffer size to last ensured draw size
  - use `blitLayer` when live per-frame content (for example a gauge pointer) must be composited between cached layers

## API/Interfaces

```javascript
const cacheApi = componentContext.components.require("CanvasLayerCache");
const cache = cacheApi.createLayerCache({ layers: ["back", "front"] });

cache.ensureLayer(canvas, key, function (layerCtx, layerName, layerCanvas) {
  layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  // draw static background content for this named layer
});

cache.blitLayer(targetCtx, "back");
// draw live pointer here
cache.blitLayer(targetCtx, "front");
cache.invalidate();
```

Returned `cache` object:

- `ensureLayer(canvas, key, rebuildFn)`
- `blit(targetCtx)`
- `blitLayer(targetCtx, layerName)`
- `invalidate()`

## Related

- [helpers.md](helpers.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../conventions/smell-prevention.md](../conventions/smell-prevention.md)
