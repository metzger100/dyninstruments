# Theme Tokens

**Status:** ✅ Implemented | `runtime.theme` semantic ownership + `componentContext.theme.tokens.resolveForRoot(rootEl)` snapshot reuse

## Overview

Theme ownership is internal to `runtime.theme`.

- `runtime.theme` owns token metadata, preset metadata, defaults, mode overrides, normalization, and output metadata
- `componentContext.theme.tokens` is the resolver API exposed to components
- `componentContext.theme.tokens.resolveForRoot(rootEl)` returns the committed-root immutable snapshot
- snapshots are immutable and reused when the committed-root inputs are identical

Example:

```javascript
const tokens = componentContext.theme.tokens.resolveForRoot(rootEl);
const fg = tokens.surface.fg;
```

## Token Hierarchy

Theme tokens follow a two-level hierarchy:

- Tier 1 global tokens provide the base semantic defaults for surface, typography, opacity, semantic colors, and shared geometry.
- Tier 2 scoped tokens fine-tune widget-family accents and can inherit from a Tier 1 token through `defaultFrom`.

Cascade behavior:

- If a scoped token has its own explicit value (root override, preset override, or token default), that explicit value is used.
- If a scoped token has no explicit value and defines `defaultFrom`, it inherits the resolved parent token value.
- This keeps scoped tokens synchronized with shared semantic colors without duplicating defaults.

## Complete Token Hierarchy Reference

### Tier 1: Global Tokens

| Path | Input var | Type | Default | Night | Output var |
|---|---|---|---|---|---|
| `surface.fg` | `--dyni-fg` | color | `#000000` | `rgba(252, 11, 11, 0.60)` | `--dyni-theme-surface-fg` |
| `surface.bg` | `--dyni-bg` | color | `#ffffff` | `black` | `--dyni-theme-surface-bg` |
| `surface.border` | `--dyni-border` | color | *(derives from resolved `surface.fg` when unset)* | *(derives from resolved `surface.fg` when unset)* | `--dyni-theme-surface-border` |
| `font.family` | `--dyni-font` | string | default font stack | — | `--dyni-theme-font-family` |
| `font.familyMono` | `--dyni-font-mono` | string | default mono font stack | — | `--dyni-theme-font-family-mono` |
| `font.weight` | `--dyni-font-weight` | number | `700` | — | `--dyni-theme-font-weight` |
| `font.labelWeight` | `--dyni-label-weight` | number | `700` | — | `--dyni-theme-font-label-weight` |
| `opacity.caption` | `--dyni-caption-opacity` | number | `1.0` | — | `--dyni-theme-opacity-caption` |
| `opacity.unit` | `--dyni-unit-opacity` | number | `1.0` | — | `--dyni-theme-opacity-unit` |
| `colors.info` | `--dyni-info` | color | `#3366cc` | `#cc2222` | — |
| `colors.warning` | `--dyni-warning` | color | `#e0a92e` | `#8b6914` | — |
| `colors.alarm` | `--dyni-alarm` | color | `#d9534a` | `rgba(250, 88, 74, 0.60)` | — |
| `colors.ok` | `--dyni-ok` | color | `#2e9e6b` | `rgba(112, 243, 175, 0.60)` | — |
| `strokeWeight` | `--dyni-stroke-weight` | number | `1.28` | — | — |
| `pointerDepthWeight` | `--dyni-pointer-depth-weight` | number | `1.15` | — | — |
| `pointerSideWeight` | `--dyni-pointer-side-weight` | number | `2.0` | — | — |

### Tier 2: Scoped Tokens with Cascade Parent

| Path | Input var | Cascade parent (`defaultFrom`) | Output var |
|---|---|---|---|
| `colors.pointer` | `--dyni-pointer` | `colors.info` | — |
| `colors.regatta.barDefault` | `--dyni-regatta-bar-default` | `colors.info` | `--dyni-theme-regatta-bar-default` |
| `colors.ais.tracking` | `--dyni-ais-tracking` | `colors.warning` | — |
| `colors.regatta.barWarning` | `--dyni-regatta-bar-warning` | `colors.warning` | `--dyni-theme-regatta-bar-warning` |
| `colors.alarmWidget.bg` | `--dyni-alarm-widget-bg` | `colors.alarm` | — |
| `colors.laylinePort` | `--dyni-layline-port` | `colors.alarm` | — |
| `colors.ais.warning` | `--dyni-ais-warning` | `colors.alarm` | — |
| `colors.regatta.barCritical` | `--dyni-regatta-bar-critical` | `colors.alarm` | `--dyni-theme-regatta-bar-critical` |
| `colors.alarmWidget.strip` | `--dyni-alarm-widget-strip` | `colors.ok` | — |
| `colors.laylineStb` | `--dyni-layline-stb` | `colors.ok` | — |
| `colors.ais.nearest` | `--dyni-ais-nearest` | `colors.ok` | — |
| `colors.ais.normal` | `--dyni-ais-normal` | `colors.ok` | — |

