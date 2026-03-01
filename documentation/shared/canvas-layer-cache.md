# Canvas Layer Cache

**Status:** ✅ Implemented | Shared offscreen canvas layer cache for reusable background rendering

## Overview

`CanvasLayerCache` is a shared utility module for canvas widgets that cache one or more offscreen layers and blit them to a target context. It centralizes key-based rebuild control and explicit cache invalidation.

## Key Details

- Component ID: `CanvasLayerCache`
- Global key: `DyniCanvasLayerCache`
- File: `shared/widget-kits/canvas/CanvasLayerCache.js`
- Factory: `create(def, Helpers)`
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
  - draws layers in `spec.layers` order
  - uses 9-argument `drawImage` scaling from offscreen buffer size to last ensured draw size

## API/Interfaces

```javascript
const cacheMod = Helpers.getModule("CanvasLayerCache");
const cacheApi = cacheMod.create(def, Helpers);
const cache = cacheApi.createLayerCache({ layers: ["back", "front"] });

cache.ensureLayer(canvas, key, function (layerCtx, layerName, layerCanvas) {
  layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  // draw static background content for this named layer
});

cache.blit(targetCtx);
cache.invalidate();
```

Returned `cache` object:

- `ensureLayer(canvas, key, rebuildFn)`
- `blit(targetCtx)`
- `invalidate()`

## Related

- [helpers.md](helpers.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../conventions/smell-prevention.md](../conventions/smell-prevention.md)
