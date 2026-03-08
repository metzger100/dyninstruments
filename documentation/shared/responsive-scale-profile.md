# ResponsiveScaleProfile

**Status:** ✅ Implemented | Shared runtime owner for repo-wide responsive compaction

## Overview

`shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the repo-wide `minDim -> t` compact curve used by layout-owner modules.
Phase 1 extracts the `CenterDisplay` baseline into this shared runtime module without changing `CenterDisplay` geometry ownership.

## Key Details

- Runtime owner: `shared/widget-kits/layout/ResponsiveScaleProfile.js`
- Shared owner responsibility: base `minDim -> t` compaction math plus named scale outputs used by multiple widget families
- Layout-owner responsibility: map shared scale outputs into family-specific geometry, spacing, share, and text-ceiling rules
- Non-owners: cluster mappers, renderer props, theme tokens, `plugin.css`, and editable parameters
- Base compaction constants stay JS-owned for now; they are not promoted to CSS/theme/runtime config in Phase 1
- One repo-wide base curve is the contract; family-specific outputs may layer on top of it, but they must not replace it with independent widget-local curves
- Local hard floors are allowed only for technical safety bounds (`0`, `1`, `2`, or equivalent non-visual guards)

## API/Interfaces

Runtime API:

```javascript
computeProfile(W, H, spec)
// -> { minDim, t, textFillScale, ...namedScales }

computeInsetPx(profile, ratio, floor)
scaleShare(base, scale, min, max)
scaleMaxTextPx(base, textFillScale)
```

Shared base curve:

```text
minDim = max(1, min(W, H))
t = clamp((minDim - 80) / 100, 0, 1)
```

`CenterDisplayLayout` Phase 1 scale minima:

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

- Shared profile owns compaction math, interpolation, and named scale outputs.
- Family layout owners consume those outputs and convert them into rectangles, shares, and max-text ceilings.
- `CenterDisplayLayout` is the current reference consumer in Phase 1.

## Related

- [../widgets/center-display.md](../widgets/center-display.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [../PLAN2.md](../PLAN2.md)
