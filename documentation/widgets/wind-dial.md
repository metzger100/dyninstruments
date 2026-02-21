# WindDialWidget Module

**Status:** ✅ Implemented | `widgets/gauges/WindDialWidget/WindDialWidget.js`

## Overview

Full-circle wind dial showing angle (AWA/TWA) and speed (AWS/TWS) together. Uses `GaugeToolkit.draw` for dial primitives and `GaugeToolkit.text/value` for text fitting and value handling.
Theme colors are resolved once per render via `GaugeToolkit.theme.resolve(canvas)`.
Dial background rendering uses a closure-local two-layer cache (base + overlay) to avoid redrawing static dial elements every frame.

## Module Registration

```javascript
// In config/components.js
WindDialWidget: {
  js: BASE + "widgets/gauges/WindDialWidget/WindDialWidget.js",
  css: undefined,
  globalKey: "DyniWindDialWidget",
  deps: ["GaugeToolkit"]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `angle` | number | — | Wind angle in degrees (±180 display) |
| `speed` | number | — | Wind speed raw value |
| `angleCaption` | string | `""` | Angle caption (`AWA`/`TWA`) |
| `speedCaption` | string | `""` | Speed caption (`AWS`/`TWS`) |
| `angleUnit` | string | `"°"` | Angle unit |
| `speedUnit` | string | `"kn"` | Speed unit |
| `formatter` | string/function | `"formatSpeed"` | Speed formatter passed to `Helpers.applyFormatter` |
| `formatterParameters` | array/string | `[speedUnit]` | Speed formatter parameters |
| `leadingZero` | boolean | `false` | Angle pad to 3 digits |
| `layEnabled` | boolean | `true` | Enable layline sectors |
| `layMin` | number | `0` | Layline inner bound (0..180) |
| `layMax` | number | `0` | Layline outer bound (0..180) |
| `dialRatioThresholdNormal` | number | `0.7` | Ratio below -> `high` |
| `dialRatioThresholdFlat` | number | `2.0` | Ratio above -> `flat` |
| `captionUnitScale` | number | `0.8` | Caption/unit ratio vs value |

## Dial Drawing (via `GaugeToolkit.draw`)

| Element | Draw Function | Parameters |
|---|---|---|
| Ring | `draw.drawRing` | full circle |
| Layline starboard | `draw.drawAnnularSector` | `layMin..layMax`, `theme.colors.laylineStb` (default `#82b683`) |
| Layline port | `draw.drawAnnularSector` | `-layMax..-layMin`, `theme.colors.laylinePort` (default `#ff7a76`) |
| Wind pointer | `draw.drawPointerAtRim` | long pointer at `angle`, with `fillStyle: theme.colors.pointer` (default `#ff2b2b`) |
| Ticks | `draw.drawTicks` | `-180..180`, major 30, minor 10 |
| Labels | `draw.drawLabels` | `-180..180`, step 30, endpoints filtered |

## Background Cache Behavior

### Cached Static Layers

- Base layer: outer ring + optional layline sectors
- Overlay layer: tick circle + static degree labels

### Dynamic Per-Frame Layer

- Wind pointer/needle (`angle`)
- Live value text blocks (flat/high/normal modes)
- Overlays (`disconnect`)

Pointer draw order is preserved: static base -> pointer -> static tick/label overlay.

### Cache Key Inputs (static-only)

- Pixel buffer dimensions (`canvas.width`, `canvas.height`) and effective DPR mapping
- Dial geometry inputs (`W`, `H`, `cx`, `cy`, `rOuter`, `ringW`, label inset/font size)
- Layline config (`layEnabled`, `layMin`, `layMax`)
- Static style inputs (ring/tick/label geometry styles, layline colors)
- Resolved typography/style inputs (`family`, `labelWeight`, resolved text color)

### Invalidation Triggers

- Canvas geometry/buffer size changes
- Dial geometry changes caused by size/theme ring factors
- Layline config changes
- Style/token/typography changes that affect static dial rendering

### Non-Triggers

- Live values (`angle`, `speed`)
- Live text content/captions/units
- Pointer-only updates

## Layout Modes

```text
ratio = W / H
ratio < dialRatioThresholdNormal -> high
ratio > dialRatioThresholdFlat -> flat
otherwise -> normal
```

### Dual-Value Display

- left side: angle caption/value/unit
- right side: speed caption/value/unit

`flat` uses side strips, `normal` uses two inner columns, `high` uses inline top/bottom rows.

## Internal Value Formatting

| Function | Input | Output |
|---|---|---|
| `GaugeValueMath.formatAngle180(v, leadingZero)` | angle deg | `-180..180` string |
| `Helpers.applyFormatter(v, { formatter, formatterParameters })` | speed value | formatted speed string |

## Exports

```javascript
return {
  id: "WindDialWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
