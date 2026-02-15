# PositionCoordinateWidget Module

**Status:** ✅ Implemented | `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`

## Overview

Specialized nav renderer for `positionBoat` and `positionWp`. It keeps flat layouts in single-line format and stacks latitude/longitude in normal/high layouts.

## Key Details

- Registered as `PositionCoordinateWidget` in `config/components.js`
- Routed from `NavMapper` for:
- `kind: "positionBoat"`
- `kind: "positionWp"`
- Flat mode delegates to `ThreeValueTextWidget` (preserves one-line `formatLonLats`)
- Normal/high modes draw:
- Header row: caption (left), unit (right)
- Body row 1: latitude
- Body row 2: longitude
- Uses existing text layout editables:
- `ratioThresholdNormal`
- `ratioThresholdFlat`
- `captionUnitScale`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `{lat, lon}` or `[lon, lat]` | — | Raw position source |
| `caption` | string | `""` | Header caption (left) |
| `unit` | string | `""` | Header unit (right) |
| `default` | string | `"---"` | Fallback when coordinates invalid |
| `ratioThresholdNormal` | number | `1.0` | `ratio < threshold -> high` |
| `ratioThresholdFlat` | number | `3.0` | `ratio > threshold -> flat` |
| `captionUnitScale` | number | `0.8` | Header scale relative to coordinate lines |
| `disconnect` | boolean | `false` | Draws `NO DATA` overlay |

## Coordinate Formatting

- Uses `avnav.api.formatter.formatLonLatsDecimal(value, axis)`
- If formatter is unavailable/fails, renders `default` on both lines
- Invalid/missing coordinates render `default` on both lines

## Exports

```javascript
return {
  id: "PositionCoordinateWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction
};
```

## Related

- [three-elements.md](three-elements.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../architecture/component-system.md](../architecture/component-system.md)
