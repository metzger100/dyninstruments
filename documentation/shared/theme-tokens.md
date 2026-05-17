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

## Exposed Semantic Token Paths

- `font.family`
- `font.familyMono`
- `font.weight`
- `font.labelWeight`
- `opacity.caption`
- `opacity.unit`
- `colors.alarm`
- `colors.alarmWidget.bg`
- `colors.alarmWidget.fg`
- `colors.alarmWidget.strip`
- `colors.ais.warning`
- `colors.ais.nearest`
- `colors.ais.tracking`
- `colors.ais.normal`

## Public Input Variables (Migrated Shared Surface/Typography)

- --dyni-fg
- --dyni-bg
- --dyni-border
- --dyni-font
- --dyni-font-mono
- --dyni-font-weight
- --dyni-label-weight
- --dyni-caption-opacity
- --dyni-unit-opacity
- --dyni-alarm
- --dyni-alarm-widget-bg
- --dyni-alarm-widget-fg
- --dyni-alarm-widget-strip
- --dyni-ais-warning
- --dyni-ais-nearest
- --dyni-ais-tracking
- --dyni-ais-normal

### Surface Border Fallback Contract

- `--dyni-border` is optional.
- When `--dyni-border` is omitted, `surface.border` inherits from the fully resolved `surface.fg` token (after mode + preset resolution).
- When `--dyni-border` is provided, it overrides the inherited fallback.
- The materialized output token remains `--dyni-theme-surface-border`.

## Geometry Inputs

`GeometryScale` turns these factors into pixels from each family primary dimension. `compactGeometryScale` is text/layout-only; it does not change the graphical factors below.
`strokeWeight`, `pointerDepthWeight`, and `pointerSideWeight` also participate in adaptive minimum geometry floors through `GeometryScale.strokeFloor(strokeWeight)` and `GeometryScale.extentFloor(strokeWeight)` (derived from existing weights, no extra tokens).

| Path | Input var | Default | Use |
|---|---|---|---|
| `strokeWeight` | `--dyni-stroke-weight` | `1.0` | Shared multiplier for stroke widths |
| `pointerDepthWeight` | `--dyni-pointer-depth-weight` | `1.0` | Shared multiplier for pointer and boat depth |
| `pointerSideWeight` | `--dyni-pointer-side-weight` | `1.0` | Shared multiplier for pointer side thickness |
| `radial.ticks.majorLenFactor` | `--dyni-radial-tick-major-len-factor` | `0.08` | Radial major tick length factor |
| `radial.ticks.majorWidthFactor` | `--dyni-radial-tick-major-width-factor` | `0.02` | Radial major tick stroke-width factor |
| `radial.ticks.minorLenFactor` | `--dyni-radial-tick-minor-len-factor` | `0.047` | Radial minor tick length factor |
| `radial.ticks.minorWidthFactor` | `--dyni-radial-tick-minor-width-factor` | `0.01` | Radial minor tick stroke-width factor |
| `radial.pointer.sideFactor` | `--dyni-radial-pointer-side-factor` | `0.11` | Radial pointer side-thickness factor |
| `radial.pointer.depthFactor` | `--dyni-radial-pointer-depth-factor` | `0.22` | Radial pointer depth factor |
| `radial.ring.arcLineWidthFactor` | `--dyni-radial-arc-linewidth-factor` | `0.013` | Radial arc stroke-width factor |
| `linear.track.widthFactor` | `--dyni-linear-track-width` | `0.16` | Linear track thickness factor |
| `linear.track.lineWidthFactor` | `--dyni-linear-track-linewidth-factor` | `0.018` | Linear track stroke-width factor |
| `linear.ticks.majorLenFactor` | `--dyni-linear-tick-major-len-factor` | `0.109` | Linear major tick length factor |
| `linear.ticks.majorWidthFactor` | `--dyni-linear-tick-major-width-factor` | `0.027` | Linear major tick stroke-width factor |
| `linear.ticks.minorLenFactor` | `--dyni-linear-tick-minor-len-factor` | `0.064` | Linear minor tick length factor |
| `linear.ticks.minorWidthFactor` | `--dyni-linear-tick-minor-width-factor` | `0.014` | Linear minor tick stroke-width factor |
| `linear.pointer.sideFactor` | `--dyni-linear-pointer-side-factor` | `0.12` | Linear pointer side-thickness factor |
| `linear.pointer.depthFactor` | `--dyni-linear-pointer-depth-factor` | `0.24` | Linear pointer depth factor |

## Opacity Tokens

| Path | Input var | Default | Use |
|---|---|---|---|
| `opacity.caption` | `--dyni-caption-opacity` | `1.0` | Opacity for caption text in all widget families |
| `opacity.unit` | `--dyni-unit-opacity` | `1.0` | Opacity for unit text in all widget families |

Both tokens default to `1.0` (fully opaque). Set values between `0` and `1` in `user.css` to de-emphasize secondary labels:

```css
.widget.dyniplugin {
  --dyni-caption-opacity: 0.7;
  --dyni-unit-opacity: 0.7;
}
```

