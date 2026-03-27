# MapZoom HTML Renderer

**Status:** ✅ Implemented | `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`

## Overview

`zoom` is a native HTML kind (`surface: "html"`) in the map cluster.

Route tuple:

- `cluster: "map"`
- `kind: "zoom"`
- `renderer: "MapZoomTextHtmlWidget"`

Ownership split:

- `MapMapper` maps zoom payload (`zoom`, `requiredZoom`, caption/unit defaults)
- `MapZoomTextHtmlWidget` renders escaped HTML and named handler contract
- `MapZoomHtmlFit` owns per-element caption/value/unit/required text fitting
- `HtmlWidgetUtils` owns shared HTML utility helpers (`escapeHtml`, style attrs, shell/ratio helpers)
- `HtmlSurfaceController` owns named-handler lifecycle
- `TemporaryHostActionBridge` owns page-aware `hostActions.map.checkAutoZoom()` dispatch capability

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `zoom` | number | — | Current map zoom value |
| `requiredZoom` | number | — | Optional target zoom shown in parentheses when different |
| `caption` | string | `"ZOOM"` | Zoom caption |
| `unit` | string | `""` | Unit suffix |
| `ratioThresholdNormal` | number | `1.0` | Ratio below this -> `high` |
| `ratioThresholdFlat` | number | `3.0` | Ratio above this -> `flat` |
| `captionUnitScale` | number | `0.8` | Caption/unit scale ratio vs value text |
| `default` | string | `"---"` | Placeholder for missing/invalid zoom values |
| `editing` | boolean | `false` | Forces passive click ownership in editor mode |
| `dyniLayoutEditing` | boolean | `false` | Dyninstruments runtime fallback for layout edit mode when AvNav strips `editing` from render props |

## Visual Contract

### CSS State Classes

| Class | Source | Meaning |
|---|---|---|
| `dyni-map-zoom-html` | renderer wrapper | Base widget block |
| `dyni-map-zoom-mode-high` | `resolveMode` | Tall mode |
| `dyni-map-zoom-mode-normal` | `resolveMode` | Balanced mode |
| `dyni-map-zoom-mode-flat` | `resolveMode` | Wide mode |
| `dyni-map-zoom-open-dispatch` | capability + non-editing | Active click capture/open dispatch |
| `dyni-map-zoom-open-passive` | fallback state | No click capture; host keeps click ownership |
| `dyni-map-zoom-has-required` | `requiredZoom` differs from `zoom` | Renders required zoom row |

### Element Class Contract

| Selector | Purpose |
|---|---|
| `.dyni-map-zoom-main` | Main text block wrapper |
| `.dyni-map-zoom-main-flat` | Flat-mode row container |
| `.dyni-map-zoom-main-normal` | Normal-mode row container |
| `.dyni-map-zoom-main-high` | High-mode row container |
| `.dyni-map-zoom-inline-row` | Flat-mode inline row (`caption value unit`) |
| `.dyni-map-zoom-value-row` | Value-focused row (`value` + optional `unit`) |
| `.dyni-map-zoom-caption-row` | Caption row |
| `.dyni-map-zoom-unit-row` | High-mode unit row |
| `.dyni-map-zoom-caption` | Caption text |
| `.dyni-map-zoom-value` | Primary zoom value |
| `.dyni-map-zoom-unit` | Unit text |
| `.dyni-map-zoom-required` | Optional required zoom row (`(value)`) |
| `.dyni-map-zoom-open-hotspot` | Full-surface click overlay (`onclick="mapZoomCheckAutoZoom"`) |

Text-fit behavior:

- value and required rows receive independent inline `font-size` styles
- `MapZoomHtmlFit` uses the shared `TextLayoutEngine` fit path (same scale-coupled semantics as canvas SOG)
- caption/unit sizing follows `captionUnitScale` with adaptive value/caption tradeoff so text fills available space for maximum readability
- fit is recomputed from shell size, mode, and text lengths on render/resize-signature updates

### Layering and Click Ownership

| Layer | Selector | z-index | Contract |
|---|---|---|---|
| Base content | `.dyni-map-zoom-main`, `.dyni-map-zoom-required` | `1` | Visible zoom text |
| Interaction overlay | `.dyni-map-zoom-open-hotspot` | `2` | Full-widget dispatch target |

Dispatch mode (`dyni-map-zoom-open-dispatch`):

- wrapper adds `onclick="catchAll"`
- hotspot exists and uses `onclick="mapZoomCheckAutoZoom"`

Passive mode (`dyni-map-zoom-open-passive`) and editing mode:

- no `catchAll` wrapper attribute
- no hotspot element
- no click dispatch from renderer

## Layout Modes

Mode selection uses measured shell ratio:

```text
ratio = shellWidth / shellHeight
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

If shell size is unavailable/invalid, renderer falls back to `normal`.

Collapse rules (ThreeValue-aligned):

- no caption -> force `flat`
- `high` + no unit -> collapse to `normal`

Mode matrix:

| Mode | Row contract |
|---|---|
| `flat` | one centered inline row (`caption value unit`) |
| `normal` | top row `value + unit`, bottom row caption |
| `high` | top caption, middle value, bottom unit |

Navpage vertical guard:

- selector: `#navpage .widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-map-zoom-html`
- contract: `height: auto`, `aspect-ratio: 2 / 1`, `min-height: 4.8em`
- purpose: prevent map zoom tile shrink in vertical navpage stacks

## Formatting and Fail-Closed Contract

Formatting:

- `zoom` -> `formatDecimalOpt(zoom, 2, 1)`
- `requiredZoom` -> `formatDecimalOpt(requiredZoom, 2, 1)`

Display rule:

- required zoom row is rendered only when `requiredZoom` is finite and different from `zoom`
- required text is rendered as `(<formattedRequiredZoom>)`

Fail-closed behavior:

- `props.default` is required; missing default throws
- all text output is escaped (`&`, `<`, `>`, `"`, `'`)
- fit path is fail-safe; when measurement context is unavailable, CSS defaults still render valid markup

## Resize Signature Contract

`resizeSignature(props)` includes:

- caption length
- zoom text length
- unit length
- required text length
- mode
- caption/unit scale
- required-row flag (`0/1`)
- dispatch-capability flag (`0/1`)
- rounded shell width/height

## Visual Regression Checklist

Source tests: `tests/cluster/rendering/MapZoomTextHtmlWidget.test.js`.

- [ ] Dispatch mode renders `catchAll`, hotspot, and `mapZoomCheckAutoZoom`
- [ ] Passive/editing modes remove capture/hotspot wiring
- [ ] `high`/`normal`/`flat` classes switch by shell ratio + collapse rules
- [ ] `flat` uses inline row; `normal` uses value-row + caption-row; `high` uses caption/value/unit rows
- [ ] caption and value downscale independently when shell space is reduced
- [ ] flat-mode caption/unit follow configured `captionUnitScale` as scale-coupled secondary text sizing
- [ ] changing `captionUnitScale` increases/decreases secondary text with corresponding value-size tradeoff
- [ ] navpage vertical stacks preserve map zoom tile size via `aspect-ratio` + `min-height` guard
- [ ] Required zoom row renders only when zoom values differ
- [ ] Escaped output prevents raw markup injection
- [ ] Missing `default` throws fail-closed error

## Related

- [active-route.md](active-route.md)
- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/plugin-lifecycle.md](../avnav-api/plugin-lifecycle.md)
