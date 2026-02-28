# PositionCoordinateWidget Module

**Status:** ✅ Implemented | `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`

## Overview

Primary stacked-text renderer used for nav positions and vessel time/date two-line variants. It keeps flat layouts in single-line format and renders two stacked lines in normal/high layouts.

## Key Details

- Registered as `PositionCoordinateWidget` in `config/components.js`
- Routed from `NavMapper` for `kind: "positionBoat"` and `kind: "positionWp"`
- Routed from vessel wrapper renderers `DateTimeWidget` and `TimeStatusWidget` (mapper stays thin while wrappers inject vessel-specific formatter logic)
- Depends on shared utilities: `ThemeResolver` + `TextLayoutEngine`
- No widget-to-widget dependency on `ThreeValueTextWidget`
- `flat` mode renders one-line `caption/value/unit` directly in this widget
- `normal`/`high` modes render stacked coordinates:
- Header row: caption (left), unit (right)
- Body row 1: latitude
- Body row 2: longitude
- Typography is theme-driven per render: coordinate/value text uses `theme.font.weight`, header caption/unit and disconnect overlay use `theme.font.labelWeight`
- Uses layout editables: `ratioThresholdNormal`, `ratioThresholdFlat`, `captionUnitScale`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `{lat, lon}` or `[lon, lat]` | — | Raw pair source (`lon` = row 2 value, `lat` = row 1 value) |
| `caption` | string | `""` | Header caption (left) |
| `unit` | string | `""` | Header unit (right) |
| `default` | string | `"---"` | Fallback when coordinates invalid |
| `ratioThresholdNormal` | number | `1.0` | `ratio < threshold -> high` |
| `ratioThresholdFlat` | number | `3.0` | `ratio > threshold -> flat` |
| `captionUnitScale` | number | `0.8` | Header scale relative to coordinate lines |
| `disconnect` | boolean | `false` | Draws `NO DATA` overlay |
| `coordinateFormatter` | string/function | `"formatLonLatsDecimal"` | Stacked-mode coordinate formatter (`lat`/`lon` axis passed as extra parameter) |
| `coordinateFormatterParameters` | array/string | `[]` | Base params for stacked-mode formatter before appending axis |
| `coordinateFormatterLat` | string/function | — | Optional axis override for top line formatter |
| `coordinateFormatterLon` | string/function | — | Optional axis override for bottom line formatter |
| `coordinateFormatterParametersLat` | array/string | — | Optional axis override params for top formatter |
| `coordinateFormatterParametersLon` | array/string | — | Optional axis override params for bottom formatter |
| `coordinateFlatFromAxes` | boolean | `false` | In flat mode, render value by joining top-axis and bottom-axis formatter outputs |

## Coordinate Formatting

- `flat` mode uses `Helpers.applyFormatter(value, props)` (normally `formatLonLats`)
- When `coordinateFlatFromAxes` is true, flat mode formats both axes (`lat` + `lon`) and joins them into one line
- For vessel `timeStatus`, emoji status markers (`🟢`/`🔴`) use an extra vertical fit guard in flat and stacked layouts to prevent border clipping
- `normal`/`high` modes use `Helpers.applyFormatter(value, { formatter: coordinateFormatter, formatterParameters: [...coordinateFormatterParameters, axis] })`
- Axis mapping is fixed: `lat` -> first (top) line, `lon` -> second (bottom) line
- Axis-specific formatter overrides use `coordinateFormatterLat` / `coordinateFormatterLon` (and corresponding parameter overrides) before generic `coordinateFormatter`
- If formatter is unavailable/fails, renders `default` fallback text
- Invalid/missing coordinates render `default` fallback text
- Fit/layout caching is widget-local and keyed by text, dimensions, mode, typography, and layout scale via `TextLayoutEngine`.

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
