# FullCircleDialEngine

**Status:** ✅ Implemented | shared full-circle dial renderer pipeline for Compass/Wind widgets

## Overview

`FullCircleDialEngine` centralizes shared full-circle dial rendering concerns: mode routing, geometry, static-layer caching, and tokenized dial helper drawing.
`CompassGaugeWidget` and `WindDialWidget` now provide only widget-specific callbacks.

## Key Details

- Component ID: `FullCircleDialEngine`
- Global key: `DyniFullCircleDialEngine`
- File: `shared/widget-kits/gauge/FullCircleDialEngine.js`
- Depends: `GaugeToolkit`, `CanvasLayerCache`
- Companion helper: `FullCircleDialTextLayout` (`shared/widget-kits/gauge/FullCircleDialTextLayout.js`)
- Cache backend: shared `CanvasLayerCache.createLayerCache({ layers })`
- Mode selection: `GaugeValueMath.computeMode(ratio, thresholdNormal, thresholdFlat)`
- Normal-mode text packing is theme-tunable via `fullCircle.normal.*` tokens (`innerMarginFactor`, `minHeightFactor`, `dualGapFactor`)

## API/Interfaces

### Factory

```javascript
const engine = Helpers.getModule("FullCircleDialEngine").create(def, Helpers);
const renderCanvas = engine.createRenderer(spec);
```

### `createRenderer(spec)` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `ratioProps` | `{normal,flat}` | no | Prop names for mode thresholds |
| `ratioDefaults` | `{normal,flat}` | no | Default mode thresholds |
| `cacheLayers` | `string[]` | no | Layer names passed to `CanvasLayerCache` |
| `layout` | object | no | Shared slot shaping (`highTopFactor`, `highBottomFactor`) |
| `buildStaticKey` | `(state, props) => any` | no | Widget static cache-key payload |
| `rebuildLayer` | `(layerCtx, layerName, state, props, api) => void` | no | Rebuild callback for static layers |
| `drawFrame` | `(state, props, api) => void` | no | Per-frame dynamic render callback |
| `drawMode` | `{flat?,high?,normal?}` | no | Mode-specific text/layout callbacks |
| `drawDisconnect` | `boolean` | no | `false` disables shared disconnect overlay draw |

### Callback state (`state`)

`state` includes:
- `ctx`, `canvas`, `W`, `H`, `mode`
- `theme`, `family`, `color`, `valueWeight`, `labelWeight`
- `pad`, `gap`, `ratio`
- `geom` (`cx`, `cy`, `rOuter`, `ringW`, `labelInsetVal`, `labelPx`, strips)
- `slots` (`leftTop`, `leftBottom`, `rightTop`, `rightBottom`, `top`, `bottom`)
- `bufferW`, `bufferH`, `dpr`, `staticKey`
- Shared toolkit handles: `draw`, `text`, `value`, `angle`

### Callback API (`api`)

- `drawFullCircleRing(targetCtx?, opts?)`
- `drawFullCircleTicks(targetCtx?, opts?)`
- `drawFixedPointer(targetCtx?, angleDeg, opts?)`
- `drawCachedLayer(layerName?, opts?)` (`rotationDeg` supported)
- `getCacheMeta(key)`
- `setCacheMeta(key, value)`

## Related

- [gauge-shared-api.md](gauge-shared-api.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
- [../widgets/wind-dial.md](../widgets/wind-dial.md)
