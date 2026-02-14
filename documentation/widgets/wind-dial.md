# WindDialWidget Module

**Status:** ✅ Implemented | `widgets/gauges/WindDialWidget/WindDialWidget.js`

## Overview

Full-circle wind dial showing angle (AWA/TWA) and speed (AWS/TWS) together. Uses `GaugeToolkit.draw` for dial primitives and `GaugeToolkit.text/value` for text fitting and value handling.

## Module Registration

```javascript
// In config/components.js
WindDialWidget: {
  js: BASE + "widgets/gauges/WindDialWidget/WindDialWidget.js",
  css: BASE + "widgets/gauges/WindDialWidget/WindDialWidget.css",
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
| `leadingZero` | boolean | `false` | Angle pad to 3 digits |
| `layEnabled` | boolean | `true` | Enable layline sectors |
| `layMin` | number | `0` | Layline inner bound (0..180) |
| `layMax` | number | `0` | Layline outer bound (0..180) |
| `dialRatioThresholdNormal` | number | `0.7` | Ratio below -> `high` |
| `dialRatioThresholdFlat` | number | `2.0` | Ratio above -> `flat` |
| `captionUnitScale` | number | `0.8` | Caption/unit ratio vs value |
| `disconnect` | boolean | `false` | Draw `NO DATA` overlay |

## Dial Drawing (via `GaugeToolkit.draw`)

| Element | Draw Function | Parameters |
|---|---|---|
| Ring | `draw.drawRing` | full circle |
| Layline starboard | `draw.drawAnnularSector` | `layMin..layMax`, green |
| Layline port | `draw.drawAnnularSector` | `-layMax..-layMin`, red |
| Wind pointer | `draw.drawPointerAtRim` | red long pointer at `angle` |
| Ticks | `draw.drawTicks` | `-180..180`, major 30, minor 10 |
| Labels | `draw.drawLabels` | `-180..180`, step 30, endpoints filtered |

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
| `formatAngle180(v, leadingZero)` | angle deg | `-180..180` string |
| `formatSpeed(v, unit)` | speed value | formatted speed string |

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
