# PLAN18 — Uniform geometry scaling for graphical widgets

## Status

Ready to implement. This plan lands after PLAN17.

## Goal

Make every graphical element in the radial, linear, and XTE widget families scale proportionally with widget size. Today, tick lengths, tick widths, ring arc line width, pointer dimensions, course markers, XTE highway lines, and XTE boat marker use a mix of absolute pixel values from theme tokens and ad-hoc radius-based factors. This produces visual bugs at small and large sizes: major ticks clip into labels on small compass dials, course markers are hidden by ticks on small compasses, and strokes appear disproportionately thick or thin at non-reference sizes.

Replace the mixed scaling model with a single uniform contract: every graphical dimension is a dimensionless factor of the widget family's primary dimension, with optional preset-level category multipliers for stroke weight and pointer weight.

## Repository findings

Current scaling inconsistencies traced in the uploaded repository:

- `ThemeModel.js` defines `radial.ticks.majorLen: 12`, `radial.ticks.majorWidth: 3`, `radial.ring.arcLineWidth: 2`, `linear.ticks.majorLen: 12`, etc. as absolute pixel values. These do not scale with widget size.
- `FullCircleRadialLayout.js` derives `ringW` from `radius * ringWidthFactor` (proportional) but `FullCircleRadialEngine.js` passes `theme.radial.ticks.majorLen` (absolute px) through `resolveResponsiveTickLen`, which applies `compactGeometryScale` and a soft cap against `labelInset`. This partial fix only helps full-circle dials.
- `SemicircleRadialEngine.js` passes `theme.radial.ticks.majorLen` and `theme.radial.ticks.majorWidth` directly to draw calls with no scaling at all.
- `LinearGaugeEngine.js` passes `theme.linear.ticks.majorLen` and `theme.linear.ticks.minorLen` directly to `drawStaticLayer`. Track thickness uses `trackBox.h * theme.linear.track.widthFactor * compactGeometryScale` (partially proportional).
- `RadialCanvasPrimitives.drawPointerAtRim` takes `depth` as a pixel value, then multiplies by `lengthFactor` and `widthFactor` — a two-level indirection.
- `XteHighwayPrimitives.js` derives line widths from `nearHalf` with internal ratio formulas (`nearHalf * 0.012`), then multiplies by `theme.xte.lineWidthFactor`. This is the closest to the target model but uses `nearHalf` rather than the constraining dimension.
- `compactGeometryScale` is applied to some graphical elements in some families (full-circle ring, pointer, label font, normal-layout extras) but not others (semicircle ticks, linear ticks, XTE). This creates the non-uniform appearance.
- Theme presets (`slim`, `bold`, `highcontrast`) override 6–8 individual absolute px tokens each, which is fragile and requires updating every preset whenever a new graphical element is added.
- Hard floors differ between families: semicircle uses `Math.max(14, ...)` for radius, `Math.max(6, ...)` for ring, `Math.max(8, ...)` for needle depth. Full-circle and linear use `Math.max(1, ...)`. `LinearCanvasPrimitives.drawPointer` uses `Math.max(4, ...)` for depth and side. `XteHighwayPrimitives` uses `Math.max(1.2, ...)` for rail width, `Math.max(4, ...)` for marker length, `Math.max(3, ...)` for marker beam, `Math.max(1.4, ...)` for centerline width, `Math.max(2.6, ...)` for boat edge radius, and `clamp(..., 3, ...)` for seam length. `RadialCanvasPrimitives.drawPointerAtRim` uses `Math.max(2, ...)` for base depth, `Math.max(8, ...)` for pointer width, and `Math.max(4, ...)` for half-width. `RadialCanvasPrimitives.drawArrow` uses `Math.max(2, ...)` for arrowhead size. No consistent convention.

## Product decisions already resolved

- All graphical-dimension theme tokens convert from absolute px to dimensionless factors of the primary dimension. Clean replacement, no backward compatibility shim, no parallel tokens.
- Primary dimensions: radial (full-circle and semicircle) = `radius`; linear = `min(trackBox.w, trackBox.h)`; XTE = `min(highway.w, highway.h)`.
- Reference size for deriving default factor values: 300×300 widget (radius 150 for radial).
- Pointer depth and width collapse from two-level indirection (`needleDepth × lengthFactor`) to a single direct factor of the primary dimension.
- Theme presets express intent through three category multipliers — `strokeWeight`, `pointerDepthWeight`, and `pointerSideWeight` — instead of overriding individual tokens. All line/stroke widths scale by `strokeWeight`; pointer depth scales by `pointerDepthWeight`; pointer side/width and course marker width scale by `pointerSideWeight`. Tick lengths and other geometric extents use only the base factor with no preset multiplier.
- `pointerDepthWeight` defaults to `1.0` and is not overridden by any preset — pointer depth stays constant across presets. `pointerSideWeight` carries the per-preset width intent from the old `pointer.widthFactor` overrides.
- Remove `compactGeometryScale` from all graphical element computations. The factor × primaryDim product inherently scales correctly. Keep `compactGeometryScale` only for text-layout concerns (label font, label inset, text slot spacing, compact center height). Where a text-layout value was previously derived transitively from a graphical element that carried `compactGeometryScale` (e.g. full-circle `labelRadiusOffset` derived from `ringW`, full-circle `labelRadius` derived from `ringW`), apply `compactGeometryScale` directly to the text-layout value.
- Remove the `resolveResponsiveTickLen` soft cap in `FullCircleRadialEngine`. Factor-based scaling keeps the tick-to-label-inset ratio constant at all sizes, eliminating the clipping scenario the cap was designed to prevent.
- Standardize all hard floors to `Math.max(1, ...)` across all families and all primitives. This includes higher floors in `SemicircleRadialLayout` (6, 8, 14), `RadialCanvasPrimitives.drawPointerAtRim` (2, 8, 4), `RadialCanvasPrimitives.drawArrow` (2), `LinearCanvasPrimitives.drawPointer` (4), and `XteHighwayPrimitives` (1.2, 1.4, 2.6, 3, 3, 4). These were compensating for the mixed-scaling problem and are unnecessary with uniform factor-based scaling.
- Pre-split `LinearGaugeEngine.js` (384 non-empty lines) before applying scaling changes to stay within the 400-line limit.
- Create a shared `GeometryScale.js` helper in `shared/widget-kits/layout/` to centralize the `Math.max(1, Math.floor(primaryDim * factor * weight))` formula.
- No compatibility or migration work is needed because the plugin is not published and not in use.
- Collapsing the two-level pointer indirection into a single factor changes the flooring point, which produces a known ±1 px delta at some sizes (e.g. radial pointer depth: old `floor(floor(150 × 0.11) × 2) = 32`, new `floor(150 × 0.22) = 33`). This is an accepted consequence of the simplification and is not a regression.
- Collapsing per-token preset overrides into single category multipliers produces known deltas for non-default presets where old per-token ratios were not uniform. `highcontrast` `majorTickWidth` increases from 3 to 4 at reference size (`strokeWeight` tuned for `minorTickWidth` preservation). `highcontrast` XTE stroke widths change from 87% of default to 135% of default (the old `xte.lineWidthFactor: 1.3` was thinner than the default `1.5`, which was inconsistent with the high-contrast intent; the new behavior corrects this). `bold` `arcLineWidth` and `trackLineWidth` decrease from 2.5 (subpixel) to 2 (integer). These are accepted consequences of the single-weight design.