### Tier 2: Scoped Tokens with Independent Defaults

| Path | Input var | Default | Night | Output var |
|---|---|---|---|---|
| `colors.alarmWidget.fg` | `--dyni-alarm-widget-fg` | `#ffffff` | `#ffffff` | — |

### Family-Scoped Geometry Tokens (Unchanged)

`GeometryScale` turns these factors into pixels from each family primary dimension. `compactGeometryScale` is text/layout-only; it does not change the graphical factors below.

| Path | Input var | Default |
|---|---|---|
| `radial.ticks.majorLenFactor` | `--dyni-radial-tick-major-len-factor` | `0.087` |
| `radial.ticks.majorWidthFactor` | `--dyni-radial-tick-major-width-factor` | `0.022` |
| `radial.ticks.minorLenFactor` | `--dyni-radial-tick-minor-len-factor` | `0.051` |
| `radial.ticks.minorWidthFactor` | `--dyni-radial-tick-minor-width-factor` | `0.011` |
| `radial.pointer.sideFactor` | `--dyni-radial-pointer-side-factor` | `0.11` |
| `radial.pointer.depthFactor` | `--dyni-radial-pointer-depth-factor` | `0.22` |
| `radial.ring.arcLineWidthFactor` | `--dyni-radial-arc-linewidth-factor` | `0.0145` |
| `radial.ring.widthFactor` | `--dyni-radial-ring-width` | `0.16` |
| `radial.labels.insetFactor` | `--dyni-radial-label-inset` | `1.8` |
| `radial.labels.fontFactor` | `--dyni-radial-label-font` | `0.14` |
| `radial.fullCircle.normal.innerMarginFactor` | `--dyni-radial-fullcircle-normal-inner-margin` | `0.03` |
| `radial.fullCircle.normal.minHeightFactor` | `--dyni-radial-fullcircle-normal-min-height` | `0.45` |
| `radial.fullCircle.normal.dualGapFactor` | `--dyni-radial-fullcircle-normal-dual-gap` | `0.05` |
| `linear.track.widthFactor` | `--dyni-linear-track-width` | `0.16` |
| `linear.track.lineWidthFactor` | `--dyni-linear-track-linewidth-factor` | `0.018` |
| `linear.ticks.majorLenFactor` | `--dyni-linear-tick-major-len-factor` | `0.109` |
| `linear.ticks.majorWidthFactor` | `--dyni-linear-tick-major-width-factor` | `0.027` |
| `linear.ticks.minorLenFactor` | `--dyni-linear-tick-minor-len-factor` | `0.064` |
| `linear.ticks.minorWidthFactor` | `--dyni-linear-tick-minor-width-factor` | `0.014` |
| `linear.pointer.sideFactor` | `--dyni-linear-pointer-side-factor` | `0.12` |
| `linear.pointer.depthFactor` | `--dyni-linear-pointer-depth-factor` | `0.24` |
| `linear.labels.insetFactor` | `--dyni-linear-label-inset` | `1.8` |
| `linear.labels.fontFactor` | `--dyni-linear-label-font` | `0.14` |

## Exposed Semantic Token Paths

- `font.family`
- `font.familyMono`
- `font.weight`
- `font.labelWeight`
- `opacity.caption`
- `opacity.unit`
- `colors.pointer`
- `colors.warning`
- `colors.alarm`
- `colors.ok`
- `colors.info`
- `colors.laylineStb`
- `colors.laylinePort`
- `colors.alarmWidget.bg`
- `colors.alarmWidget.fg`
- `colors.alarmWidget.strip`
- `colors.ais.warning`
- `colors.ais.nearest`
- `colors.ais.tracking`
- `colors.ais.normal`
- `colors.regatta.barWarning`
- `colors.regatta.barCritical`
- `colors.regatta.barDefault`

## Public Input Variables

- `--dyni-fg`
- `--dyni-bg`
- `--dyni-border`
- `--dyni-font`
- `--dyni-font-mono`
- `--dyni-font-weight`
- `--dyni-label-weight`
- `--dyni-caption-opacity`
- `--dyni-unit-opacity`
- `--dyni-pointer`
- `--dyni-warning`
- `--dyni-alarm`
- `--dyni-ok`
- `--dyni-info`
- `--dyni-alarm-widget-bg`
- `--dyni-alarm-widget-fg`
- `--dyni-alarm-widget-strip`
- `--dyni-layline-stb`
- `--dyni-layline-port`
- `--dyni-ais-warning`
- `--dyni-ais-nearest`
- `--dyni-ais-tracking`
- `--dyni-ais-normal`
- `--dyni-regatta-bar-warning`
- `--dyni-regatta-bar-critical`
- `--dyni-regatta-bar-default`
- `--dyni-stroke-weight`
- `--dyni-pointer-depth-weight`
- `--dyni-pointer-side-weight`
- radial and linear geometry variables listed above

