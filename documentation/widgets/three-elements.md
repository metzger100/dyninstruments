# ThreeValueTextWidget Module

**Status:** ✅ Implemented | `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`

## Overview

Default numeric renderer for clusters. Draws caption, value, and unit as responsive canvas text. Cluster-specific translation is handled by `ClusterWidget` mapper modules.

This renderer uses the shared text compaction contract from `TextLayoutEngine.computeResponsiveInsets()`:

- compact tiles use shared profile-owned insets and gap compaction
- `high` / `normal` composite fits consume shared `textFillScale` for stronger compact caption/unit fill
- `flat` mode keeps the same render contract, but now benefits from compact insets and the lowered inline minimum fit floor
- formatted value output is normalized through `PlaceholderNormalize`; missing values render as `---`

## Module Registration

```javascript
// In config/components/registry-widgets.js (assembled by config/components.js)
ThreeValueTextWidget: {
  js: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
  css: undefined,
  globalKey: "DyniThreeValueTextWidget",
  deps: [
    "ThemeResolver",
    "TextLayoutEngine",
    "PlaceholderNormalize",
    "StateScreenLabels",
    "StateScreenPrecedence",
    "StateScreenCanvasOverlay"
  ]
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
| `disconnect` | boolean | `false` | Render `disconnected` state-screen (`GPS Lost`) and suppress normal content |

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
| `TextLayoutEngine.computeModeLayout(...)` | Shared ratio mode + collapse handling |
| `TextLayoutEngine.computeResponsiveInsets(...)` | Shared compact insets + `textFillScale` |
| `TextLayoutEngine.fitThreeRowBlock(...)` | Fit `high` mode caption/value/unit rows |
| `TextLayoutEngine.fitValueUnitCaptionRows(...)` | Fit `normal` mode value+unit + caption rows |
| `TextLayoutEngine.fitInlineTriplet(...)` | Fit `flat` mode inline caption/value/unit row |
| `StateScreenPrecedence.pickFirst(...)` | Resolve `disconnected` vs `data` state |
| `StateScreenCanvasOverlay.drawStateScreen(...)` | Draw shared canvas state-screen label |

## Themeable Typography

- Theme tokens are resolved per render via `ThemeResolver.resolveForRoot(Helpers.requirePluginRoot(canvas))`.
- Primary numeric value text uses `theme.font.weight`.
- Caption and unit text uses `theme.font.labelWeight`.
- State-screen label text uses `theme.font.labelWeight`.

## Performance

- Fitting results are cached per widget instance (closure-local, not global) via `TextLayoutEngine` cache helpers.
- Cache keys include all fitting-relevant inputs: `W`, `H`, active layout mode, rendered `value` text, `caption`, `unit`, effective `secScale` (`captionUnitScale` after clamp), resolved font family, and theme font weights (`valueWeight`, `labelWeight`).
- Cache invalidates automatically when any key input changes (for example content, size, mode, scale, or typography changes).
- Shared responsive compaction does not add extra cache inputs; it is derived from `W` / `H`.
- Canvas drawing still runs every frame; only fitting/measurement work is reused on cache hits.

## Exports

```javascript
return {
  id: "ThreeValueTextWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## Phase 6 Options

- `stableDigits` (default `false`) enables `StableDigits.normalize(...)` for the primary value text.
- When enabled, value rendering switches to `theme.font.familyMono` and keeps sign-slot alignment where available.
- Placeholders are short-circuited unchanged (`---` remains `---`).

## Related

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/helpers.md](../shared/helpers.md)
- [../avnav-api/formatters.md](../avnav-api/formatters.md)