## Token conversion table

Reference dimension: 150 (radius of a 300×300 radial widget).

### Radial tokens

```text
old token (absolute px)                  → new token (factor)                       derivation
─────────────────────────────────────────────────────────────────────────────────────────────────
radial.ticks.majorLen: 12                → radial.ticks.majorLenFactor: 0.08        12/150
radial.ticks.majorWidth: 3               → radial.ticks.majorWidthFactor: 0.02      3/150
radial.ticks.minorLen: 7                 → radial.ticks.minorLenFactor: 0.047       7/150
radial.ticks.minorWidth: 1.5             → radial.ticks.minorWidthFactor: 0.01      1.5/150
radial.ring.arcLineWidth: 2              → radial.ring.arcLineWidthFactor: 0.013    2/150
radial.pointer.widthFactor: 1            → radial.pointer.depthFactor: 0.22         0.11 * 2 (collapsed)
radial.pointer.lengthFactor: 2           → (removed, folded into depthFactor)
                                           radial.pointer.sideFactor: 0.11          0.11 * 1 (collapsed)
radial.ring.widthFactor: 0.16            → (unchanged — already a factor)
radial.labels.insetFactor: 1.8           → (unchanged — already relative to ringW)
radial.labels.fontFactor: 0.14           → (unchanged — already a factor of radius)
```

`radial.pointer.depthFactor` replaces the old chain `needleDepth = radius * 0.11` → `depth = needleDepth * lengthFactor`. The new single factor gives the full pointer depth directly: `depth = radius * depthFactor`.

`radial.pointer.sideFactor` replaces the old chain `needleDepth = radius * 0.11` → `halfWidth = needleDepth * widthFactor / 2`. The new factor gives the pointer half-width base directly: `halfWidth = radius * sideFactor / 2`.

### Linear tokens

Reference dimension: `min(trackBox.w, trackBox.h)` at a 300×300 widget. For a typical normal-mode layout at 300×300, `trackBox.h` ≈ 110 is the constraining axis. Use reference 110.

```text
old token (absolute px)                  → new token (factor)                       derivation
─────────────────────────────────────────────────────────────────────────────────────────────────
linear.ticks.majorLen: 12                → linear.ticks.majorLenFactor: 0.109       12/110
linear.ticks.majorWidth: 3               → linear.ticks.majorWidthFactor: 0.027     3/110
linear.ticks.minorLen: 7                 → linear.ticks.minorLenFactor: 0.064       7/110
linear.ticks.minorWidth: 1.5             → linear.ticks.minorWidthFactor: 0.014     1.5/110
linear.track.lineWidth: 2                → linear.track.lineWidthFactor: 0.018      2/110
linear.pointer.widthFactor: 1            → linear.pointer.depthFactor: 0.24         0.12 * 2 (collapsed)
linear.pointer.lengthFactor: 2           → (removed, folded into depthFactor)
                                           linear.pointer.sideFactor: 0.12          0.12 * 1 (collapsed)
linear.track.widthFactor: 0.16           → (unchanged — already a factor)
linear.labels.insetFactor: 1.8           → (unchanged — already relative)
linear.labels.fontFactor: 0.14           → (unchanged — already a factor)
```

`linear.pointer.depthFactor` replaces the old chain `pointerDepthBase = trackBox.h * 0.12` → `depth = pointerDepthBase * lengthFactor`. The new single factor gives the full pointer depth directly: `depth = primaryDim * depthFactor`. At reference 110: `110 * 0.24 = 26`, matching the old `110 * 0.12 * 2 = 26`.

`linear.pointer.sideFactor` replaces the old chain `pointerWidth = pointerDepthBase * widthFactor` → `side = pointerWidth / 2`. The new factor gives the full pointer width base: `halfWidth = primaryDim * sideFactor / 2`. At reference 110: `110 * 0.12 / 2 = 6`, matching the old `110 * 0.12 * 1 / 2 = 6`.

### XTE tokens

XTE internal line sizing already uses ratio-based formulas (`nearHalf * 0.012` for rail width). The theme tokens `xte.lineWidthFactor` and `xte.boatSizeFactor` are already dimensionless multipliers. Under the new system:

- Replace the internal `nearHalf`-based sizing with `min(highway.w, highway.h)`-based factors.
- Remove `xte.lineWidthFactor` and `xte.boatSizeFactor` as dedicated tokens; their function is absorbed by the shared `strokeWeight` and `pointerDepthWeight` category multipliers.