No preset or night-mode overrides are defined. These tokens are consumed by canvas widgets via the JS token snapshot (`theme.opacity.caption`, `theme.opacity.unit`) and by HTML widgets via CSS output vars (`var(--dyni-theme-opacity-caption, 1)`, `var(--dyni-theme-opacity-unit, 1)`).

## Alarm Widget Surface Tokens

The alarm widget reads these semantic paths from the resolved snapshot returned by `componentContext.theme.tokens.resolveForRoot(rootEl)`. They are overrideable from `user.css`, and the active preset still supplies the fallback values when no root override is present.

### Generic Alarm Token

- `colors.alarm` / `--dyni-alarm`
  - Default: `#FA584A`
  - Night: `rgba(250, 88, 74, 0.60)`
  - highcontrast: `#FF3300`

| Path | Input var | Default | Night | highcontrast |
|---|---|---|---|---|
| `colors.alarmWidget.bg` | `--dyni-alarm-widget-bg` | `#C73A32` | `rgba(199, 58, 50, 0.60)` | `#CC2A1F` |
| `colors.alarmWidget.fg` | `--dyni-alarm-widget-fg` | `#ffffff` | `#ffffff` | `#ffffff` |
| `colors.alarmWidget.strip` | `--dyni-alarm-widget-strip` | `#70F3AF` | `rgba(112, 243, 175, 0.60)` | `#00AA66` |

Alarm widget accents: the active alarm tile stays in the red warning family, while the idle accent strip uses the green nearest/okay family.

## AIS Target Accent Tokens

| Path | Input var | Default | Night | highcontrast |
|---|---|---|---|---|
| `colors.ais.warning` | `--dyni-ais-warning` | `#FA584A` | `rgba(250, 88, 74, 0.60)` | `#FF3300` |
| `colors.ais.nearest` | `--dyni-ais-nearest` | `#70F3AF` | `rgba(112, 243, 175, 0.60)` | `#00AA66` |
| `colors.ais.tracking` | `--dyni-ais-tracking` | `#f8a601` | `rgba(248, 166, 1, 0.60)` | `#CC6600` |
| `colors.ais.normal` | `--dyni-ais-normal` | `#EBEB55` | `rgba(235, 235, 85, 0.60)` | `#8A7300` |

Dyni follows AvNav AIS role semantics. The nearest target state is the green state typically visible in the AvNav AIS target widget, while the generic normal role remains yellow.

Example `user.css` override:

```css
.widget.dyniplugin {
  --dyni-alarm-widget-bg: #cc2222;
  --dyni-alarm-widget-fg: #ffffff;
  --dyni-alarm-widget-strip: #70F3AF;
}
```

## Materialized Output Variables

- --dyni-theme-surface-fg
- --dyni-theme-surface-bg
- --dyni-theme-surface-border
- --dyni-theme-font-family
- --dyni-theme-font-family-mono
- --dyni-theme-font-weight
- --dyni-theme-font-label-weight
- --dyni-theme-opacity-caption
- --dyni-theme-opacity-unit

## Presets and Modes

Supported preset families:

- default
- slim
- bold
- darkmode
- highcontrast

`darkmode` is the built-in high-readability black/white surface preset (`surface.bg=#000000`, `surface.fg=#ffffff`, `surface.border=#ffffff`) with tuned warning/alarm, layline, and AIS role accents for dark surfaces.

Mode axis:

- day
- night

`night` remains the dim red navigation mode and is not a preset family.

Preset normalization:

- night is not a legal preset family; `runtime.theme` maps it to default

## Resolution Order

Per token path:

1. explicit root CSS input override
2. active preset mode override
3. active preset base override
4. global mode default
5. global base default

Root input overrides (`user.css`) are higher precedence than mode defaults. If you override surface or semantic color vars on `.widget.dyniplugin`, those values also remain active while AvNav Night Mode is on unless you add explicit night selectors.

Applies to both surface vars and semantic vars, including:

- `--dyni-fg`
- `--dyni-bg`
- `--dyni-border`
- `--dyni-pointer`
- `--dyni-warning`
- `--dyni-alarm`
- `--dyni-ais-warning`
- `--dyni-ais-nearest`
- `--dyni-ais-tracking`
- `--dyni-ais-normal`

Example:

```css
.widget.dyniplugin {
  --dyni-fg: white;
  --dyni-bg: black;
  --dyni-pointer: #ff2b2b;
}

.nightMode .widget.dyniplugin {
  --dyni-fg: rgba(252, 11, 11, 0.60);
  --dyni-bg: black;
  --dyni-pointer: #cc2222;
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

configure(...) clears resolver metadata and per-root snapshot caches.

## Runtime Integration

runtime/init.js:

- reads --dyni-theme-preset once from document.documentElement
- configures `runtime.theme`
- components resolve normalized tokens through `componentContext.theme.tokens.resolveForRoot(rootEl)`
- runtime-owned preset is fallback; committed-root `--dyni-theme-preset` overrides are read per root and normalized before resolve

`runtime.theme.applyToRoot(rootEl)`:

- resolves canonical theme outputs
- overwrites all required output vars on every commit

## Related

- css-theming.md
- ../architecture/runtime-lifecycle.md
- ../architecture/component-system.md
