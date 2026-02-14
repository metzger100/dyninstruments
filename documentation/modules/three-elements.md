# ThreeElements Module

**Status:** ✅ Implemented | `modules/ThreeElements/ThreeElements.js`

## Overview

Default numeric renderer for all clusters. Draws caption, value, and unit as responsive text on canvas. Uses Helpers (not IC) — no polar drawing. ClusterHost delegates to ThreeElements for every non-graphic kind.

## Module Registration

```javascript
// In MODULES (plugin.js)
ThreeElements: {
  js: BASE + "modules/ThreeElements/ThreeElements.js",
  css: BASE + "modules/ThreeElements/ThreeElements.css",
  globalKey: "DyniThreeElements"
}
```

No dependencies. Used by ClusterHost as default renderer.

## Props (set by ClusterHost.translateFunction)

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | any | — | Raw store value (formatted via `Helpers.applyFormatter`) |
| `caption` | string | `""` | Caption text |
| `unit` | string | `""` | Unit text |
| `formatter` | string/fn | — | Formatter name or function (resolved by Helpers) |
| `formatterParameters` | array/string | — | Params passed to formatter |
| `default` | string | `"---"` | Fallback when value is null/NaN |
| `ratioThresholdNormal` | number | `1.0` | Aspect ratio below which → high mode |
| `ratioThresholdFlat` | number | `3.0` | Aspect ratio above which → flat mode |
| `captionUnitScale` | number | `0.8` | Caption/unit font size relative to value (0.3–3.0) |
| `disconnect` | boolean | `false` | Show "NO DATA" overlay |

## Layout Modes

```
ratio = W / H
ratio < ratioThresholdNormal  →  "high"   (3 rows: caption / value / unit)
ratio > ratioThresholdFlat    →  "flat"   (1 row: caption value unit inline)
else                          →  "normal" (2 rows: value+unit top, caption bottom)
```

### Collapsing Rules

Mode collapses when caption or unit are empty:
- No caption → always flat (1 row), regardless of ratio
- No unit + high mode → normal (2 rows)
- No caption + no unit → flat (1 row)

### Row Layout Per Mode

**high** (3 rows) — weighted by `[secScale, 1, secScale]`:

| Row | Content | Align | Font weight |
|---|---|---|---|
| Top | Caption | left | 700 |
| Middle | Value | center | 700 |
| Bottom | Unit | right | 700 |

Each row scales independently if it overflows (width or height constrained).

**normal** (2 rows) — weighted by `[1, secScale]`:

| Row | Content | Align | Font weight |
|---|---|---|---|
| Top | Value + Unit (inline, centered) | center | 700 |
| Bottom | Caption | left | 700 |

Value+Unit share one row with gap; coupled downscaling preserves ratio.

**flat** (1 row) — binary search for max font size:

```
[Caption gap Value gap Unit]  centered horizontally, vertically centered
```

Caption/unit use `secScale × valuePx`. All three shrink together if width overflows.

## Internal Functions

| Function | Purpose |
|---|---|
| `fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, bold)` | Fit single text string to box, returns px |
| `fitValueUnitRowPx(ctx, valueText, unitText, baseValuePx, secScale, gap, maxW, maxH, family)` | Fit value+unit pair, returns `{ vPx, uPx }` |
| `drawDisconnectOverlay(ctx, W, H, family, color)` | Semi-transparent "NO DATA" overlay |

## Exports

```javascript
return {
  id: "ThreeElements",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction      // no-op (returns {}); ClusterHost handles translation
};
```

## File Location

`modules/ThreeElements/ThreeElements.js`

## Related

- [../architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost routing to ThreeElements
- [../shared/helpers.md](../shared/helpers.md) — applyFormatter, setupCanvas
- [../avnav-api/formatters.md](../avnav-api/formatters.md) — Available formatters