```text
old token                                → new token                                 note
─────────────────────────────────────────────────────────────────────────────────────────────────
xte.lineWidthFactor: 1.5                → (removed — absorbed by strokeWeight)
xte.boatSizeFactor: 1                   → (removed — absorbed by pointerDepthWeight)
```

New internal XTE factors derived from current behavior at a 300×300 normal-mode highway rect (highway ≈ 280×170, min = 170). The old code uses `nearHalf = rect.w * 0.43 = 120.4` as its scaling dimension, and the default `lineWidthFactor` is 1.5. To reproduce the current default visual with the new `min(w,h)` reference and `strokeWeight: 1.0`, each stroke factor absorbs both the dimension change (`nearHalf / min = 120.4 / 170 ≈ 0.708`) and the removed `lineWidthFactor` default (×1.5). Boat factors absorb only the dimension change (`boatSizeFactor` defaulted to 1).

```text
factor                    value    derivation
──────────────────────────────────────────────────────────────
railWidthFactor:          0.013    nearHalf(120.4) * 0.012 * lwf(1.5) / min(170)
crossbarWidthFactor:      0.010    nearHalf(120.4) * 0.009 * lwf(1.5) / min(170)
seamWidthFactor:          0.007    nearHalf(120.4) * 0.009 * 0.7 * lwf(1.5) / min(170)
horizonWidthFactor:       0.012    nearHalf(120.4) * 0.012 * 0.9 * lwf(1.5) / min(170)
centerlineWidthFactor:    0.017    nearHalf(120.4) * 0.016 * lwf(1.5) / min(170)
boatLengthFactor:         0.078    nearHalf(120.4) * 0.11 / min(170)
boatBeamRatio:            0.62     beam as fraction of length (unchanged)
```

These are internal constants in `XteHighwayPrimitives.js`, not theme tokens. They derive their pixel sizes from `min(highway.w, highway.h)`.

### Category multipliers (new theme tokens)

```text
token                 CSS var                          type    default
──────────────────────────────────────────────────────────────────────
strokeWeight          --dyni-stroke-weight             number  1.0
pointerDepthWeight    --dyni-pointer-depth-weight      number  1.0
pointerSideWeight     --dyni-pointer-side-weight       number  1.0
```

`strokeWeight` multiplies all stroke-width factors (tick widths, arc line width, track line width, XTE line widths, XTE centerline width). `pointerDepthWeight` multiplies pointer depth factors (pointer depth, XTE boat length). `pointerSideWeight` multiplies pointer side/width factors (pointer side, course marker width). Tick lengths, ring annular width, and other geometric extents do not use a preset multiplier — they are `primaryDim × factor` only.

### Preset conversion

```text
preset          strokeWeight    pointerDepthWeight    pointerSideWeight
──────────────────────────────────────────────────────────────────────
default         1.0             1.0                   1.0
slim            0.67            1.0                   0.72
bold            1.4             1.0                   1.54
highcontrast    1.35            1.0                   1.4
```

Derivation: `slim.strokeWeight` = old `majorWidth: 2` / default `majorWidth: 3` = 0.67. `slim.pointerSideWeight` = old `pointer.widthFactor: 0.72`. `bold.strokeWeight` = old `majorWidth: 4` / default `majorWidth: 3` ≈ 1.33, rounded to 1.4 to cover heavier strokes like `arcLineWidth` and `trackLineWidth`. `highcontrast.strokeWeight` = 1.35 (tuned to preserve `minorTickWidth: 2` at reference: `floor(150 × 0.01 × 1.35) = floor(2.025) = 2`). All `pointerDepthWeight` values are `1.0` — no preset changes pointer depth.

Each preset shrinks to three numbers. All per-token overrides in the preset `base` objects are removed and replaced by `strokeWeight`, `pointerDepthWeight`, and `pointerSideWeight` only.

Accepted preset deltas from the single-weight collapse:

- `highcontrast` `majorTickWidth` at reference increases from 3 to 4 (`floor(150 × 0.02 × 1.35) = 4`). The old preset did not override `majorWidth` (it equalled the default 3), but the `strokeWeight` tuned for `minorTickWidth` preservation pushes it up. This is an inherent trade-off of collapsing independent per-token overrides into one weight.
- `highcontrast` XTE stroke widths change from thinner-than-default to thicker-than-default. The old preset had `xte.lineWidthFactor: 1.3` vs default `1.5` (87% of default). The new `strokeWeight: 1.35` makes them 135% of default. The old behavior was inconsistent with the high-contrast intent (thicker lines for readability); the new behavior is a correction.
- `bold` `arcLineWidth` and `trackLineWidth` decrease from 2.5 (subpixel) to 2 (integer). The old per-token values had a ratio to default (1.25) that differs from `majorWidth`'s ratio (1.33). The chosen `strokeWeight: 1.4` favors the tick widths; the arc/track lines get crisper integer rendering at a slight thickness reduction.

### CSS custom property renames

All renamed tokens get corresponding CSS custom property renames:

```text
old CSS var                          → new CSS var
──────────────────────────────────────────────────────────────
--dyni-radial-tick-major-len         → --dyni-radial-tick-major-len-factor
--dyni-radial-tick-major-width       → --dyni-radial-tick-major-width-factor
--dyni-radial-tick-minor-len         → --dyni-radial-tick-minor-len-factor
--dyni-radial-tick-minor-width       → --dyni-radial-tick-minor-width-factor
--dyni-radial-arc-linewidth          → --dyni-radial-arc-linewidth-factor
--dyni-radial-pointer-width          → --dyni-radial-pointer-side-factor
--dyni-radial-pointer-length         → --dyni-radial-pointer-depth-factor
--dyni-linear-tick-major-len         → --dyni-linear-tick-major-len-factor
--dyni-linear-tick-major-width       → --dyni-linear-tick-major-width-factor
--dyni-linear-tick-minor-len         → --dyni-linear-tick-minor-len-factor
--dyni-linear-tick-minor-width       → --dyni-linear-tick-minor-width-factor
--dyni-linear-track-linewidth        → --dyni-linear-track-linewidth-factor
--dyni-linear-pointer-width          → --dyni-linear-pointer-side-factor
--dyni-linear-pointer-length         → --dyni-linear-pointer-depth-factor
--dyni-xte-line-width-factor         → (removed)
--dyni-xte-boat-size-factor          → (removed)
(new)                                → --dyni-stroke-weight
(new)                                → --dyni-pointer-depth-weight
(new)                                → --dyni-pointer-side-weight
```

