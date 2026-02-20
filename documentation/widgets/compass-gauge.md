# CompassGaugeWidget Module

**Status:** ✅ Implemented | `widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js`

## Overview

Full-circle rotating compass card with upright cardinal labels. The dial rotates by `-heading`; the lubber pointer stays fixed at North. Optional target marker (`markerCourse`) is supported.

## Module Registration

```javascript
// In config/components.js
CompassGaugeWidget: {
  js: BASE + "widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js",
  css: BASE + "widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.css",
  globalKey: "DyniCompassGaugeWidget",
  deps: ["GaugeToolkit"]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `heading` | number | — | Heading (0..360) |
| `markerCourse` | number | — | Optional rim marker target |
| `caption` | string | `""` | Caption text |
| `unit` | string | `"°"` | Unit text |
| `leadingZero` | boolean | `true` | Zero-pad heading |
| `compRatioThresholdNormal` | number | `0.8` | Ratio below -> `high` |
| `compRatioThresholdFlat` | number | `2.2` | Ratio above -> `flat` |
| `captionUnitScale` | number | `0.8` | Caption/unit ratio vs value |
| `default` | string | `"---"` | Fallback text for invalid heading |
| `disconnect` | boolean | `false` | Draw `NO DATA` overlay |

## Compass Dial Drawing (via `GaugeToolkit.draw`)

All dial calls use `rotationDeg = -heading` so card content rotates while top pointer remains fixed.

| Element | Draw Function | Parameters |
|---|---|---|
| Ring | `draw.drawRing` | full circle |
| Ticks | `draw.drawTicks` | `0..360`, major 30, minor 10, with `rotationDeg` |
| Lubber pointer | `draw.drawPointerAtRim` | fixed at 0°, red |
| Target marker | `draw.drawRimMarker` | at `(markerCourse - heading)` if both finite |
| Labels | `draw.drawLabels` | `step=45`, `labelsMap`, `textRotation: "upright"` |

Rendering order keeps labels on top for readability.

## Layout Modes

```text
ratio = W / H
ratio < compRatioThresholdNormal -> high
ratio > compRatioThresholdFlat -> flat
otherwise -> normal
```

### Single-Value Display

`flat`: left strip with caption (top) + value/unit (bottom)

`normal`: centered 3-row block inside dial

`high`: one inline row above dial

## Internal Value Formatting

| Function | Input | Output |
|---|---|---|
| `GaugeValueMath.formatDirection360(v, leadingZero)` | heading deg | `0..359` string |

## Exports

```javascript
return {
  id: "CompassGaugeWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
