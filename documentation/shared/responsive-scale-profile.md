# ResponsiveScaleProfile

**Status:** ✅ Implemented | Shared runtime owner for repo-wide responsive compaction

## Overview

`shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the repo-wide `minDim -> t` compact curve used by
layout-owner modules. `shared/widget-kits/layout/GeometryScale.js` is the shared factor-to-pixel scaler for graphical
dimensions. Together they let layout owners keep responsive text/layout compaction separate from graphical geometry
scaling.

## Key Details

- Runtime owner: `shared/widget-kits/layout/ResponsiveScaleProfile.js`
- Shared owner responsibility: base `minDim -> t` compaction math, named scale outputs, and intrinsic-spacing helpers
  used by multiple widget families
- Layout-owner responsibility: map shared scale outputs into family-specific geometry, spacing, share, and text-ceiling
  rules
- Non-owners: cluster mappers, renderer props, theme tokens, `plugin.css`, and editable parameters
- Graphical factor-to-pixel scaling is handled by `GeometryScale.scale()`, `GeometryScale.scaleStroke()`, and
  `GeometryScale.scalePointer()`
- Adaptive geometry floors are derived from stroke-weight presets via `GeometryScale.strokeFloor(strokeWeight)` and
  `GeometryScale.extentFloor(strokeWeight)`
- Family primary dimensions:
  - radial = radius
  - linear = `min(trackBox.w, trackBox.h)`
  - XTE = `min(highway.w, highway.h)`
- `compactGeometryScale` only tightens text/layout spacing, label insets, and slot ceilings; it does not scale graphical
  dimensions
- Base compaction constants stay JS-owned for now; they are not promoted to CSS/theme/runtime config
- One repo-wide base curve is the contract; family-specific outputs may layer on top of it, but they must not replace it
  with independent widget-local curves
- Local hard floors are allowed only for technical safety bounds (`0`, `1`, `2`, or equivalent non-visual guards)

## API/Interfaces

GeometryScale API:

```javascript
scale(primaryDim, factor, floor);
scaleStroke(primaryDim, factor, strokeWeight, floor);
scalePointer(primaryDim, factor, weight, floor);
strokeFloor(strokeWeight);
extentFloor(strokeWeight);
```

Adaptive floor derivation:

```text
strokeFloor = max(1, round(strokeWeight * 2))
extentFloor = strokeFloor + 1
```

Expected preset floors (derived from existing weights, no new theme tokens):

| Preset       | strokeWeight | strokeFloor | extentFloor |
| ------------ | -----------: | ----------: | ----------: |
| slim         |         0.66 |           1 |           2 |
| default      |         1.28 |           3 |           4 |
| bold         |          2.2 |           4 |           5 |
| highcontrast |         1.32 |           3 |           4 |

Runtime API:

```javascript
computeProfile(W, H, spec);
// -> { minDim, t, textFillScale, ...namedScales }

computeInsetPx(profile, ratio, floor);
computeIntrinsicSpacePx(profile, spanPx, ratio, count, floor);
computeIntrinsicTileSpacing(profile, rect, padRatio, captionRatio);
scaleShare(base, scale, min, max);
scaleMaxTextPx(base, textFillScale);
```

Shared base curve:

```text
minDim = max(1, min(W, H))
t = clamp((minDim - 80) / 100, 0, 1)
```

`CenterDisplayLayout` scale minima:

```text
textFillScale = lerp(1.18, 1, t)
normalCaptionShareScale = lerp(0.78, 1, t)
flatCenterShareScale = lerp(0.84, 1, t)
stackedCaptionScale = lerp(0.76, 1, t)
highCenterWeightScale = lerp(0.88, 1, t)
```

Current nav-owned inset formulas that remain local geometry decisions:

```text
padX = max(1, floor(minDim * 0.03))
innerY = max(1, floor(minDim * 0.02))
gap = max(1, floor(minDim * 0.03))
```

- Shared intrinsic-spacing formula for inner layout rhythm:

```text
spacePx = max(floor, floor((spanPx * ratio) / (sqrt(count) * textFillScale)))
```

- Shared profile owns compaction math, interpolation, and named scale outputs.
- Family layout owners consume those outputs and convert them into rectangles, shares, inner spacing, and max-text
  ceilings.
- `CenterDisplayLayout`, `ActiveRouteLayout`, `XteHighwayLayout`, and `LinearGaugeLayout` are the primary
  intrinsic-spacing consumers in the current responsive contract.

## Related

- [../widgets/center-display.md](../widgets/center-display.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [../architecture/vertical-container-contract.md](../architecture/vertical-container-contract.md)
