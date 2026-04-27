# Theme Tokens

**Status:** ✅ Implemented | ThemeModel semantic ownership + ThemeResolver strict root resolution and snapshot reuse

## Overview

Theme ownership is split into two module-shaped components:

- ThemeModel: semantic owner of token metadata, preset metadata, defaults, mode overrides, normalization, and output metadata
- ThemeResolver: strict root-only resolver that consumes ThemeModel metadata and root CSS input overrides
- ThemeResolver returns immutable snapshot objects and reuses object identity for identical committed-root snapshots

Both are registered with apiShape module and do not use create().

## Exposed Semantic Token Paths

- `font.family`
- `font.familyMono`
- `font.weight`
- `font.labelWeight`
- `colors.alarmWidget.bg`
- `colors.alarmWidget.fg`
- `colors.alarmWidget.strip`

## Public Input Variables (Migrated Shared Surface/Typography)

- --dyni-fg
- --dyni-bg
- --dyni-border
- --dyni-font
- --dyni-font-mono
- --dyni-font-weight
- --dyni-label-weight
- --dyni-alarm-widget-bg
- --dyni-alarm-widget-fg
- --dyni-alarm-widget-strip

## Geometry Inputs

`GeometryScale` turns these factors into pixels from each family primary dimension. `compactGeometryScale` is text/layout-only; it does not change the graphical factors below.

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

## Alarm Widget Surface Tokens

The alarm widget reads these semantic paths through `ThemeResolver.resolveForRoot(rootEl)`. They are overrideable from `user.css`, and the active preset still supplies the fallback values when no root override is present.

| Path | Input var | Default | Night | highcontrast |
|---|---|---|---|---|
| `colors.alarmWidget.bg` | `--dyni-alarm-widget-bg` | `#e04040` | `#991111` | `#ff2200` |
| `colors.alarmWidget.fg` | `--dyni-alarm-widget-fg` | `#ffffff` | `#ffffff` | `#ffffff` |
| `colors.alarmWidget.strip` | `--dyni-alarm-widget-strip` | `#66b8ff` | `#66b8ff` | `#3399ff` |

Alarm idle accents intentionally reuse the AIS nearest-blue family so the alarm tile reads like the rest of the committed HTML widgets instead of introducing a separate strip hue.

Example `user.css` override:

```css
.widget.dyniplugin {
  --dyni-alarm-widget-bg: #cc2222;
  --dyni-alarm-widget-fg: #ffffff;
  --dyni-alarm-widget-strip: #3388ff;
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

## Presets and Modes

Supported preset families:

- default
- slim
- bold
- highcontrast

Mode axis:

- day
- night

Preset normalization:

- night is not a legal preset family; normalizePresetName maps it to default

## Resolution Order

Per token path:

1. explicit root CSS input override
2. active preset mode override
3. active preset base override
4. global mode default
5. global base default

## Strict Root Contract

ThemeResolver.resolveForRoot(rootEl) requires committed .widget.dyniplugin root and throws on invalid input.

ThemeResolver caches immutable snapshots per committed root using canonical snapshot inputs:

- mode
- normalized preset name
- committed root class string
- inline signature of ThemeModel input vars only

Resolver-owned `--dyni-theme-*` output vars are excluded from snapshot identity.

configure(...) clears resolver metadata and per-root snapshot caches.

## Runtime Integration

runtime/init.js:

- reads --dyni-theme-preset once from document.documentElement
- configures runtime._theme
- runtime._theme configures ThemeResolver with ThemeModel + runtime-owned preset getter + canonical night-mode getter
- runtime-owned preset is fallback; committed-root `--dyni-theme-preset` overrides are read per root and normalized before resolve

runtime._theme.applyToRoot(rootEl):

- resolves canonical theme outputs
- overwrites all required output vars on every commit

## Related

- css-theming.md
- ../architecture/runtime-lifecycle.md
- ../architecture/component-system.md
