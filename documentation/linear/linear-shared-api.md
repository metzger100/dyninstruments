# Linear Shared API

**Status:** ✅ Implemented | `LinearGaugeEngine` + `LinearCanvasPrimitives` + `LinearGaugeMath` + `LinearGaugeTextLayout`

## Overview

Linear instruments use a shared engine pipeline comparable to radial engines:

- `shared/widget-kits/linear/LinearCanvasPrimitives.js` - low-level drawing helpers
- `shared/widget-kits/linear/LinearGaugeMath.js` - shared axis/tick/layout helpers
- `shared/widget-kits/linear/LinearGaugeTextLayout.js` - shared tick-label and text-row helpers
- `shared/widget-kits/linear/LinearGaugeEngine.js` - cached static layer + dynamic pointer/text orchestration

The engine is intentionally generic so future `*Linear` kinds can share layout, scale, sectors, and theming.

## Components

### LinearCanvasPrimitives

- `drawTrack(ctx, x0, x1, y, opts)`
- `drawBand(ctx, x0, x1, y, thickness, opts)`
- `drawTick(ctx, x, y, len, opts)`
- `drawPointer(ctx, x, y, opts)`

### LinearGaugeEngine

- Component ID: `LinearGaugeEngine`
- Factory: `create(def, Helpers)`
- Main API: `createRenderer(spec) -> renderCanvas(canvas, props)`

### LinearGaugeMath

- `keyToText(value)`
- `mapValueToX(value, min, max, x0, x1, clamp?)`
- `buildTicks(min, max, majorStep, minorStep)`
- `resolveAxisDomain(axisMode, range)`
- `computeLayout(mode, W, H, pad, gap)`

### LinearGaugeTextLayout

- `resolveLabelBoost(mode)`
- `drawTickLabels(layerCtx, state, ticks, showEndLabels, math)`
- `drawCaptionRow(state, textApi, caption, box, secScale, align)`
- `drawValueUnitRow(state, textApi, valueText, unitText, box, secScale, align)`
- `drawInlineRow(state, textApi, caption, valueText, unitText, box, secScale)`

## createRenderer(spec)

Supported `spec` fields:

- `rawValueKey`: fallback prop name for raw value
- `unitDefault`: unit fallback
- `axisMode`: `"range"` | `"centered180"` | `"fixed360"`
- `rangeDefaults`: `{ min, max }`
- `rangeProps`: `{ min, max }` prop names
- `tickProps`: `{ major, minor, showEndLabels }` prop names
- `ratioProps`: `{ normal, flat }` prop names
- `ratioDefaults`: `{ normal, flat }`
- `tickSteps(range)`: optional shared tick profile selector
- `formatDisplay(raw, props, unit, Helpers)`: returns `{ num, text }`
- `buildSectors(props, minV, maxV, axis, valueApi, theme)`: returns `[{ from, to, color }]`
- `buildStaticKey(state, props)`: optional additional cache key material

## Axis Modes

- `range`: uses configured `min/max` range (speed/depth/temp/voltage)
- `centered180`: fixed `-180..180` scale (wind angle planned)
- `fixed360`: fixed `0..360` scale (compass planned)

## Built-in Mode Layouts

- `high`: top gauge, middle caption, bottom value+unit
- `normal`: top gauge, bottom inline `caption value unit` with boosted tick labels and larger inline text band
- `flat`: left gauge, right caption/value stack

## Cache Model

- Static cached layer: track, sector bands, ticks, labels
- Dynamic per-frame layer: pointer, caption/value/unit text, disconnect overlay
- Cache key excludes live data values and includes geometry/theme/tick/sector signatures

## Theme Contract

Reads `ThemeResolver` tokens:

- `theme.linear.track.widthFactor`
- `theme.linear.track.lineWidth`
- `theme.linear.ticks.majorLen`, `majorWidth`, `minorLen`, `minorWidth`
- `theme.linear.pointer.sideFactor`, `lengthFactor`
- `theme.linear.labels.insetFactor`, `fontFactor`
- shared color tokens (`theme.colors.pointer`, `warning`, `alarm`)

## Related

- [linear-gauge-style-guide.md](linear-gauge-style-guide.md)
- [../shared/css-theming.md](../shared/css-theming.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
