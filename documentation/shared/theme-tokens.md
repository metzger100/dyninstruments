# Theme Tokens

**Status:** ✅ Implemented | ThemeModel semantic ownership + ThemeResolver strict root resolution

## Overview

Theme ownership is split into two module-shaped components:

- ThemeModel: semantic owner of token metadata, preset metadata, defaults, mode overrides, normalization, and output metadata
- ThemeResolver: strict root-only resolver that consumes ThemeModel metadata and root CSS input overrides

Both are registered with apiShape module and do not use create().

## Public Input Variables (Migrated Shared Surface/Typography)

- --dyni-fg
- --dyni-bg
- --dyni-border
- --dyni-font
- --dyni-font-weight
- --dyni-label-weight

## Materialized Output Variables

- --dyni-theme-surface-fg
- --dyni-theme-surface-bg
- --dyni-theme-surface-border
- --dyni-theme-font-family
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

There is no resolver cache and no invalidation API.

## Runtime Integration

runtime/init.js:

- reads --dyni-theme-preset once from document.documentElement
- configures runtime._theme
- runtime._theme configures ThemeResolver with ThemeModel + runtime-owned preset getter + canonical night-mode getter

runtime._theme.applyToRoot(rootEl):

- resolves canonical theme outputs
- overwrites all required output vars on every commit

## Related

- css-theming.md
- ../architecture/runtime-lifecycle.md
- ../architecture/component-system.md