## Scaling formula

The shared `GeometryScale.js` module provides:

```javascript
scale(primaryDim, factor)
// → Math.max(1, Math.floor(primaryDim * factor))

scaleStroke(primaryDim, factor, strokeWeight)
// → Math.max(1, Math.floor(primaryDim * factor * strokeWeight))

scalePointer(primaryDim, factor, weight)
// → Math.max(1, Math.floor(primaryDim * factor * weight))
// weight is pointerDepthWeight for depth, pointerSideWeight for side/width
```

All three return integer pixel values ≥ 1. All graphical element sizing in all families must go through one of these three functions.

`scalePointer` is a single function called with the appropriate weight parameter: `pointerDepthWeight` when scaling depth/length dimensions, `pointerSideWeight` when scaling side/width dimensions and course marker width.

### Per-family primary dimension resolution

Radial (full-circle and semicircle):

```javascript
const primaryDim = geom.R; // = Math.max(1, Math.floor(Math.min(W, H) / 2))
```

Linear:

```javascript
const primaryDim = Math.max(1, Math.min(layout.trackBox.w, layout.trackBox.h));
```

XTE:

```javascript
const primaryDim = Math.max(1, Math.min(layout.highway.w, layout.highway.h));
```

## Implementation phases

### Phase 1 — Pre-split `LinearGaugeEngine.js`

Extract the static-layer drawing function and the pointer/marker drawing helpers into `LinearGaugeEngineDrawing.js`:

- `drawStaticLayer(layerCtx, state, ticks, showEndLabels, sectors, labelFormatter)`
- `drawPointerAtValue(ctx, state, layout, theme, primitives, mapValueToX, markerValue, pointerDepthBase, markerSizeBase, opts)`
- `drawMarkerAtValue(ctx, state, layout, theme, primitives, mapValueToX, markerValue, markerSizeBase, opts)`

`LinearGaugeEngine.js` imports and calls through to the extracted module. Both files stay well under 400 non-empty lines.

File placement: `shared/widget-kits/linear/LinearGaugeEngineDrawing.js`

Register in `config/components/registry-shared-foundation.js` with `Depends: LinearCanvasPrimitives`.

Update `LinearGaugeEngine` module header `Depends` to include `LinearGaugeEngineDrawing`.

### Phase 2 — Create `GeometryScale.js`

Create `shared/widget-kits/layout/GeometryScale.js` with the three functions described in the Scaling formula section above.

UMD module with `DyniComponents.DyniGeometryScale` registration. Standard `{ id, create }` export shape. No external dependencies.

Register in `config/components/registry-shared-foundation.js`.

### Phase 3 — Convert `ThemeModel.js` tokens

Replace all graphical-dimension token definitions with factor equivalents per the token conversion table:

- Rename token paths (e.g. `radial.ticks.majorLen` → `radial.ticks.majorLenFactor`)
- Change token types to `number` with factor default values
- Rename CSS input variable names
- Add `strokeWeight`, `pointerDepthWeight`, and `pointerSideWeight` as new top-level tokens with default `1.0`
- Remove `xte.lineWidthFactor` and `xte.boatSizeFactor` token definitions

Update `BASE_DEFAULTS` (auto-derived from token defs — no manual change needed).

Replace all preset `base` objects:

```javascript
slim: {
  base: {
    strokeWeight: 0.67,
    pointerDepthWeight: 1.0,
    pointerSideWeight: 0.72,
    font: { labelWeight: 400 }
  }
},
bold: {
  base: {
    strokeWeight: 1.4,
    pointerDepthWeight: 1.0,
    pointerSideWeight: 1.54
  }
},
highcontrast: {
  base: {
    strokeWeight: 1.35,
    pointerDepthWeight: 1.0,
    pointerSideWeight: 1.4,
    colors: { /* unchanged color overrides */ }
  }
}
```

`font.labelWeight` remains in `slim` because it is not a graphical-dimension token — it is a text weight.

Color overrides in `highcontrast` remain unchanged — they are not graphical dimensions.

Night-mode overrides in `default` remain unchanged — they are color overrides only.

### Phase 4 — Update `RadialCanvasPrimitives.js`

Update `drawPointerAtRim` to accept the new single-factor pointer dimensions:

- Replace `depth`/`widthFactor`/`lengthFactor` option fields with `depth` (pre-computed px from `GeometryScale.scalePointer`) and `halfWidth` (pre-computed px).
- Remove the internal two-level `baseDepth × lengthFactor` and `baseDepth × widthFactor` chains.
- Remove all internal hard floors (`Math.max(2, ...)` for base depth, `Math.max(8, ...)` for pointer width, `Math.max(4, ...)` for half-width). The caller is responsible for computing pixel values via `GeometryScale`, which already guarantees ≥ 1.
- Replace the absolute pointer tip inset `rOuter - 2` with a proportional computation: `rTip = Math.max(1, rOuter - Math.max(1, Math.floor(rOuter * POINTER_TIP_INSET_FACTOR)))` where `POINTER_TIP_INSET_FACTOR = 0.013` (derived from 2/150). This keeps the tip inset proportional to widget size.
- The primitive just draws with the values it receives.

