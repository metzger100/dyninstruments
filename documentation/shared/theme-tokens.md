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

## Alarm Widget Surface Tokens

The alarm widget reads these semantic paths through `ThemeResolver.resolveForRoot(rootEl)`. They are overrideable from `user.css`, and the active preset still supplies the fallback values when no root override is present.

| Path | Input var | Default | Night | highcontrast |
|---|---|---|---|---|
| `colors.alarmWidget.bg` | `--dyni-alarm-widget-bg` | `#e04040` | `#991111` | `#ff2200` |
| `colors.alarmWidget.fg` | `--dyni-alarm-widget-fg` | `#ffffff` | `#ffffff` | `#ffffff` |
| `colors.alarmWidget.strip` | `--dyni-alarm-widget-strip` | `#4488cc` | `#224466` | `#3399ff` |

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
