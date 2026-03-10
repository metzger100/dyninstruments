# FullCircleRadialEngine

**Status:** ✅ Implemented | shared full-circle dial renderer pipeline for Compass/Wind widgets

## Overview

`FullCircleRadialLayout` now owns full-circle responsive mode selection, insets, geometry, label metrics, and normal-mode bounds.
`FullCircleRadialEngine` is the shared orchestration layer for caching, frame drawing, and widget callback state.
`CompassRadialWidget` and `WindRadialWidget` provide only widget-specific callbacks.

## Key Details

- Component ID: `FullCircleRadialEngine`
- Global key: `DyniFullCircleRadialEngine`
- File: `shared/widget-kits/radial/FullCircleRadialEngine.js`
- Depends: `RadialToolkit`, `CanvasLayerCache`, `FullCircleRadialLayout`
- Layout owner: `FullCircleRadialLayout` (`shared/widget-kits/radial/FullCircleRadialLayout.js`)
- Companion helper: `FullCircleRadialTextLayout` (`shared/widget-kits/radial/FullCircleRadialTextLayout.js`)
- Cache backend: shared `CanvasLayerCache.createLayerCache({ layers })`
- Mode selection/insets/geometry: `FullCircleRadialLayout.computeMode()` + `computeInsets()` + `computeLayout()`
- Normal-mode text packing is theme-tunable via `fullCircle.normal.*` tokens (`innerMarginFactor`, `minHeightFactor`, `dualGapFactor`)

## Ownership Contract

- `ResponsiveScaleProfile` owns the base compact curve.
- `FullCircleRadialLayout` maps that curve into full-circle insets, dial geometry, slot bounds, and compact geometry scales.
- `FullCircleRadialEngine`, `FullCircleRadialTextLayout`, and wrapper `drawFrame` / `drawMode` callbacks consume `state.layout`, `state.responsive`, `state.textFillScale`, and `state.compactGeometryScale`.
- Wrapper widgets must not import `ResponsiveScaleProfile` directly or add a second compact curve via widget-local responsive hard floors.

## API/Interfaces

### Factory

```javascript
const engine = Helpers.getModule("FullCircleRadialEngine").create(def, Helpers);
const renderCanvas = engine.createRenderer(spec);
```

### `createRenderer(spec)` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `ratioProps` | `{normal,flat}` | no | Prop names for mode thresholds |
| `ratioDefaults` | `{normal,flat}` | no | Engine-level safety fallback for missing threshold props; config-backed wrappers should omit it |
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
- `layout`, `responsive`, `textFillScale`, `compactGeometryScale`
- `geom` (`cx`, `cy`, `rOuter`, `ringW`, `needleDepth`, `fixedPointerDepth`, `markerLen`, `markerWidth`, strips)
- `labels` (`radiusOffset`, `fontPx`, `spriteRadius`)
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
- [full-circle-dial-style-guide.md](full-circle-dial-style-guide.md)
- [../shared/canvas-layer-cache.md](../shared/canvas-layer-cache.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
- [../widgets/wind-dial.md](../widgets/wind-dial.md)