Update `drawRimMarker` similarly: `len` and `width` arrive as pre-computed px.

No changes to `drawRing`, `drawArcRing`, `drawAnnularSector` — these already receive px values from their callers.

Update `drawArrow`: replace `Math.max(2, ...)` floor on the `head` parameter with `Math.max(1, ...)` for hard-floor consistency. No other changes — `drawArrow` already receives px values from callers.

### Phase 5 — Update full-circle radial family

**`FullCircleRadialLayout.js`:**

- Add `GeometryScale` as a dependency.
- `computeModeGeometry`: replace `ringW = radius * ringWidthFactor * compactGeometryScale` with `ringW = gs.scale(radius, ringWidthFactor)` (drop `compactGeometryScale` from ring, use `GeometryScale` for consistent flooring).
- Compute and expose all graphical dimensions using `GeometryScale.scale` / `scaleStroke` / `scalePointer`:

```javascript
// In computeModeGeometry, using GeometryScale (gs) and theme:
const R = radius;
const sw = theme.strokeWeight;           // resolved by ThemeResolver
const pdw = theme.pointerDepthWeight;
const psw = theme.pointerSideWeight;

ringW:          gs.scale(R, ringWidthFactor),
majorTickLen:   gs.scale(R, theme.radial.ticks.majorLenFactor),
majorTickWidth: gs.scaleStroke(R, theme.radial.ticks.majorWidthFactor, sw),
minorTickLen:   gs.scale(R, theme.radial.ticks.minorLenFactor),
minorTickWidth: gs.scaleStroke(R, theme.radial.ticks.minorWidthFactor, sw),
arcLineWidth:   gs.scaleStroke(R, theme.radial.ring.arcLineWidthFactor, sw),
pointerDepth:   gs.scalePointer(R, theme.radial.pointer.depthFactor, pdw),
pointerSide:    gs.scalePointer(R, theme.radial.pointer.sideFactor, psw),
markerLen:      gs.scale(R, MARKER_LENGTH_FACTOR * ringWidthFactor),
markerWidth:    gs.scalePointer(R, MARKER_WIDTH_FACTOR * ringWidthFactor, psw),
```

- Preserve `fixedPointerDepth` as a secondary constraint on pointer depth. Computed from the new GeometryScale-derived values: `fixedPointerDepth = Math.max(pointerDepth, Math.floor(ringW * 0.6))`. This ensures the pointer extends at least 60% into the ring at all sizes and preset weights.
- Remove `compactGeometryScale` from `pointerDepth`, `markerLen`, `markerWidth` geometry. Keep `compactGeometryScale` in `labelFontPx` and text-layout normal-mode values (`NORMAL_SAFE_EXTRA_FACTOR`, `NORMAL_DUAL_COMPACT_INSET_FACTOR`).
- Apply `compactGeometryScale` directly to `labelRadiusOffset`: `labelRadiusOffset = Math.max(1, Math.floor(ringW * labelInsetFactor * compactGeometryScale))`. Previously, `labelRadiusOffset` inherited compact scaling transitively through `ringW`; now that `ringW` is a pure graphical element without compact scaling, the text-layout value needs it applied explicitly.
- Apply `compactGeometryScale` directly to `labelRadius` for the same reason: `labelRadius = Math.max(0, radius - Math.max(1, Math.floor(ringW * LABEL_SPRITE_RADIUS_FACTOR * compactGeometryScale)))`. Previously, `labelRadius` inherited compact scaling transitively through `ringW`.
- Expose all computed px values on the `geom` object so engines can pass them directly to primitives.

**`FullCircleRadialEngine.js`:**

- Remove the `resolveResponsiveTickLen` function entirely.
- Update `staticKey` to use the new factor-derived px values from `geom` instead of raw theme px.
- Update `drawFullCircleTicks` API method: read tick lengths and widths from `state.geom` instead of calling `resolveResponsiveTickLen`.
- Update `drawFullCircleRing` API method: read `arcLineWidth` from `state.geom`.
- Update `drawFixedPointer` API method: pass `depth` and `halfWidth` from `state.geom` to `drawPointerAtRim`. Compute `halfWidth = Math.max(1, Math.floor(state.geom.pointerSide / 2))`.
- Remove `compactGeometryScale` from `state` — it is still available via `layout.compactGeometryScale` for text-layout consumers.

**Widget files (`CompassRadialWidget.js`, `WindRadialWidget.js`, `SpeedRadialWidget.js`, `DepthRadialWidget.js`, `TemperatureRadialWidget.js`, `VoltageRadialWidget.js`, `DefaultRadialWidget.js`):**

- Update any direct `theme.radial.ticks.*` or `state.geom.needleDepth` references to use the new `state.geom` property names.
- `CompassRadialWidget` `drawRimMarker` call: read `len` and `width` from `state.geom.markerLen` / `state.geom.markerWidth` (already does this — verify no regressions).

### Phase 6 — Update semicircle radial family

**`SemicircleRadialLayout.js`:**

- Add `GeometryScale` as a dependency.
- `computeGeometry`: replace hard floors `Math.max(14, ...)`, `Math.max(6, ...)`, `Math.max(8, ...)` with `Math.max(1, ...)`.
- Compute all graphical dimensions using `GeometryScale`, same pattern as full-circle. Use `pointerDepthWeight` for depth, `pointerSideWeight` for side.
- Expose tick dimensions, arc line width, and pointer dimensions on the `geom` object.
- Keep `compactGeometryScale` in `labelInset` and `labelFontPx` computation — these are text-layout values. Keep `compactGeometryScale` in `normalExtra`, `normalInnerMargin` (text-layout spacing).

**`SemicircleRadialEngine.js`:**

- Replace direct `theme.radial.ticks.majorLen` / `theme.radial.ticks.majorWidth` pass-through with `layout.geom` pre-computed values.
- Replace `theme.radial.ring.arcLineWidth` with `layout.geom.arcLineWidth`.
- Replace `layout.geom.needleDepth` + `theme.radial.pointer.widthFactor` / `lengthFactor` with `layout.geom.pointerDepth` / `layout.geom.pointerSide`.

