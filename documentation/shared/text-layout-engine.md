# TextLayoutEngine

**Status:** ✅ Implemented | Shared text mode, fit cache, and row layout facade for text widgets

## Overview

`TextLayoutEngine` centralizes reusable text sizing and row rendering logic used by `ThreeValueTextWidget` and `PositionCoordinateWidget`.

The engine is split into small shared modules to stay under hotspot/file-size limits while exposing one stable API surface.

## Key Details

- Runtime module path: `shared/widget-kits/text/TextLayoutEngine.js`
- Shared responsive dependency: `shared/widget-kits/layout/ResponsiveScaleProfile.js`
- Internal split modules:
  - `shared/widget-kits/text/TextLayoutPrimitives.js`
  - `shared/widget-kits/text/TextLayoutComposite.js`
- Registered component IDs:
  - `TextLayoutPrimitives`
  - `TextLayoutComposite`
  - `TextLayoutEngine`
- Widgets pass preformatted strings; engine does not parse coordinates or select formatters.
- Fit cache is widget-instance local (`createFitCache()` in widget `create()` scope).
- Layout mode routing supports `flat` / `normal` / `high`.

## Ownership Contract

- `ResponsiveScaleProfile` owns the shared `minDim -> t` compaction curve.
- `TextLayoutEngine` is the shared text-family layout owner for reusable numeric and coordinate renderers.
- New shared text renderers should use `computeResponsiveInsets(W, H)` and consume `insets.responsive.textFillScale` for compact text-ceiling boosts.
- Widgets with distinct geometry contracts should create a dedicated shared layout-owner module such as `ActiveRouteLayout` or `XteHighwayLayout` instead of embedding responsive floors in renderer code.
- Consumer renderers read layout-owned `responsive` / `textFillScale`; they do not import `ResponsiveScaleProfile` directly.

## API/Interfaces

`TextLayoutEngine.create(def, Helpers)` returns:

- Cache: `createFitCache`, `clearFitCache`, `makeFitCacheKey`, `readFitCache`, `writeFitCache`, `resolveFitCache`
- Mode/insets: `computeModeLayout`, `computeInsets`, `computeResponsiveInsets`
- Responsive scaling: `scaleMaxTextPx`
- Primitive fit/draw: `setFont`, `fitSingleLineBinary`, `fitMultiRowBinary`, `fitValueUnitRow`, `fitInlineTriplet`, `drawInlineTriplet`, `drawDisconnectOverlay`
- Composite layouts: `fitThreeRowBlock`, `drawThreeRowBlock`, `fitValueUnitCaptionRows`, `drawValueUnitCaptionRows`, `fitTwoRowsWithHeader`, `drawTwoRowsWithHeader`

Responsive inset shape:

```javascript
const insets = textEngine.computeResponsiveInsets(W, H);
// -> { padX, innerY, gapBase, responsive: { minDim, t, textFillScale } }
```

New shared text renderers should treat `computeResponsiveInsets(...)` as the stable responsive contract. `computeInsets(...)` remains a low-level helper, not the cross-widget ownership boundary.

Composite fit calls accept optional `textFillScale` and use it only as a consumer-side ceiling boost for compact caption/unit/header text. The shared profile still owns the compact curve itself.

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
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
