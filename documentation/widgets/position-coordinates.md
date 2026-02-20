# PositionCoordinateWidget Module

**Status:** ✅ Implemented | `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`

## Overview

Specialized nav renderer for `positionBoat` and `positionWp`. It keeps flat layouts in single-line format and stacks latitude/longitude in normal/high layouts.

## Key Details

- Registered as `PositionCoordinateWidget` in `config/components.js`
- Routed from `NavMapper` for `kind: "positionBoat"` and `kind: "positionWp"`
- Depends on shared utilities: `GaugeTextLayout` + `GaugeValueMath`
- No widget-to-widget dependency on `ThreeValueTextWidget`
- `flat` mode renders one-line `caption/value/unit` directly in this widget
- `normal`/`high` modes render stacked coordinates:
- Header row: caption (left), unit (right)
- Body row 1: latitude
- Body row 2: longitude
- Uses layout editables: `ratioThresholdNormal`, `ratioThresholdFlat`, `captionUnitScale`

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

- `flat` mode uses `Helpers.applyFormatter(value, props)` (normally `formatLonLats`)
- `normal`/`high` modes use `avnav.api.formatter.formatLonLatsDecimal(value, axis)` for per-line lat/lon text
- If formatter is unavailable/fails, renders `default` fallback text
- Invalid/missing coordinates render `default` fallback text

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