### Phase 7 — Update linear family

**`LinearGaugeLayout.js`:**

- Add `GeometryScale` as a dependency.
- After computing `trackBox`, compute `primaryDim = Math.max(1, Math.min(trackBox.w, trackBox.h))`.
- Compute all graphical dimensions:

```javascript
trackLineWidth:  gs.scaleStroke(pd, theme.linear.track.lineWidthFactor, sw),
majorTickLen:    gs.scale(pd, theme.linear.ticks.majorLenFactor),
majorTickWidth:  gs.scaleStroke(pd, theme.linear.ticks.majorWidthFactor, sw),
minorTickLen:    gs.scale(pd, theme.linear.ticks.minorLenFactor),
minorTickWidth:  gs.scaleStroke(pd, theme.linear.ticks.minorWidthFactor, sw),
pointerDepth:    gs.scalePointer(pd, theme.linear.pointer.depthFactor, pdw),
pointerSide:     gs.scalePointer(pd, theme.linear.pointer.sideFactor, psw),
trackThickness:  gs.scale(pd, theme.linear.track.widthFactor),
labelFontPx:     (keep existing text-scaled formula)
labelInsetPx:    (keep existing text-scaled formula)
```

- Expose these on the layout result object.
- Remove `compactGeometryScale` from `trackThickness` computation.

**`LinearGaugeEngine.js`:**

- Replace inline `trackThickness`, `pointerDepthBase`, `markerSizeBase` formulas with layout-provided pre-computed values.
- Replace direct `theme.linear.ticks.*` and `theme.linear.track.lineWidth` references in `drawStaticLayer` (now in `LinearGaugeEngineDrawing.js`) with layout-provided values.
- Replace the `sectorBandY` computation's direct `theme.linear.track.lineWidth` reference with the layout-provided `trackLineWidth` pixel value.
- Pass layout-computed tick dimensions through to primitives.

**`LinearGaugeEngineDrawing.js`:**

- Accept graphical dimensions from layout/state rather than reading theme tokens directly.
- `drawStaticLayer`: use `state.layout.majorTickLen`, `state.layout.majorTickWidth`, `state.layout.trackLineWidth`, etc.

### Phase 8 — Update XTE family

**`XteHighwayPrimitives.js`:**

- Add `GeometryScale` as a dependency (received via `create` or a new parameter).
- Replace internal `nearHalf`-based ratio constants with the re-derived factors:

```javascript
const RAIL_WIDTH_FACTOR = 0.013;
const CROSSBAR_WIDTH_FACTOR = 0.010;
const SEAM_WIDTH_FACTOR = 0.007;
const HORIZON_WIDTH_FACTOR = 0.012;
const CENTERLINE_WIDTH_FACTOR = 0.017;
const BOAT_LENGTH_FACTOR = 0.078;
const BOAT_BEAM_RATIO = 0.62;
const BOAT_LANE_DEPTH_LIMIT = 0.24;
```

- `highwayGeometry`: accept `primaryDim` (pre-computed `min(highway.w, highway.h)`) as a parameter.
- `drawStaticHighway`: accept `primaryDim`, `strokeWeight` as parameters (replacing the `style` object). Replace `nearHalf`-based line width formulas with `GeometryScale`-based computations:

```javascript
const gs = geometryScale;
const pd = primaryDim;
const sw = strokeWeight;

railWidth:      gs.scaleStroke(pd, RAIL_WIDTH_FACTOR, sw),
crossbarWidth:  gs.scaleStroke(pd, CROSSBAR_WIDTH_FACTOR, sw),
seamWidth:      gs.scaleStroke(pd, SEAM_WIDTH_FACTOR, sw),
horizonWidth:   gs.scaleStroke(pd, HORIZON_WIDTH_FACTOR, sw),
```

- Replace the seam length clamp `clamp((nextY - y) * 0.42, 3, laneDepth * 0.08)` with `clamp((nextY - y) * 0.42, 1, laneDepth * 0.08)`, standardizing the lower bound to 1.
  
- `drawDynamicHighway`: accept `primaryDim`, `strokeWeight`, `pointerDepthWeight` as parameters (replacing the `style` object). Replace `nearHalf`-based boat and centerline sizing. Preserve the `laneDepth` upper clamp on boat length to prevent the boat marker from exceeding its lane at extreme aspect ratios:
  

```javascript
const rawLength = gs.scalePointer(pd, BOAT_LENGTH_FACTOR, pdw);
const markerLength = Math.min(rawLength, Math.max(1, Math.floor(laneDepth * BOAT_LANE_DEPTH_LIMIT)));
const markerBeam = Math.max(1, Math.floor(markerLength * BOAT_BEAM_RATIO));
const centerlineWidth = gs.scaleStroke(pd, CENTERLINE_WIDTH_FACTOR, sw);
```

- Standardize all hard floors in both `drawStaticHighway` and `drawDynamicHighway` to `Math.max(1, ...)`: replace `Math.max(1.2, ...)`, `Math.max(4, ...)`, `Math.max(3, ...)`, `Math.max(1.4, ...)`, `Math.max(2.6, ...)` (boat edge radius) with the standard `Math.max(1, ...)` provided by `GeometryScale`.
- Remove `resolveLineWidthFactor` and `resolveBoatSizeFactor` helper functions.

**`XteHighwayLayout.js`:**

- No structural changes. The layout already computes the highway rect. The calling renderer passes `min(highway.w, highway.h)` to the primitives.

**`XteDisplayWidget.js` (or the XTE renderer in `shared/widget-kits/xte/`):**

