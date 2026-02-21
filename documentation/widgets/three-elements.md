# ThreeValueTextWidget Module

**Status:** ✅ Implemented | `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`

## Overview

Default numeric renderer for clusters. Draws caption, value, and unit as responsive canvas text. Cluster-specific translation is handled by `ClusterWidget` mapper modules.

## Module Registration

```javascript
// In config/components.js
ThreeValueTextWidget: {
  js: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
  css: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.css",
  globalKey: "DyniThreeValueTextWidget",
  deps: ["ThemeResolver", "GaugeTextLayout", "GaugeValueMath"]
}
```

Used by `ClusterWidget` as default renderer.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | any | — | Raw value (formatted via `Helpers.applyFormatter`) |
| `caption` | string | `""` | Caption text |
| `unit` | string | `""` | Unit text |
| `formatter` | string/function | — | Formatter name/function |
| `formatterParameters` | array/string | — | Formatter parameters |
| `default` | string | `"---"` | Fallback when value is null/NaN |
| `ratioThresholdNormal` | number | `1.0` | Ratio below this -> `high` |
| `ratioThresholdFlat` | number | `3.0` | Ratio above this -> `flat` |
| `captionUnitScale` | number | `0.8` | Caption/unit font ratio vs value |
| `disconnect` | boolean | `false` | Show `NO DATA` overlay |

## Layout Modes

```text
ratio = W / H
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

### Collapsing Rules

- No caption -> force `flat`
- No unit + `high` -> collapse to `normal`
- No caption + no unit -> force `flat`

### Row Layout Per Mode

**high** (`caption / value / unit`)

- top: caption (left)
- middle: value (center)
- bottom: unit (right)

**normal** (`value+unit / caption`)

- top: value + unit (inline, centered)
- bottom: caption (left)

**flat** (`caption value unit` inline)

- one centered row
- caption/unit scale from `captionUnitScale`

## Internal Functions

| Function | Purpose |
|---|---|
| `GaugeTextLayout.fitSingleTextPx(...)` | Fit one string into a box |
| `fitValueUnitRowPx(...)` | Fit value+unit pair |
| `GaugeTextLayout.drawDisconnectOverlay(...)` | Draw overlay text |
| `GaugeValueMath.clamp(...)`, `GaugeValueMath.computeMode(...)` | Shared scale/mode logic |

## Exports

```javascript
return {
  id: "ThreeValueTextWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## Related

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/helpers.md](../shared/helpers.md)
- [../avnav-api/formatters.md](../avnav-api/formatters.md)
