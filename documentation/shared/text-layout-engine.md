# TextLayoutEngine

**Status:** ✅ Implemented | Shared text mode, fit cache, and row layout facade for text widgets

## Overview

`TextLayoutEngine` centralizes reusable text sizing and row rendering logic used by `ThreeValueTextWidget` and `PositionCoordinateWidget`.

The engine is split into small shared modules to stay under hotspot/file-size limits while exposing one stable API surface.

## Key Details

- Runtime module path: `shared/widget-kits/gauge/TextLayoutEngine.js`
- Internal split modules:
- `shared/widget-kits/gauge/TextLayoutPrimitives.js`
- `shared/widget-kits/gauge/TextLayoutComposite.js`
- Registered component IDs:
- `TextLayoutPrimitives`
- `TextLayoutComposite`
- `TextLayoutEngine`
- Widgets pass preformatted strings; engine does not parse coordinates or select formatters.
- Fit cache is widget-instance local (`createFitCache()` in widget `create()` scope).
- Layout mode routing supports `flat` / `normal` / `high`.

## API/Interfaces

`TextLayoutEngine.create(def, Helpers)` returns:

- Cache: `createFitCache`, `clearFitCache`, `makeFitCacheKey`, `readFitCache`, `writeFitCache`, `resolveFitCache`
- Mode/insets: `computeModeLayout`, `computeInsets`
- Primitive fit/draw: `setFont`, `fitSingleLineBinary`, `fitMultiRowBinary`, `fitValueUnitRow`, `fitInlineTriplet`, `drawInlineTriplet`, `drawDisconnectOverlay`
- Composite layouts: `fitThreeRowBlock`, `drawThreeRowBlock`, `fitValueUnitCaptionRows`, `drawValueUnitCaptionRows`, `fitTwoRowsWithHeader`, `drawTwoRowsWithHeader`

Mode routing shape:

```javascript
const modeData = textEngine.computeModeLayout({
  W, H,
  ratioThresholdNormal,
  ratioThresholdFlat,
  captionUnitScale,
  captionText,
  unitText,
  collapseNoCaptionToFlat: true,
  collapseHighWithoutUnitToNormal: true
});
```

## Related

- [../widgets/three-elements.md](../widgets/three-elements.md)
- [../widgets/position-coordinates.md](../widgets/position-coordinates.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