- Compute `primaryDim = Math.max(1, Math.min(layout.highway.w, layout.highway.h))` and pass to highway primitive calls.
- Pass `theme.strokeWeight` and `theme.pointerDepthWeight` to primitive calls.
- Remove `lineWidthFactor` / `boatSizeFactor` reads from `xteTheme` and the `DEFAULT_XTE_THEME` fallback.

### Phase 9 — Cleanup pass

- Search for any remaining references to removed token paths (`radial.ticks.majorLen`, `linear.ticks.minorWidth`, `xte.lineWidthFactor`, etc.) and update them.
- Search for any remaining `compactGeometryScale` usage in graphical element computations and remove it. Verify it remains only in text-layout code.
- Search for any remaining `resolveResponsiveTickLen` calls and confirm removal.
- Verify all lint-disable comments for `responsive-layout-hard-floor` with higher floors (6, 8, 14) are removed or updated for the new `Math.max(1, ...)` convention.
- Standardize hard floors in primitive files:
  - `RadialCanvasPrimitives.drawPointerAtRim`: the Phase 4 restructure removes all internal floors (2, 8, 4). Verify no remnants.
  - `RadialCanvasPrimitives.drawArrow`: verify `Math.max(2, ...)` on `head` is now `Math.max(1, ...)`.
  - `LinearCanvasPrimitives.drawPointer`: replace `Math.max(4, ...)` for `depth` and `side` with `Math.max(1, ...)`. Callers now pass pre-computed px values from `GeometryScale` which already guarantees ≥ 1.
  - `XteHighwayPrimitives`: replace `Math.max(1.2, ...)`, `Math.max(4, ...)`, `Math.max(3, ...)`, `Math.max(1.4, ...)`, `Math.max(2.6, ...)` (boat edge radius) with `Math.max(1, ...)`. Replace seam length lower clamp from 3 to 1. All widths and lengths are now computed via `GeometryScale`.
- Verify no file exceeds 400 non-empty lines.

### Phase 10 — Tests

**GeometryScale unit tests:**

- `scale(150, 0.08)` returns `12`
- `scale(50, 0.08)` returns `4`
- `scale(10, 0.08)` returns `1` (floor clamp)
- `scaleStroke(150, 0.02, 1.4)` returns `4` (bold preset)
- `scaleStroke(150, 0.02, 0.67)` returns `2` (slim preset)
- `scaleStroke(150, 0.01, 1.35)` returns `2` (highcontrast preset, minorTickWidth preserved)
- `scalePointer(150, 0.22, 1.0)` returns `33` (depth, default)
- `scalePointer(150, 0.11, 1.54)` returns `25` (side, bold)
- `scalePointer(150, 0.11, 0.72)` returns `11` (side, slim)
- all functions return ≥ 1 for any positive primaryDim
- all functions return 1 for zero or negative primaryDim

**ThemeModel token tests:**

- all old absolute px token paths are absent
- all new factor token paths exist with correct default values
- `strokeWeight`, `pointerDepthWeight`, and `pointerSideWeight` exist with default `1.0`
- `xte.lineWidthFactor` and `xte.boatSizeFactor` are absent
- preset `slim` has `strokeWeight: 0.67`, `pointerDepthWeight: 1.0`, `pointerSideWeight: 0.72`, no per-element overrides for ticks/ring/pointer
- preset `bold` has `strokeWeight: 1.4`, `pointerDepthWeight: 1.0`, `pointerSideWeight: 1.54`
- preset `highcontrast` has `strokeWeight: 1.35`, `pointerDepthWeight: 1.0`, `pointerSideWeight: 1.4`
- CSS input variable names match renamed tokens

**Proportionality tests (radial):**

- at 300×300 (R=150): majorTickLen = 12, majorTickWidth = 3, minorTickLen = 7, minorTickWidth = 1 (verifies reference-size parity)
- at 600×600 (R=300): majorTickLen = 24, majorTickWidth = 6 (double)
- at 150×150 (R=75): majorTickLen = 6, majorTickWidth = 1 (half, with floor)
- at 100×100 (R=50): all values ≥ 1
- ratio `majorTickLen / radius` is constant across all tested sizes
- with `bold` preset: `majorTickWidth` at 300×300 = `Math.floor(150 * 0.02 * 1.4)` = 4
- with `slim` preset: `majorTickWidth` at 300×300 = `Math.floor(150 * 0.02 * 0.67)` = 2
- with `highcontrast` preset: `minorTickWidth` at 300×300 = `Math.floor(150 * 0.01 * 1.35)` = 2 (preserves old value)
- pointer depth is constant across presets at same size (pointerDepthWeight = 1.0 for all presets)
- pointer side varies with pointerSideWeight: bold side > default side > slim side

**Proportionality tests (linear):**

- at a 300×300 widget with typical trackBox (pd=110): pointerDepth = `Math.floor(110 * 0.24)` = 26, pointerSide = `Math.floor(110 * 0.12)` = 13 (verifies reference-size parity with old `trackBox.h * 0.12 * lengthFactor(2)`)
- at 150×80 (flat mode, small): graphical dimensions use the constraining axis
- with presets: stroke widths scale by `strokeWeight`, pointer depth by `pointerDepthWeight`, pointer side by `pointerSideWeight`

**Proportionality tests (XTE):**

- at 300×300 normal mode (highway ≈ 280×170, pd=170): rail width = `Math.floor(170 * 0.013)` = 2, boat length = `Math.min(Math.floor(170 * 0.078), Math.floor(laneDepth * 0.24))` ≈ 13 (verifies reference-size parity with old `nearHalf(120.4) * 0.012 * lwf(1.5)` ≈ 2 for rail, `nearHalf * 0.11` ≈ 13 for boat)
- at 600×150 flat mode: constraining axis is highway height, preventing disproportionately thick lines
- boat length does not exceed `laneDepth * 0.24` at any tested size
- preset weights apply correctly
- boat length is constant across presets (pointerDepthWeight = 1.0 for all presets)

**Regression tests:**