## Naming Convention

Input variable naming follows these rules:

- Color tokens omit a `-color` suffix: `--dyni-alarm`, not `--dyni-alarm-color`.
- Numeric tokens include their unit concept or role suffix when needed: `-weight`, `-opacity`, `-factor`.
- String tokens omit type words: `--dyni-font`, not `--dyni-font-family`.
- Scoped tokens are family-prefixed: `--dyni-ais-*`, `--dyni-alarm-widget-*`, `--dyni-regatta-*`, `--dyni-radial-*`, `--dyni-linear-*`.

## Deprecated Aliases

Regatta input variables were renamed to kebab-case. Old camelCase names still resolve as deprecated aliases and log a deprecation warning when used.

| New canonical input var | Deprecated alias |
|---|---|
| `--dyni-regatta-bar-warning` | `--dyni-regatta-barWarning` |
| `--dyni-regatta-bar-critical` | `--dyni-regatta-barCritical` |
| `--dyni-regatta-bar-default` | `--dyni-regatta-barDefault` |

### Surface Border Fallback Contract

- `--dyni-border` is optional.
- When `--dyni-border` is omitted, `surface.border` inherits from the fully resolved `surface.fg` token (after mode + preset resolution).
- When `--dyni-border` is provided, it overrides the inherited fallback.
- The materialized output token remains `--dyni-theme-surface-border`.

## Materialized Output Variables

- `--dyni-theme-surface-fg`
- `--dyni-theme-surface-bg`
- `--dyni-theme-surface-border`
- `--dyni-theme-font-family`
- `--dyni-theme-font-family-mono`
- `--dyni-theme-font-weight`
- `--dyni-theme-font-label-weight`
- `--dyni-theme-opacity-caption`
- `--dyni-theme-opacity-unit`
- `--dyni-theme-regatta-bar-warning`
- `--dyni-theme-regatta-bar-critical`
- `--dyni-theme-regatta-bar-default`

## Presets and Modes

Supported preset families:

- default
- slim
- bold
- darkmode
- highcontrast

`darkmode` is the built-in high-readability black/white surface preset (`surface.bg=#000000`, `surface.fg=#ffffff`, `surface.border=#ffffff`) with saturated warning/alarm, OK, AIS, and regatta accents for dark surfaces.
`highcontrast` raises pointer, sector, OK/alarm, AIS, and regatta separation for bright daylight.

Mode axis:

- day
- night

`night` remains the dim red navigation mode and is not a preset family.

Preset normalization:

- night is not a legal preset family; `runtime.theme` maps it to default

## Resolution Order

Per token path, resolver precedence is:

1. explicit root CSS input override (canonical input var; if unset and a deprecated alias exists, the alias is checked here)
2. active preset mode override
3. active preset base override
4. token mode default (`defaultByMode[mode]`)
5. token base default (`default`)
6. parent cascade via `defaultFrom` (for scoped tokens only)

Root input overrides (`user.css`) are higher precedence than mode defaults. If you override surface or semantic color vars on `.widget.dyniplugin`, those values also remain active while AvNav Night Mode is on unless you add explicit night selectors.

Example:

```css
.widget.dyniplugin {
  --dyni-fg: white;
  --dyni-bg: black;
  --dyni-info: #3366cc;
}

.nightMode .widget.dyniplugin {
  --dyni-fg: rgba(252, 11, 11, 0.60);
  --dyni-bg: black;
  --dyni-info: #cc2222;
}
```

## Strict Root Contract

`componentContext.dom.requirePluginRoot(rootEl)` requires a committed `.widget.dyniplugin` root and throws on invalid input.

`runtime.theme` caches immutable snapshots per committed root using canonical snapshot inputs:

- mode
- normalized preset name
- committed root class string
- inline signature of `runtime.theme` input vars only

Resolver-owned `--dyni-theme-*` output vars are excluded from snapshot identity.

`configure(...)` clears resolver metadata and per-root snapshot caches.

## Runtime Integration

`runtime/init.js`:

- reads `--dyni-theme-preset` once from `document.documentElement`
- configures `runtime.theme`
- components resolve normalized tokens through `componentContext.theme.tokens.resolveForRoot(rootEl)`
- runtime-owned preset is fallback; committed-root `--dyni-theme-preset` overrides are read per root and normalized before resolve

`runtime.theme.applyToRoot(rootEl)`:

- resolves canonical theme outputs
- overwrites all required output vars on every commit

## Related

- css-theming.md
- color-system.md
- ../architecture/runtime-lifecycle.md
- ../architecture/component-system.md
