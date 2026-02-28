# Canvas Layer Caching Convention

**Status:** ✅ Implemented | Standard static/dynamic cache contract for canvas widgets

## Overview

Use this convention for all canvas widgets that use `CanvasLayerCache`. Cache only static layer content and keep per-frame values in dynamic draw paths.

## Key Details

- Shared utility/API doc: [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- Applies to semicircle gauges and full-circle dials
- Cache objective: avoid rebuilding static dial/background primitives on every frame
- Hard rule: if a prop can change every frame, it must not be part of the static cache key

## Cache Scope Rules

Cache these static elements:
- Rings, arc strokes, tick marks
- Static label sprites and fixed label maps
- Geometry-bound primitives that change only on resize/style/token updates

Do not cache these dynamic elements:
- Live values (`heading`, `speed`, `angle`, sensor values)
- Live text output (formatted value/caption/unit)
- Disconnect/no-data overlay state
- Marker/needle positions driven by live values

## Cache Key Design Rules

Include in static key:
- Canvas buffer and draw dimensions (`canvas.width`, `canvas.height`, `W`, `H`, `dpr`)
- Dial geometry (`cx`, `cy`, radii, ring/tick geometry, label inset/radius/font px)
- Style/theme token inputs (colors, line widths, tick lengths, pointer style factors)
- Typography config (font family, label weight, resolved text color)
- Label-set signature (for example `N|NE|E|SE|S|SW|W|NW`)

Exclude from static key:
- Live data values (`heading`, `speed`, `angle`, current reading)
- Disconnect state
- Per-frame marker/needle angles or positions
- Per-frame formatter outputs

Rule:
- If a prop changes on every frame, it must NOT be in the key.

## API/Interfaces

Lifecycle pattern (`ensure -> rebuild -> blit`):

```javascript
const cacheMod = Helpers.getModule("CanvasLayerCache");
const cacheApi = cacheMod.create(def, Helpers);
const cache = cacheApi.createLayerCache({ layers: ["back"] });

cache.ensureLayer(canvas, staticKey, function (layerCtx, layerName, layerCanvas) {
  layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  // draw static background content only
});

cache.blit(targetCtx);
// dynamic pointer/text/overlay drawing happens after blit
```

`CanvasLayerCache` rebuilds when:
- key changes
- `cache.invalidate()` is called
- layer buffer is missing/recreated
- layer buffer size changes

## Invalidation Triggers

- Canvas resize or DPR/buffer dimension changes
- Theme mode/preset changes that alter resolved tokens
- Style token updates (ring/tick/pointer/line widths/colors)
- Typography changes (font family/weight/label size factors)
- Label set or label sprite signature changes

## Anti-Patterns

| Anti-pattern | Impact | Required fix |
|---|---|---|
| Cache everything (including dynamic values) | Frequent key churn and expensive rebuilds | Move live values/text/marker state out of static key and draw per frame |
| Cache nothing | Rebuild static dial art every frame; jank under load | Cache static background layers via `CanvasLayerCache` |
| Put live values in static key | Cache invalidates every frame; no reuse | Restrict key to geometry/style/token/typography/label signature inputs |

## Related

- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../gauges/full-circle-dial-style-guide.md](../gauges/full-circle-dial-style-guide.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