- `compactGeometryScale` no longer appears in any graphical dimension computation
- `compactGeometryScale` still applies to text-layout values (label font, label inset, text slot spacing)
- full-circle `labelRadiusOffset` includes `compactGeometryScale` directly (not transitively through `ringW`)
- full-circle `labelRadius` includes `compactGeometryScale` directly (not transitively through `ringW`)
- `resolveResponsiveTickLen` is fully removed
- tick lengths never exceed label inset at any tested size (validates soft-cap removal)
- no semicircle hard floor exceeds 1
- no `RadialCanvasPrimitives` hard floor exceeds 1 (including `drawArrow`)
- no `LinearCanvasPrimitives` hard floor exceeds 1
- no `XteHighwayPrimitives` hard floor exceeds 1
- XTE seam length lower clamp is 1 (not 3)
- compass course marker is visible (not hidden by ticks) at 150×150 and 100×100

**Static analysis:**

- no non-test JS file exceeds 400 non-empty lines
- all renamed CSS vars are referenced by the correct token paths
- no references to removed token paths (`radial.ticks.majorLen`, `linear.ticks.majorWidth`, `xte.lineWidthFactor`, `xte.boatSizeFactor`, `radial.pointer.widthFactor`, `radial.pointer.lengthFactor`, `linear.pointer.widthFactor`, `linear.pointer.lengthFactor`)

Run:

```bash
npm run check:all
```

### Phase 11 — Documentation

Update:

- `documentation/shared/responsive-scale-profile.md`: document the removal of `compactGeometryScale` from graphical elements, the new `GeometryScale` module, and the factor-based scaling contract
- `documentation/shared/theme-tokens.md`: update all token definitions to new factor names, document `strokeWeight`/`pointerDepthWeight`/`pointerSideWeight` category multipliers, update preset descriptions
- `documentation/radial/gauge-shared-api.md`: update tick, ring, pointer, marker dimension documentation to reference factor tokens and `GeometryScale`
- `documentation/radial/full-circle-dial-engine.md`: remove `resolveResponsiveTickLen` documentation, update static key documentation
- `documentation/linear/linear-shared-api.md`: update tick, track, pointer dimension documentation
- `documentation/widgets/xte-display.md`: update highway primitive sizing documentation, remove `lineWidthFactor`/`boatSizeFactor` references
- `documentation/TABLEOFCONTENTS.md`: add `GeometryScale` and `LinearGaugeEngineDrawing` entries
- `ROADMAP.md`: mark uniform scaling as completed

## Acceptance criteria

- Every graphical-dimension theme token is a dimensionless factor, not an absolute px value.
- No graphical element computes its pixel size from an absolute constant; all use `GeometryScale` with the family's primary dimension.
- Primary dimensions are: `radius` (radial), `min(trackBox.w, trackBox.h)` (linear), `min(highway.w, highway.h)` (XTE).
- The ratio between any two graphical elements within a family is constant across all widget sizes.
- Theme presets override only `strokeWeight`, `pointerDepthWeight`, `pointerSideWeight`, and non-graphical tokens (colors, font weight). No preset overrides individual graphical-dimension factors.
- `strokeWeight` multiplies all line/stroke width factors. `pointerDepthWeight` multiplies pointer depth factors. `pointerSideWeight` multiplies pointer side/width factors and course marker width. Geometric extents (tick lengths, ring annular width) use only the base factor.
- `pointerDepthWeight` is `1.0` for all presets. Pointer depth does not vary between presets.
- `compactGeometryScale` does not appear in any graphical element computation. It remains only in text-layout code (label font, label inset, label sprite radius, text slot spacing, normal-mode extras). Where text-layout values previously inherited compact scaling transitively through a graphical element (full-circle `labelRadiusOffset` and `labelRadius` via `ringW`), compact scaling is applied directly.
- `resolveResponsiveTickLen` is removed. No soft cap on tick lengths exists.
- All hard floors across all families and all primitives are `Math.max(1, ...)`. No higher floors (2, 2.6, 3, 4, 6, 8, 14) remain in any scaling or primitive code. The XTE seam length lower clamp is 1, not 3.
- Pointer depth and half-width are each a single direct factor of the primary dimension. No two-level indirection. The collapsing of the indirection changes the flooring point and may produce a ±1 px delta at some sizes compared to the old chain; this is accepted.
- `RadialCanvasPrimitives.drawPointerAtRim` receives pre-computed `depth` and `halfWidth` pixel values and contains no internal floors or factor multiplication. The pointer tip inset (`rOuter - tipOffset`) is proportional via `POINTER_TIP_INSET_FACTOR`, not absolute.
- At a 300×300 widget, radial graphical elements produce the same pixel values as the old absolute defaults (majorTickLen = 12, majorTickWidth = 3, etc.), with an accepted ±1 px tolerance for pointer depth due to floor-point change.
- At a 300×300 widget, linear graphical elements produce the same pixel values as the old defaults (pointerDepth = 26, pointerSide = 13, trackLineWidth = 2, etc.).
- At a 300×300 widget, XTE graphical elements produce the same pixel values as the old defaults including the absorbed `lineWidthFactor: 1.5` (rail width ≈ 2, boat length ≈ 13, etc.).
- At 150×150, 100×100, and 600×600, all elements remain visible (≥ 1px) and proportionally correct.
- On small compass dials (150×150, 100×100), major ticks do not clip into labels and the course marker is not hidden by ticks.
- On wide flat linear and XTE widgets, line widths scale with the constraining height, not the width.
- XTE boat marker length never exceeds `laneDepth * 0.24` at any size.
- `LinearGaugeEngine.js` is pre-split and both resulting files are under 400 non-empty lines.
- No non-test JS file exceeds 400 non-empty lines.
- XTE highway primitives use `min(highway.w, highway.h)` as their primary dimension, not `nearHalf`.
- `xte.lineWidthFactor` and `xte.boatSizeFactor` theme tokens are removed.
- All tests pass: `npm run check:all`.