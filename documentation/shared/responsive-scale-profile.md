# ResponsiveScaleProfile

**Status:** ✅ Implemented | Shared runtime owner for repo-wide responsive compaction

## Overview

`shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the repo-wide `minDim -> t` compact curve used by layout-owner modules.
It also exposes the shared intrinsic-spacing helpers used by layout owners to derive compact inner padding, dual gaps, and metric caption bands without reintroducing widget-local spacing formulas.

## Key Details

- Runtime owner: `shared/widget-kits/layout/ResponsiveScaleProfile.js`
- Shared owner responsibility: base `minDim -> t` compaction math, named scale outputs, and intrinsic-spacing helpers used by multiple widget families
- Layout-owner responsibility: map shared scale outputs into family-specific geometry, spacing, share, and text-ceiling rules
- Non-owners: cluster mappers, renderer props, theme tokens, `plugin.css`, and editable parameters
- Base compaction constants stay JS-owned for now; they are not promoted to CSS/theme/runtime config
- One repo-wide base curve is the contract; family-specific outputs may layer on top of it, but they must not replace it with independent widget-local curves
- Local hard floors are allowed only for technical safety bounds (`0`, `1`, `2`, or equivalent non-visual guards)

## API/Interfaces

Runtime API:

```javascript
computeProfile(W, H, spec)
// -> { minDim, t, textFillScale, ...namedScales }

computeInsetPx(profile, ratio, floor)
computeIntrinsicSpacePx(profile, spanPx, ratio, count, floor)
computeIntrinsicTileSpacing(profile, rect, padRatio, captionRatio)
scaleShare(base, scale, min, max)
scaleMaxTextPx(base, textFillScale)
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
- Family layout owners consume those outputs and convert them into rectangles, shares, inner spacing, and max-text ceilings.
- `CenterDisplayLayout`, `ActiveRouteLayout`, `XteHighwayLayout`, and `LinearGaugeLayout` are the primary intrinsic-spacing consumers in the current responsive contract.

## Related

- [../widgets/center-display.md](../widgets/center-display.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [../architecture/vertical-container-contract.md](../architecture/vertical-container-contract.md)
