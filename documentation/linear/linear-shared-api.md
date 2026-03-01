# Linear Shared API

**Status:** ✅ Extension-ready | `LinearGaugeEngine` contracts documented for range/centered180/fixed360 wrappers

## Overview

Linear instruments use a shared engine pipeline:

- `shared/widget-kits/linear/LinearCanvasPrimitives.js`
- `shared/widget-kits/linear/LinearGaugeMath.js`
- `shared/widget-kits/linear/LinearGaugeTextLayout.js`
- `shared/widget-kits/linear/LinearGaugeEngine.js`

New linear widgets should delegate rendering to `LinearGaugeEngine.createRenderer(spec)`.

## Components

### LinearCanvasPrimitives

- `drawTrack(ctx, x0, x1, y, opts)`
- `drawBand(ctx, x0, x1, y, thickness, opts)`
- `drawTick(ctx, x, y, len, opts)`
- `drawPointer(ctx, x, y, opts)`

### LinearGaugeMath

- `keyToText(value)`
- `mapValueToX(value, min, max, x0, x1, clamp?)`
- `buildTicks(min, max, majorStep, minorStep)`
- `resolveAxisDomain(axisMode, range)`
- `computeLayout(mode, W, H, pad, gap)`
- `splitCaptionValueRows(captionBox, valueBox, secScale)`

### LinearGaugeTextLayout

- `resolveLabelBoost(mode)`
- `drawTickLabels(layerCtx, state, ticks, showEndLabels, math)`
- `drawCaptionRow(state, textApi, caption, box, secScale, align)`
- `drawValueUnitRow(state, textApi, valueText, unitText, box, secScale, align)`
- `drawInlineRow(state, textApi, caption, valueText, unitText, box, secScale)`

### LinearGaugeEngine

- Component ID: `LinearGaugeEngine`
- Factory: `create(def, Helpers)`
- Main API: `createRenderer(spec) -> renderCanvas(canvas, props)`

## `createRenderer(spec)` Contract

Common `spec` fields:

- `rawValueKey`
- `unitDefault`
- `axisMode`: `"range" | "centered180" | "fixed360"`
- `rangeDefaults`: `{ min, max }`
- `rangeProps`: `{ min, max }`
- `tickProps`: `{ major, minor, showEndLabels }`
- `ratioProps`: `{ normal, flat }`
- `ratioDefaults`: `{ normal, flat }`
- `tickSteps(range)`
- `formatDisplay(raw, props, unit, Helpers) -> { num, text }`
- `buildSectors(props, minV, maxV, axis, valueApi, theme) -> [{ from, to, color }]`
- `buildStaticKey(state, props)`

### Axis Profile Matrix

| Field | `range` | `centered180` | `fixed360` |
|---|---|---|---|
| `axisMode` | Required | Required | Required |
| `rangeDefaults` | Used for fallback domain | Ignored by axis resolver | Ignored by axis resolver |
| `rangeProps` | Used for live domain overrides | Ignored by axis resolver | Ignored by axis resolver |
| `buildSectors` bounds | Usually `min..max` from config | Fixed `-180..180` | Fixed `0..360` |
| Typical kinds | Speed/Depth/Temp/Voltage linear | Wind-angle linear | Compass/heading linear |

## Profile Templates

### Range Profile (Speed/Depth/Temp/Voltage)

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "value",
  unitDefault: "m",
  axisMode: "range",
  rangeDefaults: { min: 0, max: 30 },
  rangeProps: { min: "depthLinearMinValue", max: "depthLinearMaxValue" },
  tickProps: {
    major: "depthLinearTickMajor",
    minor: "depthLinearTickMinor",
    showEndLabels: "depthLinearShowEndLabels"
  },
  ratioProps: {
    normal: "depthLinearRatioThresholdNormal",
    flat: "depthLinearRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

### Centered Profile (Wind Angle)

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "angle",
  unitDefault: "deg",
  axisMode: "centered180",
  tickProps: {
    major: "windAngleLinearTickMajor",
    minor: "windAngleLinearTickMinor",
    showEndLabels: "windAngleLinearShowEndLabels"
  },
  ratioProps: {
    normal: "windAngleLinearRatioThresholdNormal",
    flat: "windAngleLinearRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

### Fixed Compass Profile

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "heading",
  unitDefault: "deg",
  axisMode: "fixed360",
  tickProps: {
    major: "compassLinearTickMajor",
    minor: "compassLinearTickMinor",
    showEndLabels: "compassLinearShowEndLabels"
  },
  ratioProps: {
    normal: "compassLinearRatioThresholdNormal",
    flat: "compassLinearRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

## Runtime Behavior

- Static cached layer: track, sectors, ticks, labels.
- Dynamic per frame: pointer, caption/value/unit text, disconnect overlay.
- Cache key excludes live values and includes geometry/theme/tick/sector signatures.
- `showEndLabels` defaults to false unless mapper sets it true.

## Theme Contract

Reads `ThemeResolver` tokens:

- `theme.linear.track.widthFactor`
- `theme.linear.track.lineWidth`
- `theme.linear.ticks.majorLen`, `majorWidth`, `minorLen`, `minorWidth`
- `theme.linear.pointer.sideFactor`, `lengthFactor`
- `theme.linear.labels.insetFactor`, `fontFactor`
- `theme.colors.pointer`, `theme.colors.warning`, `theme.colors.alarm`

## Testing Contract for New Linear Wrappers

- Widget wrapper test validating `createRenderer(spec)` mapping.
- Mapper test validating renderer name + normalized `rendererProps`.
- Cluster static-config test for editable conditions on new kinds.
- Full gate: `npm run check:all`.

## Related

- [linear-gauge-style-guide.md](linear-gauge-style-guide.md)
- [../guides/add-new-linear-gauge.md](../guides/add-new-linear-gauge.md)
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
